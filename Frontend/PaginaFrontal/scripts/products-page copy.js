// ============================================================
// products-page.js
// Gestão de produtos:
//   - Carregar e renderizar produtos
//   - Aplicar filtros (lê estado do products-filters.js)
//   - Paginação e ordenação
// ============================================================

let allProducts      = [];
let filteredProducts = [];
let currentPage      = 1;
const productsPerPage = 56;

// ============================================================
// LOAD PRODUCTS
// ============================================================
async function loadProducts() {
  try {
    const res  = await fetch(`${API_BASE}/products`);
    allProducts = await res.json();
    filteredProducts = [...allProducts];
    updateProductsCount();
    renderProducts();
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    document.getElementById('productsGrid').innerHTML =
      '<p class="error">Erro ao carregar produtos</p>';
  }
}

// ============================================================
// APPLY FILTERS
// Lê o estado do products-filters.js (selectedPrimaryId, etc.)
// ============================================================
function applyFilters() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const minPrice   = parseFloat(document.getElementById('minPrice')?.value) || 0;
  const maxPrice   = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
  const stockValue = document.getElementById('filterStock')?.value || '';

  const selectedSecondaryIds = Array.from(
    document.querySelectorAll('.secondary-cat-checkbox:checked')
  ).map(cb => parseInt(cb.value));

  filteredProducts = allProducts.filter(product => {
    const price = Number(product.price);

    if (searchTerm && !product.name.toLowerCase().includes(searchTerm)) return false;
    if (price < minPrice || price > maxPrice) return false;
    if (stockValue === 'true'  && !product.stock) return false;
    if (stockValue === 'false' &&  product.stock) return false;

    // Categoria primária (só uma)
    if (selectedPrimaryId) {
      if (product.primary_category?.id !== selectedPrimaryId) return false;
    }

    // Categorias secundárias (AND — produto tem todas as selecionadas)
    if (selectedSecondaryIds.length) {
      const productSecIds = (product.secondary_categories || []).map(c => c.id);
      if (!selectedSecondaryIds.every(id => productSecIds.includes(id))) return false;
    }

    return true;
  });

  currentPage = 1;
  updateProductsCount();
  renderProducts();
}

// ============================================================
// SORT
// ============================================================
function sortProducts() {
  const sortBy = document.getElementById('sortBy')?.value;

  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':  return Number(a.price) - Number(b.price);
      case 'price-desc': return Number(b.price) - Number(a.price);
      case 'name':       return a.name.localeCompare(b.name);
      default:           return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  currentPage = 1;
  renderProducts();
}

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const start     = (currentPage - 1) * productsPerPage;
  const paginated = filteredProducts.slice(start, start + productsPerPage);

  if (!paginated.length) {
    grid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
    renderPagination();
    return;
  }

  grid.innerHTML = paginated.map(product => {
const image = product.images?.[0] || '/lib/images/placeholder.jpg';

    const primaryTag = product.primary_category
      ? `<span class="tag tag-primary">${product.primary_category.name}</span>`
      : '';

    const secTags = (product.secondary_categories || [])
      .map(c => `<span class="tag tag-secondary">${c.name}</span>`)
      .join('');

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <img src="${image}" alt="${product.name}" loading="lazy">
          ${!product.stock ? '<div class="out-of-stock">Esgotado</div>' : ''}
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="product-tags">${primaryTag}${secTags}</div>
          <div class="product-footer">
            <span class="product-price">€${Number(product.price).toFixed(2)}</span>
            <div class="product-actions">
              <button class="btn-view" onclick="viewProduct(${product.id})">Ver Detalhes</button>
              ${product.stock
                ? `<button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})">🛒</button>`
                : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  addCardClickListeners();
  renderPagination();
}

// ============================================================
// CARD CLICK
// ============================================================
function addCardClickListeners() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-view') || e.target.closest('.btn-add-cart')) return;
      viewProduct(card.getAttribute('data-id'));
    });
  });
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination() {
  const total = Math.ceil(filteredProducts.length / productsPerPage);
  const el    = document.getElementById('pagination');
  if (!el) return;

  if (total <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">← Anterior</button>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span class="page-dots">...</span>';
    }
  }

  html += `<button class="page-btn" ${currentPage === total ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">Seguinte →</button>`;
  el.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// HELPERS
// ============================================================
function updateProductsCount() {
  const el = document.getElementById('productsCount');
  if (el) el.textContent = `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''}`;
}

function viewProduct(id) {
  window.location.href = `product-details.html?id=${id}`;
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (product && typeof cart !== 'undefined') cart.addItem(product, 1);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  await initFilters(); // definido em products-filters.js

  document.getElementById('sortBy')?.addEventListener('change', sortProducts);
  document.getElementById('minPrice')?.addEventListener('input', applyFilters);
  document.getElementById('maxPrice')?.addEventListener('input', applyFilters);
  document.getElementById('filterStock')?.addEventListener('change', applyFilters);
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
});