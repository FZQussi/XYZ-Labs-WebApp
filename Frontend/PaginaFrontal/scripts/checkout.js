// Frontend/PaginaFrontal/scripts/checkout.js

const API_BASE = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', () => {
  // Verificar se há items no carrinho
  if (!cart.items.length) {
    alert('O seu carrinho está vazio!');
    window.location.href = 'products.html';
    return;
  }

  loadOrderSummary();
  setupForm();
  prefillUserData();
});

// ===== LOAD ORDER SUMMARY =====
function loadOrderSummary() {
  const orderItems = document.getElementById('orderItems');
  const subtotal = cart.getTotal();

  // Renderizar items
  orderItems.innerHTML = cart.items.map(item => `
    <div class="summary-item">
      <div class="summary-item-image">
        ${item.image 
          ? `<img src="${API_BASE}/images/${item.image}" alt="${item.name}">` 
          : '<div class="no-image">📦</div>'
        }
      </div>
      <div class="summary-item-details">
        <h4>${item.name}</h4>
        <p>Quantidade: ${item.quantity}</p>
        <p class="item-price">€${Number(item.price).toFixed(2)} × ${item.quantity}</p>
      </div>
      <div class="summary-item-total">
        €${(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
  `).join('');

  // Atualizar totais
  document.getElementById('orderSubtotal').textContent = `€${subtotal.toFixed(2)}`;
  document.getElementById('orderTotal').textContent = `€${subtotal.toFixed(2)}`;
}

// ===== PREFILL USER DATA =====
function prefillUserData() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.name) {
    document.getElementById('customerName').value = user.name;
  }
  
  if (user.email) {
    document.getElementById('customerEmail').value = user.email;
  }
}

// ===== SETUP FORM =====
function setupForm() {
  const form = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitOrderBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validações
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();

    if (!name || !email) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    // Preparar dados do pedido
    const orderData = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      notes: notes || null,
      total_amount: cart.getTotal(),
      items: cart.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    // Desabilitar botão
    submitBtn.disabled = true;
    submitBtn.textContent = 'A enviar...';

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar pedido');
      }

      // Sucesso!
      showSuccessModal(data.order_id);
      cart.clear();

    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      alert('Erro ao enviar pedido. Por favor, tente novamente.');
      submitBtn.disabled = false;
      submitBtn.textContent = '📧 Enviar Pedido';
    }
  });
}

// ===== SHOW SUCCESS MODAL =====
function showSuccessModal(orderId) {
  const modal = document.getElementById('successModal');
  document.getElementById('orderNumber').textContent = orderId;
  modal.classList.remove('hidden');
}