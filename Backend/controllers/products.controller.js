// Backend/controllers/products.controller.js
'use strict';

const client     = require('../db');
const fs         = require('fs');
const path       = require('path');
const cloudinary = require('../utils/cloudinary');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function deleteCloudinaryImage(url) {
  try {
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    if (matches) await cloudinary.uploader.destroy(matches[1]);
  } catch (err) {
    console.error('Erro ao apagar imagem do Cloudinary:', err);
  }
}

// Campos de promoção permitidos no UPDATE dinâmico
const PROMO_FIELDS = ['is_on_promotion', 'discount_percent', 'promotion_start', 'promotion_end', 'promotion_label'];

// ─────────────────────────────────────────────
// GET ALL PRODUCTS
// ─────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        p.*,
        CASE
          WHEN p.is_on_promotion AND p.discount_percent IS NOT NULL
          THEN ROUND(p.price * (1 - p.discount_percent::numeric / 100), 2)
          ELSE NULL
        END AS price_discounted,
        row_to_json(pc_main) AS primary_category,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id',            c.id,
              'name',          c.name,
              'category_role', c.category_role
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS secondary_categories,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'tag_id',      ft.id,
              'tag_name',    ft.tag_name,
              'tag_key',     ft.tag_key,
              'filter_id',   cf.id,
              'filter_name', cf.filter_name,
              'filter_key',  cf.filter_key,
              'filter_type', cf.filter_type
            )
          ) FILTER (WHERE ft.id IS NOT NULL),
          '[]'
        ) AS filter_tags
      FROM products p
      LEFT JOIN primary_categories  pc_main ON pc_main.id      = p.primary_category_id
      LEFT JOIN product_categories  pcat    ON pcat.product_id = p.id
      LEFT JOIN categories          c       ON c.id            = pcat.category_id
      LEFT JOIN product_filter_tags pft     ON pft.product_id  = p.id
      LEFT JOIN filter_tags         ft      ON ft.id           = pft.filter_tag_id
      LEFT JOIN category_filters    cf      ON cf.id           = ft.filter_id
      WHERE p.is_active = true
      GROUP BY
        p.id,
        pc_main.id, pc_main.name, pc_main.slug,
        pc_main.description, pc_main.image,
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

// ─────────────────────────────────────────────
// GET PRODUCT BY ID
// ─────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        p.*,
        CASE
          WHEN p.is_on_promotion AND p.discount_percent IS NOT NULL
          THEN ROUND(p.price * (1 - p.discount_percent::numeric / 100), 2)
          ELSE NULL
        END AS price_discounted,
        row_to_json(pc_main) AS primary_category,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id',            c.id,
              'name',          c.name,
              'category_role', c.category_role
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS secondary_categories,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'tag_id',      ft.id,
              'tag_name',    ft.tag_name,
              'tag_key',     ft.tag_key,
              'filter_id',   cf.id,
              'filter_name', cf.filter_name,
              'filter_key',  cf.filter_key,
              'filter_type', cf.filter_type
            )
          ) FILTER (WHERE ft.id IS NOT NULL),
          '[]'
        ) AS filter_tags
      FROM products p
      LEFT JOIN primary_categories  pc_main ON pc_main.id      = p.primary_category_id
      LEFT JOIN product_categories  pcat    ON pcat.product_id = p.id
      LEFT JOIN categories          c       ON c.id            = pcat.category_id
      LEFT JOIN product_filter_tags pft     ON pft.product_id  = p.id
      LEFT JOIN filter_tags         ft      ON ft.id           = pft.filter_tag_id
      LEFT JOIN category_filters    cf      ON cf.id           = ft.filter_id
      WHERE p.id = $1
      GROUP BY
        p.id,
        pc_main.id, pc_main.name, pc_main.slug,
        pc_main.description, pc_main.image,
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

// ─────────────────────────────────────────────
// GET PRODUCTS ON PROMOTION
// ─────────────────────────────────────────────
exports.getPromotions = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        p.*,
        ROUND(p.price * (1 - p.discount_percent::numeric / 100), 2) AS price_discounted,
        row_to_json(pc_main) AS primary_category
      FROM products p
      LEFT JOIN primary_categories pc_main ON pc_main.id = p.primary_category_id
      WHERE p.is_active = true
        AND p.is_on_promotion = true
        AND p.discount_percent IS NOT NULL
      ORDER BY p.discount_percent DESC, p.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter promoções:', err);
    res.status(500).json({ error: 'Erro ao obter promoções' });
  }
};

// ─────────────────────────────────────────────
// SET / UPDATE PROMOTION ON A PRODUCT
// ─────────────────────────────────────────────
exports.setPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      is_on_promotion,
      discount_percent,
      promotion_start,
      promotion_end,
      promotion_label
    } = req.body;

    // Validações
    if (is_on_promotion && (discount_percent == null || discount_percent < 1 || discount_percent > 99)) {
      return res.status(400).json({ error: 'Desconto deve ser entre 1% e 99%' });
    }

    if (promotion_end && promotion_start && new Date(promotion_end) <= new Date(promotion_start)) {
      return res.status(400).json({ error: 'A data de fim deve ser posterior à data de início' });
    }

    const result = await client.query(
      `UPDATE products
       SET
         is_on_promotion  = $1,
         discount_percent = $2,
         promotion_start  = $3,
         promotion_end    = $4,
         promotion_label  = $5,
         updated_at       = NOW()
       WHERE id = $6
       RETURNING id, name, price, is_on_promotion, discount_percent,
                 promotion_start, promotion_end, promotion_label,
                 CASE WHEN is_on_promotion AND discount_percent IS NOT NULL
                      THEN ROUND(price * (1 - discount_percent::numeric / 100), 2)
                      ELSE NULL END AS price_discounted`,
      [
        is_on_promotion ?? false,
        is_on_promotion ? (discount_percent || null) : null,
        promotion_start || null,
        promotion_end   || null,
        is_on_promotion ? (promotion_label || null) : null,
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    console.log(`Promoção ${is_on_promotion ? 'ativada' : 'desativada'} no produto ${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao definir promoção:', err);
    res.status(500).json({ error: err.message || 'Erro ao definir promoção' });
  }
};

// ─────────────────────────────────────────────
// REMOVE PROMOTION (atalho — coloca is_on_promotion=false)
// ─────────────────────────────────────────────
exports.removePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `UPDATE products
       SET is_on_promotion = false,
           discount_percent = NULL,
           promotion_start  = NULL,
           promotion_end    = NULL,
           promotion_label  = NULL,
           updated_at       = NOW()
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('Erro ao remover promoção:', err);
    res.status(500).json({ error: 'Erro ao remover promoção' });
  }
};

// ─────────────────────────────────────────────
// CREATE PRODUCT
// ─────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  const dbClient = await client.connect();
  try {
    await dbClient.query('BEGIN');

    const {
      name,
      description,
      price,
      primary_category_id,
      secondary_category_ids,
      filter_tag_ids
    } = req.body;

    const model_file = req.file?.filename || null;
    const stock      = req.body.stock === 'true' || req.body.stock === true;

    if (!primary_category_id) {
      throw new Error('Categoria principal é obrigatória');
    }

    const productResult = await dbClient.query(
      `INSERT INTO products
         (name, description, price, model_file, stock, images, primary_category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, model_file, stock, [], primary_category_id]
    );
    const product = productResult.rows[0];

    if (secondary_category_ids) {
      const secIds = typeof secondary_category_ids === 'string'
        ? JSON.parse(secondary_category_ids)
        : secondary_category_ids;

      for (const catId of secIds) {
        await dbClient.query(
          `INSERT INTO product_categories (product_id, category_id, is_primary)
           VALUES ($1, $2, false)
           ON CONFLICT (product_id, category_id) DO NOTHING`,
          [product.id, catId]
        );
      }
    }

    if (filter_tag_ids) {
      const tagIds = typeof filter_tag_ids === 'string'
        ? JSON.parse(filter_tag_ids)
        : filter_tag_ids;

      for (const tagId of tagIds) {
        await dbClient.query(
          `INSERT INTO product_filter_tags (product_id, filter_tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [product.id, tagId]
        );
      }

      if (tagIds.length > 0) {
        await dbClient.query(
          `UPDATE filter_tags
           SET product_count = product_count + 1
           WHERE id = ANY($1::bigint[])`,
          [tagIds]
        );
      }
    }

    await dbClient.query('COMMIT');
    console.log('Produto criado:', product.name);
    res.status(201).json(product);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar produto' });
  } finally {
    dbClient.release();
  }
};

// ─────────────────────────────────────────────
// UPDATE PRODUCT
// ─────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  const dbClient = await client.connect();
  try {
    await dbClient.query('BEGIN');

    const productId = req.params.id;

    if ('stock' in req.body) {
      req.body.stock = req.body.stock === 'true' || req.body.stock === true;
    }

    // Normalizar campos de promoção
    if ('is_on_promotion' in req.body) {
      req.body.is_on_promotion = req.body.is_on_promotion === 'true' || req.body.is_on_promotion === true;
    }
    if ('discount_percent' in req.body && req.body.discount_percent !== '') {
      req.body.discount_percent = parseInt(req.body.discount_percent, 10) || null;
    }

    const current = await dbClient.query(
      'SELECT model_file FROM products WHERE id = $1',
      [productId]
    );
    const oldModelFile = current.rows[0]?.model_file;

    const skipFields = ['secondary_category_ids', 'filter_tag_ids', 'images'];
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in req.body) {
      if (!skipFields.includes(key)) {
        fields.push(`${key} = $${i++}`);
        values.push(req.body[key]);
      }
    }

    if (req.file) {
      if (oldModelFile) {
        try {
          const p = path.join(__dirname, '../../Frontend/models', oldModelFile);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (_) { /* ignorar */ }
      }
      fields.push(`model_file = $${i++}`);
      values.push(req.file.filename);
    }

    if (fields.length > 0) {
      values.push(productId);
      await dbClient.query(
        `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
        values
      );
    }

    if (req.body.secondary_category_ids !== undefined) {
      const secIds = typeof req.body.secondary_category_ids === 'string'
        ? JSON.parse(req.body.secondary_category_ids)
        : req.body.secondary_category_ids;

      await dbClient.query(
        'DELETE FROM product_categories WHERE product_id = $1',
        [productId]
      );

      for (const catId of secIds) {
        await dbClient.query(
          `INSERT INTO product_categories (product_id, category_id, is_primary)
           VALUES ($1, $2, false)
           ON CONFLICT (product_id, category_id) DO NOTHING`,
          [productId, catId]
        );
      }
    }

    if (req.body.filter_tag_ids !== undefined) {
      const newTagIds = typeof req.body.filter_tag_ids === 'string'
        ? JSON.parse(req.body.filter_tag_ids)
        : req.body.filter_tag_ids;

      const currentTags = await dbClient.query(
        'SELECT filter_tag_id FROM product_filter_tags WHERE product_id = $1',
        [productId]
      );
      const oldTagIds = currentTags.rows.map(r => Number(r.filter_tag_id));

      const removed = oldTagIds.filter(id => !newTagIds.includes(id));
      if (removed.length > 0) {
        await dbClient.query(
          `UPDATE filter_tags
           SET product_count = GREATEST(0, product_count - 1)
           WHERE id = ANY($1::bigint[])`,
          [removed]
        );
      }

      const added = newTagIds.filter(id => !oldTagIds.includes(id));
      if (added.length > 0) {
        await dbClient.query(
          `UPDATE filter_tags
           SET product_count = product_count + 1
           WHERE id = ANY($1::bigint[])`,
          [added]
        );
      }

      await dbClient.query(
        'DELETE FROM product_filter_tags WHERE product_id = $1',
        [productId]
      );

      for (const tagId of newTagIds) {
        await dbClient.query(
          `INSERT INTO product_filter_tags (product_id, filter_tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [productId, tagId]
        );
      }
    }

    await dbClient.query('COMMIT');
    console.log('Produto atualizado:', productId);
    res.json({ success: true });
  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar produto' });
  } finally {
    dbClient.release();
  }
};

// ─────────────────────────────────────────────
// DELETE PRODUCT
// ─────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao eliminar produto:', err);
    res.status(500).json({ error: 'Erro ao eliminar produto' });
  }
};

// ─────────────────────────────────────────────
// CATEGORIAS PRIMÁRIAS
// ─────────────────────────────────────────────
exports.getPrimaryCategories = async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM primary_categories WHERE is_active = true ORDER BY display_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter categorias primárias:', err);
    res.status(500).json({ error: 'Erro ao obter categorias primárias' });
  }
};

exports.createPrimaryCategory = async (req, res) => {
  try {
    const { name, description, display_order } = req.body;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const result = await client.query(
      `INSERT INTO primary_categories (name, slug, description, display_order)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, slug, description || '', display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria primária:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar categoria primária' });
  }
};

exports.updatePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, display_order, is_active } = req.body;

    const result = await client.query(
      `UPDATE primary_categories
       SET name=$1, description=$2, display_order=$3, is_active=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [name, description, display_order, is_active, id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar categoria primária:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria primária' });
  }
};

exports.deletePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
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

// ─────────────────────────────────────────────
// CATEGORIAS SECUNDÁRIAS
// ─────────────────────────────────────────────
exports.getSecondaryCategories = async (req, res) => {
  try {
    const result = await client.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY display_order, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter categorias secundárias:', err);
    res.status(500).json({ error: 'Erro ao obter categorias secundárias' });
  }
};

exports.createSecondaryCategory = async (req, res) => {
  try {
    const { name, description, category_role, display_order } = req.body;
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const result = await client.query(
      `INSERT INTO categories (name, slug, description, category_role, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description || '', category_role || 'secondary', display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria secundária:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar categoria secundária' });
  }
};

exports.updateSecondaryCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_role, display_order, is_active } = req.body;

    const result = await client.query(
      `UPDATE categories
       SET name=$1, description=$2, category_role=$3, display_order=$4, is_active=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, description, category_role, display_order, is_active, id]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar categoria secundária:', err);
    res.status(500).json({ error: 'Erro ao atualizar categoria secundária' });
  }
};

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

// ─────────────────────────────────────────────
// IMAGENS (Cloudinary)
// ─────────────────────────────────────────────
exports.getProductImages = async (req, res) => {
  try {
    const result = await client.query(
      'SELECT images FROM products WHERE id = $1',
      [req.params.id]
    );
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

    const urls = files.map(f => f.path);

    const result = await client.query(
      `UPDATE products
       SET images = COALESCE(images, '{}') || $1, updated_at = NOW()
       WHERE id = $2 RETURNING images`,
      [urls, productId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const { filename } = req.body;

    if (!filename) return res.status(400).json({ error: 'URL da imagem não fornecida' });

    const result = await client.query(
      `UPDATE products
       SET images = array_remove(images, $1), updated_at = NOW()
       WHERE id = $2 RETURNING images`,
      [filename, productId]
    );

    await deleteCloudinaryImage(filename);
    res.json({ success: true, images: result.rows[0]?.images || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao eliminar imagem' });
  }
};

exports.replaceProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    const current = await client.query(
      'SELECT images FROM products WHERE id = $1',
      [productId]
    );
    for (const url of (current.rows[0]?.images || [])) {
      await deleteCloudinaryImage(url);
    }

    const newUrls = files.map(f => f.path);
    const result = await client.query(
      'UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images',
      [newUrls, productId]
    );
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

    const current = await client.query(
      'SELECT images FROM products WHERE id = $1',
      [productId]
    );
    const currentImages = current.rows[0]?.images || [];
    const validImages = images.filter(img => currentImages.includes(img));

    const result = await client.query(
      'UPDATE products SET images = $1, updated_at = NOW() WHERE id = $2 RETURNING images',
      [validImages, productId]
    );
    res.json({ success: true, images: result.rows[0]?.images || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao reordenar imagens' });
  }
};