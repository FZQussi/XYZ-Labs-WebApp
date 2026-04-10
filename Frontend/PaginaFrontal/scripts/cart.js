// Frontend/PaginaFrontal/scripts/cart.js

class ShoppingCart {
 constructor() {
  this.items = this.loadCart();
  this.updateBadge();
  this.initializeEventListeners();
}

initializeEventListeners() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
      this.items = this.loadCart();
      this.updateBadge();
    }
  });
}


  // ===== CARREGAR CARRINHO =====
  loadCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  }

  // ===== GUARDAR CARRINHO =====
 saveCart() {
  localStorage.setItem('cart', JSON.stringify(this.items));
  this.updateBadge();

  // 🔥 Evento global para sincronizar UI
  window.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: {
      items: this.items,
      count: this.getItemCount(),
      total: this.getTotal()
    }
  }));
}


  // ===== ADICIONAR PRODUTO =====
  addItem(product, quantity = 1) {
    // Verificar se está logado
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
      this.showLoginModal();
      return;
    }

    const existingItem = this.items.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      // Calcular preço com desconto se em promoção
      const isPromo = !!(product.is_on_promotion && product.discount_percent);
      const discountedPrice = isPromo
        ? (product.price_discounted
            ? Number(product.price_discounted)
            : +(Number(product.price) * (1 - product.discount_percent / 100)).toFixed(2))
        : null;

      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0] : null,
        quantity: quantity,
        // Dados de promoção
        is_on_promotion: isPromo,
        discount_percent: isPromo ? product.discount_percent : null,
        promotion_label: isPromo ? (product.promotion_label || 'PROMOÇÃO') : null,
        price_discounted: discountedPrice,
      });
    }

    this.saveCart();
    this.showNotification(`${product.name} adicionado ao carrinho!`);
  }

  // ===== MOSTRAR MODAL DE LOGIN =====
  showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-content">
        <h3>🔒 Login Necessário</h3>
        <p>Para adicionar produtos ao carrinho, precisa de iniciar sessão.</p>
        <div class="auth-modal-buttons">
          <button class="btn-login" onclick="window.location.href='/userpages/html/login.html'">
            Fazer Login
          </button>
          <button class="btn-register" onclick="window.location.href='/userpages/html/register.html'">
            Criar Conta
          </button>
          <button class="btn-cancel" onclick="this.closest('.auth-modal').remove()">
            Cancelar
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // ===== REMOVER PRODUTO =====
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
  }

  // ===== ATUALIZAR QUANTIDADE =====
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCart();
    }
  }

  // ===== LIMPAR CARRINHO =====
  clear() {
    this.items = [];
    this.saveCart();
  }

  // ===== OBTER TOTAL =====
  getTotal() {
    return this.items.reduce((sum, item) => {
      const effectivePrice = item.is_on_promotion && item.price_discounted
        ? item.price_discounted
        : item.price;
      return sum + (effectivePrice * item.quantity);
    }, 0);
  }

  // ===== OBTER NÚMERO DE ITEMS =====
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ===== ATUALIZAR BADGE =====
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = this.getItemCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  // ===== MOSTRAR CARRINHO =====
 showCart() {
  const sideMenu = document.getElementById('sideMenu');
  const sideContent = document.getElementById('sideContent');
  const overlay = document.getElementById('overlay');

  if (!sideMenu || !sideContent) {
    console.warn('SideMenu não existe nesta página');
    return;
  }

  // Ativar overlay atrás do side menu
  if (overlay) overlay.classList.add('active');

  if (!this.items.length) {
    sideContent.innerHTML = `
      <h3>🛒 Meu Carrinho</h3>
      <div class="empty-cart">
        <p>O seu carrinho está vazio</p>
        <a href="products.html" class="btn-primary">Ver Produtos</a>
      </div>
    `;
    sideMenu.classList.add('open');
    return;
  }

  const itemsHTML = this.items.map(item => {
    const effectivePrice = item.is_on_promotion && item.price_discounted
      ? item.price_discounted
      : item.price;

    const priceHTML = item.is_on_promotion && item.price_discounted
      ? `<p class="cart-item-price">
           <span style="text-decoration:line-through;color:#9ca3af;font-size:0.8em;">€${Number(item.price).toFixed(2)}</span>
           <span style="color:#dc2626;font-weight:bold;"> €${Number(item.price_discounted).toFixed(2)}</span>
         </p>`
      : `<p class="cart-item-price">€${Number(item.price).toFixed(2)}</p>`;

    const promoBadge = item.is_on_promotion && item.discount_percent
      ? `<span style="display:inline-block;background:#dc2626;color:#fff;font-size:10px;font-weight:bold;padding:2px 6px;margin-bottom:4px;letter-spacing:0.3px;">🏷️ ${item.promotion_label} -${item.discount_percent}%</span>`
      : '';

    return `
    <div class="cart-item">
      <div class="cart-item-image">
        ${item.image 
          ? `<img src="${item.image}" alt="${item.name}">`
          : '<div class="no-image">📦</div>'
        }
      </div>

      <div class="cart-item-info">
        ${promoBadge}
        <h4>${item.name}</h4>
        ${priceHTML}

        <div class="cart-item-quantity">
          <button 
            class="qty-btn"
            onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})"
          >−</button>

          <input
            type="number"
            min="1"
            value="${item.quantity}"
            class="qty-input"
            onchange="cart.updateQuantity(${item.id}, this.value)"
            oninput="this.value = Math.max(1, this.value)"
          />

          <button 
            class="qty-btn"
            onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})"
          >+</button>
        </div>
      </div>

      <button 
        class="cart-item-remove"
        onclick="cart.removeItem(${item.id})"
      >×</button>
    </div>
  `;
  }).join('');

  sideContent.innerHTML = `
    <h3>🛒 Meu Carrinho</h3>

    <div class="cart-items">
      ${itemsHTML}
    </div>

    <div class="cart-summary">
      <div class="cart-total">
        <span>Total:</span>
        <strong>€${this.getTotal().toFixed(2)}</strong>
      </div>

      <button class="btn-checkout" onclick="cart.checkout()">
        Fazer Encomenda
      </button>

      <button class="btn-clear-cart" onclick="cart.clear(); cart.showCart();">
        Limpar Carrinho
      </button>
    </div>
  `;

  sideMenu.classList.add('open');
}

  // ===== IR PARA CHECKOUT =====
  checkout() {
    if (!this.items.length) {
      alert('O seu carrinho está vazio!');
      return;
    }
    window.location.href = 'checkout.html';
  }

  // ===== NOTIFICAÇÃO =====
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Event listener para botão do carrinho
// Instância global
window.cart = new ShoppingCart();

// Listener global do botão do carrinho (funciona em todas as páginas)
document.addEventListener('click', (e) => {
  const cartButton = e.target.closest('#cartBtn');
  if (cartButton) {
    cart.showCart();
  }
});
window.addEventListener('cartUpdated', () => {
  const sideMenu = document.getElementById('sideMenu');
  if (sideMenu && sideMenu.classList.contains('open')) {
    cart.showCart();
  }
});