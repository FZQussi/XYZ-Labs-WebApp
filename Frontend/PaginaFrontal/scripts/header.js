// ==========================================
// HEADER.JS - Reutilizável em todas as páginas
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
    await initHeaderAuth();
    initMobileMenu();
    initUserDropdown();
    initHeaderSearch();
  });

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================
  async function initHeaderAuth() {
    const authButtons = document.getElementById('authButtons');
    const userIcons   = document.getElementById('userIcons');
    const token       = localStorage.getItem('token');

    if (!token) {
      if (authButtons) authButtons.style.display = 'flex';
      if (userIcons)   userIcons.style.display   = 'none';
      return;
    }

    try {
      const res  = await fetch(API_VALIDATE, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.reload();
        return;
      }

      if (authButtons) authButtons.style.display = 'none';
      if (userIcons)   userIcons.style.display   = 'flex';

    } catch (err) {
      console.error('[Header] Erro ao validar sessão:', err);
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
    const userMenuBtn     = document.getElementById('userMenuBtn');
    const userDropdown    = document.getElementById('userDropdown');
    const dropdownLinks   = document.getElementById('dropdownLinks');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const signInBtn       = document.getElementById('signInBtn');
    const signUpBtn       = document.getElementById('signUpBtn');

    const user = JSON.parse(localStorage.getItem('user') || 'null');

    // Botões Sign In / Sign Up
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

    // Dropdown só existe se estiver logado
    if (!userMenuBtn || !user || !userDropdown) return;

    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
      closeNav(); // fecha menu mobile se estiver aberto
    });

    if (dropdownUserName) {
      dropdownUserName.textContent = `Olá, ${user.name}`;
    }

    if (dropdownLinks) {
      const adminLink = user.role === 'admin'
        ? `<li><a href="/Dashboard/html/dashboard.html">Dashboard</a></li>`
        : '';

      dropdownLinks.innerHTML = `
        ${adminLink}
        <li><a href="/userpages/html/profile.html">Perfil</a></li>
        <li><a href="#" id="dropdownLogout">Logout</a></li>
      `;

      const logoutBtn = document.getElementById('dropdownLogout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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