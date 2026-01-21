// Frontend/js/auth.js

const API_BASE = 'http://localhost:3001';

/* ======================
   GET USER DA SESSÃO
====================== */
function getCurrentUser() {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!user || !token) return null;

  return {
    user: JSON.parse(user),
    token
  };
}

/* ======================
   VERIFICA SE ESTÁ LOGADO
====================== */
function requireAuth(redirect = true) {
  const session = getCurrentUser();

  if (!session) {
    if (redirect) {
      window.location.href = '/Frontend/userpages/html/login.html';
    }
    return false;
  }

  return true;
}

/* ======================
   VERIFICA ROLE
====================== */
function requireRole(role) {
  const session = getCurrentUser();

  if (!session || session.user.role !== role) {
    alert('Acesso não autorizado');
    window.location.href = '/Frontend/PaginaFrontal/html/HomePage.html';
    return false;
  }

  return true;
}

/* ======================
   VALIDAR TOKEN NO BACKEND
====================== */
async function validateToken() {
  const session = getCurrentUser();
  if (!session) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/validate`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });

    if (!res.ok) {
      logout();
      return false;
    }

    return true;
  } catch (err) {
    console.error('Erro ao validar token', err);
    logout();
    return false;
  }
}

/* ======================
   LOGOUT
====================== */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/Frontend/userpages/html/login.html';
}
