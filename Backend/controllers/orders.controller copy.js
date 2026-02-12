const nodemailer = require('nodemailer');
const orderEmailTemplate = require('../email/orderEmailTemplate');
const PDFDocument = require('pdfkit');

// ===== Função para gerar PDF em memória =====
function generateInvoicePDFBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const {
        order_id,
        customer_name,
        customer_email,
        customer_phone,
        address_street,
        address_postal,
        address_city,
        address_country,
        items,
        total_amount,
        notes
      } = order;

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ===== Cabeçalho =====
      doc.fontSize(20).fillColor('#111').text('XYZ Labs', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).fillColor('#555')
        .text(`Fatura - Pedido nº ${order_id}`, { align: 'center' })
        .text(`Data: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(1);

      // ===== Dados do Cliente =====
      doc.fontSize(12).fillColor('#333').text('Dados do Cliente', { underline: true });
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor('#555')
        .text(`Nome: ${customer_name}`)
        .text(`Email: ${customer_email}`)
        .text(`Telefone: ${customer_phone || '—'}`)
        .text(`Morada: ${address_street}, ${address_city}, ${address_postal}, ${address_country}`);
      doc.moveDown(1);

      // ===== Produtos =====
      doc.fontSize(12).fillColor('#333').text('Produtos:', { underline: true });
      const tableTop = doc.y + 5;

      const headers = ['Produto', 'Qtd', 'Material', 'Cor', 'Preço'];
      const positions = [50, 250, 300, 370, 440];

      // Cabeçalho tabela
      doc.font('Helvetica-Bold').fillColor('#fff');
      doc.rect(50, tableTop, 495, 20).fill('#111');
      headers.forEach((header, i) => {
        doc.fillColor('#fff').text(header, positions[i], tableTop + 5);
      });

      // Linhas dos produtos
      doc.font('Helvetica').fillColor('#333');
      let y = tableTop + 25;
      items.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, y - 2, 495, 20).fillOpacity(0.05).fill('#000').fillOpacity(1);
        }

        doc.text(item.product_name, 50, y)
          .text(item.quantity, 250, y)
          .text(item.material_name, 300, y)
          .text(item.color_name, 370, y)
          .text(`€${(item.price * item.quantity).toFixed(2)}`, 440, y, { width: 95, align: 'right' });
        y += 20;
      });

      // ===== Total =====
      doc.moveDown(2).font('Helvetica-Bold').fontSize(12)
        .text(`Total: €${Number(total_amount).toFixed(2)}`, { align: 'right' });

      // ===== Notas =====
      if (notes) {
        doc.moveDown(1).font('Helvetica').fontSize(10)
          .text(`Notas: ${notes}`);
      }

      // ===== Footer =====
      doc.fontSize(8).fillColor('#999')
        .text('XYZ Labs • Impressão 3D de Qualidade Premium • Email: info@xyzlabs.com • www.xyzlabs.com', 50, 780, {
          align: 'center', width: 495
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ===== Controller para criar pedido =====
exports.createOrder = async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      address_street,
      address_postal,
      address_city,
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

    // Número único do pedido
    const order_id = Date.now();

    // HTML do email
    const html = orderEmailTemplate({
      customer_name,
      customer_email,
      customer_phone,
      address_street,
      address_postal,
      address_city,
      address_country,
      notes,
      total_amount,
      items,
      order_id
    });

    // Retorna sucesso imediato para o frontend
    res.status(200).json({ message: 'Pedido enviado com sucesso', order_id });

    // ===== Envia email com PDF em background =====
    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const pdfBuffer = await generateInvoicePDFBuffer({
          order_id,
          customer_name,
          customer_email,
          customer_phone,
          address_street,
          address_postal,
          address_city,
          address_country,
          notes,
          total_amount,
          items
        });

        await transporter.sendMail({
          from: `"XYZ Labs" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL,
          cc: customer_email,
          subject: `📦 Resumo do Pedido #${order_id}`,
          html,
          attachments: [
            {
              filename: `fatura_${order_id}.pdf`,
              content: pdfBuffer
            }
          ]
        });

        console.log(`Email com PDF enviado para o pedido #${order_id}`);
      } catch (err) {
        console.error('Erro ao enviar email/PDF em background:', err);
      }
    })();

  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};
