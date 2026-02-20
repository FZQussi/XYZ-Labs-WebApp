// Frontend/Dashboard/scripts/viewproduct.js

(() => {

  const API_BASE = '';

  const modal = document.getElementById('viewProductModal');

  const nameEl = document.getElementById('viewName');
  const priceEl = document.getElementById('viewPrice');
  const stockEl = document.getElementById('viewStock');
  const statusEl = document.getElementById('viewStatus');
  const descEl = document.getElementById('viewDescription');
  const catEl = document.getElementById('viewCategory');
  const subcatEl = document.getElementById('viewSubcategory');
  const modelViewer = document.getElementById('viewModel');

  const tabButtons = modal.querySelectorAll('.modal-tab-btn');
  const tabContents = modal.querySelectorAll('.modal-tab-content');

  const closeBtn = modal.querySelector('[data-close="view"]');

  const showModal = () => modal.classList.remove('hidden');
  const hideModal = () => modal.classList.add('hidden');

  if (closeBtn) closeBtn.addEventListener('click', hideModal);

  // ===== ABAS =====
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {

      const tabName = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');

      const target = modal.querySelector(`#tab-${tabName}`);
      if (target) target.classList.add('active');
    });
  });

  // ===== ABRIR MODAL =====
  document.addEventListener('openViewProductModal', e => {

    const p = e.detail;

    console.log('📦 Produto recebido no VIEW:', p);

    // ===== HEADER =====
    nameEl.textContent = p.name ?? '—';

    // ===== DETALHES =====
    priceEl.textContent = Number(p.price || 0).toFixed(2);

    stockEl.textContent =
      typeof p.stock === 'boolean'
        ? (p.stock ? 'Disponível' : 'Sem stock')
        : (p.stock ?? 0);

    statusEl.textContent = p.is_active ? 'Ativo' : 'Inativo';

    descEl.textContent = p.description ?? '—';

    // ===== CATEGORIAS (igual ao edit) =====
    if (Array.isArray(p.categories) && p.categories.length > 0) {

      const primary = p.categories.find(c => c.is_primary);

      catEl.textContent = primary
        ? primary.name
        : p.categories[0].name;

      // Mostrar restantes categorias como "subcategoria fake"
      const others = p.categories
        .filter(c => !c.is_primary)
        .map(c => c.name);

      subcatEl.textContent = others.length
        ? others.join(', ')
        : '—';

    } else {
      catEl.textContent = '—';
      subcatEl.textContent = '—';
    }

    // ===== MODELO 3D =====
    if (p.model_file) {

      modelViewer.src = `${API_BASE}/models/${p.model_file}`;

      console.log('🎨 Model SRC:', modelViewer.src);

    } else {

      modelViewer.src = '';
      modelViewer.alt = 'Sem modelo 3D';
    }

    // ===== IMAGENS =====
    const imagesGrid = document.getElementById('imagesGrid');
    imagesGrid.innerHTML = '';

    const images = p.images || [];

    console.log('🖼️ Imagens VIEW:', images);

    if (!images.length) {

      imagesGrid.innerHTML =
        '<p class="no-images">Nenhuma imagem disponível</p>';

    } else {

      images.forEach((filename, index) => {

        const div = document.createElement('div');
        div.className = 'image-item';

        const img = document.createElement('img');
        img.src = `${API_BASE}/images/${filename}`;
        img.alt = `Imagem ${index + 1}`;
        img.loading = 'lazy';

        img.onclick = () => openImageLightbox(img.src);

        div.appendChild(img);
        imagesGrid.appendChild(div);
      });
    }

    tabButtons[0].click();
    showModal();
  });

  // ===== LIGHTBOX =====
  function openImageLightbox(src) {

    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';

    lightbox.innerHTML = `
      <div class="lightbox-content">
        <span class="lightbox-close">&times;</span>
        <img src="${src}">
      </div>
    `;

    document.body.appendChild(lightbox);

    lightbox.onclick = e => {
      if (e.target === lightbox ||
          e.target.classList.contains('lightbox-close')) {
        lightbox.remove();
      }
    };
  }

})();