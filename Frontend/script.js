const apiBase = 'http://localhost:3001/products';

// Função para listar produtos
async function fetchProducts() {
  const res = await fetch(apiBase);
  const products = await res.json();
  const list = document.getElementById('products');
  list.innerHTML = '';

  products.forEach(prod => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${prod.name}</strong> - ${prod.description} - €${prod.basePrice.toFixed(2)}
      <button onclick="editProduct(${prod.id})">Editar</button>
      <button onclick="deleteProduct(${prod.id})">Eliminar</button>
    `;
    list.appendChild(li);
  });
}

// Criar ou atualizar produto
document.getElementById('saveBtn').addEventListener('click', async () => {
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('name').value;
  const description = document.getElementById('description').value;
  const basePrice = parseFloat(document.getElementById('basePrice').value);
  const fileInput = document.getElementById('file');

  if (!name || !basePrice) return alert('Nome e preço são obrigatórios!');

  // Para já apenas guardamos o nome do ficheiro
  let filename = fileInput.files[0]?.name || '';

  const payload = { name, description, basePrice, filename };

  if (id) {
    // Update
    await fetch(`${apiBase}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    // Create
    await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  document.getElementById('product-id').value = '';
  document.getElementById('name').value = '';
  document.getElementById('description').value = '';
  document.getElementById('basePrice').value = '';
  document.getElementById('file').value = '';

  fetchProducts();
});

// Editar produto
async function editProduct(id) {
  const res = await fetch(`${apiBase}/${id}`);
  const prod = await res.json();
  document.getElementById('product-id').value = prod.id;
  document.getElementById('name').value = prod.name;
  document.getElementById('description').value = prod.description;
  document.getElementById('basePrice').value = prod.basePrice;
}

// Eliminar produto
async function deleteProduct(id) {
  if (confirm('Tem a certeza que quer eliminar este produto?')) {
    await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    fetchProducts();
  }
}

// Inicializar lista
fetchProducts();
