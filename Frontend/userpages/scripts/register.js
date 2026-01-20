// Frontend/js/register.js

const API = 'http://localhost:3001/auth/register';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alert('As palavras-passe não coincidem.');
      return;
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Conta criada com sucesso! Já podes iniciar sessão.');
        window.location.href = 'login.html';
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      console.error('Erro ao registar:', err);
      alert('Ocorreu um erro. Tenta novamente mais tarde.');
    }
  });
});
