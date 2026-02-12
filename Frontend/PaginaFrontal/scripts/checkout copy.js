const API_BASE = 'http://localhost:3001';
const FREE_SHIPPING_MIN = 50;

let materialOptions = [];
let colorOptions = [];
document.addEventListener('DOMContentLoaded', () => {
  if (!cart.items.length) {
    alert('O seu carrinho está vazio!');
    window.location.href = 'products.html';
    return;
  }

  loadOrderSummary();
  prefillUserData();
  loadOptions();
  loadCountries();
  setupForm();

  const materialSelect = document.getElementById('materialSelect');
  const colorSelect = document.getElementById('colorSelect');

  if (materialSelect && colorSelect) {
    // Quando muda o material
    materialSelect.addEventListener('change', e => {
      const selectedMaterial = e.target.value;

      // Atualizar resumo do material
      document.getElementById('summaryMaterial').textContent =
        e.target.selectedOptions[0].text;

      // Atualizar opções de cores disponíveis
      updateColorOptions(selectedMaterial);

      calculateFinalTotal();
    });

    // Quando muda a cor
    colorSelect.addEventListener('change', e => {
      document.getElementById('summaryColor').textContent =
        e.target.selectedOptions[0].text;

      calculateFinalTotal();
    });
  }
});

// ===== LOAD OPTIONS =====
async function loadOptions() {
  try {
    const res = await fetch('../data/options.json');
    const data = await res.json();

    materialOptions = data.materials;
    colorOptions = data.colors;

    const materialSelect = document.getElementById('materialSelect');
    const colorSelect = document.getElementById('colorSelect');

    // Popular materiais
    data.materials.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.name;
      materialSelect.appendChild(option);
    });

    // Opcional: selecionar automaticamente o primeiro material
    if (materialOptions.length > 0) {
      materialSelect.value = materialOptions[0].id;
      document.getElementById('summaryMaterial').textContent = materialOptions[0].name;

      // Atualizar cores para o primeiro material
      updateColorOptions(materialOptions[0].id);
    }

  } catch (err) {
    console.error('Erro ao carregar opções:', err);
    alert('Erro ao carregar materiais e cores.');
  }
}

// ===== ATUALIZAR CORES DISPONÍVEIS =====
function updateColorOptions(materialId) {
  const colorSelect = document.getElementById('colorSelect');
  if (!colorSelect) return;

  // Limpar opções anteriores
  colorSelect.innerHTML = '<option value="">-- Escolher cor --</option>';

  // Filtrar cores disponíveis para o material selecionado
  const filteredColors = colorOptions.filter(c => c.material === materialId);

  filteredColors.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.name;
    colorSelect.appendChild(option);
  });

  // Selecionar automaticamente a primeira cor disponível
  if (filteredColors.length > 0) {
    colorSelect.value = filteredColors[0].id;
    document.getElementById('summaryColor').textContent = filteredColors[0].name;
  } else {
    document.getElementById('summaryColor').textContent = '--';
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

  updateShippingInfo(subtotal);
}


// ===== CALCULAR TOTAL FINAL =====
function calculateFinalTotal() {
  const materialId = document.getElementById('materialSelect').value;
  const colorId = document.getElementById('colorSelect').value;

  const baseSubtotal = cart.getTotal();

  let materialMultiplier = 1;
  let colorMultiplier = 1;

  const material = materialOptions.find(m => m.id === materialId);
  if (material) materialMultiplier = material.multiplier;

  const color = colorOptions.find(c => c.id === colorId);
  if (color) colorMultiplier = color.multiplier;

  const finalTotal = baseSubtotal * materialMultiplier * colorMultiplier;

  document.getElementById('orderTotal').textContent =
    `€${finalTotal.toFixed(2)}`;

  updateShippingInfo(finalTotal);
}


// ===== SHIPPING INFO =====
function updateShippingInfo(total) {
  const shippingInfo = document.getElementById('shippingInfo');

  if (total >= FREE_SHIPPING_MIN) {
    shippingInfo.textContent = 'Portes: 0€ (encomenda ≥ 50€)';
    shippingInfo.classList.remove('warning');
  } else {
    const missing = (FREE_SHIPPING_MIN - total).toFixed(2);
    shippingInfo.textContent =
      `Portes: grátis a partir de 50€ (faltam ${missing}€)`;
    shippingInfo.classList.add('warning');
  }
}


// ===== PREFILL USER =====
function prefillUserData() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user.name) document.getElementById('customerName').value = user.name;
  if (user.email) document.getElementById('customerEmail').value = user.email;
}


// ===== FORM SUBMIT =====
function setupForm() {
  const form = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitOrderBtn');

  form.addEventListener('submit', async e => {
    e.preventDefault(); // previne reload

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();
    const material = document.getElementById('materialSelect').value;
    const color = document.getElementById('colorSelect').value;
    const street = document.getElementById('addressStreet').value.trim();
    const postalCode = document.getElementById('addressPostalCode').value.trim();
    const city = document.getElementById('addressCity').value.trim();
    const country = document.getElementById('addressCountry').value;

    if (!name || !email || !phone || !material || !color || !street || !postalCode || !city || !country) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'A enviar...';

    const orderData = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      notes,
      total_amount: cart.getTotal(),
      address_street: street,
      address_postal: postalCode,
      address_city: city,
      address_country: country,
      items: cart.items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price,
        material_id: material,
        material_name: document.getElementById('materialSelect').selectedOptions[0].text,
        color_id: color,
        color_name: document.getElementById('colorSelect').selectedOptions[0].text
      }))
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      // ✅ Mostrar modal com o número do pedido
      showSuccessModal(data.order_id);
      
      // ✅ Limpar carrinho após envio
      cart.clear();

      // ✅ Atualiza botão
      submitBtn.textContent = '✔ Pedido Enviado';

    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido.');
      submitBtn.disabled = false;
      submitBtn.textContent = '📧 Enviar Pedido';
    }
  });
}



// ===== COUNTRIES =====
async function loadCountries() {
  try {
    const res = await fetch('../data/countries.json');
    const countries = await res.json();

    const countrySelect = document.getElementById('addressCountry');

    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name;
      if (country.code === 'PT') option.selected = true;
      countrySelect.appendChild(option);
    });

  } catch (err) {
    console.error('Erro ao carregar países:', err);
  }
}


// ===== SUCCESS MODAL =====
function showSuccessModal(orderId) {
  document.getElementById('orderNumber').textContent = orderId;
  document.getElementById('successModal').classList.remove('hidden');
}
