// Frontend/Dashboard/scripts/products.js — ATUALIZADO COM IMAGENS E CATEGORIAS
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

  let allProducts = [];

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== INJETAR CSS DA GRELHA DE PRODUTOS =====
  (function injectStyles() {
    if (document.getElementById('products-grid-style')) return;
    const style = document.createElement('style');
    style.id = 'products-grid-style';
    style.textContent = `
      /* ---- Substituir table header por header de grelha ---- */
      #products .table-header {
        display: grid;
        grid-template-columns: 100px 1fr 160px 160px 90px 120px;
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

      /* ---- Linha de produto expandida ---- */
      .product-item {
        display: grid;
        grid-template-columns: 100px 1fr 160px 160px 90px 120px;
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

      .product-item:last-child {
        border-bottom: none;
      }

      /* ---- Célula de imagem ---- */
      .product-cell {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-right: 1px solid #e0e0e0;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }

      .product-cell:last-child {
        border-right: none;
      }

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

      /* ---- Célula de info principal ---- */
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

      /* ---- Célula de categoria principal ---- */
      .product-cell-primary-cat {
        border-right: 2px solid #000;
        gap: 4px;
      }

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

      .primary-cat-tag .cat-icon {
        font-size: 14px;
        flex-shrink: 0;
      }

      /* ---- Célula de categorias secundárias ---- */
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

      .sec-cat-pill.role-tag {
        border-style: dashed;
        background: #fefce8;
      }

      .sec-cat-pill.role-secondary {
        background: #f0f0f0;
      }

      .no-sec-cats {
        font-size: 11px;
        color: #aaa;
        font-style: italic;
      }

      /* ---- Célula de stock ---- */
      .product-cell-stock {
        border-right: 2px solid #000;
        align-items: center;
      }

      /* ---- Célula de ações ---- */
      .product-cell-actions {
        align-items: center;
        gap: 6px;
      }

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

      .product-cell-actions .view-btn {
        background: #fff;
        color: #000;
      }

      .product-cell-actions .view-btn:hover {
        background: #000;
        color: #fff;
        transform: translate(-2px, -2px);
        box-shadow: 2px 2px 0 #000;
      }

      .product-cell-actions .edit-btn {
        background: #000;
        color: #fff;
      }

      .product-cell-actions .edit-btn:hover {
        background: #fff;
        color: #000;
        transform: translate(-2px, -2px);
        box-shadow: 2px 2px 0 #000;
      }

      /* ---- Preço destacado ---- */
      .product-price-val {
        font-size: 16px;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      /* ---- Status badges ---- */
      .status-active-badge {
        display: inline-block;
        padding: 3px 8px;
        border: 2px solid #000;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
        background: #00FF00;
        color: #000;
      }

      .status-inactive-badge {
        display: inline-block;
        padding: 3px 8px;
        border: 2px solid #000;
        font-size: 10px;
        font-weight: bold;
        letter-spacing: 0.5px;
        background: #FF0000;
        color: #fff;
      }

      /* ---- Responsive ---- */
      @media (max-width: 1200px) {
        .product-item,
        #products .table-header {
          grid-template-columns: 80px 1fr 140px 130px 80px 110px;
        }
      }

      @media (max-width: 900px) {
        .product-item,
        #products .table-header {
          grid-template-columns: 70px 1fr 100px 80px;
        }

        .product-cell-sec-cats,
        #products .table-header span:nth-child(4) {
          display: none;
        }
      }

      @media (max-width: 650px) {
        .product-item,
        #products .table-header {
          grid-template-columns: 60px 1fr 80px;
        }

        .product-cell-primary-cat,
        #products .table-header span:nth-child(3) {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  })();

  // ===== ATUALIZAR HEADER DA TABELA =====
  function updateTableHeader() {
    const header = document.querySelector('#products .table-header');
    if (!header) return;
    header.innerHTML = `
      <span>IMAGEM</span>
      <span>NOME / DESCRIÇÃO</span>
      <span>CAT. PRINCIPAL</span>
      <span>TAGS / SEC.</span>
      <span>PREÇO / STOCK</span>
      <span>AÇÕES</span>
    `;
  }

  // ===== STRIP HTML PARA DESCRIÇÃO =====
  function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // ===== RENDER =====
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
        ? `<img src="${firstImage}" alt="${p.name}" loading="lazy">`
        : `<div class="no-img-placeholder">📦</div>`;

      // — Descrição limpa —
      const rawDesc = stripHtml(p.description);
      const descPreview = rawDesc.length > 120 ? rawDesc.slice(0, 120) + '…' : rawDesc;

      // — Categoria principal —
      const pc = p.primary_category;
      const primaryCatHTML = pc
        ? `<span class="primary-cat-tag">
            <span class="cat-icon">${pc.icon || '📂'}</span>
            ${window.encodeHTML ? window.encodeHTML(pc.name) : pc.name}
           </span>`
        : `<span class="no-sec-cats">—</span>`;

      // — Categorias secundárias —
      const secs = p.secondary_categories || [];
      const secCatsHTML = secs.length
        ? secs.map(c =>
            `<span class="sec-cat-pill role-${c.category_role || 'secondary'}">
              ${c.category_role === 'tag' ? '🏷️ ' : ''}${window.encodeHTML ? window.encodeHTML(c.name) : c.name}
             </span>`
          ).join('')
        : `<span class="no-sec-cats">Sem tags</span>`;

      // — Stock —
      const stockBadge = p.stock
        ? `<span class="in-stock">✓ Stock</span>`
        : `<span class="out-stock">✗ S/ Stock</span>`;

      // — Estado —
      const statusBadge = p.is_active
        ? `<span class="status-active-badge">ATIVO</span>`
        : `<span class="status-inactive-badge">INATIVO</span>`;

      row.innerHTML = `
        <div class="product-cell product-cell-image">
          ${imageHTML}
        </div>

        <div class="product-cell product-cell-main">
          <div class="prod-name">${window.encodeHTML ? window.encodeHTML(p.name) : p.name}</div>
          ${descPreview ? `<div class="prod-desc">${window.encodeHTML ? window.encodeHTML(descPreview) : descPreview}</div>` : ''}
        </div>

        <div class="product-cell product-cell-primary-cat">
          ${primaryCatHTML}
        </div>

        <div class="product-cell product-cell-sec-cats">
          ${secCatsHTML}
        </div>

        <div class="product-cell product-cell-stock">
          <span class="product-price-val">€${Number(p.price).toFixed(2)}</span>
          <div style="margin-top:6px">${stockBadge}</div>
          <div style="margin-top:4px">${statusBadge}</div>
        </div>

        <div class="product-cell product-cell-actions">
          <button class="view-btn">👁 VER</button>
          <button class="edit-btn">✏️ EDITAR</button>
        </div>
      `;

      row.querySelector('.view-btn').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('openViewProductModal', { detail: p }));
      });
      row.querySelector('.edit-btn').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('openEditProductModal', { detail: p }));
      });

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

    filtered = filtered.filter(p => {
      if (search && !p.name.toLowerCase().includes(search)) return false;
      if (active !== '' && String(p.is_active) !== active) return false;
      if (stock  !== '' && String(p.stock) !== stock)       return false;
      if (priceMin && Number(p.price) < priceMin)           return false;
      if (priceMax && Number(p.price) > priceMax)           return false;
      if (category) {
        const pcMatch = (p.primary_category?.name || '').toLowerCase().includes(category);
        const scMatch = (p.secondary_categories || []).some(c =>
          c.name.toLowerCase().includes(category)
        );
        if (!pcMatch && !scMatch) return false;
      }
      return true;
    });

    renderProducts(filtered);
  }

  // ===== LOAD =====
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

  // ===== EVENTOS =====
  [searchInput, activeFilter, stockFilter, priceMinInput, priceMaxInput, categoryFilter]
    .forEach(el => el?.addEventListener('input', applyFilters));

  document.addEventListener('DOMContentLoaded', loadProducts);
  window.reloadProducts = loadProducts;

  console.log('✅ products.js carregado (com imagens e categorias)');
})();