const colorsGrid = document.getElementById('colorsGrid');
const materialFilter = document.getElementById('materialFilter');
const finishFilter = document.getElementById('finishFilter');
const categoryFilter = document.getElementById('categoryFilter');

let allColors = [];

// ===== Carregar JSON =====
fetch('../data/options.json')
  .then(res => res.json())
  .then(data => {
    allColors = data.colors;

    // Popular select de materiais
    materialFilter.innerHTML = '<option value="all">Todos os Materiais</option>';
    data.materials.forEach(mat => {
      const option = document.createElement('option');
      option.value = mat.id;
      option.textContent = mat.name;
      materialFilter.appendChild(option);
    });

    // Renderizar grid inicial
    renderColorsGrid(allColors);
  })
  .catch(err => console.error('Erro ao carregar options.json:', err));

// ===== Função para renderizar grid de cores =====
function renderColorsGrid(colors) {
  colorsGrid.innerHTML = '';

  colors.forEach(color => {
    const card = document.createElement('div');
    card.classList.add('color-card');
    card.dataset.material = color.material;
    card.dataset.finish = color.finish;
    card.dataset.category = color.category;

    card.innerHTML = `
      <div class="color-sample" style="background: ${color.code};">
        <div class="color-overlay"></div>
      </div>
      <div class="color-info">
        <h3>${color.name}</h3>
        <div class="color-details">
          <span class="color-code">${color.code}</span>
          <span class="color-material">${color.material.toUpperCase()}</span>
        </div>
        <div class="color-tags">
          <span class="tag">${capitalize(color.finish)}</span>
          <span class="tag">${capitalize(color.category)}</span>
        </div>
        
      </div>
    `;

    colorsGrid.appendChild(card);
  });
}

// ===== Função auxiliar =====
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Filtragem =====
[materialFilter, finishFilter, categoryFilter].forEach(filter => {
  filter.addEventListener('change', () => {
    const materialVal = materialFilter.value;
    const finishVal = finishFilter.value;
    const categoryVal = categoryFilter.value;

    const filtered = allColors.filter(color => {
      return (materialVal === 'all' || color.material === materialVal) &&
             (finishVal === 'all' || color.finish === finishVal) &&
             (categoryVal === 'all' || color.category === categoryVal);
    });

    renderColorsGrid(filtered);
  });
});
