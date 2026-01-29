// Frontend/PaginaFrontal/scripts/product-details.js

const API_BASE = 'http://localhost:3001';

// Estado do produto e slider
let currentProduct = null;
let currentSlideIndex = 0;
let productImages = [];
let autoRotateEnabled = true;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  console.log('Product ID da URL:', productId);

  if (!productId) {
    console.error('Nenhum ID de produto encontrado na URL');
    alert('Produto não encontrado!');
    window.location.href = 'products.html';
    return;
  }

  loadProduct(productId);
  setupEventListeners();
});

// ===== CARREGAR PRODUTO =====
async function loadProduct(productId) {
  console.log('A carregar produto ID:', productId);

  try {
    const url = `${API_BASE}/products/${productId}`;
    console.log('URL da requisição:', url);

    const res = await fetch(url);
    console.log('Status da resposta:', res.status);

    if (!res.ok) {
      throw new Error(`Erro ${res.status}: Produto não encontrado`);
    }

    currentProduct = await res.json();
    console.log('Produto carregado:', currentProduct);

    renderProduct();

  } catch (err) {
    console.error('Erro ao carregar produto:', err);
    alert('Erro ao carregar produto. Verifique o console para mais detalhes.');
    // Comentei o redirect para debugging
    // window.location.href = 'products.html';
  }
}

// ===== RENDERIZAR PRODUTO =====
function renderProduct() {
  if (!currentProduct) {
    console.error('Nenhum produto para renderizar');
    return;
  }

  console.log('A renderizar produto:', currentProduct.name);

  // ===== Breadcrumb =====
  const breadcrumb = document.getElementById('breadcrumbProduct');
  if (breadcrumb) breadcrumb.textContent = currentProduct.name;

  // ===== Informações básicas =====
  const nameEl = document.getElementById('productName');
  const priceEl = document.getElementById('productPrice');
  const descEl = document.getElementById('productDescription');

  if (nameEl) nameEl.textContent = currentProduct.name;
  if (priceEl) priceEl.textContent = Number(currentProduct.price).toFixed(2);
  if (descEl) descEl.textContent = currentProduct.description || 'Sem descrição disponível';

  // ===== Categoria e Stock =====
  const categoryEl = document.getElementById('productCategory');
  const stockEl = document.getElementById('productStock');
  const inStock = !!currentProduct.stock;

  if (categoryEl) {
    if (currentProduct.category_name) {
      categoryEl.textContent = currentProduct.category_name;
      categoryEl.style.display = '';
    } else {
      categoryEl.style.display = 'none';
    }
  }

  if (stockEl) {
    stockEl.textContent = inStock ? 'Disponível' : 'Esgotado';
    stockEl.style.color = inStock ? 'green' : 'red';
    stockEl.classList.toggle('out-of-stock', !inStock);
  }

  // ===== Botão adicionar ao carrinho =====
  const addBtn = document.getElementById('addToCartBtn');
  if (addBtn) addBtn.disabled = !inStock;

  // ===== Especificações =====
  const specMaterial = document.getElementById('specMaterial');
  const specCategory = document.getElementById('specCategory');
  const specStock = document.getElementById('specStock');

  if (specMaterial) specMaterial.textContent = currentProduct.material || 'PLA';
  if (specCategory) specCategory.textContent = currentProduct.category_name || 'Geral';
  if (specStock) {
    specStock.textContent = inStock ? 'Disponível' : 'Esgotado';
    specStock.style.color = inStock ? 'green' : 'red';
  }

  // ===== Galeria =====
  setupGallery();

  // ===== Modelo 3D =====
  const open3DBtn = document.getElementById('open3DBtn');
  if (currentProduct.model_file) {
    const modelViewer = document.getElementById('model3D');
    if (modelViewer) {
      modelViewer.src = `${API_BASE}/models/${currentProduct.model_file}`;

      // ⚡ Alterar cor do modelo de forma confiável
      modelViewer.addEventListener('load', () => {
        const model = modelViewer.model; // THREE.Group interno
        if (!model) {
          console.warn('Modelo 3D não carregou ainda.');
          return;
        }

        // Percorrer todos os meshes e mudar cor
        model.scene.traverse((node) => {
          if (node.isMesh && node.material) {
            // Remove textura se quiser cor sólida
            if (node.material.map) node.material.map = null;

            node.material.color.set('#60a5c5'); // azul bebê
            node.material.needsUpdate = true;
          }
        });
      });
    }

    const modalTitle = document.getElementById('modal3DTitle');
    if (modalTitle) modalTitle.textContent = `Modelo 3D: ${currentProduct.name}`;
  } else {
    if (open3DBtn) open3DBtn.style.display = 'none';
  }

  // ===== Título da página =====
  document.title = `${currentProduct.name} - XYZ Labs`;
}


// ===== CONFIGURAR GALERIA =====
function setupGallery() {
  productImages = currentProduct.images || [];

  console.log('Imagens do produto:', productImages);

  // Se não houver imagens, usar placeholder
  if (productImages.length === 0) {
    productImages = ['placeholder.jpg'];
  }

  // Renderizar imagem principal
  updateMainImage();

  // Renderizar miniaturas
  renderThumbnails();

  // Renderizar indicadores
  renderIndicators();
}

// ===== ATUALIZAR IMAGEM PRINCIPAL =====
function updateMainImage() {
  const mainImage = document.getElementById('mainImage');
  if (!mainImage) return;

  const currentImage = productImages[currentSlideIndex];
  let imageUrl;

  if (currentImage === 'placeholder.jpg') {
    imageUrl = '/Frontend/images/placeholder.jpg';
  } else if (currentImage && currentImage.startsWith('http')) {
    imageUrl = currentImage;
  } else if (currentImage) {
    imageUrl = `${API_BASE}/images/${currentImage}`;
  } else {
    imageUrl = '/Frontend/images/placeholder.jpg';
  }

  console.log('Carregando imagem:', imageUrl);
  
  mainImage.src = imageUrl;
  mainImage.alt = currentProduct ? currentProduct.name : 'Produto';

  // Atualizar indicadores
  updateIndicators();
}

// ===== RENDERIZAR MINIATURAS =====
function renderThumbnails() {
  const container = document.getElementById('thumbnails');
  if (!container) return;

  container.innerHTML = '';

  productImages.forEach((image, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail';
    
    if (index === currentSlideIndex) {
      thumbnail.classList.add('active');
    }

    const img = document.createElement('img');
    
    let imageUrl;
    if (image === 'placeholder.jpg') {
      imageUrl = '/Frontend/images/placeholder.jpg';
    } else if (image.startsWith('http')) {
      imageUrl = image;
    } else {
      imageUrl = `${API_BASE}/images/${image}`;
    }
    
    img.src = imageUrl;
    img.alt = `${currentProduct.name} - Imagem ${index + 1}`;
    img.loading = 'lazy';

    // Tratamento de erro de imagem
    img.onerror = () => {
      img.src = '/Frontend/images/placeholder.jpg';
    };

    thumbnail.appendChild(img);
    thumbnail.addEventListener('click', () => {
      currentSlideIndex = index;
      updateMainImage();
      updateThumbnails();
    });

    container.appendChild(thumbnail);
  });

  // Preencher slots vazios se houver menos de 4 imagens
  const emptySlots = Math.max(0, 4 - productImages.length);
  for (let i = 0; i < emptySlots; i++) {
    const emptyThumb = document.createElement('div');
    emptyThumb.className = 'thumbnail empty';
    emptyThumb.textContent = '📦';
    container.appendChild(emptyThumb);
  }
}

// ===== ATUALIZAR MINIATURAS =====
function updateThumbnails() {
  const thumbnails = document.querySelectorAll('.thumbnail:not(.empty)');
  thumbnails.forEach((thumb, index) => {
    if (index === currentSlideIndex) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

// ===== RENDERIZAR INDICADORES =====
function renderIndicators() {
  const container = document.getElementById('sliderIndicators');
  if (!container) return;

  container.innerHTML = '';

  if (productImages.length <= 1) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';

  productImages.forEach((_, index) => {
    const indicator = document.createElement('div');
    indicator.className = 'indicator';
    
    if (index === currentSlideIndex) {
      indicator.classList.add('active');
    }

    indicator.addEventListener('click', () => {
      currentSlideIndex = index;
      updateMainImage();
      updateThumbnails();
    });

    container.appendChild(indicator);
  });
}

// ===== ATUALIZAR INDICADORES =====
function updateIndicators() {
  const indicators = document.querySelectorAll('.indicator');
  indicators.forEach((indicator, index) => {
    if (index === currentSlideIndex) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  });
}

// ===== NAVEGAÇÃO DO SLIDER =====
function nextSlide() {
  currentSlideIndex = (currentSlideIndex + 1) % productImages.length;
  updateMainImage();
  updateThumbnails();
}

function prevSlide() {
  currentSlideIndex = (currentSlideIndex - 1 + productImages.length) % productImages.length;
  updateMainImage();
  updateThumbnails();
}

// ===== CONFIGURAR EVENT LISTENERS =====
function setupEventListeners() {
  // Slider
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');

  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Teclado
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('modal3D');
    const isModalOpen = modal && !modal.classList.contains('hidden');
    
    if (!isModalOpen) {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    }
    
    if (e.key === 'Escape' && isModalOpen) {
      closeModal3D();
    }
  });

  // Touch Swipe (mobile)
  let touchStartX = 0;
  let touchEndX = 0;

  const mainImage = document.getElementById('mainImage');
  
  if (mainImage) {
    mainImage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    mainImage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }

  function handleSwipe() {
    if (touchEndX < touchStartX - 50) nextSlide();
    if (touchEndX > touchStartX + 50) prevSlide();
  }

 // Quantidade
const qtyPlus = document.getElementById('qtyPlus');
const qtyMinus = document.getElementById('qtyMinus');
const qtyInput = document.getElementById('quantity');
const addCartBtn = document.getElementById('addToCartBtn');

if (qtyPlus) {
  qtyPlus.addEventListener('click', () => {
    if (!currentProduct || !currentProduct.stock) return; // Não faz nada se indisponível
    let currentQty = parseInt(qtyInput.value);
    if (currentQty < 99) { // limite máximo
      qtyInput.value = currentQty + 1;
    }
  });
}

if (qtyMinus) {
  qtyMinus.addEventListener('click', () => {
    let currentQty = parseInt(qtyInput.value);
    if (currentQty > 1) {
      qtyInput.value = currentQty - 1;
    }
  });
}

// Adicionar ao carrinho
if (addCartBtn) {
  addCartBtn.addEventListener('click', () => {
    if (!currentProduct) return;

    // Verifica disponibilidade
    if (!currentProduct.stock) {
      alert('Produto esgotado!');
      return;
    }

    const quantity = parseInt(qtyInput.value);
    
    if (typeof cart !== 'undefined') {
      cart.addItem(currentProduct, quantity);

      // Feedback visual
      const originalText = addCartBtn.innerHTML;
      addCartBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Adicionado!
      `;
      addCartBtn.style.background = '#2e7d32';

      setTimeout(() => {
        addCartBtn.innerHTML = originalText;
        addCartBtn.style.background = '';
      }, 2000);

      qtyInput.value = 1; // Reset quantidade
    } else {
      alert('Erro ao adicionar ao carrinho. Por favor, recarregue a página.');
    }
  });
}

  // Modal 3D
  const open3DBtn = document.getElementById('open3DBtn');
  const close3DBtn = document.getElementById('close3DBtn');
  const modal3D = document.getElementById('modal3D');

  if (open3DBtn) {
    open3DBtn.addEventListener('click', openModal3D);
  }

  if (close3DBtn) {
    close3DBtn.addEventListener('click', closeModal3D);
  }
  
  // Fechar modal ao clicar fora
  if (modal3D) {
    modal3D.addEventListener('click', (e) => {
      if (e.target.id === 'modal3D') {
        closeModal3D();
      }
    });
  }

  // Controles do modelo 3D
  const resetBtn = document.getElementById('resetView');
  const toggleBtn = document.getElementById('toggleRotation');

  if (resetBtn) {
    resetBtn.addEventListener('click', resetModelView);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleRotation);
  }
}

// ===== ADICIONAR AO CARRINHO =====
function addToCart() {
  if (!currentProduct) {
    console.error('Nenhum produto carregado');
    return;
  }

  const qtyInput = document.getElementById('quantity');
  const quantity = parseInt(qtyInput.value);
  
  // Validar stock
  const stock = currentProduct.stock || 0;
  if (quantity > stock) {
    alert(`Stock insuficiente! Disponível: ${stock}`);
    return;
  }

  // Adicionar ao carrinho (usando a instância global do cart.js)
  if (typeof cart !== 'undefined') {
    cart.addItem(currentProduct, quantity);
    
    // Feedback visual
    const btn = document.getElementById('addToCartBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Adicionado!
    `;
    btn.style.background = '#2e7d32';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
    }, 2000);

    // Reset quantidade
    qtyInput.value = 1;

  } else {
    console.error('Cart system não está disponível');
    alert('Erro ao adicionar ao carrinho. Por favor, recarregue a página.');
  }
}

// ===== MODAL 3D =====
function openModal3D() {
  const modal = document.getElementById('modal3D');
  if (!modal) return;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  // Iniciar rotação automática
  const modelViewer = document.getElementById('model3D');
  if (modelViewer && autoRotateEnabled) {
    modelViewer.setAttribute('auto-rotate', '');
  }
}

function closeModal3D() {
  const modal = document.getElementById('modal3D');
  if (!modal) return;

  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function resetModelView() {
  const modelViewer = document.getElementById('model3D');
  if (!modelViewer) return;

  modelViewer.cameraOrbit = '45deg 55deg 2.5m';
  modelViewer.fieldOfView = '45deg';
}

function toggleRotation() {
  const modelViewer = document.getElementById('model3D');
  const btn = document.getElementById('toggleRotation');
  
  if (!modelViewer || !btn) return;

  autoRotateEnabled = !autoRotateEnabled;
  
  if (autoRotateEnabled) {
    modelViewer.setAttribute('auto-rotate', '');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      </svg>
      Pausar Rotação
    `;
  } else {
    modelViewer.removeAttribute('auto-rotate');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      Retomar Rotação
    `;
  }
}