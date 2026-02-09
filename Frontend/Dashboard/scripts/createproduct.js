// Frontend/Dashboard/scripts/createproduct.js - ATUALIZADO PARA MÚLTIPLAS CATEGORIAS
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
  
  // NOVO: Container para seleção de múltiplas categorias
  const categoriesContainer = document.getElementById('createCategoriesContainer');
  const dynamicAttributesContainer = document.getElementById('dynamicAttributesContainer');

  let categories = [];
  let currentAttributes = [];
  let selectedCategories = new Set();

  // ===== AUTENTICAÇÃO =====
  function authHeaders() { return { Authorization: `Bearer ${token}` }; }

  // ===== LOAD CATEGORIES =====
  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`, { headers: authHeaders() });
      categories = await res.json();
      
      renderCategoriesSelection();
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }

  // ===== RENDERIZAR SELEÇÃO DE CATEGORIAS =====
  function renderCategoriesSelection() {
    if (!categoriesContainer) {
      console.error('Container de categorias não encontrado');
      return;
    }

    categoriesContainer.innerHTML = `
      <h4 style="margin:20px 0 10px;font-size:14px;text-transform:uppercase;">
        Categorias do Produto *
      </h4>
      <p style="font-size:12px;color:#666;margin-bottom:10px;">
        Seleciona todas as categorias onde este produto deve aparecer. 
        A primeira categoria selecionada será a categoria primária.
      </p>
      <div class="categories-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
        ${categories.map((cat, index) => `
          <label class="category-checkbox-item" style="
            display:flex;
            align-items:center;
            gap:8px;
            padding:10px;
            border:2px solid #e5e7eb;
            border-radius:6px;
            cursor:pointer;
            transition:all 0.3s ease;
          " data-category-id="${cat.id}">
            <input 
              type="checkbox" 
              value="${cat.id}" 
              class="category-checkbox"
              style="cursor:pointer;"
            >
            <span style="font-size:14px;font-weight:600;">${cat.name}</span>
            <span class="primary-badge" style="
              display:none;
              margin-left:auto;
              background:#10b981;
              color:white;
              font-size:10px;
              padding:2px 8px;
              border-radius:12px;
              font-weight:700;
            ">PRIMÁRIA</span>
          </label>
        `).join('')}
      </div>
      <p id="categoriesError" style="color:#ef4444;font-size:12px;margin-top:10px;display:none;">
        ⚠️ Seleciona pelo menos uma categoria
      </p>
    `;

    // Event listeners para checkboxes
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', handleCategorySelection);
    });

    // Estilos hover
    document.querySelectorAll('.category-checkbox-item').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.borderColor = '#2563eb';
        this.style.backgroundColor = '#eff6ff';
      });
      item.addEventListener('mouseleave', function() {
        const checkbox = this.querySelector('.category-checkbox');
        if (!checkbox.checked) {
          this.style.borderColor = '#e5e7eb';
          this.style.backgroundColor = 'transparent';
        }
      });
    });
  }

  // ===== HANDLE CATEGORY SELECTION =====
  function handleCategorySelection(e) {
    const categoryId = parseInt(e.target.value);
    const label = e.target.closest('.category-checkbox-item');
    const primaryBadge = label.querySelector('.primary-badge');

    if (e.target.checked) {
      selectedCategories.add(categoryId);
      label.style.borderColor = '#2563eb';
      label.style.backgroundColor = '#eff6ff';
      
      // Se for a primeira categoria, marcar como primária
      if (selectedCategories.size === 1) {
        primaryBadge.style.display = 'inline-block';
      }
    } else {
      selectedCategories.delete(categoryId);
      label.style.borderColor = '#e5e7eb';
      label.style.backgroundColor = 'transparent';
      primaryBadge.style.display = 'none';
      
      // Se remover a primária, marcar a próxima como primária
      if (selectedCategories.size > 0 && primaryBadge.style.display === 'inline-block') {
        const firstCategory = Array.from(selectedCategories)[0];
        const firstLabel = document.querySelector(`.category-checkbox-item[data-category-id="${firstCategory}"]`);
        const firstBadge = firstLabel.querySelector('.primary-badge');
        firstBadge.style.display = 'inline-block';
      }
    }

    // Esconder erro se pelo menos uma categoria estiver selecionada
    if (selectedCategories.size > 0) {
      document.getElementById('categoriesError').style.display = 'none';
    }
  }

  // ===== LOAD ATTRIBUTES (se necessário no futuro) =====
  async function loadAttributesForCategory(categoryId) {
    // Por agora, atributos estão associados a subcategorias no sistema antigo
    // No novo sistema, podes associar atributos diretamente às categorias se necessário
    dynamicAttributesContainer.innerHTML = '';
  }

  // ===== COLLECT ATTRIBUTES VALUES =====
  function collectAttributesValues() {
    const attributes = {};
    currentAttributes.forEach(attr => {
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

  // ===== MODAL OPEN/CLOSE =====
  addProductBtn.addEventListener('click', () => {
    createForm.reset();
    selectedCategories.clear();
    renderCategoriesSelection();
    dynamicAttributesContainer.innerHTML = '';
    createModal.classList.remove('hidden');
  });

  createCloseBtn.addEventListener('click', () => {
    createModal.classList.add('hidden');
  });

  // ===== FORM SUBMIT =====
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar que pelo menos uma categoria foi selecionada
    if (selectedCategories.size === 0) {
      document.getElementById('categoriesError').style.display = 'block';
      return;
    }

    try {
      const attributes = collectAttributesValues();
      const categoryIdsArray = Array.from(selectedCategories);
      const primaryCategoryId = categoryIdsArray[0]; // Primeira categoria é a primária

      // === 1️⃣ Criar produto com dados e modelo 3D ===
      const formData = new FormData();
      formData.append('name', createName.value);
      formData.append('price', createPrice.value);
      formData.append('description', createDesc.value);
      formData.append('stock', createStock.checked);
      formData.append('category_ids', JSON.stringify(categoryIdsArray));
      formData.append('primary_category_id', primaryCategoryId);
      formData.append('attributes', JSON.stringify(attributes));

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
      alert(err.message || 'Erro ao criar produto');
    }
  });

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadCategories);
})();