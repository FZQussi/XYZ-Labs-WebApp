(() => {
  const API_BASE = 'http://localhost:3001';
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
      console.log('Categorias carregadas:', categories);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
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
      console.error('Erro ao carregar imagens:', err);
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
      await loadProductImages(productId);
    } catch (err) {
      console.error(err);
      alert('Erro ao eliminar imagem');
    }
  }

  // ===== ABRIR MODAL DE EDIÇÃO =====
  document.addEventListener('openEditProductModal', async (e) => {
    currentProduct = e.detail;

    if (!currentProduct) return console.error('Produto inválido para edição');
    console.log('Produto recebido para edição:', currentProduct);

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

  editCloseBtn.addEventListener('click', hideModal);

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
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao guardar alterações');
    }
  });

  // ===== INICIALIZAÇÃO =====
  document.addEventListener('DOMContentLoaded', loadCategories);
})();
