

document.addEventListener('DOMContentLoaded', async () => {
  const slider = document.getElementById('categoriesSlider');
  if (!slider) return;

  try {
    // 🔹 Pegar categorias do backend
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Erro ao buscar categorias');
    const categories = await res.json();

    if (!categories.length) {
      slider.innerHTML = '<p>Nenhuma categoria disponível</p>';
      return;
    }

    // 🔹 Criar boxes dinamicamente
    slider.innerHTML = categories.map(cat => `
      <div class="category-box" data-id="${cat.id}">
        <span>${cat.name}</span>
      </div>
    `).join('');

    // 🔹 Adicionar clique nas boxes
    document.querySelectorAll('.category-box').forEach(box => {
      box.addEventListener('click', () => {
        const categoryId = box.getAttribute('data-id');
        if (!categoryId) return;

        // Redireciona para products.html com query string category=<id>
        window.location.href = `/Frontend/PaginaFrontal/html/products.html?category=${encodeURIComponent(categoryId)}`;
      });
    });

  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
    slider.innerHTML = '<p>Erro ao carregar categorias</p>';
  }
});

