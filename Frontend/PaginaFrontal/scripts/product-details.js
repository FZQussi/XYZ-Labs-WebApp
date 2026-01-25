const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

async function loadProduct() {
  try {
    const res = await fetch(`http://localhost:3001/products/${productId}`);
    if (!res.ok) throw new Error('Erro ao carregar o produto');

    const p = await res.json();

    // ===== INFORMAÇÕES =====
    document.getElementById('name').textContent = p.name;
    document.getElementById('price').textContent = Number(p.price).toFixed(2);
    document.getElementById('stock').textContent = p.stock ?? 0;
    document.getElementById('description').textContent = p.description;

    // ===== MODELO 3D =====
    if (p.model_file) {
      document.getElementById('model').src = `http://localhost:3001/models/${p.model_file}`;
    }

    // ===== IMAGENS / SLIDER =====
    const images = p.images || [];
    const slideImg = document.getElementById('slideImg');
    const thumbs = [
      document.getElementById('thumb1'),
      document.getElementById('thumb2'),
      document.getElementById('thumb3'),
      document.getElementById('thumb4'),
    ];

    // Preencher miniaturas
    thumbs.forEach((thumb, idx) => {
      const filename = images[idx];
      if (filename) {
        thumb.src = `http://localhost:3001/images/${filename}`;
        thumb.classList.remove('empty');
      } else {
        thumb.src = '/Frontend/lib/images/placeholder.png';
        thumb.classList.add('empty');
      }

      thumb.addEventListener('click', () => {
        currentIndex = idx;
        updateSlide();
      });
    });

    // Estado do slider
    let currentIndex = 0;
    const firstValid = thumbs.findIndex(t => !t.classList.contains('empty'));
    if (firstValid >= 0) currentIndex = firstValid;

    function updateSlide() {
      slideImg.src = thumbs[currentIndex].src;
      thumbs.forEach(t => t.classList.remove('active'));
      thumbs[currentIndex].classList.add('active');
    }

    updateSlide();

    // Botões
    document.getElementById('prevBtn').addEventListener('click', () => {
      doSlide(-1);
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
      doSlide(1);
    });

    function doSlide(dir) {
      const validThumbs = thumbs.filter(t => !t.classList.contains('empty'));
      if (!validThumbs.length) return;

      let idx = validThumbs.findIndex(t => t === thumbs[currentIndex]);
      idx = (idx + dir + validThumbs.length) % validThumbs.length;

      currentIndex = thumbs.indexOf(validThumbs[idx]);
      updateSlide();
    }

    // Swipe para mobile
    let startX = 0;
    slideImg.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    });
    slideImg.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].clientX;
      if (endX - startX > 50) doSlide(-1); // swipe right
      else if (startX - endX > 50) doSlide(1); // swipe left
    });

  } catch (err) {
    console.error('Erro ao carregar o produto:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadProduct);
