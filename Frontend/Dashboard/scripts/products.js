// ==== products.js ====
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const productsList = document.getElementById('productsList');

  // ===== AUTENTICAÇÃO =====
  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    productsList.innerHTML = '<div style="padding:10px">A carregar produtos...</div>';

    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: authHeaders()
      });

      if (!res.ok) throw new Error('Erro ao carregar produtos');

      const products = await res.json();
      console.log('Produtos recebidos:', products);

      productsList.innerHTML = '';

      if (!products.length) {
        productsList.innerHTML = '<div style="padding:10px">Sem produtos.</div>';
        return;
      }

      products.forEach(p => {
        const row = document.createElement('div');
        row.className = 'product-item';

        row.innerHTML = `
          <span class="product-name">${p.name}</span>
          <span>€${Number(p.price).toFixed(2)}</span>
          <span>${p.stock ?? 0}</span>
          <span class="status ${p.is_active ? 'active' : 'inactive'}">
            ${p.is_active ? 'Ativo' : 'Inativo'}
          </span>
          <div class="actions">
            <button class="secondary-btn view-btn">Detalhes</button>
            <button class="primary-btn edit-btn">Editar</button>
          </div>
        `;

        // ===== BOTÃO VER =====
        row.querySelector('.view-btn').addEventListener('click', () => {
          document.dispatchEvent(
            new CustomEvent('openViewProductModal', { detail: p })
          );
        });

        // ===== BOTÃO EDITAR =====
        row.querySelector('.edit-btn').addEventListener('click', () => {
          document.dispatchEvent(
            new CustomEvent('openEditProductModal', { detail: p })
          );
        });

        productsList.appendChild(row);
      });
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      productsList.innerHTML =
        '<div style="padding:10px;color:red">Erro ao carregar produtos.</div>';
    }
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadProducts);

  // Permite reload a partir de outros módulos
  window.reloadProducts = loadProducts;
})();
