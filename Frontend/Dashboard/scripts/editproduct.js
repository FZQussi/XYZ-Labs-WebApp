// Frontend/Dashboard/scripts/editproduct.js — CORRIGIDO COM ESPERA
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  let currentProduct = null;

  const editModal    = document.getElementById('editProductModal');
  const editForm     = editModal?.querySelector('#editProductForm');
  const editId       = editModal?.querySelector('#editId');
  const editName     = editModal?.querySelector('#editName');
  const editPrice    = editModal?.querySelector('#editPrice');
  const editStock    = editModal?.querySelector('#editStock');
  const editProductName = editModal?.querySelector('#editProductName');

  // Categoria principal
  const primaryCatSelect = editModal?.querySelector('#editPrimaryCategory');
  // Editor rich text
  const editDescEditor = editModal?.querySelector('#editDescEditor');

  // Modelo 3D
  const editCurrentModel    = editModal?.querySelector('#editCurrentModel');
  const currentModelFilename = editModal?.querySelector('#currentModelFilename');
  const editModelFile       = editModal?.querySelector('#editModelFile');
  const newModelFilename    = editModal?.querySelector('#newModelFilename');
  const uploadNewModelBtn   = editModal?.querySelector('#uploadNewModelBtn');

  // Imagens
  const editImagesGrid     = editModal?.querySelector('#editImagesGrid');
  const imageCount         = editModal?.querySelector('#imageCount');
  const editNewImages      = editModal?.querySelector('#editNewImages');
  const newImagesInfo      = editModal?.querySelector('#newImagesInfo');
  const newImagesValidationContainer = editModal?.querySelector('#newImagesValidationContainer');
  const newImagesPreviewGrid = editModal?.querySelector('#newImagesPreviewGrid');
  const uploadNewImagesBtn = editModal?.querySelector('#uploadNewImagesBtn');
  const editReplaceImages  = editModal?.querySelector('#editReplaceImages');
  const replaceImagesInfo  = editModal?.querySelector('#replaceImagesInfo');
  const replaceImagesValidationContainer = editModal?.querySelector('#replaceImagesValidationContainer');
  const replaceImagesPreviewGrid = editModal?.querySelector('#replaceImagesPreviewGrid');
  const replaceAllImagesBtn = editModal?.querySelector('#replaceAllImagesBtn');

  const editCloseBtn = editModal?.querySelector('[data-close="edit"]');
  const deleteBtn    = editModal?.querySelector('#deleteProductBtn');
  const tabButtons   = editModal?.querySelectorAll('.modal-tab-btn');

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });
  const showModal   = () => editModal?.classList.remove('hidden');
  const hideModal   = () => editModal?.classList.add('hidden');

  // ===== ESPERAR PELO IMAGE VALIDATOR =====
  function waitForImageValidator() {
    return new Promise((resolve) => {
      if (window.ImageValidator) {
        console.log('✅ ImageValidator já está carregado');
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.ImageValidator) {
          console.log('✅ ImageValidator carregado');
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout de 5 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('⚠️ ImageValidator não carregou em tempo útil');
        resolve(); // Continua mesmo sem o validador
      }, 5000);
    });
  }

  // ===== ABAS =====
  tabButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      editModal.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      editModal.querySelector(`#tab-${tabName}`)?.classList.add('active');
      // Carregar filtros quando a aba for aberta
      if (tabName === 'edit-filters' && currentProduct) {
        loadProductFilterTags(currentProduct.id, currentProduct.primary_category?.id);
      }
    });
  });

  // ===== FILTER TAGS =====
  async function loadProductFilterTags(productId, primaryCategoryId) {
    const loading   = document.getElementById('editFiltersLoading');
    const container = document.getElementById('editFiltersContainer');
    if (!container) return;

    if (!primaryCategoryId) {
      if (loading) { loading.style.display = 'block'; loading.textContent = '⚠️ Este produto não tem categoria principal definida. Atribui uma categoria primeiro.'; }
      return;
    }

    if (loading) { loading.style.display = 'block'; loading.textContent = '⏳ A carregar filtros...'; }
    container.style.display = 'none';
    container.innerHTML = '';

    try {
      // Buscar filtros disponíveis para a categoria e tags já atribuídas ao produto
      const [filtersRes, productTagsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/categories/${primaryCategoryId}/filters`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch(`${API_BASE}/api/products/${productId}/filter-tags`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      const filters     = filtersRes.ok     ? await filtersRes.json()     : [];
      const productTags = productTagsRes.ok  ? await productTagsRes.json() : [];

      // IDs das tags já atribuídas ao produto
      const assignedTagIds = new Set(productTags.map(t => String(t.tag_id || t.filter_tag_id)));

      if (!filters.length) {
        container.innerHTML = `
          <div style="padding:24px;text-align:center;font-family:'Courier New',monospace;color:#888">
            Nenhum filtro criado para a categoria deste produto.<br>
            <small>Vai a <strong>Filtros</strong> para criar filtros para esta categoria.</small>
          </div>`;
        if (loading) loading.style.display = 'none';
        container.style.display = 'block';
        return;
      }

      // Renderizar um bloco por filtro com as suas tags como checkboxes
      container.innerHTML = filters.map(filter => {
        const tags = filter.tags || [];
        if (!tags.length) return `
          <div style="margin-bottom:16px;border:2px solid #e5e7eb;padding:12px 16px;">
            <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;margin-bottom:6px">
              ${encodeHTMLedit(filter.filter_name)}
              <span style="font-size:11px;background:#000;color:#fff;padding:1px 6px;margin-left:6px">${encodeHTMLedit(filter.filter_type)}</span>
            </div>
            <div style="font-size:12px;color:#aaa;font-family:'Courier New',monospace">Sem tags criadas para este filtro.</div>
          </div>`;

        return `
          <div style="margin-bottom:16px;border:2px solid #e5e7eb;padding:12px 16px;">
            <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
              ${encodeHTMLedit(filter.filter_name)}
              <span style="font-size:11px;background:#000;color:#fff;padding:1px 6px">${encodeHTMLedit(filter.filter_type)}</span>
              ${filter.description ? `<span style="font-size:11px;color:#888;font-weight:normal">${encodeHTMLedit(filter.description)}</span>` : ''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${tags.map(tag => `
                <label class="sec-cat-checkbox" style="cursor:pointer">
                  <input type="checkbox"
                    class="filter-tag-checkbox"
                    value="${tag.id}"
                    data-filter-id="${filter.id}"
                    ${assignedTagIds.has(String(tag.id)) ? 'checked' : ''}
                    style="display:none">
                  <span class="sec-cat-badge" style="${assignedTagIds.has(String(tag.id)) ? 'background:#000;color:#fff' : ''}">
                    🏷️ ${encodeHTMLedit(tag.tag_name)}
                    ${tag.product_count ? `<small style="opacity:0.6;margin-left:4px">(${tag.product_count})</small>` : ''}
                  </span>
                </label>
              `).join('')}
            </div>
          </div>`;
      }).join('');

      // Toggle visual dos checkboxes (mesma lógica que sec-cat-badge)
      container.querySelectorAll('.filter-tag-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const badge = cb.nextElementSibling;
          if (cb.checked) { badge.style.background = '#000'; badge.style.color = '#fff'; }
          else            { badge.style.background = '';    badge.style.color = '';     }
        });
      });

      if (loading) loading.style.display = 'none';
      container.style.display = 'block';
    } catch (err) {
      console.error('Erro ao carregar filter tags:', err);
      if (loading) { loading.style.display = 'block'; loading.textContent = '❌ Erro ao carregar filtros.'; }
    }
  }

  function encodeHTMLedit(str) {
    const d = document.createElement('div'); d.textContent = String(str); return d.innerHTML;
  }

  async function saveFilterTags(productId) {
    const container = document.getElementById('editFiltersContainer');
    const saveBtn   = document.getElementById('saveFilterTagsBtn');
    const saveMsg   = document.getElementById('saveFilterTagsMsg');
    if (!container || !saveBtn) return;

    const checkedIds = Array.from(
      container.querySelectorAll('.filter-tag-checkbox:checked')
    ).map(cb => parseInt(cb.value));

    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ A guardar...';
    if (saveMsg) saveMsg.textContent = '';

    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}/filter-tags`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter_tags: checkedIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);
      if (saveMsg) { saveMsg.textContent = '✅ Guardado!'; setTimeout(() => { if (saveMsg) saveMsg.textContent = ''; }, 3000); }
    } catch (err) {
      if (saveMsg) saveMsg.textContent = '❌ ' + err.message;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 GUARDAR FILTROS';
    }
  }

  // ===== POPULAR CATEGORIAS =====
  function populateEditCategories(product) {
    if (!primaryCatSelect) return;
    primaryCatSelect.innerHTML = '<option value="">-- Categoria Principal --</option>';
    (window._primaryCategories || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.icon || '📂'} ${c.name}`;
      primaryCatSelect.appendChild(opt);
    });
    if (product?.primary_category?.id) {
      primaryCatSelect.value = product.primary_category.id;
    }
  }

  // Ao mudar categoria principal, recarregar filtros automaticamente
  primaryCatSelect?.addEventListener('change', (e) => {
    const newCatId = e.target.value;
    if (currentProduct && newCatId) {
      loadProductFilterTags(currentProduct.id, newCatId);
    }
  });

  // ===== IMAGENS =====
  async function loadProductImages(productId) {
    try {
      const res     = await fetch(`${API_BASE}/products/${productId}`, { headers: authHeaders() });
      const product = await res.json();
      const images  = product.images || [];

      if (imageCount) imageCount.textContent = images.length;
      if (!editImagesGrid) return;
      editImagesGrid.innerHTML = '';

      if (!images.length) {
        editImagesGrid.innerHTML = '<p class="no-images-edit">Nenhuma imagem</p>';
        return;
      }

      images.forEach(filename => {
        const item = document.createElement('div');
        item.className = 'image-edit-item';

        const img = document.createElement('img');
        img.src = filename;
        img.alt = filename;

        const delBtn = document.createElement('button');
        delBtn.className = 'image-delete-btn';
        delBtn.innerHTML = '×';
        delBtn.onclick = () => deleteImage(productId, filename);

        item.appendChild(img);
        item.appendChild(delBtn);
        editImagesGrid.appendChild(item);
      });
    } catch (err) {
      console.error('Erro ao carregar imagens:', err);
    }
  }

  async function deleteImage(productId, filename) {
    if (!confirm('Eliminar esta imagem?')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/images`, {
        method: 'DELETE',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (!res.ok) throw new Error('Erro ao eliminar imagem');
      await loadProductImages(productId);
    } catch (err) {
      alert('Erro ao eliminar imagem');
    }
  }

  // ===== ELIMINAR PRODUTO =====
  async function deleteProduct() {
    if (!currentProduct) return alert('Nenhum produto selecionado');
    if (!confirm(`Eliminar o produto "${currentProduct.name}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/products/${currentProduct.id}`, {
        method: 'DELETE', headers: authHeaders()
      });
      if (!res.ok) throw new Error('Erro ao eliminar produto');
      hideModal();
      window.reloadProducts?.();
    } catch (err) {
      alert(err.message || 'Erro ao eliminar produto');
    }
  }

  // ===== ABRIR MODAL =====
  document.addEventListener('openEditProductModal', async (e) => {
    currentProduct = e.detail;
    if (!currentProduct) return;

    editId.value            = currentProduct.id;
    editProductName.textContent = currentProduct.name;
    editName.value          = currentProduct.name;
    editPrice.value         = currentProduct.price ?? 0;
    editStock.checked       = !!currentProduct.stock;

    // Descrição HTML no editor
    if (editDescEditor) {
      editDescEditor.innerHTML = currentProduct.description || '';
    }

    // Categorias
    populateEditCategories(currentProduct);

    // Modelo 3D
    if (currentProduct.model_file) {
      if (editCurrentModel) editCurrentModel.src = `${API_BASE}/models/${currentProduct.model_file}`;
      if (currentModelFilename) currentModelFilename.textContent = `📦 ${currentProduct.model_file}`;
    } else {
      if (editCurrentModel) editCurrentModel.src = '';
      if (currentModelFilename) currentModelFilename.textContent = 'Sem modelo 3D';
    }

    if (editModelFile)    editModelFile.value    = '';
    if (newModelFilename) newModelFilename.textContent = '';
    if (uploadNewModelBtn) uploadNewModelBtn.disabled = true;

    if (editNewImages)      editNewImages.value      = '';
    if (newImagesInfo)      newImagesInfo.textContent = '';
    if (uploadNewImagesBtn) uploadNewImagesBtn.disabled = true;
    if (editReplaceImages)  editReplaceImages.value  = '';
    if (replaceImagesInfo)  replaceImagesInfo.textContent = '';
    if (replaceAllImagesBtn) replaceAllImagesBtn.disabled = true;

    await loadProductImages(currentProduct.id);
    tabButtons?.[0]?.click();

    // Reset aba de filtros
    const filtersLoading = document.getElementById('editFiltersLoading');
    const filtersContainer = document.getElementById('editFiltersContainer');
    if (filtersLoading) { filtersLoading.style.display = 'block'; filtersLoading.textContent = '⏳ A carregar filtros...'; }
    if (filtersContainer) { filtersContainer.style.display = 'none'; filtersContainer.innerHTML = ''; }

    showModal();
  });

  // ===== FECHAR / ELIMINAR =====
  editCloseBtn?.addEventListener('click', hideModal);
  deleteBtn?.addEventListener('click', deleteProduct);

  // ===== GUARDAR FILTER TAGS =====
  document.getElementById('saveFilterTagsBtn')?.addEventListener('click', () => {
    if (currentProduct) saveFilterTags(currentProduct.id);
  });

  // ===== MODELO 3D UPLOAD =====
  editModelFile?.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      if (newModelFilename) newModelFilename.textContent = e.target.files[0].name;
      if (uploadNewModelBtn) uploadNewModelBtn.disabled = false;
    }
  });

  uploadNewModelBtn?.addEventListener('click', async () => {
    const file = editModelFile?.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('modelFile', file);
    try {
      uploadNewModelBtn.disabled = true;
      uploadNewModelBtn.textContent = '⏳ A enviar...';
      const res = await fetch(`${API_BASE}/products/${currentProduct.id}`, {
        method: 'PUT', headers: authHeaders(), body: fd
      });
      if (!res.ok) throw new Error('Erro ao enviar modelo');
      const updated = await res.json();
      if (editCurrentModel) editCurrentModel.src = `${API_BASE}/models/${updated.model_file}`;
      if (currentModelFilename) currentModelFilename.textContent = `📦 ${updated.model_file}`;
      if (editModelFile) editModelFile.value = '';
      if (newModelFilename) newModelFilename.textContent = '';
    } catch (err) {
      alert('Erro ao enviar modelo');
    } finally {
      if (uploadNewModelBtn) {
        uploadNewModelBtn.textContent = '⬆️ Enviar Novo Modelo';
        uploadNewModelBtn.disabled = true;
      }
    }
  });

  // ===== IMAGENS UPLOAD =====
  editNewImages?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    if (newImagesInfo) newImagesInfo.textContent = files.length > 0 ? `${files.length} imagem(ns) selecionada(s)` : '';
    
    // Esperar pelo ImageValidator se necessário
    if (!window.ImageValidator && files.length > 0) {
      await waitForImageValidator();
    }

    // Se temos o validador, usa-o
    if (files.length > 0 && window.ImageValidator) {
      const validation = window.ImageValidator.validateFiles(files);
      
      if (newImagesValidationContainer) {
        window.ImageValidator.showNotifications('newImagesValidationContainer', validation);
      }

      // Mostrar previews
      if (newImagesPreviewGrid) {
        newImagesPreviewGrid.innerHTML = '';
        
        for (const file of files) {
          const previewData = await window.ImageValidator.createPreviewWithValidation(file);
          
          if (previewData.preview) {
            const item = document.createElement('div');
            item.className = `image-preview-item ${previewData.validation.valid ? 'success' : 'error'}`;
            
            const img = document.createElement('img');
            img.src = previewData.preview;
            img.alt = file.name;
            
            const badge = document.createElement('div');
            badge.className = 'size-badge';
            badge.textContent = previewData.validation.formatted;
            badge.title = file.name;
            
            item.appendChild(img);
            item.appendChild(badge);
            newImagesPreviewGrid.appendChild(item);
          }
        }
      }
      
      if (uploadNewImagesBtn) uploadNewImagesBtn.disabled = false;
    } else {
      if (newImagesValidationContainer) newImagesValidationContainer.innerHTML = '';
      if (newImagesPreviewGrid) newImagesPreviewGrid.innerHTML = '';
      if (uploadNewImagesBtn) uploadNewImagesBtn.disabled = true;
    }
  });

  uploadNewImagesBtn?.addEventListener('click', async () => {
    const files = editNewImages?.files;
    if (!files?.length) return;
    
    // Esperar pelo ImageValidator se necessário
    if (!window.ImageValidator) {
      await waitForImageValidator();
    }

    let validFiles = Array.from(files);
    
    // Se temos o validador, filtra os ficheiros válidos
    if (window.ImageValidator) {
      const validation = window.ImageValidator.validateFiles(validFiles);
      if (!validation.valid) {
        alert(`⚠️ Algumas imagens não são válidas:\n${validation.results.map(r => !r.valid ? `❌ ${r.file.name}` : `✅ ${r.file.name}`).join('\n')}`);
      }
      validFiles = validation.validFiles || [];
    }

    if (validFiles.length === 0) {
      alert('❌ Nenhuma imagem válida para enviar');
      return;
    }

    const fd = new FormData();
    for (let i = 0; i < Math.min(4, validFiles.length); i++) fd.append('images', validFiles[i]);
    try {
      uploadNewImagesBtn.disabled = true;
      uploadNewImagesBtn.textContent = '⏳ A enviar...';
      const res = await fetch(`${API_BASE}/products/${currentProduct.id}/images`, {
        method: 'POST', headers: authHeaders(), body: fd
      });
      if (!res.ok) throw new Error('Erro ao adicionar imagens');
      await loadProductImages(currentProduct.id);
      if (editNewImages) editNewImages.value = '';
      if (newImagesInfo) newImagesInfo.textContent = '';
      if (newImagesValidationContainer) newImagesValidationContainer.innerHTML = '';
      if (newImagesPreviewGrid) newImagesPreviewGrid.innerHTML = '';
    } catch (err) {
      alert('Erro ao adicionar imagens');
    } finally {
      if (uploadNewImagesBtn) {
        uploadNewImagesBtn.textContent = '⬆️ Adicionar Imagens';
        uploadNewImagesBtn.disabled = true;
      }
    }
  });

  editReplaceImages?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    if (replaceImagesInfo) replaceImagesInfo.textContent = files.length > 0 ? `${files.length} imagem(ns) selecionada(s)` : '';
    
    // Esperar pelo ImageValidator se necessário
    if (!window.ImageValidator && files.length > 0) {
      await waitForImageValidator();
    }

    // Se temos o validador, usa-o
    if (files.length > 0 && window.ImageValidator) {
      const validation = window.ImageValidator.validateFiles(files);
      
      if (replaceImagesValidationContainer) {
        window.ImageValidator.showNotifications('replaceImagesValidationContainer', validation);
      }

      // Mostrar previews
      if (replaceImagesPreviewGrid) {
        replaceImagesPreviewGrid.innerHTML = '';
        
        for (const file of files) {
          const previewData = await window.ImageValidator.createPreviewWithValidation(file);
          
          if (previewData.preview) {
            const item = document.createElement('div');
            item.className = `image-preview-item ${previewData.validation.valid ? 'success' : 'error'}`;
            
            const img = document.createElement('img');
            img.src = previewData.preview;
            img.alt = file.name;
            
            const badge = document.createElement('div');
            badge.className = 'size-badge';
            badge.textContent = previewData.validation.formatted;
            badge.title = file.name;
            
            item.appendChild(img);
            item.appendChild(badge);
            replaceImagesPreviewGrid.appendChild(item);
          }
        }
      }
      
      if (replaceAllImagesBtn) replaceAllImagesBtn.disabled = false;
    } else {
      if (replaceImagesValidationContainer) replaceImagesValidationContainer.innerHTML = '';
      if (replaceImagesPreviewGrid) replaceImagesPreviewGrid.innerHTML = '';
      if (replaceAllImagesBtn) replaceAllImagesBtn.disabled = true;
    }
  });

  replaceAllImagesBtn?.addEventListener('click', async () => {
    const files = editReplaceImages?.files;
    if (!files?.length) return;
    if (!confirm('⚠️ Isto irá eliminar TODAS as imagens atuais. Continuar?')) return;
    
    // Esperar pelo ImageValidator se necessário
    if (!window.ImageValidator) {
      await waitForImageValidator();
    }

    let validFiles = Array.from(files);
    
    // Se temos o validador, filtra os ficheiros válidos
    if (window.ImageValidator) {
      const validation = window.ImageValidator.validateFiles(validFiles);
      if (!validation.valid) {
        alert(`⚠️ Algumas imagens não são válidas:\n${validation.results.map(r => !r.valid ? `❌ ${r.file.name}` : `✅ ${r.file.name}`).join('\n')}`);
      }
      validFiles = validation.validFiles || [];
    }

    if (validFiles.length === 0) {
      alert('❌ Nenhuma imagem válida para enviar');
      return;
    }

    const fd = new FormData();
    for (let i = 0; i < Math.min(4, validFiles.length); i++) fd.append('images', validFiles[i]);
    try {
      replaceAllImagesBtn.disabled = true;
      replaceAllImagesBtn.textContent = '⏳ A substituir...';
      const res = await fetch(`${API_BASE}/products/${currentProduct.id}/images/replace`, {
        method: 'POST', headers: authHeaders(), body: fd
      });
      if (!res.ok) throw new Error('Erro ao substituir imagens');
      await loadProductImages(currentProduct.id);
      if (editReplaceImages) editReplaceImages.value = '';
      if (replaceImagesInfo) replaceImagesInfo.textContent = '';
      if (replaceImagesValidationContainer) replaceImagesValidationContainer.innerHTML = '';
      if (replaceImagesPreviewGrid) replaceImagesPreviewGrid.innerHTML = '';
    } catch (err) {
      alert('Erro ao substituir imagens');
    } finally {
      if (replaceAllImagesBtn) {
        replaceAllImagesBtn.textContent = '🔄 Substituir Todas';
        replaceAllImagesBtn.disabled = true;
      }
    }
  });

  // ===== SUBMIT FORM =====
  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const primaryCatId = primaryCatSelect?.value;
    if (!primaryCatId) return alert('Seleciona uma categoria principal');

    const descriptionHtml = editDescEditor?.innerHTML || '';

    const submitBtn = editForm.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ A guardar...'; }

    const formData = new FormData();
    formData.append('name',                editName.value);
    formData.append('price',               editPrice.value);
    formData.append('description',         descriptionHtml);
    formData.append('stock',               editStock.checked);
    formData.append('primary_category_id', primaryCatId);

    try {
      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'PUT', headers: authHeaders(), body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao guardar alterações');
      }
      hideModal();
      window.reloadProducts?.();
    } catch (err) {
      alert(err.message || 'Erro ao guardar alterações');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '💾 GUARDAR ALTERAÇÕES'; }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('categoriesLoaded', () => {
      if (currentProduct) populateEditCategories(currentProduct);
    });
  });

  // Esperar pelo ImageValidator ao carregar
  waitForImageValidator().then(() => {
    console.log('✅ editproduct.js carregado com ImageValidator');
  });

  console.log('✅ editproduct.js carregado');
})();