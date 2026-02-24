// ============================================
// ORDERS.JS - Gestor de Encomendas do Dashboard
// ============================================

(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  function authHeaders() {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ===== ESTADO =====
  let allOrders = [];
  let currentOrder = null;
  let currentPage = 1;
  const PAGE_SIZE = 25;

  // ===== TRACKING URLS =====
  const CARRIER_URLS = {
    'CTT':          code => `https://www.ctt.pt/portaldoctt/app/encomendas/pesquisaencomendas?objects=${code}`,
    'CTT Expresso': code => `https://www.ctt.pt/portaldoctt/app/encomendas/pesquisaencomendas?objects=${code}`,
    'DHL':          code => `https://www.dhl.com/pt-pt/home/tracking.html?tracking-id=${code}`,
    'DPD':          code => `https://tracking.dpd.de/status/pt_PT/parcel/${code}`,
    'FedEx':        code => `https://www.fedex.com/en-us/tracking.html?tracknumbers=${code}`,
    'GLS':          code => `https://gls-group.eu/PT/pt/seguir-encomenda?match=${code}`,
    'TNT':          code => `https://www.tnt.com/express/pt_pt/site/ferramentas-de-envio/seguimento.html?searchType=con&cons=${code}`,
    'UPS':          code => `https://www.ups.com/track?loc=pt_PT&tracknum=${code}`,
    'MRW':          code => `https://www.mrw.es/seguimiento_envios/cliente.asp?N%C3%BAmero=${code}`,
  };

  const STATUS_LABELS = {
    pending:   'Pendente',
    confirmed: 'Confirmado',
    printing:  'Em Impressao',
    shipped:   'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  };

  const STATUS_BG = {
    pending:   '#FFFF00',
    confirmed: '#00FFFF',
    printing:  '#CC88FF',
    shipped:   '#88FF88',
    delivered: '#00FF00',
    cancelled: '#FF0000'
  };

  const STATUS_TEXT = {
    pending:   '#000',
    confirmed: '#000',
    printing:  '#000',
    shipped:   '#000',
    delivered: '#000',
    cancelled: '#fff'
  };

  const STATUS_HINTS = {
    pending:   'A aguardar confirmacao do pedido.',
    confirmed: 'Pedido confirmado - pronto para entrar em producao.',
    printing:  'Peca em impressao 3D.',
    shipped:   'Obrigatorio inserir codigo de rastreamento.',
    delivered: 'Encomenda entregue ao cliente.',
    cancelled: 'Encomenda cancelada.'
  };

  // ===== HELPERS =====
  const fmtDate     = d => new Date(d).toLocaleDateString('pt-PT', { dateStyle: 'short' });
  const fmtDateTime = d => new Date(d).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
  const fmtEuro     = v => `€${Number(v || 0).toFixed(2)}`;
  const setText     = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // ===== STATS =====
  async function loadStats() {
    try {
      const res = await fetch(`${API_BASE}/orders/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const s = await res.json();
      setText('ordersStatTotal',   s.total_orders  ?? 0);
      setText('ordersStatPending', s.pending       ?? 0);
      setText('ordersStatRevenue', fmtEuro(s.total_revenue));
      setText('ordersStatMonth',   s.orders_30days ?? 0);
    } catch (_) {
      calcStatsLocal(allOrders);
    }
  }

  function calcStatsLocal(orders) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    setText('ordersStatTotal',   orders.length);
    setText('ordersStatPending', orders.filter(o => o.status === 'pending').length);
    setText('ordersStatRevenue', fmtEuro(orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0)));
    setText('ordersStatMonth',   orders.filter(o => new Date(o.created_at) >= monthStart).length);
  }

  // ===== LOAD ORDERS =====
  async function loadOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    list.innerHTML = '<div class="orders-loading">A carregar...</div>';

    try {
      const statusParam = document.getElementById('orderStatusFilter')?.value
        ? `&status=${document.getElementById('orderStatusFilter').value}` : '';

      const res = await fetch(
        `${API_BASE}/orders?page=${currentPage}&limit=${PAGE_SIZE}${statusParam}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Erro ao carregar encomendas');

      const data = await res.json();
      allOrders = Array.isArray(data) ? data : (data.orders || []);
      const total = Array.isArray(data) ? data.length : (data.total || allOrders.length);

      renderOrders(filterLocal(allOrders));
      renderPagination(total);
      calcStatsLocal(allOrders);
      loadStats();
    } catch (err) {
      list.innerHTML = `<div class="orders-error">Erro: ${err.message}</div>`;
    }
  }

  // ===== FILTRO LOCAL =====
  function filterLocal(orders) {
    const search = document.getElementById('orderSearch')?.value.toLowerCase() || '';
    const from   = document.getElementById('orderDateFrom')?.value ? new Date(document.getElementById('orderDateFrom').value) : null;
    const to     = document.getElementById('orderDateTo')?.value   ? new Date(document.getElementById('orderDateTo').value + 'T23:59:59') : null;

    return orders.filter(o => {
      if (search) {
        const ok = String(o.id).includes(search)
          || (o.customer_name  || '').toLowerCase().includes(search)
          || (o.customer_email || '').toLowerCase().includes(search);
        if (!ok) return false;
      }
      if (from && new Date(o.created_at) < from) return false;
      if (to   && new Date(o.created_at) > to)   return false;
      return true;
    });
  }

  // ===== RENDER TABELA =====
  function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    if (!list) return;

    if (!orders.length) {
      list.innerHTML = '<div class="orders-empty">Nenhuma encomenda encontrada.</div>';
      return;
    }

    list.innerHTML = orders.map(o => {
      const bg  = STATUS_BG[o.status]   || '#eee';
      const col = STATUS_TEXT[o.status] || '#000';
      const lbl = STATUS_LABELS[o.status] || o.status;

      const tracking = o.tracking_code
        ? `<span class="order-tracking-chip">${o.tracking_code}${o.tracking_carrier ? ` <em>${o.tracking_carrier}</em>` : ''}</span>`
        : '<span class="order-no-tracking">-</span>';

      return `
        <div class="order-row">
          <span class="order-col order-id-col">#${o.id}</span>
          <span class="order-col order-customer-col">
            <strong>${window.encodeHTML ? window.encodeHTML(o.customer_name || '') : (o.customer_name || '—')}</strong>
            <small>${o.customer_email || ''}</small>
          </span>
          <span class="order-col">${fmtDate(o.created_at)}</span>
          <span class="order-col">
            <span class="order-status-badge" style="background:${bg};color:${col}">${lbl}</span>
          </span>
          <span class="order-col order-amount-col">${fmtEuro(o.total_amount)}</span>
          <span class="order-col order-tracking-col">${tracking}</span>
          <span class="order-col order-actions-col">
            <button class="btn-gerir" data-id="${o.id}">GERIR</button>
          </span>
        </div>`;
    }).join('');

    list.querySelectorAll('.btn-gerir').forEach(btn => {
      btn.addEventListener('click', () => openModal(parseInt(btn.dataset.id)));
    });
  }

  // ===== PAGINACAO =====
  function renderPagination(total) {
    const c = document.getElementById('ordersPagination');
    if (!c) return;
    const pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) { c.innerHTML = ''; return; }

    c.innerHTML = `
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} id="pagePrev">Anterior</button>
      <span class="page-info">Pagina ${currentPage} / ${pages}</span>
      <button class="page-btn" ${currentPage >= pages ? 'disabled' : ''} id="pageNext">Proxima</button>
    `;
    c.querySelector('#pagePrev')?.addEventListener('click', () => { currentPage--; loadOrders(); });
    c.querySelector('#pageNext')?.addEventListener('click', () => { currentPage++; loadOrders(); });
  }

  // ===== ABRIR MODAL =====
  async function openModal(orderId) {
    const m = document.getElementById('orderModal');
    if (!m) return;

    // Mostrar modal de imediato com dados locais
    currentOrder = allOrders.find(o => o.id === orderId) || null;
    if (currentOrder) { fillModal(currentOrder); m.classList.remove('hidden'); }

    // Tentar buscar dados completos (com items)
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers: authHeaders() });
      if (res.ok) {
        currentOrder = await res.json();
        fillModal(currentOrder);
        m.classList.remove('hidden');
      }
    } catch (_) {}
  }

  function fillModal(o) {
    setText('mOrderId',    `#${o.id}`);
    setText('mOrderDate',  fmtDateTime(o.created_at));
    setText('mStatusLabel', STATUS_LABELS[o.status] || o.status);
    applyHeaderColor(o.status);

    setText('mCustomerName',  o.customer_name  || '-');
    setText('mCustomerEmail', o.customer_email || '-');
    setText('mCustomerPhone', o.customer_phone || '-');

    const addr = [o.address_street, o.address_postal, o.address_city, o.address_country].filter(Boolean).join(', ');
    setText('mAddress', addr || '-');
    setText('mNotes', o.notes || 'Sem notas.');

    // Itens
    const itemsEl = document.getElementById('mItemsList');
    if (itemsEl) {
      itemsEl.innerHTML = (o.items || []).map(item => {
        const unit = parseFloat(item.price) *
          (parseFloat(item.material_multiplier) || 1) *
          (parseFloat(item.color_multiplier) || 1);
        const specs = [item.material_name, item.color_name].filter(Boolean);
        return `
          <div class="modal-item-row">
            <div class="modal-item-info">
              <span class="modal-item-name">${window.encodeHTML ? window.encodeHTML(item.product_name || 'Produto') : (item.product_name || 'Produto')}</span>
              <span class="modal-item-qty">x ${item.quantity}</span>
              ${specs.map(s => `<span class="spec-tag">${s}</span>`).join('')}
            </div>
            <span class="modal-item-price">${fmtEuro(unit * item.quantity)}</span>
          </div>`;
      }).join('') || '<p style="color:#999;font-size:12px;padding:8px 0">Sem itens carregados.</p>';
    }
    setText('mTotal', fmtEuro(o.total_amount));

    // Status
    const sel = document.getElementById('mStatus');
    if (sel) sel.value = o.status || 'pending';
    updateStatusHint(o.status);

    // Tracking
    const trackCode    = document.getElementById('mTrackingCode');
    const trackCarrier = document.getElementById('mTrackingCarrier');
    if (trackCode)    trackCode.value    = o.tracking_code    || '';
    if (trackCarrier) trackCarrier.value = o.tracking_carrier || '';
    updateTrackingLink();

    // Historico
    renderHistory(o);

    // Reset save btn
    const saveBtn = document.getElementById('mSaveBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'GUARDAR ALTERACOES';
      saveBtn.style.background = '';
      saveBtn.style.color = '';
    }
  }

  function applyHeaderColor(status) {
    const header = document.getElementById('mModalHeader');
    if (!header) return;
    const bg  = STATUS_BG[status]   || '#111';
    const col = STATUS_TEXT[status] || '#fff';
    header.style.background = bg;
    header.style.color      = col;
    const close = header.querySelector('.modal-close');
    if (close) {
      close.style.borderColor = col;
      close.style.color       = col;
    }
  }

  function updateStatusHint(status) {
    const hint = document.getElementById('mStatusHint');
    if (hint) {
      hint.textContent = STATUS_HINTS[status] || '';
      hint.className = 'order-status-hint' + (status === 'shipped' ? ' hint-warn' : '');
    }
    const warn = document.getElementById('mShipWarning');
    if (warn) warn.classList.toggle('hidden', status !== 'shipped');
  }

  function updateTrackingLink() {
    const code    = document.getElementById('mTrackingCode')?.value.trim();
    const carrier = document.getElementById('mTrackingCarrier')?.value;
    const linkDiv = document.getElementById('mTrackingLink');
    const anchor  = document.getElementById('mTrackingLinkAnchor');
    if (!linkDiv || !anchor) return;

    if (code && carrier && CARRIER_URLS[carrier]) {
      anchor.href     = CARRIER_URLS[carrier](code);
      linkDiv.style.display = 'block';
    } else {
      linkDiv.style.display = 'none';
    }
  }

  function renderHistory(o) {
    const el = document.getElementById('mStatusHistory');
    if (!el) return;
    const entries = o.status_history || [
      { status: o.status,  at: o.updated_at || o.created_at },
      { status: 'created', at: o.created_at }
    ];
    el.innerHTML = entries.map(e => `
      <div class="history-entry">
        <span class="history-dot" style="background:${STATUS_BG[e.status] || '#ccc'}"></span>
        <span class="history-lbl">${e.status === 'created' ? 'Criado' : (STATUS_LABELS[e.status] || e.status)}</span>
        <span class="history-date">${fmtDateTime(e.at)}</span>
      </div>`).join('');
  }

  // ===== GUARDAR =====
  async function saveOrder() {
    if (!currentOrder) return;

    // Ler o select — com fallback para o status atual da encomenda
    const selectEl  = document.getElementById('mStatus');
    const status    = selectEl?.value || currentOrder.status;
    const code      = document.getElementById('mTrackingCode')?.value?.trim()    || '';
    const carrier   = document.getElementById('mTrackingCarrier')?.value?.trim() || '';

    // Debug: detetar se o elemento select não foi encontrado
    if (!selectEl) {
      console.warn('⚠️ [orders] #mStatus não encontrado no DOM — a usar status atual:', status);
    }
    if (!status) {
      console.error('❌ [orders] Nenhum status disponível — cancelar save');
      if (window.showNotification) window.showNotification('Erro: não foi possível ler o estado da encomenda', 'error');
      return;
    }

    if (status === 'shipped' && !code) {
      document.getElementById('mShipWarning')?.classList.remove('hidden');
      document.getElementById('mTrackingCode')?.focus();
      if (window.showNotification) window.showNotification('Codigo de rastreamento obrigatorio para "Enviado"', 'warning');
      return;
    }

    const btn = document.getElementById('mSaveBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'A guardar...'; }

    console.log(`📤 [orders] A guardar encomenda #${currentOrder.id} → status="${status}", tracking="${code}", carrier="${carrier}"`);

    try {
      // 1. Status
      const r1 = await fetch(`${API_BASE}/orders/${currentOrder.id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      if (!r1.ok) {
        const errBody = await r1.json().catch(() => ({}));
        throw new Error(errBody.error || `Erro ${r1.status} ao atualizar estado`);
      }

      // 2. Tracking
      const r2 = await fetch(`${API_BASE}/orders/${currentOrder.id}/tracking`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ tracking_code: code || null, tracking_carrier: carrier || null })
      });
      if (!r2.ok) {
        const errBody = await r2.json().catch(() => ({}));
        throw new Error(errBody.error || `Erro ${r2.status} ao guardar tracking`);
      }

      // Sucesso
      currentOrder.status          = status;
      currentOrder.tracking_code   = code   || null;
      currentOrder.tracking_carrier = carrier || null;

      if (btn) { btn.textContent = 'GUARDADO ✓'; btn.style.background = '#00FF00'; btn.style.color = '#000'; }
      if (window.showNotification) window.showNotification(`Encomenda #${currentOrder.id} atualizada`, 'success');

      setTimeout(() => {
        document.getElementById('orderModal')?.classList.add('hidden');
        loadOrders();
        if (window._currentViewUserId) {
          window.reloadUserOrders && window.reloadUserOrders(window._currentViewUserId);
        }
      }, 900);

    } catch (err) {
      console.error('❌ [orders] Erro ao guardar:', err.message);
      if (window.showNotification) window.showNotification(err.message, 'error');
      else alert(err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'GUARDAR ALTERACOES'; btn.style.background = ''; btn.style.color = ''; }
    }
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('orderModalClose')
      ?.addEventListener('click', () => document.getElementById('orderModal')?.classList.add('hidden'));
    document.getElementById('orderModal')
      ?.addEventListener('click', e => { if (e.target === document.getElementById('orderModal')) e.target.classList.add('hidden'); });

    document.getElementById('mSaveBtn')?.addEventListener('click', saveOrder);

    document.getElementById('mStatus')?.addEventListener('change', e => {
      updateStatusHint(e.target.value);
      applyHeaderColor(e.target.value);
      setText('mStatusLabel', STATUS_LABELS[e.target.value] || e.target.value);
    });

    document.getElementById('mTrackingCode')?.addEventListener('input', updateTrackingLink);
    document.getElementById('mTrackingCarrier')?.addEventListener('change', updateTrackingLink);

    document.getElementById('orderSearch')?.addEventListener('input', () => renderOrders(filterLocal(allOrders)));
    document.getElementById('orderStatusFilter')?.addEventListener('change', () => { currentPage = 1; loadOrders(); });
    document.getElementById('orderDateFrom')?.addEventListener('change', () => renderOrders(filterLocal(allOrders)));
    document.getElementById('orderDateTo')?.addEventListener('change',   () => renderOrders(filterLocal(allOrders)));
    document.getElementById('ordersRefreshBtn')?.addEventListener('click', loadOrders);

    document.querySelectorAll('[data-tab="orders"]').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(loadOrders, 80));
    });

    const section = document.getElementById('orders');
    if (section && !section.classList.contains('hidden')) loadOrders();
  });

  window.reloadOrders = loadOrders;

  // ===== EXPOR openModal GLOBALMENTE =====
  // Permite que o modal de utilizadores abra o modal de gerir encomenda
  window.openOrderModal = openModal;

  // Expor helpers de status para uso externo (modal de utilizadores)
  window.orderStatusBG    = STATUS_BG;
  window.orderStatusText  = STATUS_TEXT;
  window.orderStatusLabels = STATUS_LABELS;

  console.log('Modulo de encomendas carregado');
})();