// Frontend/PaginaFrontal/scripts/products-page.js

const API_BASE = 'http://localhost:3001';

let allProducts = [];
let filteredProducts = [];
let categories = [];
let currentPage = 1;
const productsPerPage = 12;

function applyCategoryFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');
  if (!categoryId) return;

  const checkbox = document.querySelector(`.category-filter[value="${categoryId}"]`);
  if (checkbox) {
    checkbox.checked = true;
    applyFilters(); // Aplica o filtro imediatamente
  }
}
// ===== LOAD PRODUCTS =====
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
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

// ===== LOAD CATEGORIES =====
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    categories = await res.json();
    renderCategoryFilters();
    applyCategoryFromURL();
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

// ===== RENDER CATEGORY FILTERS =====
function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  
  container.innerHTML = categories.map(cat => `
    <label class="filter-checkbox">
      <input type="checkbox" value="${cat.id}" class="category-filter">
      <span>${cat.name}</span>
    </label>
  `).join('');

  // Event listeners
  document.querySelectorAll('.category-filter').forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });
}

// ===== APPLY FILTERS =====
function applyFilters() {
  const selectedCategories = Array.from(
    document.querySelectorAll('.category-filter:checked')
  ).map(cb => parseInt(cb.value));

  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredProducts = allProducts.filter(product => {
    // Filtro de categoria
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(product.category_id)) return false;
    }

    // Filtro de preço
    if (product.price < minPrice || product.price > maxPrice) return false;

    // Filtro de pesquisa
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm)) return false;

    return true;
  });

  currentPage = 1;
  updateProductsCount();
  renderProducts();
}

// ===== SORT PRODUCTS =====
function sortProducts() {
  const sortBy = document.getElementById('sortBy').value;

  switch (sortBy) {
    case 'price-asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
    default:
      filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  renderProducts();
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  
  // Paginação
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  if (!paginatedProducts.length) {
    grid.innerHTML = '<p class="no-products">Nenhum produto encontrado</p>';
    return;
  }

  grid.innerHTML = paginatedProducts.map(product => {
    const image = product.images && product.images[0] 
      ? `${API_BASE}/images/${product.images[0]}` 
      : '/Frontend/images/placeholder.jpg';

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <img src="${image}" alt="${product.name}" loading="lazy">
          ${product.stock <= 0 ? '<div class="out-of-stock">Esgotado</div>' : ''}
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="product-description">${truncateText(product.description, 80)}</p>
          <div class="product-footer">
            <span class="product-price">€${Number(product.price).toFixed(2)}</span>
            <div class="product-actions">
              <button class="btn-view" onclick="viewProduct(${product.id})">
                Ver Detalhes
              </button>
              ${product.stock > 0 
                ? `<button class="btn-add-cart" onclick="addToCart(${product.id})">
                     🛒 Adicionar
                   </button>`
                : ''
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  renderPagination();
}

// ===== RENDER PAGINATION =====
function renderPagination() {
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  // Botão anterior
  html += `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
            onclick="changePage(${currentPage - 1})">
      ← Anterior
    </button>
  `;

  // Números de página
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span class="page-dots">...</span>';
    }
  }

  // Botão seguinte
  html += `
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
            onclick="changePage(${currentPage + 1})">
      Seguinte →
    </button>
  `;

  pagination.innerHTML = html;
}

// ===== CHANGE PAGE =====
function changePage(page) {
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== UPDATE PRODUCTS COUNT =====
function updateProductsCount() {
  const count = document.getElementById('productsCount');
  if (count) {
    count.textContent = `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''}`;
  }
}

// ===== VIEW PRODUCT =====
function viewProduct(productId) {
  window.location.href = `product-details.html?id=${productId}`;
}

// ===== ADD TO CART =====
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (product && cart) {
    cart.addItem(product, 1);
  }
}

// ===== CLEAR FILTERS =====
function clearFilters() {
  document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('searchInput').value = '';
  applyFilters();
}

// ===== TOGGLE FILTERS (MOBILE) =====
function toggleFilters() {
  const sidebar = document.getElementById('filtersSidebar');
  sidebar.classList.toggle('active');
}

// ===== HELPER: TRUNCATE TEXT =====
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
function applySearchFromURL() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');

  if (!search) return;

  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.value = search;
  applyFilters();
}
// products.js
const urlParams = new URLSearchParams(window.location.search);

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();      // ⬅️ garante produtos carregados
  await loadCategories();    // ⬅️ categorias também

  applySearchFromURL();      // ✅ agora funciona sempre

  document.getElementById('sortBy').addEventListener('change', sortProducts);
  document.getElementById('minPrice').addEventListener('change', applyFilters);
  document.getElementById('maxPrice').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  document.getElementById('toggleFilters').addEventListener('click', toggleFilters);
});



