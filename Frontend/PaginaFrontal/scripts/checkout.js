// Frontend/PaginaFrontal/scripts/checkout.js

const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  if (!cart.items.length) {
    alert('O seu carrinho está vazio!');
    window.location.href = 'products.html';
    return;
  }

  loadOrderSummary();
  setupForm();
  prefillUserData();
  loadOptions();

  // listeners seguros (DOM carregado)
  const materialSelect = document.getElementById('materialSelect');
  const colorSelect = document.getElementById('colorSelect');

  if (materialSelect && colorSelect) {
    materialSelect.addEventListener('change', e => {
      const el = document.getElementById('summaryMaterial');
      if (el) el.textContent = e.target.options[e.target.selectedIndex].text;
    });

    colorSelect.addEventListener('change', e => {
      const el = document.getElementById('summaryColor');
      if (el) el.textContent = e.target.options[e.target.selectedIndex].text;
    });
  }
});

// ===== LOAD OPTIONS =====
async function loadOptions() {
  try {
    const res = await fetch('../data/options.json');
    const data = await res.json();

    const materialSelect = document.getElementById('materialSelect');
    const colorSelect = document.getElementById('colorSelect');

    data.materials.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.name;
      materialSelect.appendChild(option);
    });

    data.colors.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      colorSelect.appendChild(option);
    });

  } catch (err) {
    console.error('Erro ao carregar opções:', err);
    alert('Erro ao carregar cores e materiais.');
  }
}

// ===== ORDER SUMMARY =====
function loadOrderSummary() {
  const orderItems = document.getElementById('orderItems');
  const subtotal = cart.getTotal();

  orderItems.innerHTML = cart.items.map(item => `
    <div class="summary-item">
      <div class="summary-item-image">
        ${item.image
          ? `<img src="${API_BASE}/images/${item.image}" alt="${item.name}">`
          : '<div class="no-image">📦</div>'}
      </div>
      <div class="summary-item-details">
        <h4>${item.name}</h4>
        <p>Quantidade: ${item.quantity}</p>
        <p>€${Number(item.price).toFixed(2)} × ${item.quantity}</p>
      </div>
      <div class="summary-item-total">
        €${(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
  `).join('');

  document.getElementById('orderSubtotal').textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById('orderTotal').textContent = `€${subtotal.toFixed(2)}`;
}

// ===== PREFILL =====
function prefillUserData() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user.name) document.getElementById('customerName').value = user.name;
  if (user.email) document.getElementById('customerEmail').value = user.email;
}

// ===== FORM =====
function setupForm() {
  const form = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitOrderBtn');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();
    const material = document.getElementById('materialSelect').value;
    const color = document.getElementById('colorSelect').value;

    if (!name || !email || !phone) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    if (!material || !color) {
      alert('Por favor, selecione o material e a cor.');
      return;
    }

    const orderData = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      notes: notes || null,
      total_amount: cart.getTotal(),
      items: cart.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        material_id: material,
        color_id: color
      }))
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'A enviar...';

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      showSuccessModal(data.order_id);
      cart.clear();

    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido.');
      submitBtn.disabled = false;
      submitBtn.textContent = '📧 Enviar Pedido';
    }
  });
}

// ===== SUCCESS MODAL =====
function showSuccessModal(orderId) {
  document.getElementById('orderNumber').textContent = orderId;
  document.getElementById('successModal').classList.remove('hidden');
}
