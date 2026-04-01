'use strict';
// PaginaFrontal/scripts/colors.js
// Consome GET /api/materials  (materiais com cores embutidas)

const API_BASE = '';

const colorsGrid     = document.getElementById('colorsGrid');
const materialFilter = document.getElementById('materialFilter');
const finishFilter   = document.getElementById('finishFilter');
const categoryFilter = document.getElementById('categoryFilter');

let allColors = [];

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadColors();
});

// ─────────────────────────────────────────────────────────────
// CARREGAR DADOS DA API
// ─────────────────────────────────────────────────────────────
async function loadColors() {
  try {
    colorsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#666;">
        <p>A carregar cores...</p>
      </div>`;

    const res = await fetch(`${API_BASE}/api/materials`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const materials = await res.json();

    // Popular select de materiais
    materialFilter.innerHTML = '<option value="all">Todos os Materiais</option>';
    materials.forEach(mat => {
      const opt = document.createElement('option');
      opt.value = mat.id;           // id numérico da BD
      opt.textContent = mat.name;
      materialFilter.appendChild(opt);
    });

    // Achatar todas as cores numa lista plana, adicionando info do material
    allColors = materials.flatMap(mat =>
      (mat.colors || []).map(c => ({
        ...c,
        material_id:   mat.id,
        material_name: mat.name,
        material_slug: mat.slug,
      }))
    );

    renderColorsGrid(allColors);
  } catch (err) {
    console.error('Erro ao carregar cores:', err);
    colorsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#e53e3e;">
        <p>Erro ao carregar cores. Tente novamente mais tarde.</p>
      </div>`;
  }
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAR GRID
// ─────────────────────────────────────────────────────────────
function renderColorsGrid(colors) {
  colorsGrid.innerHTML = '';

  if (!colors.length) {
    colorsGrid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1;">
        <p>Nenhuma cor encontrada com os filtros selecionados.</p>
      </div>`;
    return;
  }

  colors.forEach(color => {
    const card = document.createElement('div');
    card.classList.add('color-card');
    card.dataset.material = color.material_id;
    card.dataset.finish   = color.finish;
    card.dataset.category = color.category;

    const bgStyle = color.gradient
      ? `background:${color.gradient};`
      : `background:${color.hex_code};`;

    card.innerHTML = `
      <div class="color-preview-wrapper">
        <div class="color-gradient" style="${bgStyle}">
          <div class="color-overlay"></div>
        </div>
        ${color.sample_image ? `
          <div class="color-sample-image">
            <img src="${color.sample_image}"
                 alt="Amostra ${color.name}"
                 onerror="this.parentElement.style.display='none';">
            <div class="sample-label">AMOSTRA REAL</div>
          </div>` : ''}
      </div>

      <div class="color-info">
        <h3>${color.name}</h3>
        <div class="color-details">
          <span class="color-code">${color.hex_code}</span>
          <span class="color-material">${color.material_name.toUpperCase()}</span>
        </div>
        <div class="color-tags">
          <span class="tag">${capitalize(color.finish)}</span>
          <span class="tag">${capitalize(color.category)}</span>
        </div>
      </div>`;

    colorsGrid.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─────────────────────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────────────────────
[materialFilter, finishFilter, categoryFilter].forEach(filter => {
  filter.addEventListener('change', applyFilters);
});

function applyFilters() {
  const matVal      = materialFilter.value;
  const finishVal   = finishFilter.value;
  const categoryVal = categoryFilter.value;

  const filtered = allColors.filter(c =>
    (matVal      === 'all' || String(c.material_id) === String(matVal)) &&
    (finishVal   === 'all' || c.finish   === finishVal)   &&
    (categoryVal === 'all' || c.category === categoryVal)
  );

  renderColorsGrid(filtered);
}   