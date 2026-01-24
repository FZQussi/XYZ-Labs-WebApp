// Frontend/Dashboard/scripts/viewproduct.js
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('viewProductModal');

  const nameEl = document.getElementById('viewName');
  const priceEl = document.getElementById('viewPrice');
  const stockEl = document.getElementById('viewStock');
  const statusEl = document.getElementById('viewStatus');
  const descEl = document.getElementById('viewDescription');
  const catEl = document.getElementById('viewCategory');
  const subcatEl = document.getElementById('viewSubcategory');
  const modelViewer = document.getElementById('viewModel');

  // Elementos das abas
  const tabButtons = document.querySelectorAll('.modal-tab-btn');
  const tabContents = document.querySelectorAll('.modal-tab-content');

  function show() { modal.classList.remove('hidden'); }
  function hide() { modal.classList.add('hidden'); }

  modal.querySelector('[data-close="view"]').addEventListener('click', hide);

  // === SISTEMA DE ABAS ===
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      // Remove active de todos os botões
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Esconde todos os conteúdos
      tabContents.forEach(content => content.classList.remove('active'));

      // Ativa o botão clicado
      btn.classList.add('active');

      // Mostra o conteúdo correspondente
      const targetContent = document.getElementById(`tab-${tabName}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Evento para abrir modal
  document.addEventListener('openViewProductModal', async e => {
    const p = e.detail;
    console.log('🚀 Produto recebido no modal:', p);

    // === ABA DETALHES ===
    nameEl.textContent = p.name;
    priceEl.textContent = Number(p.price).toFixed(2);
    stockEl.textContent = p.stock ?? 0;
    statusEl.textContent = p.is_active ? 'Ativo' : 'Inativo';
    descEl.textContent = p.description;
    catEl.textContent = p.category_name ?? '—';
    subcatEl.textContent = p.subcategory_name ?? '—';

    // === ABA MODELO 3D ===
    if (p.model_file) {
      modelViewer.src = `http://localhost:3001/models/${p.model_file}`;
      console.log('📦 Model 3D:', modelViewer.src);
      modelViewer.style.backgroundColor = '#cccccc';
      modelViewer.style.color = '#005f6b';
    } else {
      modelViewer.src = '';
      modelViewer.alt = 'Sem modelo 3D disponível';
    }

    // === ABA IMAGENS ===
    const imagesGrid = document.getElementById('imagesGrid');
    imagesGrid.innerHTML = ''; // Limpa imagens anteriores

    const images = p.images || [];
    console.log('🖼️ Imagens do produto:', images);

    if (images.length > 0) {
      images.forEach((filename, index) => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-item';

        const img = document.createElement('img');
        img.src = `http://localhost:3001/images/${filename}`;
        img.alt = `Imagem ${index + 1}`;
        img.loading = 'lazy';

        // Clique para ampliar
        img.addEventListener('click', () => {
          openImageLightbox(img.src);
        });

        imgContainer.appendChild(img);
        imagesGrid.appendChild(imgContainer);
      });
    } else {
      imagesGrid.innerHTML = '<p class="no-images">Nenhuma imagem disponível</p>';
    }

    // Ativa a primeira aba por padrão
    tabButtons[0].click();

    show();
  });

  // === LIGHTBOX PARA IMAGENS ===
  function openImageLightbox(src) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <span class="lightbox-close">&times;</span>
        <img src="${src}" alt="Imagem ampliada">
      </div>
    `;

    document.body.appendChild(lightbox);

    // Fechar ao clicar no X ou fora da imagem
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.remove();
      }
    });
  }
});