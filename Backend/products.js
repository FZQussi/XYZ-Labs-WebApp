const client = require('./db');

// ==========================
// OBTER TODOS OS PRODUTOS
// ==========================
async function getProducts() {
  const res = await client.query(`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.created_at,
      p.material_id,
      m.name AS material_name,
      p.color_id,
      c.name AS color_name
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN colors c ON p.color_id = c.id
    ORDER BY p.id
  `);
  return res.rows;
}

// ==========================
// OBTER PRODUTO PELO ID
// ==========================
async function getProductById(id) {
  const res = await client.query(`
    SELECT 
      p.id, 
      p.name, 
      p.description, 
      p.price, 
      p.material_id,
      m.name AS material_name,
      p.color_id,
      c.name AS color_name,
      p.created_at
    FROM products p
    LEFT JOIN materials m ON p.material_id = m.id
    LEFT JOIN colors c ON p.color_id = c.id
    WHERE p.id = $1
  `, [id]);
  return res.rows[0];
}

// ==========================
// CRIAR PRODUTO
// ==========================
async function createProduct({ name, description, price, material_id, color_id }) {
  const res = await client.query(
    `INSERT INTO products (name, description, price, material_id, color_id, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id`,
    [name, description, price, material_id || null, color_id || null]
  );

  // Buscar o produto recém-criado com JOIN
  return getProductById(res.rows[0].id);
}

// ==========================
// ATUALIZAR PRODUTO
// ==========================
async function updateProduct(id, { name, description, price, material_id, color_id }) {
  await client.query(
    `UPDATE products 
     SET name=$1, description=$2, price=$3, material_id=$4, color_id=$5 
     WHERE id=$6`,
    [name, description, price, material_id || null, color_id || null, id]
  );

  // Buscar o produto atualizado com JOIN
  return getProductById(id);
}

// ==========================
// REMOVER PRODUTO
// ==========================
async function deleteProduct(id) {
  await client.query('DELETE FROM products WHERE id=$1', [id]);
  return { message: `Produto ${id} removido.` };
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
