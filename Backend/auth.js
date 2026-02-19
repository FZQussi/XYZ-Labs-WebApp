const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const client = require('./db');
const { loginLimiter, registerLimiter } = require('./middlewares/rateLimiter.middleware');
const { recordFailure, clearAttempts, isLocked, getRemainingSeconds } = require('./middlewares/loginTracker.middleware');
const MAX_ATTEMPTS = 5; // must match loginTracker.middleware.js

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

// ===== Obter IP real do cliente =====
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

// ===== Geolocalização por IP (usando ip-api.com - gratuito, sem key) =====
async function getIPLocation(ip) {
  try {
    // Ignorar IPs locais
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { country: 'Local', city: 'Localhost' };
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`);
    const data = await res.json();
    if (data.status === 'success') {
      return { country: data.country, city: data.city };
    }
  } catch (_) { }
  return { country: 'Desconhecido', city: 'Desconhecido' };
}

// ===== REGISTER =====
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    if (!isStrongPassword(password))
      return res.status(400).json({ error: 'Password fraca' });

    const exists = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length)
      return res.status(400).json({ error: 'Email já registado' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,'user')
       RETURNING id, name, email, role`,
      [name, email, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro no register:', err);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
});

// ===== LOGIN =====
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    const ip = getClientIP(req);

    // ─── Account lockout check (by IP + by identifier) ───────────────
    const ipKey = `ip:${ip}`;
    const idKey = `id:${identifier.toLowerCase()}`;

    if (isLocked(ipKey)) {
      return res.status(429).json({
        error: `Demasiadas tentativas. Conta bloqueada por ${getRemainingSeconds(ipKey)}s.`
      });
    }
    if (isLocked(idKey)) {
      return res.status(429).json({
        error: `Demasiadas tentativas. Conta bloqueada por ${getRemainingSeconds(idKey)}s.`
      });
    }

    const result = await client.query(
      'SELECT * FROM users WHERE email=$1 OR name=$1',
      [identifier]
    );

    // ─── Wrong identifier ─────────────────────────────────────────────
    if (!result.rows.length) {
      recordFailure(ipKey);
      recordFailure(idKey);
      // Generic error — don't reveal whether the user exists
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    // ─── Wrong password ───────────────────────────────────────────────
    if (!match) {
      const afterIP = recordFailure(ipKey);
      const afterID = recordFailure(idKey);
      const remaining = MAX_ATTEMPTS - afterIP.count;
      const willLock = afterIP.count >= MAX_ATTEMPTS || afterID.count >= MAX_ATTEMPTS;

      return res.status(401).json({
        error: willLock
          ? `Conta bloqueada por 15 minutos após demasiadas tentativas.`
          : `Credenciais inválidas. ${remaining > 0 ? remaining + ' tentativas restantes.' : ''}`
      });
    }

    // ─── Success — clear lockout counters ─────────────────────────────
    clearAttempts(ipKey);
    clearAttempts(idKey);

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      SECRET,
      { expiresIn: '1d' }
    );

    // ─── Login tracking in background ────────────────────────────────
    const userAgent = req.headers['user-agent'] || '';

    setImmediate(async () => {
      try {
        const location = await getIPLocation(ip);

        await client.query(`
          UPDATE users SET
            last_login_at      = NOW(),
            last_login_ip      = $1,
            last_login_country = $2,
            last_login_city    = $3,
            login_count        = COALESCE(login_count, 0) + 1
          WHERE id = $4
        `, [ip, location.country, location.city, user.id]);

        await client.query(`
          INSERT INTO login_history (user_id, ip, country, city, user_agent)
          VALUES ($1, $2, $3, $4, $5)
        `, [user.id, ip, location.country, location.city, userAgent]);
      } catch (err) {
        console.error('Erro ao guardar login tracking:', err);
      }
    });

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
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ===== VALIDATE =====
const authMiddleware = require('./middlewares/auth.middleware');

router.get('/validate', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ===== FORGOT PASSWORD =====
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const controller = require('./controllers/forgot.controller');
router.post('/forgot-password', controller.forgotPassword);

module.exports = router;