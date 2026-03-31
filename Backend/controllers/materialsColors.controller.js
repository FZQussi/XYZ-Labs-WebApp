'use strict';
// backend/controllers/materialsColors.controller.js

const client = require('../db');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remover acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ═════════════════════════════════════════════════════════════
// MATERIAIS — PUBLIC
// ═════════════════════════════════════════════════════════════

// GET /api/materials
// Devolve todos os materiais ativos com as suas cores
exports.getPublicMaterials = async (req, res) => {
  try {
    const { category } = req.query;

    const params = [];
    const where  = ['m.is_active = TRUE'];
    if (category) { params.push(category); where.push(`m.category = $${params.length}`); }

    const result = await client.query(`
      SELECT
        m.*,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'id',           c.id,
              'name',         c.name,
              'slug',         c.slug,
              'hex_code',     c.hex_code,
              'gradient',     c.gradient,
              'finish',       c.finish,
              'category',     c.category,
              'multiplier',   c.multiplier,
              'sample_image', c.sample_image
            ) ORDER BY c.display_order, c.name
          ) FILTER (WHERE c.id IS NOT NULL AND c.is_active = TRUE),
          '[]'
        ) AS colors
      FROM   materials m
      LEFT   JOIN colors c ON c.material_id = m.id
      WHERE  ${where.join(' AND ')}
      GROUP  BY m.id
      ORDER  BY m.display_order, m.name
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('getPublicMaterials:', err);
    res.status(500).json({ error: 'Erro ao carregar materiais' });
  }
};

// GET /api/materials/:id/colors
// Cores de um material específico (para o checkout)
exports.getColorsByMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(`
      SELECT id, name, slug, hex_code, gradient, finish, category, multiplier, sample_image
      FROM   colors
      WHERE  material_id = $1 AND is_active = TRUE
      ORDER  BY display_order, name
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('getColorsByMaterial:', err);
    res.status(500).json({ error: 'Erro ao carregar cores' });
  }
};

// GET /api/options  — formato compatível com o options.json antigo
// Usado pelo checkout.js e colors.js sem alterar o frontend
exports.getOptionsCompat = async (req, res) => {
  try {
    const matsResult = await client.query(`
      SELECT * FROM materials WHERE is_active = TRUE ORDER BY display_order, name
    `);
    const colsResult = await client.query(`
      SELECT c.*, m.slug AS material_slug
      FROM   colors c
      JOIN   materials m ON m.id = c.material_id
      WHERE  c.is_active = TRUE
      ORDER  BY c.display_order, c.name
    `);

    const materials = matsResult.rows.map(m => ({
      id:          m.slug,
      name:        m.name,
      category:    m.category,
      badge:       m.badge,
      gradient:    m.gradient,
      image:       m.image_url,
      description: m.description,
      multiplier:  parseFloat(m.multiplier),
      properties:  {
        'Resistência':   m.prop_resistance,
        'Flexibilidade': m.prop_flexibility,
        'Durabilidade':  m.prop_durability,
      },
      specs: m.specs || [],
    }));

    const colors = colsResult.rows.map(c => ({
      id:          c.slug,
      name:        c.name,
      material:    c.material_slug,
      finish:      c.finish,
      category:    c.category,
      code:        c.hex_code,
      gradient:    c.gradient,
      sampleImage: c.sample_image,
      multiplier:  parseFloat(c.multiplier),
    }));

    res.json({ materials, colors });
  } catch (err) {
    console.error('getOptionsCompat:', err);
    res.status(500).json({ error: 'Erro ao carregar opções' });
  }
};

// ═════════════════════════════════════════════════════════════
// MATERIAIS — ADMIN
// ═════════════════════════════════════════════════════════════

// GET /api/admin/materials
exports.adminGetMaterials = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        m.*,
        COUNT(c.id) FILTER (WHERE c.is_active)     AS active_colors_count,
        COUNT(c.id)                                 AS total_colors_count
      FROM   materials m
      LEFT   JOIN colors c ON c.material_id = m.id
      GROUP  BY m.id
      ORDER  BY m.display_order, m.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('adminGetMaterials:', err);
    res.status(500).json({ error: 'Erro ao carregar materiais' });
  }
};

// GET /api/admin/materials/:id
exports.adminGetMaterial = async (req, res) => {
  try {
    const mat = await client.query(
      'SELECT * FROM materials WHERE id = $1', [req.params.id]
    );
    if (!mat.rows.length) return res.status(404).json({ error: 'Material não encontrado' });

    const colors = await client.query(
      'SELECT * FROM colors WHERE material_id = $1 ORDER BY display_order, name', [req.params.id]
    );

    res.json({ ...mat.rows[0], colors: colors.rows });
  } catch (err) {
    console.error('adminGetMaterial:', err);
    res.status(500).json({ error: 'Erro ao carregar material' });
  }
};

// POST /api/admin/materials
exports.adminCreateMaterial = async (req, res) => {
  try {
    const {
      name, category, badge, description,
      gradient, image_url, multiplier,
      price_per_kg_min, price_per_kg_max,
      prop_resistance, prop_flexibility, prop_durability,
      specs, temp_min, temp_max,
      is_active, is_featured, display_order
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const slug = slugify(name);

    // Verificar slug único
    const existing = await client.query('SELECT id FROM materials WHERE slug = $1', [slug]);
    if (existing.rows.length) return res.status(409).json({ error: 'Já existe um material com este nome' });

    const result = await client.query(`
      INSERT INTO materials (
        name, slug, category, badge, description,
        gradient, image_url, multiplier,
        price_per_kg_min, price_per_kg_max,
        prop_resistance, prop_flexibility, prop_durability,
        specs, temp_min, temp_max,
        is_active, is_featured, display_order
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19
      ) RETURNING *
    `, [
      name, slug, category || 'pla', badge || null, description || null,
      gradient || null, image_url || null, multiplier || 1,
      price_per_kg_min || null, price_per_kg_max || null,
      prop_resistance || 0, prop_flexibility || 0, prop_durability || 0,
      JSON.stringify(specs || []), temp_min || null, temp_max || null,
      is_active !== false, is_featured || false, display_order || 0
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('adminCreateMaterial:', err);
    res.status(500).json({ error: 'Erro ao criar material' });
  }
};

// PUT /api/admin/materials/:id
exports.adminUpdateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, category, badge, description,
      gradient, image_url, multiplier,
      price_per_kg_min, price_per_kg_max,
      prop_resistance, prop_flexibility, prop_durability,
      specs, temp_min, temp_max,
      is_active, is_featured, display_order
    } = req.body;

    const existing = await client.query('SELECT * FROM materials WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Material não encontrado' });

    const slug = name ? slugify(name) : existing.rows[0].slug;

    const result = await client.query(`
      UPDATE materials SET
        name             = COALESCE($1, name),
        slug             = $2,
        category         = COALESCE($3, category),
        badge            = $4,
        description      = $5,
        gradient         = $6,
        image_url        = $7,
        multiplier       = COALESCE($8, multiplier),
        price_per_kg_min = $9,
        price_per_kg_max = $10,
        prop_resistance  = COALESCE($11, prop_resistance),
        prop_flexibility = COALESCE($12, prop_flexibility),
        prop_durability  = COALESCE($13, prop_durability),
        specs            = COALESCE($14, specs),
        temp_min         = $15,
        temp_max         = $16,
        is_active        = COALESCE($17, is_active),
        is_featured      = COALESCE($18, is_featured),
        display_order    = COALESCE($19, display_order)
      WHERE id = $20
      RETURNING *
    `, [
      name, slug, category, badge, description,
      gradient, image_url, multiplier,
      price_per_kg_min, price_per_kg_max,
      prop_resistance, prop_flexibility, prop_durability,
      specs ? JSON.stringify(specs) : null,
      temp_min, temp_max,
      is_active, is_featured, display_order,
      id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('adminUpdateMaterial:', err);
    res.status(500).json({ error: 'Erro ao atualizar material' });
  }
};

// DELETE /api/admin/materials/:id
exports.adminDeleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await client.query('SELECT id FROM materials WHERE id = $1', [id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Material não encontrado' });

    // Cores apagadas automaticamente por CASCADE
    await client.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json({ message: 'Material e cores associadas apagados com sucesso' });
  } catch (err) {
    console.error('adminDeleteMaterial:', err);
    res.status(500).json({ error: 'Erro ao apagar material' });
  }
};

// ═════════════════════════════════════════════════════════════
// CORES — ADMIN
// ═════════════════════════════════════════════════════════════

// GET /api/admin/colors
exports.adminGetColors = async (req, res) => {
  try {
    const { material_id, finish, category } = req.query;

    const params = [];
    const where  = [];
    if (material_id) { params.push(material_id); where.push(`c.material_id = $${params.length}`); }
    if (finish)      { params.push(finish);      where.push(`c.finish = $${params.length}`); }
    if (category)    { params.push(category);    where.push(`c.category = $${params.length}`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const result = await client.query(`
      SELECT
        c.*,
        m.name AS material_name,
        m.slug AS material_slug
      FROM   colors c
      JOIN   materials m ON m.id = c.material_id
      ${whereClause}
      ORDER  BY m.display_order, c.display_order, c.name
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('adminGetColors:', err);
    res.status(500).json({ error: 'Erro ao carregar cores' });
  }
};

// GET /api/admin/colors/:id
exports.adminGetColor = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT c.*, m.name AS material_name, m.slug AS material_slug
      FROM   colors c
      JOIN   materials m ON m.id = c.material_id
      WHERE  c.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Cor não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('adminGetColor:', err);
    res.status(500).json({ error: 'Erro ao carregar cor' });
  }
};

// POST /api/admin/colors
exports.adminCreateColor = async (req, res) => {
  try {
    const {
      name, material_id, hex_code, gradient, sample_image,
      finish, category, multiplier,
      is_active, is_featured, display_order
    } = req.body;

    if (!name)        return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!material_id) return res.status(400).json({ error: 'Material é obrigatório' });
    if (!hex_code)    return res.status(400).json({ error: 'Código hex é obrigatório' });

    // Verificar que o material existe
    const mat = await client.query('SELECT id, slug FROM materials WHERE id = $1', [material_id]);
    if (!mat.rows.length) return res.status(404).json({ error: 'Material não encontrado' });

    const slug = slugify(`${name}-${mat.rows[0].slug}`);

    const existing = await client.query('SELECT id FROM colors WHERE slug = $1', [slug]);
    if (existing.rows.length) return res.status(409).json({ error: 'Já existe uma cor com este nome para este material' });

    const result = await client.query(`
      INSERT INTO colors (
        name, slug, material_id, hex_code, gradient, sample_image,
        finish, category, multiplier,
        is_active, is_featured, display_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [
      name, slug, material_id, hex_code, gradient || null, sample_image || null,
      finish || 'glossy', category || 'basic', multiplier || 1,
      is_active !== false, is_featured || false, display_order || 0
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('adminCreateColor:', err);
    res.status(500).json({ error: 'Erro ao criar cor' });
  }
};

// PUT /api/admin/colors/:id
exports.adminUpdateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, material_id, hex_code, gradient, sample_image,
      finish, category, multiplier,
      is_active, is_featured, display_order
    } = req.body;

    const existing = await client.query('SELECT * FROM colors WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Cor não encontrada' });

    // Recalcular slug se nome ou material mudarem
    let slug = existing.rows[0].slug;
    if (name || material_id) {
      const matId = material_id || existing.rows[0].material_id;
      const matRes = await client.query('SELECT slug FROM materials WHERE id = $1', [matId]);
      const matSlug = matRes.rows[0]?.slug || 'unknown';
      slug = slugify(`${name || existing.rows[0].name}-${matSlug}`);
    }

    const result = await client.query(`
      UPDATE colors SET
        name          = COALESCE($1, name),
        slug          = $2,
        material_id   = COALESCE($3, material_id),
        hex_code      = COALESCE($4, hex_code),
        gradient      = $5,
        sample_image  = $6,
        finish        = COALESCE($7, finish),
        category      = COALESCE($8, category),
        multiplier    = COALESCE($9, multiplier),
        is_active     = COALESCE($10, is_active),
        is_featured   = COALESCE($11, is_featured),
        display_order = COALESCE($12, display_order)
      WHERE id = $13
      RETURNING *
    `, [
      name, slug, material_id, hex_code, gradient, sample_image,
      finish, category, multiplier,
      is_active, is_featured, display_order,
      id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('adminUpdateColor:', err);
    res.status(500).json({ error: 'Erro ao atualizar cor' });
  }
};

// DELETE /api/admin/colors/:id
exports.adminDeleteColor = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await client.query('SELECT id FROM colors WHERE id = $1', [id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Cor não encontrada' });

    await client.query('DELETE FROM colors WHERE id = $1', [id]);
    res.json({ message: 'Cor apagada com sucesso' });
  } catch (err) {
    console.error('adminDeleteColor:', err);
    res.status(500).json({ error: 'Erro ao apagar cor' });
  }
};