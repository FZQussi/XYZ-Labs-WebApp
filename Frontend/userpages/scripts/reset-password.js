(() => {
  const API = '/reset-password';

  document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const resetForm = document.getElementById('resetForm');
    const confirmError = document.getElementById('confirmError');
    const modal = document.getElementById('feedbackModal');
    const modalMessage = document.getElementById('modalMessage');
    const closeModal = document.getElementById('closeModal');
    const passwordBubble = document.querySelector('.password-bubble');

    closeModal.addEventListener('click', () => modal.classList.add('hidden'));

    function showModal(message) {
      console.log('Modal:', message);
      modalMessage.textContent = message;
      modal.classList.remove('hidden');
    }

    function validatePassword(password) {
      const rules = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
      };
      const items = passwordBubble.querySelectorAll('li');
      items.forEach(item => {
        const rule = item.dataset.rule;
        item.classList.toggle('valid', rules[rule]);
        item.classList.toggle('invalid', !rules[rule]);
      });
      return Object.values(rules).every(Boolean);
    }

    passwordInput.addEventListener('focus', () => passwordBubble.classList.add('show'));
    passwordInput.addEventListener('blur', () => passwordBubble.classList.remove('show'));
    passwordInput.addEventListener('input', () => validatePassword(passwordInput.value));

    confirmInput.addEventListener('input', () => {
      confirmError.textContent = passwordInput.value !== confirmInput.value
        ? 'As passwords não coincidem' : '';
    });

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    console.log('Token da URL:', token);

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // ❌ Impede refresh da página
      confirmError.textContent = '';

      const password = passwordInput.value;
      const confirmPassword = confirmInput.value;

      console.log('Submetendo password', password, 'Token', token);

      if (password !== confirmPassword) {
        confirmError.textContent = 'As passwords não coincidem';
        return;
      }

      if (!validatePassword(password)) {
        showModal('A password não cumpre os requisitos de segurança.');
        return;
      }

      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password })
        });

        const data = await res.json();
        console.log('Resposta backend:', data);

        if (res.ok) {
          showModal('✅ Password redefinida com sucesso!');
          setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
          showModal(`❌ ${data.error || 'Erro ao redefinir a password'}`);
        }
      } catch (err) {
        console.error('Erro fetch:', err);
        showModal('❌ Erro ao redefinir a password. Tenta novamente mais tarde.');
      }
    });
  });
})();