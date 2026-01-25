// Frontend/PaginaFrontal/scripts/homepage-products.js

const API_BASE = 'http://localhost:3001';

// ===== LOAD FEATURED PRODUCTS =====
async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  
  try {
    const res = await fetch(`${API_BASE}/products`);
    const allProducts = await res.json();
    
    // Mostrar apenas os 6 mais recentes
    const featuredProducts = allProducts.slice(0, 8);
    
    if (!featuredProducts.length) {
      container.innerHTML = '<p class="no-products">Nenhum produto disponível</p>';
      return;
    }
    
    container.innerHTML = featuredProducts.map(product => {
      const image = product.images && product.images[0] 
        ? `${API_BASE}/images/${product.images[0]}` 
        : '/Frontend/images/placeholder.jpg';
      
      return `
        <div class="product-card">
          <div class="product-image">
            <img src="${image}" alt="${product.name}" loading="lazy">
            ${product.stock <= 0 ? '<div class="out-of-stock">Esgotado</div>' : ''}
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-description">${truncateText(product.description, 80)}</p>
            <div class="product-footer">
              <span class="product-price">€${Number(product.price).toFixed(2)}</span>
              <div class="product-actions">
                <button class="btn-view" onclick="window.location.href='product-details.html?id=${product.id}'">
                  Ver Detalhes
                </button>
                ${product.stock > 0 
                  ? `<button class="btn-add-cart" onclick="addProductToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
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
    
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    container.innerHTML = '<p class="error">Erro ao carregar produtos</p>';
  }
}

// ===== ADD PRODUCT TO CART =====
function addProductToCart(product) {
  if (cart) {
    cart.addItem(product, 1);
  }
}

// ===== TRUNCATE TEXT =====
function truncateText(text, maxLength) {
  return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ===== MOBILE MENU =====
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const headerNav = document.getElementById('headerNav');
  const overlay = document.getElementById('overlay');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      headerNav.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', () => {
      headerNav.classList.remove('active');
      overlay.classList.remove('active');
      const sideMenu = document.getElementById('sideMenu');
      if (sideMenu) sideMenu.classList.remove('open');
    });
  }
  
  // Close menu when clicking on link
  document.querySelectorAll('.header-nav a').forEach(link => {
    link.addEventListener('click', () => {
      headerNav.classList.remove('active');
      overlay.classList.remove('active');
    });
  });
  
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