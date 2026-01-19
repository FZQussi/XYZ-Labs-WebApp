const client = require('./db');

// Obter todos os produtos
async function getProducts() {
  const res = await client.query('SELECT * FROM products ORDER BY id');
  return res.rows;
}

// Obter produto pelo id
async function getProductById(id) {
  const res = await client.query('SELECT * FROM products WHERE id = $1', [id]);
  return res.rows[0];
}

// Criar novo produto
async function createProduct({ name, description, price, material_id, color_id }) {
  const res = await client.query(
    `INSERT INTO products (name, description, price, material_id, color_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [name, description, price, material_id || null, color_id || null]
  );
  return res.rows[0];
}

// Atualizar produto existente
async function updateProduct(id, { name, description, price, material_id, color_id }) {
  const res = await client.query(
    `UPDATE products 
     SET name=$1, description=$2, price=$3, material_id=$4, color_id=$5 
     WHERE id=$6 
     RETURNING *`,
    [name, description, price, material_id || null, color_id || null, id]
  );
  return res.rows[0];
}

// Remover produto
async function deleteProduct(id) {
  await client.query('DELETE FROM products WHERE id=$1', [id]);
  return { message: `Produto ${id} removido.` };
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
