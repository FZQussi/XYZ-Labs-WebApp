// Backend/email/orderEmailTemplate.js

const orderEmailTemplate = ({
  customer_name,
  customer_email,
  customer_phone,
  address_street,
  address_city,
  address_postal,
  address_country,
  notes,
  total_amount,
  items,
  order_id // ✅ apenas use o nome do parâmetro
}) => `
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8" />
<style>
  body, p, h1, h2, table, th, td { margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; background: #f0f0f0; color: #111; padding: 20px; }
  .container { max-width: 700px; margin: auto; background: #fff; border: 4px solid #111; overflow: hidden; }
  .header { background: #111; color: #fff; padding: 20px; text-align: center; letter-spacing: 1px; }
  .header h1 { font-size: 24px; }
  .content { padding: 24px; }
  h2 { font-size: 18px; color: #111; border-bottom: 2px solid #111; padding-bottom: 4px; margin-bottom: 12px; }
  .info p { margin: 6px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
  th, td { border: 2px solid #111; padding: 8px; text-align: left; }
  td img { display: inline-block; vertical-align: middle; margin-right: 8px; }
  th { background: #eee; }
  .total { text-align: right; font-size: 18px; font-weight: bold; margin-bottom: 16px; }
  .notes { background: #eee; padding: 12px; border: 2px solid #111; font-size: 14px; white-space: pre-wrap; }
  .footer { background: #111; color: #fff; text-align: center; padding: 16px; font-size: 12px; letter-spacing: 1px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📦 Novo Pedido - XYZ Labs</h1>
    <p style="margin:4px 0; font-size:14px; color:#f1f5f9;">
      Nº do Pedido: <strong>${order_id}</strong>
    </p>
  </div>

  <div class="content">
    <div class="info">
      <h2>👤 Dados do Cliente</h2>
      <p><strong>Nome:</strong> ${customer_name}</p>
      <p><strong>Email:</strong> ${customer_email}</p>
      <p><strong>Telefone:</strong> ${customer_phone || '—'}</p>
      <p><strong>Morada:</strong> ${address_street || '—'}, ${address_city || '—'}, ${address_postal || '—'}, ${address_country || '—'}</p>
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
            <td>
              ${item.product_image ? `<img src="${process.env.API_BASE_URL}/images/${item.product_image}" width="50" alt="${item.product_name}" />` : ''}
              ${item.product_name}
            </td>
            <td>${item.quantity}</td>
            <td>${item.material_name}</td>
            <td>${item.color_name}</td>
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
    Este email foi gerado automaticamente.<br>
    <strong>Número do Pedido:</strong> ${order_id}
  </div>
</div>
</body>
</html>
`;

module.exports = orderEmailTemplate;
