const client = require('./db');

// ==========================
// OBTER TODOS OS PRODUTOS
// ==========================
async function getProducts() {
  const res = await client.query(`
    SELECT 
      id,
      name,
      description,
      price,
      model_file,
      created_at,
      updated_at
    FROM products
    ORDER BY id
  `);
  return res.rows;
}

// ==========================
// OBTER PRODUTO PELO ID
// ==========================
async function getProductById(id) {
  const res = await client.query(`
    SELECT 
      id, 
      name, 
      description, 
      price, 
      model_file,
      created_at,
      updated_at
    FROM products
    WHERE id = $1
  `, [id]);
  return res.rows[0];
}

// ==========================
// CRIAR PRODUTO
// ==========================
async function createProduct({ name, description, price, model_file }) {
  const res = await client.query(
    `INSERT INTO products (name, description, price, model_file, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [name, description, price, model_file]
  );

  // Retorna o produto recém-criado
  return getProductById(res.rows[0].id);
}

// ==========================
// ATUALIZAR PRODUTO
// ==========================
async function updateProduct(id, { name, description, price, model_file }) {
  // Se não houver novo ficheiro, mantém o anterior
  const resCurrent = await getProductById(id);
  const fileToUse = model_file || resCurrent.model_file;

  await client.query(
    `UPDATE products 
     SET name=$1, description=$2, price=$3, model_file=$4, updated_at=NOW()
     WHERE id=$5`,
    [name, description, price, fileToUse, id]
  );

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
