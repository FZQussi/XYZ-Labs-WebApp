// ==== products.js ====
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const productsList = document.getElementById('productsList');

  // Modal elements
  const createModal = document.getElementById('createProductModal');
  const editModal = document.getElementById('editProductModal');

  // ===== AUTENTICAÇÃO =====
  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== FUNÇÕES MODAL =====
  function showModal(modal) { modal.classList.remove('hidden'); }
  function hideModal(modal) { modal.classList.add('hidden'); }

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    productsList.innerHTML = 'A carregar produtos...';
    try {
      const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Erro ao carregar produtos');

      const data = await res.json();
      console.log('Produtos recebidos:', data);

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
        div.querySelector('button').addEventListener('click', () => {
          // Dispara evento custom para o módulo editProduct.js
          document.dispatchEvent(new CustomEvent('openEditProductModal', { detail: p }));
        });
        productsList.appendChild(div);
      });
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      productsList.innerHTML = 'Erro ao carregar produtos.';
    }
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadProducts);

  // Permite recarregar produtos de outros módulos
  window.reloadProducts = loadProducts;
})();
