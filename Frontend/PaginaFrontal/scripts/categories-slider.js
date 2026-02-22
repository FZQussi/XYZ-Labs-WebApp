document.addEventListener('DOMContentLoaded', async () => {
  const slider = document.getElementById('categoriesSlider');
  if (!slider) return;

  try {
    const res = await fetch('/api/categories/primary');
    if (!res.ok) throw new Error('Erro ao buscar categorias');
    const categories = await res.json();

    if (!categories.length) {
      slider.innerHTML = '<p>Nenhuma categoria disponível</p>';
      return;
    }

    slider.innerHTML = categories.map(cat => `
      <div class="category-box" data-id="${cat.id}">
        <span>${cat.name}</span>
      </div>
    `).join('');

    document.querySelectorAll('.category-box').forEach(box => {
      box.addEventListener('click', () => {
        const categoryId = box.getAttribute('data-id');
        if (!categoryId) return;
        window.location.href = `/PaginaFrontal/html/products.html?primary=${encodeURIComponent(categoryId)}`;
      });
    });

  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
    slider.innerHTML = '<p>Erro ao carregar categorias</p>';
  }
});