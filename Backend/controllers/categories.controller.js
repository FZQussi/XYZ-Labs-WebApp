// Backend/controllers/categories.controller.js
const client = require('../db');

// ===== GET PRIMARY CATEGORIES =====
exports.getPrimaryCategories = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT * FROM primary_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter categorias primárias:', err);
    res.status(500).json({ error: 'Erro ao obter categorias primárias' });
  }
};

// ===== CREATE PRIMARY CATEGORY =====
exports.createPrimaryCategory = async (req, res) => {
  try {
    const { name, description, icon, display_order } = req.body;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const result = await client.query(`
      INSERT INTO primary_categories (name, slug, description, icon, display_order)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, slug, description || '', icon || null, display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria primária:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar categoria primária' });
  }
};

// ===== UPDATE PRIMARY CATEGORY =====
exports.updatePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, display_order, is_active } = req.body;

    const result = await client.query(`
      UPDATE primary_categories
      SET name=$1, description=$2, icon=$3, display_order=$4, is_active=$5, updated_at=NOW()
      WHERE id=$6
      RETURNING *
    `, [name, description, icon || null, display_order, is_active, id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar categoria primária:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria primária' });
  }
};

// ===== DELETE PRIMARY CATEGORY =====
exports.deletePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const inUse = await client.query(
      'SELECT COUNT(*) FROM products WHERE primary_category_id = $1 AND is_active = true',
      [id]
    );

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({
        error: `Não é possível eliminar: ${inUse.rows[0].count} produto(s) usam esta categoria.`
      });
    }

    await client.query('DELETE FROM primary_categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar categoria primária:', err);
    res.status(500).json({ error: 'Erro ao eliminar categoria primária' });
  }
};

// ===== GET SECONDARY CATEGORIES =====
exports.getSecondaryCategories = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT * FROM categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter categorias secundárias:', err);
    res.status(500).json({ error: 'Erro ao obter categorias secundárias' });
  }
};

// ===== CREATE SECONDARY CATEGORY =====
exports.createSecondaryCategory = async (req, res) => {
  try {
    const { name, description, category_role, display_order } = req.body;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const result = await client.query(`
      INSERT INTO categories (name, slug, description, category_role, display_order)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, slug, description || '', category_role || 'secondary', display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria secundária:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar categoria secundária' });
  }
};

// ===== UPDATE SECONDARY CATEGORY =====
exports.updateSecondaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_role, display_order, is_active } = req.body;

    const result = await client.query(`
      UPDATE categories
      SET name=$1, description=$2, category_role=$3, display_order=$4, is_active=$5, updated_at=NOW()
      WHERE id=$6
      RETURNING *
    `, [name, description, category_role, display_order, is_active, id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar categoria secundária:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria secundária' });
  }
};

// ===== DELETE SECONDARY CATEGORY =====
exports.deleteSecondaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await client.query('DELETE FROM product_categories WHERE category_id = $1', [id]);
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar categoria secundária:', err);
    res.status(500).json({ error: 'Erro ao eliminar categoria secundária' });
  }
};