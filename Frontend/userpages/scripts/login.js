// Frontend/js/login.js

const API = 'http://localhost:3001/auth/login';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar token no localStorage (ou sessionStorage)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        alert(`Bem-vindo, ${data.user.name}!`);
        window.location.href = 'homePage.html'; // redireciona para a homepage
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      console.error('Erro ao iniciar sessão:', err);
      alert('Ocorreu um erro. Tenta novamente mais tarde.');
    }
  });
});
