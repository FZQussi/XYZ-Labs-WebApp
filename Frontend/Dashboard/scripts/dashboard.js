const API_BASE = 'http://localhost:3001';

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/Frontend/userpages/html/login.html';
});

// Inicializa dashboard
async function initDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  console.log('User carregado do localStorage:', user);

  if (!token || user.role !== 'admin') {
    alert('Acesso não autorizado');
    window.location.href = '/Frontend/userpages/html/login.html';
    return;
  }

  document.getElementById('welcomeMsg').textContent = `Olá, ${user.name}`;
}

initDashboard();

// Tabs
const tabs = document.querySelectorAll('[data-tab]');
const sections = document.querySelectorAll('.tab');

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    sections.forEach(s => s.classList.add('hidden'));
    document.getElementById(btn.dataset.tab).classList.remove('hidden');
  });
});
