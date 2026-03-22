// Backend/controllers/categoryFilters.controller.js
const client = require('../db');
const { invalidateCache } = require('../utils/cache');

/**
 * GET /api/v1/categories/:primaryCategoryId/filters
 * 
 * Retorna todos os filtros de uma categoria primária com todos os tags
 * Usado pela API pública (dropdown, etc)
 * 
 * Response:
 * {
 *   categoryId: 13,
 *   categoryName: "Automóvel",
 *   filters: [
 *     {
 *       id: 1001,
 *       filter_key: "brand",
 *       filter_name: "Marca",
 *       filter_type: "multi-select",
 *       tags: [...]
 *     }
 *   ]
 * }
 */
exports.getFiltersForCategory = async (req, res) => {
  try {
    const { primaryCategoryId } = req.params;
    const lang = req.query.lang || 'pt';

    // Buscar categoria
    const catResult = await client.query(
      'SELECT id, name FROM primary_categories WHERE id = $1',
      [primaryCategoryId]
    );

    if (!catResult.rows.length) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const category = catResult.rows[0];

    // Buscar filtros com tags (query otimizada com json_agg)
    const filtersResult = await client.query(`
      SELECT 
        cf.id,
        cf.filter_key,
        cf.filter_name,
        cf.filter_type,
        cf.display_order,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ft.id,
              'name', ft.tag_name,
              'key', ft.tag_key,
              'count', ft.product_count,
              'active', ft.is_active
            ) ORDER BY ft.display_order
          ) FILTER (WHERE ft.id IS NOT NULL),
          '[]'::json
        ) as tags
      FROM category_filters cf
      LEFT JOIN filter_tags ft ON ft.filter_id = cf.id AND ft.is_active = true
      WHERE cf.primary_category_id = $1
        AND cf.is_active = true
      GROUP BY cf.id, cf.filter_key, cf.filter_name, cf.filter_type, cf.display_order
      ORDER BY cf.display_order
    `, [primaryCategoryId]);

    // Cache headers (1 hora)
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.set('ETag', `"filters-${primaryCategoryId}-${lang}"`);

    res.json({
      categoryId: category.id,
      categoryName: category.name,
      filters: filtersResult.rows,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Erro ao obter filtros:', err);
    res.status(500).json({ error: 'Erro ao obter filtros' });
  }
};

/**
 * GET /api/admin/categories/:primaryCategoryId/filters
 * 
 * Retorna filtros COM TRANSLATIONS para edição no dashboard
 */
exports.getFiltersForCategoryAdmin = async (req, res) => {
  try {
    const { primaryCategoryId } = req.params;

    const result = await client.query(`
      SELECT 
        cf.id,
        cf.primary_category_id,
        cf.filter_key,
        cf.filter_name,
        cf.filter_type,
        cf.display_order,
        cf.is_active,
        cf.description,
        cf.help_text,
        cf.created_at,
        cf.updated_at,
        (
          SELECT json_agg(
            json_build_object(
              'id', ft.id,
              'tag_key', ft.tag_key,
              'tag_name', ft.tag_name,
              'display_order', ft.display_order,
              'is_active', ft.is_active,
              'product_count', ft.product_count,
              'created_at', ft.created_at
            ) ORDER BY ft.display_order
          )
          FROM filter_tags ft
          WHERE ft.filter_id = cf.id
        ) as tags,
        (
          SELECT json_object_agg(
            language_code,
            translated_name
          )
          FROM filter_translations ft
          WHERE ft.filter_id = cf.id
        ) as translations
      FROM category_filters cf
      WHERE cf.primary_category_id = $1
      ORDER BY cf.display_order
    `, [primaryCategoryId]);

    res.json(result.rows);

  } catch (err) {
    console.error('Erro ao obter filtros (admin):', err);
    res.status(500).json({ error: 'Erro ao obter filtros' });
  }
};

/**
 * POST /api/admin/categories/:primaryCategoryId/filters
 * 
 * Criar novo filtro
 */
exports.createFilter = async (req, res) => {
  try {
    const { primaryCategoryId } = req.params;
    const { filter_key, filter_name, filter_type, display_order, description } = req.body;
    const userId = req.user?.id; // Do middleware de auth

    // Validações
    if (!filter_key || !filter_name) {
      return res.status(400).json({ error: 'filter_key e filter_name são obrigatórios' });
    }

    if (!/^[a-z0-9_]+$/.test(filter_key)) {
      return res.status(400).json({ error: 'filter_key pode conter apenas lowercase, números e underscore' });
    }

    // Começar transação
    await client.query('BEGIN');

    try {
      // Inserir filtro
      const result = await client.query(`
        INSERT INTO category_filters 
          (primary_category_id, filter_key, filter_name, filter_type, display_order, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [primaryCategoryId, filter_key, filter_name, filter_type || 'multi-select', display_order || 0, description, userId]);

      const filter = result.rows[0];

      // Audit log
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'create',
        'filter',
        filter.id,
        userId,
        JSON.stringify({ filter_key, filter_name, filter_type })
      ]);

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${primaryCategoryId}`);

      res.status(201).json(filter);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao criar filtro:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar filtro' });
  }
};

/**
 * PUT /api/admin/filters/:filterId
 * 
 * Atualizar filtro
 */
exports.updateFilter = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { filter_name, filter_type, display_order, is_active, description } = req.body;
    const userId = req.user?.id;

    // Buscar dados antigos para audit
    const oldData = await client.query(
      'SELECT * FROM category_filters WHERE id = $1',
      [filterId]
    );

    if (!oldData.rows.length) {
      return res.status(404).json({ error: 'Filtro não encontrado' });
    }

    const old = oldData.rows[0];

    // Iniciar transação
    await client.query('BEGIN');

    try {
      // Atualizar
      const result = await client.query(`
        UPDATE category_filters
        SET 
          filter_name = COALESCE($1, filter_name),
          filter_type = COALESCE($2, filter_type),
          display_order = COALESCE($3, display_order),
          is_active = COALESCE($4, is_active),
          description = COALESCE($5, description),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `, [filter_name, filter_type, display_order, is_active, description, filterId]);

      const updated = result.rows[0];

      // Registrar mudanças para audit
      const changes = {};
      if (filter_name && old.filter_name !== filter_name) changes.filter_name = { old: old.filter_name, new: filter_name };
      if (filter_type && old.filter_type !== filter_type) changes.filter_type = { old: old.filter_type, new: filter_type };
      if (display_order !== undefined && old.display_order !== display_order) changes.display_order = { old: old.display_order, new: display_order };
      if (is_active !== undefined && old.is_active !== is_active) changes.is_active = { old: old.is_active, new: is_active };
      if (description !== undefined && old.description !== description) changes.description = { old: old.description, new: description };

      // Audit log
      if (Object.keys(changes).length > 0) {
        await client.query(`
          INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
          VALUES ($1, $2, $3, $4, $5)
        `, ['update', 'filter', filterId, userId, JSON.stringify(changes)]);
      }

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${old.primary_category_id}`);

      res.json(updated);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao atualizar filtro:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar filtro' });
  }
};

/**
 * DELETE /api/admin/filters/:filterId
 * 
 * Deletar filtro (e todos os tags dentro)
 */
exports.deleteFilter = async (req, res) => {
  try {
    const { filterId } = req.params;
    const userId = req.user?.id;

    // Buscar dados para audit
    const filterData = await client.query(
      'SELECT * FROM category_filters WHERE id = $1',
      [filterId]
    );

    if (!filterData.rows.length) {
      return res.status(404).json({ error: 'Filtro não encontrado' });
    }

    const filter = filterData.rows[0];

    // Iniciar transação
    await client.query('BEGIN');

    try {
      // Deletar (cascade automático: filter_tags, product_filter_tags)
      await client.query('DELETE FROM category_filters WHERE id = $1', [filterId]);

      // Audit log
      await client.query(`
        INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, ['delete', 'filter', filterId, userId, JSON.stringify(filter)]);

      await client.query('COMMIT');

      // Invalidar cache
      await invalidateCache(`filters:${filter.primary_category_id}`);

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao deletar filtro:', err);
    res.status(500).json({ error: err.message || 'Erro ao deletar filtro' });
  }
};

/**
 * PUT /api/admin/filters/:filterId/reorder
 * 
 * Reordenar filtros numa categoria
 */
exports.reorderFilters = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { order } = req.body; // Array: [1001, 1003, 1002]

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order deve ser um array de IDs' });
    }

    // Atualizar display_order para cada filtro
    await client.query('BEGIN');

    try {
      for (let i = 0; i < order.length; i++) {
        await client.query(
          'UPDATE category_filters SET display_order = $1 WHERE id = $2',
          [i, order[i]]
        );
      }

      await client.query('COMMIT');

      // Invalidar cache para todas as categorias
      // (Na prática, seria melhor saber qual categoria, mas por segurança fazemos tudo)
      await invalidateCache('filters:*');

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Erro ao reordenar filtros:', err);
    res.status(500).json({ error: err.message || 'Erro ao reordenar filtros' });
  }
};