document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('viewProductModal');

  const nameEl = document.getElementById('viewName');
  const priceEl = document.getElementById('viewPrice');
  const stockEl = document.getElementById('viewStock');
  const statusEl = document.getElementById('viewStatus');
  const descEl = document.getElementById('viewDescription');
  const catEl = document.getElementById('viewCategory');
  const subcatEl = document.getElementById('viewSubcategory');
  const modelViewer = document.getElementById('viewModel');

  function show() { modal.classList.remove('hidden'); }
  function hide() { modal.classList.add('hidden'); }

  modal.querySelector('[data-close="view"]').addEventListener('click', hide);

  // Evento para abrir modal
  document.addEventListener('openViewProductModal', async e => {
    const p = e.detail;
    console.log('🚀 Produto recebido no modal:', p);

    // Dados básicos
    nameEl.textContent = p.name;
    priceEl.textContent = Number(p.price).toFixed(2);
    stockEl.textContent = p.stock ?? 0;
    statusEl.textContent = p.is_active ? 'Ativo' : 'Inativo';
    descEl.textContent = p.description;
    catEl.textContent = p.category_name ?? '—';
    subcatEl.textContent = p.subcategory_name ?? '—';

    // Modelo 3D
    if (p.model_file) {
      modelViewer.src = `http://localhost:3001/models/${p.model_file}`;
      console.log('📦 Model 3D:', modelViewer.src);
      modelViewer.style.backgroundColor = '#cccccc';
      modelViewer.style.color = '#005f6b';
    } else {
      modelViewer.src = '';
    }

    // Imagens do produto
    const images = p.images || [];
    console.log('🖼️ Imagens do produto:', images);

    for (let i = 1; i <= 4; i++) {
      const imgEl = document.getElementById(`productImg${i}`);
      const filename = images[i - 1];
      if (filename) {
        const srcPath = `http://localhost:3001/images/${filename}`;
        imgEl.src = srcPath;
        console.log(`🔹 Imagem ${i} src:`, srcPath);
        imgEl.style.display = 'block';
      } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
      }
    }

    show();
  });
});
