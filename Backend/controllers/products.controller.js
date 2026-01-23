const client = require('../db');

// ===== GET ALL PRODUCTS =====
exports.getProducts = async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM products WHERE is_active=true'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter produtos:', err);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
};

// ===== GET PRODUCT BY ID =====
exports.getProductById = async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM products WHERE id=$1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter produto:', err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
};

// ===== CREATE PRODUCT =====
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category_id, subcategory_id, stock } = req.body;
    const model_file = req.file?.filename || null;

    const result = await client.query(
      `INSERT INTO products
        (name, description, price, model_file, category_id, subcategory_id, stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, description, price, model_file, category_id || null, subcategory_id || null, stock || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

// ===== UPDATE PRODUCT =====
exports.updateProduct = async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let i = 1;

    // Campos do body
    for (const key in req.body) {
      fields.push(`${key}=$${i++}`);
      values.push(req.body[key]);
    }

    // Arquivo do modelo
    if (req.file) {
      fields.push(`model_file=$${i++}`);
      values.push(req.file.filename);
    }

    values.push(req.params.id);

    const result = await client.query(
      `UPDATE products SET ${fields.join(', ')}
       WHERE id=$${i} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

// ===== DELETE PRODUCT =====
exports.deleteProduct = async (req, res) => {
  try {
    await client.query(
      'UPDATE products SET is_active=false WHERE id=$1',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar produto:', err);
    res.status(500).json({ error: 'Erro ao eliminar produto' });
  }
};
