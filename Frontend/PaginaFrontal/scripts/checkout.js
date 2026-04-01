'use strict';
// PaginaFrontal/scripts/checkout.js
// Consome:
//   GET /api/materials               → lista de materiais ativos (com cores embutidas)
//   GET /api/materials/:id/colors    → cores de um material específico (usado no select dinâmico)
//   POST /orders                     → submissão da encomenda

const API_BASE         = '';
const FREE_SHIPPING_MIN = 50;

// Cache: { [materialId]: [{ id, name, hex_code, multiplier, ... }] }
const colorsCache = {};

// Lista de materiais carregados
let materialOptions = [];

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!cart.items || !cart.items.length) {
    alert('O seu carrinho está vazio!');
    window.location.href = 'products.html';
    return;
  }

  await Promise.all([
    loadMaterials(),
    loadCountries(),
    prefillUserData(),
  ]);

  setupForm();
});

// ─────────────────────────────────────────────────────────────
// CARREGAR MATERIAIS
// ─────────────────────────────────────────────────────────────
async function loadMaterials() {
  try {
    const res = await fetch(`${API_BASE}/api/materials`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    materialOptions = await res.json();

    // Pré-popular cache de cores com os dados embutidos
    materialOptions.forEach(mat => {
      if (Array.isArray(mat.colors)) {
        colorsCache[mat.id] = mat.colors;
      }
    });

    loadOrderSummary();
  } catch (err) {
    console.error('Erro ao carregar materiais:', err);
    alert('Erro ao carregar materiais e cores. Recarregue a página.');
  }
}

// ─────────────────────────────────────────────────────────────
// CORES DE UM MATERIAL (com cache)
// ─────────────────────────────────────────────────────────────
async function getColorsForMaterial(materialId) {
  if (colorsCache[materialId]) return colorsCache[materialId];

  try {
    const res = await fetch(`${API_BASE}/api/materials/${materialId}/colors`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const colors = await res.json();
    colorsCache[materialId] = colors;
    return colors;
  } catch (err) {
    console.error(`Erro ao carregar cores para material ${materialId}:`, err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// RESUMO DA ENCOMENDA
// ─────────────────────────────────────────────────────────────
function loadOrderSummary() {
  const orderItems = document.getElementById('orderItems');

  orderItems.innerHTML = cart.items.map((item, index) => `
    <div class="summary-item" data-item-index="${index}">
      <div class="summary-item-image">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}">`
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
                ${m.name} (${formatMultiplierLabel(m.multiplier)})
              </option>`).join('')}
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
        <span class="item-total" id="item-total-${index}">
          €${(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>`).join('');

  setupProductSelects();
  calculateTotals();
}

// ─────────────────────────────────────────────────────────────
// SETUP DOS SELECTS DE MATERIAL / COR
// ─────────────────────────────────────────────────────────────
function setupProductSelects() {
  const materialSelects = document.querySelectorAll('.material-select');

  materialSelects.forEach(async select => {
    select.addEventListener('change', async e => {
      const index      = e.target.dataset.index;
      const materialId = e.target.value;
      await updateColorOptions(index, materialId);
      calculateTotals();
    });

    // Pré-selecionar primeiro material e carregar suas cores
    if (materialOptions.length > 0) {
      const firstMat = materialOptions[0];
      select.value = firstMat.id;
      await updateColorOptions(select.dataset.index, firstMat.id);
    }
  });

  document.querySelectorAll('.color-select').forEach(select => {
    select.addEventListener('change', calculateTotals);
  });
}

// ─────────────────────────────────────────────────────────────
// ATUALIZAR OPÇÕES DE COR
// ─────────────────────────────────────────────────────────────
async function updateColorOptions(itemIndex, materialId) {
  const colorSelect = document.getElementById(`color-${itemIndex}`);
  if (!colorSelect) return;

  colorSelect.innerHTML = '<option value="">A carregar...</option>';
  colorSelect.disabled  = true;

  const colors = materialId ? await getColorsForMaterial(materialId) : [];

  colorSelect.innerHTML = '<option value="">-- Escolher cor --</option>';
  colorSelect.disabled  = false;

  colors.forEach(c => {
    const opt         = document.createElement('option');
    opt.value         = c.id;
    opt.dataset.multiplier = c.multiplier;
    opt.textContent   = `${c.name} (${formatMultiplierLabel(c.multiplier)})`;
    colorSelect.appendChild(opt);
  });

  if (colors.length > 0) colorSelect.value = colors[0].id;
  calculateTotals();
}

// ─────────────────────────────────────────────────────────────
// CALCULAR TOTAIS
// ─────────────────────────────────────────────────────────────
function calculateTotals() {
  let totalAmount = 0;

  cart.items.forEach((item, index) => {
    const matSel   = document.getElementById(`material-${index}`);
    const colSel   = document.getElementById(`color-${index}`);
    const matMult  = matSel?.value
      ? parseFloat(matSel.options[matSel.selectedIndex].dataset.multiplier) || 1
      : 1;
    const colMult  = colSel?.value
      ? parseFloat(colSel.options[colSel.selectedIndex].dataset.multiplier) || 1
      : 1;

    const itemTotal = item.price * item.quantity * matMult * colMult;
    totalAmount    += itemTotal;

    const el = document.getElementById(`item-total-${index}`);
    if (el) el.textContent = `€${itemTotal.toFixed(2)}`;
  });

  document.getElementById('orderSubtotal').textContent = `€${totalAmount.toFixed(2)}`;
  document.getElementById('orderTotal').textContent    = `€${totalAmount.toFixed(2)}`;
  updateShippingInfo(totalAmount);
}

// ─────────────────────────────────────────────────────────────
// INFO DE ENVIO
// ─────────────────────────────────────────────────────────────
function updateShippingInfo(total) {
  const el = document.getElementById('shippingInfo');
  if (total >= FREE_SHIPPING_MIN) {
    el.textContent = 'Portes: 0€ (encomenda ≥ 50€)';
    el.classList.remove('warning');
  } else {
    const missing = (FREE_SHIPPING_MIN - total).toFixed(2);
    el.textContent = `Portes: grátis a partir de 50€ (faltam ${missing}€)`;
    el.classList.add('warning');
  }
}

// ─────────────────────────────────────────────────────────────
// PRÉ-PREENCHER DADOS DO UTILIZADOR
// ─────────────────────────────────────────────────────────────
async function prefillUserData() {
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  if (user.name)  document.getElementById('customerName').value  = user.name;
  if (user.email) document.getElementById('customerEmail').value = user.email;

  if (token) {
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile.address_street) document.getElementById('addressStreet').value    = profile.address_street;
        if (profile.address_postal) document.getElementById('addressPostalCode').value = profile.address_postal;
        if (profile.address_city)   document.getElementById('addressCity').value       = profile.address_city;
        if (profile.address_country) {
          const trySet = () => {
            const sel = document.getElementById('addressCountry');
            if (sel && sel.options.length > 1) {
              sel.value = profile.address_country;
            } else {
              setTimeout(trySet, 200);
            }
          };
          trySet();
        }
        if (profile.address_street) showAddressBanner();
      }
    } catch (err) {
      console.warn('Não foi possível carregar morada do perfil:', err);
    }
  }
}

function showAddressBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;
    padding:10px 14px;margin-bottom:16px;font-size:0.88rem;color:#065f46;
    display:flex;justify-content:space-between;align-items:center;`;
  banner.innerHTML = '<span>✅ Morada pré-preenchida do teu perfil.</span>';
  const form = document.getElementById('checkoutForm');
  form.insertBefore(banner, form.firstChild);
}

// ─────────────────────────────────────────────────────────────
// SUBMISSÃO DO FORMULÁRIO
// ─────────────────────────────────────────────────────────────
function setupForm() {
  const form      = document.getElementById('checkoutForm');
  const submitBtn = document.getElementById('submitOrderBtn');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name       = document.getElementById('customerName').value.trim();
    const email      = document.getElementById('customerEmail').value.trim();
    const phone      = document.getElementById('customerPhone').value.trim();
    const notes      = document.getElementById('orderNotes').value.trim();
    const street     = document.getElementById('addressStreet').value.trim();
    const postalCode = document.getElementById('addressPostalCode').value.trim();
    const city       = document.getElementById('addressCity').value.trim();
    const country    = document.getElementById('addressCountry').value;

    if (!name || !email || !phone || !street || !postalCode || !city || !country) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const items    = [];
    let hasError   = false;

    cart.items.forEach((item, index) => {
      const matSel = document.getElementById(`material-${index}`);
      const colSel = document.getElementById(`color-${index}`);

      if (!matSel.value || !colSel.value) {
        alert(`Por favor, selecione material e cor para o produto: ${item.name}`);
        hasError = true;
        return;
      }

      const matOpt = matSel.options[matSel.selectedIndex];
      const colOpt = colSel.options[colSel.selectedIndex];

      items.push({
        product_id:          item.id,
        product_name:        item.name,
        product_image:       item.image,
        quantity:            item.quantity,
        price:               item.price,
        material_id:         parseInt(matSel.value, 10),
        material_name:       matOpt.textContent.split('(')[0].trim(),
        material_multiplier: parseFloat(matOpt.dataset.multiplier),
        color_id:            parseInt(colSel.value, 10),
        color_name:          colOpt.textContent.split('(')[0].trim(),
        color_multiplier:    parseFloat(colOpt.dataset.multiplier),
      });
    });

    if (hasError) return;

    submitBtn.disabled   = true;
    submitBtn.textContent = 'A enviar...';

    const totalAmount = items.reduce((sum, it) =>
      sum + (it.price * it.quantity * it.material_multiplier * it.color_multiplier), 0);

    const orderData = {
      customer_name:   name,
      customer_email:  email,
      customer_phone:  phone,
      notes,
      total_amount:    totalAmount,
      address_street:  street,
      address_postal:  postalCode,
      address_city:    city,
      address_country: country,
      items,
    };

    try {
      const token   = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res  = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      showSuccessModal(data.order_id);
      cart.clear();
      submitBtn.textContent = '✔ Pedido Enviado';
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido.');
      submitBtn.disabled    = false;
      submitBtn.textContent = '📧 Enviar Pedido';
    }
  });
}

// ─────────────────────────────────────────────────────────────
// PAÍSES
// ─────────────────────────────────────────────────────────────
async function loadCountries() {
  try {
    const res       = await fetch('../data/countries.json');
    const countries = await res.json();
    const sel       = document.getElementById('addressCountry');

    countries.forEach(c => {
      const opt       = document.createElement('option');
      opt.value       = c.code;
      opt.textContent = c.name;
      if (c.code === 'PT') opt.selected = true;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.error('Erro ao carregar países:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// MODAL DE SUCESSO
// ─────────────────────────────────────────────────────────────
function showSuccessModal(orderId) {
  document.getElementById('orderNumber').textContent = orderId;
  document.getElementById('successModal').classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
function formatMultiplierLabel(mult) {
  const pct = ((parseFloat(mult) - 1) * 100).toFixed(0);
  return pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : 'base';
}