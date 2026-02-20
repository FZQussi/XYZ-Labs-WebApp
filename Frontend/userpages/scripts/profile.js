const API_BASE = '';

document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  // ===== TABS =====
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  await loadCountries();

  // ===== CARREGAR PERFIL =====
  let profileData = null;
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) profileData = await res.json();
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  }

  if (profileData) {
    document.getElementById('welcomeMsg').textContent = `— ${profileData.name}`;
    document.getElementById('profileName').value = profileData.name || '';
    document.getElementById('profileEmail').value = profileData.email || '';
    document.getElementById('profileCreatedAt').value = profileData.created_at
      ? new Date(profileData.created_at).toLocaleDateString('pt-PT', { dateStyle: 'long' })
      : '–';

    document.getElementById('addrStreet').value = profileData.address_street || '';
    document.getElementById('addrPostal').value = profileData.address_postal || '';
    document.getElementById('addrCity').value = profileData.address_city || '';
    if (profileData.address_country) {
      document.getElementById('addrCountry').value = profileData.address_country;
    }

    if (profileData.last_login_at) {
      document.getElementById('lastLoginInfo').style.display = 'block';
      document.getElementById('lastLoginDate').textContent =
        new Date(profileData.last_login_at).toLocaleString('pt-PT');
      document.getElementById('lastLoginIp').textContent = profileData.last_login_ip || '–';
      document.getElementById('lastLoginLocation').textContent =
        [profileData.last_login_city, profileData.last_login_country].filter(Boolean).join(', ') || '–';
      document.getElementById('loginCount').textContent = profileData.login_count || 0;
    }
  }

  // ===== GUARDAR DADOS =====
  document.getElementById('saveDadosBtn').addEventListener('click', async () => {
    const name = document.getElementById('profileName').value.trim();
    if (!name) return showAlert('alertDados', 'O nome não pode estar vazio.', 'error');

    const btn = document.getElementById('saveDadosBtn');
    btn.disabled = true;
    btn.textContent = 'A guardar...';

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.name = data.name;
      localStorage.setItem('user', JSON.stringify(storedUser));
      document.getElementById('welcomeMsg').textContent = `— ${data.name}`;

      showAlert('alertDados', '✓ Dados guardados com sucesso', 'success');
    } catch (err) {
      showAlert('alertDados', `Erro: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Alterações';
    }
  });

  // ===== GUARDAR MORADA =====
  document.getElementById('saveMoradaBtn').addEventListener('click', async () => {
    const body = {
      address_street:  document.getElementById('addrStreet').value.trim(),
      address_postal:  document.getElementById('addrPostal').value.trim(),
      address_city:    document.getElementById('addrCity').value.trim(),
      address_country: document.getElementById('addrCountry').value
    };

    const btn = document.getElementById('saveMoradaBtn');
    btn.disabled = true;
    btn.textContent = 'A guardar...';

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      Object.assign(storedUser, body);
      localStorage.setItem('user', JSON.stringify(storedUser));

      showAlert('alertMorada', '✓ Morada guardada com sucesso', 'success');
    } catch (err) {
      showAlert('alertMorada', `Erro: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Morada';
    }
  });

  loadOrders(token);
  loadLoginHistory(token);

  // ===== BOTÕES =====
  document.getElementById('changePasswordBtn').addEventListener('click', () => {
    window.location.href = 'reset-password.html';
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  };

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtnSec').addEventListener('click', logout);

  document.getElementById('homeBtn').addEventListener('click', () => {
    window.location.href = '/PaginaFrontal/html/HomePage.html';
  });
});

// ===== ORDERS =====
async function loadOrders(token) {
  const container = document.getElementById('ordersContainer');
  try {
    const res = await fetch(`${API_BASE}/users/me/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = await res.json();

    if (!orders.length) {
      container.innerHTML = `
        <div class="no-orders">
          <span class="empty-label">Vazio</span>
          <p>Ainda não tens encomendas.</p>
          <a href="/PaginaFrontal/html/products.html">Ver Produtos →</a>
        </div>`;
      return;
    }

    // Stats
    const total = orders.length;
    const totalValue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;

    const statsRow = document.getElementById('orderStatsRow');
    const statsBox = document.getElementById('orderStatsBox');
    statsBox.innerHTML = `
      <div class="stat-box">
        <div class="stat-val">${total}</div>
        <div class="stat-key">Encomendas</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">€${totalValue.toFixed(0)}</div>
        <div class="stat-key">Total Gasto</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${pending}</div>
        <div class="stat-key">Pendentes</div>
      </div>
    `;
    statsRow.style.display = 'block';

    container.innerHTML = `<div class="orders-list">${orders.map(renderOrderCard).join('')}</div>`;
  } catch (err) {
    container.innerHTML = `<p style="color:#cc0000;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px">Erro ao carregar encomendas.</p>`;
  }
}

function renderOrderCard(order) {
  const statusLabels = {
    pending:   'Pendente',
    confirmed: 'Confirmado',
    printing:  'Em Impressão',
    shipped:   'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  const date = new Date(order.created_at).toLocaleDateString('pt-PT', { dateStyle: 'medium' });
  const statusLabel = statusLabels[order.status] || order.status;

  const itemsHTML = order.items.map(item => {
    const finalPrice = parseFloat(item.price) *
      (parseFloat(item.material_multiplier) || 1) *
      (parseFloat(item.color_multiplier) || 1);
    return `
      <div class="order-item-row">
        <div>
          <div class="item-name">${item.product_name || 'Produto'} × ${item.quantity}</div>
          <div class="item-specs">${item.material_name || ''}${item.material_name && item.color_name ? ' · ' : ''}${item.color_name || ''}</div>
        </div>
        <div class="item-price">€${(finalPrice * item.quantity).toFixed(2)}</div>
      </div>`;
  }).join('');

  const addr = order.address_city
    ? `<div class="order-addr">📍 ${[order.address_street, order.address_city].filter(Boolean).join(', ')}</div>`
    : '';

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div class="order-num">#${order.id}</div>
        <div class="order-date">${date}</div>
        <span class="order-status status-${order.status}">${statusLabel}</span>
      </div>

      <div class="order-card-body">
        ${itemsHTML}

        <div class="order-footer">
          <div class="order-total-label">Total</div>
          <div class="order-total-amount">€${Number(order.total_amount).toFixed(2)}</div>
        </div>

        ${addr}
        ${order.notes ? `<div class="order-addr">📝 ${order.notes}</div>` : ''}

        ${
          order.status === 'shipped' && order.tracking_code
            ? `<div style="margin-top:12px;font-size:0.9rem;color:#333;">
                 <strong>🚚 Código de envio:</strong> <span style="font-family: var(--font-mono);">${order.tracking_code}</span><br/>
                 ${order.tracking_carrier ? `<strong>Transportadora:</strong> ${order.tracking_carrier}` : ''}
               </div>`
            : ''
        }
      </div>
    </div>`;
}


// ===== LOGIN HISTORY =====
async function loadLoginHistory(token) {
  const container = document.getElementById('loginHistoryContainer');
  try {
    const res = await fetch(`${API_BASE}/users/me/login-history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const history = await res.json();

    if (!history.length) {
      container.innerHTML = '<p style="color:#999;font-size:0.72rem;text-transform:uppercase;letter-spacing:1px">Sem histórico disponível.</p>';
      return;
    }

    container.innerHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>IP</th>
            <th>Localização</th>
          </tr>
        </thead>
        <tbody>
          ${history.map(e => `
            <tr>
              <td>${new Date(e.logged_at).toLocaleString('pt-PT')}</td>
              <td>${e.ip || '–'}</td>
              <td>${[e.city, e.country].filter(Boolean).join(', ') || '–'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (err) {
    container.innerHTML = '<p style="color:#cc0000;font-size:0.72rem;text-transform:uppercase">Erro ao carregar histórico.</p>';
  }
}

// ===== PAÍSES =====
async function loadCountries() {
  try {
    const res = await fetch('/data/countries.json');
    const countries = await res.json();
    const select = document.getElementById('addrCountry');
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      if (c.code === 'PT') opt.selected = true;
      select.appendChild(opt);
    });
  } catch (_) {}
}

// ===== ALERTS =====
function showAlert(containerId, message, type) {
  const el = document.getElementById(containerId);
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}