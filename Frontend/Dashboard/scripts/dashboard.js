const API_BASE = 'http://localhost:3001';

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/Frontend/userpages/html/login.html';
});

// Verifica token e role
async function initDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || user.role !== 'admin') {
    alert('Acesso não autorizado');
    window.location.href = '/Frontend/userpages/html/login.html';
    return;
  }

  // Mostra mensagem de boas-vindas
  document.getElementById('welcomeMsg').textContent = `Olá, ${user.name}`;

  // Puxa dados protegidos do backend
  try {
    const res = await fetch(`${API_BASE}/admin/data`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      alert('Não foi possível carregar dados do admin');
      return;
    }

    const data = await res.json();
    document.getElementById('adminData').textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error('Erro ao carregar dados admin:', err);
  }
}

initDashboard();
