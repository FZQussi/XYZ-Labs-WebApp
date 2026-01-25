//createproduct.js
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
  const createFile = document.getElementById('createFile');
  const addProductBtn = document.getElementById('addProductBtn');
  const createCloseBtn = createModal.querySelector('[data-close="create"]');
  const createCategorySelect = document.getElementById('createCategory');
  const createSubcatSelect = document.getElementById('createSubcategory');

  let categories = [];
  let subcategories = [];

  // ===== AUTENTICAÇÃO =====
  function authHeaders() { return { Authorization: `Bearer ${token}` }; }

  // ===== FUNÇÕES MODAL =====
  function showModal() { createModal.classList.remove('hidden'); }
  function hideModal() { createModal.classList.add('hidden'); }

  // ===== LOAD CATEGORIES E SUBCATEGORIES =====
  async function loadCategoriesAndSubcategories() {
    try {
      const [catRes, subcatRes] = await Promise.all([
        fetch(`${API_BASE}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/subcategories`, { headers: authHeaders() }),
      ]);

      categories = await catRes.json();
      subcategories = await subcatRes.json();

      console.log('Categorias recebidas:', categories);
      console.log('Subcategorias recebidas:', subcategories);

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

  function updateSubcategories() {
    const catId = createCategorySelect.value;
    createSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    subcategories.filter(sc => sc.category_id == catId).forEach(sc => {
      const option = document.createElement('option');
      option.value = sc.id;
      option.textContent = sc.name;
      createSubcatSelect.appendChild(option);
    });
  }

  createCategorySelect.addEventListener('change', updateSubcategories);

  // ===== MODAL E FORM =====
  addProductBtn.addEventListener('click', () => {
    createForm.reset();
    createCategorySelect.value = '';
    createSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    showModal();
  });

  createCloseBtn.addEventListener('click', hideModal);
createForm.addEventListener('submit', async e => {
  e.preventDefault();

  try {
    // === 1️⃣ Criar produto com dados e modelo 3D ===
    const formData = new FormData();
    formData.append('name', createName.value);
    formData.append('price', createPrice.value);
    formData.append('description', createDesc.value);
    formData.append('category_id', createCategorySelect.value || null);
    formData.append('subcategory_id', createSubcatSelect.value || null);
    formData.append('stock', createStock.checked);


    if (createModelFile.files[0]) {
      formData.append('modelFile', createModelFile.files[0]);
    }

    const resProduct = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: authHeaders(), // Apenas auth, não usar 'Content-Type', o browser define
      body: formData
    });

    if (!resProduct.ok) throw new Error('Erro ao criar produto');

    const newProduct = await resProduct.json();
    const productId = newProduct.id;
    console.log('Produto criado com sucesso!', newProduct);

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
      const uploadedImages = await resImages.json();
      console.log('Imagens enviadas com sucesso:', uploadedImages);
    }

    hideModal();
    window.reloadProducts(); // recarrega lista no products.js

  } catch (err) {
    console.error('Erro ao criar produto:', err);
    alert('Erro ao criar produto');
  }
});

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadCategoriesAndSubcategories);
})();
