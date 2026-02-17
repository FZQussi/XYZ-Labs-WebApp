const API_BASE = 'http://localhost:3001';

// Função para inicializar dashboard
async function initDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  console.log('User carregado do localStorage:', user);

  // Verifica autenticação e role
  if (!token || user.role !== 'admin') {
    alert('Acesso não autorizado');
    window.location.href = '/Frontend/userpages/html/login.html';
    return;
  }

  // Mostra mensagem de boas-vindas
  const welcomeMsg = document.getElementById('welcomeMsg');
  if (welcomeMsg) {
    welcomeMsg.textContent = `Olá, ${user.name}`;
  }
}

// Código das tabs
function initTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  const sections = document.querySelectorAll('.tab');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      // Esconde todas as sections
      sections.forEach(s => s.classList.add('hidden'));

      // Mostra a section correspondente
      const target = document.getElementById(btn.dataset.tab);
      if (target) {
        target.classList.remove('hidden');
      } else {
        console.warn(`Seção ${btn.dataset.tab} não encontrada`);
      }
    });
  });
}

// Logout
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/Frontend/userpages/html/login.html';
    });
  }
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initTabs();
  initLogout();
});
