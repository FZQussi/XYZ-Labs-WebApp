// backend/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('./db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// ============================
// MIDDLEWARE: VALIDAR TOKEN
// ============================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: 'Token em falta' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // disponível nas rotas seguintes
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ============================
// MIDDLEWARE: APENAS ADMIN
// ============================
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

// ============================
// REGISTO
// ============================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    const existing = await client.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );

    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Email já registado' });

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
// LOGIN
// ============================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await client.query(
      'SELECT * FROM users WHERE email=$1',
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Credenciais inválidas' });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ============================
// VALIDAR TOKEN (frontend usa)
// ============================
router.get('/validate', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = {
  router,
  authMiddleware,
  adminOnly
};
