// Frontend/scripts/homePage-responsive.js

const API_VALIDATE = 'http://localhost:3001/auth/validate';

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar autenticação
  await initializeAuth();
  
  // Inicializar menu mobile
  initializeMobileMenu();
  
  // Inicializar dropdown do utilizador
  initializeUserDropdown();
  
  // Inicializar pesquisa
  initializeSearch();
  
  // Verificar modal de sucesso de pedido
  checkOrderSuccess();
  
  // Inicializar ajustes responsivos
  initializeResponsiveAdjustments();
});

// ==========================================
// AUTENTICAÇÃO
// ==========================================
async function initializeAuth() {
  const userArea = document.getElementById('userArea');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authButtons = document.getElementById('authButtons');
  const userIcons = document.getElementById('userIcons');
  const token = localStorage.getItem('token');

  // Se não há token → visitante
  if (!token) {
    if (authButtons) authButtons.style.display = 'flex';
    if (userIcons) userIcons.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(API_VALIDATE, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    // Token inválido ou expirado
    if (!res.ok || !data.valid) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
      return;
    }

    // Token válido
    const user = data.user;
    
    if (authButtons) authButtons.style.display = 'none';
    if (userIcons) userIcons.style.display = 'flex';

    // Se for admin, pode mostrar opções admin
    if (user.role === 'admin') {
      console.log('Utilizador admin logado');
    }

  } catch (err) {
    console.error('Erro ao validar sessão:', err);
  }
}

// ==========================================
// MENU MOBILE
// ==========================================
function initializeMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const headerNav = document.getElementById('headerNav');
  const overlay = document.getElementById('overlay');
  const closeMenu = document.getElementById('closeMenu');

  if (!mobileMenuBtn || !headerNav) return;

  // Toggle menu mobile
  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });

  // Fechar ao clicar no overlay
  if (overlay) {
    overlay.addEventListener('click', () => {
      closeMobileMenu();
      closeSideMenu();
    });
  }

  // Fechar menu lateral
  if (closeMenu) {
    closeMenu.addEventListener('click', () => {
      closeSideMenu();
    });
  }

  // Fechar menu ao clicar nos links
  const navLinks = headerNav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Fechar com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeSideMenu();
    }
  });
}

function toggleMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const headerNav = document.getElementById('headerNav');
  const overlay = document.getElementById('overlay');

  if (!headerNav) return;

  const isActive = headerNav.classList.toggle('active');
  
  if (mobileMenuBtn) {
    mobileMenuBtn.classList.toggle('active', isActive);
  }
  
  if (overlay) {
    overlay.classList.toggle('active', isActive);
  }

  // Prevenir scroll do body quando menu está aberto
  document.body.style.overflow = isActive ? 'hidden' : '';
}

function closeMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const headerNav = document.getElementById('headerNav');
  const overlay = document.getElementById('overlay');

  if (headerNav) headerNav.classList.remove('active');
  if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  
  document.body.style.overflow = '';
}

function closeSideMenu() {
  const sideMenu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  
  if (sideMenu) sideMenu.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  
  document.body.style.overflow = '';
}

// ==========================================
// DROPDOWN DO UTILIZADOR
// ==========================================
function initializeUserDropdown() {
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  const dropdownLinks = document.getElementById('dropdownLinks');
  const dropdownUserName = document.getElementById('dropdownUserName');
  const signInBtn = document.getElementById('signInBtn');
  const signUpBtn = document.getElementById('signUpBtn');

  const user = JSON.parse(localStorage.getItem('user'));

  // Botões Sign In / Sign Up
  if (signInBtn) {
    signInBtn.addEventListener('click', () => {
      window.location.href = '../../userpages/html/login.html';
    });
  }

  if (signUpBtn) {
    signUpBtn.addEventListener('click', () => {
      window.location.href = '../../userpages/html/register.html';
    });
  }

  // Dropdown do utilizador
  if (userMenuBtn && user && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
      
      // Fechar menu mobile se estiver aberto
      closeMobileMenu();
    });

    if (dropdownUserName) {
      dropdownUserName.textContent = `Olá, ${user.name}`;
    }

    let adminLink = '';
    if (user.role === 'admin') {
      adminLink = `<li><a href="../../Dashboard/html/dashboard.html">Dashboard</a></li>`;
    }

    if (dropdownLinks) {
      dropdownLinks.innerHTML = `
        ${adminLink}
        <li><a href="../../userpages/html/profile.html">Perfil</a></li>
        <li><a href="#" id="dropdownLogout">Logout</a></li>
      `;

      const logoutBtn = document.getElementById('dropdownLogout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      }
    }
  }

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', () => {
    if (userDropdown && !userDropdown.classList.contains('hidden')) {
      userDropdown.classList.add('hidden');
    }
  });
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  alert('Sessão terminada');
  location.reload();
}

// ==========================================
// PESQUISA
// ==========================================
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (!searchInput) return;

  function goToProductsSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    window.location.href = `/Frontend/PaginaFrontal/html/products.html?search=${encodeURIComponent(query)}`;
  }

  // Enter para pesquisar
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      goToProductsSearch();
    }
  });

  // Clique no ícone
  if (searchBtn) {
    searchBtn.addEventListener('click', goToProductsSearch);
  }
}

// ==========================================
// MODAL DE SUCESSO DE PEDIDO
// ==========================================
function checkOrderSuccess() {
  const lastOrderId = sessionStorage.getItem('lastOrderId');
  if (lastOrderId) {
    showSuccessModal(lastOrderId);
    sessionStorage.removeItem('lastOrderId');
  }
}

function showSuccessModal(orderId) {
  const modal = document.getElementById('successModal');
  const orderNumber = document.getElementById('orderNumber');

  if (!modal || !orderNumber) return;

  orderNumber.textContent = orderId;
  modal.classList.remove('hidden');

  // Fechar modal após 5 segundos
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 5000);
}

// ==========================================
// AJUSTES RESPONSIVOS
// ==========================================
function initializeResponsiveAdjustments() {
  // Detectar orientação e ajustar
  handleOrientationChange();
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', debounce(handleResize, 250));
  
  // Melhorar performance em touch devices
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }
  
  // Lazy loading de imagens
  if ('IntersectionObserver' in window) {
    initializeLazyLoading();
  }
}

function handleOrientationChange() {
  const isLandscape = window.matchMedia('(orientation: landscape)').matches;
  const isSmallScreen = window.innerWidth <= 768;
  
  if (isLandscape && isSmallScreen) {
    document.body.classList.add('landscape-mobile');
  } else {
    document.body.classList.remove('landscape-mobile');
  }
}

function handleResize() {
  // Fechar menus ao mudar tamanho
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
  
  // Ajustar carousel se necessário
  adjustCarouselSpeed();
}

function adjustCarouselSpeed() {
  const carouselTrack = document.querySelector('.carousel-track');
  if (!carouselTrack) return;
  
  const screenWidth = window.innerWidth;
  
  // Ajustar velocidade baseado no tamanho da tela
  if (screenWidth <= 480) {
    carouselTrack.style.animationDuration = '70s';
  } else if (screenWidth <= 768) {
    carouselTrack.style.animationDuration = '60s';
  } else if (screenWidth <= 1024) {
    carouselTrack.style.animationDuration = '50s';
  } else {
    carouselTrack.style.animationDuration = '40s';
  }
}

// ==========================================
// LAZY LOADING
// ==========================================
function initializeLazyLoading() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  // Observar imagens com data-src
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Detectar se está em modo offline
window.addEventListener('online', () => {
  console.log('Conexão restaurada');
});

window.addEventListener('offline', () => {
  console.log('Sem conexão à internet');
  alert('Parece que está sem conexão à internet. Algumas funcionalidades podem não estar disponíveis.');
});

// Prevenir zoom em inputs (iOS)
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
  }
}

// ==========================================
// PERFORMANCE MONITORING
// ==========================================
if (window.performance && window.performance.timing) {
  window.addEventListener('load', () => {
    const loadTime = window.performance.timing.domContentLoadedEventEnd - 
                     window.performance.timing.navigationStart;
    console.log(`Página carregada em ${loadTime}ms`);
  });
}

// ==========================================
// EXPORTAR FUNÇÕES (se necessário)
// ==========================================
window.appFunctions = {
  closeMobileMenu,
  closeSideMenu,
  logout,
  toggleMobileMenu
};