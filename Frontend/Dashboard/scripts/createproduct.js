// Frontend/Dashboard/scripts/createproduct.js
(() => {
  const API_BASE = '';
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
  const primaryCategorySelect = document.getElementById('primaryCategory');

  const categoriesContainer = document.getElementById('categoriesCheckboxes');

  let categories = [];
  let selectedCategories = new Set();

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== LOAD CATEGORIES =====
  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: authHeaders()
      });

      categories = await res.json();
      renderCategoriesSelection();
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }

  // ===== RENDER CATEGORIES =====
  function renderCategoriesSelection() {
    if (!categoriesContainer) {
      console.error('Container de categorias não encontrado');
      return;
    }

    categoriesContainer.innerHTML = `
      <div class="categories-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
        ${categories.map(cat => `
          <label class="category-checkbox-item" style="
            display:flex;
            align-items:center;
            gap:8px;
            padding:10px;
            border:2px solid #e5e7eb;
            border-radius:6px;
            cursor:pointer;
          ">
            <input 
              type="checkbox" 
              value="${cat.id}" 
              class="category-checkbox"
            >
            <span style="font-size:14px;font-weight:600;">${cat.name}</span>
          </label>
        `).join('')}
      </div>
      <p id="categoriesError" style="color:#ef4444;font-size:12px;margin-top:10px;display:none;">
        ⚠️ Seleciona pelo menos uma categoria
      </p>
    `;

    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', handleCategorySelection);
    });

    updatePrimaryCategorySelect();
  }

  // ===== UPDATE PRIMARY SELECT =====
  function updatePrimaryCategorySelect() {
    primaryCategorySelect.innerHTML =
      '<option value="">-- Categoria Principal --</option>';

    selectedCategories.forEach(catId => {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        primaryCategorySelect.appendChild(opt);
      }
    });

    primaryCategorySelect.disabled = selectedCategories.size === 0;
  }

  // ===== HANDLE CATEGORY SELECTION =====
  function handleCategorySelection(e) {
    const categoryId = parseInt(e.target.value);
    const label = e.target.closest('.category-checkbox-item');

    if (e.target.checked) {
      selectedCategories.add(categoryId);
      label.style.borderColor = '#2563eb';
      label.style.backgroundColor = '#eff6ff';
    } else {
      selectedCategories.delete(categoryId);
      label.style.borderColor = '#e5e7eb';
      label.style.backgroundColor = 'transparent';
    }

    updatePrimaryCategorySelect();

    if (selectedCategories.size > 0) {
      document.getElementById('categoriesError').style.display = 'none';
    }
  }

  // ===== MODAL OPEN/CLOSE =====
  addProductBtn.addEventListener('click', () => {
    createForm.reset();
    selectedCategories.clear();
    renderCategoriesSelection();
    updatePrimaryCategorySelect();
    createModal.classList.remove('hidden');
  });

  createCloseBtn.addEventListener('click', () => {
    createModal.classList.add('hidden');
  });

  // ===== FORM SUBMIT =====
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedCategories.size === 0) {
      document.getElementById('categoriesError').style.display = 'block';
      return;
    }

    try {
      const categoryIdsArray = Array.from(selectedCategories);

      const primaryCategoryId =
        primaryCategorySelect.value || categoryIdsArray[0];

      const formData = new FormData();
      formData.append('name', createName.value);
      formData.append('price', createPrice.value);
      formData.append('description', createDesc.value);
      formData.append('stock', createStock.checked);
      formData.append('category_ids', JSON.stringify(categoryIdsArray));
      formData.append('primary_category_id', primaryCategoryId);

      if (createModelFile.files[0]) {
        formData.append('modelFile', createModelFile.files[0]);
      }

      const resProduct = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      if (!resProduct.ok) {
        const error = await resProduct.json();
        throw new Error(error.error || 'Erro ao criar produto');
      }

      const newProduct = await resProduct.json();
      const productId = newProduct.id;

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
      }

      createModal.classList.add('hidden');
      window.reloadProducts();

    } catch (err) {
      console.error('Erro ao criar produto:', err);
      alert(err.message || 'Erro ao criar produto');
    }
  });

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadCategories);
})();