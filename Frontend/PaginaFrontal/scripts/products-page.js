const API_BASE = 'http://localhost:3001';

let allProducts = [];
let filteredProducts = [];
let categories = [];
let availableAttributes = {};
let currentPage = 1;
const productsPerPage = 56;

// ===== APLICAR CATEGORIA DA URL =====
function applyCategoryFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');
  if (!categoryId) return;

  const checkbox = document.querySelector(`.category-filter[value="${categoryId}"]`);
  if (checkbox) {
    checkbox.checked = true;
    applyFilters();
  }
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    allProducts = await res.json();
    
    extractAvailableAttributes();
    filteredProducts = [...allProducts];
    
    updateProductsCount();
    renderProducts();
    renderDynamicAttributeFilters();
    
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    document.getElementById('productsGrid').innerHTML = 
      '<p class="error">Erro ao carregar produtos</p>';
  }
}

// ===== EXTRAIR ATRIBUTOS ÚNICOS DOS PRODUTOS =====
function extractAvailableAttributes() {
  availableAttributes = {};
  
  allProducts.forEach(product => {
    if (product.attributes && typeof product.attributes === 'object') {
      Object.entries(product.attributes).forEach(([attrName, attrValue]) => {
        if (!availableAttributes[attrName]) {
          availableAttributes[attrName] = new Set();
        }
        
        if (Array.isArray(attrValue)) {
          attrValue.forEach(val => availableAttributes[attrName].add(val));
        } else {
          availableAttributes[attrName].add(attrValue);
        }
      });
    }
  });
  
  // Converter Sets para Arrays ordenados
  Object.keys(availableAttributes).forEach(key => {
    availableAttributes[key] = Array.from(availableAttributes[key]).sort();
  });
}

// ===== RENDERIZAR FILTROS DE ATRIBUTOS DINÂMICOS =====
function renderDynamicAttributeFilters() {
  const container = document.getElementById('dynamicAttributeFilters');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (Object.keys(availableAttributes).length === 0) {
    return;
  }
  
  Object.entries(availableAttributes).forEach(([attrName, values]) => {
    if (values.length === 0) return;
    
    const filterSection = document.createElement('div');
    filterSection.className = 'filter-section';
    
    filterSection.innerHTML = `
      <div class="filter-section-header">
        <h3>${attrName}</h3>
        <button class="btn-clear" onclick="clearAttributeFilter('${attrName}')">Limpar</button>
      </div>
      <div class="filter-list" data-attribute="${attrName}">
        ${values.map(value => `
          <label>
            <input type="checkbox" 
                   value="${value}" 
                   class="attribute-filter" 
                   data-attribute="${attrName}">
            <span>${value}</span>
          </label>
        `).join('')}
      </div>
    `;
    
    container.appendChild(filterSection);
    
    // Event listeners para os checkboxes
    filterSection.querySelectorAll('.attribute-filter').forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
  });
}

// ===== LIMPAR FILTRO DE ATRIBUTO ESPECÍFICO =====
function clearAttributeFilter(attrName) {
  document.querySelectorAll(`.attribute-filter[data-attribute="${attrName}"]`)
    .forEach(cb => cb.checked = false);
  applyFilters();
}

// ===== LOAD CATEGORIES =====
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    categories = await res.json();
    renderCategoryFilters();
    applyCategoryFromURL();
    initCategorySearch(); 
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

// ===== RENDER CATEGORY FILTERS =====
function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  
  container.innerHTML = categories.map(cat => {
    return `
    <div class="category-container">
      <label>
        <input type="checkbox" value="${cat.id}" class="category-filter">
        <span>${cat.name}</span>
      </label>

      ${cat.subcategories && cat.subcategories.length ? `
        <div class="subcategory-container">
          ${cat.subcategories.map(sub => `
            <label class="subcategory-filter">
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
  document.querySelectorAll('.subcategory-filter input').forEach(cb => 
    cb.addEventListener('change', applyFilters)
  );

  // Inicialmente esconde todas as subcategorias
  document.querySelectorAll('.subcategory-container').forEach(sub => 
    sub.style.display = 'none'
  );
}

// ===== APPLY FILTERS (COM ATRIBUTOS) =====
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  
  const selectedCategories = Array.from(
    document.querySelectorAll('.category-filter:checked')
  ).map(cb => parseInt(cb.value));
  
  const stockValue = document.getElementById('filterStock').value;
  
  // Coletar atributos selecionados
  const selectedAttributes = {};
  document.querySelectorAll('.attribute-filter:checked').forEach(cb => {
    const attrName = cb.getAttribute('data-attribute');
    if (!selectedAttributes[attrName]) {
      selectedAttributes[attrName] = [];
    }
    selectedAttributes[attrName].push(cb.value);
  });

  filteredProducts = allProducts.filter(product => {
    const productPrice = Number(product.price);

    // Pesquisa
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm)) return false;

    // Preço
    if (productPrice < minPrice || productPrice > maxPrice) return false;

    // Categoria
    if (selectedCategories.length) {
      const productCategoryIds = product.categories.map(c => c.id);
      const hasCategoryMatch = productCategoryIds.some(id => selectedCategories.includes(id));
      if (!hasCategoryMatch) return false;
    }

    // Stock
    if (stockValue === "true" && !product.stock) return false;
    if (stockValue === "false" && product.stock) return false;

    // Atributos dinâmicos
    if (Object.keys(selectedAttributes).length > 0) {
      for (const [attrName, selectedValues] of Object.entries(selectedAttributes)) {
        if (!product.attributes || !product.attributes[attrName]) {
          return false;
        }
        
        const productAttrValue = product.attributes[attrName];
        const productValues = Array.isArray(productAttrValue) 
          ? productAttrValue 
          : [productAttrValue];
        
        const hasMatch = selectedValues.some(val => productValues.includes(val));
        if (!hasMatch) return false;
      }
    }

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
      filteredProducts.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
  }

  renderProducts();
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  
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

    let attributesHTML = '';
    if (product.attributes && Object.keys(product.attributes).length > 0) {
      attributesHTML = '<div class="product-attributes">';
      Object.entries(product.attributes).forEach(([name, value]) => {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        attributesHTML += `<span class="attribute-badge">${name}: ${displayValue}</span>`;
      });
      attributesHTML += '</div>';
    }

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <img src="${image}" alt="${product.name}" loading="lazy">
          ${!product.stock ? '<div class="out-of-stock">Esgotado</div>' : ''}
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          ${attributesHTML}
          <div class="product-footer">
            <span class="product-price">€${Number(product.price).toFixed(2)}</span>
            <div class="product-actions">
              <button class="btn-view" onclick="viewProduct(${product.id})">
                Ver Detalhes
              </button>
              ${product.stock 
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

  addCardClickListeners();
  renderPagination();
}

// ===== ADD CARD CLICK LISTENERS =====
function addCardClickListeners() {
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
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

  html += `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
            onclick="changePage(${currentPage - 1})">
      ← Anterior
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || 
        (i >= currentPage - 2 && i <= currentPage + 2)) {
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

// ===== CLEAR ALL FILTERS =====
function clearFilters() {
  // Categorias
  document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
  document.querySelectorAll('.subcategory-filter input').forEach(cb => cb.checked = false);
  
  // Atributos
  document.querySelectorAll('.attribute-filter').forEach(cb => cb.checked = false);
  
  // Outros
  document.getElementById('minPrice').value = '';
  document.getElementById('maxPrice').value = '';
  document.getElementById('filterStock').value = '';
  document.getElementById('searchInput').value = '';
  
  applyFilters();
}

// ===== CLEAR CATEGORIES ONLY =====
function clearCategoriesOnly() {
  document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
  document.querySelectorAll('.subcategory-filter input').forEach(cb => cb.checked = false);
  applyFilters();
}

// ===== TOGGLE FILTERS (MOBILE) =====
function toggleFilters() {
  const sidebar = document.getElementById('filtersSidebar');
  const overlay = document.getElementById('overlay');
  const isOpen  = sidebar.classList.toggle('active');
  if (overlay)  overlay.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeFilters() {
  const sidebar = document.getElementById('filtersSidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== APPLY SEARCH FROM URL =====
function applySearchFromURL() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get('search');

  if (!search) return;

  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.value = search;
  applyFilters();
}
function initCategorySearch() {
  const input = document.getElementById("categorySearch");
  if (!input) return;

  input.addEventListener("input", function () {
    const search = this.value.toLowerCase();

    document.querySelectorAll("#categoryFilters .category-container")
      .forEach(container => {

        const categoryName = container
          .querySelector("label span")
          .textContent
          .toLowerCase();

        if (categoryName.includes(search)) {
          container.style.display = "";
        } else {
          container.style.display = "none";
        }
      });
  });
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  await loadCategories();

  applySearchFromURL();

  // Toolbar controls
  document.getElementById('sortBy').addEventListener('change', sortProducts);
  document.getElementById('minPrice').addEventListener('input', applyFilters);
  document.getElementById('maxPrice').addEventListener('input', applyFilters);
  document.getElementById('filterStock').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);

  // Clear buttons
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  document.getElementById('clearCategories').addEventListener('click', clearCategoriesOnly);

  // Toggle filtros (mobile) — abre sidebar
  document.getElementById('toggleFilters').addEventListener('click', toggleFilters);

  // Botão fechar dentro da sidebar
  const closeFiltersBtn = document.getElementById('closeFilters');
  if (closeFiltersBtn) closeFiltersBtn.addEventListener('click', closeFilters);

  // Fechar sidebar ao clicar no overlay
  // (o header.js também usa o overlay — aqui só tratamos o caso dos filtros)
  document.getElementById('overlay').addEventListener('click', () => {
    const sidebar = document.getElementById('filtersSidebar');
    if (sidebar && sidebar.classList.contains('active')) {
      closeFilters();
    }
  });
});