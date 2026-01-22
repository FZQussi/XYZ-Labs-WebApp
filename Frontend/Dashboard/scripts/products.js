(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const addBtn = document.getElementById('addProductBtn');
  const modal = document.getElementById('productModal');
  const closeModal = document.getElementById('closeModal');
  const form = document.getElementById('productForm');

  async function loadProducts() {
    try {
      console.log('A carregar products...');
      const res = await fetch(`${API_BASE}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Produtos recebidos:', data);

      const productsList = document.getElementById('productsList');
      productsList.innerHTML = '';

      data.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.innerHTML = `
          <span>${p.name} - €${p.price}</span>
          <button class="action-btn" data-id="${p.id}">Editar</button>
        `;
        productsList.appendChild(div);

        div.querySelector('button').addEventListener('click', () => {
          alert(`Editar produto: ${p.name}`);
        });
      });
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  document.addEventListener('DOMContentLoaded', loadProducts);
})();
