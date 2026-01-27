const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('./db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;
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

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    if (!isStrongPassword(password))
      return res.status(400).json({ error: 'Password fraca' });

    const exists = await client.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );

    if (exists.rows.length)
      return res.status(400).json({ error: 'Email já registado' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,'user')
       RETURNING id,name,email,role`,
      [name, email, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro no register:', err);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  const result = await client.query(
    'SELECT * FROM users WHERE email=$1 OR name=$1',
    [identifier]
  );

  if (!result.rows.length)
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match)
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '1d' }
  );

  res.json({
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email, // <--- adicionado
    role: user.role
  }
});

});
const authMiddleware = require('./middlewares/auth.middleware');

router.get('/validate', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// CONFIGURAÇÃO DO NODMAILER
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro serviço de email
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ROTA PARA ESQUECI A PASSWORD
const controller = require('./controllers/forgot.controller');


router.post('/forgot-password', controller.forgotPassword);

module.exports = router;
