const client = require('../db');

exports.getProducts = async (req, res) => {
  const result = await client.query(
    'SELECT * FROM products WHERE is_active=true'
  );
  res.json(result.rows);
};

exports.getProductById = async (req, res) => {
  const result = await client.query(
    'SELECT * FROM products WHERE id=$1',
    [req.params.id]
  );
  res.json(result.rows[0]);
};

exports.createProduct = async (req, res) => {
  const { name, description, price, subcategory_id, stock } = req.body;
  const model_file = req.file.filename;

  const result = await client.query(
    `INSERT INTO products
     (name, description, price, model_file, subcategory_id, stock)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [name, description, price, model_file, subcategory_id, stock]
  );

  res.status(201).json(result.rows[0]);
};

exports.updateProduct = async (req, res) => {
  const fields = [];
  const values = [];
  let i = 1;

  for (const key in req.body) {
    fields.push(`${key}=$${i++}`);
    values.push(req.body[key]);
  }

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
};

exports.deleteProduct = async (req, res) => {
  await client.query(
    'UPDATE products SET is_active=false WHERE id=$1',
    [req.params.id]
  );
  res.json({ success: true });
};
