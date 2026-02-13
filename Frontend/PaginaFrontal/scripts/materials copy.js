const materialsGrid = document.querySelector('.materials-grid');
const filterButtons = document.querySelectorAll('.filter-btn');

let allMaterials = [];

// ===== Carregar JSON =====
fetch('../data/options.json')
  .then(res => res.json())
  .then(data => {
    allMaterials = data.materials;
    renderMaterialsGrid(allMaterials);
  })
  .catch(err => console.error('Erro ao carregar options.json:', err));

// ===== Renderizar Grid de Materiais =====
function renderMaterialsGrid(materials) {
  materialsGrid.innerHTML = '';

  materials.forEach(mat => {
    const card = document.createElement('div');
    card.classList.add('material-card');
    card.dataset.category = mat.category;

    // HTML do cartão
    card.innerHTML = `
      <div class="material-header">
        <h3>${mat.name}</h3>
        ${mat.badge ? `<span class="material-badge">${mat.badge}</span>` : ''}
      </div>
      <div class="material-image">
        ${mat.image
          ? `<img src="${mat.image}" alt="${mat.name}" class="material-sample" onerror="this.onerror=null;this.style.display='none'; this.nextElementSibling.style.display='block';">`
          : ''}
        <div class="material-sample" style="background: ${mat.gradient || '#ccc'}; display: ${mat.image ? 'none' : 'block'};"></div>
      </div>
      <div class="material-info">
        <p class="material-desc">${mat.description}</p>
        <div class="material-properties">
          ${Object.entries(mat.properties).map(([prop, value]) => `
            <div class="property">
              <span class="prop-label">${prop}:</span>
              <div class="prop-bar"><div class="prop-fill" style="width: ${value}%;"></div></div>
            </div>
          `).join('')}
        </div>
        <div class="material-specs">
          <h4>Especificações:</h4>
          <ul>
            ${mat.specs.map(spec => `<li>${spec}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    materialsGrid.appendChild(card);
  });
}

// ===== Filtrar Materiais =====
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Atualizar botão ativo
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const category = btn.dataset.category;
    const filtered = category === 'all'
      ? allMaterials
      : allMaterials.filter(mat => mat.category === category);

    renderMaterialsGrid(filtered);
  });
});
