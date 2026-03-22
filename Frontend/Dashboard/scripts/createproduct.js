// Frontend/Dashboard/scripts/createproduct.js
(() => {
  const API_BASE = '';
  const token    = localStorage.getItem('token');

  const createModal     = document.getElementById('createProductModal');
  const createForm      = document.getElementById('createProductForm');
  const createName      = document.getElementById('createName');
  const createPrice     = document.getElementById('createPrice');
  const createStock     = document.getElementById('createStock');
  const createModelFile = document.getElementById('createModelFile');
  const createImages    = document.getElementById('createImages');
  const addProductBtn   = document.getElementById('addProductBtn');
  const createCloseBtn  = createModal?.querySelector('[data-close="create"]');

  const primaryCatSelect         = document.getElementById('createPrimaryCategory');
  const filtersSection           = document.getElementById('createFiltersSection');
  const filtersContainer         = document.getElementById('createFiltersContainer');
  const createDescEditor         = document.getElementById('createDescEditor');
  const imageValidationContainer = document.getElementById('createImageValidationContainer');
  const imagePreviewGrid         = document.getElementById('createImagePreviewGrid');

  function authHeaders()     { return { Authorization: `Bearer ${token}` }; }
  function authJsonHeaders() { return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }; }

  function encodeHTML(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  // ============================================================
  // POPULAR SELECT DE CATEGORIAS PRINCIPAIS
  // ============================================================
  function populatePrimaryCategories() {
    if (!primaryCatSelect) return;
    primaryCatSelect.innerHTML = '<option value="">-- Seleciona categoria principal --</option>';
    (window._primaryCategories || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.icon || '📂'} ${c.name}`;
      primaryCatSelect.appendChild(opt);
    });
  }

  document.addEventListener('categoriesLoaded', populatePrimaryCategories);

  // ============================================================
  // CARREGAR FILTROS DA CATEGORIA SELECIONADA
  // ============================================================
  async function loadFiltersForCategory(categoryId) {
    if (!filtersSection || !filtersContainer) return;

    if (!categoryId) {
      filtersSection.style.display = 'none';
      filtersContainer.innerHTML  = '';
      return;
    }

    filtersSection.style.display = 'block';
    filtersContainer.innerHTML   = '<div class="loading-state" style="padding:12px">⏳ A carregar filtros...</div>';

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/categories/${categoryId}/filters`,
        { headers: authJsonHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const filters = await res.json();

      if (!filters.length) {
        filtersContainer.innerHTML = `
          <div style="padding:12px;font-family:'Courier New',monospace;font-size:12px;color:#888">
            Nenhum filtro criado para esta categoria.
            <a href="#" onclick="document.querySelector('[data-tab=filters]').click();return false"
               style="color:#2563eb;margin-left:4px">Criar filtros →</a>
          </div>`;
        return;
      }

      filtersContainer.innerHTML = filters.map(filter => {
        const tags = Array.isArray(filter.tags)
          ? filter.tags.filter(t => t && t.is_active !== false)
          : [];

        if (!tags.length) {
          return `
            <div style="margin-bottom:12px;padding:10px 14px;border:2px solid #e5e7eb;background:#fafafa">
              <div style="font-family:'Courier New',monospace;font-size:12px;font-weight:bold;color:#999">
                ${encodeHTML(filter.filter_name)}
                <span style="font-size:10px;background:#e5e7eb;padding:1px 5px;margin-left:6px;font-weight:normal">${encodeHTML(filter.filter_type)}</span>
              </div>
              <div style="font-size:11px;color:#bbb;margin-top:4px;font-family:'Courier New',monospace">Sem tags disponíveis</div>
            </div>`;
        }

        return `
          <div style="margin-bottom:12px;padding:10px 14px;border:2px solid #e5e7eb;">
            <div style="font-family:'Courier New',monospace;font-size:12px;font-weight:bold;margin-bottom:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              ${encodeHTML(filter.filter_name)}
              <span style="font-size:10px;background:#000;color:#fff;padding:1px 5px;font-weight:normal">${encodeHTML(filter.filter_type)}</span>
              ${filter.description ? `<span style="font-size:11px;color:#888;font-weight:normal">${encodeHTML(filter.description)}</span>` : ''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${tags.map(tag => `
                <label class="sec-cat-checkbox" style="cursor:pointer">
                  <input type="checkbox"
                    class="create-filter-tag-checkbox"
                    value="${tag.id}"
                    data-filter-id="${filter.id}"
                    style="display:none">
                  <span class="sec-cat-badge" style="font-size:12px">
                    🏷️ ${encodeHTML(tag.tag_name)}
                  </span>
                </label>
              `).join('')}
            </div>
          </div>`;
      }).join('');

      // Toggle visual igual ao das sec-cat-badge
      filtersContainer.querySelectorAll('.create-filter-tag-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const badge = cb.nextElementSibling;
          if (cb.checked) { badge.style.background = '#000'; badge.style.color = '#fff'; }
          else            { badge.style.background = '';     badge.style.color = '';     }
        });
      });

    } catch (err) {
      console.error('Erro ao carregar filtros:', err);
      filtersContainer.innerHTML = `
        <div style="padding:12px;font-family:'Courier New',monospace;font-size:12px;color:#e53e3e">
          ❌ Erro ao carregar filtros.
        </div>`;
    }
  }

  // Ao mudar categoria, carregar filtros
  primaryCatSelect?.addEventListener('change', e => {
    loadFiltersForCategory(e.target.value || null);
  });

  // ============================================================
  // IMAGE VALIDATOR
  // ============================================================
  function waitForImageValidator() {
    return new Promise(resolve => {
      if (window.ImageValidator) { resolve(); return; }
      const t = setInterval(() => {
        if (window.ImageValidator) { clearInterval(t); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(t); resolve(); }, 5000);
    });
  }

  createImages?.addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      if (imageValidationContainer) imageValidationContainer.innerHTML = '';
      if (imagePreviewGrid) imagePreviewGrid.innerHTML = '';
      return;
    }
    if (!window.ImageValidator) await waitForImageValidator();
    if (!window.ImageValidator) return;

    const validation = window.ImageValidator.validateFiles(files);
    if (imageValidationContainer) {
      window.ImageValidator.showNotifications('createImageValidationContainer', validation);
    }
    if (imagePreviewGrid) {
      imagePreviewGrid.innerHTML = '';
      for (const file of files) {
        const pd = await window.ImageValidator.createPreviewWithValidation(file);
        if (pd.preview) {
          const item  = document.createElement('div');
          item.className = `image-preview-item ${pd.validation.valid ? 'success' : 'error'}`;
          const img   = document.createElement('img');
          img.src = pd.preview; img.alt = file.name;
          const badge = document.createElement('div');
          badge.className = 'size-badge';
          badge.textContent = pd.validation.formatted;
          badge.title = file.name;
          item.appendChild(img); item.appendChild(badge);
          imagePreviewGrid.appendChild(item);
        }
      }
    }
  });

  // ============================================================
  // ABRIR MODAL
  // ============================================================
  addProductBtn?.addEventListener('click', () => {
    createForm?.reset();
    if (createDescEditor)         createDescEditor.innerHTML = '';
    if (imageValidationContainer) imageValidationContainer.innerHTML = '';
    if (imagePreviewGrid)         imagePreviewGrid.innerHTML = '';
    if (filtersSection)           filtersSection.style.display = 'none';
    if (filtersContainer)         filtersContainer.innerHTML = '';
    populatePrimaryCategories();
    createModal?.classList.remove('hidden');
  });

  createCloseBtn?.addEventListener('click', () => createModal?.classList.add('hidden'));

  // ============================================================
  // SUBMIT
  // ============================================================
  createForm?.addEventListener('submit', async e => {
    e.preventDefault();

    const primaryCatId = primaryCatSelect?.value;
    if (!primaryCatId) {
      alert('⚠️ Seleciona uma categoria principal');
      return;
    }

    // Recolher filter tag IDs selecionados
    const filterTagIds = Array.from(
      filtersContainer?.querySelectorAll('.create-filter-tag-checkbox:checked') || []
    ).map(cb => parseInt(cb.value));

    const descriptionHtml = createDescEditor?.innerHTML || '';

    const submitBtn = createForm.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ A criar...'; }

    try {
      const formData = new FormData();
      formData.append('name',                createName.value);
      formData.append('price',               createPrice.value);
      formData.append('description',         descriptionHtml);
      formData.append('stock',               createStock.checked);
      formData.append('primary_category_id', primaryCatId);

      if (filterTagIds.length > 0) {
        formData.append('filter_tag_ids', JSON.stringify(filterTagIds));
      }
      if (createModelFile?.files[0]) {
        formData.append('modelFile', createModelFile.files[0]);
      }

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST', headers: authHeaders(), body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar produto');
      }

      const newProduct = await res.json();

      // Upload de imagens
      if (createImages?.files.length) {
        const files = Array.from(createImages.files);
        if (!window.ImageValidator) await waitForImageValidator();

        let validFiles = files;
        if (window.ImageValidator) {
          validFiles = window.ImageValidator.validateFiles(files).validFiles || [];
        }

        if (validFiles.length > 0) {
          const imgData = new FormData();
          for (let i = 0; i < Math.min(4, validFiles.length); i++) {
            imgData.append('images', validFiles[i]);
          }
          try {
            const imgRes = await fetch(`${API_BASE}/products/${newProduct.id}/images`, {
              method: 'POST', headers: authHeaders(), body: imgData
            });
            if (!imgRes.ok) {
              const imgErr = await imgRes.json();
              console.warn('Aviso imagens:', imgErr.error);
            }
          } catch (imgErr) {
            console.warn('Erro no upload de imagens:', imgErr.message);
          }
        }
      }

      createModal?.classList.add('hidden');
      window.reloadProducts?.();

    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao criar produto');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '➕ CRIAR PRODUTO'; }
    }
  });

  document.addEventListener('DOMContentLoaded', populatePrimaryCategories);
  waitForImageValidator().then(() => console.log('✅ createproduct.js carregado'));

})();