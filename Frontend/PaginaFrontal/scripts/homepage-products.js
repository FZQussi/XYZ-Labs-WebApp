// Frontend/PaginaFrontal/scripts/homepage-products.js

const API_BASE = 'http://localhost:3001';

// ===== FUNÇÃO PARA EMBARALHAR ARRAY (FISHER-YATES SHUFFLE) =====
function shuffleArray(array) {
  const shuffled = [...array]; // Cria uma cópia do array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ===== LOAD FEATURED PRODUCTS - CAROUSEL INFINITO =====
async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  
  try {
    const res = await fetch(`${API_BASE}/products`);
    const allProducts = await res.json();
    
    // Embaralhar produtos aleatoriamente
    const shuffledProducts = shuffleArray(allProducts);
    
    // Mostrar apenas 10 produtos aleatórios
    const featuredProducts = shuffledProducts.slice(0, 10);
    
    if (!featuredProducts.length) {
      container.innerHTML = '<p class="no-products">Nenhum produto disponível</p>';
      return;
    }
    
    // Criar HTML do carousel
    const carouselHTML = createInfiniteCarousel(featuredProducts);
    container.innerHTML = carouselHTML;
    
    // Adicionar event listeners aos cards
    addHomeCardClickListeners();
    
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    container.innerHTML = '<p class="error">Erro ao carregar produtos</p>';
  }
}

// ===== CRIAR CAROUSEL INFINITO =====
function createInfiniteCarousel(products) {
  // Duplicar produtos para criar efeito infinito
  const duplicatedProducts = [...products, ...products];
  
  const productsHTML = duplicatedProducts.map(product => {
    const image = product.images && product.images[0] 
      ? `${API_BASE}/images/${product.images[0]}` 
      : '/Frontend/images/placeholder.jpg';
    
    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <img src="${image}" alt="${product.name}" loading="lazy">
          ${product.stock <= 0 ? '<div class="out-of-stock">Esgotado</div>' : ''}
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="product-footer">
            <span class="product-price">€${Number(product.price).toFixed(2)}</span>
            <div class="product-actions">
              <button class="btn-view" onclick="window.location.href='product-details.html?id=${product.id}'">
                Ver Detalhes
              </button>
              ${product.stock > 0 
                ? `<button class="btn-add-cart" onclick="event.stopPropagation(); addProductToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                     🛒
                   </button>`
                : ''
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="carousel-container">
      <div class="carousel-track">
        ${productsHTML}
      </div>
    </div>
  `;
}

// ===== ADD CARD CLICK LISTENERS (HOMEPAGE) =====
function addHomeCardClickListeners() {
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Não redirecionar se clicar nos botões
      if (e.target.closest('.btn-view') || e.target.closest('.btn-add-cart')) {
        return;
      }
      
      const productId = card.getAttribute('data-id');
      window.location.href = `product-details.html?id=${productId}`;
    });
  });
}

// ===== ADD PRODUCT TO CART =====
function addProductToCart(product) {
  if (typeof cart !== 'undefined' && cart) {
    cart.addItem(product, 1);
  } else {
    // Fallback se o cart não estiver disponível
    console.log('Produto adicionado:', product);
    alert(`${product.name} adicionado ao carrinho!`);
  }
}

// ===== TRUNCATE TEXT =====
function truncateText(text, maxLength) {
  return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();

  // Newsletter form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;
      alert(`Obrigado por subscrever! Email registado: ${email}`);
      newsletterForm.reset();
    });
  }
});