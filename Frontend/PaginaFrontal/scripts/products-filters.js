// ============================================================
// products-filters.js
// Gestão da sidebar de filtros:
//   - Carregar categorias primárias e secundárias
//   - Sections colapsáveis (só uma aberta de cada vez)
//   - Scroll interno nas listas
//   - Active filter tags na toolbar
// ============================================================

const API_BASE = '';

let primaryCategories   = [];
let secondaryCategories = [];
let selectedPrimaryId   = null;

// ============================================================
// CARREGAR CATEGORIAS
// ============================================================
async function loadCategories() {
  try {
    const [primRes, secRes] = await Promise.all([
      fetch(`${API_BASE}/api/categories/primary`),
      fetch(`${API_BASE}/api/categories/secondary`)
    ]);
    primaryCategories   = primRes.ok ? await primRes.json() : [];
    secondaryCategories = secRes.ok  ? await secRes.json()  : [];

    renderPrimaryFilters();
    renderSecondaryFilters();
    initSecondarySearch();
    applyFiltersFromURL();
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

// ============================================================
// RENDER PRIMÁRIAS (radio — só uma)
// ============================================================
function renderPrimaryFilters() {
  const container = document.getElementById('primaryCategoryFilters');
  if (!container) return;

  container.innerHTML = primaryCategories.map(cat => `
    <label class="filter-label">
      <input type="radio" name="primaryCategory" value="${cat.id}" class="primary-cat-radio">
      <span>${cat.name}</span>
    </label>
  `).join('');

  container.querySelectorAll('.primary-cat-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      selectedPrimaryId = parseInt(radio.value);
      applyFilters();
      renderActiveFilterTags();
    });
  });
}

// ============================================================
// RENDER SECUNDÁRIAS (checkboxes — várias)
// ============================================================
function renderSecondaryFilters() {
  const container = document.getElementById('secondaryCategoryFilters');
  if (!container) return;

  container.innerHTML = secondaryCategories.map(cat => `
    <label class="filter-label">
      <input type="checkbox" value="${cat.id}" data-name="${cat.name}" class="secondary-cat-checkbox">
      <span>${cat.name}</span>
    </label>
  `).join('');

  container.querySelectorAll('.secondary-cat-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      applyFilters();
      renderActiveFilterTags();
    });
  });
}

// ============================================================
// PESQUISA NAS SECUNDÁRIAS
// ============================================================
function initSecondarySearch() {
  const input = document.getElementById('secondaryCategorySearch');
  if (!input) return;

  input.addEventListener('input', function () {
    const search = this.value.toLowerCase();
    document.querySelectorAll('#secondaryCategoryFilters .filter-label').forEach(label => {
      const name = label.querySelector('span').textContent.toLowerCase();
      label.style.display = name.includes(search) ? '' : 'none';
    });
  });
}

// ============================================================
// SECTIONS COLAPSÁVEIS
// Solo uma aberta de cada vez
// ============================================================
function initCollapsibleFilters() {
  const sections = document.querySelectorAll('.filter-section[data-collapsible]');

  sections.forEach(section => {
    const toggle  = section.querySelector('.filter-section-toggle');
    const body    = section.querySelector('.filter-section-body');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
      const isOpen = section.classList.contains('open');

      // Fechar todas
      sections.forEach(s => {
        s.classList.remove('open');
        s.querySelector('.filter-section-body')?.classList.remove('open');
      });

      // Abrir esta se estava fechada
      if (!isOpen) {
        section.classList.add('open');
        body.classList.add('open');
      }
    });
  });

  // Abrir a primeira por defeito
  if (sections.length) {
    sections[0].classList.add('open');
    sections[0].querySelector('.filter-section-body')?.classList.add('open');
  }
}

// ============================================================
// APPLY FILTERS FROM URL
// ============================================================
function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);

  const primaryId = params.get('primary');
  if (primaryId) {
    const radio = document.querySelector(`.primary-cat-radio[value="${primaryId}"]`);
    if (radio) {
      radio.checked = true;
      selectedPrimaryId = parseInt(primaryId);
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

  // Categorias secundárias
  document.querySelectorAll('.secondary-cat-checkbox:checked').forEach(cb => {
    const id   = parseInt(cb.value);
    const name = cb.getAttribute('data-name');
    tags.push({
      label: name,
      type: 'secondary',
      remove: () => {
        cb.checked = false;
        applyFilters();
        renderActiveFilterTags();
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

  // Guardar callbacks (não podem ir inline por segurança)
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
  document.querySelectorAll('.primary-cat-radio').forEach(r => r.checked = false);
  selectedPrimaryId = null;
  applyFilters();
  renderActiveFilterTags();
}

function clearSecondaryFilters() {
  document.querySelectorAll('.secondary-cat-checkbox').forEach(cb => cb.checked = false);
  applyFilters();
  renderActiveFilterTags();
}

function clearAllFilters() {
  document.querySelectorAll('.primary-cat-radio').forEach(r => r.checked = false);
  document.querySelectorAll('.secondary-cat-checkbox').forEach(cb => cb.checked = false);
  selectedPrimaryId = null;

  const fields = ['minPrice', 'maxPrice', 'filterStock', 'searchInput', 'secondaryCategorySearch'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset secondary search visibility
  document.querySelectorAll('#secondaryCategoryFilters .filter-label').forEach(l => l.style.display = '');

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
  await loadCategories();
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