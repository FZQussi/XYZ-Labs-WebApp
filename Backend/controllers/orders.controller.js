const client = require('../db');
const nodemailer = require('nodemailer');
const orderEmailTemplate = require('../email/orderEmailTemplate');
const PDFDocument = require('pdfkit');

// ===== Gerar PDF em memória =====
function generateInvoicePDFBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const {
        order_id, customer_name, customer_email, customer_phone,
        address_street, address_postal, address_city, address_country,
        items, total_amount, notes
      } = order;

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).fillColor('#111').text('XYZ Labs', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).fillColor('#555')
        .text(`Fatura - Pedido nº ${order_id}`, { align: 'center' })
        .text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, { align: 'center' });
      doc.moveDown(1);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ===== CREATE ORDER =====
async function createOrder(req, res) {
  try {
    const {
      customer_name, customer_email, customer_phone,
      address_street, address_postal, address_city, address_country,
      notes, total_amount, items
    } = req.body;

    if (!customer_name || !customer_email || !items || !items.length) {
      return res.status(400).json({ error: 'Dados do pedido incompletos' });
    }

    for (const item of items) {
      if (!item.material_name || !item.color_name) {
        return res.status(400).json({ error: 'Todos os produtos devem ter material e cor selecionados' });
      }
    }

    const user_id = req.user ? req.user.id : null;

    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, customer_name, customer_email, customer_phone,
        address_street, address_postal, address_city, address_country,
        notes, total_amount, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
      RETURNING id`,
      [
        user_id,
        customer_name, customer_email, customer_phone || null,
        address_street || null, address_postal || null,
        address_city || null, address_country || null,
        notes || null,
        parseFloat(total_amount)
      ]
    );

    const order_id = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, quantity, price,
          product_name, material_id, material_name, material_multiplier,
          color_id, color_name, color_multiplier
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          order_id,
          parseInt(item.product_id),
          parseInt(item.quantity),
          parseFloat(item.price),
          item.product_name || null,
          item.material_id || null,
          item.material_name || null,
          parseFloat(item.material_multiplier) || 1,
          item.color_id || null,
          item.color_name || null,
          parseFloat(item.color_multiplier) || 1
        ]
      );
    }

    res.status(200).json({ message: 'Pedido enviado com sucesso', order_id });

    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const pdfBuffer = await generateInvoicePDFBuffer({
          order_id, customer_name, customer_email, customer_phone,
          address_street, address_postal, address_city, address_country,
          notes, total_amount, items
        });

        await transporter.sendMail({
          from: `"XYZ Labs" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          cc: customer_email,
          subject: `📦 Novo Pedido #${order_id}`,
          html: orderEmailTemplate({
            customer_name, customer_email, customer_phone,
            address_street, address_postal, address_city, address_country,
            notes, total_amount, items, order_id
          }),
          attachments: [{ filename: `fatura_${order_id}.pdf`, content: pdfBuffer }]
        });
      } catch (err) {
        console.error('Erro ao enviar email/PDF em background:', err);
      }
    })();

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
}

// ===== GET ALL ORDERS (Admin) =====
async function getAllOrders(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = '';
    const values = [];

    if (status) {
      where = 'WHERE o.status = $1';
      values.push(status);
    }

    const result = await client.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `, [...values, limit, offset]);

    const countResult = await client.query(
      `SELECT COUNT(*) FROM orders ${where}`,
      values
    );

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Erro ao obter orders:', err);
    res.status(500).json({ error: 'Erro ao obter orders' });
  }
}

// ===== GET ORDER BY ID (Admin) =====
async function getOrderById(req, res) {
  try {
    const orderId = req.params.id;

    const orderResult = await client.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.id = $1
    `, [orderId]);

    if (!orderResult.rows.length) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    const itemsResult = await client.query(`
      SELECT oi.*, p.slug, p.images
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
    `, [orderId]);

    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error('Erro ao obter order:', err);
    res.status(500).json({ error: 'Erro ao obter order' });
  }
}

// ===== UPDATE ORDER STATUS (Admin) =====
async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending','confirmed','printing','shipped','delivered','cancelled'];
    if (!status) {
      return res.status(400).json({ error: `Campo "status" em falta no body do pedido.` });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status inválido: ${validStatuses.join(', ')}` });
    }

    const result = await client.query(`
      UPDATE orders SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [status, orderId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
}

// ===== UPDATE ORDER TRACKING (Admin) =====
async function updateOrderTracking(req, res) {
  try {
    const orderId = req.params.id;
    const { tracking_code, tracking_carrier } = req.body;

    const result = await client.query(`
      UPDATE orders
      SET tracking_code = $1, tracking_carrier = $2, updated_at = NOW()
      WHERE id = $3 RETURNING *
    `, [tracking_code || null, tracking_carrier || null, orderId]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar tracking:', err);
    res.status(500).json({ error: 'Erro ao atualizar tracking' });
  }
}

// ===== GET ORDER STATS (Admin) =====
async function getOrderStats(req, res) {
  try {
    const result = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE TRUE)                                      AS total_orders,
        COUNT(*) FILTER (WHERE status = 'pending')                        AS pending,
        COUNT(*) FILTER (WHERE status = 'confirmed')                      AS confirmed,
        COUNT(*) FILTER (WHERE status = 'printing')                       AS printing,
        COUNT(*) FILTER (WHERE status = 'shipped')                        AS shipped,
        COUNT(*) FILTER (WHERE status = 'delivered')                      AS delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled')                      AS cancelled,
        COALESCE(SUM(total_amount), 0)                                     AS total_revenue,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')  AS orders_30days
      FROM orders
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter estatísticas:', err);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
}

// ===== GET ORDERS BY USER ID (Admin) =====
// Chamado por GET /users/:id/orders — dashboard admin.
// A filtragem é feita na BD. O frontend nunca recebe encomendas de outros utilizadores.
// Cobre também encomendas feitas antes do registo (sem user_id mas com o mesmo email).
async function getOrdersByUserId(req, res) {
  try {
    const { id: userId } = req.params;

    const userCheck = await client.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );
    if (!userCheck.rows.length) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    const userEmail = userCheck.rows[0].email;

    const result = await client.query(`
      SELECT
        o.id, o.status, o.total_amount, o.created_at, o.updated_at,
        o.customer_name, o.customer_email, o.customer_phone,
        o.tracking_code, o.tracking_carrier, o.user_id
      FROM orders o
      WHERE o.user_id = $1
         OR (o.user_id IS NULL AND LOWER(o.customer_email) = LOWER($2))
      ORDER BY o.created_at DESC
    `, [userId, userEmail]);

    const orders = result.rows;

    res.json({
      orders,
      summary: {
        total_orders:   orders.length,
        total_spent:    orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
        pending_orders: orders.filter(o => o.status === 'pending').length
      }
    });
  } catch (err) {
    console.error('Erro ao obter encomendas do utilizador:', err);
    res.status(500).json({ error: 'Erro ao obter encomendas do utilizador' });
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  getOrderStats,
  getOrdersByUserId  // <- adicionado
};