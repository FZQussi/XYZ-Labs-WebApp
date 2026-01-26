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
  const allValid = Object.values(rules).every(Boolean);
  console.log('Password validação:', rules, '->', allValid);
  return allValid;
}

// ===== ENVIO DE EMAIL =====
async function sendRecoveryEmail(email, token, origin) {
  try {
    console.log('Preparando envio de email para:', email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const resetLink = `${origin}/Frontend/userpages/html/reset-password.html?token=${token}&email=${email}`;
    console.log('Reset link:', resetLink);

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
    console.log('Email enviado com sucesso para:', email);
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    throw err;
  }
}

// ===== CONTROLADOR FORGOT PASSWORD =====
exports.forgotPassword = async (req, res) => {
  try {
    console.log('Pedido de forgot password recebido:', req.body);

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (!userResult.rows.length) {
      console.log('Email não encontrado:', email);
      return res.status(404).json({ error: 'Email não encontrado' });
    }

    const userId = userResult.rows[0].id;
    console.log('Utilizador encontrado:', userId);

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600_000; // 1 hora
    console.log('Token gerado:', token);

    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires)
       VALUES ($1, $2, to_timestamp($3 / 1000.0))`,
      [userId, token, expires]
    );
    console.log('Token guardado na base de dados');

    const origin = req.headers.origin || 'http://127.0.0.1:58857';
    await sendRecoveryEmail(email, token, origin);

    res.json({ message: 'Instruções enviadas para o teu email' });
  } catch (err) {
    console.error('Erro forgot password:', err);
    res.status(500).json({ error: 'Erro ao processar pedido' });
  }
};

// ===== CONTROLADOR RESET PASSWORD =====
exports.resetPassword = async (req, res) => {
  try {
    console.log('Pedido de reset password recebido:', req.body);

    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial'
      });
    }

    const tokenResult = await client.query(
      'SELECT user_id, expires FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (!tokenResult.rows.length) {
      console.log('Token inválido ou expirado:', token);
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const { user_id, expires } = tokenResult.rows[0];
    if (new Date() > new Date(expires)) {
      console.log('Token expirado:', token);
      return res.status(400).json({ error: 'Token expirado' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      password_hash,
      user_id
    ]);
    console.log('Password atualizada para o user:', user_id);

    await client.query('DELETE FROM password_reset_tokens WHERE token = $1', [
      token
    ]);
    console.log('Token eliminado da base de dados:', token);

    res.json({ message: 'Password redefinida com sucesso' });
  } catch (err) {
    console.error('Erro reset password:', err);
    res.status(500).json({ error: 'Erro ao redefinir password' });
  }
};

