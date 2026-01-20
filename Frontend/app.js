// frontend/app.js
const apiProducts = 'http://localhost:3001/products';
const apiMaterials = 'http://localhost:3001/materials';
const apiColors = 'http://localhost:3001/colors';

const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const cancelEditBtn = document.getElementById('cancelEdit');
const materialSelect = document.getElementById('material');
const colorSelect = document.getElementById('color');

// =======================
// LOAD MATERIALS
// =======================
async function loadMaterials() {
  try {
    const res = await fetch(apiMaterials);
    const materials = await res.json();

    materialSelect.innerHTML = '<option value="">Selecione o material</option>';
    materials.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.name;
      materialSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar materiais:', err);
  }
}

// =======================
// LOAD COLORS
// =======================
async function loadColors() {
  try {
    const res = await fetch(apiColors);
    const colors = await res.json();

    colorSelect.innerHTML = '<option value="">Selecione a cor</option>';
    colors.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      colorSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar cores:', err);
  }
}

// =======================
// LOAD PRODUCTS
// =======================
async function loadProducts() {
  try {
    const res = await fetch(apiProducts);
    const products = await res.json();

    productTableBody.innerHTML = '';

    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.description}</td>
        <td>${p.price}</td>
        <td>${p.material_name || '-'}</td>
        <td>${p.color_name || '-'}</td>
        <td>
          <button onclick="editProduct(${p.id})">Editar</button>
          <button onclick="deleteProduct(${p.id})">Apagar</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
  }
}

// =======================
// CREATE / UPDATE PRODUCT
// =======================
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('productId').value;
  const productData = {
    name: document.getElementById('name').value,
    description: document.getElementById('description').value,
    price: parseFloat(document.getElementById('price').value),
    material_id: materialSelect.value ? parseInt(materialSelect.value) : null,
    color_id: colorSelect.value ? parseInt(colorSelect.value) : null
  };

  const url = productId ? `${apiProducts}/${productId}` : apiProducts;
  const method = productId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    if (!res.ok) throw new Error('Erro ao salvar produto');

    productForm.reset();
    document.getElementById('productId').value = '';
    loadProducts();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar produto');
  }
});

// =======================
// EDIT PRODUCT
// =======================
async function editProduct(id) {
  try {
    const res = await fetch(`${apiProducts}/${id}`);
    const product = await res.json();

    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    materialSelect.value = product.material_id || '';
    colorSelect.value = product.color_id || '';
  } catch (err) {
    console.error(err);
    alert('Erro ao buscar produto');
  }
}

// =======================
// DELETE PRODUCT
// =======================
async function deleteProduct(id) {
  if (!confirm('Tem a certeza que quer apagar este produto?')) return;

  try {
    await fetch(`${apiProducts}/${id}`, { method: 'DELETE' });
    loadProducts();
  } catch (err) {
    console.error(err);
    alert('Erro ao apagar produto');
  }
}

// =======================
// CANCEL EDIT
// =======================
cancelEditBtn.addEventListener('click', () => {
  productForm.reset();
  document.getElementById('productId').value = '';
});

// =======================
// INIT
// =======================
loadMaterials();
loadColors();
loadProducts();
