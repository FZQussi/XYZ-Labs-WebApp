// ============================================================
// products-filters.js — Filtros dinâmicos da página de produtos
// Suporta tipos: multi-select | checkbox | range | search
// ============================================================

// ============================================================
// ESTILOS INJETADOS
// ============================================================
(function injectFilterSidebarStyles() {
  if (document.getElementById('filter-sidebar-styles')) return;
  const style = document.createElement('style');
  style.id = 'filter-sidebar-styles';
  style.textContent = `
    /* ---- RESET BOX-SIZING para toda a sidebar ---- */
    .filters-sidebar *,
    .filters-sidebar *::before,
    .filters-sidebar *::after {
      box-sizing: border-box;
    }

    /* ---- SIDEBAR SCROLL ---- */
    /* Garante que a sidebar tem scroll vertical e nao deixa conteudo sair */
    .filters-sidebar {
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* ---- FILTER-LIST-SCROLL: scroll interno por seccao ---- */
    .filter-list-scroll {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 240px;
      width: 100%;
    }

    /* ---- GRUPOS DE FILTROS ---- */
    .secondary-filter-group {
      width: 100%;
      overflow: hidden; /* impede filhos de sair */
    }

    .secondary-filter-options {
      width: 100%;
      overflow: hidden;
      padding: 4px 0 8px;
    }

    /* ---- CABECALHO DO GRUPO ---- */
    .filter-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      overflow: hidden;
    }
    .filter-group-header h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
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
      flex-shrink: 0;
    }
    .filter-tag-count {
      color: #9ca3af;
      font-size: 10px;
      font-weight: normal;
      margin-left: 3px;
      flex-shrink: 0;
    }

    /* ---- LABEL DO CHECKBOX ---- */
    .filter-label {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 4px 0;
      cursor: pointer;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 100%;
      overflow: hidden;
      line-height: 1.4;
    }
    .filter-label span {
      flex: 1;
      min-width: 0;
      overflow-wrap: break-word;
      word-break: break-word;
      white-space: normal;
    }
    .filter-label input[type="checkbox"] {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .filter-label:hover { color: #000; font-weight: bold; }

    /* ---- RANGE ---- */
    .filter-range-wrapper {
      padding: 6px 0 10px;
      width: 100%;
    }
    .filter-range-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      width: 100%;
    }
    .filter-range-input {
      width: 68px;
      min-width: 0;
      padding: 5px 6px;
      border: 2px solid #000;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #fff;
      -moz-appearance: textfield;
      flex-shrink: 1;
    }
    .filter-range-input::-webkit-outer-spin-button,
    .filter-range-input::-webkit-inner-spin-button { -webkit-appearance: none; }
    .filter-range-input:focus { outline: none; border-color: #2563eb; }
    .filter-range-sep {
      font-size: 11px;
      color: #666;
      font-family: 'Courier New', monospace;
      flex-shrink: 0;
    }
    .filter-range-apply {
      padding: 5px 10px;
      border: 2px solid #000;
      background: #000;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.3px;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .filter-range-apply:hover { background: #333; }
    .filter-range-hint {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #9ca3af;
      margin-top: 5px;
      width: 100%;
      overflow-wrap: break-word;
    }

    /* ---- SEARCH ---- */
    .filter-search-wrapper {
      padding: 6px 0 10px;
      position: relative;
      width: 100%;
    }
    .filter-search-input {
      width: 100%;
      padding: 5px 28px 5px 8px;
      border: 2px solid #000;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #fff;
      box-sizing: border-box;
      display: block;
    }
    .filter-search-input:focus { outline: none; border-color: #2563eb; }
    .filter-search-clear-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 15px;
      color: #9ca3af;
      line-height: 1;
      padding: 0 2px;
    }
    .filter-search-clear-btn:hover { color: #000; }

    /* ---- BARRA DE PESQUISA NOS FILTROS ---- */
    .secondary-filters-search-wrapper {
      padding: 0 0 10px;
      width: 100%;
    }
    .secondary-filter-search {
      display: flex;
      gap: 0;
      width: 100%;
    }
    .secondary-filters-search-input {
      flex: 1;
      min-width: 0;
      padding: 5px 8px;
      border: 2px solid #000;
      border-right: none;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #fff;
      box-sizing: border-box;
    }
    .secondary-filters-search-input:focus { outline: none; border-color: #2563eb; }
    .secondary-filter-search-clear {
      padding: 5px 8px;
      border: 2px solid #000;
      background: #f3f4f6;
      cursor: pointer;
      font-size: 12px;
      flex-shrink: 0;
      font-family: 'Courier New', monospace;
    }
    .secondary-filter-search-clear:hover { background: #e5e7eb; }

    /* ---- TYPE BADGE ---- */
    .filter-type-badge {
      display: inline-block;
      padding: 1px 4px;
      font-family: 'Courier New', monospace;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid currentColor;
      margin-left: 4px;
      vertical-align: middle;
      opacity: 0.5;
      flex-shrink: 0;
    }

    /* ---- SEM OPCOES ---- */
    .no-secondary-filters,
    .secondary-filter-options p {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #9ca3af;
      padding: 4px 0;
      margin: 0;
    }
  `;
  document.head.appendChild(style);
})();

// ============================================================
// ESTADO GLOBAL
// ============================================================
const API_BASE = '';

let primaryCategories = [];
let selectedPrimaryId = null;

/**
 * selectedSecondaryFilters shape por tipo:
 *   multi-select / checkbox : { type: 'multi',  tagIds: [id, ...] }
 *   range                   : { type: 'range',  min: number|null, max: number|null }
 *   search                  : { type: 'search', value: string }
 */
let selectedSecondaryFilters = {};

// Cache dos filtros carregados (para renderActiveFilterTags poder saber o nome do filtro)
let _loadedFilters = [];

// ============================================================
// CARREGAR DADOS
// ============================================================
async function loadFiltersData() {
  try {
    const primRes = await fetch(`${API_BASE}/api/categories/primary`);
    if (!primRes.ok) throw new Error(`Erro ao carregar categorias: ${primRes.status}`);
    primaryCategories = await primRes.json();
    console.log('Categorias primarias carregadas:', primaryCategories.length);

    renderPrimaryFilters();
    hideSecondaryFiltersSection();
    applyFiltersFromURL();
  } catch (err) {
    console.error('Erro ao carregar dados de filtros:', err);
    const container = document.getElementById('primaryCategoryFilters');
    if (container) container.innerHTML = `<p style="color:red;padding:10px">Erro ao carregar filtros.</p>`;
  }
}

// ============================================================
// RENDER CATEGORIAS PRIMARIAS
// ============================================================
function renderPrimaryFilters() {
  const container = document.getElementById('primaryCategoryFilters');
  if (!container) return;

  if (!primaryCategories.length) {
    container.innerHTML = '<p style="color:#666;">Nenhuma categoria disponivel</p>';
    return;
  }

  container.innerHTML = `
    <select id="primaryCategorySelect" class="primary-category-select">
      <option value="" selected>Todas as Categorias</option>
      ${primaryCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')}
    </select>
  `;

  const selectEl = document.getElementById('primaryCategorySelect');
  if (selectEl) {
    selectEl.addEventListener('change', () => {
      const value = selectEl.value;
      if (value === '' && selectedPrimaryId === null) return;

      selectedPrimaryId = value ? parseInt(value) : null;
      selectedSecondaryFilters = {};
      _loadedFilters = [];

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
// MOSTRAR / ESCONDER FILTROS ADICIONAIS
// ============================================================
function hideSecondaryFiltersSection() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;
  const section = container.closest('[data-collapsible]');
  if (section) section.style.display = 'none';
  container.innerHTML = '';
}

function showSecondaryFiltersSection() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;
  const section = container.closest('[data-collapsible]');
  if (section) section.style.display = 'block';
}

// ============================================================
// NORMALIZAR TAG — API publica usa {id,name,key,count,active}
//                 admin usa {id,tag_name,tag_key,product_count,is_active}
// ============================================================
function normalizeTag(t) {
  return {
    ...t,
    tag_name:      t.tag_name      ?? t.name  ?? '',
    tag_key:       t.tag_key       ?? t.key   ?? '',
    product_count: t.product_count ?? t.count  ?? 0,
    is_active:     t.is_active     !== undefined ? t.is_active
                   : t.active      !== undefined ? t.active : true,
  };
}

// ============================================================
// RENDER FILTROS SECUNDARIOS — despachador principal
// ============================================================
async function renderSecondaryFilters() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;

  if (!selectedPrimaryId) {
    container.innerHTML = '';
    _loadedFilters = [];
    return;
  }

  container.innerHTML = '<p style="padding:10px;color:#666;font-size:13px">A carregar filtros...</p>';

  try {
    const url = `${API_BASE}/api/v1/categories/${selectedPrimaryId}/filters`;
    console.log('%c GET ' + url, 'color:#6b7280');
    const res = await fetch(url);
    console.log('  HTTP status:', res.status, '| X-Cache:', res.headers.get('X-Cache'), '| Cache-Control:', res.headers.get('Cache-Control'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const filters = Array.isArray(data) ? data : (data.filters || []);
    console.log('  data.categoryId:', data.categoryId, '| data.categoryName:', data.categoryName);
    console.log('  data.generatedAt:', data.generatedAt);
    console.log('  filters array length:', filters.length);

    _loadedFilters = filters;

    console.group('%c FILTROS API — categoria ' + selectedPrimaryId, 'color:#2563eb;font-weight:bold');
    console.log('%c RAW response completa:', 'color:#7c3aed', JSON.parse(JSON.stringify(data)));
    console.log('%c Total filtros recebidos:', 'color:#059669', filters.length);
    filters.forEach((f, i) => {
      const rawTags = f.tags || [];
      const normalizedTags = rawTags.map(normalizeTag);
      const activeTags = normalizedTags.filter(t => t.is_active !== false);
      console.group(`  [${i}] filter_key="${f.filter_key}" | filter_type="${f.filter_type}" | id=${f.id}`);
      console.log('    filter_name:', f.filter_name);
      console.log('    display_order:', f.display_order);
      console.log('    tags raw count:', rawTags.length);
      console.log('    tags ativos:', activeTags.length);
      if (rawTags.length > 0) {
        console.log('    tags raw:', JSON.parse(JSON.stringify(rawTags)));
      }
      console.groupEnd();
    });
    console.groupEnd();

    // Log extra: verificar se algum filtro do produto nao esta na API
    if (typeof allProducts !== 'undefined' && allProducts.length > 0) {
      const apiFilterKeys = new Set(filters.map(f => f.filter_key));
      const productFilterKeys = new Set(
        allProducts.flatMap(p => (p.filter_tags || []).map(ft => ft.filter_key))
      );
      const missing = [...productFilterKeys].filter(k => !apiFilterKeys.has(k));
      if (missing.length > 0) {
        console.warn('%c ATENCAO: filter_keys nos produtos que NAO existem na API:', 'color:red;font-weight:bold', missing);
        console.warn('  Possivel causa: filtro inativo, primary_category_id errado, ou diferente categoria');
        missing.forEach(key => {
          const exampleProduct = allProducts.find(p => (p.filter_tags||[]).some(ft => ft.filter_key === key));
          if (exampleProduct) {
            const tag = exampleProduct.filter_tags.find(ft => ft.filter_key === key);
            console.warn(`  [${key}] filter_id=${tag.filter_id}, filter_type=${tag.filter_type}, tag_id=${tag.tag_id}, tag_name=${tag.tag_name}`);
          }
        });
      } else {
        console.log('%c OK: todos os filter_keys dos produtos estao na API', 'color:green');
      }
    }

    if (!filters.length) {
      container.innerHTML = '<p class="no-secondary-filters">Sem filtros disponiveis para esta categoria.</p>';
      return;
    }

    // Barra de pesquisa (so para filtros de lista)
    const hasListFilters = filters.some(f =>
      ['checkbox', 'multi-select', 'multiselect'].includes((f.filter_type || '').toLowerCase())
    );

    const searchBar = hasListFilters ? `
      <div class="secondary-filters-search-wrapper">
        <div class="secondary-filter-search">
          <input type="text" class="secondary-filters-search-input"
            placeholder="Procurar filtros..." id="secondaryFiltersSearch">
          <button class="secondary-filter-search-clear" type="button">x</button>
        </div>
      </div>` : '';

    const filterGroupsHTML = filters.map(f => renderFilterGroup(f)).filter(Boolean).join('');

    container.innerHTML = searchBar + filterGroupsHTML;

    // Event listeners por tipo
    filters.forEach(f => attachFilterListeners(f, container));

    // Restaurar estado (ex: vindo de URL)
    restoreFilterState(container);

    // Pesquisa nos filtros de lista
    if (hasListFilters) {
      const searchInput = document.getElementById('secondaryFiltersSearch');
      if (searchInput) {
        searchInput.addEventListener('input', e => {
          const term = e.target.value.toLowerCase();
          container.querySelectorAll('.filter-label').forEach(label => {
            const text = (label.getAttribute('data-filter-text') || '').toLowerCase();
            label.style.display = (term === '' || text.includes(term)) ? 'flex' : 'none';
          });
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
    }

    // Abrir secção automaticamente
    const filterSection = container.closest('[data-collapsible]');
    if (filterSection && !filterSection.classList.contains('open')) {
      filterSection.classList.add('open');
      filterSection.querySelector('.filter-section-body')?.classList.add('open');
    }

  } catch (err) {
    console.error('Erro ao carregar filtros secundarios:', err);
    container.innerHTML = '<p style="color:red;padding:10px">Erro ao carregar filtros.</p>';
  }
}

// ============================================================
// RENDER DE UM GRUPO DE FILTRO (HTML) — por tipo
// ============================================================
function renderFilterGroup(filter) {
  const type = (filter.filter_type || 'multi-select').toLowerCase();
  const tags = (filter.tags || []).map(normalizeTag).filter(t => t.is_active !== false);

  // Range e Search funcionam sem tags no DOM (tags sao so metadados)
  // Para multi-select/checkbox sem tags: mostrar na mesma com aviso (pode haver tags na BD mas inativas)
  if (type !== 'range' && type !== 'search' && !tags.length) {
    return `
      <div class="secondary-filter-group" data-group-key="${filter.filter_key}" data-filter-type="${type}">
        <div class="filter-group-header">
          <h4>${filter.filter_name}</h4>
        </div>
        <div class="secondary-filter-options" data-group-key="${filter.filter_key}">
          <p style="font-family:'Courier New',monospace;font-size:11px;color:#9ca3af;padding:4px 0">
            Sem opcoes disponiveis
          </p>
        </div>
      </div>`;
  }

  const totalWithFilter = tags.reduce((sum, t) => sum + (Number(t.product_count) || 0), 0);
  const countBadge = totalWithFilter > 0
    ? `<span class="filter-group-count">${totalWithFilter}</span>`
    : '';

  let typeBadge = '';
  if (type === 'range')  typeBadge = `<span class="filter-type-badge" style="color:#7c3aed">range</span>`;
  if (type === 'search') typeBadge = `<span class="filter-type-badge" style="color:#059669">search</span>`;

  let bodyHTML = '';
  if (type === 'range') {
    bodyHTML = renderRangeBody(filter, tags);
  } else if (type === 'search') {
    bodyHTML = renderSearchBody(filter);
  } else {
    bodyHTML = renderCheckboxBody(filter, tags);
  }

  return `
    <div class="secondary-filter-group" data-group-key="${filter.filter_key}" data-filter-type="${type}">
      <div class="filter-group-header">
        <h4>${filter.filter_name}${typeBadge}${countBadge}</h4>
      </div>
      <div class="secondary-filter-options" data-group-key="${filter.filter_key}">
        ${bodyHTML}
      </div>
    </div>`;
}

// ---- Checkbox / Multi-select ----
function renderCheckboxBody(filter, tags) {
  return tags.map(tag => {
    const count = Number(tag.product_count) || 0;
    const countStr = count > 0 ? `<span class="filter-tag-count">(${count})</span>` : '';
    return `
      <label class="filter-label"
        data-filter-text="${(tag.tag_name || '').toLowerCase()}"
        data-group-key="${filter.filter_key}">
        <input type="checkbox"
          class="secondary-filter-checkbox"
          value="${tag.id}"
          data-name="${tag.tag_name}"
          data-group-key="${filter.filter_key}">
        <span>${tag.tag_name}${countStr}</span>
      </label>`;
  }).join('');
}

// ---- Range ----
function renderRangeBody(filter, tags) {
  const numericValues = tags
    .map(t => Number(t.tag_name))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  const minAvail = numericValues.length ? numericValues[0] : '';
  const maxAvail = numericValues.length ? numericValues[numericValues.length - 1] : '';

  const hintText = numericValues.length
    ? `<p class="filter-range-hint">Disponivel: ${minAvail} a ${maxAvail}</p>`
    : `<p class="filter-range-hint">Sem valores no intervalo</p>`;

  return `
    <div class="filter-range-wrapper">
      <div class="filter-range-row">
        <input type="number" class="filter-range-input"
          id="range-min-${filter.filter_key}"
          placeholder="${minAvail || 'Min'}"
          data-group-key="${filter.filter_key}"
          data-range-role="min">
        <span class="filter-range-sep">—</span>
        <input type="number" class="filter-range-input"
          id="range-max-${filter.filter_key}"
          placeholder="${maxAvail || 'Max'}"
          data-group-key="${filter.filter_key}"
          data-range-role="max">
        <button class="filter-range-apply" data-group-key="${filter.filter_key}" type="button">OK</button>
      </div>
      ${hintText}
    </div>`;
}

// ---- Search ----
function renderSearchBody(filter) {
  return `
    <div class="filter-search-wrapper">
      <input type="text" class="filter-search-input"
        id="search-input-${filter.filter_key}"
        placeholder="Escreve para filtrar..."
        data-group-key="${filter.filter_key}">
      <button class="filter-search-clear-btn"
        data-group-key="${filter.filter_key}" type="button">x</button>
    </div>`;
}

// ============================================================
// EVENT LISTENERS — por tipo
// ============================================================
function attachFilterListeners(filter, container) {
  const type     = (filter.filter_type || 'multi-select').toLowerCase();
  const groupKey = filter.filter_key;

  if (type === 'range') {
    const applyBtn = container.querySelector(`.filter-range-apply[data-group-key="${groupKey}"]`);
    const minInput = container.querySelector(`#range-min-${groupKey}`);
    const maxInput = container.querySelector(`#range-max-${groupKey}`);

    const applyRange = () => {
      const minVal = (minInput?.value !== '') ? Number(minInput.value) : null;
      const maxVal = (maxInput?.value !== '') ? Number(maxInput.value) : null;

      if (minVal === null && maxVal === null) {
        delete selectedSecondaryFilters[groupKey];
      } else {
        selectedSecondaryFilters[groupKey] = { type: 'range', min: minVal, max: maxVal };
      }
      applyFilters();
      renderActiveFilterTags();
    };

    applyBtn?.addEventListener('click', applyRange);
    minInput?.addEventListener('keydown', e => { if (e.key === 'Enter') applyRange(); });
    maxInput?.addEventListener('keydown', e => { if (e.key === 'Enter') applyRange(); });

  } else if (type === 'search') {
    const input    = container.querySelector(`#search-input-${groupKey}`);
    const clearBtn = container.querySelector(`.filter-search-clear-btn[data-group-key="${groupKey}"]`);

    let debounceTimer;
    input?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const value = input.value.trim();
        if (!value) {
          delete selectedSecondaryFilters[groupKey];
        } else {
          selectedSecondaryFilters[groupKey] = { type: 'search', value };
        }
        applyFilters();
        renderActiveFilterTags();
      }, 300);
    });

    clearBtn?.addEventListener('click', () => {
      if (input) input.value = '';
      delete selectedSecondaryFilters[groupKey];
      applyFilters();
      renderActiveFilterTags();
    });

  } else {
    // Checkbox / multi-select
    container.querySelectorAll(`.secondary-filter-checkbox[data-group-key="${groupKey}"]`).forEach(cb => {
      cb.addEventListener('change', () => {
        if (!selectedSecondaryFilters[groupKey]) {
          selectedSecondaryFilters[groupKey] = { type: 'multi', tagIds: [] };
        }
        const state = selectedSecondaryFilters[groupKey];
        const tagId = parseInt(cb.value);

        if (cb.checked) {
          if (!state.tagIds.includes(tagId)) state.tagIds.push(tagId);
        } else {
          state.tagIds = state.tagIds.filter(id => id !== tagId);
        }

        if (!state.tagIds.length) delete selectedSecondaryFilters[groupKey];

        applyFilters();
        renderActiveFilterTags();
      });
    });
  }
}

// ============================================================
// RESTAURAR ESTADO NOS INPUTS
// ============================================================
function restoreFilterState(container) {
  if (!container) return;

  Object.entries(selectedSecondaryFilters).forEach(([groupKey, state]) => {
    if (!state) return;

    if (state.type === 'multi' && Array.isArray(state.tagIds)) {
      state.tagIds.forEach(tagId => {
        const cb = container.querySelector(`.secondary-filter-checkbox[value="${tagId}"]`);
        if (cb) cb.checked = true;
      });

    } else if (state.type === 'range') {
      const minInput = container.querySelector(`#range-min-${groupKey}`);
      const maxInput = container.querySelector(`#range-max-${groupKey}`);
      if (minInput && state.min != null) minInput.value = state.min;
      if (maxInput && state.max != null) maxInput.value = state.max;

    } else if (state.type === 'search') {
      const input = container.querySelector(`#search-input-${groupKey}`);
      if (input && state.value) input.value = state.value;
    }
  });
}

// ============================================================
// APPLY FILTERS — atualiza URL e dispara evento
// ============================================================
function applyFilters() {
  const url = new URL(window.location);
  url.searchParams.delete('primary');
  url.searchParams.delete('secondary');

  if (selectedPrimaryId) url.searchParams.set('primary', selectedPrimaryId);

  if (Object.keys(selectedSecondaryFilters).length > 0) {
    url.searchParams.set('secondary', JSON.stringify(selectedSecondaryFilters));
  }

  window.history.replaceState({}, '', url);

  document.dispatchEvent(new CustomEvent('filtersApplied', {
    detail: {
      primaryCategoryId: selectedPrimaryId,
      secondaryFilters:  selectedSecondaryFilters,
    }
  }));
}

// ============================================================
// COLLAPSIBLE SECTIONS
// ============================================================
function initCollapsibleFilters() {
  const sections = document.querySelectorAll('[data-collapsible]');

  sections.forEach(section => {
    const toggle = section.querySelector('.filter-section-toggle');
    const body   = section.querySelector('.filter-section-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      section.classList.toggle('open');
      body.classList.toggle('open');
    });
  });

  if (sections.length >= 1) {
    sections[0].classList.add('open');
    sections[0].querySelector('.filter-section-body')?.classList.add('open');
  }
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

  const secondaryParam = params.get('secondary');
  if (secondaryParam) {
    try {
      const parsed = JSON.parse(secondaryParam);
      // Suporte ao formato antigo (array plano) -> converter para novo formato
      Object.entries(parsed).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          selectedSecondaryFilters[key] = { type: 'multi', tagIds: val };
        } else {
          selectedSecondaryFilters[key] = val;
        }
      });
      restoreFilterState(document.getElementById('secondaryCategoryFilters'));
    } catch (_) {
      selectedSecondaryFilters = {};
    }
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
// ACTIVE FILTER TAGS (pills na toolbar)
// ============================================================
function renderActiveFilterTags() {
  const container = document.getElementById('activeFilterTags');
  if (!container) return;

  const tags = [];

  // Categoria primaria
  if (selectedPrimaryId) {
    const cat = primaryCategories.find(c => c.id === selectedPrimaryId);
    if (cat) {
      tags.push({
        label: cat.name,
        type:  'primary',
        remove: () => clearPrimaryFilter()
      });
    }
  }

  // Filtros secundarios
  Object.entries(selectedSecondaryFilters).forEach(([groupKey, state]) => {
    if (!state) return;

    const filterMeta = _loadedFilters.find(f => f.filter_key === groupKey);
    const filterName = filterMeta?.filter_name || groupKey;

    if (state.type === 'multi' && Array.isArray(state.tagIds)) {
      state.tagIds.forEach(tagId => {
        const cb = document.querySelector(`.secondary-filter-checkbox[value="${tagId}"]`);
        const tagName = cb?.getAttribute('data-name') || `#${tagId}`;
        tags.push({
          label: `${filterName}: ${tagName}`,
          type:  'secondary',
          remove: () => {
            if (cb) cb.checked = false;
            state.tagIds = state.tagIds.filter(id => id !== tagId);
            if (!state.tagIds.length) delete selectedSecondaryFilters[groupKey];
            applyFilters();
            renderActiveFilterTags();
          }
        });
      });

    } else if (state.type === 'range') {
      const parts = [];
      if (state.min != null) parts.push(`>= ${state.min}`);
      if (state.max != null) parts.push(`<= ${state.max}`);
      if (parts.length) {
        tags.push({
          label: `${filterName}: ${parts.join(' ')}`,
          type:  'secondary',
          remove: () => {
            delete selectedSecondaryFilters[groupKey];
            const minInput = document.querySelector(`#range-min-${groupKey}`);
            const maxInput = document.querySelector(`#range-max-${groupKey}`);
            if (minInput) minInput.value = '';
            if (maxInput) maxInput.value = '';
            applyFilters();
            renderActiveFilterTags();
          }
        });
      }

    } else if (state.type === 'search' && state.value) {
      tags.push({
        label: `${filterName}: "${state.value}"`,
        type:  'secondary',
        remove: () => {
          delete selectedSecondaryFilters[groupKey];
          const input = document.querySelector(`#search-input-${groupKey}`);
          if (input) input.value = '';
          applyFilters();
          renderActiveFilterTags();
        }
      });
    }
  });

  // Preco
  const minPrice = document.getElementById('minPrice')?.value;
  const maxPrice = document.getElementById('maxPrice')?.value;
  if (minPrice) tags.push({ label: `Min E${minPrice}`, type: 'price', remove: () => { document.getElementById('minPrice').value = ''; applyFilters(); renderActiveFilterTags(); } });
  if (maxPrice) tags.push({ label: `Max E${maxPrice}`, type: 'price', remove: () => { document.getElementById('maxPrice').value = ''; applyFilters(); renderActiveFilterTags(); } });

  // Stock
  const stockEl = document.getElementById('filterStock');
  if (stockEl?.value === 'true')  tags.push({ label: 'Com stock',  type: 'stock', remove: () => { stockEl.value = ''; applyFilters(); renderActiveFilterTags(); } });
  if (stockEl?.value === 'false') tags.push({ label: 'Sem stock', type: 'stock', remove: () => { stockEl.value = ''; applyFilters(); renderActiveFilterTags(); } });

  // Pesquisa geral
  const searchVal = document.getElementById('searchInput')?.value?.trim();
  if (searchVal) tags.push({ label: `"${searchVal}"`, type: 'search', remove: () => { document.getElementById('searchInput').value = ''; applyFilters(); renderActiveFilterTags(); } });

  if (!tags.length) {
    container.innerHTML = '';
    container.classList.add('empty');
    return;
  }

  container.classList.remove('empty');
  container.innerHTML = tags.map((tag, i) => `
    <span class="active-filter-tag tag-type-${tag.type}" data-index="${i}">
      ${tag.label}
      <button class="tag-remove" data-index="${i}" aria-label="Remover filtro">x</button>
    </span>
  `).join('');

  container.querySelectorAll('.tag-remove').forEach(btn => {
    const idx = parseInt(btn.getAttribute('data-index'));
    btn.addEventListener('click', e => {
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
  _loadedFilters = [];
  hideSecondaryFiltersSection();
  renderSecondaryFilters();
  applyFilters();
  renderActiveFilterTags();
}

function clearSecondaryFilters() {
  document.querySelectorAll('.secondary-filter-checkbox').forEach(cb => cb.checked = false);
  document.querySelectorAll('.filter-range-input').forEach(inp => inp.value = '');
  document.querySelectorAll('.filter-search-input').forEach(inp => inp.value = '');
  selectedSecondaryFilters = {};
  applyFilters();
  renderActiveFilterTags();
}

function clearAllFilters() {
  const select = document.getElementById('primaryCategorySelect');
  if (select) select.value = '';
  selectedPrimaryId = null;
  selectedSecondaryFilters = {};
  _loadedFilters = [];

  document.querySelectorAll('.secondary-filter-checkbox').forEach(cb => cb.checked = false);
  document.querySelectorAll('.filter-range-input').forEach(inp => inp.value = '');
  document.querySelectorAll('.filter-search-input').forEach(inp => inp.value = '');
  ['minPrice', 'maxPrice', 'filterStock', 'searchInput'].forEach(id => {
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
// INIT
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

  ['minPrice', 'maxPrice'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderActiveFilterTags);
  });
  document.getElementById('filterStock')?.addEventListener('change', renderActiveFilterTags);
  document.getElementById('searchInput')?.addEventListener('input', renderActiveFilterTags);
}