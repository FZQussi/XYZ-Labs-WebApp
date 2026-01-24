const client = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// ===== VALIDAÇÃO DE PASSWORD =====
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
        id, 
        name, 
        email, 
        role, 
        created_at,
        (SELECT COUNT(*) FROM products WHERE id = users.id) as products_count
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
        id, 
        name, 
        email, 
        role, 
        created_at
      FROM users
      WHERE id = $1
    `, [userId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter utilizador:', err);
    res.status(500).json({ error: 'Erro ao obter utilizador' });
  }
};

// ===== CREATE USER (Admin cria utilizador) =====
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validações
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: 'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial' 
      });
    }

    // Verificar se email já existe
    const exists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (exists.rows.length) {
      return res.status(400).json({ error: 'Email já registado' });
    }

    // Hash da password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Criar utilizador
    const result = await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `, [name, email, password_hash, role || 'user']);

    console.log('✅ Utilizador criado:', result.rows[0].email);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('Erro ao criar utilizador:', err);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
};

// ===== UPDATE USER =====
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, password } = req.body;

    const fields = [];
    const values = [];
    let i = 1;

    // Nome
    if (name) {
      fields.push(`name = $${i++}`);
      values.push(name);
    }

    // Email (verificar se já existe)
    if (email) {
      const emailExists = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailExists.rows.length) {
        return res.status(400).json({ error: 'Email já está a ser usado por outro utilizador' });
      }

      fields.push(`email = $${i++}`);
      values.push(email);
    }

    // Role
    if (role) {
      fields.push(`role = $${i++}`);
      values.push(role);
    }

    // Password (se fornecida)
    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json({ 
          error: 'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial' 
        });
      }

      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push(`password_hash = $${i++}`);
      values.push(password_hash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(userId);

    const result = await client.query(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING id, name, email, role, created_at
    `, values);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    console.log('✅ Utilizador atualizado:', result.rows[0].email);
    res.json(result.rows[0]);

  } catch (err) {
    console.error('Erro ao atualizar utilizador:', err);
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
};

// ===== DELETE USER =====
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id; // ID do admin que está a fazer o pedido

    // Impedir admin de se eliminar a si próprio
    if (userId == adminId) {
      return res.status(400).json({ 
        error: 'Não podes eliminar a tua própria conta' 
      });
    }

    // Verificar se utilizador existe
    const userExists = await client.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (!userExists.rows.length) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    // Eliminar utilizador
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('✅ Utilizador eliminado:', userExists.rows[0].email);
    res.json({ 
      success: true, 
      message: 'Utilizador eliminado com sucesso' 
    });

  } catch (err) {
    console.error('Erro ao eliminar utilizador:', err);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
};

// ===== GET USER STATISTICS =====
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