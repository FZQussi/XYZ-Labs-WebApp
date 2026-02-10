// ==== subcategories.js ====
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');
  let subcategories = [];
  const subcatSelects = document.querySelectorAll('[data-subcat-select]');
  const categorySelects = document.querySelectorAll('[data-category-select]');

  async function loadSubcategories() {
    try {
      console.log('A carregar subcategorias...');
      const res = await fetch(`${API_BASE}/subcategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Resposta subcategories:', res);

      if (!res.ok) throw new Error('Erro ao carregar subcategorias');
      subcategories = await res.json();
      console.log('Subcategorias recebidas:', subcategories);

    } catch (err) {
      console.error('Erro ao carregar subcategorias:', err);
    }
  }

  function updateSubcategories(categorySelect, subcatSelect) {
    console.log(`Atualizando subcategorias para categoria ${categorySelect.value}`);
    subcatSelect.innerHTML = '<option value="">-- Seleciona subcategoria --</option>';

    const filtered = subcategories.filter(sc => sc.category_id == categorySelect.value);
    console.log('Subcategorias filtradas:', filtered);

    filtered.forEach(sc => {
      const option = document.createElement('option');
      option.value = sc.id;
      option.textContent = sc.name;
      subcatSelect.appendChild(option);
    });
  }

  categorySelects.forEach(catSelect => {
    const subcatSelect = Array.from(subcatSelects).find(s => s.dataset.forCategory == catSelect.id);
    if (!subcatSelect) console.warn('Subcategory select não encontrado para', catSelect.id);

    catSelect.addEventListener('change', () => updateSubcategories(catSelect, subcatSelect));
  });

  document.addEventListener('DOMContentLoaded', loadSubcategories);
})();
