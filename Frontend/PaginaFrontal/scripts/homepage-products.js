// Frontend/PaginaFrontal/scripts/homepage-products.js

const API_BASE = '';

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
    const raw = await res.json();
    const allProducts = Array.isArray(raw) ? raw : (raw.data ?? raw.products ?? []);
    
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
      ? product.images[0]
      : '/lib/images/placeholder.jpg';

    const promoBadge = product.is_on_promotion && product.discount_percent
      ? `<div class="homepage-promo-badge">🏷️ ${product.promotion_label || 'PROMOÇÃO'} -${product.discount_percent}%</div>`
      : '';

    const discounted = product.is_on_promotion && product.discount_percent
      ? (product.price_discounted
          ? Number(product.price_discounted)
          : +(Number(product.price) * (1 - product.discount_percent / 100)).toFixed(2))
      : null;

    const priceHTML = discounted
      ? `<span class="product-price homepage-price-old">€${Number(product.price).toFixed(2)}</span>
         <span class="product-price homepage-price-new">€${discounted.toFixed(2)}</span>`
      : `<span class="product-price">€${Number(product.price).toFixed(2)}</span>`;

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <img src="${image}" alt="${product.name}" loading="lazy">
          ${!product.stock ? '<div class="out-of-stock">Esgotado</div>' : ''}
          ${promoBadge}
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <div class="product-footer">
            <div class="homepage-price-group">${priceHTML}</div>
            <div class="product-actions">
              <button class="btn-view" onclick="window.location.href='product-details.html?id=${product.id}'">
                Ver Detalhes
              </button>
              ${product.stock
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
  // Injetar estilos de promoção partilhados
  if (!document.getElementById('promo-card-styles')) {
    const s = document.createElement('style');
    s.id = 'promo-card-styles';
    s.textContent = `
      .homepage-promo-badge {
        position: absolute; top: 8px; left: 8px;
        background: #dc2626; color: #fff;
        font-size: 10px; font-weight: bold;
        padding: 3px 8px;
        letter-spacing: 0.3px;
        pointer-events: none;
        z-index: 2;
      }
      .homepage-product-image { position: relative; }
      .homepage-price-group { display: flex; flex-direction: column; gap: 1px; }
      .homepage-price-old {
        text-decoration: line-through;
        color: #9ca3af !important;
        font-size: 12px !important;
      }
      .homepage-price-new {
        color: #dc2626 !important;
        font-weight: bold;
      }
    `;
    document.head.appendChild(s);
  }

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