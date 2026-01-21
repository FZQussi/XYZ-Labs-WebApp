// backend/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('./db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

// ============================
// PASSWORD POLICY
// ============================
function isStrongPassword(password) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}


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
    req.user = decoded;
    next();
  } catch {
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
// REGISTO (USER NORMAL)
// ============================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    if (!isStrongPassword(password))
      return res.status(400).json({
        error: 'Password fraca'
      });

    const existing = await client.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );

    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Email já registado' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
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
// LOGIN (EMAIL OU USERNAME)
// ============================
router.post('/login', async (req, res) => {
  try {
    const identifier = req.body.identifier?.trim(); // ⬅️ trim seguro
    const password = req.body.password;

    console.log('Login recebido:', { identifier, password: password ? '[oculto]' : null });

    const result = await client.query(
      `SELECT * FROM users
       WHERE email=$1 OR name=$1`,
      [identifier]
    );

    console.log('Resultado da query:', result.rows);

    if (result.rows.length === 0) {
      console.warn('Utilizador não encontrado');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    console.log('User encontrado:', { id: user.id, name: user.name, role: user.role });

    const match = await bcrypt.compare(password, user.password_hash);
    console.log('Password corresponde?', match);

    if (!match) {
      console.warn('Password incorreta');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role
      },
      SECRET,
      { expiresIn: '1d' }
    );

    console.log('Token gerado para user:', user.name);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro no login' });
  }
});



// ============================
// VALIDAR TOKEN
// ============================
router.get('/validate', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});
router.get('/profile', authMiddleware, (req, res) => {
  console.log('Acedendo /profile com user:', req.user);
  res.json({ message: `Olá ${req.user.name}, esta é a tua página!` });
});
router.get('/admin/dashboard', authMiddleware, adminOnly, (req, res) => {
  console.log('Acedendo /admin/dashboard com user:', req.user);
  res.json({ message: 'Bem-vindo ao Dashboard de Admin!' });
});
module.exports = {
  router,
  authMiddleware,
  adminOnly
};
