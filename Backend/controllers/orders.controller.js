// Backend/controllers/orders.controller.js
const client = require('../db');
const nodemailer = require('nodemailer');

// Configuração do email (adicionar ao .env: EMAIL_USER, EMAIL_PASS)
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro serviço
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== CREATE ORDER =====
exports.createOrder = async (req, res) => {
  try {
    const { items, customer_name, customer_email, customer_phone, notes, total_amount } = req.body;
    const user_id = req.user?.id || null;

    // Validações
    if (!items || !items.length) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    if (!customer_name || !customer_email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // Criar pedido
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, notes, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, created_at
    `, [user_id, customer_name, customer_email, customer_phone, notes || null, total_amount]);

    const orderId = orderResult.rows[0].id;

    // Adicionar items do pedido
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.product_id, item.quantity, item.price]);
    }

    // Buscar detalhes completos do pedido
    const orderDetails = await client.query(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [orderId]);

    const order = orderDetails.rows[0];

    // Enviar email para o admin
    try {
      const itemsList = order.items.map(item => 
        `${item.product_name} - Qtd: ${item.quantity} - €${Number(item.price).toFixed(2)}`
      ).join('\n');

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `🛒 Novo Pedido #${orderId} - XYZ Labs`,
        html: `
          <h2>Novo Pedido Recebido</h2>
          <p><strong>Pedido:</strong> #${orderId}</p>
          <p><strong>Cliente:</strong> ${customer_name}</p>
          <p><strong>Email:</strong> ${customer_email}</p>
          <p><strong>Telefone:</strong> ${customer_phone || 'N/A'}</p>
          
          <h3>Produtos:</h3>
          <pre>${itemsList}</pre>
          
          <p><strong>Total:</strong> €${Number(total_amount).toFixed(2)}</p>
          
          ${notes ? `<p><strong>Notas:</strong> ${notes}</p>` : ''}
          
          <p><em>Data: ${new Date(order.created_at).toLocaleString('pt-PT')}</em></p>
        `
      });
    } catch (emailErr) {
      console.error('Erro ao enviar email:', emailErr);
      // Não bloqueia o pedido se o email falhar
    }

    res.status(201).json({
      success: true,
      order_id: orderId,
      message: 'Pedido criado com sucesso! Entraremos em contacto em breve.'
    });

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};

// ===== GET ALL ORDERS (Admin) =====
exports.getAllOrders = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao obter pedidos:', err);
    res.status(500).json({ error: 'Erro ao obter pedidos' });
  }
};

// ===== GET ORDER BY ID =====
exports.getOrderById = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter pedido:', err);
    res.status(500).json({ error: 'Erro ao obter pedido' });
  }
};

// ===== UPDATE ORDER STATUS =====
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const result = await client.query(`
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
};