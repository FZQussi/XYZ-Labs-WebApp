// Backend/controllers/filterTranslations.controller.js
const client = require('../db');
const { invalidateCache } = require('../utils/cache');

/**
 * GET /api/admin/filters/:filterId/translations
 */
exports.getFilterTranslations = async (req, res) => {
  try {
    const { filterId } = req.params;

    const result = await client.query(`
      SELECT *
      FROM filter_translations
      WHERE filter_id = $1
      ORDER BY language_code
    `, [filterId]);

    res.json(result.rows);

  } catch (err) {
    console.error('Erro ao obter traduções:', err);
    res.status(500).json({ error: 'Erro ao obter traduções' });
  }
};

/**
 * POST /api/admin/filters/:filterId/translations
 */
exports.createFilterTranslation = async (req, res) => {
  try {
    const { filterId } = req.params;
    const { language_code, translated_name, translated_description } = req.body;
    const userId = req.user?.id;

    if (!language_code || !translated_name) {
      return res.status(400).json({ error: 'language_code e translated_name são obrigatórios' });
    }

    // Buscar category para cache
    const categoryData = await client.query(
      'SELECT primary_category_id FROM category_filters WHERE id = $1',
      [filterId]
    );

    if (!categoryData.rows.length) {
      return res.status(404).json({ error: 'Filtro não encontrado' });
    }

    const categoryId = categoryData.rows[0].primary_category_id;

    const result = await client.query(`
      INSERT INTO filter_translations 
        (filter_id, language_code, translated_name, translated_description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (filter_id, language_code) 
      DO UPDATE SET 
        translated_name = $3,
        translated_description = $4,
        updated_at = NOW()
      RETURNING *
    `, [filterId, language_code, translated_name, translated_description]);

    // Audit
    await client.query(`
      INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
      VALUES ($1, $2, $3, $4, $5)
    `, ['create', 'translation', result.rows[0].id, userId, JSON.stringify({
      language_code,
      translated_name
    })]);

    // Invalidar cache
    await invalidateCache(`filters:${categoryId}`);

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Erro ao criar tradução:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar tradução' });
  }
};

/**
 * PUT /api/admin/tags/:tagId/translations
 */
exports.updateTagTranslation = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { language_code, translated_name } = req.body;
    const userId = req.user?.id;

    if (!language_code || !translated_name) {
      return res.status(400).json({ error: 'language_code e translated_name são obrigatórios' });
    }

    // Buscar category para cache
    const categoryData = await client.query(`
      SELECT cf.primary_category_id
      FROM filter_tags ft
      JOIN category_filters cf ON cf.id = ft.filter_id
      WHERE ft.id = $1
    `, [tagId]);

    if (!categoryData.rows.length) {
      return res.status(404).json({ error: 'Tag não encontrado' });
    }

    const categoryId = categoryData.rows[0].primary_category_id;

    const result = await client.query(`
      INSERT INTO filter_translations 
        (filter_tag_id, language_code, translated_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (filter_tag_id, language_code) 
      DO UPDATE SET 
        translated_name = $3,
        updated_at = NOW()
      RETURNING *
    `, [tagId, language_code, translated_name]);

    // Audit
    await client.query(`
      INSERT INTO filter_audit_log (action, resource_type, resource_id, user_id, changes)
      VALUES ($1, $2, $3, $4, $5)
    `, ['update', 'translation', result.rows[0].id, userId, JSON.stringify({
      language_code,
      translated_name
    })]);

    // Invalidar cache
    await invalidateCache(`filters:${categoryId}`);

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Erro ao atualizar tradução:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar tradução' });
  }
};