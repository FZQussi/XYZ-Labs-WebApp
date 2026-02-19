// controllers/reset.controller.js
const client = require('../db');
const bcrypt = require('bcrypt');
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

// ===== CONTROLADOR =====
exports.resetPassword = async (req, res) => {
  try {
    console.log('Pedido reset-password recebido:', req.body);

    const { token, password } = req.body;
    if (!token || !password) {
      console.log('Campos obrigatórios em falta');
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });
    }

    if (!isStrongPassword(password)) {
      console.log('Password não cumpre requisitos de segurança');
      return res.status(400).json({
        error: 'Password fraca. Mínimo 12 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial'
      });
    }

    // Verificar token na base de dados
    const tokenResult = await client.query(
      'SELECT user_id, expires FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (!tokenResult.rows.length) {
      console.log('Token inválido ou não encontrado');
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const { user_id, expires } = tokenResult.rows[0];
    console.log('Token válido encontrado para user_id:', user_id, 'Expira em:', expires);

    if (new Date() > new Date(expires)) {
      console.log('Token expirado');
      return res.status(400).json({ error: 'Token expirado' });
    }

    // Atualizar password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, user_id]);
    console.log('Password atualizada para user_id:', user_id);

    // Apagar token
    await client.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
    console.log('Token eliminado da base de dados');

    res.json({ message: 'Password redefinida com sucesso' });
  } catch (err) {
    console.error('Erro reset-password:', err);
    res.status(500).json({ error: 'Erro ao redefinir password' });
  }
};
