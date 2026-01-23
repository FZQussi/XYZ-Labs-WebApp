// ==== categories.js ====
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');
  const categoriesSelects = document.querySelectorAll('[data-category-select]');

  async function loadCategories() {
    try {
      console.log('A carregar categorias...');
      const res = await fetch(`${API_BASE}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Resposta categories:', res);

      if (!res.ok) throw new Error('Erro ao carregar categorias');

      const categories = await res.json();
      console.log('Categorias recebidas:', categories);

      categoriesSelects.forEach(select => {
        select.innerHTML = '<option value="">-- Seleciona categoria --</option>';
        categories.forEach(c => {
          const option = document.createElement('option');
          option.value = c.id;
          option.textContent = c.name;
          select.appendChild(option);
        });
      });

    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadCategories);
})();
