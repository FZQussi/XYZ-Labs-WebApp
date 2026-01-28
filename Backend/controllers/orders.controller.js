// Backend/controllers/orders.controller.js
const nodemailer = require('nodemailer');
const orderEmailTemplate = require('../email/orderEmailTemplate');

exports.createOrder = async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      address_street,
      address_city,
      address_postal,
      address_country,
      notes,
      total_amount,
      items
    } = req.body;

    if (!customer_name || !customer_email || !items || !items.length) {
      return res.status(400).json({ error: 'Dados do pedido incompletos' });
    }

    items.forEach(item => {
      if (!item.material_id || !item.color_id) {
        throw new Error('Todos os produtos devem ter material e cor selecionados');
      }
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const html = orderEmailTemplate({
      customer_name,
      customer_email,
      customer_phone,
      address_street,
      address_city,
      address_postal,
      address_country,
      notes,
      total_amount,
      items
    });

    // ✅ Admin recebe completo, cliente em CC
    await transporter.sendMail({
      from: `"XYZ Labs" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // Admin
      cc: customer_email,          // Cliente
      subject: '📦 Novo Pedido Recebido',
      html
    });

    res.status(200).json({
      message: 'Pedido enviado com sucesso',
      order_id: Date.now()
    });

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};
