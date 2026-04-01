'use strict';
// PaginaFrontal/scripts/materials.js
// Consome GET /api/materials  (array de materiais com cores embutidas)

const API_BASE = '';

const materialsGrid  = document.querySelector('.materials-grid');
const filterButtons  = document.querySelectorAll('.filter-btn');

let allMaterials = [];

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadMaterials();
});

// ─────────────────────────────────────────────────────────────
// CARREGAR MATERIAIS DA API
// ─────────────────────────────────────────────────────────────
async function loadMaterials() {
  try {
    showLoading();
    const res = await fetch(`${API_BASE}/api/materials`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    allMaterials = await res.json();
    renderMaterialsGrid(allMaterials);
  } catch (err) {
    console.error('Erro ao carregar materiais:', err);
    showError();
  }
}

// ─────────────────────────────────────────────────────────────
// LOADING / ERROR STATES
// ─────────────────────────────────────────────────────────────
function showLoading() {
  materialsGrid.innerHTML = `
    <div class="loading-state" style="grid-column:1/-1;text-align:center;padding:3rem;color:#666;">
      <p>A carregar materiais...</p>
    </div>`;
}

function showError() {
  materialsGrid.innerHTML = `
    <div class="error-state" style="grid-column:1/-1;text-align:center;padding:3rem;color:#e53e3e;">
      <p>Erro ao carregar materiais. Tente novamente mais tarde.</p>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAR GRID
// ─────────────────────────────────────────────────────────────
function renderMaterialsGrid(materials) {
  materialsGrid.innerHTML = '';

  if (!materials.length) {
    materialsGrid.innerHTML = `
      <div class="no-results" style="grid-column:1/-1;">
        <p>Nenhum material encontrado nesta categoria.</p>
      </div>`;
    return;
  }

  materials.forEach(mat => {
    const card = document.createElement('div');
    card.classList.add('material-card');
    card.dataset.category = mat.category;

    // Visual: imagem > gradiente > fallback cinza
    let visualContent = '';
    if (mat.image_url) {
      visualContent = `
        <img src="${mat.image_url}"
             alt="${mat.name}"
             class="material-image-photo"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
        <div class="material-gradient-fallback"
             style="background:${mat.gradient || '#ccc'};display:none;"></div>`;
    } else if (mat.gradient) {
      visualContent = `
        <div class="material-gradient-display"
             style="background:${mat.gradient};"></div>`;
    } else {
      visualContent = `
        <div class="material-gradient-display"
             style="background:linear-gradient(135deg,#ccc,#999);"></div>`;
    }

    // Propriedades (barras de progresso)
    const properties = {
      'Resistência':   mat.prop_resistance   || 0,
      'Flexibilidade': mat.prop_flexibility  || 0,
      'Durabilidade':  mat.prop_durability   || 0,
    };

    const propsHTML = Object.entries(properties).map(([label, val]) => `
      <div class="property">
        <span class="prop-label">${label}:</span>
        <div class="prop-bar">
          <div class="prop-fill" style="width:${val}%;"></div>
        </div>
      </div>`).join('');

    // Specs
    const specs = Array.isArray(mat.specs) ? mat.specs : [];
    const specsHTML = specs.length
      ? `<div class="material-specs">
           <h4>Especificações:</h4>
           <ul>${specs.map(s => `<li>${s}</li>`).join('')}</ul>
         </div>`
      : '';

    // Cores disponíveis (chips de prévia)
    const colors = Array.isArray(mat.colors) ? mat.colors : [];
    const colorsHTML = colors.length
      ? `<div class="material-colors-preview">
           <span class="colors-label">Cores disponíveis (${colors.length}):</span>
           <div class="colors-chips">
             ${colors.slice(0, 12).map(c => `
               <span class="color-chip"
                     style="${c.gradient ? `background:${c.gradient}` : `background:${c.hex_code}`}"
                     title="${c.name}"></span>`).join('')}
             ${colors.length > 12 ? `<span class="colors-more">+${colors.length - 12}</span>` : ''}
           </div>
         </div>`
      : '';

    card.innerHTML = `
      <div class="material-header">
        <h3>${mat.name}</h3>
        ${mat.badge ? `<span class="material-badge ${mat.badge.toLowerCase().replace(/\s+/g,'-')}">${mat.badge}</span>` : ''}
      </div>

      <div class="material-visual">
        ${visualContent}
        ${mat.gradient ? '<div class="material-texture-overlay"></div>' : ''}
      </div>

      <div class="material-info">
        ${mat.description ? `<p class="material-desc">${mat.description}</p>` : ''}

        <div class="material-properties">
          ${propsHTML}
        </div>

        ${specsHTML}
        ${colorsHTML}
      </div>`;

    materialsGrid.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────────────────────
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const category = btn.dataset.category;
    const filtered = category === 'all'
      ? allMaterials
      : allMaterials.filter(m => m.category === category);

    renderMaterialsGrid(filtered);
  });
});