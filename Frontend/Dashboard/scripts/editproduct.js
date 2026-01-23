(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  // ===== ELEMENTOS MODAL =====
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

  let categories = [];
  let subcategories = [];

  // ===== AUTENTICAÇÃO =====
  function authHeaders() { return { Authorization: `Bearer ${token}` }; }

  function showModal() { editModal.classList.remove('hidden'); }
  function hideModal() { editModal.classList.add('hidden'); }

  // ===== LOAD CATEGORIES E SUBCATEGORIES =====
  async function loadCategoriesAndSubcategories() {
    try {
      const [catRes, subcatRes] = await Promise.all([
        fetch(`${API_BASE}/categories`, { headers: authHeaders() }),
        fetch(`${API_BASE}/subcategories`, { headers: authHeaders() }),
      ]);

      categories = await catRes.json();
      subcategories = await subcatRes.json();

      console.log('Categorias para editar:', categories);
      console.log('Subcategorias para editar:', subcategories);

      // Popular select categoria
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

  // ===== OPEN MODAL VIA EVENTO =====
  document.addEventListener('openEditProductModal', (e) => {
    const product = e.detail;

    editId.value = product.id;
    editName.value = product.name;
    editPrice.value = product.price;
    editDesc.value = product.description;
    editStock.value = product.stock ?? 0;
    editFile.value = '';

    // Seleciona categoria/subcategoria corretas
    const subcat = subcategories.find(sc => sc.id == product.subcategory_id);
    if (subcat) {
      editCategorySelect.value = subcat.category_id;
      updateSubcategories();
      editSubcatSelect.value = subcat.id;
    } else {
      editCategorySelect.value = '';
      editSubcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';
    }

    showModal();
  });

  editCloseBtn.addEventListener('click', hideModal);

  // ===== SUBMIT EDIT =====
  editForm.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editName.value);
    formData.append('price', editPrice.value);
    formData.append('description', editDesc.value);
    formData.append('category_id', editCategorySelect.value || null);
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
      console.log('Produto editado com sucesso!');
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error('Erro ao guardar alterações:', err);
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
      console.log('Produto eliminado com sucesso!');
      hideModal();
      window.reloadProducts();
    } catch (err) {
      console.error('Erro ao eliminar produto:', err);
      alert('Erro ao eliminar produto');
    }
  });

  document.addEventListener('DOMContentLoaded', loadCategoriesAndSubcategories);
})();
