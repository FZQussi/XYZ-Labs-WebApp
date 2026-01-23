(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  // ===== ELEMENTOS PRODUTOS =====
  const productsList = document.getElementById('productsList');

  // ===== MODAL CRIAR =====
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

  // ===== MODAL EDITAR =====
  const editModal = document.getElementById('editProductModal');
  const editForm = document.getElementById('editProductForm');
  const editId = document.getElementById('editId');
  const editName = document.getElementById('editName');
  const editPrice = document.getElementById('editPrice');
  const editDesc = document.getElementById('editDescription');
  const editStock = document.getElementById('editStock');
  const editFile = document.getElementById('editFile');
  const editCloseBtn = editModal.querySelector('[data-close="edit"]');
  const deleteBtn = document.getElementById('deleteProductBtn');
  const editCategorySelect = document.getElementById('editCategory');
  const editSubcatSelect = document.getElementById('editSubcategory');

  // ===== AUTENTICAÇÃO =====
  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== FUNÇÕES MODAL =====
  function showModal(modal) {
    modal.classList.remove('hidden');
  }
  function hideModal(modal) {
    modal.classList.add('hidden');
  }

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    productsList.innerHTML = 'A carregar produtos...';
    try {
      const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar produtos');
      const data = await res.json();

      productsList.innerHTML = '';
      if (!data.length) {
        productsList.innerHTML = '<p>Sem produtos.</p>';
        return;
      }

      data.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
          <div>
            <strong>${p.name}</strong><br>
            €${p.price} · Stock: ${p.stock ?? 0}
          </div>
          <button class="action-btn">Editar</button>
        `;
        div.querySelector('button').addEventListener('click', () => openEditModal(p));
        productsList.appendChild(div);
      });
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      productsList.innerHTML = 'Erro ao carregar produtos.';
    }
  }

  // ===== CREATE =====
  addProductBtn.addEventListener('click', () => {
    createForm.reset();
    createCategorySelect.value = '';
    createSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    showModal(createModal);
  });

  createCloseBtn.addEventListener('click', () => hideModal(createModal));

  createForm.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', createName.value);
    formData.append('price', createPrice.value);
    formData.append('description', createDesc.value);
    formData.append('subcategory_id', createSubcatSelect.value || null);
    formData.append('stock', createStock.value || 0);
    if (createFile.files[0]) formData.append('modelFile', createFile.files[0]);

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });
      if (!res.ok) throw new Error('Erro ao criar produto');
      hideModal(createModal);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar produto');
    }
  });

  // ===== EDIT =====
  function openEditModal(product) {
    editId.value = product.id;
    editName.value = product.name;
    editPrice.value = product.price;
    editDesc.value = product.description;
    editStock.value = product.stock ?? 0;
    editFile.value = '';

    // Categoria/subcategoria serão atualizadas pelos ficheiros categories.js e subcategories.js
    editCategorySelect.value = '';
    editSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';

    showModal(editModal);
  }

  editCloseBtn.addEventListener('click', () => hideModal(editModal));

  editForm.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editName.value);
    formData.append('price', editPrice.value);
    formData.append('description', editDesc.value);
    formData.append('subcategory_id', editSubcatSelect.value || null);
    formData.append('stock', editStock.value || 0);
    if (editFile.files[0]) formData.append('modelFile', editFile.files[0]);

    try {
      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: formData
      });
      if (!res.ok) throw new Error('Erro ao guardar alterações');
      hideModal(editModal);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar alterações');
    }
  });

  // ===== DELETE =====
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('Tens a certeza que queres eliminar este produto?')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${editId.value}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Erro ao eliminar produto');
      hideModal(editModal);
      loadProducts();
    } catch (err) {
      console.error(err);
      alert('Erro ao eliminar produto');
    }
  });

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
  });

})();

