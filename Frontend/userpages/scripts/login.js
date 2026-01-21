const API = 'http://localhost:3001/auth/login';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    console.log('Tentativa de login:', { email, password });

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      }); 

      const data = await res.json();
      console.log('Resposta do backend:', data);

      if (res.ok) {
        console.log('Login OK, salvando token e user');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        alert(`Bem-vindo, ${data.user.name}!`);
        window.location.href = '../../PaginaFrontal/html/HomePage.html';
      } else {
        console.warn('Erro no login:', data.error);
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      console.error('Erro ao iniciar sessão:', err);
      alert('Ocorreu um erro. Tenta novamente mais tarde.');
    }
  });
});
