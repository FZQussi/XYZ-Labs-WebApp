// ============================================================
// products-page.js (CORRIGIDO)
// Gestão de produtos:
//   - Carregar e renderizar produtos
//   - Aplicar filtros dinâmicos (lê estado do products-filters.js)
//   - Paginação e ordenação
//   - Melhor tratamento de erros
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
    console.log('📦 A carregar produtos...');
    const res = await fetch(`${API_BASE}/api/products`);
    
    if (!res.ok) {
      throw new Error(`Erro HTTP ${res.status} ao carregar produtos`);
    }

    const data = await res.json();
    
    // Garantir que é um array
    if (!Array.isArray(data)) {
      console.error('❌ API retornou dados inválidos:', data);
      throw new Error('API retornou estrutura inesperada - esperado array');
    }

    allProducts = data;
    filteredProducts = [...allProducts];
    
    console.log(`✅ ${allProducts.length} produtos carregados`);
    updateProductsCount();
    renderProducts();
  } catch (err) {
    console.error('❌ Erro ao carregar produtos:', err);
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML = `<p class="error">⚠️ Erro ao carregar produtos: ${err.message}</p>`;
    }
  }
}

// ============================================================
// APPLY FILTERS
// Lê o estado do products-filters.js (selectedPrimaryId, selectedSecondaryFilters, etc.)
// ============================================================
function applyFilters() {
  try {
    // Validar que allProducts é um array
    if (!Array.isArray(allProducts)) {
      console.warn('⚠️ allProducts não é um array, ignorando filtros');
      return;
    }

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const minPrice   = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice   = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    const stockValue = document.getElementById('filterStock')?.value || '';

    filteredProducts = allProducts.filter(product => {
      if (!product) return false; // Validar produto

      const price = Number(product.price) || 0;

      // Filtro de pesquisa
      if (searchTerm && !(product.name || '').toLowerCase().includes(searchTerm)) {
        return false;
      }

      // Filtro de preço
      if (price < minPrice || price > maxPrice) {
        return false;
      }

      // Filtro de stock
      if (stockValue === 'true'  && !product.stock) return false;
      if (stockValue === 'false' &&  product.stock) return false;

      // Filtro de categoria primária
      if (typeof selectedPrimaryId !== 'undefined' && selectedPrimaryId !== null) {
        if (!product.primary_category || product.primary_category.id !== selectedPrimaryId) {
          return false;
        }
      }

      // Filtros secundários (AND — produto tem todos os filtros selecionados)
      if (typeof selectedSecondaryFilters !== 'undefined' && Object.keys(selectedSecondaryFilters).length > 0) {
        for (const groupKey of Object.keys(selectedSecondaryFilters)) {
          const selectedTagIds = selectedSecondaryFilters[groupKey];
          if (!Array.isArray(selectedTagIds) || selectedTagIds.length === 0) continue;

          // O produto precisa ter pelo menos uma tag de cada grupo selecionado
          const secondaryCategories = product.secondary_categories || [];
          const productHasTag = secondaryCategories.some(cat => 
            selectedTagIds.includes(cat.id)
          );

          if (!productHasTag) return false;
        }
      }

      return true;
    });

    currentPage = 1;
    updateProductsCount();
    renderProducts();
  } catch (err) {
    console.error('❌ Erro ao aplicar filtros:', err);
  }
}

// ============================================================
// SORT
// ============================================================
function sortProducts() {
  try {
    const sortBy = document.getElementById('sortBy')?.value;

    if (!Array.isArray(filteredProducts)) {
      console.warn('⚠️ filteredProducts não é um array');
      return;
    }

    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price-desc':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    currentPage = 1;
    renderProducts();
  } catch (err) {
    console.error('❌ Erro ao ordenar produtos:', err);
  }
}

// ============================================================
// RENDER PRODUCTS
// ============================================================
function renderProducts() {
  try {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (!Array.isArray(filteredProducts) || filteredProducts.length === 0) {
      grid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
      renderPagination();
      return;
    }

    const start     = (currentPage - 1) * productsPerPage;
    const paginated = filteredProducts.slice(start, start + productsPerPage);

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
              <span class="product-price">€${Number(product.price || 0).toFixed(2)}</span>
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
  } catch (err) {
    console.error('❌ Erro ao renderizar produtos:', err);
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML = '<p class="error">Erro ao renderizar produtos</p>';
    }
  }
}

// ============================================================
// CARD CLICK
// ============================================================
function addCardClickListeners() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-view') || e.target.closest('.btn-add-cart')) return;
      const id = card.getAttribute('data-id');
      if (id) viewProduct(id);
    });
  });
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination() {
  try {
    const total = Math.ceil((filteredProducts.length || 0) / productsPerPage);
    const el    = document.getElementById('pagination');
    if (!el) return;

    if (total <= 1) { 
      el.innerHTML = ''; 
      return; 
    }

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
  } catch (err) {
    console.error('❌ Erro ao renderizar paginação:', err);
  }
}

function changePage(page) {
  if (page < 1 || page > Math.ceil(filteredProducts.length / productsPerPage)) return;
  currentPage = page;
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// HELPERS
// ============================================================
function updateProductsCount() {
  try {
    const el = document.getElementById('productsCount');
    if (el) {
      const count = Array.isArray(filteredProducts) ? filteredProducts.length : 0;
      el.textContent = `${count} produto${count !== 1 ? 's' : ''}`;
    }
  } catch (err) {
    console.error('❌ Erro ao atualizar contagem:', err);
  }
}

function viewProduct(id) {
  if (!id) return;
  window.location.href = `product-details.html?id=${id}`;
}

function addToCart(productId) {
  try {
    const product = allProducts.find(p => p.id === productId);
    if (product && typeof cart !== 'undefined' && cart.addItem) {
      cart.addItem(product, 1);
    }
  } catch (err) {
    console.error('❌ Erro ao adicionar ao carrinho:', err);
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Carregar produtos
    await loadProducts();

    // Inicializar filtros (definido em products-filters.js)
    if (typeof initFilters === 'function') {
      await initFilters();
    } else {
      console.warn('⚠️ initFilters() não está disponível');
    }

    // Event listeners para mudanças de filtros
    document.getElementById('sortBy')?.addEventListener('change', sortProducts);
    document.getElementById('minPrice')?.addEventListener('input', applyFilters);
    document.getElementById('maxPrice')?.addEventListener('input', applyFilters);
    document.getElementById('filterStock')?.addEventListener('change', applyFilters);
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);

    // Listener para evento customizado do products-filters.js
    document.addEventListener('filtersApplied', applyFilters);
  } catch (err) {
    console.error('❌ Erro durante inicialização:', err);
  }
});