// Frontend/Dashboard/scripts/editproduct.js - COMPLETO
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  let categories = [];
  let currentProduct = null;

  // ===== ELEMENTOS MODAL DE EDIÇÃO =====
  const editModal = document.getElementById('editProductModal');
  const editForm = editModal.querySelector('#editProductForm');
  const editId = editModal.querySelector('#editId');
  const editName = editModal.querySelector('#editName');
  const editPrice = editModal.querySelector('#editPrice');
  const editDesc = editModal.querySelector('#editDescription');
  const editStock = editModal.querySelector('#editStock');
  const editProductName = editModal.querySelector('#editProductName');

  // Categorias (dentro do modal)
  const categoriesContainer = editModal.querySelector('#categoriesCheckboxes');
  const primaryCategorySelect = editModal.querySelector('#primaryCategory');

  // Modelo 3D
  const editCurrentModel = editModal.querySelector('#editCurrentModel');
  const currentModelFilename = editModal.querySelector('#currentModelFilename');
  const editModelFile = editModal.querySelector('#editModelFile');
  const newModelFilename = editModal.querySelector('#newModelFilename');
  const uploadNewModelBtn = editModal.querySelector('#uploadNewModelBtn');

  // Imagens
  const editImagesGrid = editModal.querySelector('#editImagesGrid');
  const imageCount = editModal.querySelector('#imageCount');
  const editNewImages = editModal.querySelector('#editNewImages');
  const newImagesInfo = editModal.querySelector('#newImagesInfo');
  const uploadNewImagesBtn = editModal.querySelector('#uploadNewImagesBtn');
  const editReplaceImages = editModal.querySelector('#editReplaceImages');
  const replaceImagesInfo = editModal.querySelector('#replaceImagesInfo');
  const replaceAllImagesBtn = editModal.querySelector('#replaceAllImagesBtn');

  // Botões
  const editCloseBtn = editModal.querySelector('[data-close="edit"]');
  const deleteBtn = editModal.querySelector('#deleteProductBtn');

  // Abas
  const tabButtons = editModal.querySelectorAll('.modal-tab-btn');

  // ===== AUTENTICAÇÃO =====
  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ===== MODAL =====
  const showModal = () => editModal.classList.remove('hidden');
  const hideModal = () => editModal.classList.add('hidden');

  // ===== SISTEMA DE ABAS =====
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      editModal.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = editModal.querySelector(`#tab-${tabName}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // ===== CARREGAR CATEGORIAS =====
  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`, { headers: authHeaders() });
      categories = await res.json();
      console.log('✅ Categorias carregadas:', categories);
    } catch (err) {
      console.error('❌ Erro ao carregar categorias:', err);
    }
  }

  // ===== RENDERIZAR CHECKBOXES DE CATEGORIAS =====
  function renderEditCategoryCheckboxes(selectedCategoryIds = [], primaryCategoryId = null) {
    categoriesContainer.innerHTML = '';
    primaryCategorySelect.innerHTML = '<option value="">-- Categoria Principal --</option>';

    categories.forEach(cat => {
      const isChecked = selectedCategoryIds.includes(cat.id);

      const div = document.createElement('div');
      div.className = 'category-checkbox-item';
      div.innerHTML = `
        <label>
          <input 
            type="checkbox" 
            value="${cat.id}" 
            class="edit-category-checkbox"
            data-category-name="${cat.name}"
            ${isChecked ? 'checked' : ''}
          >
          <span class="category-label">${cat.name}</span>
        </label>
      `;
      categoriesContainer.appendChild(div);

      // Popular select de categoria principal
      if (isChecked) {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        primaryCategorySelect.appendChild(option);
      }
    });

    // Restaurar categoria primária
    if (primaryCategoryId) primaryCategorySelect.value = primaryCategoryId;

    // Event listeners dentro do modal
    categoriesContainer.querySelectorAll('.edit-category-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', updatePrimaryCategoryOptions);
    });

    // Ajusta desabilitado se não houver categorias selecionadas
    primaryCategorySelect.disabled = categoriesContainer.querySelectorAll('.edit-category-checkbox:checked').length === 0;
  }

  function updatePrimaryCategoryOptions() {
    const selectedCheckboxes = categoriesContainer.querySelectorAll('.edit-category-checkbox:checked');
    const currentValue = primaryCategorySelect.value;

    primaryCategorySelect.innerHTML = '<option value="">-- Categoria Principal --</option>';

    if (selectedCheckboxes.length === 0) {
      primaryCategorySelect.disabled = true;
      return;
    }

    primaryCategorySelect.disabled = false;
    selectedCheckboxes.forEach(cb => {
      const option = document.createElement('option');
      option.value = cb.value;
      option.textContent = cb.dataset.categoryName;
      primaryCategorySelect.appendChild(option);
    });

    if (currentValue && Array.from(selectedCheckboxes).some(cb => cb.value === currentValue)) {
      primaryCategorySelect.value = currentValue;
    } else if (selectedCheckboxes.length === 1) {
      primaryCategorySelect.value = selectedCheckboxes[0].value;
    }
  }

  // ===== CARREGAR IMAGENS DO PRODUTO =====
  async function loadProductImages(productId) {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, { headers: authHeaders() });
      const product = await res.json();
      const images = product.images || [];

      imageCount.textContent = images.length;
      editImagesGrid.innerHTML = '';

      if (!images.length) {
        editImagesGrid.innerHTML = '<p class="no-images-edit">Nenhuma imagem</p>';
        return;
      }

      images.forEach(filename => {
        const item = document.createElement('div');
        item.className = 'image-edit-item';

        const img = document.createElement('img');
        img.src = `${API_BASE}/images/${filename}`;
        img.alt = filename;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'image-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Eliminar imagem';
        deleteBtn.onclick = () => deleteImage(productId, filename);

        item.appendChild(img);
        item.appendChild(deleteBtn);
        editImagesGrid.appendChild(item);
      });
    } catch (err) {
      console.error('❌ Erro ao carregar imagens:', err);
    }
  }

  // ===== ELIMINAR IMAGEM =====
  async function deleteImage(productId, filename) {
    if (!confirm('Eliminar esta imagem?')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/images`, {
        method: 'DELETE',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (!res.ok) throw new Error('Erro ao eliminar imagem');
      console.log('✅ Imagem eliminada');
      await loadProductImages(productId);
    } catch (err) {
      console.error('❌ Erro ao eliminar imagem:', err);
      alert('Erro ao eliminar imagem');
    }
  }

  // ===== ELIMINAR PRODUTO =====
  async function deleteProduct() {
    if (!currentProduct) {
      return alert('Nenhum produto selecionado');
    }

    const confirmed = confirm(
      `Tem a certeza que deseja eliminar o produto "${currentProduct.name}"?\n\nEsta ação não pode ser revertida.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/products/${currentProduct.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao eliminar produto');
      }

      const data = await res.json();
      console.log('✅ Produto eliminado:', data);
      
      alert('Produto eliminado com sucesso!');
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error('❌ Erro ao eliminar produto:', err);
      alert(err.message || 'Erro ao eliminar produto');
    }
  }

  // ===== EVENT LISTENERS PARA UPLOAD DE MODELO =====
  if (editModelFile) {
    editModelFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        newModelFilename.textContent = `📦 ${file.name}`;
        uploadNewModelBtn.disabled = false;
      } else {
        newModelFilename.textContent = '';
        uploadNewModelBtn.disabled = true;
      }
    });
  }

  if (uploadNewModelBtn) {
    uploadNewModelBtn.addEventListener('click', async () => {
      const file = editModelFile.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('modelFile', file);

      try {
        uploadNewModelBtn.disabled = true;
        uploadNewModelBtn.textContent = '⏳ A enviar...';

        const res = await fetch(`${API_BASE}/products/${currentProduct.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: formData
        });

        if (!res.ok) throw new Error('Erro ao enviar modelo');

        console.log('✅ Modelo atualizado');
        alert('Modelo 3D atualizado com sucesso!');
        
        // Recarregar produto para mostrar novo modelo
        const updatedProduct = await res.json();
        editCurrentModel.src = `${API_BASE}/models/${updatedProduct.model_file}`;
        currentModelFilename.textContent = `📦 ${updatedProduct.model_file}`;
        
        // Limpar input
        editModelFile.value = '';
        newModelFilename.textContent = '';
        uploadNewModelBtn.disabled = true;
        uploadNewModelBtn.textContent = '⬆️ Enviar Novo Modelo';

      } catch (err) {
        console.error('❌ Erro ao enviar modelo:', err);
        alert('Erro ao enviar modelo 3D');
        uploadNewModelBtn.textContent = '⬆️ Enviar Novo Modelo';
        uploadNewModelBtn.disabled = false;
      }
    });
  }

  // ===== EVENT LISTENERS PARA ADICIONAR IMAGENS =====
  if (editNewImages) {
    editNewImages.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        newImagesInfo.textContent = `${files.length} imagem${files.length > 1 ? 'ns' : ''} selecionada${files.length > 1 ? 's' : ''}`;
        uploadNewImagesBtn.disabled = false;
      } else {
        newImagesInfo.textContent = '';
        uploadNewImagesBtn.disabled = true;
      }
    });
  }

  if (uploadNewImagesBtn) {
    uploadNewImagesBtn.addEventListener('click', async () => {
      const files = editNewImages.files;
      if (!files.length) return;

      const formData = new FormData();
      for (let i = 0; i < Math.min(4, files.length); i++) {
        formData.append('images', files[i]);
      }

      try {
        uploadNewImagesBtn.disabled = true;
        uploadNewImagesBtn.textContent = '⏳ A enviar...';

        const res = await fetch(`${API_BASE}/products/${currentProduct.id}/images`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData
        });

        if (!res.ok) throw new Error('Erro ao adicionar imagens');

        console.log('✅ Imagens adicionadas');
        alert('Imagens adicionadas com sucesso!');
        
        // Recarregar imagens
        await loadProductImages(currentProduct.id);
        
        // Limpar input
        editNewImages.value = '';
        newImagesInfo.textContent = '';
        uploadNewImagesBtn.disabled = true;
        uploadNewImagesBtn.textContent = '⬆️ Adicionar Imagens';

      } catch (err) {
        console.error('❌ Erro ao adicionar imagens:', err);
        alert('Erro ao adicionar imagens');
        uploadNewImagesBtn.textContent = '⬆️ Adicionar Imagens';
        uploadNewImagesBtn.disabled = false;
      }
    });
  }

  // ===== EVENT LISTENERS PARA SUBSTITUIR TODAS AS IMAGENS =====
  if (editReplaceImages) {
    editReplaceImages.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        replaceImagesInfo.textContent = `${files.length} imagem${files.length > 1 ? 'ns' : ''} selecionada${files.length > 1 ? 's' : ''}`;
        replaceAllImagesBtn.disabled = false;
      } else {
        replaceImagesInfo.textContent = '';
        replaceAllImagesBtn.disabled = true;
      }
    });
  }

  if (replaceAllImagesBtn) {
    replaceAllImagesBtn.addEventListener('click', async () => {
      const files = editReplaceImages.files;
      if (!files.length) return;

      if (!confirm('⚠️ ATENÇÃO!\n\nIsto irá eliminar TODAS as imagens atuais e substituí-las pelas novas.\n\nEsta ação não pode ser revertida!\n\nTens a certeza?')) {
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < Math.min(4, files.length); i++) {
        formData.append('images', files[i]);
      }

      try {
        replaceAllImagesBtn.disabled = true;
        replaceAllImagesBtn.textContent = '⏳ A substituir...';

        const res = await fetch(`${API_BASE}/products/${currentProduct.id}/images/replace`, {
          method: 'POST',
          headers: authHeaders(),
          body: formData
        });

        if (!res.ok) throw new Error('Erro ao substituir imagens');

        console.log('✅ Imagens substituídas');
        alert('Imagens substituídas com sucesso!');
        
        // Recarregar imagens
        await loadProductImages(currentProduct.id);
        
        // Limpar input
        editReplaceImages.value = '';
        replaceImagesInfo.textContent = '';
        replaceAllImagesBtn.disabled = true;
        replaceAllImagesBtn.textContent = '🔄 Substituir Todas';

      } catch (err) {
        console.error('❌ Erro ao substituir imagens:', err);
        alert('Erro ao substituir imagens');
        replaceAllImagesBtn.textContent = '🔄 Substituir Todas';
        replaceAllImagesBtn.disabled = false;
      }
    });
  }

  // ===== ABRIR MODAL DE EDIÇÃO =====
  document.addEventListener('openEditProductModal', async (e) => {
    currentProduct = e.detail;

    if (!currentProduct) return console.error('❌ Produto inválido para edição');
    console.log('📦 Produto recebido para edição:', currentProduct);

    // ===== POPULAR CAMPOS PRINCIPAIS =====
    editId.value = currentProduct.id;
    editProductName.textContent = currentProduct.name;
    editName.value = currentProduct.name;
    editPrice.value = currentProduct.price ?? 0;
    editDesc.value = currentProduct.description ?? '';
    editStock.checked = !!currentProduct.stock;

    // ===== CATEGORIAS =====
    const productCategoryIds = (currentProduct.categories || []).map(c => parseInt(c.id));
    const primaryCategoryId = parseInt(
      (currentProduct.categories || []).find(c => c.is_primary)?.id || productCategoryIds[0]
    );

    renderEditCategoryCheckboxes(productCategoryIds, primaryCategoryId);

    // ===== MODELO 3D =====
    if (currentProduct.model_file) {
      editCurrentModel.src = `${API_BASE}/models/${currentProduct.model_file}`;
      currentModelFilename.textContent = `📦 ${currentProduct.model_file}`;
    } else {
      editCurrentModel.src = '';
      currentModelFilename.textContent = 'Sem modelo 3D';
    }

    // Limpar inputs de upload de modelo
    editModelFile.value = '';
    newModelFilename.textContent = '';
    uploadNewModelBtn.disabled = true;

    // ===== IMAGENS =====
    editNewImages.value = '';
    newImagesInfo.textContent = '';
    uploadNewImagesBtn.disabled = true;

    editReplaceImages.value = '';
    replaceImagesInfo.textContent = '';
    replaceAllImagesBtn.disabled = true;

    // Carregar imagens atuais
    await loadProductImages(currentProduct.id);

    // ===== ATIVAR PRIMEIRA ABA =====
    tabButtons[0].click();

    // ===== MOSTRAR MODAL =====
    showModal();
  });

  // ===== EVENT LISTENERS =====
  if (editCloseBtn) {
    editCloseBtn.addEventListener('click', hideModal);
  }
  
  // BOTÃO DE ELIMINAR PRODUTO
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteProduct);
  }

  // ===== SUBMIT FORM =====
  editForm.addEventListener('submit', async e => {
    e.preventDefault();

    const selectedCategoryIds = Array.from(
      categoriesContainer.querySelectorAll('.edit-category-checkbox:checked')
    ).map(cb => parseInt(cb.value));

    const primaryCategoryId = parseInt(primaryCategorySelect.value);

    if (!selectedCategoryIds.length) return alert('Seleciona pelo menos uma categoria');
    if (!primaryCategoryId) return alert('Seleciona uma categoria principal');

    const formData = new FormData();
    formData.append('name', editName.value);
    formData.append('price', editPrice.value);
    formData.append('description', editDesc.value);
    formData.append('stock', editStock.checked);
    formData.append('category_ids', JSON.stringify(selectedCategoryIds));
    formData.append('primary_category_id', primaryCategoryId);

    try {
      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao guardar alterações');
      }
      console.log('✅ Produto atualizado!');
      alert('Produto atualizado com sucesso!');
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error('❌ Erro ao guardar alterações:', err);
      alert(err.message || 'Erro ao guardar alterações');
    }
  });

  // ===== INICIALIZAÇÃO =====
  document.addEventListener('DOMContentLoaded', loadCategories);

  console.log('✅ editproduct.js carregado');
})();