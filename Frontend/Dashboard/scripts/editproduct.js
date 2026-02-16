(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  let categories = [];
  let currentProduct = null;
  let imageOrderManager = null;

  // ===== ELEMENTOS MODAL DE EDIÇÃO =====
  const editModal = document.getElementById('editProductModal');
  const editForm = editModal.querySelector('#editProductForm');
  const editId = editModal.querySelector('#editId');
  const editName = editModal.querySelector('#editName');
  const editPrice = editModal.querySelector('#editPrice');
  const editDesc = editModal.querySelector('#editDescription');
  const editStock = editModal.querySelector('#editStock');
  const editProductName = editModal.querySelector('#editProductName');

  // Categorias
  const categoriesContainer = editModal.querySelector('#categoriesCheckboxes');
  const primaryCategorySelect = editModal.querySelector('#primaryCategory');

  // Modelo 3D
  const editCurrentModel = editModal.querySelector('#editCurrentModel');
  const currentModelFilename = editModal.querySelector('#currentModelFilename');
  const editModelFile = editModal.querySelector('#editModelFile');
  const newModelFilename = editModal.querySelector('#newModelFilename');
  const uploadNewModelBtn = editModal.querySelector('#uploadNewModelBtn');

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

      if (isChecked) {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        primaryCategorySelect.appendChild(option);
      }
    });

    if (primaryCategoryId) primaryCategorySelect.value = primaryCategoryId;

    categoriesContainer.querySelectorAll('.edit-category-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', updatePrimaryCategoryOptions);
    });

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

  // ⭐ ===== INICIALIZAR GESTOR DE ORDENAÇÃO DE IMAGENS ===== ⭐
  function initImageOrderManager() {
    const container = document.getElementById('editImagesOrderContainer');
    if (!container) {
      console.warn('⚠️ Container de ordenação de imagens não encontrado');
      return false;
    }

    if (!window.ImageOrderManager) {
      console.error('❌ Classe ImageOrderManager não está disponível!');
      return false;
    }

    try {
      imageOrderManager = new window.ImageOrderManager('editImagesOrderContainer', {
        maxImages: 4,
        onOrderChange: (orderedImages) => {
          console.log('📸 Ordem alterada:', orderedImages);
          updateImageCountDisplay();
        },
        onImageAdd: (images) => {
          console.log('📸 Imagens adicionadas:', images);
          updateImageCountDisplay();
        },
        onImageRemove: async (removedImage) => {
          console.log('📸 Imagem removida:', removedImage);
          
          if (removedImage.isExisting && removedImage.filename) {
            await deleteImage(currentProduct.id, removedImage.filename);
          }
          
          updateImageCountDisplay();
        }
      });

      console.log('✅ Gestor de ordenação de imagens inicializado');
      return true;
    } catch (err) {
      console.error('❌ Erro ao inicializar gestor:', err);
      return false;
    }
  }

  function updateImageCountDisplay() {
    const countEl = document.getElementById('editImageCount');
    if (countEl && imageOrderManager) {
      const count = imageOrderManager.getCount();
      countEl.textContent = `${count}/4 imagens`;
      countEl.className = `image-order-count ${count >= 4 ? 'full' : ''}`;
    }
  }

  // ⭐ ===== CARREGAR IMAGENS DO PRODUTO ===== ⭐
  async function loadProductImages(productId) {
    try {
      console.log('📸 A carregar imagens do produto:', productId);
      
      const res = await fetch(`${API_BASE}/products/${productId}`, { headers: authHeaders() });
      const product = await res.json();
      const images = product.images || [];

      console.log('📸 Imagens recebidas:', images);

      if (!imageOrderManager) {
        console.warn('⚠️ Gestor de imagens não está inicializado');
        return;
      }

      if (images.length === 0) {
        console.log('ℹ️ Produto não tem imagens');
        imageOrderManager.clear();
        updateImageCountDisplay();
        return;
      }

      // Converter filenames para URLs completas
      const imageUrls = images.map(filename => `${API_BASE}/images/${filename}`);
      
      console.log('📸 URLs das imagens:', imageUrls);

      // Carregar no gestor de ordenação
      imageOrderManager.addExistingImages(imageUrls);
      updateImageCountDisplay();

      console.log('✅ Imagens carregadas com sucesso');

    } catch (err) {
      console.error('❌ Erro ao carregar imagens:', err);
    }
  }

  // ===== ELIMINAR IMAGEM =====
  async function deleteImage(productId, filename) {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/images`, {
        method: 'DELETE',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      
      if (!res.ok) throw new Error('Erro ao eliminar imagem');
      
      console.log('✅ Imagem eliminada do servidor:', filename);
      return true;
    } catch (err) {
      console.error('Erro ao eliminar imagem:', err);
      alert('Erro ao eliminar imagem');
      return false;
    }
  }

  // ⭐ ===== GUARDAR NOVA ORDEM DE IMAGENS ===== ⭐
  async function saveImageOrder() {
    if (!currentProduct || !imageOrderManager) {
      console.warn('Produto ou gestor de imagens não disponível');
      return;
    }

    try {
      const orderedFilenames = imageOrderManager.getOrderedFilenames();
      
      if (orderedFilenames.length === 0) {
        alert('Adicione pelo menos uma imagem');
        return;
      }

      console.log('💾 A guardar ordem:', orderedFilenames);

      const res = await fetch(`${API_BASE}/products/${currentProduct.id}/images/reorder`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: orderedFilenames })
      });

      if (!res.ok) {
        throw new Error('Erro ao guardar ordem das imagens');
      }

      const result = await res.json();
      console.log('✅ Ordem guardada:', result);

      alert('✅ Ordem das imagens guardada com sucesso!');

    } catch (err) {
      console.error('Erro ao guardar ordem:', err);
      alert('Erro ao guardar ordem das imagens: ' + err.message);
    }
  }

  // ⭐ ===== ADICIONAR NOVAS IMAGENS ===== ⭐
  async function addNewImages() {
    if (!currentProduct) {
      alert('Nenhum produto selecionado');
      return;
    }

    const fileInput = document.getElementById('editNewImagesInput');
    if (!fileInput) {
      console.error('Input de imagens não encontrado');
      return;
    }

    const files = fileInput.files;

    if (files.length === 0) {
      alert('Selecione pelo menos uma imagem');
      return;
    }

    if (imageOrderManager && imageOrderManager.getCount() + files.length > 4) {
      alert(`Máximo de 4 imagens. Atualmente tens ${imageOrderManager.getCount()}`);
      return;
    }

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const res = await fetch(`${API_BASE}/products/${currentProduct.id}/images`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      if (!res.ok) throw new Error('Erro ao fazer upload');

      const result = await res.json();
      console.log('✅ Imagens enviadas:', result);

      await loadProductImages(currentProduct.id);
      
      fileInput.value = '';
      const label = document.getElementById('newImagesLabel');
      if (label) label.textContent = 'Nenhum ficheiro selecionado';

      alert('✅ Imagens adicionadas com sucesso!');

    } catch (err) {
      console.error('Erro ao adicionar imagens:', err);
      alert('Erro ao adicionar imagens: ' + err.message);
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
      console.error('Erro ao eliminar produto:', err);
      alert(err.message || 'Erro ao eliminar produto');
    }
  }

  // ===== ABRIR MODAL DE EDIÇÃO =====
  document.addEventListener('openEditProductModal', async (e) => {
    currentProduct = e.detail;

    if (!currentProduct) return console.error('Produto inválido para edição');
    console.log('📦 Produto recebido para edição:', currentProduct);

    // ⭐ Inicializar gestor de imagens se ainda não existe
    if (!imageOrderManager) {
      const initialized = initImageOrderManager();
      if (!initialized) {
        console.error('❌ Não foi possível inicializar o gestor de imagens');
      }
    } else {
      console.log('🔄 Limpando imagens anteriores...');
      imageOrderManager.clear();
    }

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

    editModelFile.value = '';
    newModelFilename.textContent = '';
    if (uploadNewModelBtn) uploadNewModelBtn.disabled = true;

    // ⭐ ===== CARREGAR IMAGENS NO GESTOR ===== ⭐
    console.log('📸 Iniciando carregamento de imagens...');
    await loadProductImages(currentProduct.id);

    // ===== ATIVAR PRIMEIRA ABA =====
    tabButtons[0].click();

    // ===== MOSTRAR MODAL =====
    showModal();
  });

  // ===== EVENT LISTENERS =====
  editCloseBtn.addEventListener('click', hideModal);
  deleteBtn.addEventListener('click', deleteProduct);

  // ⭐ BOTÃO DE ADICIONAR NOVAS IMAGENS ⭐
  const btnAddImages = document.getElementById('btnAddNewImages');
  if (btnAddImages) {
    btnAddImages.addEventListener('click', addNewImages);
  } else {
    console.warn('⚠️ Botão btnAddNewImages não encontrado');
  }

  // ⭐ BOTÃO DE GUARDAR ORDEM ⭐
  const btnSaveOrder = document.getElementById('btnSaveImageOrder');
  if (btnSaveOrder) {
    btnSaveOrder.addEventListener('click', saveImageOrder);
  } else {
    console.warn('⚠️ Botão btnSaveImageOrder não encontrado');
  }

  // ⭐ INPUT DE NOVAS IMAGENS ⭐
  const newImagesInput = document.getElementById('editNewImagesInput');
  if (newImagesInput) {
    newImagesInput.addEventListener('change', (e) => {
      const count = e.target.files.length;
      const label = document.getElementById('newImagesLabel');
      if (label) {
        label.textContent = count > 0 ? `${count} ficheiro(s) selecionado(s)` : 'Nenhum ficheiro selecionado';
      }
    });
  } else {
    console.warn('⚠️ Input editNewImagesInput não encontrado');
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
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao guardar alterações');
    }
  });

  // ===== INICIALIZAÇÃO =====
  document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    
    // ⭐ Tentar inicializar gestor de imagens ⭐
    setTimeout(() => {
      if (document.getElementById('editImagesOrderContainer')) {
        initImageOrderManager();
        console.log('✅ Sistema de ordenação de imagens pronto');
      } else {
        console.log('ℹ️ Sistema de ordenação de imagens não disponível (HTML não atualizado)');
      }
    }, 100);
  });
})();