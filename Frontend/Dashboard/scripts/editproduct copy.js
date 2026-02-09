// Frontend/Dashboard/scripts/editproduct.js
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');
  let currentProductAttributes = {};
  let availableAttributes = [];
  // ===== ELEMENTOS MODAL =====
  const editModal = document.getElementById('editProductModal');
  const editForm = document.getElementById('editProductForm');
  const editId = document.getElementById('editId');
  const editName = document.getElementById('editName');
  const editPrice = document.getElementById('editPrice');
  const editDesc = document.getElementById('editDescription');
  const editStock = document.getElementById('editStock');
  const editCategorySelect = document.getElementById('editCategory');
  const editSubcatSelect = document.getElementById('editSubcategory');
  const editProductName = document.getElementById('editProductName');
  
  // Modelo 3D
  const editCurrentModel = document.getElementById('editCurrentModel');
  const currentModelFilename = document.getElementById('currentModelFilename');
  const editModelFile = document.getElementById('editModelFile');
  const newModelFilename = document.getElementById('newModelFilename');
  const uploadNewModelBtn = document.getElementById('uploadNewModelBtn');

  // Imagens
  const editImagesGrid = document.getElementById('editImagesGrid');
  const imageCount = document.getElementById('imageCount');
  const editNewImages = document.getElementById('editNewImages');
  const newImagesInfo = document.getElementById('newImagesInfo');
  const uploadNewImagesBtn = document.getElementById('uploadNewImagesBtn');
  const editReplaceImages = document.getElementById('editReplaceImages');
  const replaceImagesInfo = document.getElementById('replaceImagesInfo');
  const replaceAllImagesBtn = document.getElementById('replaceAllImagesBtn');

  // Botões
  const editCloseBtn = editModal.querySelector('[data-close="edit"]');
  const deleteBtn = document.getElementById('deleteProductBtn');

  // Abas
  const tabButtons = editModal.querySelectorAll('.modal-tab-btn');

  let categories = [];
  let subcategories = [];
  let currentProduct = null;

  // ===== AUTENTICAÇÃO =====
  function authHeaders() { return { Authorization: `Bearer ${token}` }; }

  function showModal() { editModal.classList.remove('hidden'); }
  function hideModal() { editModal.classList.add('hidden'); }

  // ===== SISTEMA DE ABAS =====
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      tabButtons.forEach(b => b.classList.remove('active'));
      editModal.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.remove('active');
      });

      btn.classList.add('active');
      const targetContent = document.getElementById(`tab-${tabName}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // ===== LOAD CATEGORIES E SUBCATEGORIES =====
  async function loadCategoriesAndSubcategories() {
    try {
      const [catRes, subcatRes] = await Promise.all([
        fetch(`${API_BASE}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/subcategories`, { headers: authHeaders() }),
      ]);

      categories = await catRes.json();
      subcategories = await subcatRes.json();

      editCategorySelect.innerHTML = '<option value="">-- Seleciona categoria --</option>';
      categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        editCategorySelect.appendChild(option);
      });

    } catch (err) {
      console.error('Erro ao carregar categorias/subcategorias:', err);
    }
  }

  function updateSubcategories() {
    const catId = editCategorySelect.value;
    editSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    subcategories.filter(sc => sc.category_id == catId).forEach(sc => {
      const option = document.createElement('option');
      option.value = sc.id;
      option.textContent = sc.name;
      editSubcatSelect.appendChild(option);
    });
  }

  editCategorySelect.addEventListener('change', updateSubcategories);

  // ===== LOAD PRODUCT IMAGES =====
  async function loadProductImages(productId) {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        headers: authHeaders()
      });
      const product = await res.json();
      
      const images = product.images || [];
      imageCount.textContent = images.length;

      editImagesGrid.innerHTML = '';

      if (images.length === 0) {
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

  // ===== DELETE IMAGE =====
  async function deleteImage(productId, filename) {
    if (!confirm('Eliminar esta imagem?')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${productId}/images`, {
        method: 'DELETE',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      });

      if (!res.ok) throw new Error('Erro ao eliminar imagem');

      await loadProductImages(productId);
      console.log('✅ Imagem eliminada com sucesso');
    } catch (err) {
      console.error('Erro ao eliminar imagem:', err);
      alert('Erro ao eliminar imagem');
    }
  }

  // ===== OPEN MODAL =====
  document.addEventListener('openEditProductModal', async (e) => {
    currentProduct = e.detail;

    editId.value = currentProduct.id;
    editProductName.textContent = currentProduct.name;
    editName.value = currentProduct.name;
    editPrice.value = currentProduct.price;
    editDesc.value = currentProduct.description;
   editStock.checked = currentProduct.stock === true;

    // Categoria/Subcategoria
    const subcat = subcategories.find(sc => sc.id == currentProduct.subcategory_id);
    if (subcat) {
      editCategorySelect.value = subcat.category_id;
      updateSubcategories();
      editSubcatSelect.value = subcat.id;
    } else {
      editCategorySelect.value = '';
      editSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    }

    // Modelo 3D
    if (currentProduct.model_file) {
      editCurrentModel.src = `${API_BASE}/models/${currentProduct.model_file}`;
      currentModelFilename.textContent = `📦 ${currentProduct.model_file}`;
    } else {
      editCurrentModel.src = '';
      currentModelFilename.textContent = 'Sem modelo 3D';
    }

    // Limpar inputs
    editModelFile.value = '';
    newModelFilename.textContent = '';
    uploadNewModelBtn.disabled = true;
    editNewImages.value = '';
    newImagesInfo.textContent = '';
    uploadNewImagesBtn.disabled = true;
    editReplaceImages.value = '';
    replaceImagesInfo.textContent = '';
    replaceAllImagesBtn.disabled = true;

    // Carregar imagens
    await loadProductImages(currentProduct.id);

    // Ativa primeira aba
    tabButtons[0].click();

    showModal();
  });

  editCloseBtn.addEventListener('click', hideModal);

  // ===== SUBMIT DETALHES =====
  editForm.addEventListener('submit', async e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', editName.value);
    formData.append('price', editPrice.value);
    formData.append('description', editDesc.value);
    formData.append('subcategory_id', editSubcatSelect.value || null);
    formData.append('stock', editStock.checked);

    try {
      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: formData
      });
      
      if (!res.ok) throw new Error('Erro ao guardar alterações');
      
      console.log('✅ Produto atualizado com sucesso!');
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error('Erro ao guardar alterações:', err);
      alert('Erro ao guardar alterações');
    }
  });

  // ===== UPLOAD NOVO MODELO =====
  editModelFile.addEventListener('change', () => {
    if (editModelFile.files.length > 0) {
      newModelFilename.textContent = `✅ ${editModelFile.files[0].name}`;
      uploadNewModelBtn.disabled = false;
    } else {
      newModelFilename.textContent = '';
      uploadNewModelBtn.disabled = true;
    }
  });

  uploadNewModelBtn.addEventListener('click', async () => {
    if (!editModelFile.files.length) return;

    const formData = new FormData();
    formData.append('modelFile', editModelFile.files[0]);

    try {
      uploadNewModelBtn.classList.add('btn-loading');
      uploadNewModelBtn.disabled = true;

      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: formData
      });

      if (!res.ok) throw new Error('Erro ao enviar modelo');

      const updated = await res.json();
      editCurrentModel.src = `${API_BASE}/models/${updated.model_file}`;
      currentModelFilename.textContent = `📦 ${updated.model_file}`;
      
      editModelFile.value = '';
      newModelFilename.textContent = '';
      uploadNewModelBtn.disabled = true;

      console.log('✅ Modelo atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar modelo:', err);
      alert('Erro ao enviar modelo');
    } finally {
      uploadNewModelBtn.classList.remove('btn-loading');
    }
  });

  // ===== ADICIONAR IMAGENS =====
  editNewImages.addEventListener('change', () => {
    const count = editNewImages.files.length;
    if (count > 0) {
      newImagesInfo.textContent = `✅ ${count} imagem(ns) selecionada(s)`;
      uploadNewImagesBtn.disabled = false;
    } else {
      newImagesInfo.textContent = '';
      uploadNewImagesBtn.disabled = true;
    }
  });

  uploadNewImagesBtn.addEventListener('click', async () => {
    if (!editNewImages.files.length) return;

    const formData = new FormData();
    for (let i = 0; i < Math.min(4, editNewImages.files.length); i++) {
      formData.append('images', editNewImages.files[i]);
    }

    try {
      uploadNewImagesBtn.classList.add('btn-loading');
      uploadNewImagesBtn.disabled = true;

      const res = await fetch(`${API_BASE}/products/${editId.value}/images`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      if (!res.ok) throw new Error('Erro ao adicionar imagens');

      await loadProductImages(editId.value);
      
      editNewImages.value = '';
      newImagesInfo.textContent = '';

      console.log('✅ Imagens adicionadas com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar imagens:', err);
      alert('Erro ao adicionar imagens');
    } finally {
      uploadNewImagesBtn.classList.remove('btn-loading');
    }
  });

  // ===== SUBSTITUIR TODAS AS IMAGENS =====
  editReplaceImages.addEventListener('change', () => {
    const count = editReplaceImages.files.length;
    if (count > 0) {
      replaceImagesInfo.textContent = `✅ ${count} imagem(ns) selecionada(s)`;
      replaceAllImagesBtn.disabled = false;
    } else {
      replaceImagesInfo.textContent = '';
      replaceAllImagesBtn.disabled = true;
    }
  });

  replaceAllImagesBtn.addEventListener('click', async () => {
    if (!editReplaceImages.files.length) return;
    
    if (!confirm('⚠️ Isto irá eliminar todas as imagens atuais. Continuar?')) return;

    const formData = new FormData();
    for (let i = 0; i < Math.min(4, editReplaceImages.files.length); i++) {
      formData.append('images', editReplaceImages.files[i]);
    }

    try {
      replaceAllImagesBtn.classList.add('btn-loading');
      replaceAllImagesBtn.disabled = true;

      const res = await fetch(`${API_BASE}/products/${editId.value}/images`, {
        method: 'PUT',
        headers: authHeaders(),
        body: formData
      });

      if (!res.ok) throw new Error('Erro ao substituir imagens');

      await loadProductImages(editId.value);
      
      editReplaceImages.value = '';
      replaceImagesInfo.textContent = '';

      console.log('✅ Imagens substituídas com sucesso!');
    } catch (err) {
      console.error('Erro ao substituir imagens:', err);
      alert('Erro ao substituir imagens');
    } finally {
      replaceAllImagesBtn.classList.remove('btn-loading');
    }
  });
  // ===== ADICIONAR NOVA FUNÇÃO =====
async function loadAttributesForEdit(subcategoryId, productAttributes) {
  const dynamicAttrsEdit = document.getElementById('dynamicAttributesEdit');
  
  if (!dynamicAttrsEdit) {
    console.warn('Container dynamicAttributesEdit não encontrado');
    return;
  }

  if (!subcategoryId) {
    dynamicAttrsEdit.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/attributes/subcategory/${subcategoryId}`, {
      headers: authHeaders()
    });
    availableAttributes = await res.json();

    if (!availableAttributes.length) {
      dynamicAttrsEdit.innerHTML = '<p style="color:#666;font-size:13px;margin-top:10px;">Nenhum atributo definido para esta subcategoria</p>';
      return;
    }

    renderDynamicAttributesForEdit(productAttributes);

  } catch (err) {
    console.error('Erro ao carregar atributos:', err);
    dynamicAttrsEdit.innerHTML = '<p style="color:red;">Erro ao carregar atributos</p>';
  }
}

// ===== ADICIONAR NOVA FUNÇÃO =====
function renderDynamicAttributesForEdit(productAttributes) {
  const container = document.getElementById('dynamicAttributesEdit');
  
  container.innerHTML = '<h4 style="margin:20px 0 10px;font-size:14px;text-transform:uppercase;color:#374151;">Atributos do Produto</h4>';

  availableAttributes.forEach(attr => {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = attr.attribute_name;
    if (attr.is_required) {
      label.innerHTML += ' <span style="color:red;">*</span>';
    }
    formGroup.appendChild(label);

    let input;
    let currentValue = productAttributes[attr.attribute_name]?.value || '';

    if (attr.attribute_type === 'select') {
      input = document.createElement('select');
      input.id = `attr-${attr.id}`;
      input.name = `attr-${attr.id}`;
      input.required = attr.is_required;

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Seleciona --';
      input.appendChild(defaultOption);

      const options = JSON.parse(attr.attribute_options || '[]');
      options.forEach(optValue => {
        const option = document.createElement('option');
        option.value = optValue;
        option.textContent = optValue;
        if (optValue === currentValue) {
          option.selected = true;
        }
        input.appendChild(option);
      });

    } else if (attr.attribute_type === 'multiselect') {
      input = document.createElement('select');
      input.id = `attr-${attr.id}`;
      input.name = `attr-${attr.id}`;
      input.multiple = true;
      input.required = attr.is_required;

      const options = JSON.parse(attr.attribute_options || '[]');
      const selectedValues = currentValue ? JSON.parse(currentValue) : [];

      options.forEach(optValue => {
        const option = document.createElement('option');
        option.value = optValue;
        option.textContent = optValue;
        if (selectedValues.includes(optValue)) {
          option.selected = true;
        }
        input.appendChild(option);
      });

    } else if (attr.attribute_type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.id = `attr-${attr.id}`;
      input.name = `attr-${attr.id}`;
      input.required = attr.is_required;
      input.value = currentValue;

    } else { // text
      input = document.createElement('input');
      input.type = 'text';
      input.id = `attr-${attr.id}`;
      input.name = `attr-${attr.id}`;
      input.required = attr.is_required;
      input.value = currentValue;
    }

    formGroup.appendChild(input);
    container.appendChild(formGroup);
  });
}

// ===== ADICIONAR NOVA FUNÇÃO =====
function collectAttributesForEdit() {
  const attributes = {};

  availableAttributes.forEach(attr => {
    const input = document.getElementById(`attr-${attr.id}`);
    if (input) {
      if (input.multiple) {
        const selected = Array.from(input.selectedOptions).map(opt => opt.value);
        attributes[attr.id] = JSON.stringify(selected);
      } else {
        attributes[attr.id] = input.value;
      }
    }
  });

  return attributes;
}

// ===== ATUALIZAR A FUNÇÃO openEditProductModal =====
document.addEventListener('openEditProductModal', async (e) => {
  currentProduct = e.detail;

  editId.value = currentProduct.id;
  editProductName.textContent = currentProduct.name;
  editName.value = currentProduct.name;
  editPrice.value = currentProduct.price;
  editDesc.value = currentProduct.description;
  editStock.checked = currentProduct.stock === true;

  // Categoria/Subcategoria
  const subcat = subcategories.find(sc => sc.id == currentProduct.subcategory_id);
  if (subcat) {
    editCategorySelect.value = subcat.category_id;
    updateSubcategories();
    editSubcatSelect.value = subcat.id;

    // ✅ NOVO: Carregar atributos
    await loadAttributesForEdit(subcat.id, currentProduct.attributes || {});
  } else {
    editCategorySelect.value = '';
    editSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    document.getElementById('dynamicAttributesEdit').innerHTML = '';
  }

  // ... resto do código (modelo 3D, imagens, etc.)
  
  showModal();
});

// ===== ATUALIZAR O SUBMIT DO editForm =====
editForm.addEventListener('submit', async e => {
  e.preventDefault();

  // ✅ NOVO: Coletar atributos
  const attributes = collectAttributesForEdit();

  const formData = new FormData();
  formData.append('name', editName.value);
  formData.append('price', editPrice.value);
  formData.append('description', editDesc.value);
  formData.append('subcategory_id', editSubcatSelect.value || null);
  formData.append('stock', editStock.checked);
  formData.append('attributes', JSON.stringify(attributes)); // ✅ NOVO

  try {
    const res = await fetch(`${API_BASE}/products/${editId.value}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: formData
    });
    
    if (!res.ok) throw new Error('Erro ao guardar alterações');
    
    console.log('✅ Produto atualizado com sucesso!');
    hideModal();
    window.reloadProducts();
  } catch (err) {
    console.error('Erro ao guardar alterações:', err);
    alert('Erro ao guardar alterações');
  }
});
  // ===== DELETE PRODUCT =====
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('⚠️ Tens a certeza que queres eliminar este produto?\n\nTodos os ficheiros (modelo 3D e imagens) serão permanentemente eliminados!')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (!res.ok) throw new Error('Erro ao eliminar produto');
      
      console.log('✅ Produto eliminado com sucesso!');
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error('Erro ao eliminar produto:', err);
      alert('Erro ao eliminar produto');
    }
  });

  document.addEventListener('DOMContentLoaded', loadCategoriesAndSubcategories);
})();