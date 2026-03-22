// Backend/controllers/filterTags.controller.js
const client = require('../db');
const { invalidateCache } = require('../utils/cache');

/**
 * GET /api/admin/filters/:filterId/tags
 * 
 * Obter todos os tags de um filtro
 */
exports.getTagsForFilter = async (req, res) => {
  try {
    const { filterId } = req.params;

    const result = await client.query(`
      SELECT *
      FROM filter_tags
      WHERE filter_id = $1
      ORDER BY display_order
    `, [filterId]);

    res.json(result.rows);

  } catch (err) {
    console.error('Erro ao obter tags:', err);
    res.status(500).json({ error: 'Erro ao obter tags' });
  }
};

/**
 * POST /api/admin/filters/:filterId/tags
 * 
 * Criar novo tag
 */
exports.createTag = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { tag_name, tag_key } = req.body;
    const userId = req.user?.id;

    if (!tag_name) {
      return res.status(400).json({ error: 'tag_name é obrigatório' });
    }

    // Gerar tag_key automaticamente se não fornecido
    const autoKey = tag_key || tag_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    // Buscar filter para saber category_id
    const filterData = await client.query(
      'SELECT primary_category_id FROM category_filters WHERE id = $1',
      [filterId]
    );

    if (!filterData.rows.length) {
      return res.status(404).json({ error: 'Filtro não encontrado' });
    }

    const categoryId = filterData.rows[0].primary_category_id;

    // Iniciar transação
    await client.query('BEGIN');

    try {
      // Obter próxima ordem
      const orderResult = await client.query(
        'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM filter_tags WHERE filter_id = $1',
        [filterId]
      );
      const nextOrder = orderResult.rows[0].next_order;

      // Inserir tag
      const result = await client.query(`
        INSERT INTO filter_tags (filter_id, tag_key, tag_name, display_order)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [filterId, autoKey, tag_name, nextOrder]);

      const tag = result.rows[0];

      // Audit log
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['create', 'tag', tag.id, userId, JSON.stringify({ tag_name, tag_key: autoKey })]);

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${categoryId}`);

      res.status(201).json(tag);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao criar tag:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar tag' });
  }
};

/**
 * PUT /api/admin/tags/:tagId
 * 
 * Atualizar tag
 */
exports.updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { tag_name, is_active, display_order } = req.body;
    const userId = req.user?.id;

    const oldData = await client.query(
      'SELECT * FROM filter_tags WHERE id = $1',
      [tagId]
    );

    if (!oldData.rows.length) {
      return res.status(404).json({ error: 'Tag não encontrado' });
    }

    const old = oldData.rows[0];

    // Buscar category para cache invalidation
    const categoryData = await client.query(
      'SELECT primary_category_id FROM category_filters WHERE id = $1',
      [old.filter_id]
    );

    const categoryId = categoryData.rows[0].primary_category_id;

    // Atualizar
    const result = await client.query(`
      UPDATE filter_tags
      SET 
        tag_name = COALESCE($1, tag_name),
        is_active = COALESCE($2, is_active),
        display_order = COALESCE($3, display_order),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [tag_name, is_active, display_order, tagId]);

    const updated = result.rows[0];

    // Audit
    const changes = {};
    if (tag_name && old.tag_name !== tag_name) changes.tag_name = { old: old.tag_name, new: tag_name };
    if (is_active !== undefined && old.is_active !== is_active) changes.is_active = { old: old.is_active, new: is_active };

    if (Object.keys(changes).length > 0) {
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['update', 'tag', tagId, userId, JSON.stringify(changes)]);
    }

    // Invalidar cache
    await invalidateCache(`filters:${categoryId}`);

    res.json(updated);

  } catch (err) {
    console.error('Erro ao atualizar tag:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar tag' });
  }
};

/**
 * DELETE /api/admin/tags/:tagId
 * 
 * Deletar tag (remove produto_filter_tags relacionados)
 */
exports.deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const userId = req.user?.id;

    const tagData = await client.query(
      'SELECT * FROM filter_tags WHERE id = $1',
      [tagId]
    );

    if (!tagData.rows.length) {
      return res.status(404).json({ error: 'Tag não encontrado' });
    }

    const tag = tagData.rows[0];

    // Buscar category
    const categoryData = await client.query(
      'SELECT primary_category_id FROM category_filters WHERE id = $1',
      [tag.filter_id]
    );

    const categoryId = categoryData.rows[0].primary_category_id;

    // Transação
    await client.query('BEGIN');

    try {
      // Deletar (cascade automático)
      await client.query('DELETE FROM filter_tags WHERE id = $1', [tagId]);

      // Audit
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['delete', 'tag', tagId, userId, JSON.stringify(tag)]);

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${categoryId}`);

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao deletar tag:', err);
    res.status(500).json({ error: err.message || 'Erro ao deletar tag' });
  }
};

/**
 * PUT /api/admin/filters/:filterId/tags/reorder
 * 
 * Reordenar tags dentro de um filtro
 */
exports.reorderTags = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { order } = req.body; // Array: [2001, 2003, 2002]

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order deve ser um array de IDs' });
    }

    // Buscar category
    const categoryData = await client.query(
      'SELECT primary_category_id FROM category_filters WHERE id = $1',
      [filterId]
    );

    if (!categoryData.rows.length) {
      return res.status(404).json({ error: 'Filtro não encontrado' });
    }

    const categoryId = categoryData.rows[0].primary_category_id;

    // Atualizar
    await client.query('BEGIN');

    try {
      for (let i = 0; i < order.length; i++) {
        await client.query(
          'UPDATE filter_tags SET display_order = $1 WHERE id = $2 AND filter_id = $3',
          [i, order[i], filterId]
        );
      }

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${categoryId}`);

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao reordenar tags:', err);
    res.status(500).json({ error: err.message || 'Erro ao reordenar tags' });
  }
};

/**
 * PUT /api/admin/categories/:categoryId/tags/update-counts
 * 
 * Atualizar product_count para todos os tags da categoria
 * (Normalmente cron job ou ao adicionar/remover produtos)
 */
exports.updateProductCounts = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Atualizar todos os tags da categoria
    await client.query(`
      UPDATE filter_tags ft
      SET product_count = (
        SELECT COUNT(DISTINCT pft.product_id)
        FROM product_filter_tags pft
        WHERE pft.filter_tag_id = ft.id
      )
      WHERE ft.filter_id IN (
        SELECT id FROM category_filters WHERE primary_category_id = $1
      )
    `, [categoryId]);

    res.json({ success: true });

  } catch (err) {
    console.error('Erro ao atualizar product counts:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar product counts' });
  }
};