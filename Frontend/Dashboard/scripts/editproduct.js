// Frontend/Dashboard/scripts/editproduct.js — ATUALIZADO
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
  // Categorias secundárias
  const secondaryContainer = editModal?.querySelector('#editSecondaryCategories');
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
  const uploadNewImagesBtn = editModal?.querySelector('#uploadNewImagesBtn');
  const editReplaceImages  = editModal?.querySelector('#editReplaceImages');
  const replaceImagesInfo  = editModal?.querySelector('#replaceImagesInfo');
  const replaceAllImagesBtn = editModal?.querySelector('#replaceAllImagesBtn');

  const editCloseBtn = editModal?.querySelector('[data-close="edit"]');
  const deleteBtn    = editModal?.querySelector('#deleteProductBtn');
  const tabButtons   = editModal?.querySelectorAll('.modal-tab-btn');

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });
  const showModal   = () => editModal?.classList.remove('hidden');
  const hideModal   = () => editModal?.classList.add('hidden');

  // ===== ABAS =====
  tabButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      tabButtons.forEach(b => b.classList.remove('active'));
      editModal.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      editModal.querySelector(`#tab-${tabName}`)?.classList.add('active');
    });
  });

  // ===== POPULAR CATEGORIAS =====
  function populateEditCategories(product) {
    // Categoria primária
    if (primaryCatSelect) {
      primaryCatSelect.innerHTML = '<option value="">-- Categoria Principal --</option>';
      (window._primaryCategories || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon || ''} ${c.name}`;
        primaryCatSelect.appendChild(opt);
      });
      if (product?.primary_category?.id) {
        primaryCatSelect.value = product.primary_category.id;
      }
    }

    // Categorias secundárias (checkboxes)
    if (secondaryContainer) {
      const selectedIds = (product?.secondary_categories || []).map(c => c.id);
      secondaryContainer.innerHTML = (window._secondaryCategories || []).map(c => `
        <label class="sec-cat-checkbox">
          <input type="checkbox" value="${c.id}" class="sec-cat-input" ${selectedIds.includes(c.id) ? 'checked' : ''}>
          <span class="sec-cat-badge role-${c.category_role || 'secondary'}">${c.category_role === 'tag' ? '🏷️' : '📌'} ${c.name}</span>
        </label>
      `).join('');
    }
  }

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
    showModal();
  });

  // ===== FECHAR / ELIMINAR =====
  editCloseBtn?.addEventListener('click', hideModal);
  deleteBtn?.addEventListener('click', deleteProduct);

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
  editNewImages?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      if (newImagesInfo) newImagesInfo.textContent = `${e.target.files.length} imagem(ns) selecionada(s)`;
      if (uploadNewImagesBtn) uploadNewImagesBtn.disabled = false;
    }
  });

  uploadNewImagesBtn?.addEventListener('click', async () => {
    const files = editNewImages?.files;
    if (!files?.length) return;
    const fd = new FormData();
    for (let i = 0; i < Math.min(4, files.length); i++) fd.append('images', files[i]);
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
    } catch (err) {
      alert('Erro ao adicionar imagens');
    } finally {
      if (uploadNewImagesBtn) {
        uploadNewImagesBtn.textContent = '⬆️ Adicionar Imagens';
        uploadNewImagesBtn.disabled = true;
      }
    }
  });

  editReplaceImages?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      if (replaceImagesInfo) replaceImagesInfo.textContent = `${e.target.files.length} imagem(ns) selecionada(s)`;
      if (replaceAllImagesBtn) replaceAllImagesBtn.disabled = false;
    }
  });

  replaceAllImagesBtn?.addEventListener('click', async () => {
    const files = editReplaceImages?.files;
    if (!files?.length) return;
    if (!confirm('⚠️ Isto irá eliminar TODAS as imagens atuais. Continuar?')) return;
    const fd = new FormData();
    for (let i = 0; i < Math.min(4, files.length); i++) fd.append('images', files[i]);
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

    const secIds = Array.from(
      secondaryContainer?.querySelectorAll('.sec-cat-input:checked') || []
    ).map(cb => parseInt(cb.value));

    const descriptionHtml = editDescEditor?.innerHTML || '';

    const formData = new FormData();
    formData.append('name',                   editName.value);
    formData.append('price',                  editPrice.value);
    formData.append('description',            descriptionHtml);
    formData.append('stock',                  editStock.checked);
    formData.append('primary_category_id',    primaryCatId);
    formData.append('secondary_category_ids', JSON.stringify(secIds));

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
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Reagir se categorias carregarem depois
    document.addEventListener('categoriesLoaded', () => {
      if (currentProduct) populateEditCategories(currentProduct);
    });
  });

  console.log('✅ editproduct.js carregado');
})();