// controllers/reset.controller.js
const client = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const SALT_ROUNDS = 12;

// ===== VALIDAR PASSWORD =====
function isStrongPassword(password) {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// ===== HASH TOKEN (SHA-256) =====
// Mirrors the hashing logic in forgot.controller.js
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ===== CONTROLADOR =====
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial'
      });
    }

    // Hash the incoming raw token — compare against stored hash
    const tokenHash = hashToken(token);

    const tokenResult = await client.query(
      'SELECT user_id, expires FROM password_reset_tokens WHERE token = $1',
      [tokenHash]
    );

    if (!tokenResult.rows.length) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const { user_id, expires } = tokenResult.rows[0];

    if (new Date() > new Date(expires)) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user_id]);

    // One-time use — delete hash immediately after successful reset
    await client.query('DELETE FROM password_reset_tokens WHERE token = $1', [tokenHash]);
    console.log('Password redefinida para user_id:', user_id);

    res.json({ message: 'Password redefinida com sucesso' });
  } catch (err) {
    console.error('Erro reset-password:', err);
    res.status(500).json({ error: 'Erro ao redefinir password' });
  }
};
