const apiProducts = 'http://localhost:3001/products';
const apiMaterials = 'http://localhost:3001/materials';
const apiColors = 'http://localhost:3001/colors';

const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const cancelEditBtn = document.getElementById('cancelEdit');

// =======================
// LOAD MATERIALS
// =======================
async function loadMaterials() {
  try {
    const res = await fetch(apiMaterials);
    const materials = await res.json();

    const select = document.getElementById('material');
    select.innerHTML = '<option value="">Selecione o material</option>';

    materials.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.name;
      select.appendChild(option);
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

    const select = document.getElementById('color');
    select.innerHTML = '<option value="">Selecione a cor</option>';

    colors.forEach(c => {
      const option = document.createElement('option');
      option.value = c.id;
      option.textContent = c.name;
      select.appendChild(option);
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

    console.log('Produtos recebidos:', products); // <-- adicionado

    productTableBody.innerHTML = '';

    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
  <td>${p.id}</td>
  <td>${p.name}</td>
  <td>${p.description}</td>
  <td>${parseFloat(p.price).toFixed(2)}</td> <!-- Aqui -->
  <td>${p.material_name ?? '-'}</td>
  <td>${p.color_name ?? '-'}</td>
  <td>${p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
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
    material_id: document.getElementById('material').value
      ? parseInt(document.getElementById('material').value)
      : null,
    color_id: document.getElementById('color').value
      ? parseInt(document.getElementById('color').value)
      : null
  };

  try {
    let url = apiProducts;
    let method = 'POST';

    if (productId) {
      url = `${apiProducts}/${productId}`;
      method = 'PUT';
    }

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
    document.getElementById('material').value = product.material_id || '';
    document.getElementById('color').value = product.color_id || '';
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
    const res = await fetch(`${apiProducts}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao apagar produto');
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
async function init() {
  await loadMaterials();
  await loadColors();
  await loadProducts();
}

init();
