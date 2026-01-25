// Frontend/scripts/homePage.js

const API_VALIDATE = 'http://localhost:3001/auth/validate';

document.addEventListener('DOMContentLoaded', async () => {
  const userArea = document.getElementById('userArea');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const token = localStorage.getItem('token');

  // 🔹 Se não há token → visitante
  if (!token) {
   
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(API_VALIDATE, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    // 🔹 Token inválido ou expirado
    if (!res.ok || !data.valid) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
      return;
    }

    // 🔹 Token válido
    const user = data.user;

    
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';

    // 🔐 Exemplo: se for admin podes mostrar menu admin
    if (user.role === 'admin') {
      console.log('Utilizador admin logado');
      // aqui podes mostrar links admin no futuro
    }

  } catch (err) {
    console.error('Erro ao validar sessão:', err);
   
  }

  // 🔹 Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Sessão terminada');
    location.reload();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const authButtons = document.getElementById('authButtons');
  const userIcons = document.getElementById('userIcons');
  const userName = document.getElementById('userName');
  const sideMenu = document.getElementById('sideMenu');
  const sideContent = document.getElementById('sideContent');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const cartBtn = document.getElementById('cartBtn');
  const closeMenu = document.getElementById('closeMenu');
  const signInBtn = document.getElementById('signInBtn');
  const signUpBtn = document.getElementById('signUpBtn');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // 🔹 Não logado
  if (!token || !user) {
    authButtons.style.display = 'flex';
    userIcons.style.display = 'none';
  } else {
    authButtons.style.display = 'none';
    userIcons.style.display = 'flex';
    
  }

  // 👉 Sign In
  if (signInBtn) {
    signInBtn.addEventListener('click', () => {
      window.location.href = '../../userpages/html/login.html';
    });
  }

  // 👉 Sign Up
  if (signUpBtn) {
    signUpBtn.addEventListener('click', () => {
      window.location.href = '../../userpages/html/register.html';
    });
  }

  // Menu lateral
  function openMenu(content) {
    sideContent.innerHTML = content;
    sideMenu.classList.add('open');
  }

  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', () => {
      let adminLink = '';

      if (user.role === 'admin') {
        adminLink = `<li><a href="../../Dashboard/html/dashboard.html">Dashboard</a></li>`;
      }

      const content = `
        <h3>Olá, ${user.name}</h3>
        <ul>
          ${adminLink}
          <li><a href="profile.html">Perfil</a></li>
          <li><a href="orders.html">Encomendas</a></li>
          <li><a href="#" id="logoutLink">Logout</a></li>
        </ul>
      `;

      openMenu(content);

      document.getElementById('logoutLink').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.reload();
      });
    });
  }

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      openMenu(`
        <h3>Meu Carrinho</h3>
        <p>Carrinho ainda vazio</p>
      `);
    });
  }

  if (closeMenu) {
    closeMenu.addEventListener('click', () => {
      sideMenu.classList.remove('open');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (!searchInput) return;

  function goToProductsSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Redireciona com query string
    window.location.href =
      `/Frontend/PaginaFrontal/html/products.html?search=${encodeURIComponent(query)}`;
  }

  // 🔎 Enter
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      goToProductsSearch();
    }
  });

  // 🔎 Clique no ícone
  if (searchBtn) {
    searchBtn.addEventListener('click', goToProductsSearch);
  }
});
