const orderEmailTemplate = ({
  customer_name,
  customer_email,
  customer_phone,
  notes,
  total_amount,
  items
}) => `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f6f8;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 700px;
      margin: auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .header {
      background: #0f172a;
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 1px;
    }
    .content {
      padding: 24px;
    }
    h2 {
      font-size: 18px;
      color: #0f172a;
    }
    .info p {
      margin: 4px 0;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      background: #f1f5f9;
      padding: 10px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .total {
      text-align: right;
      font-size: 18px;
      font-weight: bold;
      margin-top: 16px;
      color: #0f172a;
    }
    .notes {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
    }
    .footer {
      background: #f1f5f9;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Novo Pedido - XYZ Labs</h1>
    </div>

    <div class="content">
      <div class="info">
        <h2>👤 Dados do Cliente</h2>
        <p><strong>Nome:</strong> ${customer_name}</p>
        <p><strong>Email:</strong> ${customer_email}</p>
        <p><strong>Telefone:</strong> ${customer_phone || '—'}</p>
      </div>

      <h2>🛒 Produtos</h2>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Material</th>
            <th>Cor</th>
            <th>Preço</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.product_id}</td>
              <td>${item.quantity}</td>
              <td>${item.material_id}</td>
              <td>${item.color_id}</td>
              <td>€${Number(item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total">
        Total Estimado: €${Number(total_amount).toFixed(2)}
      </div>

      <h2>📝 Notas do Pedido</h2>
      <div class="notes">
        ${notes || 'Sem notas adicionais.'}
      </div>
    </div>

    <div class="footer">
      XYZ Labs • Impressão 3D de Qualidade Premium<br>
      Este email foi gerado automaticamente.
    </div>
  </div>
</body>
</html>
`;

module.exports = orderEmailTemplate;
