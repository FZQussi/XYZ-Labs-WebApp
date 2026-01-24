const client = require('../db');
const fs = require('fs');
const path = require('path');

// ===== FUNÇÃO AUXILIAR: DELETAR FICHEIROS =====
function deleteFile(filename, folder = 'images') {
  try {
    const filePath = path.join(__dirname, `../../Frontend/${folder}`, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Ficheiro eliminado: ${filename}`);
    }
  } catch (err) {
    console.error(`❌ Erro ao eliminar ficheiro ${filename}:`, err);
  }
}

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

// ===== CREATE PRODUCT =====
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, subcategory_id, stock } = req.body;
    const model_file = req.file?.filename || null;

    const result = await client.query(`
      INSERT INTO products
        (name, description, price, model_file, subcategory_id, stock, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [name, description, price, model_file, subcategory_id || null, stock ?? 0, []]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

// ===== UPDATE PRODUCT =====
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const fields = [];
    const values = [];
    let i = 1;

    // Buscar produto atual para obter modelo antigo
    const currentProduct = await client.query(
      'SELECT model_file FROM products WHERE id = $1',
      [productId]
    );
    const oldModelFile = currentProduct.rows[0]?.model_file;

    // Campos do body
    for (const key in req.body) {
      if (key !== 'images') { // Imagens são tratadas separadamente
        fields.push(`${key} = $${i++}`);
        values.push(req.body[key]);
      }
    }

    // Novo modelo 3D
    if (req.file) {
      // Eliminar modelo antigo se existir
      if (oldModelFile) {
        deleteFile(oldModelFile, 'models');
      }

      fields.push(`model_file = $${i++}`);
      values.push(req.file.filename);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

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
    const productId = req.params.id;

    // Buscar ficheiros do produto antes de eliminar
    const result = await client.query(
      'SELECT model_file, images FROM products WHERE id = $1',
      [productId]
    );

    const product = result.rows[0];

    if (product) {
      // Eliminar modelo 3D
      if (product.model_file) {
        deleteFile(product.model_file, 'models');
      }

      // Eliminar todas as imagens
      if (product.images && product.images.length > 0) {
        product.images.forEach(img => deleteFile(img, 'images'));
      }
    }

    // Marcar como inativo (soft delete)
    await client.query(`
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `, [productId]);

    res.json({ success: true, message: 'Produto e ficheiros eliminados com sucesso' });
  } catch (err) {
    console.error('Erro ao eliminar produto:', err);
    res.status(500).json({ error: 'Erro ao eliminar produto' });
  }
};

// ===== GET PRODUCT IMAGES =====
exports.getProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await client.query(
      'SELECT images FROM products WHERE id = $1',
      [productId]
    );

    res.json(result.rows[0]?.images || []);
  } catch (err) {
    console.error('Erro ao obter imagens:', err);
    res.status(500).json({ error: 'Erro ao obter imagens' });
  }
};

// ===== UPLOAD IMAGES =====
exports.uploadProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const filenames = files.map(f => f.filename);

    // Adiciona novas imagens ao array existente
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

// ===== DELETE SINGLE IMAGE =====
exports.deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Nome do ficheiro não fornecido' });
    }

    // Remove imagem do array
    const result = await client.query(`
      UPDATE products
      SET images = array_remove(images, $1), updated_at = NOW()
      WHERE id = $2
      RETURNING images
    `, [filename, productId]);

    // Elimina ficheiro físico
    deleteFile(filename, 'images');

    res.json({ 
      success: true, 
      images: result.rows[0]?.images || [],
      message: 'Imagem eliminada com sucesso'
    });
  } catch (err) {
    console.error('Erro ao eliminar imagem:', err);
    res.status(500).json({ error: 'Erro ao eliminar imagem' });
  }
};

// ===== REPLACE ALL IMAGES =====
exports.replaceProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    // Buscar imagens atuais
    const currentProduct = await client.query(
      'SELECT images FROM products WHERE id = $1',
      [productId]
    );

    const oldImages = currentProduct.rows[0]?.images || [];

    // Eliminar imagens antigas
    oldImages.forEach(img => deleteFile(img, 'images'));

    // Adicionar novas imagens
    const newFilenames = files.map(f => f.filename);

    const result = await client.query(`
      UPDATE products
      SET images = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING images
    `, [newFilenames, productId]);

    res.json({
      success: true,
      images: result.rows[0]?.images || [],
      message: 'Imagens substituídas com sucesso'
    });
  } catch (err) {
    console.error('Erro ao substituir imagens:', err);
    res.status(500).json({ error: 'Erro ao substituir imagens' });
  }
};