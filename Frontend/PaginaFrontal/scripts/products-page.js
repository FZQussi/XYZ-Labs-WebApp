const API_BASE = 'http://localhost:3001';

let allProducts = [];
let filteredProducts = [];
let categories = [];
let availableAttributes = {}; // Armazena atributos únicos dos produtos
let currentPage = 1;
const productsPerPage = 12;

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
    
    // Extrair atributos únicos de todos os produtos
    extractAvailableAttributes();
    
    filteredProducts = [...allProducts];
    
    updateProductsCount();
    renderProducts();
    renderDynamicAttributeFilters(); // Renderiza filtros de atributos
    
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
        
        // Se o valor for array (multiselect), adiciona cada item
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
  
  console.log('Atributos disponíveis:', availableAttributes);
}

// ===== RENDERIZAR FILTROS DE ATRIBUTOS DINÂMICOS =====
function renderDynamicAttributeFilters() {
  const container = document.getElementById('dynamicAttributeFilters');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (Object.keys(availableAttributes).length === 0) {
    return; // Não há atributos para mostrar
  }
  
  Object.entries(availableAttributes).forEach(([attrName, values]) => {
    if (values.length === 0) return;
    
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group filter-collapsible';
    
    filterGroup.innerHTML = `
      <button class="filter-toggle" type="button">
        <span>${attrName}</span>
        <span class="filter-arrow"></span>
      </button>
      
      <div class="filter-options collapsed" data-attribute="${attrName}">
        ${values.map(value => `
          <label class="filter-checkbox">
            <input type="checkbox" 
                   value="${value}" 
                   class="attribute-filter" 
                   data-attribute="${attrName}">
            <span>${value}</span>
          </label>
        `).join('')}
      </div>
    `;
    
    container.appendChild(filterGroup);
    
    // Event listeners para collapse/expand
    const toggleBtn = filterGroup.querySelector('.filter-toggle');
    const optionsDiv = filterGroup.querySelector('.filter-options');
    
    toggleBtn.addEventListener('click', () => {
      filterGroup.classList.toggle('open');
      optionsDiv.classList.toggle('collapsed');
      optionsDiv.classList.toggle('open');
    });
    
    // Event listeners para os checkboxes
    filterGroup.querySelectorAll('.attribute-filter').forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
  });
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
  document.querySelectorAll('.subcategory-filter input').forEach(cb => 
    cb.addEventListener('change', applyFilters)
  );

  // Inicialmente esconde todas as subcategorias
  document.querySelectorAll('.subcategory-container').forEach(sub => 
    sub.style.display = 'none'
  );
}

// ===== APPLY FILTERS (ATUALIZADO COM ATRIBUTOS) =====
function applyFilters() {
  // Filtros de categoria/subcategoria
  const selectedCategories = Array.from(
    document.querySelectorAll('.category-filter:checked')
  ).map(cb => parseInt(cb.value));
  
  const selectedSubcategories = Array.from(
    document.querySelectorAll('.subcategory-filter input:checked')
  ).map(cb => parseInt(cb.value));

  // Filtros de preço
  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  
  // Filtro de pesquisa
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  // 🆕 FILTROS DE ATRIBUTOS DINÂMICOS
  const attributeFilters = {};
  document.querySelectorAll('.attribute-filter:checked').forEach(checkbox => {
    const attrName = checkbox.dataset.attribute;
    const attrValue = checkbox.value;
    
    if (!attributeFilters[attrName]) {
      attributeFilters[attrName] = [];
    }
    attributeFilters[attrName].push(attrValue);
  });

  console.log('Filtros de atributos aplicados:', attributeFilters);

  // Aplicar todos os filtros
  filteredProducts = allProducts.filter(product => {
    // Filtro de subcategoria
    if (selectedSubcategories.length > 0 && 
        !selectedSubcategories.includes(product.subcategory_id)) {
      return false;
    }

    // Filtro de categoria (se não houver subcategorias selecionadas)
    if (selectedSubcategories.length === 0 && 
        selectedCategories.length > 0 && 
        !selectedCategories.includes(product.category_id)) {
      return false;
    }

    // Filtro de preço
    if (product.price < minPrice || product.price > maxPrice) {
      return false;
    }

    // Filtro de pesquisa
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm)) {
      return false;
    }

    // 🆕 FILTROS DE ATRIBUTOS DINÂMICOS
    if (Object.keys(attributeFilters).length > 0) {
      // Verificar se o produto tem os atributos filtrados
      for (const [attrName, selectedValues] of Object.entries(attributeFilters)) {
        const productAttrValue = product.attributes?.[attrName];
        
        if (!productAttrValue) {
          return false; // Produto não tem este atributo
        }
        
        // Se o valor do produto for array (multiselect)
        if (Array.isArray(productAttrValue)) {
          // Verifica se algum dos valores selecionados está no array do produto
          const hasMatch = selectedValues.some(val => 
            productAttrValue.includes(val)
          );
          if (!hasMatch) return false;
        } else {
          // Valor simples - verificar se está nos valores selecionados
          if (!selectedValues.includes(productAttrValue)) {
            return false;
          }
        }
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

    // 🆕 Renderizar atributos do produto (opcional)
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

  // Adicionar event listeners aos cards
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

// ===== CLEAR FILTERS (ATUALIZADO) =====
function clearFilters() {
  // Limpar filtros de categoria
  document.querySelectorAll('.category-filter').forEach(cb => cb.checked = false);
  document.querySelectorAll('.subcategory-filter input').forEach(cb => cb.checked = false);
  
  // Limpar filtros de atributos dinâmicos
  document.querySelectorAll('.attribute-filter').forEach(cb => cb.checked = false);
  
  // Limpar outros filtros
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

// ===== SETUP COLLAPSIBLE FILTERS =====
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