const client = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// ===== VALIDAÇÃO DE PASSWORD =====
function isStrongPassword(password) {
  const rules = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  return Object.values(rules).every(Boolean);
}

// ===== HASH TOKEN (SHA-256) =====
// The raw token is sent in the email link. Only a SHA-256 hash is stored in
// the database so that even a full DB dump cannot be used to trigger resets.
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ===== ENVIO DE EMAIL =====
async function sendRecoveryEmail(email, rawToken, origin) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const resetLink = `${origin}/Frontend/userpages/html/reset-password.html?token=${rawToken}&email=${email}`;

    const mailOptions = {
      from: `"XYZ Labs" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperação de Password',
      html: `
        <h2>Recuperação de Password</h2>
        <p>Clica no link abaixo para redefinir a tua password. O link expira em 1 hora.</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Se não pediste a recuperação, ignora este email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email de recuperação enviado para:', email);
  } catch (err) {
    console.error('Erro ao enviar email de recuperação:', err);
    throw err;
  }
}

// ===== CONTROLADOR FORGOT PASSWORD =====
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    // ─── SECURITY: Always return same response (no user enumeration) ──
    if (userResult.rows.length) {
      const userId = userResult.rows[0].id;

      // Generate raw token (sent in email) and hashed token (stored in DB)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(rawToken);
      const expires = Date.now() + 3600_000; // 1 hour

      // Store only the HASH — raw token never touches the DB
      await client.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires)
         VALUES ($1, $2, to_timestamp($3 / 1000.0))`,
        [userId, tokenHash, expires]
      );

      const origin = req.headers.origin || 'http://127.0.0.1:5500';
      await sendRecoveryEmail(email, rawToken, origin);
    } else {
      // Timing-safe delay — prevents enumeration via response time difference
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Always the same response — attacker cannot know if email exists
    res.json({ message: 'Se esse email estiver registado, receberás instruções em breve.' });
  } catch (err) {
    console.error('Erro forgot password:', err);
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
};

// ===== CONTROLADOR RESET PASSWORD =====
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial'
      });
    }

    // Hash the incoming token and look up the hash — never query with raw token
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
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      password_hash,
      user_id
    ]);

    // Delete hash after one-time use
    await client.query('DELETE FROM password_reset_tokens WHERE token = $1', [tokenHash]);
    console.log('Password redefinida para user_id:', user_id);

    res.json({ message: 'Password redefinida com sucesso' });
  } catch (err) {
    console.error('Erro reset password:', err);
    res.status(500).json({ error: 'Erro ao redefinir password' });
  }
};
