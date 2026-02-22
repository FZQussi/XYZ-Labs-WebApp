// Backend/controllers/products.controller.js
const client = require('../db');
const fs = require('fs');
const path = require('path');

// ===== AUXILIAR: DELETAR FICHEIROS =====
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
        row_to_json(pc_main) AS primary_category,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id',   c.id,
              'name', c.name
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS secondary_categories
      FROM products p
      LEFT JOIN primary_categories pc_main ON pc_main.id = p.primary_category_id
      LEFT JOIN product_categories  pcat   ON pcat.product_id = p.id
      LEFT JOIN categories           c     ON c.id = pcat.category_id
      WHERE p.is_active = true
      GROUP BY p.id, pc_main.id, pc_main.name, pc_main.slug,
               pc_main.description, pc_main.icon, pc_main.image,
               pc_main.is_active, pc_main.display_order,
               pc_main.created_at, pc_main.updated_at
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
        row_to_json(pc_main) AS primary_category,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id',   c.id,
              'name', c.name
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS secondary_categories
      FROM products p
      LEFT JOIN primary_categories pc_main ON pc_main.id = p.primary_category_id
      LEFT JOIN product_categories  pcat   ON pcat.product_id = p.id
      LEFT JOIN categories           c     ON c.id = pcat.category_id
      WHERE p.id = $1
      GROUP BY p.id, pc_main.id, pc_main.name, pc_main.slug,
               pc_main.description, pc_main.icon, pc_main.image,
               pc_main.is_active, pc_main.display_order,
               pc_main.created_at, pc_main.updated_at
    `, [req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter produto:', err);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
};

// ===== CREATE PRODUCT =====
exports.createProduct = async (req, res) => {
  const dbClient = await client.connect();
  try {
    await dbClient.query('BEGIN');

    const {
      name,
      description,           // HTML string from rich-text editor
      price,
      primary_category_id,   // OBRIGATÓRIO — ID de primary_categories
      secondary_category_ids // JSON array de IDs de categories (opcional)
    } = req.body;

    const model_file = req.file?.filename || null;
    const stock = req.body.stock === 'true' || req.body.stock === true;

    if (!primary_category_id) {
      throw new Error('Categoria principal é obrigatória');
    }

    // Criar produto
    const productResult = await dbClient.query(
      `INSERT INTO products
        (name, description, price, model_file, stock, images, primary_category_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, description, price, model_file, stock, [], primary_category_id]
    );

    const product = productResult.rows[0];

    // Inserir categorias secundárias (product_categories)
    if (secondary_category_ids) {
      let secIds = typeof secondary_category_ids === 'string'
        ? JSON.parse(secondary_category_ids)
        : secondary_category_ids;

      for (const catId of secIds) {
        await dbClient.query(`
          INSERT INTO product_categories (product_id, category_id, is_primary)
          VALUES ($1, $2, false)
          ON CONFLICT (product_id, category_id) DO NOTHING
        `, [product.id, catId]);
      }
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

// ===== UPDATE PRODUCT =====
exports.updateProduct = async (req, res) => {
  const dbClient = await client.connect();
  try {
    await dbClient.query('BEGIN');

    const productId = req.params.id;

    // Normalizar stock
    if ('stock' in req.body) {
      req.body.stock = req.body.stock === 'true' || req.body.stock === true;
    }

    // Buscar modelo atual
    const current = await dbClient.query(
      'SELECT model_file FROM products WHERE id = $1',
      [productId]
    );
    const oldModelFile = current.rows[0]?.model_file;

    // Construir SET dinâmico (excluir campos de categorias)
    const skipFields = ['secondary_category_ids', 'images'];
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in req.body) {
      if (!skipFields.includes(key)) {
        fields.push(`${key} = $${i++}`);
        values.push(req.body[key]);
      }
    }

    // Novo modelo 3D
    if (req.file) {
      if (oldModelFile) deleteFile(oldModelFile, 'models');
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

    // Atualizar categorias secundárias se enviadas
    if (req.body.secondary_category_ids !== undefined) {
      let secIds = typeof req.body.secondary_category_ids === 'string'
        ? JSON.parse(req.body.secondary_category_ids)
        : req.body.secondary_category_ids;

      await dbClient.query(
        'DELETE FROM product_categories WHERE product_id = $1',
        [productId]
      );

      for (const catId of secIds) {
        await dbClient.query(`
          INSERT INTO product_categories (product_id, category_id, is_primary)
          VALUES ($1, $2, false)
          ON CONFLICT (product_id, category_id) DO NOTHING
        `, [productId, catId]);
      }
    }

    await dbClient.query('COMMIT');

    const result = await dbClient.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );
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

// ===== DELETE PRODUCT (soft delete) =====
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const result = await client.query(
      'SELECT model_file, images FROM products WHERE id = $1',
      [productId]
    );
    const product = result.rows[0];

    if (product) {
      if (product.model_file) deleteFile(product.model_file, 'models');
      if (product.images?.length) product.images.forEach(img => deleteFile(img, 'images'));
    }

    await client.query(`
      UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1
    `, [productId]);

    res.json({ success: true, message: 'Produto eliminado com sucesso' });
  } catch (err) {
    console.error('Erro ao eliminar produto:', err);
    res.status(500).json({ error: 'Erro ao eliminar produto' });
  }
};

// ===== GET PRIMARY CATEGORIES =====
exports.getPrimaryCategories = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT * FROM primary_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter categorias primárias:', err);
    res.status(500).json({ error: 'Erro ao obter categorias primárias' });
  }
};

// ===== CREATE PRIMARY CATEGORY =====
exports.createPrimaryCategory = async (req, res) => {
  try {
    const { name, description, icon, display_order } = req.body;
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const result = await client.query(`
      INSERT INTO primary_categories (name, slug, description, icon, display_order)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, slug, description || '', icon || '📂', display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria primária:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar categoria primária' });
  }
};

// ===== UPDATE PRIMARY CATEGORY =====
exports.updatePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, display_order, is_active } = req.body;

    const result = await client.query(`
      UPDATE primary_categories
      SET name=$1, description=$2, icon=$3, display_order=$4, is_active=$5, updated_at=NOW()
      WHERE id=$6
      RETURNING *
    `, [name, description, icon, display_order, is_active, id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar categoria primária:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria primária' });
  }
};

// ===== DELETE PRIMARY CATEGORY =====
exports.deletePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há produtos a usar esta categoria
    const inUse = await client.query(
      'SELECT COUNT(*) FROM products WHERE primary_category_id = $1 AND is_active = true',
      [id]
    );

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({
        error: `Não é possível eliminar: ${inUse.rows[0].count} produto(s) usam esta categoria.`
      });
    }

    await client.query('DELETE FROM primary_categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar categoria primária:', err);
    res.status(500).json({ error: 'Erro ao eliminar categoria primária' });
  }
};

// ===== GET SECONDARY CATEGORIES =====
exports.getSecondaryCategories = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT * FROM categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter categorias secundárias:', err);
    res.status(500).json({ error: 'Erro ao obter categorias secundárias' });
  }
};

// ===== CREATE SECONDARY CATEGORY =====
exports.createSecondaryCategory = async (req, res) => {
  try {
    const { name, description, category_role, display_order } = req.body;
    const slug = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const result = await client.query(`
      INSERT INTO categories (name, slug, description, category_role, display_order)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, slug, description || '', category_role || 'secondary', display_order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria secundária:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar categoria secundária' });
  }
};

// ===== UPDATE SECONDARY CATEGORY =====
exports.updateSecondaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_role, display_order, is_active } = req.body;

    const result = await client.query(`
      UPDATE categories
      SET name=$1, description=$2, category_role=$3, display_order=$4, is_active=$5, updated_at=NOW()
      WHERE id=$6
      RETURNING *
    `, [name, description, category_role, display_order, is_active, id]);

    if (!result.rows.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar categoria secundária:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria secundária' });
  }
};

// ===== DELETE SECONDARY CATEGORY =====
exports.deleteSecondaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await client.query('DELETE FROM product_categories WHERE category_id = $1', [id]);
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar categoria secundária:', err);
    res.status(500).json({ error: 'Erro ao eliminar categoria secundária' });
  }
};

// ===== IMAGES =====
exports.getProductImages = async (req, res) => {
  try {
    const result = await client.query('SELECT images FROM products WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]?.images || []);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter imagens' });
  }
};

exports.uploadProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    const filenames = files.map(f => f.filename);
    const result = await client.query(`
      UPDATE products
      SET images = COALESCE(images, '{}') || $1, updated_at = NOW()
      WHERE id = $2 RETURNING images
    `, [filenames, productId]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Nome do ficheiro não fornecido' });

    const result = await client.query(`
      UPDATE products
      SET images = array_remove(images, $1), updated_at = NOW()
      WHERE id = $2 RETURNING images
    `, [filename, productId]);

    deleteFile(filename, 'images');
    res.json({ success: true, images: result.rows[0]?.images || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao eliminar imagem' });
  }
};

exports.replaceProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    const current = await client.query('SELECT images FROM products WHERE id = $1', [productId]);
    (current.rows[0]?.images || []).forEach(img => deleteFile(img, 'images'));

    const newFilenames = files.map(f => f.filename);
    const result = await client.query(`
      UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images
    `, [newFilenames, productId]);

    res.json({ success: true, images: result.rows[0]?.images || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao substituir imagens' });
  }
};

exports.reorderProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const { images } = req.body;
    if (!Array.isArray(images)) return res.status(400).json({ error: 'Array de imagens inválido' });

    const current = await client.query('SELECT images FROM products WHERE id = $1', [productId]);
    const currentImages = current.rows[0]?.images || [];
    const validImages = images.filter(img => currentImages.includes(img));

    const result = await client.query(`
      UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images
    `, [validImages, productId]);

    res.json({ success: true, images: result.rows[0]?.images || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reordenar imagens' });
  }
};