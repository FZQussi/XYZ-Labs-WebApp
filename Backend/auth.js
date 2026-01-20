// backend/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('./db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'xyzlabs-secret'; // define no .env

// ============================
// REGISTO DE UTILIZADOR
// ============================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verifica se email já existe
    const existing = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já registado' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name, email, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no registo' });
  }
});

// ============================
// LOGIN DE UTILIZADOR
// ============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await client.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
});

module.exports = router;
