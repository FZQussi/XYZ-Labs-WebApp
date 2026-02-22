// Frontend/Dashboard/scripts/products.js
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

  // ===== RENDER =====
  function renderProducts(products) {
    productsList.innerHTML = '';

    if (!products.length) {
      productsList.innerHTML = '<div style="padding:16px;font-family:monospace">Sem produtos.</div>';
      return;
    }

    products.forEach(p => {
      const row = document.createElement('div');
      row.className = 'product-item';
      row.dataset.productId = p.id;

      const primaryCat = p.primary_category ? p.primary_category.name : '—';

      row.innerHTML = `
        <span class="product-name">${p.name}</span>
        <span>€${Number(p.price).toFixed(2)}</span>
        <span class="${p.stock ? 'in-stock' : 'out-stock'}">
          ${p.stock ? 'Disponivel' : 'Indisponivel'}
        </span>
        <span>${primaryCat}</span>
        <span class="status ${p.is_active ? 'active' : 'inactive'}">
          ${p.is_active ? 'Ativo' : 'Inativo'}
        </span>
        <div class="actions">
          <button class="secondary-btn view-btn">Detalhes</button>
          <button class="primary-btn edit-btn">Editar</button>
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

    const search   = searchInput?.value.toLowerCase()  || '';
    const active   = activeFilter?.value               || '';
    const stock    = stockFilter?.value                || '';
    const priceMin = Number(priceMinInput?.value)      || 0;
    const priceMax = Number(priceMaxInput?.value)      || 0;
    const category = categoryFilter?.value.toLowerCase() || '';

    filtered = filtered.filter(p => {
      if (search   && !p.name.toLowerCase().includes(search))          return false;
      if (active   !== '' && String(p.is_active) !== active)           return false;
      if (stock    !== '' && String(p.stock) !== stock)                return false;
      if (priceMin && Number(p.price) < priceMin)                      return false;
      if (priceMax && Number(p.price) > priceMax)                      return false;
      if (category && !(p.primary_category?.name || '').toLowerCase().includes(category)) return false;
      return true;
    });

    renderProducts(filtered);
  }

  // ===== LOAD =====
  async function loadProducts() {
    productsList.innerHTML = '<div style="padding:16px;font-family:monospace">A carregar...</div>';
    try {
      const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProducts = await res.json();
      console.log(`✅ ${allProducts.length} produtos carregados`);
      applyFilters();
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      productsList.innerHTML = '<div style="padding:16px;color:red;font-family:monospace">Erro ao carregar produtos.</div>';
    }
  }

  // ===== EVENTOS =====
  [searchInput, activeFilter, stockFilter, priceMinInput, priceMaxInput, categoryFilter]
    .forEach(el => el?.addEventListener('input', applyFilters));

  document.addEventListener('DOMContentLoaded', loadProducts);
  window.reloadProducts = loadProducts;

  console.log('✅ products.js carregado');
})();