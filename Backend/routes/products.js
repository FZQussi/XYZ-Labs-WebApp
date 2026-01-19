const client = require('./db');

async function getProducts() {
  const res = await client.query('SELECT * FROM products');
  return res.rows;
}

async function getProductById(id) {
  const res = await client.query('SELECT * FROM products WHERE id=$1', [id]);
  return res.rows[0];
}

async function createProduct(product) {
  const res = await client.query(
    'INSERT INTO products(name, description, basePrice) VALUES($1,$2,$3) RETURNING *',
    [product.name, product.description, product.basePrice]
  );
  return res.rows[0];
}

async function updateProduct(id, product) {
  const res = await client.query(
    'UPDATE products SET name=$1, description=$2, basePrice=$3 WHERE id=$4 RETURNING *',
    [product.name, product.description, product.basePrice, id]
  );
  return res.rows[0];
}

async function deleteProduct(id) {
  await client.query('DELETE FROM products WHERE id=$1', [id]);
  return { message: 'Produto removido' };
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
