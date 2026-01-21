// Frontend/scripts/homePage.js

const API_VALIDATE = 'http://localhost:3001/auth/validate';

document.addEventListener('DOMContentLoaded', async () => {
  const userArea = document.getElementById('userArea');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const token = localStorage.getItem('token');

  // 🔹 Se não há token → visitante
  if (!token) {
    userArea.textContent = 'Olá, visitante';
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
    userArea.textContent = 'Olá, visitante';
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

  // Verifica se user está logado
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (token && user) {
    authButtons.style.display = 'none';
    userIcons.style.display = 'flex';
 
  }

  // Menu lateral
  function openMenu(content) {
    sideContent.innerHTML = content;
    sideMenu.classList.add('open');
  }

  userMenuBtn.addEventListener('click', () => {
     const content = `
      <h3>Olá, ${user.name}</h3>
      <ul>
        <li><a href="profile.html">Perfil</a></li>
        <li><a href="orders.html">Encomendas</a></li>
        <li><a href="#" id="logoutBtn">Logout</a></li>
      </ul>
      
    `;
    openMenu(content);

    document.getElementById('logout').addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
    });
  });

  cartBtn.addEventListener('click', () => {
    const content = `
      <h3>Meu Carrinho</h3>
      <p>Carrinho ainda vazio</p>
    `;
    openMenu(content);
  });

  closeMenu.addEventListener('click', () => {
    sideMenu.classList.remove('open');
  });
});
