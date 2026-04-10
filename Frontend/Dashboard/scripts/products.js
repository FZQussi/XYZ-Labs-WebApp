// Frontend/Dashboard/scripts/products.js
// — Tabela de produtos com coluna de promoção
// — Aba de promoções (promotions tab)
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  const productsList       = document.getElementById('productsList');
  const searchInput        = document.getElementById('productSearch');
  const activeFilter       = document.getElementById('productFilterActive');
  const stockFilter        = document.getElementById('productFilterStock');
  const priceMinInput      = document.getElementById('priceMin');
  const priceMaxInput      = document.getElementById('priceMax');
  const categoryFilter     = document.getElementById('productFilterCategory');
  const promoFilter        = document.getElementById('productFilterPromo');

  // Aba promoções
  const promotionsList     = document.getElementById('promotionsList');

  let allProducts = [];

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  function authJson() {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // ===== CSS =====
  (function injectStyles() {
    if (document.getElementById('products-grid-style')) return;
    const style = document.createElement('style');
    style.id = 'products-grid-style';
    style.textContent = `
      /* ---- Header e grid: 7 colunas (adicionada coluna PROMOÇÃO) ---- */
      #products .table-header {
        display: grid;
        grid-template-columns: 100px 1fr 150px 150px 90px 130px 120px;
        gap: 0;
        padding: 12px 20px;
        background: #000;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 1.5px;
        border-bottom: 3px solid #000;
      }

      .product-item {
        display: grid;
        grid-template-columns: 100px 1fr 150px 150px 90px 130px 120px;
        gap: 0;
        border-bottom: 2px solid #e0e0e0;
        align-items: stretch;
        transition: all 0.15s;
        background: #fff;
        min-height: 110px;
      }

      .product-item:hover {
        background: #f5f5f5;
        border-left: 4px solid #000;
      }

      .product-item:last-child { border-bottom: none; }

      .product-cell {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-right: 1px solid #e0e0e0;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }

      .product-cell:last-child { border-right: none; }

      .product-cell-image {
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
        border-right: 2px solid #000;
        position: relative;
        overflow: hidden;
      }

      .product-cell-image img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border: 2px solid #000;
        display: block;
      }

      .product-cell-image .no-img-placeholder {
        width: 80px;
        height: 80px;
        background: #e0e0e0;
        border: 2px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }

      .product-cell-main {
        border-right: 2px solid #000;
        padding: 12px 16px;
        gap: 6px;
      }

      .product-cell-main .prod-name {
        font-size: 14px;
        font-weight: bold;
        letter-spacing: 0.5px;
        line-height: 1.3;
        margin-bottom: 4px;
        text-transform: uppercase;
      }

      .product-cell-main .prod-desc {
        font-size: 11px;
        color: #555;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-style: italic;
        border-left: 3px solid #e0e0e0;
        padding-left: 8px;
      }

      .product-cell-primary-cat { border-right: 2px solid #000; gap: 4px; }

      .primary-cat-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border: 2px solid #000;
        background: #000;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .primary-cat-tag .cat-icon { font-size: 14px; flex-shrink: 0; }

      .product-cell-sec-cats {
        border-right: 2px solid #000;
        gap: 4px;
        flex-wrap: wrap;
        flex-direction: row;
        align-content: center;
      }

      .sec-cat-pill {
        display: inline-block;
        padding: 2px 8px;
        border: 2px solid #000;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: bold;
        background: #fff;
        letter-spacing: 0.5px;
        white-space: nowrap;
        margin: 2px 2px 2px 0;
      }

      .sec-cat-pill.role-tag { border-style: dashed; background: #fefce8; }
      .sec-cat-pill.role-secondary { background: #f0f0f0; }

      .filter-tag-pill {
        display: inline-block;
        padding: 2px 8px;
        border: 2px solid #2563eb;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: bold;
        background: #eff6ff;
        color: #1d4ed8;
        letter-spacing: 0.5px;
        white-space: nowrap;
        margin: 2px 2px 2px 0;
      }

      .no-sec-cats { font-size: 11px; color: #aaa; font-style: italic; }

      /* ---- Célula de promoção ---- */
      .product-cell-promo { border-right: 2px solid #000; gap: 6px; align-items: flex-start; }

      .promo-badge-on {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #dc2626;
        color: #fff;
        border: 2px solid #dc2626;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }

      .promo-badge-off {
        display: inline-block;
        padding: 3px 8px;
        background: #f0f0f0;
        color: #999;
        border: 2px solid #ddd;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .promo-price-old {
        font-size: 11px;
        color: #999;
        text-decoration: line-through;
        font-family: 'Courier New', monospace;
      }

      .promo-price-new {
        font-size: 13px;
        font-weight: bold;
        color: #dc2626;
        font-family: 'Courier New', monospace;
      }

      .promo-label-text {
        font-size: 10px;
        color: #666;
        font-style: italic;
        font-family: 'Courier New', monospace;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .btn-promo-quick {
        padding: 3px 8px;
        border: 2px solid #000;
        font-family: 'Courier New', monospace;
        font-size: 9px;
        font-weight: bold;
        cursor: pointer;
        letter-spacing: 0.5px;
        transition: all 0.15s;
        background: #fff;
        white-space: nowrap;
      }

      .btn-promo-quick:hover { background: #000; color: #fff; }
      .btn-promo-quick.remove { border-color: #dc2626; color: #dc2626; }
      .btn-promo-quick.remove:hover { background: #dc2626; color: #fff; }

      .product-cell-stock { border-right: 2px solid #000; align-items: center; }
      .product-cell-actions { align-items: center; gap: 6px; }

      .product-cell-actions button {
        width: 100%;
        padding: 6px 8px;
        border: 2px solid #000;
        font-family: 'Courier New', monospace;
        font-size: 10px;
        font-weight: bold;
        cursor: pointer;
        letter-spacing: 0.5px;
        transition: all 0.15s;
        background: #fff;
      }

      .product-cell-actions .view-btn { background: #fff; color: #000; }
      .product-cell-actions .view-btn:hover {
        background: #000; color: #fff;
        transform: translate(-2px, -2px);
        box-shadow: 2px 2px 0 #000;
      }

      .product-cell-actions .edit-btn { background: #000; color: #fff; }
      .product-cell-actions .edit-btn:hover {
        background: #fff; color: #000;
        transform: translate(-2px, -2px);
        box-shadow: 2px 2px 0 #000;
      }

      .product-cell-actions .delete-btn { background: #FF0000; color: #fff; }

      /* ---- Promoções: grid da aba ---- */
      #promotions .table-header {
        display: grid;
        grid-template-columns: 100px 1fr 110px 110px 110px 160px 120px;
        gap: 0;
        padding: 12px 20px;
        background: #dc2626;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 1.5px;
        border-bottom: 3px solid #000;
      }

      .promo-item {
        display: grid;
        grid-template-columns: 100px 1fr 110px 110px 110px 160px 120px;
        gap: 0;
        border-bottom: 2px solid #e0e0e0;
        align-items: stretch;
        background: #fff;
        min-height: 90px;
        transition: all 0.15s;
      }

      .promo-item:hover { background: #fff5f5; border-left: 4px solid #dc2626; }
      .promo-item:last-child { border-bottom: none; }

      .promo-cell {
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-right: 1px solid #e0e0e0;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }

      .promo-cell:last-child { border-right: none; }

      .promo-cell-image {
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
        border-right: 2px solid #000;
      }

      .promo-cell-image img {
        width: 70px;
        height: 70px;
        object-fit: cover;
        border: 2px solid #000;
      }

      .promo-cell-image .no-img-placeholder {
        width: 70px;
        height: 70px;
        background: #e0e0e0;
        border: 2px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .discount-pill {
        display: inline-block;
        padding: 6px 14px;
        background: #dc2626;
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        font-weight: bold;
        border: 2px solid #dc2626;
        text-align: center;
      }

      .promo-dates {
        font-size: 10px;
        color: #888;
        line-height: 1.8;
      }

      .promo-dates span { color: #000; font-weight: bold; }

      .promo-status-active {
        display: inline-block;
        padding: 3px 8px;
        background: #16a34a;
        color: #fff;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1px;
        border: 2px solid #16a34a;
        font-family: 'Courier New', monospace;
      }

      .promo-status-scheduled {
        display: inline-block;
        padding: 3px 8px;
        background: #d97706;
        color: #fff;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1px;
        border: 2px solid #d97706;
        font-family: 'Courier New', monospace;
      }

      .promo-status-expired {
        display: inline-block;
        padding: 3px 8px;
        background: #6b7280;
        color: #fff;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 1px;
        border: 2px solid #6b7280;
        font-family: 'Courier New', monospace;
      }

      /* Responsive */
      @media (max-width: 1300px) {
        .product-item,
        #products .table-header {
          grid-template-columns: 80px 1fr 130px 130px 80px 120px 110px;
        }
      }

      @media (max-width: 1100px) {
        .product-item,
        #products .table-header {
          grid-template-columns: 70px 1fr 100px 80px 120px;
        }
        .product-cell-sec-cats,
        #products .table-header span:nth-child(4) { display: none; }
      }

      @media (max-width: 800px) {
        .product-item,
        #products .table-header {
          grid-template-columns: 60px 1fr 80px 120px;
        }
        .product-cell-primary-cat,
        #products .table-header span:nth-child(3) { display: none; }
      }
    `;
    document.head.appendChild(style);
  })();

  // ===== UTILS =====
  function encodeHTML(str) {
    if (typeof window.encodeHTML === 'function') return window.encodeHTML(str);
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
  }

  function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  function promoStatus(p) {
    const now = new Date();
    if (!p.promotion_start && !p.promotion_end) return 'active';
    const start = p.promotion_start ? new Date(p.promotion_start) : null;
    const end   = p.promotion_end   ? new Date(p.promotion_end)   : null;
    if (end && end < now) return 'expired';
    if (start && start > now) return 'scheduled';
    return 'active';
  }

  // ===== HEADER DA TABELA =====
  function updateTableHeader() {
    const header = document.querySelector('#products .table-header');
    if (!header) return;
    header.innerHTML = `
      <span>IMAGEM</span>
      <span>NOME / DESCRIÇÃO</span>
      <span>CAT. PRINCIPAL</span>
      <span>CATEGORIAS & FILTROS</span>
      <span>PREÇO / STOCK</span>
      <span>PROMOÇÃO</span>
      <span>AÇÕES</span>
    `;
  }

  // ===== RENDER TABELA DE PRODUTOS =====
  function renderProducts(products) {
    updateTableHeader();
    productsList.innerHTML = '';

    if (!products.length) {
      productsList.innerHTML = `
        <div style="padding:40px;text-align:center;font-family:'Courier New',monospace;
          border:3px dashed #000;margin:16px;background:#f5f5f5;">
          <div style="font-size:40px;margin-bottom:12px">📦</div>
          <div style="font-weight:bold;font-size:14px;letter-spacing:2px">SEM PRODUTOS</div>
        </div>`;
      return;
    }

    products.forEach(p => {
      const row = document.createElement('div');
      row.className = 'product-item';
      row.dataset.productId = p.id;

      // — Imagem —
      const firstImage = (p.images && p.images.length) ? p.images[0] : null;
      const imageHTML = firstImage
        ? `<img src="${firstImage}" alt="${encodeHTML(p.name)}" loading="lazy">`
        : `<div class="no-img-placeholder">📦</div>`;

      // — Descrição —
      const rawDesc    = stripHtml(p.description);
      const descPreview = rawDesc.length > 120 ? rawDesc.slice(0, 120) + '…' : rawDesc;

      // — Categoria principal —
      const pc = p.primary_category;
      const primaryCatHTML = pc
        ? `<span class="primary-cat-tag">
            <span class="cat-icon">${pc.icon || '📂'}</span>
            ${encodeHTML(pc.name)}
           </span>`
        : `<span class="no-sec-cats">—</span>`;

      // — Categorias & filtros —
      const secs       = p.secondary_categories || [];
      const filterTags = p.filter_tags || [];
      const secCatsHTML = secs.map(c =>
        `<span class="sec-cat-pill role-${c.category_role || 'secondary'}">
          ${c.category_role === 'tag' ? '🏷️ ' : '📌 '}${encodeHTML(c.name)}
         </span>`
      ).join('');
      const groupedFilters = {};
      filterTags.forEach(t => {
        const k = String(t.filter_id);
        if (!groupedFilters[k]) groupedFilters[k] = { name: t.filter_name, tags: [] };
        groupedFilters[k].tags.push(t);
      });
      const filterTagsHTML = Object.values(groupedFilters).map(g =>
        g.tags.map(t =>
          `<span class="filter-tag-pill" title="${encodeHTML(g.name)}">
            🔧 ${encodeHTML(t.tag_name)}
           </span>`
        ).join('')
      ).join('');
      const combinedCatsHTML = (secs.length || filterTags.length)
        ? secCatsHTML + filterTagsHTML
        : `<span class="no-sec-cats">—</span>`;

      // — Stock —
      const stockBadge = p.stock
        ? `<span class="in-stock">✓ Stock</span>`
        : `<span class="out-stock">✗ S/ Stock</span>`;
      const statusBadge = p.is_active
        ? `<span class="status-active-badge">ATIVO</span>`
        : `<span class="status-inactive-badge">INATIVO</span>`;

      // — Promoção —
      let promoHTML = '';
      if (p.is_on_promotion && p.discount_percent) {
        const discounted = p.price_discounted
          ?? (p.price * (1 - p.discount_percent / 100)).toFixed(2);
        promoHTML = `
          <span class="promo-badge-on">🔥 -${p.discount_percent}%</span>
          <span class="promo-price-old">€${Number(p.price).toFixed(2)}</span>
          <span class="promo-price-new">€${Number(discounted).toFixed(2)}</span>
          ${p.promotion_label
            ? `<span class="promo-label-text">${encodeHTML(p.promotion_label)}</span>`
            : ''}
          <button class="btn-promo-quick remove" data-id="${p.id}" title="Remover promoção">✕ REMOVER</button>`;
      } else {
        promoHTML = `
          <span class="promo-badge-off">Sem promoção</span>
          <button class="btn-promo-quick" data-id="${p.id}"
            data-name="${encodeHTML(p.name)}"
            data-price="${p.price}"
            title="Definir promoção">🏷 DEFINIR</button>`;
      }

      row.innerHTML = `
        <div class="product-cell product-cell-image">${imageHTML}</div>

        <div class="product-cell product-cell-main">
          <div class="prod-name">${encodeHTML(p.name)}</div>
          ${descPreview ? `<div class="prod-desc">${encodeHTML(descPreview)}</div>` : ''}
        </div>

        <div class="product-cell product-cell-primary-cat">${primaryCatHTML}</div>

        <div class="product-cell product-cell-sec-cats">${combinedCatsHTML}</div>

        <div class="product-cell product-cell-stock">
          <span class="product-price-val">€${Number(p.price).toFixed(2)}</span>
          <div style="margin-top:6px">${stockBadge}</div>
          <div style="margin-top:4px">${statusBadge}</div>
        </div>

        <div class="product-cell product-cell-promo">${promoHTML}</div>

        <div class="product-cell product-cell-actions">
          <button class="view-btn">👁 VER</button>
          <button class="edit-btn">✏️ EDITAR</button>
        </div>
      `;

      // Eventos
      row.querySelector('.view-btn').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('openViewProductModal', { detail: p }));
      });
      row.querySelector('.edit-btn').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('openEditProductModal', { detail: p }));
      });

      // Botão definir promoção
      const defineBtn = row.querySelector('.btn-promo-quick:not(.remove)');
      defineBtn?.addEventListener('click', () => openPromoModal(p));

      // Botão remover promoção
      const removeBtn = row.querySelector('.btn-promo-quick.remove');
      removeBtn?.addEventListener('click', () => confirmRemovePromo(p));

      productsList.appendChild(row);
    });
  }

  // ===== FILTROS =====
  function applyFilters() {
    let filtered = [...allProducts];

    const search   = searchInput?.value.toLowerCase()    || '';
    const active   = activeFilter?.value                 || '';
    const stock    = stockFilter?.value                  || '';
    const priceMin = Number(priceMinInput?.value)        || 0;
    const priceMax = Number(priceMaxInput?.value)        || 0;
    const category = categoryFilter?.value.toLowerCase() || '';
    const promo    = promoFilter?.value                  || '';

    filtered = filtered.filter(p => {
      if (search && !p.name.toLowerCase().includes(search)) return false;
      if (active !== '' && String(p.is_active) !== active) return false;
      if (stock  !== '' && String(p.stock) !== stock)       return false;
      if (priceMin && Number(p.price) < priceMin)           return false;
      if (priceMax && Number(p.price) > priceMax)           return false;
      if (promo === 'true'  && !p.is_on_promotion)          return false;
      if (promo === 'false' && p.is_on_promotion)           return false;
      if (category) {
        const pcMatch = (p.primary_category?.name || '').toLowerCase().includes(category);
        const scMatch = (p.secondary_categories || []).some(c =>
          c.name.toLowerCase().includes(category));
        const ftMatch = (p.filter_tags || []).some(t =>
          t.tag_name.toLowerCase().includes(category) ||
          t.filter_name.toLowerCase().includes(category));
        if (!pcMatch && !scMatch && !ftMatch) return false;
      }
      return true;
    });

    renderProducts(filtered);
  }

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    updateTableHeader();
    productsList.innerHTML = `
      <div style="padding:32px;text-align:center;font-family:'Courier New',monospace;
        font-weight:bold;letter-spacing:1px;border:2px dashed #000;margin:16px;background:#f5f5f5;">
        ⏳ A carregar produtos...
      </div>`;
    try {
      const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProducts = await res.json();
      console.log(`✅ ${allProducts.length} produtos carregados`);
      applyFilters();
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      productsList.innerHTML = `
        <div style="padding:32px;text-align:center;font-family:'Courier New',monospace;
          color:#FF0000;font-weight:bold;letter-spacing:1px;border:3px solid #FF0000;margin:16px;">
          ❌ ERRO AO CARREGAR PRODUTOS
        </div>`;
    }
  }

  // ===== RENDER ABA PROMOÇÕES =====
  function renderPromotions(promos) {
    if (!promotionsList) return;

    const header = document.querySelector('#promotions .table-header');
    if (header) {
      header.innerHTML = `
        <span>IMAGEM</span>
        <span>PRODUTO</span>
        <span>PREÇO ORIG.</span>
        <span>DESCONTO</span>
        <span>PREÇO FINAL</span>
        <span>PERÍODO / ESTADO</span>
        <span>AÇÕES</span>
      `;
    }

    promotionsList.innerHTML = '';

    if (!promos.length) {
      promotionsList.innerHTML = `
        <div style="padding:48px;text-align:center;font-family:'Courier New',monospace;
          border:3px dashed #dc2626;margin:16px;background:#fff5f5;">
          <div style="font-size:40px;margin-bottom:12px">🏷️</div>
          <div style="font-weight:bold;font-size:14px;letter-spacing:2px;color:#dc2626">
            SEM PROMOÇÕES ATIVAS
          </div>
          <div style="font-size:12px;color:#888;margin-top:8px">
            Define promoções na aba Produtos, na coluna PROMOÇÃO de cada produto.
          </div>
        </div>`;
      return;
    }

    promos.forEach(p => {
      const row    = document.createElement('div');
      row.className = 'promo-item';

      const firstImage = (p.images && p.images.length) ? p.images[0] : null;
      const imageHTML  = firstImage
        ? `<img src="${firstImage}" alt="${encodeHTML(p.name)}" loading="lazy">`
        : `<div class="no-img-placeholder">📦</div>`;

      const discounted = p.price_discounted
        ?? (p.price * (1 - p.discount_percent / 100)).toFixed(2);

      const status = promoStatus(p);
      const statusBadgeMap = {
        active:    `<span class="promo-status-active">● ATIVA</span>`,
        scheduled: `<span class="promo-status-scheduled">⏰ AGENDADA</span>`,
        expired:   `<span class="promo-status-expired">✗ EXPIRADA</span>`,
      };

      const datesHTML = `
        <div class="promo-dates">
          ${p.promotion_start ? `Início: <span>${formatDate(p.promotion_start)}</span><br>` : ''}
          ${p.promotion_end   ? `Fim: <span>${formatDate(p.promotion_end)}</span><br>` : ''}
          ${p.promotion_label ? `Label: <span>${encodeHTML(p.promotion_label)}</span>` : ''}
        </div>`;

      row.innerHTML = `
        <div class="promo-cell promo-cell-image">${imageHTML}</div>

        <div class="promo-cell" style="border-right:2px solid #000;padding:10px 16px;gap:4px;">
          <div style="font-weight:bold;font-size:13px;text-transform:uppercase">
            ${encodeHTML(p.name)}
          </div>
          ${p.primary_category
            ? `<span style="font-size:10px;color:#666">${encodeHTML(p.primary_category.name)}</span>`
            : ''}
        </div>

        <div class="promo-cell" style="border-right:2px solid #000;">
          <span style="text-decoration:line-through;color:#999;font-size:13px">
            €${Number(p.price).toFixed(2)}
          </span>
        </div>

        <div class="promo-cell" style="border-right:2px solid #000;align-items:center;">
          <span class="discount-pill">-${p.discount_percent}%</span>
        </div>

        <div class="promo-cell" style="border-right:2px solid #000;">
          <span style="font-size:18px;font-weight:bold;color:#dc2626">
            €${Number(discounted).toFixed(2)}
          </span>
        </div>

        <div class="promo-cell" style="border-right:2px solid #000;gap:6px;">
          ${statusBadgeMap[status]}
          ${datesHTML}
        </div>

        <div class="promo-cell" style="gap:6px;align-items:center;">
          <button class="btn-promo-edit" data-id="${p.id}"
            style="width:100%;padding:6px 8px;border:2px solid #000;background:#000;color:#fff;
            font-family:'Courier New',monospace;font-size:10px;font-weight:bold;cursor:pointer;
            letter-spacing:0.5px;transition:all 0.15s">
            ✏️ EDITAR
          </button>
          <button class="btn-promo-remove" data-id="${p.id}"
            style="width:100%;padding:6px 8px;border:2px solid #dc2626;background:#fff;color:#dc2626;
            font-family:'Courier New',monospace;font-size:10px;font-weight:bold;cursor:pointer;
            letter-spacing:0.5px;transition:all 0.15s">
            ✕ REMOVER
          </button>
        </div>
      `;

      row.querySelector('.btn-promo-edit').addEventListener('click', () => openPromoModal(p));
      row.querySelector('.btn-promo-remove').addEventListener('click', () => confirmRemovePromo(p));

      promotionsList.appendChild(row);
    });
  }

  // ===== LOAD ABA PROMOÇÕES =====
  async function loadPromotions() {
    if (!promotionsList) return;
    promotionsList.innerHTML = `
      <div style="padding:32px;text-align:center;font-family:'Courier New',monospace;
        font-weight:bold;color:#dc2626;letter-spacing:1px;">
        ⏳ A carregar promoções...
      </div>`;
    try {
      const res = await fetch(`${API_BASE}/products/promotions`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderPromotions(data);
    } catch (err) {
      console.error('Erro ao carregar promoções:', err);
      promotionsList.innerHTML = `
        <div style="padding:32px;text-align:center;font-family:'Courier New',monospace;
          color:#FF0000;font-weight:bold;border:3px solid #FF0000;margin:16px;">
          ❌ ERRO AO CARREGAR PROMOÇÕES
        </div>`;
    }
  }

  // ===== MODAL DE PROMOÇÃO =====
  function openPromoModal(product) {
    // Remove modal anterior se existir
    document.getElementById('promoModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'promoModal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.85);
      display:flex;align-items:center;justify-content:center;z-index:10000;`;

    const startVal = product.promotion_start
      ? new Date(product.promotion_start).toISOString().slice(0,16)
      : '';
    const endVal = product.promotion_end
      ? new Date(product.promotion_end).toISOString().slice(0,16)
      : '';

    modal.innerHTML = `
      <div style="background:#fff;border:4px solid #000;padding:28px;width:460px;max-width:95%;
                  box-shadow:12px 12px 0 #000;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-bottom:20px;border-bottom:3px solid #000;padding-bottom:12px;">
          <h3 style="font-family:'Courier New',monospace;font-size:16px;font-weight:bold;
                     text-transform:uppercase;letter-spacing:1px;">
            🏷️ PROMOÇÃO — ${encodeHTML(product.name)}
          </h3>
          <button id="promoModalClose"
            style="background:none;border:none;font-size:24px;cursor:pointer;font-weight:bold;">
            ×
          </button>
        </div>

        <form id="promoForm">
          <div style="margin-bottom:16px;">
            <label style="display:block;font-family:'Courier New',monospace;font-size:12px;
                          font-weight:bold;text-transform:uppercase;letter-spacing:1px;
                          margin-bottom:6px;">
              Desconto (%) *
            </label>
            <input type="number" id="promoDiscount" min="1" max="99"
              value="${product.discount_percent || ''}"
              placeholder="Ex: 20"
              required
              style="width:100%;padding:10px;border:2px solid #000;
                     font-family:'Courier New',monospace;font-size:16px;font-weight:bold;">
            <div id="promoPreview" style="margin-top:8px;padding:10px;background:#f5f5f5;
                                           border:2px solid #e0e0e0;font-family:'Courier New',monospace;
                                           font-size:12px;display:none;">
            </div>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block;font-family:'Courier New',monospace;font-size:12px;
                          font-weight:bold;text-transform:uppercase;letter-spacing:1px;
                          margin-bottom:6px;">
              Label (opcional)
            </label>
            <input type="text" id="promoLabel"
              value="${encodeHTML(product.promotion_label || '')}"
              placeholder="Ex: Black Friday, Saldo de Verão..."
              style="width:100%;padding:10px;border:2px solid #000;
                     font-family:'Courier New',monospace;font-size:13px;">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:12px;
                            font-weight:bold;text-transform:uppercase;letter-spacing:1px;
                            margin-bottom:6px;">
                Início (opcional)
              </label>
              <input type="datetime-local" id="promoStart" value="${startVal}"
                style="width:100%;padding:8px;border:2px solid #000;
                       font-family:'Courier New',monospace;font-size:12px;">
            </div>
            <div>
              <label style="display:block;font-family:'Courier New',monospace;font-size:12px;
                            font-weight:bold;text-transform:uppercase;letter-spacing:1px;
                            margin-bottom:6px;">
                Fim (opcional)
              </label>
              <input type="datetime-local" id="promoEnd" value="${endVal}"
                style="width:100%;padding:8px;border:2px solid #000;
                       font-family:'Courier New',monospace;font-size:12px;">
            </div>
          </div>

          <div id="promoError"
            style="display:none;padding:10px;background:#fff0f0;border:2px solid #dc2626;
                   font-family:'Courier New',monospace;font-size:12px;color:#dc2626;
                   margin-bottom:12px;">
          </div>

          <div style="display:flex;gap:10px;">
            <button type="submit" id="promoSubmitBtn"
              style="flex:1;padding:12px;background:#000;color:#fff;border:3px solid #000;
                     font-family:'Courier New',monospace;font-size:13px;font-weight:bold;
                     text-transform:uppercase;cursor:pointer;letter-spacing:1px;">
              🔥 ATIVAR PROMOÇÃO
            </button>
            <button type="button" id="promoModalClose2"
              style="padding:12px 20px;background:#fff;color:#000;border:3px solid #000;
                     font-family:'Courier New',monospace;font-size:13px;font-weight:bold;
                     cursor:pointer;">
              CANCELAR
            </button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(modal);

    // Preview de preço
    const discountInput = modal.querySelector('#promoDiscount');
    const preview       = modal.querySelector('#promoPreview');
    function updatePreview() {
      const d = parseInt(discountInput.value);
      if (d >= 1 && d <= 99) {
        const final = (product.price * (1 - d / 100)).toFixed(2);
        preview.style.display = 'block';
        preview.innerHTML = `
          Preço original: <strong>€${Number(product.price).toFixed(2)}</strong> →
          Desconto: <strong style="color:#dc2626">-${d}%</strong> →
          Preço final: <strong style="color:#dc2626">€${final}</strong>`;
      } else {
        preview.style.display = 'none';
      }
    }
    discountInput.addEventListener('input', updatePreview);
    updatePreview();

    // Fechar
    const closeModal = () => modal.remove();
    modal.querySelector('#promoModalClose').addEventListener('click', closeModal);
    modal.querySelector('#promoModalClose2').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // Submit
    modal.querySelector('#promoForm').addEventListener('submit', async e => {
      e.preventDefault();
      const errEl  = modal.querySelector('#promoError');
      const submitBtn = modal.querySelector('#promoSubmitBtn');
      errEl.style.display = 'none';

      const discount = parseInt(modal.querySelector('#promoDiscount').value);
      const label    = modal.querySelector('#promoLabel').value.trim();
      const start    = modal.querySelector('#promoStart').value;
      const end      = modal.querySelector('#promoEnd').value;

      if (!discount || discount < 1 || discount > 99) {
        errEl.textContent = 'O desconto deve ser entre 1% e 99%.';
        errEl.style.display = 'block';
        return;
      }

      if (end && start && new Date(end) <= new Date(start)) {
        errEl.textContent = 'A data de fim deve ser posterior à data de início.';
        errEl.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ A guardar...';

      const payload = {
        is_on_promotion:  true,
        discount_percent: discount,
        promotion_label:  label || null,
        promotion_start:  start || null,
        promotion_end:    end   || null,
      };

      console.group(`[Promoção] PUT /products/${product.id}/promotion`);
      console.log('Produto:', { id: product.id, name: product.name, price: product.price });
      console.log('Payload enviado:', payload);

      try {
        const res = await fetch(`${API_BASE}/products/${product.id}/promotion`, {
          method: 'PUT',
          headers: authJson(),
          body: JSON.stringify(payload),
        });

        const responseText = await res.text();
        console.log('HTTP Status:', res.status, res.statusText);

        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Resposta da API:', responseData);
        } catch (_) {
          console.warn('Resposta não é JSON válido:', responseText);
          responseData = { error: responseText };
        }

        if (!res.ok) {
          console.error('Erro da API:', responseData);
          console.groupEnd();
          throw new Error(responseData.error || `Erro HTTP ${res.status}`);
        }

        console.log('✅ Promoção guardada com sucesso:', responseData);
        console.groupEnd();

        closeModal();
        await loadProducts();
        // Se a aba promoções estiver visível, recarregar também
        if (!document.getElementById('promotions')?.classList.contains('hidden')) {
          await loadPromotions();
        }
      } catch (err) {
        console.error('❌ Falha ao guardar promoção:', err.message);
        console.groupEnd();
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '🔥 ATIVAR PROMOÇÃO';
      }
    });
  }

  // ===== REMOVER PROMOÇÃO =====
  async function confirmRemovePromo(product) {
    if (!confirm(`Remover promoção de "${product.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/products/${product.id}/promotion`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao remover promoção');
      await loadProducts();
      if (!document.getElementById('promotions')?.classList.contains('hidden')) {
        await loadPromotions();
      }
    } catch (err) {
      alert(err.message);
    }
  }

  // ===== EVENTOS =====
  [searchInput, activeFilter, stockFilter, priceMinInput, priceMaxInput, categoryFilter, promoFilter]
    .forEach(el => el?.addEventListener('input', applyFilters));

  // Carregar promoções ao activar a aba
  document.addEventListener('tabChanged', e => {
    if (e.detail === 'promotions') loadPromotions();
  });

  document.addEventListener('DOMContentLoaded', loadProducts);
  window.reloadProducts  = loadProducts;
  window.reloadPromotions = loadPromotions;

  console.log('✅ products.js carregado (com promoções)');
})();