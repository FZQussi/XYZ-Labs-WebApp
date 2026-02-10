// Backend/controllers/attributes.controller.js
const client = require('../db');

// ===== GET ATTRIBUTES BY SUBCATEGORY =====
exports.getAttributesBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    
    const result = await client.query(`
      SELECT 
        id,
        attribute_name,
        attribute_type,
        attribute_options,
        is_required,
        display_order
      FROM subcategory_attributes
      WHERE subcategory_id = $1
      ORDER BY display_order, attribute_name
    `, [subcategoryId]);

    // Parse JSON options
    const attributes = result.rows.map(attr => ({
      ...attr,
      attribute_options: attr.attribute_options ? JSON.parse(attr.attribute_options) : null
    }));

    res.json(attributes);
  } catch (err) {
    console.error('Erro ao obter atributos:', err);
    res.status(500).json({ error: 'Erro ao obter atributos' });
  }
};

// ===== CREATE ATTRIBUTE =====
exports.createAttribute = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { attribute_name, attribute_type, attribute_options, is_required, display_order } = req.body;

    if (!attribute_name || !attribute_type) {
      return res.status(400).json({ error: 'Nome e tipo do atributo são obrigatórios' });
    }

    // Validar e serializar options
    let optionsJson = null;
    if (attribute_options) {
      if (Array.isArray(attribute_options)) {
        optionsJson = JSON.stringify(attribute_options);
      } else if (typeof attribute_options === 'string') {
        optionsJson = attribute_options;
      }
    }

    const result = await client.query(`
      INSERT INTO subcategory_attributes 
        (subcategory_id, attribute_name, attribute_type, attribute_options, is_required, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      subcategoryId,
      attribute_name,
      attribute_type,
      optionsJson,
      is_required || false,
      display_order || 0
    ]);

    const attribute = {
      ...result.rows[0],
      attribute_options: result.rows[0].attribute_options 
        ? JSON.parse(result.rows[0].attribute_options) 
        : null
    };

    console.log('✅ Atributo criado:', attribute.attribute_name);
    res.status(201).json(attribute);

  } catch (err) {
    console.error('Erro ao criar atributo:', err);
    
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Atributo já existe para esta subcategoria' });
    }
    
    res.status(500).json({ error: 'Erro ao criar atributo' });
  }
};

// ===== UPDATE ATTRIBUTE =====
exports.updateAttribute = async (req, res) => {
  try {
    const { attributeId } = req.params;
    const { attribute_name, attribute_type, attribute_options, is_required, display_order } = req.body;

    const fields = [];
    const values = [];
    let i = 1;

    if (attribute_name !== undefined) {
      fields.push(`attribute_name = $${i++}`);
      values.push(attribute_name);
    }

    if (attribute_type !== undefined) {
      fields.push(`attribute_type = $${i++}`);
      values.push(attribute_type);
    }

    if (attribute_options !== undefined) {
      let optionsJson = null;
      if (attribute_options) {
        if (Array.isArray(attribute_options)) {
          optionsJson = JSON.stringify(attribute_options);
        } else if (typeof attribute_options === 'string') {
          optionsJson = attribute_options;
        }
      }
      fields.push(`attribute_options = $${i++}`);
      values.push(optionsJson);
    }

    if (is_required !== undefined) {
      fields.push(`is_required = $${i++}`);
      values.push(is_required);
    }

    if (display_order !== undefined) {
      fields.push(`display_order = $${i++}`);
      values.push(display_order);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(attributeId);

    const result = await client.query(`
      UPDATE subcategory_attributes
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING *
    `, values);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Atributo não encontrado' });
    }

    const attribute = {
      ...result.rows[0],
      attribute_options: result.rows[0].attribute_options 
        ? JSON.parse(result.rows[0].attribute_options) 
        : null
    };

    console.log('✅ Atributo atualizado:', attribute.attribute_name);
    res.json(attribute);

  } catch (err) {
    console.error('Erro ao atualizar atributo:', err);
    res.status(500).json({ error: 'Erro ao atualizar atributo' });
  }
};

// ===== DELETE ATTRIBUTE =====
exports.deleteAttribute = async (req, res) => {
  try {
    const { attributeId } = req.params;

    const result = await client.query(`
      DELETE FROM subcategory_attributes
      WHERE id = $1
      RETURNING attribute_name
    `, [attributeId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Atributo não encontrado' });
    }

    console.log('✅ Atributo eliminado:', result.rows[0].attribute_name);
    res.json({ success: true, message: 'Atributo eliminado com sucesso' });

  } catch (err) {
    console.error('Erro ao eliminar atributo:', err);
    res.status(500).json({ error: 'Erro ao eliminar atributo' });
  }
};

// ===== GET ALL ATTRIBUTES (for management) =====
exports.getAllAttributes = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        sa.*,
        s.name as subcategory_name,
        c.name as category_name
      FROM subcategory_attributes sa
      JOIN subcategories s ON sa.subcategory_id = s.id
      JOIN categories c ON s.category_id = c.id
      ORDER BY c.name, s.name, sa.display_order
    `);

    const attributes = result.rows.map(attr => ({
      ...attr,
      attribute_options: attr.attribute_options ? JSON.parse(attr.attribute_options) : null
    }));

    res.json(attributes);
  } catch (err) {
    console.error('Erro ao obter todos os atributos:', err);
    res.status(500).json({ error: 'Erro ao obter atributos' });
  }
};