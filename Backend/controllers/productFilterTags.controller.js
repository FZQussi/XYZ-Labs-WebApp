// Backend/controllers/productFilterTags.controller.js
const client = require('../db');
const { invalidateCache } = require('../utils/cache');

/**
 * GET /api/products/:productId/filter-tags
 * 
 * Obter tags de um produto
 */
exports.getProductFilterTags = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await client.query(`
      SELECT 
        pft.id,
        ft.id as tag_id,
        ft.tag_name,
        cf.filter_key,
        cf.filter_name,
        cf.id as filter_id
      FROM product_filter_tags pft
      JOIN filter_tags ft ON ft.id = pft.filter_tag_id
      JOIN category_filters cf ON cf.id = ft.filter_id
      WHERE pft.product_id = $1
      ORDER BY cf.display_order, ft.display_order
    `, [productId]);

    res.json(result.rows);

  } catch (err) {
    console.error('Erro ao obter filter tags do produto:', err);
    res.status(500).json({ error: 'Erro ao obter filter tags' });
  }
};

/**
 * POST /api/products/:productId/filter-tags
 * 
 * Adicionar tag a um produto
 */
exports.addTagToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { filter_tag_id } = req.body;
    const userId = req.user?.id;

    if (!filter_tag_id) {
      return res.status(400).json({ error: 'filter_tag_id é obrigatório' });
    }

    // Verificar se produto existe
    const productCheck = await client.query(
      'SELECT primary_category_id FROM products WHERE id = $1',
      [productId]
    );

    if (!productCheck.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const categoryId = productCheck.rows[0].primary_category_id;

    // Verificar se tag existe
    const tagCheck = await client.query(
      'SELECT * FROM filter_tags WHERE id = $1',
      [filter_tag_id]
    );

    if (!tagCheck.rows.length) {
      return res.status(404).json({ error: 'Tag não encontrado' });
    }

    // Transação
    await client.query('BEGIN');

    try {
      // Inserir
      const result = await client.query(`
        INSERT INTO product_filter_tags (product_id, filter_tag_id)
        VALUES ($1, $2)
        RETURNING *
      `, [productId, filter_tag_id]);

      // Audit
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['create', 'product_filter_tag', result.rows[0].id, userId, JSON.stringify({
        product_id: productId,
        filter_tag_id
      })]);

      // Atualizar product_count do tag
      await client.query(
        'UPDATE filter_tags SET product_count = product_count + 1 WHERE id = $1',
        [filter_tag_id]
      );

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${categoryId}`);

      res.status(201).json(result.rows[0]);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao adicionar tag ao produto:', err);
    res.status(500).json({ error: err.message || 'Erro ao adicionar tag' });
  }
};

/**
 * DELETE /api/products/:productId/filter-tags/:tagId
 * 
 * Remover tag de um produto
 */
exports.removeTagFromProduct = async (req, res) => {
  try {
    const { productId, tagId } = req.params;
    const userId = req.user?.id;

    // Buscar relação
    const linkData = await client.query(
      'SELECT * FROM product_filter_tags WHERE product_id = $1 AND filter_tag_id = $2',
      [productId, tagId]
    );

    if (!linkData.rows.length) {
      return res.status(404).json({ error: 'Relação não encontrada' });
    }

    // Buscar category do tag para cache
    const tagData = await client.query(
      'SELECT cf.primary_category_id FROM filter_tags ft JOIN category_filters cf ON cf.id = ft.filter_id WHERE ft.id = $1',
      [tagId]
    );

    const categoryId = tagData.rows[0].primary_category_id;

    // Transação
    await client.query('BEGIN');

    try {
      // Deletar
      await client.query(
        'DELETE FROM product_filter_tags WHERE product_id = $1 AND filter_tag_id = $2',
        [productId, tagId]
      );

      // Audit
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['delete', 'product_filter_tag', linkData.rows[0].id, userId, JSON.stringify({
        product_id: productId,
        filter_tag_id: tagId
      })]);

      // Atualizar product_count
      await client.query(
        'UPDATE filter_tags SET product_count = CASE WHEN product_count > 0 THEN product_count - 1 ELSE 0 END WHERE id = $1',
        [tagId]
      );

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${categoryId}`);

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao remover tag do produto:', err);
    res.status(500).json({ error: err.message || 'Erro ao remover tag' });
  }
};

/**
 * PUT /api/products/:productId/filter-tags
 * 
 * Substituir TODOS os tags de um produto (para edição em massa)
 */
exports.replaceProductFilterTags = async (req, res) => {
  try {
    const { productId } = req.params;
    const { filter_tags } = req.body; // Array: [2001, 3001]
    const userId = req.user?.id;

    if (!Array.isArray(filter_tags)) {
      return res.status(400).json({ error: 'filter_tags deve ser um array' });
    }

    // Buscar produto
    const productData = await client.query(
      'SELECT primary_category_id FROM products WHERE id = $1',
      [productId]
    );

    if (!productData.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const categoryId = productData.rows[0].primary_category_id;

    // Transação
    await client.query('BEGIN');

    try {
      // Obter tags atuais
      const currentTags = await client.query(
        'SELECT filter_tag_id FROM product_filter_tags WHERE product_id = $1',
        [productId]
      );

      const currentTagIds = currentTags.rows.map(r => r.filter_tag_id);

      // Remover tags que não estão mais
      const toRemove = currentTagIds.filter(id => !filter_tags.includes(id));
      for (const tagId of toRemove) {
        await client.query(
          'UPDATE filter_tags SET product_count = CASE WHEN product_count > 0 THEN product_count - 1 ELSE 0 END WHERE id = $1',
          [tagId]
        );
      }

      // Adicionar novos tags
      const toAdd = filter_tags.filter(id => !currentTagIds.includes(id));
      for (const tagId of toAdd) {
        await client.query(
          'INSERT INTO product_filter_tags (product_id, filter_tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [productId, tagId]
        );
        await client.query(
          'UPDATE filter_tags SET product_count = product_count + 1 WHERE id = $1',
          [tagId]
        );
      }

      // Deletar todos e inserir novos (mais simples)
      await client.query('DELETE FROM product_filter_tags WHERE product_id = $1', [productId]);
      
      for (const tagId of filter_tags) {
        await client.query(
          'INSERT INTO product_filter_tags (product_id, filter_tag_id) VALUES ($1, $2)',
          [productId, tagId]
        );
      }

      // Audit
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['update', 'product_filter_tags', productId, userId, JSON.stringify({
        old_tags: currentTagIds,
        new_tags: filter_tags
      })]);

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${categoryId}`);

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao substituir filter tags:', err);
    res.status(500).json({ error: err.message || 'Erro ao substituir filter tags' });
  }
};