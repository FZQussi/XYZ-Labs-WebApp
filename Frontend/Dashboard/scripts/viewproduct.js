// Frontend/Dashboard/scripts/viewproduct.js — ATUALIZADO
(() => {
  const API_BASE = '';

  const modal     = document.getElementById('viewProductModal');
  const nameEl    = document.getElementById('viewName');
  const priceEl   = document.getElementById('viewPrice');
  const stockEl   = document.getElementById('viewStock');
  const statusEl  = document.getElementById('viewStatus');
  const descEl    = document.getElementById('viewDescription');
  const primaryCatEl = document.getElementById('viewPrimaryCategory');
  const modelViewer  = document.getElementById('viewModel');

  const tabButtons  = modal?.querySelectorAll('.modal-tab-btn');
  const tabContents = modal?.querySelectorAll('.modal-tab-content');
  const closeBtn    = modal?.querySelector('[data-close="view"]');

  const showModal = () => modal?.classList.remove('hidden');
  const hideModal = () => modal?.classList.add('hidden');

  closeBtn?.addEventListener('click', hideModal);

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
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  // ===== RENDERIZAR FILTER TAGS =====
  function renderFilterTags(filterTags) {
    const container = document.getElementById('viewFilterTags');
    if (!container) return;

    const tags = filterTags || [];

    if (!tags.length) {
      container.innerHTML = `
        <div style="padding:32px;text-align:center;font-family:'Courier New',monospace;color:#888">
          Nenhum filtro atribuído a este produto.<br>
          <small>Podes adicionar filtros na aba <strong>🏷️ Filtros</strong> do modal de edição.</small>
        </div>`;
      return;
    }

    // Agrupar por filtro
    const grouped = {};
    tags.forEach(t => {
      const key = String(t.filter_id);
      if (!grouped[key]) {
        grouped[key] = {
          filter_name: t.filter_name,
          filter_key:  t.filter_key,
          filter_type: t.filter_type,
          tags: []
        };
      }
      grouped[key].tags.push(t);
    });

    container.innerHTML = Object.values(grouped).map(group => `
      <div style="margin-bottom:16px;border:2px solid #e5e7eb;padding:14px 16px;">
        <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="color:#333">${encodeHTML(group.filter_name)}</span>
          <span style="font-size:10px;background:#f0f0f0;border:1px solid #ccc;padding:1px 6px;font-weight:normal;color:#666">${encodeHTML(group.filter_key)}</span>
          <span style="font-size:10px;background:#000;color:#fff;padding:1px 6px;font-weight:normal">${encodeHTML(group.filter_type)}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${group.tags.map(t => `
            <span style="padding:5px 12px;border:2px solid #2563eb;background:#eff6ff;color:#1d4ed8;font-family:'Courier New',monospace;font-size:12px;font-weight:bold">
              🏷️ ${encodeHTML(t.tag_name)}
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  document.addEventListener('openViewProductModal', e => {
    const p = e.detail;

    nameEl.textContent   = p.name ?? '—';
    priceEl.textContent  = Number(p.price || 0).toFixed(2);
    stockEl.textContent  = p.stock ? 'Disponível' : 'Sem stock';
    statusEl.textContent = p.is_active ? 'Ativo' : 'Inativo';

    if (descEl) {
      descEl.innerHTML = p.description || '<em>Sem descrição</em>';
    }

    // Categoria principal
    if (primaryCatEl) {
      const pc = p.primary_category;
      primaryCatEl.textContent = pc
        ? `${pc.icon || '📂'} ${pc.name}`
        : '—';
    }

    // Filter tags na aba própria
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
          img.src     = filename;
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