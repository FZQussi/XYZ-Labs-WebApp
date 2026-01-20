const API = 'http://localhost:3001';

const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const cancelEditBtn = document.getElementById('cancelEdit');

// Pegar os inputs
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const priceInput = document.getElementById('price');
const fileInput = document.getElementById('modelFile');
const productIdInput = document.getElementById('productId');

// =========================
// LOAD PRODUCTS
// =========================
async function loadProducts() {
  const products = await fetch(`${API}/products`).then(r => r.json());

  productTableBody.innerHTML = products.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>€${Number(p.price).toFixed(2)}</td>
      <td>
        <button onclick="editProduct(${p.id})">Editar</button>
        <button onclick="deleteProduct(${p.id})">Apagar</button>
      </td>
    </tr>
  `).join('');
}

// =========================
// CREATE / UPDATE
// =========================
productForm.addEventListener('submit', async e => {
  e.preventDefault();

  if (!fileInput.files.length && !productIdInput.value) {
    alert('Por favor, carregue um ficheiro .glb.');
    return;
  }

  const formData = new FormData();
  formData.append('name', nameInput.value);
  formData.append('description', descriptionInput.value);
  formData.append('price', Number(priceInput.value));

  // Apenas adiciona ficheiro se existir
  if (fileInput.files.length > 0) {
    formData.append('modelFile', fileInput.files[0]);
  }

  const method = productIdInput.value ? 'PUT' : 'POST';
  const url = productIdInput.value ? `${API}/products/${productIdInput.value}` : `${API}/products`;

  const res = await fetch(url, { method, body: formData });

  if (res.ok) {
    productForm.reset();
    productIdInput.value = '';
    loadProducts(); // recarrega tabela
    alert('Produto salvo com sucesso!');
  } else {
    const err = await res.json();
    alert('Erro: ' + err.error);
  }
});

// =========================
// EDIT
// =========================
async function editProduct(id) {
  const product = await fetch(`${API}/products/${id}`).then(r => r.json());

  productIdInput.value = product.id;
  nameInput.value = product.name;
  descriptionInput.value = product.description;
  priceInput.value = product.price;

  // Limpa input do ficheiro (não podemos preencher)
  fileInput.value = '';
}

// =========================
// DELETE
// =========================
async function deleteProduct(id) {
  if (!confirm('Apagar produto?')) return;
  await fetch(`${API}/products/${id}`, { method: 'DELETE' });
  loadProducts();
}

// =========================
// CANCEL EDIT
// =========================
cancelEditBtn.addEventListener('click', () => {
  productForm.reset();
  productIdInput.value = '';
});

// =========================
// INIT
// =========================
async function init() {
  await loadProducts();
}

init();
