// ==========================================
// HEADER.JS - Reutilizável em todas as páginas
// ✨ VERSÃO OTIMIZADA - Sem flicker de autenticação
// Inclui: menu mobile, dropdown utilizador,
//         pesquisa, side menu, overlay
// ==========================================

(function () {
  'use strict';

  const API_VALIDATE = '/auth/validate';

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  document.addEventListener('DOMContentLoaded', async () => {
    // A visibilidade dos botões já foi definida pelo CSS
    // Agora apenas validamos o token no servidor
    await validateAuthToken();
    
    initMobileMenu();
    initUserDropdown();
    initHeaderSearch();
    initAuthButtons();
  });

  // ==========================================
  // VALIDAÇÃO DE TOKEN
  // ==========================================
  async function validateAuthToken() {
    const token = localStorage.getItem('token');

    // Sem token = não autenticado
    if (!token) {
      return;
    }

    // Com token = validar no servidor
    try {
      const res = await fetch(API_VALIDATE, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      // Token inválido = fazer logout
      if (!res.ok || !data.valid) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.documentElement.classList.remove('authenticated');
        document.documentElement.classList.add('not-authenticated');
        
        // Recarregar página para resetar a UI
        setTimeout(() => {
          location.reload();
        }, 500);
        return;
      }

      // Token válido = manter autenticado
      console.log('[Header] Token validado com sucesso');

    } catch (err) {
      console.error('[Header] Erro ao validar sessão:', err);
      // Em caso de erro de rede, manter o utilizador logado
      // (pressumir que o backend está temporariamente indisponível)
    }
  }

  // ==========================================
  // BOTÕES DE AUTENTICAÇÃO
  // ==========================================
  function initAuthButtons() {
    const signInBtn = document.getElementById('signInBtn');
    const signUpBtn = document.getElementById('signUpBtn');

    if (signInBtn) {
      signInBtn.addEventListener('click', () => {
        window.location.href = '/userpages/html/login.html';
      });
    }

    if (signUpBtn) {
      signUpBtn.addEventListener('click', () => {
        window.location.href = '/userpages/html/register.html';
      });
    }
  }

  // ==========================================
  // MENU MOBILE (hamburger)
  // ==========================================
  function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const headerNav     = document.getElementById('headerNav');
    const overlay       = document.getElementById('overlay');
    const closeMenu     = document.getElementById('closeMenu');

    if (!mobileMenuBtn || !headerNav) return;

    // Abrir / fechar menu
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = headerNav.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active', isOpen);
      if (overlay) overlay.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Fechar ao clicar no overlay
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeNav();
        closeSide();
      });
    }

    // Fechar o side menu (carrinho/user)
    if (closeMenu) {
      closeMenu.addEventListener('click', closeSide);
    }

    // Fechar ao clicar num link do menu
    headerNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNav();
        closeSide();
      }
    });

    // Fechar menu quando janela alarga (desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeNav();
    });
  }

  function closeNav() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const headerNav     = document.getElementById('headerNav');
    const overlay       = document.getElementById('overlay');

    if (headerNav)     headerNav.classList.remove('active');
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
    if (overlay)       overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function closeSide() {
    const sideMenu = document.getElementById('sideMenu');
    const overlay  = document.getElementById('overlay');

    if (sideMenu) sideMenu.classList.remove('open');
    if (overlay)  overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ==========================================
  // DROPDOWN DO UTILIZADOR
  // ==========================================
  function initUserDropdown() {
    const userMenuBtn      = document.getElementById('userMenuBtn');
    const userDropdown     = document.getElementById('userDropdown');
    const dropdownLinks    = document.getElementById('dropdownLinks');
    const dropdownUserName = document.getElementById('dropdownUserName');

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Dropdown só existe se estiver logado
    if (!userMenuBtn || !user || !userDropdown) return;

    // Toggle dropdown
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
      closeNav(); // fecha menu mobile se estiver aberto
    });

    // Nome do utilizador
    if (dropdownUserName) {
      dropdownUserName.textContent = `Olá, ${user.name}`;
    }

    // Links do dropdown
    if (dropdownLinks) {
      const adminLink = user.role === 'admin'
        ? `<li><a href="/Dashboard/html/dashboard.html">Dashboard</a></li>`
        : '';

      dropdownLinks.innerHTML = `
        ${adminLink}
        <li><a href="/userpages/html/profile.html">Perfil</a></li>
        <li><a href="#" id="dropdownLogout">Logout</a></li>
      `;

      // Logout
      const logoutBtn = document.getElementById('dropdownLogout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.documentElement.classList.remove('authenticated');
          document.documentElement.classList.add('not-authenticated');
          location.reload();
        });
      }
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
      if (userDropdown && !userDropdown.classList.contains('hidden')) {
        userDropdown.classList.add('hidden');
      }
    });
  }

  // ==========================================
  // PESQUISA
  // ==========================================
  function initHeaderSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');

    if (!searchInput) return;

    function search() {
      const query = searchInput.value.trim();
      if (!query) return;
      window.location.href =
        `/PaginaFrontal/html/products.html?search=${encodeURIComponent(query)}`;
    }

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') search();
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', search);
    }
  }

  // ==========================================
  // API PÚBLICA (opcional, para outros scripts)
  // ==========================================
  window.headerFunctions = {
    closeNav,
    closeSide
  };

})();