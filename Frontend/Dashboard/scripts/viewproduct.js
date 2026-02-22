// Frontend/Dashboard/scripts/viewproduct.js — ATUALIZADO
(() => {
  const API_BASE = '';

  const modal     = document.getElementById('viewProductModal');
  const nameEl    = document.getElementById('viewName');
  const priceEl   = document.getElementById('viewPrice');
  const stockEl   = document.getElementById('viewStock');
  const statusEl  = document.getElementById('viewStatus');
  const descEl    = document.getElementById('viewDescription');
  const primaryCatEl   = document.getElementById('viewPrimaryCategory');
  const secondaryCatEl = document.getElementById('viewSecondaryCategories');
  const modelViewer    = document.getElementById('viewModel');

  const tabButtons  = modal?.querySelectorAll('.modal-tab-btn');
  const tabContents = modal?.querySelectorAll('.modal-tab-content');
  const closeBtn    = modal?.querySelector('[data-close="view"]');

  const showModal = () => modal?.classList.remove('hidden');
  const hideModal = () => modal?.classList.add('hidden');

  closeBtn?.addEventListener('click', hideModal);

  // Abas
  tabButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      modal?.querySelector(`#tab-${tabName}`)?.classList.add('active');
    });
  });

  document.addEventListener('openViewProductModal', e => {
    const p = e.detail;

    nameEl.textContent  = p.name ?? '—';
    priceEl.textContent = Number(p.price || 0).toFixed(2);
    stockEl.textContent = typeof p.stock === 'boolean'
      ? (p.stock ? 'Disponível' : 'Sem stock')
      : (p.stock ?? 0);
    statusEl.textContent = p.is_active ? 'Ativo' : 'Inativo';

    // Descrição como HTML formatado
    if (descEl) {
      descEl.innerHTML = p.description || '<em>Sem descrição</em>';
    }

    // Categoria principal
    if (primaryCatEl) {
      const pc = p.primary_category;
      primaryCatEl.textContent = pc
        ? `${pc.icon || ''} ${pc.name}`
        : '—';
    }

    // Categorias secundárias
    if (secondaryCatEl) {
      const secs = p.secondary_categories || [];
      secondaryCatEl.innerHTML = secs.length
        ? secs.map(c => `<span class="sec-cat-badge">${c.name}</span>`).join(' ')
        : '<span style="color:#aaa">Nenhuma</span>';
    }

    // Modelo 3D
    if (modelViewer) {
      modelViewer.src = p.model_file ? `${API_BASE}/models/${p.model_file}` : '';
    }

    // Imagens
    const imagesGrid = document.getElementById('imagesGrid');
    if (imagesGrid) {
      imagesGrid.innerHTML = '';
      const images = p.images || [];
      if (!images.length) {
        imagesGrid.innerHTML = '<p class="no-images">Nenhuma imagem disponível</p>';
      } else {
        images.forEach((filename, index) => {
          const div = document.createElement('div');
          div.className = 'image-item';
          const img = document.createElement('img');
          img.src = filename;
          img.alt     = `Imagem ${index + 1}`;
          img.loading = 'lazy';
          img.onclick = () => openLightbox(img.src);
          div.appendChild(img);
          imagesGrid.appendChild(div);
        });
      }
    }

    tabButtons?.[0]?.click();
    showModal();
  });

  function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'image-lightbox';
    lb.innerHTML = `
      <div class="lightbox-content">
        <span class="lightbox-close">&times;</span>
        <img src="${src}">
      </div>`;
    document.body.appendChild(lb);
    lb.onclick = e => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) lb.remove();
    };
  }

})();