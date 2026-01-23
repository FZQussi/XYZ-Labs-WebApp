const client = require('../db');

// ===== GET ALL PRODUCTS =====
exports.getProducts = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        p.*,
        sc.name AS subcategory_name,
        c.name AS category_name
      FROM products p
      LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter produtos:', err);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
};

// ===== GET PRODUCT BY ID =====
exports.getProductById = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        p.*,
        sc.name AS subcategory_name,
        c.name AS category_name
      FROM products p
      LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE p.id = $1
    `, [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter produto:', err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
};

// ===== CREATE PRODUCT (dados + 3D model + imagens) =====
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, subcategory_id, stock } = req.body;
    const model_file = req.file?.filename || null;
    const images = req.files?.map(f => f.filename) || [];

    const result = await client.query(`
      INSERT INTO products
        (name, description, price, model_file, subcategory_id, stock, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [name, description, price, model_file, subcategory_id || null, stock ?? 0, images]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

// ===== UPDATE PRODUCT (dados + 3D model + imagens) =====
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const fields = [];
    const values = [];
    let i = 1;

    // Campos do body
    for (const key in req.body) {
      fields.push(`${key} = $${i++}`);
      values.push(req.body[key]);
    }

    // Modelo 3D
    if (req.file) {
      fields.push(`model_file = $${i++}`);
      values.push(req.file.filename);
    }

    // Novas imagens
    if (req.files?.length) {
      const newImages = req.files.map(f => f.filename);
      fields.push(`images = COALESCE(images, '{}') || $${i++}`);
      values.push(newImages);
    }

    if (!fields.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    values.push(productId);

    const result = await client.query(`
      UPDATE products
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${i}
      RETURNING *
    `, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

// ===== DELETE PRODUCT =====
exports.deleteProduct = async (req, res) => {
  try {
    await client.query(`
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `, [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar produto:', err);
    res.status(500).json({ error: 'Erro ao eliminar produto' });
  }
};

// ===== GET PRODUCT IMAGES =====
exports.getProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await client.query(`
      SELECT images FROM products WHERE id = $1
    `, [productId]);

    // Retorna array de imagens
    res.json(result.rows[0]?.images || []);
  } catch (err) {
    console.error('Erro ao obter imagens:', err);
    res.status(500).json({ error: 'Erro ao obter imagens' });
  }
};

// ===== UPLOAD IMAGES (para produtos existentes) =====
exports.uploadProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    if (!files.length) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    const filenames = files.map(f => f.filename);

    // Atualiza array de imagens
    const result = await client.query(`
      UPDATE products
      SET images = COALESCE(images, '{}') || $1, updated_at = NOW()
      WHERE id = $2
      RETURNING images
    `, [filenames, productId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao fazer upload das imagens:', err);
    res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
  }
};
