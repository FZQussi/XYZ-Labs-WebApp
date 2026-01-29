// Frontend/Dashboard/scripts/createproduct.js (ATUALIZADO)
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  // ===== ELEMENTOS MODAL =====
  const createModal = document.getElementById('createProductModal');
  const createForm = document.getElementById('createProductForm');
  const createName = document.getElementById('createName');
  const createPrice = document.getElementById('createPrice');
  const createDesc = document.getElementById('createDescription');
  const createStock = document.getElementById('createStock');
  const createModelFile = document.getElementById('createModelFile');
  const createImages = document.getElementById('createImages');
  const addProductBtn = document.getElementById('addProductBtn');
  const createCloseBtn = createModal.querySelector('[data-close="create"]');
  const createCategorySelect = document.getElementById('createCategory');
  const createSubcatSelect = document.getElementById('createSubcategory');
  const dynamicAttributesContainer = document.getElementById('dynamicAttributesContainer');

  let categories = [];
  let subcategories = [];
  let currentAttributes = [];

  // ===== AUTENTICAÇÃO =====
  function authHeaders() { return { Authorization: `Bearer ${token}` }; }

  // ===== LOAD CATEGORIES E SUBCATEGORIES =====
  async function loadCategoriesAndSubcategories() {
    try {
      const [catRes, subcatRes] = await Promise.all([
        fetch(`${API_BASE}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/subcategories`, { headers: authHeaders() }),
      ]);

      categories = await catRes.json();
      subcategories = await subcatRes.json();

      // Popular select categoria
      createCategorySelect.innerHTML = '<option value="">-- Seleciona categoria --</option>';
      categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.name;
        createCategorySelect.appendChild(option);
      });

    } catch (err) {
      console.error('Erro ao carregar categorias/subcategorias:', err);
    }
  }

  // ===== UPDATE SUBCATEGORIES =====
  function updateSubcategories() {
    const catId = createCategorySelect.value;
    createSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    dynamicAttributesContainer.innerHTML = ''; // Limpar atributos
    
    subcategories.filter(sc => sc.category_id == catId).forEach(sc => {
      const option = document.createElement('option');
      option.value = sc.id;
      option.textContent = sc.name;
      createSubcatSelect.appendChild(option);
    });
  }

  // ===== LOAD ATTRIBUTES BY SUBCATEGORY =====
  async function loadAttributesForSubcategory(subcategoryId) {
    if (!subcategoryId) {
      dynamicAttributesContainer.innerHTML = '';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/attributes/subcategory/${subcategoryId}`, {
        headers: authHeaders()
      });
      currentAttributes = await res.json();

      if (!currentAttributes.length) {
        dynamicAttributesContainer.innerHTML = '<p style="color:#666;font-size:13px;margin-top:10px;">Nenhum atributo definido para esta subcategoria</p>';
        return;
      }

      renderDynamicAttributes();

    } catch (err) {
      console.error('Erro ao carregar atributos:', err);
      dynamicAttributesContainer.innerHTML = '<p style="color:red;">Erro ao carregar atributos</p>';
    }
  }

  // ===== RENDER DYNAMIC ATTRIBUTES =====
  function renderDynamicAttributes() {
    dynamicAttributesContainer.innerHTML = '<h4 style="margin-top:20px;margin-bottom:10px;font-size:14px;text-transform:uppercase;">Atributos do Produto</h4>';

    currentAttributes.forEach(attr => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = attr.attribute_name;
      if (attr.is_required) {
        label.innerHTML += ' <span style="color:red;">*</span>';
      }
      formGroup.appendChild(label);

      let input;

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
          input.appendChild(option);
        });

      } else if (attr.attribute_type === 'multiselect') {
        input = document.createElement('select');
        input.id = `attr-${attr.id}`;
        input.name = `attr-${attr.id}`;
        input.multiple = true;
        input.required = attr.is_required;

        const options = JSON.parse(attr.attribute_options || '[]');
        options.forEach(optValue => {
          const option = document.createElement('option');
          option.value = optValue;
          option.textContent = optValue;
          input.appendChild(option);
        });

      } else if (attr.attribute_type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.id = `attr-${attr.id}`;
        input.name = `attr-${attr.id}`;
        input.required = attr.is_required;

      } else { // text
        input = document.createElement('input');
        input.type = 'text';
        input.id = `attr-${attr.id}`;
        input.name = `attr-${attr.id}`;
        input.required = attr.is_required;
      }

      formGroup.appendChild(input);
      dynamicAttributesContainer.appendChild(formGroup);
    });
  }

  // ===== COLLECT ATTRIBUTES VALUES =====
  function collectAttributesValues() {
    const attributes = {};

    currentAttributes.forEach(attr => {
      const input = document.getElementById(`attr-${attr.id}`);
      if (input) {
        if (input.multiple) {
          // Multiselect
          const selected = Array.from(input.selectedOptions).map(opt => opt.value);
          attributes[attr.id] = JSON.stringify(selected);
        } else {
          attributes[attr.id] = input.value;
        }
      }
    });

    return attributes;
  }

  // ===== EVENT LISTENERS =====
  createCategorySelect.addEventListener('change', updateSubcategories);
  
  createSubcatSelect.addEventListener('change', () => {
    const subcatId = createSubcatSelect.value;
    loadAttributesForSubcategory(subcatId);
  });

  // ===== MODAL OPEN/CLOSE =====
  addProductBtn.addEventListener('click', () => {
    createForm.reset();
    createCategorySelect.value = '';
    createSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    dynamicAttributesContainer.innerHTML = '';
    createModal.classList.remove('hidden');
  });

  createCloseBtn.addEventListener('click', () => {
    createModal.classList.add('hidden');
  });

  // ===== FORM SUBMIT =====
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      // Coletar atributos
      const attributes = collectAttributesValues();

      // === 1️⃣ Criar produto com dados e modelo 3D ===
      const formData = new FormData();
      formData.append('name', createName.value);
      formData.append('price', createPrice.value);
      formData.append('description', createDesc.value);
      formData.append('subcategory_id', createSubcatSelect.value || null);
      formData.append('stock', createStock.checked);
      formData.append('attributes', JSON.stringify(attributes));

      if (createModelFile.files[0]) {
        formData.append('modelFile', createModelFile.files[0]);
      }

      const resProduct = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      if (!resProduct.ok) throw new Error('Erro ao criar produto');

      const newProduct = await resProduct.json();
      const productId = newProduct.id;
      console.log('✅ Produto criado com sucesso!', newProduct);

      // === 2️⃣ Enviar imagens se houver ===
      if (createImages.files.length) {
        const imageData = new FormData();
        for (let i = 0; i < Math.min(4, createImages.files.length); i++) {
          imageData.append('images', createImages.files[i]);
        }

        const resImages = await fetch(`${API_BASE}/products/${productId}/images`, {
          method: 'POST',
          headers: authHeaders(),
          body: imageData
        });

        if (!resImages.ok) throw new Error('Erro ao enviar imagens');
        console.log('✅ Imagens enviadas com sucesso');
      }

      createModal.classList.add('hidden');
      window.reloadProducts();

    } catch (err) {
      console.error('Erro ao criar produto:', err);
      alert('Erro ao criar produto');
    }
  });

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadCategoriesAndSubcategories);
})();