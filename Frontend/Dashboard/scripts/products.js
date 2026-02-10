// ==== products.js ====
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const productsList = document.getElementById('productsList');

  // filtros
  const searchInput = document.getElementById('productSearch');
  const activeFilter = document.getElementById('productFilterActive');
  const stockFilter = document.getElementById('productFilterStock');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const categoryFilter = document.getElementById('productFilterCategory');
  const primaryCategoryFilter = document.getElementById('productFilterPrimaryCategory');

  let allProducts = [];

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== RENDER =====
  function renderProducts(products) {
    productsList.innerHTML = '';

    if (!products.length) {
      productsList.innerHTML = '<div style="padding:10px">Sem produtos.</div>';
      return;
    }

    products.forEach(p => {
      const row = document.createElement('div');
      row.className = 'product-item';

      const categories = (p.categories || [])
        .map(c => c.name)
        .join(', ');

      row.innerHTML = `
        <span class="product-name">${p.name}</span>
        <span>€${Number(p.price).toFixed(2)}</span>
        <span class="${p.stock ? 'in-stock' : 'out-stock'}">
          ${p.stock ? 'Disponível' : 'Indisponível'}
        </span>
        <span>${categories || '—'}</span>
        <span class="status ${p.is_active ? 'active' : 'inactive'}">
          ${p.is_active ? 'Ativo' : 'Inativo'}
        </span>
        <div class="actions">
          <button class="secondary-btn view-btn">Detalhes</button>
          <button class="primary-btn edit-btn">Editar</button>
        </div>
      `;

      row.querySelector('.view-btn').addEventListener('click', () => {
        document.dispatchEvent(
          new CustomEvent('openViewProductModal', { detail: p })
        );
      });

      row.querySelector('.edit-btn').addEventListener('click', () => {
        document.dispatchEvent(
          new CustomEvent('openEditProductModal', { detail: p })
        );
      });

      productsList.appendChild(row);
    });
  }

  // ===== APPLY FILTERS =====
  function applyFilters() {
    let filtered = [...allProducts];

    const search = searchInput.value.toLowerCase();
    const active = activeFilter.value;
    const stock = stockFilter.value;
    const priceMin = Number(priceMinInput.value);
    const priceMax = Number(priceMaxInput.value);
    const category = categoryFilter.value.toLowerCase();
    const primaryCategory = primaryCategoryFilter.value.toLowerCase();

    filtered = filtered.filter(p => {

      if (search && !p.name.toLowerCase().includes(search)) return false;

      if (active !== '' && String(p.is_active) !== active) return false;

      if (stock !== '' && String(p.stock) !== stock) return false;

      if (priceMin && Number(p.price) < priceMin) return false;

      if (priceMax && Number(p.price) > priceMax) return false;

      if (category) {
        const hasCategory = (p.categories || []).some(c =>
          c.name.toLowerCase().includes(category)
        );
        if (!hasCategory) return false;
      }

      if (primaryCategory) {
        const hasPrimary = (p.categories || []).some(c =>
          c.is_primary &&
          c.name.toLowerCase().includes(primaryCategory)
        );
        if (!hasPrimary) return false;
      }

      return true;
    });

    renderProducts(filtered);
  }

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    productsList.innerHTML = '<div style="padding:10px">A carregar...</div>';

    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: authHeaders()
      });

      if (!res.ok) throw new Error();

      allProducts = await res.json();

      console.log('Produtos recebidos:', allProducts);

      applyFilters();

    } catch (err) {
      console.error(err);
      productsList.innerHTML =
        '<div style="padding:10px;color:red">Erro ao carregar produtos.</div>';
    }
  }

  // ===== EVENTS =====
  [
    searchInput,
    activeFilter,
    stockFilter,
    priceMinInput,
    priceMaxInput,
    categoryFilter,
    primaryCategoryFilter
  ].forEach(el => {
    if (el) el.addEventListener('input', applyFilters);
  });

  document.addEventListener('DOMContentLoaded', loadProducts);

  window.reloadProducts = loadProducts;
})();
