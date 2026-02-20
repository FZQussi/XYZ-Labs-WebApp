const API_BASE = '';
const FREE_SHIPPING_MIN = 50;

let materialOptions = [];
let colorOptions = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!cart.items.length) {
    alert('O seu carrinho está vazio!');
    window.location.href = 'products.html';
    return;
  }

  loadOptions();
  loadCountries();
  prefillUserData();
  setupForm();
});

// ===== LOAD OPTIONS =====
async function loadOptions() {
  try {
    const res = await fetch('../data/options.json');
    const data = await res.json();
    materialOptions = data.materials;
    colorOptions = data.colors;
    loadOrderSummary();
  } catch (err) {
    console.error('Erro ao carregar opções:', err);
    alert('Erro ao carregar materiais e cores.');
  }
}

// ===== ORDER SUMMARY =====
function loadOrderSummary() {
  const orderItems = document.getElementById('orderItems');

  orderItems.innerHTML = cart.items.map((item, index) => `
    <div class="summary-item" data-item-index="${index}">
      <div class="summary-item-image">
        ${item.image
          ? `<img src="${API_BASE}/images/${item.image}" alt="${item.name}">`
          : '<div class="no-image">📦</div>'}
      </div>
      <div class="summary-item-details">
        <h4>${item.name}</h4>
        <p>Quantidade: ${item.quantity}</p>
        <p>Preço base: €${Number(item.price).toFixed(2)} × ${item.quantity}</p>

        <div class="product-option">
          <label for="material-${index}">Material *</label>
          <select id="material-${index}" class="material-select" data-index="${index}" required>
            <option value="">-- Escolher material --</option>
            ${materialOptions.map(m => `
              <option value="${m.id}" data-multiplier="${m.multiplier}">
                ${m.name} (${m.multiplier > 1 ? '+' : ''}${((m.multiplier - 1) * 100).toFixed(0)}%)
              </option>
            `).join('')}
          </select>
        </div>

        <div class="product-option">
          <label for="color-${index}">Cor *</label>
          <select id="color-${index}" class="color-select" data-index="${index}" required>
            <option value="">-- Escolher cor --</option>
          </select>
        </div>
      </div>
      <div class="summary-item-total">
        <span class="item-total" id="item-total-${index}">€${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    </div>
  `).join('');

  setupProductSelects();
  calculateTotals();
}

// ===== SETUP PRODUCT SELECTS =====
function setupProductSelects() {
  const materialSelects = document.querySelectorAll('.material-select');
  const colorSelects = document.querySelectorAll('.color-select');

  materialSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const index = e.target.dataset.index;
      const materialId = e.target.value;
      updateColorOptions(index, materialId);
      calculateTotals();
    });

    if (materialOptions.length > 0) {
      select.value = materialOptions[0].id;
      const index = select.dataset.index;
      updateColorOptions(index, materialOptions[0].id);
    }
  });

  colorSelects.forEach(select => {
    select.addEventListener('change', () => { calculateTotals(); });
  });
}

// ===== ATUALIZAR CORES =====
function updateColorOptions(itemIndex, materialId) {
  const colorSelect = document.getElementById(`color-${itemIndex}`);
  if (!colorSelect) return;

  colorSelect.innerHTML = '<option value="">-- Escolher cor --</option>';

  const filteredColors = colorOptions.filter(c => c.material === materialId);
  filteredColors.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.dataset.multiplier = c.multiplier;
    option.textContent = `${c.name} (${c.multiplier > 1 ? '+' : ''}${((c.multiplier - 1) * 100).toFixed(0)}%)`;
    colorSelect.appendChild(option);
  });

  if (filteredColors.length > 0) colorSelect.value = filteredColors[0].id;
}

// ===== CALCULAR TOTAIS =====
function calculateTotals() {
  let totalAmount = 0;

  cart.items.forEach((item, index) => {
    const materialSelect = document.getElementById(`material-${index}`);
    const colorSelect = document.getElementById(`color-${index}`);

    let materialMultiplier = 1;
    let colorMultiplier = 1;

    if (materialSelect && materialSelect.value) {
      materialMultiplier = parseFloat(materialSelect.options[materialSelect.selectedIndex].dataset.multiplier) || 1;
    }
    if (colorSelect && colorSelect.value) {
      colorMultiplier = parseFloat(colorSelect.options[colorSelect.selectedIndex].dataset.multiplier) || 1;
    }

    const itemTotal = item.price * item.quantity * materialMultiplier * colorMultiplier;
    totalAmount += itemTotal;

    const itemTotalEl = document.getElementById(`item-total-${index}`);
    if (itemTotalEl) itemTotalEl.textContent = `€${itemTotal.toFixed(2)}`;
  });

  document.getElementById('orderSubtotal').textContent = `€${totalAmount.toFixed(2)}`;
  document.getElementById('orderTotal').textContent = `€${totalAmount.toFixed(2)}`;
  updateShippingInfo(totalAmount);
}

// ===== SHIPPING INFO =====
function updateShippingInfo(total) {
  const shippingInfo = document.getElementById('shippingInfo');
  if (total >= FREE_SHIPPING_MIN) {
    shippingInfo.textContent = 'Portes: 0€ (encomenda ≥ 50€)';
    shippingInfo.classList.remove('warning');
  } else {
    const missing = (FREE_SHIPPING_MIN - total).toFixed(2);
    shippingInfo.textContent = `Portes: grátis a partir de 50€ (faltam ${missing}€)`;
    shippingInfo.classList.add('warning');
  }
}

// ===== PREFILL USER DATA (nome, email + morada guardada no perfil) =====
async function prefillUserData() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  if (user.name) document.getElementById('customerName').value = user.name;
  if (user.email) document.getElementById('customerEmail').value = user.email;

  // Tentar buscar a morada guardada no perfil
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile.address_street) document.getElementById('addressStreet').value = profile.address_street;
        if (profile.address_postal) document.getElementById('addressPostalCode').value = profile.address_postal;
        if (profile.address_city) document.getElementById('addressCity').value = profile.address_city;
        if (profile.address_country) {
          // Esperar que o select de países carregue
          const setCountry = () => {
            const sel = document.getElementById('addressCountry');
            if (sel.options.length > 1) {
              sel.value = profile.address_country;
            } else {
              setTimeout(setCountry, 200);
            }
          };
          setCountry();
        }

        // Mostrar banner se a morada foi pré-preenchida
        if (profile.address_street) {
          showAddressBanner();
        }
      }
    } catch (err) {
      console.warn('Não foi possível carregar morada do perfil:', err);
    }
  }
}

function showAddressBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 8px;
    padding: 10px 14px; margin-bottom: 16px; font-size: 0.88rem; color: #065f46;
    display: flex; justify-content: space-between; align-items: center;
  `;
  banner.innerHTML = `
    <span>✅ Morada pré-preenchida do teu perfil.</span>
    
  `;
  const form = document.getElementById('checkoutForm');
  form.insertBefore(banner, form.firstChild);
}

// ===== FORM SUBMIT =====
function setupForm() {
  const form = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitOrderBtn');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name      = document.getElementById('customerName').value.trim();
    const email     = document.getElementById('customerEmail').value.trim();
    const phone     = document.getElementById('customerPhone').value.trim();
    const notes     = document.getElementById('orderNotes').value.trim();
    const street    = document.getElementById('addressStreet').value.trim();
    const postalCode = document.getElementById('addressPostalCode').value.trim();
    const city      = document.getElementById('addressCity').value.trim();
    const country   = document.getElementById('addressCountry').value;

    if (!name || !email || !phone || !street || !postalCode || !city || !country) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const items = [];
    let hasError = false;

    cart.items.forEach((item, index) => {
      const materialSelect = document.getElementById(`material-${index}`);
      const colorSelect = document.getElementById(`color-${index}`);

      if (!materialSelect.value || !colorSelect.value) {
        alert(`Por favor, selecione material e cor para o produto: ${item.name}`);
        hasError = true;
        return;
      }

      const materialOption = materialSelect.options[materialSelect.selectedIndex];
      const colorOption = colorSelect.options[colorSelect.selectedIndex];

      items.push({
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price,
        material_id: materialSelect.value,
        material_name: materialOption.textContent.split('(')[0].trim(),
        material_multiplier: parseFloat(materialOption.dataset.multiplier),
        color_id: colorSelect.value,
        color_name: colorOption.textContent.split('(')[0].trim(),
        color_multiplier: parseFloat(colorOption.dataset.multiplier)
      });
    });

    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'A enviar...';

    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity * item.material_multiplier * item.color_multiplier);
    }, 0);

    const orderData = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      notes,
      total_amount: totalAmount,
      address_street: street,
      address_postal: postalCode,
      address_city: city,
      address_country: country,
      items
    };

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      showSuccessModal(data.order_id);
      cart.clear();
      submitBtn.textContent = '✔ Pedido Enviado';

    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido.');
      submitBtn.disabled = false;
      submitBtn.textContent = '🖧 Enviar Pedido';
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