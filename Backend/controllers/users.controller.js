const client = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

function isStrongPassword(password) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// ===== GET ALL USERS =====
exports.getAllUsers = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        id, name, email, role, created_at,
        last_login_at, last_login_ip, last_login_country, last_login_city,
        login_count,
        address_street, address_postal, address_city, address_country
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter utilizadores:', err);
    res.status(500).json({ error: 'Erro ao obter utilizadores' });
  }
};

// ===== GET USER BY ID =====
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await client.query(`
      SELECT 
        id, name, email, role, created_at,
        last_login_at, last_login_ip, last_login_country, last_login_city,
        login_count,
        address_street, address_postal, address_city, address_country
      FROM users
      WHERE id = $1
    `, [userId]);

    if (!result.rows.length)
      return res.status(404).json({ error: 'Utilizador não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter utilizador:', err);
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
};

// ===== GET MY PROFILE (utilizador autenticado vê o seu próprio perfil) =====
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await client.query(`
      SELECT 
        id, name, email, role, created_at,
        last_login_at, last_login_ip, last_login_country, last_login_city,
        login_count,
        address_street, address_postal, address_city, address_country
      FROM users
      WHERE id = $1
    `, [userId]);

    if (!result.rows.length)
      return res.status(404).json({ error: 'Utilizador não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
};

// ===== UPDATE MY PROFILE (utilizador autenticado atualiza o próprio perfil) =====
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, address_street, address_postal, address_city, address_country } = req.body;

    const fields = [];
    const values = [];
    let i = 1;

    if (name) { fields.push(`name = $${i++}`); values.push(name); }
    if (address_street !== undefined) { fields.push(`address_street = $${i++}`); values.push(address_street); }
    if (address_postal !== undefined) { fields.push(`address_postal = $${i++}`); values.push(address_postal); }
    if (address_city !== undefined) { fields.push(`address_city = $${i++}`); values.push(address_city); }
    if (address_country !== undefined) { fields.push(`address_country = $${i++}`); values.push(address_country); }

    if (fields.length === 0)
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    values.push(userId);

    const result = await client.query(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING id, name, email, role,
                address_street, address_postal, address_city, address_country
    `, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

// ===== GET MY ORDERS (utilizador vê as suas próprias encomendas) =====
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obter encomendas do utilizador incluindo dados de envio
    const ordersResult = await client.query(`
      SELECT 
        o.id,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.notes,
        o.address_street,
        o.address_postal,
        o.address_city,
        o.address_country,
        o.tracking_code,
        o.tracking_carrier
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);

    // Para cada order, buscar os items
    const orders = await Promise.all(ordersResult.rows.map(async (order) => {
      const itemsResult = await client.query(`
        SELECT 
          oi.id, oi.quantity, oi.price,
          oi.product_name, oi.material_name, oi.color_name,
          oi.material_multiplier, oi.color_multiplier,
          p.name as product_name_live, p.slug,
          p.images
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1
      `, [order.id]);

      return {
        ...order,
        items: itemsResult.rows
      };
    }));

    res.json(orders);
  } catch (err) {
    console.error('Erro ao obter encomendas:', err);
    res.status(500).json({ error: 'Erro ao obter encomendas' });
  }
};


// ===== GET LOGIN HISTORY =====
exports.getMyLoginHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await client.query(`
      SELECT id, ip, country, city, user_agent, logged_at
      FROM login_history
      WHERE user_id = $1
      ORDER BY logged_at DESC
      LIMIT 20
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter histórico de logins:', err);
    res.status(500).json({ error: 'Erro ao obter histórico' });
  }
};

// ===== CREATE USER (Admin) =====
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    if (!isStrongPassword(password))
      return res.status(400).json({ error: 'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial' });

    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length)
      return res.status(400).json({ error: 'Email já registado' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `, [name, email, password_hash, role || 'user']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar utilizador:', err);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
};

// ===== UPDATE USER (Admin) =====
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, password } = req.body;

    const fields = [];
    const values = [];
    let i = 1;

    if (name) { fields.push(`name = $${i++}`); values.push(name); }

    if (email) {
      const emailExists = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailExists.rows.length)
        return res.status(400).json({ error: 'Email já está a ser usado por outro utilizador' });
      fields.push(`email = $${i++}`);
      values.push(email);
    }

    if (role) { fields.push(`role = $${i++}`); values.push(role); }

    if (password) {
      if (!isStrongPassword(password))
        return res.status(400).json({ error: 'Password fraca.' });
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push(`password_hash = $${i++}`);
      values.push(password_hash);
    }

    if (fields.length === 0)
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    values.push(userId);

    const result = await client.query(`
      UPDATE users SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING id, name, email, role, created_at
    `, values);

    if (!result.rows.length)
      return res.status(404).json({ error: 'Utilizador não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar utilizador:', err);
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
};

// ===== DELETE USER (Admin) =====
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;

    if (userId == adminId)
      return res.status(400).json({ error: 'Não podes eliminar a tua própria conta' });

    const userExists = await client.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (!userExists.rows.length)
      return res.status(404).json({ error: 'Utilizador não encontrado' });

    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ success: true, message: 'Utilizador eliminado com sucesso' });
  } catch (err) {
    console.error('Erro ao eliminar utilizador:', err);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
};

// ===== GET USER STATISTICS (Admin) =====
exports.getUserStats = async (req, res) => {
  try {
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
        COUNT(*) FILTER (WHERE role = 'user') as total_users_regular,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30days
      FROM users
    `);
    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Erro ao obter estatísticas:', err);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};