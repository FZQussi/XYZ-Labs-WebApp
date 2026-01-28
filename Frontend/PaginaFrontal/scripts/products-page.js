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
  
  container.innerHTML = categories.map(cat => {
    // Log das subcategorias carregadas
    if (cat.subcategories && cat.subcategories.length) {
      console.log(`Categoria "${cat.name}" possui subcategorias:`, cat.subcategories.map(s => s.name));
    }

    return `
    <div class="filter-checkbox category-container">
      <label>
        <input type="checkbox" value="${cat.id}" class="category-filter">
        <span>${cat.name}</span>
      </label>

      ${cat.subcategories && cat.subcategories.length ? `
        <div class="subcategory-container">
          ${cat.subcategories.map(sub => `
            <label class="filter-checkbox subcategory-filter">
              <input type="checkbox" value="${sub.id}" data-parent="${cat.id}">
              <span>${sub.name}</span>
            </label>
          `).join('')}
        </div>
      ` : ''}
    </div>
    `;
  }).join('');

  // Mostrar/ocultar subcategorias quando a categoria é marcada
  document.querySelectorAll('.category-filter').forEach(cb => {
    cb.addEventListener('change', e => {
      const container = cb.closest('.category-container');
      const subContainer = container.querySelector('.subcategory-container');
      if (subContainer) {
        subContainer.style.display = cb.checked ? 'flex' : 'none';
      }
      applyFilters();
    });
  });

  // Subcategorias
  document.querySelectorAll('.subcategory-filter input').forEach(cb => cb.addEventListener('change', applyFilters));

  // Inicialmente esconde todas as subcategorias
  document.querySelectorAll('.subcategory-container').forEach(sub => sub.style.display = 'none');
}

// ===== APPLY FILTERS =====
function applyFilters() {
  const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => parseInt(cb.value));
  const selectedSubcategories = Array.from(document.querySelectorAll('.subcategory-filter input:checked')).map(cb => parseInt(cb.value));

  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  filteredProducts = allProducts.filter(product => {
    // Se subcategorias estão selecionadas, filtra por elas
    if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(product.subcategory_id)) {
      return false;
    }

    // Se não houver subcategorias selecionadas, mas categorias estão selecionadas, filtra por categoria
    if (selectedSubcategories.length === 0 && selectedCategories.length > 0 && !selectedCategories.includes(product.category_id)) {
      return false;
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
         
          <div class="product-footer">
            <span class="product-price">€${Number(product.price).toFixed(2)}</span>
            <div class="product-actions">
              <button class="btn-view" onclick="viewProduct(${product.id})">
                Ver Detalhes
              </button>
              ${product.stock > 0 
                ? `<button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
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

  // Adicionar event listeners aos cards
  addCardClickListeners();
  
  renderPagination();
}

// ===== ADD CARD CLICK LISTENERS =====
function addCardClickListeners() {
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Não redirecionar se clicar nos botões
      if (e.target.closest('.btn-view') || e.target.closest('.btn-add-cart')) {
        return;
      }
      
      const productId = card.getAttribute('data-id');
      viewProduct(productId);
    });
  });
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

function setupCollapsibleFilters() {
  const filter = document.querySelector('.filter-collapsible');
  if (!filter) return;

  const toggle = filter.querySelector('.filter-toggle');
  const content = filter.querySelector('.filter-options');

  toggle.addEventListener('click', () => {
    const isOpen = filter.classList.contains('open');

    filter.classList.toggle('open');
    content.classList.toggle('open', !isOpen);
    content.classList.toggle('collapsed', isOpen);
  });
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  await loadCategories();

  setupCollapsibleFilters();
  applySearchFromURL();

  document.getElementById('sortBy').addEventListener('change', sortProducts);
  document.getElementById('minPrice').addEventListener('change', applyFilters);
  document.getElementById('maxPrice').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  document.getElementById('toggleFilters').addEventListener('click', toggleFilters);
});