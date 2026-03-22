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

  function encodeHTML(str) {
    const d = document.createElement('div'); d.textContent = String(str); return d.innerHTML;
  }

  // ===== RENDERIZAR FILTER TAGS =====
  function renderFilterTags(filterTags) {
    const container = document.getElementById('viewFilterTags');
    if (!container) return;

    const tags = filterTags || [];

    if (!tags.length) {
      container.innerHTML = `
        <div style="padding:32px;text-align:center;font-family:'Courier New',monospace;color:#888">
          Nenhum filtro atribuído a este produto.
        </div>`;
      return;
    }

    // Agrupar tags por filtro
    const grouped = {};
    tags.forEach(t => {
      const key = String(t.filter_id);
      if (!grouped[key]) {
        grouped[key] = { filter_name: t.filter_name, filter_key: t.filter_key, tags: [] };
      }
      grouped[key].tags.push(t);
    });

    container.innerHTML = Object.values(grouped).map(group => `
      <div style="margin-bottom:16px;border:2px solid #e5e7eb;padding:12px 16px;">
        <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;margin-bottom:10px;color:#333">
          ${encodeHTML(group.filter_name)}
          <span style="font-size:11px;background:#f0f0f0;border:1px solid #ccc;padding:1px 6px;margin-left:6px;font-weight:normal">${encodeHTML(group.filter_key)}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${group.tags.map(t => `
            <span style="padding:5px 12px;border:2px solid #000;background:#000;color:#fff;font-family:'Courier New',monospace;font-size:12px;font-weight:bold">
              🏷️ ${encodeHTML(t.tag_name)}
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

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

    // Filter tags
    renderFilterTags(p.filter_tags || []);

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