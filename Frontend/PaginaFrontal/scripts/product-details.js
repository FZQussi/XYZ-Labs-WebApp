const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

async function loadProduct() {
  const res = await fetch(`http://localhost:3001/products/${productId}`);
  const p = await res.json();

  document.getElementById('name').textContent = p.name;
  document.getElementById('price').textContent = p.price;
  document.getElementById('stock').textContent = p.stock;
  document.getElementById('description').textContent = p.description;

  if (p.model_file) {
    document.getElementById('model').src =
      `http://localhost:3001/models/${p.model_file}`;
  }

 // ===== IMAGENS =====
const images = p.images || [];

for (let i = 1; i <= 4; i++) {
  const imgEl = document.getElementById(`productImg${i}`);
  const filename = images[i - 1];

  if (filename) {
    imgEl.src = `http://localhost:3001/images/${filename}`;
    imgEl.style.display = 'block';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'block'; // mantém o espaço (layout fixo)
    imgEl.classList.add('empty');
  }
}

}
document.querySelectorAll('.thumbs img').forEach(img => {
  img.addEventListener('click', () => {
    document.getElementById('mainImage').src = img.src;
  });
});

loadProduct();
