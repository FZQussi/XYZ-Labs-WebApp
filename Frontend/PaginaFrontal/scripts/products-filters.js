// ============================================================
// products-filters.js — Filtros dinâmicos da página de produtos
// ============================================================

// CSS para os contadores de produtos nos filtros da sidebar
(function injectFilterSidebarStyles() {
  if (document.getElementById('filter-sidebar-styles')) return;
  const style = document.createElement('style');
  style.id = 'filter-sidebar-styles';
  style.textContent = `
    .filter-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter-group-header h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
    }
    .filter-group-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 18px;
      padding: 0 5px;
      background: #000;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      border-radius: 2px;
    }
    .filter-tag-count {
      color: #9ca3af;
      font-size: 10px;
      font-weight: normal;
      margin-left: 3px;
    }
    .filter-label {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    .filter-label:hover {
      color: #000;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);
})();

const API_BASE = '';

let primaryCategories        = [];
let selectedPrimaryId        = null;
let selectedSecondaryFilters = {}; // { filterKey: [tag ids] }

// ============================================================
// CARREGAR DADOS
// ============================================================
async function loadFiltersData() {
  try {
    const primRes = await fetch(`${API_BASE}/api/categories/primary`);
    if (!primRes.ok) throw new Error(`Erro ao carregar categorias: ${primRes.status}`);
    primaryCategories = await primRes.json();
    console.log('✅ Categorias primárias carregadas:', primaryCategories.length);

    renderPrimaryFilters();
    hideSecondaryFiltersSection();
    applyFiltersFromURL();
  } catch (err) {
    console.error('Erro ao carregar dados de filtros:', err);
    const container = document.getElementById('primaryCategoryFilters');
    if (container) {
      container.innerHTML = `<p style="color:red;padding:10px">⚠️ Erro ao carregar filtros.</p>`;
    }
  }
}

// ============================================================
// RENDER CATEGORIAS PRIMÁRIAS (SELECT DROPDOWN)
// ============================================================
function renderPrimaryFilters() {
  const container = document.getElementById('primaryCategoryFilters');
  if (!container) return;

  if (!primaryCategories.length) {
    container.innerHTML = '<p style="color: #666;">Nenhuma categoria disponível</p>';
    return;
  }

  // Criar o select dropdown (SEM ÍCONES)
  const selectHTML = `
    <select id="primaryCategorySelect" class="primary-category-select">
      <option value="" selected>Todas as Categorias</option>
      ${primaryCategories.map(cat => `
        <option value="${cat.id}">${cat.name}</option>
      `).join('')}
    </select>
  `;

  container.innerHTML = selectHTML;

  // Adicionar event listener ao select
  const selectEl = document.getElementById('primaryCategorySelect');
  if (selectEl) {
    selectEl.addEventListener('change', () => {
      const value = selectEl.value;

      // Ignorar disparo automático do BrutalSelect ao inicializar (valor vazio)
      if (value === '' && selectedPrimaryId === null) return;

      selectedPrimaryId = value ? parseInt(value) : null;
      selectedSecondaryFilters = {};
      
      if (selectedPrimaryId) {
        showSecondaryFiltersSection();
      } else {
        hideSecondaryFiltersSection();
      }
      
      renderSecondaryFilters();
      applyFilters();
      renderActiveFilterTags();
    });
  }
}

// ============================================================
// ESCONDER/MOSTRAR SECÇÃO DE FILTROS ADICIONAIS
// ============================================================
function hideSecondaryFiltersSection() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;
  
  const filterSection = container.closest('[data-collapsible]');
  if (filterSection) {
    filterSection.style.display = 'none';
  }
  container.innerHTML = '';
}

function showSecondaryFiltersSection() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;
  
  const filterSection = container.closest('[data-collapsible]');
  if (filterSection) {
    filterSection.style.display = 'block';
  }
}

// ============================================================
// RENDER FILTROS SECUNDÁRIOS (carregados da API)
// ============================================================
async function renderSecondaryFilters() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;

  if (!selectedPrimaryId) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '<p style="padding:10px;color:#666;font-size:13px">⏳ A carregar filtros...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/v1/categories/${selectedPrimaryId}/filters`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // A API retorna { categoryId, categoryName, filters: [...], generatedAt }
    const filters = Array.isArray(data) ? data : (data.filters || []);

    console.group('🏷️ Filtros carregados para categoria', selectedPrimaryId);
    console.log('  total de filtros:', filters.length);
    filters.forEach(f => {
      const tags = (f.tags || []).filter(t => t.is_active !== false);
      console.log(`  [${f.filter_key}] ${f.filter_name} — ${tags.length} tags:`, tags.map(t => `${t.tag_name}(${t.product_count ?? 0})`));
    });
    console.groupEnd();

    if (!filters.length) {
      container.innerHTML = '<p class="no-secondary-filters">Sem filtros disponíveis para esta categoria.</p>';
      return;
    }

    // Barra de pesquisa no topo
    const searchBar = `
      <div class="secondary-filters-search-wrapper">
        <div class="secondary-filter-search">
          <input type="text" class="secondary-filters-search-input"
            placeholder="Procurar filtros..." id="secondaryFiltersSearch">
          <button class="secondary-filter-search-clear" type="button">✕</button>
        </div>
      </div>`;

    // Um bloco colapsável por filtro, com contagem de produtos em cada tag
    const filterGroupsHTML = filters.map(filter => {
      // A API pública devolve { id, name, key, count, active } — normalizar campos
      const rawTags = (filter.tags || []).map(t => ({
        ...t,
        tag_name:      t.tag_name      ?? t.name  ?? '',
        product_count: t.product_count ?? t.count  ?? 0,
        is_active:     t.is_active     !== undefined ? t.is_active : (t.active !== undefined ? t.active : true),
      }));
      const tags = rawTags.filter(t => t.is_active !== false);
      if (!tags.length) return '';

      // Contagem total de produtos com pelo menos 1 tag deste filtro
      const totalWithFilter = tags.reduce((sum, t) => sum + (Number(t.product_count) || 0), 0);
      const countBadge = totalWithFilter > 0
        ? `<span class="filter-group-count">${totalWithFilter}</span>`
        : '';

      return `
        <div class="secondary-filter-group" data-group-key="${filter.filter_key}">
          <div class="filter-group-header">
            <h4>${filter.filter_name}${countBadge}</h4>
          </div>
          <div class="secondary-filter-options" data-group-key="${filter.filter_key}">
            ${tags.map(tag => {
              const count = Number(tag.product_count) || 0;
              const countStr = count > 0 ? `<span class="filter-tag-count">(${count})</span>` : '';
              return `
                <label class="filter-label"
                  data-filter-text="${tag.tag_name.toLowerCase()}"
                  data-group-key="${filter.filter_key}">
                  <input type="checkbox"
                    value="${tag.id}"
                    data-name="${tag.tag_name}"
                    data-group-key="${filter.filter_key}"
                    class="secondary-filter-checkbox">
                  <span>${tag.tag_name}${countStr}</span>
                </label>`;
            }).join('')}
          </div>
        </div>`;
    }).filter(Boolean).join('');

    container.innerHTML = searchBar + filterGroupsHTML;

    // Event listeners nos checkboxes
    container.querySelectorAll('.secondary-filter-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const groupKey = cb.getAttribute('data-group-key');
        if (!selectedSecondaryFilters[groupKey]) selectedSecondaryFilters[groupKey] = [];
        if (cb.checked) {
          selectedSecondaryFilters[groupKey].push(parseInt(cb.value));
        } else {
          selectedSecondaryFilters[groupKey] = selectedSecondaryFilters[groupKey]
            .filter(id => id !== parseInt(cb.value));
        }
        console.log('🔄 Filtros secundários atualizados:', selectedSecondaryFilters);
        applyFilters();
        renderActiveFilterTags();
      });
    });

    // Restaurar checkboxes de filtros já selecionados
    Object.keys(selectedSecondaryFilters).forEach(groupKey => {
      selectedSecondaryFilters[groupKey].forEach(tagId => {
        const cb = container.querySelector(`.secondary-filter-checkbox[value="${tagId}"]`);
        if (cb) cb.checked = true;
      });
    });

    // Pesquisa nos filtros
    const searchInput = document.getElementById('secondaryFiltersSearch');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        container.querySelectorAll('.filter-label').forEach(label => {
          const text = label.getAttribute('data-filter-text');
          label.style.display = (term === '' || text.includes(term)) ? 'flex' : 'none';
        });
        // Mostrar/esconder grupos vazios
        container.querySelectorAll('.secondary-filter-group').forEach(group => {
          const anyVisible = [...group.querySelectorAll('.filter-label')]
            .some(l => l.style.display !== 'none');
          group.style.display = anyVisible ? '' : 'none';
        });
      });
      container.querySelector('.secondary-filter-search-clear')?.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
      });
    }

    // Abrir a secção de filtros adicionais automaticamente
    const filterSection = container.closest('[data-collapsible]');
    if (filterSection && !filterSection.classList.contains('open')) {
      filterSection.classList.add('open');
      filterSection.querySelector('.filter-section-body')?.classList.add('open');
    }

  } catch (err) {
    console.error('Erro ao carregar filtros secundários:', err);
    container.innerHTML = '<p style="color:red;padding:10px">❌ Erro ao carregar filtros.</p>';
  }
}

// ============================================================
// APPLY FILTERS
// ============================================================
function applyFilters() {
  const url = new URL(window.location);
  
  url.searchParams.delete('primary');
  url.searchParams.delete('secondary');
  
  if (selectedPrimaryId) {
    url.searchParams.set('primary', selectedPrimaryId);
  }

  // selectedSecondaryFilters: { filterKey: [tagId, ...] }
  // Serializar todos os tagIds selecionados para a URL
  const allSelectedTagIds = Object.values(selectedSecondaryFilters).flat();
  if (allSelectedTagIds.length > 0) {
    url.searchParams.set('secondary', JSON.stringify(selectedSecondaryFilters));
  }

  window.history.replaceState({}, '', url);

  document.dispatchEvent(new CustomEvent('filtersApplied', {
    detail: {
      primaryCategoryId:   selectedPrimaryId,
      secondaryFilters:    selectedSecondaryFilters,  // { filterKey: [tagIds] }
      selectedTagIds:      allSelectedTagIds           // lista plana de tag IDs selecionados
    }
  }));
}

// ============================================================
// INIT COLLAPSIBLE FILTERS
// ============================================================
function initCollapsibleFilters() {
  const sections = document.querySelectorAll('[data-collapsible]');

  sections.forEach(section => {
    const toggle  = section.querySelector('.filter-section-toggle');
    const body    = section.querySelector('.filter-section-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const isOpen = section.classList.contains('open');

      // Apenas toggle a secção atual (não fecha as outras)
      section.classList.toggle('open');
      body.classList.toggle('open');
    });
  });

  // Abrir apenas a primeira secção (Categoria Principal) por defeito
  if (sections.length >= 1) {
    sections[0].classList.add('open');
    sections[0].querySelector('.filter-section-body')?.classList.add('open');
  }
  
  // Não abrir a segunda secção (Filtros Adicionais) automaticamente
  // Será aberta apenas quando o utilizador selecionar uma categoria
}

// ============================================================
// APPLY FILTERS FROM URL
// ============================================================
async function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  const primaryId = params.get('primary');
  if (primaryId) {
    const select = document.getElementById('primaryCategorySelect');
    if (select) {
      select.value = primaryId;
      selectedPrimaryId = parseInt(primaryId);
      showSecondaryFiltersSection();
      await renderSecondaryFilters();
    }
  }

  // Restaurar filtros secundários da URL
  const secondaryParam = params.get('secondary');
  if (secondaryParam) {
    try {
      selectedSecondaryFilters = JSON.parse(secondaryParam);
      // Marcar checkboxes correspondentes
      Object.keys(selectedSecondaryFilters).forEach(groupKey => {
        selectedSecondaryFilters[groupKey].forEach(tagId => {
          const cb = document.querySelector(`.secondary-filter-checkbox[value="${tagId}"]`);
          if (cb) cb.checked = true;
        });
      });
    } catch (_) { selectedSecondaryFilters = {}; }
  }

  const search = params.get('search');
  if (search) {
    const input = document.getElementById('searchInput');
    if (input) input.value = search;
  }

  applyFilters();
  renderActiveFilterTags();
}

// ============================================================
// ACTIVE FILTER TAGS (mini pills na toolbar)
// ============================================================
function renderActiveFilterTags() {
  const container = document.getElementById('activeFilterTags');
  if (!container) return;

  const tags = [];

  // Categoria primária
  if (selectedPrimaryId) {
    const cat = primaryCategories.find(c => c.id === selectedPrimaryId);
    if (cat) {
      tags.push({
        label: cat.name,
        type: 'primary',
        remove: () => { clearPrimaryFilter(); }
      });
    }
  }

  // Filtros secundários
  Object.keys(selectedSecondaryFilters).forEach(groupKey => {
    selectedSecondaryFilters[groupKey].forEach(tagId => {
      const cb = document.querySelector(`.secondary-filter-checkbox[value="${tagId}"]`);
      if (cb) {
        const name = cb.getAttribute('data-name');
        tags.push({
          label: name,
          type: 'secondary',
          remove: () => {
            cb.checked = false;
            selectedSecondaryFilters[groupKey] = selectedSecondaryFilters[groupKey].filter(id => id !== tagId);
            applyFilters();
            renderActiveFilterTags();
          }
        });
      }
    });
  });

  // Preço
  const minPrice = document.getElementById('minPrice')?.value;
  const maxPrice = document.getElementById('maxPrice')?.value;
  if (minPrice) tags.push({ label: `Min €${minPrice}`, type: 'price', remove: () => { document.getElementById('minPrice').value = ''; applyFilters(); renderActiveFilterTags(); } });
  if (maxPrice) tags.push({ label: `Max €${maxPrice}`, type: 'price', remove: () => { document.getElementById('maxPrice').value = ''; applyFilters(); renderActiveFilterTags(); } });

  // Stock
  const stockEl = document.getElementById('filterStock');
  if (stockEl?.value === 'true')  tags.push({ label: 'Com stock',  type: 'stock', remove: () => { stockEl.value = ''; applyFilters(); renderActiveFilterTags(); } });
  if (stockEl?.value === 'false') tags.push({ label: 'Sem stock', type: 'stock', remove: () => { stockEl.value = ''; applyFilters(); renderActiveFilterTags(); } });

  // Pesquisa
  const searchVal = document.getElementById('searchInput')?.value?.trim();
  if (searchVal) tags.push({ label: `"${searchVal}"`, type: 'search', remove: () => { document.getElementById('searchInput').value = ''; applyFilters(); renderActiveFilterTags(); } });

  // Render
  if (!tags.length) {
    container.innerHTML = '';
    container.classList.add('empty');
    return;
  }

  container.classList.remove('empty');
  container.innerHTML = tags.map((tag, i) => `
    <span class="active-filter-tag tag-type-${tag.type}" data-index="${i}">
      ${tag.label}
      <button class="tag-remove" data-index="${i}" aria-label="Remover filtro">×</button>
    </span>
  `).join('');

  // Guardar callbacks
  container.querySelectorAll('.tag-remove').forEach(btn => {
    const idx = parseInt(btn.getAttribute('data-index'));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      tags[idx].remove();
    });
  });
}

// ============================================================
// CLEAR HELPERS
// ============================================================
function clearPrimaryFilter() {
  const select = document.getElementById('primaryCategorySelect');
  if (select) select.value = '';
  selectedPrimaryId = null;
  selectedSecondaryFilters = {};
  hideSecondaryFiltersSection();
  renderSecondaryFilters();
  applyFilters();
  renderActiveFilterTags();
}

function clearSecondaryFilters() {
  document.querySelectorAll('.secondary-filter-checkbox').forEach(cb => cb.checked = false);
  selectedSecondaryFilters = {};
  applyFilters();
  renderActiveFilterTags();
}

function clearAllFilters() {
  const select = document.getElementById('primaryCategorySelect');
  if (select) select.value = '';
  document.querySelectorAll('.secondary-filter-checkbox').forEach(cb => cb.checked = false);
  selectedPrimaryId = null;
  selectedSecondaryFilters = {};

  const fields = ['minPrice', 'maxPrice', 'filterStock', 'searchInput'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  hideSecondaryFiltersSection();
  renderSecondaryFilters();
  applyFilters();
  renderActiveFilterTags();
}

// ============================================================
// TOGGLE SIDEBAR (MOBILE)
// ============================================================
function toggleFilters() {
  const sidebar = document.getElementById('filtersSidebar');
  const overlay = document.getElementById('overlay');
  const isOpen  = sidebar.classList.toggle('active');
  overlay?.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeFilters() {
  document.getElementById('filtersSidebar')?.classList.remove('active');
  document.getElementById('overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

// ============================================================
// INIT (chamado pelo products-page.js depois de carregar os dados)
// ============================================================
async function initFilters() {
  await loadFiltersData();
  initCollapsibleFilters();

  document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
  document.getElementById('toggleFilters')?.addEventListener('click', toggleFilters);
  document.getElementById('closeFilters')?.addEventListener('click', closeFilters);

  document.getElementById('overlay')?.addEventListener('click', () => {
    if (document.getElementById('filtersSidebar')?.classList.contains('active')) closeFilters();
  });

  // Toolbar inputs também actualizam as tags
  ['minPrice', 'maxPrice'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderActiveFilterTags);
  });
  document.getElementById('filterStock')?.addEventListener('change', renderActiveFilterTags);
  document.getElementById('searchInput')?.addEventListener('input', renderActiveFilterTags);
}