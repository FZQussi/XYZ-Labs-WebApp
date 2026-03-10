// ============================================================
// products-filters.js (CORRIGIDO - DROPDOWN PARA CATEGORIA PRINCIPAL)
// Gestão da sidebar de filtros com FILTROS SECUNDÁRIOS DINÂMICOS:
//   - Carregar categorias primárias da API
//   - Carregar estrutura de filtros secundários do JSON
//   - Mostrar/esconder filtros secundários conforme a categoria primária selecionada
//   - Sections colapsáveis (MÚLTIPLAS ABERTAS SIMULTANEAMENTE)
//   - Active filter tags na toolbar
//   - ALTERADO: SELECT DROPDOWN para categoria principal (em vez de radio buttons)
// ============================================================

const API_BASE = '';

let primaryCategories   = [];
let categoriesStructure = {}; // Estrutura de filtros secundários por categoria
let selectedPrimaryId   = null;
let selectedSecondaryFilters = {}; // { filterId: [tag ids] }

// ============================================================
// DETECTAR CAMINHO CORRETO DO JSON (PROCURA NA PASTA /scripts/)
// ============================================================
async function loadCategoriesStructure() {
  // Tentar múltiplos caminhos possíveis (a maioria procura em /scripts/ onde está este ficheiro)
  const possiblePaths = [
    './categories-structure.json',                    // Mesma pasta (recomendado)
    '../scripts/categories-structure.json',           // Vindo de pages/
    '../../PaginaFrontal/scripts/categories-structure.json',  // Caminho completo
    '/scripts/categories-structure.json',             // Raiz
  ];

  for (const path of possiblePaths) {
    try {
      const response = await fetch(path);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ JSON carregado com sucesso de: ${path}`);
        return data;
      }
    } catch (err) {
      // Continuar a tentar o próximo caminho
      continue;
    }
  }

  // Se chegou aqui, nenhum caminho funcionou
  console.error('❌ Não foi possível carregar categories-structure.json');
  console.error('Caminhos tentados:', possiblePaths);
  console.error('O ficheiro deve estar em: /PaginaFrontal/scripts/categories-structure.json');
  return { categories: [] };
}

// ============================================================
// CARREGAR DADOS
// ============================================================
async function loadFiltersData() {
  try {
    // Carregar categorias primárias
    const primRes = await fetch(`${API_BASE}/api/categories/primary`);
    if (!primRes.ok) {
      throw new Error(`Erro ao carregar categorias primárias: ${primRes.status}`);
    }
    primaryCategories = await primRes.json();
    console.log('✅ Categorias primárias carregadas:', primaryCategories);

    // Carregar estrutura de filtros secundários do JSON
    const structData = await loadCategoriesStructure();
    
    // Converter para map para fácil acesso por ID
    if (structData.categories) {
      structData.categories.forEach(cat => {
        categoriesStructure[cat.id] = cat;
      });
      console.log('✅ Estrutura de filtros carregada:', categoriesStructure);
    }

    renderPrimaryFilters();
    applyFiltersFromURL();
  } catch (err) {
    console.error('Erro ao carregar dados de filtros:', err);
    const container = document.getElementById('primaryCategoryFilters');
    if (container) {
      container.innerHTML = `<p style="color: red; padding: 10px;">⚠️ Erro ao carregar filtros. Verifique a consola (F12).</p>`;
    }
  }
}

// ============================================================
// RENDER CATEGORIAS PRIMÁRIAS (SELECT DROPDOWN)
// ALTERADO: Usar <select> em vez de radio buttons
// ============================================================
function renderPrimaryFilters() {
  const container = document.getElementById('primaryCategoryFilters');
  if (!container) return;

  if (!primaryCategories.length) {
    container.innerHTML = '<p style="color: #666;">Nenhuma categoria disponível</p>';
    return;
  }

  // Criar o select dropdown
  const selectHTML = `
    <select id="primaryCategorySelect" class="primary-category-select">
      <option value="">🏠 Todas as Categorias</option>
      ${primaryCategories.map(cat => `
        <option value="${cat.id}">${cat.icon || '📁'} ${cat.name}</option>
      `).join('')}
    </select>
  `;

  container.innerHTML = selectHTML;

  // Adicionar event listener ao select
  const selectEl = document.getElementById('primaryCategorySelect');
  if (selectEl) {
    selectEl.addEventListener('change', () => {
      const value = selectEl.value;
      selectedPrimaryId = value ? parseInt(value) : null;
      selectedSecondaryFilters = {}; // Limpar filtros secundários ao trocar de categoria
      renderSecondaryFilters();
      applyFilters();
      renderActiveFilterTags();
    });
  }
}

// ============================================================
// RENDER FILTROS SECUNDÁRIOS (dinâmicos conforme a categoria primária)
// ============================================================
function renderSecondaryFilters() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;

  // Se nenhuma categoria primária selecionada, mostrar mensagem
  if (!selectedPrimaryId) {
    container.innerHTML = '<p class="no-secondary-filters">Selecione uma categoria principal para ver filtros adicionais.</p>';
    return;
  }

  // Obter estrutura de filtros para a categoria selecionada
  const catStructure = categoriesStructure[selectedPrimaryId];
  if (!catStructure || !catStructure.secondaryFilters || !catStructure.secondaryFilters.length) {
    container.innerHTML = '<p class="no-secondary-filters">Sem filtros disponíveis para esta categoria.</p>';
    return;
  }

  // Renderizar cada grupo de filtros (Marca, Modelo, Ano, etc.)
  container.innerHTML = catStructure.secondaryFilters.map(filterGroup => `
    <div class="secondary-filter-group">
      <h4>${filterGroup.name}</h4>
      <div class="secondary-filter-options">
        ${filterGroup.tags.map(tag => `
          <label class="filter-label">
            <input 
              type="checkbox" 
              value="${tag.id}" 
              data-name="${tag.name}"
              data-group-key="${filterGroup.key}"
              class="secondary-filter-checkbox">
            <span>${tag.name}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Adicionar event listeners aos checkboxes
  container.querySelectorAll('.secondary-filter-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const groupKey = cb.getAttribute('data-group-key');
      if (!selectedSecondaryFilters[groupKey]) {
        selectedSecondaryFilters[groupKey] = [];
      }
      if (cb.checked) {
        selectedSecondaryFilters[groupKey].push(parseInt(cb.value));
      } else {
        selectedSecondaryFilters[groupKey] = selectedSecondaryFilters[groupKey].filter(id => id !== parseInt(cb.value));
      }
      applyFilters();
      renderActiveFilterTags();
    });
  });

  // Restaurar checkboxes se houver filtros já selecionados
  Object.keys(selectedSecondaryFilters).forEach(groupKey => {
    selectedSecondaryFilters[groupKey].forEach(tagId => {
      const cb = container.querySelector(`.secondary-filter-checkbox[value="${tagId}"]`);
      if (cb) cb.checked = true;
    });
  });
}

// ============================================================
// SECTIONS COLAPSÁVEIS
// MÚLTIPLAS PODEM ESTAR ABERTAS AO MESMO TEMPO
// ============================================================
function initCollapsibleFilters() {
  const sections = document.querySelectorAll('.filter-section[data-collapsible]');

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

  // Abrir ambas as primeiras sections por defeito
  if (sections.length >= 2) {
    sections[0].classList.add('open');
    sections[0].querySelector('.filter-section-body')?.classList.add('open');
    sections[1].classList.add('open');
    sections[1].querySelector('.filter-section-body')?.classList.add('open');
  }
}

// ============================================================
// APPLY FILTERS FROM URL
// ============================================================
function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  const primaryId = params.get('primary');
  if (primaryId) {
    const select = document.getElementById('primaryCategorySelect');
    if (select) {
      select.value = primaryId;
      selectedPrimaryId = parseInt(primaryId);
      renderSecondaryFilters();
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