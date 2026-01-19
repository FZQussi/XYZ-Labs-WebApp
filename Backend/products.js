const client = require('./db');

async function getProducts() {
  const res = await client.query('SELECT * FROM Product ORDER BY id');
  return res.rows;
}

async function getProductById(id) {
  const res = await client.query('SELECT * FROM Product WHERE id = $1', [id]);
  return res.rows[0];
}

async function createProduct({ name, description, basePrice }) {
  const res = await client.query(
    'INSERT INTO Product(name, description, basePrice, createdAt) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [name, description, basePrice]
  );
  return res.rows[0];
}

async function updateProduct(id, { name, description, basePrice }) {
  const res = await client.query(
    'UPDATE Product SET name=$1, description=$2, basePrice=$3 WHERE id=$4 RETURNING *',
    [name, description, basePrice, id]
  );
  return res.rows[0];
}

async function deleteProduct(id) {
  await client.query('DELETE FROM Product WHERE id=$1', [id]);
  return { message: `Produto ${id} removido.` };
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
