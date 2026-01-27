document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // Se não estiver logado, redireciona
    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');

    profileUsername.value = user.name || 'Não definido';
    profileEmail.value = user.email || 'Não definido';

    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Botão alterar password
    changePasswordBtn.addEventListener('click', () => {
        window.location.href = 'reset-password.html';
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        window.location.href = '../../PaginaFrontal/html/HomePage.html';
        });

    }
});
