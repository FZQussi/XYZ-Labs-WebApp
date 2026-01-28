// Backend/pdf/invoiceGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Gera um PDF da fatura e retorna como Buffer
 * @param {Object} order - Dados do pedido
 * @returns {Promise<Buffer>} PDF em Buffer
 */
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

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ===== Cabeçalho com Logo =====
      // Substitua 'logo.png' pelo caminho da sua logo
      const logoPath = path.join(__dirname, 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
      }

      doc
        .fontSize(20)
        .fillColor('#333')
        .text('XYZ Labs', 0, 50, { align: 'right' });

      doc
        .fontSize(12)
        .fillColor('#555')
        .text(`Fatura - Pedido nº ${order_id}`, { align: 'right' })
        .text(`Data: ${new Date().toLocaleDateString()}`, { align: 'right' })
        .moveDown(2);

      // ===== Linha separadora =====
      doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#aaaaaa').stroke();

      // ===== Dados do Cliente =====
      doc
        .fontSize(12)
        .fillColor('#333')
        .text('Dados do Cliente', 50, 130, { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#555')
        .text(`Nome: ${customer_name}`)
        .text(`Email: ${customer_email}`)
        .text(`Telefone: ${customer_phone || '—'}`)
        .text(`Morada: ${address_street}, ${address_city}, ${address_postal}, ${address_country}`)
        .moveDown(1);

      // ===== Tabela de Produtos =====
      doc.fontSize(12).fillColor('#333').text('Produtos:', { underline: true });
      let tableTop = doc.y + 5;

      // Cabeçalho da tabela
      const headers = ['Produto', 'Qtd', 'Material', 'Cor', 'Preço'];
      const positions = [50, 250, 300, 370, 440];

      doc.font('Helvetica-Bold').fillColor('#fff');
      doc.rect(50, tableTop, 495, 20).fill('#111');
      headers.forEach((header, i) => {
        doc.fillColor('#fff').text(header, positions[i], tableTop + 5);
      });

      doc.font('Helvetica').fillColor('#333');

      let y = tableTop + 25;
      items.forEach((item, idx) => {
        // Alternar cor de fundo da linha
        if (idx % 2 === 0) {
          doc.rect(50, y - 2, 495, 20).fillOpacity(0.1).fill('#111').fillOpacity(1);
        }

        doc
          .fillColor('#333')
          .text(item.product_name, 50, y)
          .text(item.quantity, 250, y)
          .text(item.material_name, 300, y)
          .text(item.color_name, 370, y)
          .text(`€${(item.price * item.quantity).toFixed(2)}`, 440, y, { width: 95, align: 'right' });
        y += 20;
      });

      // ===== Total =====
      doc.moveDown(2).font('Helvetica-Bold').fontSize(12);
      doc.text(`Total: €${Number(total_amount).toFixed(2)}`, 0, y + 20, { align: 'right' });

      // ===== Notas =====
      if (notes) {
        doc.moveDown(1).font('Helvetica').fontSize(10);
        doc.text(`Notas: ${notes}`);
      }

      // ===== Footer =====
      doc.fontSize(8).fillColor('#999');
      doc.text(
        'XYZ Labs • Impressão 3D de Qualidade Premium • Email: info@xyzlabs.pt • www.xyzlabs.pt',
        50,
        780,
        { align: 'center', width: 495 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateInvoicePDFBuffer;
