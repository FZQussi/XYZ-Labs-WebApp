const apiBase = 'http://localhost:3001/products';

const productForm = document.getElementById('productForm');
const productTableBody = document.getElementById('productTableBody');
const cancelEditBtn = document.getElementById('cancelEdit');

// Função para listar todos os produtos
async function loadProducts() {
  try {
    const res = await fetch(apiBase);
    const products = await res.json();
    productTableBody.innerHTML = '';

    products.forEach(p => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.description}</td>
        <td>${p.price}</td>
        <td>${p.material_id || '-'}</td>
        <td>${p.color_id || '-'}</td>
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

// Criar ou atualizar produto
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('productId').value;
  const productData = {
    name: document.getElementById('name').value,
    description: document.getElementById('description').value,
    price: parseFloat(document.getElementById('price').value),
    material_id: document.getElementById('material').value || null,
    color_id: document.getElementById('color').value || null
  };

  try {
    let res;
    if (productId) {
      res = await fetch(`${apiBase}/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    } else {
      res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
    }

    if (!res.ok) throw new Error('Erro ao salvar produto');

    productForm.reset();
    document.getElementById('productId').value = '';
    loadProducts();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar produto');
  }
});

// Editar produto
async function editProduct(id) {
  try {
    const res = await fetch(`${apiBase}/${id}`);
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

// Cancelar edição
cancelEditBtn.addEventListener('click', () => {
  productForm.reset();
  document.getElementById('productId').value = '';
});

// Apagar produto
async function deleteProduct(id) {
  if (!confirm('Tem certeza que quer apagar este produto?')) return;

  try {
    await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    loadProducts();
  } catch (err) {
    console.error(err);
    alert('Erro ao apagar produto');
  }
}

// Inicializar
loadProducts();
