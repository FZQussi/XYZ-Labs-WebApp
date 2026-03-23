// ============================================================
// products-page.js
// ============================================================

// Injetar estilos para tags de filtros nos cards
(function injectFilterTagStyles() {
  if (document.getElementById('filter-tag-styles')) return;
  const style = document.createElement('style');
  style.id = 'filter-tag-styles';
  style.textContent = `
    .tag.tag-filter {
      display: inline-block;
      padding: 2px 7px;
      border: 1px solid #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 10px;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.3px;
      margin: 1px 2px 1px 0;
    }
    .tag.tag-filter-more {
      display: inline-block;
      padding: 2px 6px;
      border: 1px solid #9ca3af;
      background: #f3f4f6;
      color: #6b7280;
      font-size: 10px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      margin: 1px 0;
    }
  `;
  document.head.appendChild(style);
})();



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
    const res = await fetch(`${API_BASE}/products`);
    
    if (!res.ok) throw new Error(`Erro HTTP ${res.status} ao carregar produtos`);

    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.error('❌ API retornou dados inválidos:', data);
      throw new Error('API retornou estrutura inesperada - esperado array');
    }

    allProducts = data;
    filteredProducts = [...allProducts];
    
    console.group(`✅ ${allProducts.length} produtos carregados`);
    
    // Log de diagnóstico: verificar estrutura do primeiro produto
    if (allProducts.length > 0) {
      const sample = allProducts[0];
      console.log('📋 Exemplo de produto:', sample.name);
      console.log('  primary_category:', sample.primary_category);
      console.log('  filter_tags:', sample.filter_tags);
      console.log('  filter_tags count:', (sample.filter_tags || []).length);

      // Contar produtos com filter_tags
      const withTags   = allProducts.filter(p => (p.filter_tags || []).length > 0).length;
      const withoutTags = allProducts.length - withTags;
      console.log(`  produtos com filter_tags: ${withTags} | sem: ${withoutTags}`);

      // Mostrar todos os filter_keys únicos presentes nos produtos
      const allTagKeys = new Set(
        allProducts.flatMap(p => (p.filter_tags || []).map(ft => ft.filter_key))
      );
      console.log('  filter_keys únicos nos produtos:', [...allTagKeys]);
    }

    console.groupEnd();
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
// Lê o estado do products-filters.js via evento filtersApplied
// ============================================================
let _lastFilterDetail = {}; // cache do último evento filtersApplied

document.addEventListener('filtersApplied', (e) => {
  _lastFilterDetail = e.detail || {};
});

function applyFilters() {
  try {
    if (!Array.isArray(allProducts)) {
      console.warn('⚠️ allProducts não é um array, ignorando filtros');
      return;
    }

    const searchTerm  = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const minPrice    = parseFloat(document.getElementById('minPrice')?.value) || 0;
    const maxPrice    = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
    const stockValue  = document.getElementById('filterStock')?.value || '';

    // Ler estado actual dos filtros (do products-filters.js)
    const primaryId       = typeof selectedPrimaryId !== 'undefined' ? selectedPrimaryId : null;
    const secFilters      = typeof selectedSecondaryFilters !== 'undefined' ? selectedSecondaryFilters : {};
    // Grupos ativos: tem estado definido (qualquer tipo nao-nulo)
    const activeGroupKeys = Object.keys(secFilters).filter(k => secFilters[k] != null);

    console.group('🔍 applyFilters');
    console.log('  categoria primária:', primaryId);
    console.log('  filtros adicionais:', secFilters);
    console.log('  grupos ativos:', activeGroupKeys);
    console.log('  pesquisa:', searchTerm || '—');

    filteredProducts = allProducts.filter(product => {
      if (!product) return false;

      const price = Number(product.price) || 0;

      // Pesquisa por nome
      if (searchTerm && !(product.name || '').toLowerCase().includes(searchTerm)) return false;

      // Preço
      if (price < minPrice || price > maxPrice) return false;

      // Stock
      if (stockValue === 'true'  && !product.stock) return false;
      if (stockValue === 'false' &&  product.stock) return false;

      // Categoria primária
      if (primaryId !== null) {
        if (!product.primary_category || product.primary_category.id !== primaryId) return false;
      }

      // Filtros adicionais — logica AND entre grupos ativos
      // O formato de secFilters mudou para: { filterKey: { type, tagIds?|min/max?|value? } }
      for (const groupKey of activeGroupKeys) {
        const filterState = secFilters[groupKey];
        if (!filterState) continue;

        const productFilterTags = (product.filter_tags || []).filter(ft => ft.filter_key === groupKey);

        if (filterState.type === 'multi') {
          // Verificar se o produto tem pelo menos uma das tags selecionadas
          const selectedTagIds = filterState.tagIds || [];
          if (!selectedTagIds.length) continue;
          const hasMatch = productFilterTags.some(ft =>
            selectedTagIds.includes(ft.tag_id) || selectedTagIds.includes(Number(ft.tag_id))
          );
          if (!hasMatch) return false;

        } else if (filterState.type === 'range') {
          // Verificar se o produto tem pelo menos 1 tag cujo nome seja um numero dentro do range
          const { min, max } = filterState;
          if (min == null && max == null) continue;
          const hasMatch = productFilterTags.some(ft => {
            const val = Number(ft.tag_name);
            if (isNaN(val)) return false;
            if (min != null && val < min) return false;
            if (max != null && val > max) return false;
            return true;
          });
          if (!hasMatch) return false;

        } else if (filterState.type === 'search') {
          // Verificar se o produto tem pelo menos 1 tag cujo nome contenha o texto
          const term = (filterState.value || '').toLowerCase().trim();
          if (!term) continue;
          const hasMatch = productFilterTags.some(ft =>
            (ft.tag_name || '').toLowerCase().includes(term)
          );
          if (!hasMatch) return false;

        } else {
          // Formato legado: array plano de tagIds (compatibilidade)
          if (Array.isArray(filterState)) {
            if (!filterState.length) continue;
            const hasMatch = productFilterTags.some(ft =>
              filterState.includes(ft.tag_id) || filterState.includes(Number(ft.tag_id))
            );
            if (!hasMatch) return false;
          }
        }
      }

      return true;
    });

    console.log('  produtos após filtro:', filteredProducts.length, '/', allProducts.length);
    console.groupEnd();

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

      // Categoria principal
      const primaryTag = product.primary_category
        ? `<span class="tag tag-primary">${product.primary_category.name}</span>`
        : '';

      // Filter tags agrupadas por filtro, com contador
      const filterTags = product.filter_tags || [];

      // Agrupar por filter_name para mostrar "Marca: BMW, Audi"
      const grouped = {};
      filterTags.forEach(ft => {
        const key = ft.filter_key;
        if (!grouped[key]) grouped[key] = { name: ft.filter_name, tags: [] };
        grouped[key].tags.push(ft.tag_name);
      });

      // Mostrar até 3 tags individualmente, o resto como "+N"
      const MAX_VISIBLE = 3;
      const allTagNames = filterTags.map(ft => ft.tag_name);
      const visibleTags = allTagNames.slice(0, MAX_VISIBLE)
        .map(name => `<span class="tag tag-filter">${name}</span>`)
        .join('');
      const extraCount = allTagNames.length - MAX_VISIBLE;
      const extraBadge = extraCount > 0
        ? `<span class="tag tag-filter-more">+${extraCount}</span>`
        : '';

      const tagsHTML = primaryTag + visibleTags + extraBadge;

      return `
        <div class="product-card" data-id="${product.id}">
          <div class="product-image">
            <img src="${image}" alt="${product.name}" loading="lazy">
            ${!product.stock ? '<div class="out-of-stock">Esgotado</div>' : ''}
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <div class="product-tags">${tagsHTML}</div>
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