// Backend/controllers/products.controller.js (ATUALIZADO)
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

// ===== GET ALL PRODUCTS (com atributos) =====
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

    // Buscar atributos de cada produto
    const productsWithAttributes = await Promise.all(
      result.rows.map(async (product) => {
        const attributesResult = await client.query(`
          SELECT 
            pa.attribute_value,
            sa.attribute_name,
            sa.attribute_type
          FROM product_attributes pa
          JOIN subcategory_attributes sa ON pa.attribute_id = sa.id
          WHERE pa.product_id = $1
          ORDER BY sa.display_order
        `, [product.id]);

        const attributes = {};
        attributesResult.rows.forEach(attr => {
          attributes[attr.attribute_name] = attr.attribute_value;
        });

        return {
          ...product,
          attributes
        };
      })
    );

    res.json(productsWithAttributes);
  } catch (err) {
    console.error('Erro ao obter produtos:', err);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
};

// ===== GET PRODUCT BY ID (com atributos) =====
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

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const product = result.rows[0];

    // Buscar atributos
    const attributesResult = await client.query(`
      SELECT 
        pa.attribute_value,
        sa.attribute_name,
        sa.attribute_type,
        sa.id as attribute_id
      FROM product_attributes pa
      JOIN subcategory_attributes sa ON pa.attribute_id = sa.id
      WHERE pa.product_id = $1
      ORDER BY sa.display_order
    `, [product.id]);

    const attributes = {};
    attributesResult.rows.forEach(attr => {
      attributes[attr.attribute_name] = {
        value: attr.attribute_value,
        type: attr.attribute_type,
        attribute_id: attr.attribute_id
      };
    });

    res.json({
      ...product,
      attributes
    });
  } catch (err) {
    console.error('Erro ao obter produto:', err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
};

// ===== CREATE PRODUCT (com atributos) =====
exports.createProduct = async (req, res) => {
  const dbClient = await client.connect();
  
  try {
    await dbClient.query('BEGIN');

    const { name, description, price, subcategory_id, attributes } = req.body;
    const model_file = req.file?.filename || null;
    const stock = req.body.stock === 'true' || req.body.stock === true;

    let category_id = null;

    // Obter category_id a partir da subcategoria
    if (subcategory_id) {
      const catResult = await dbClient.query(
        'SELECT category_id FROM subcategories WHERE id = $1',
        [subcategory_id]
      );
      category_id = catResult.rows[0]?.category_id || null;
    }

    // Criar produto
    const productResult = await dbClient.query(
      `
      INSERT INTO products
        (name, description, price, model_file, subcategory_id, category_id, stock, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [name, description, price, model_file, subcategory_id || null, category_id, stock, []]
    );

    const product = productResult.rows[0];

    // Inserir atributos se fornecidos
    if (attributes) {
      const attributesObj = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
      
      for (const [attrId, attrValue] of Object.entries(attributesObj)) {
        if (attrValue) {
          await dbClient.query(`
            INSERT INTO product_attributes (product_id, attribute_id, attribute_value)
            VALUES ($1, $2, $3)
          `, [product.id, attrId, attrValue]);
        }
      }
    }

    await dbClient.query('COMMIT');

    console.log('✅ Produto criado com atributos:', product.name);
    res.status(201).json(product);

  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  } finally {
    dbClient.release();
  }
};

// ===== UPDATE PRODUCT (com atributos) =====
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
      if (key !== 'images' && key !== 'attributes') {
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

    // Atualizar atributos se fornecidos
    if (req.body.attributes) {
      const attributesObj = typeof req.body.attributes === 'string' 
        ? JSON.parse(req.body.attributes) 
        : req.body.attributes;

      // Eliminar atributos existentes
      await dbClient.query('DELETE FROM product_attributes WHERE product_id = $1', [productId]);

      // Inserir novos atributos
      for (const [attrId, attrValue] of Object.entries(attributesObj)) {
        if (attrValue) {
          await dbClient.query(`
            INSERT INTO product_attributes (product_id, attribute_id, attribute_value)
            VALUES ($1, $2, $3)
            ON CONFLICT (product_id, attribute_id) 
            DO UPDATE SET attribute_value = $3
          `, [productId, attrId, attrValue]);
        }
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
    res.status(500).json({ error: 'Erro ao atualizar produto' });
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