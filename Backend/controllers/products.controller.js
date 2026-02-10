// Backend/controllers/products.controller.js - ATUALIZADO PARA MÚLTIPLAS CATEGORIAS
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

// ===== GET ALL PRODUCTS (com múltiplas categorias e atributos) =====
exports.getProducts = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'is_primary', pc.is_primary
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM products p
      LEFT JOIN product_categories pc ON pc.product_id = p.id
      LEFT JOIN categories c ON c.id = pc.category_id
      WHERE p.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error('Erro ao obter produtos:', err);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT p.*
      FROM products p
      WHERE p.id = $1
    `, [req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const product = result.rows[0];

    // Buscar categorias apenas
    const categoriesResult = await client.query(`
      SELECT 
        c.id,
        c.name,
        pc.is_primary
      FROM product_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.product_id = $1
      ORDER BY pc.is_primary DESC, c.name
    `, [product.id]);

    res.json({
      ...product,
      categories: categoriesResult.rows
    });
  } catch (err) {
    console.error('Erro ao obter produto:', err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
};


// ===== CREATE PRODUCT (com múltiplas categorias e atributos) =====
exports.createProduct = async (req, res) => {
  const dbClient = await client.connect();
  
  try {
    await dbClient.query('BEGIN');

    const { name, description, price, category_ids, primary_category_id, attributes } = req.body;
    const model_file = req.file?.filename || null;
    const stock = req.body.stock === 'true' || req.body.stock === true;

    // Validar que pelo menos uma categoria foi selecionada
    let categoryIdsArray = [];
    if (category_ids) {
      categoryIdsArray = typeof category_ids === 'string' 
        ? JSON.parse(category_ids) 
        : category_ids;
    }

    if (!categoryIdsArray.length) {
      throw new Error('Pelo menos uma categoria deve ser selecionada');
    }

    // Se primary_category_id não foi fornecido, usar a primeira categoria
    const primaryCategoryId = primary_category_id || categoryIdsArray[0];

    // Validar que a categoria primária está na lista de categorias
    if (!categoryIdsArray.includes(parseInt(primaryCategoryId))) {
      throw new Error('A categoria primária deve estar na lista de categorias selecionadas');
    }

    // Criar produto
    const productResult = await dbClient.query(
      `INSERT INTO products
        (name, description, price, model_file, stock, images)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [name, description, price, model_file, stock, []]
    );

    const product = productResult.rows[0];

    // Inserir categorias na tabela product_categories
    for (const categoryId of categoryIdsArray) {
      const isPrimary = parseInt(categoryId) === parseInt(primaryCategoryId);
      
      await dbClient.query(`
        INSERT INTO product_categories (product_id, category_id, is_primary)
        VALUES ($1, $2, $3)
      `, [product.id, categoryId, isPrimary]);
    }

    await dbClient.query('COMMIT');

    console.log('✅ Produto criado:', product.name);
    res.status(201).json(product);

  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar produto' });
  } finally {
    dbClient.release();
  }
};

// ===== UPDATE PRODUCT (com múltiplas categorias e atributos) =====
exports.updateProduct = async (req, res) => {
  const dbClient = await client.connect();
  
  try {
    await dbClient.query('BEGIN');

    const productId = req.params.id;
    const fields = [];
    const values = [];
    let i = 1;

    // Normalizar stock
    if ('stock' in req.body) {
      req.body.stock = req.body.stock === 'true' || req.body.stock === true;
    }

    // Buscar produto atual
    const currentProduct = await dbClient.query(
      'SELECT model_file FROM products WHERE id = $1',
      [productId]
    );
    const oldModelFile = currentProduct.rows[0]?.model_file;

    // Atualizar campos do produto
    for (const key in req.body) {
      if (!['images', 'attributes', 'category_ids', 'primary_category_id'].includes(key)) {
        fields.push(`${key} = $${i++}`);
        values.push(req.body[key]);
      }
    }

    // Novo modelo 3D
    if (req.file) {
      if (oldModelFile) {
        deleteFile(oldModelFile, 'models');
      }
      fields.push(`model_file = $${i++}`);
      values.push(req.file.filename);
    }

    if (fields.length > 0) {
      values.push(productId);
      await dbClient.query(`
        UPDATE products
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${i}
      `, values);
    }

    // Atualizar categorias se fornecidas
    if (req.body.category_ids) {
      let categoryIdsArray = typeof req.body.category_ids === 'string' 
        ? JSON.parse(req.body.category_ids) 
        : req.body.category_ids;

      const primaryCategoryId = req.body.primary_category_id || categoryIdsArray[0];

      // Validar que a categoria primária está na lista
      if (!categoryIdsArray.includes(parseInt(primaryCategoryId))) {
        throw new Error('A categoria primária deve estar na lista de categorias selecionadas');
      }

      // Remover categorias antigas
      await dbClient.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);

      // Inserir novas categorias
      for (const categoryId of categoryIdsArray) {
        const isPrimary = parseInt(categoryId) === parseInt(primaryCategoryId);
        
        await dbClient.query(`
          INSERT INTO product_categories (product_id, category_id, is_primary)
          VALUES ($1, $2, $3)
        `, [productId, categoryId, isPrimary]);
      }
    }
    await dbClient.query('COMMIT');

    // Buscar produto atualizado
    const result = await dbClient.query('SELECT * FROM products WHERE id = $1', [productId]);
    
    console.log('✅ Produto atualizado:', result.rows[0].name);
    res.json(result.rows[0]);

  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar produto' });
  } finally {
    dbClient.release();
  }
};

// ===== DELETE PRODUCT =====
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Buscar ficheiros do produto
    const result = await client.query(
      'SELECT model_file, images FROM products WHERE id = $1',
      [productId]
    );

    const product = result.rows[0];

    if (product) {
      if (product.model_file) {
        deleteFile(product.model_file, 'models');
      }
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

    res.json({ success: true, message: 'Produto eliminado com sucesso' });
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

    const result = await client.query(`
      UPDATE products
      SET images = array_remove(images, $1), updated_at = NOW()
      WHERE id = $2
      RETURNING images
    `, [filename, productId]);

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

    const currentProduct = await client.query(
      'SELECT images FROM products WHERE id = $1',
      [productId]
    );

    const oldImages = currentProduct.rows[0]?.images || [];
    oldImages.forEach(img => deleteFile(img, 'images'));

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