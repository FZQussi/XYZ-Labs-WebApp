(() => {
  const API = 'http://localhost:3001/auth/register';

  document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const lengthReq = document.getElementById('lengthReq');
    const uppercaseReq = document.getElementById('uppercaseReq');
    const lowercaseReq = document.getElementById('lowercaseReq');
    const numberReq = document.getElementById('numberReq');
    const specialReq = document.getElementById('specialReq');
    const confirmError = document.getElementById('confirmError');
    const emailError = document.getElementById('emailError');

    const modal = document.getElementById('feedbackModal');
    const modalMessage = document.getElementById('modalMessage');
    const closeModal = document.getElementById('closeModal');

    closeModal.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

   function showModal(message) {
  modalMessage.textContent = message;
  modal.classList.remove('hidden'); // só aqui o modal aparece
}


    function validatePassword(password) {
      lengthReq.style.color = password.length >= 12 ? 'green' : 'red';
      uppercaseReq.style.color = /[A-Z]/.test(password) ? 'green' : 'red';
      lowercaseReq.style.color = /[a-z]/.test(password) ? 'green' : 'red';
      numberReq.style.color = /[0-9]/.test(password) ? 'green' : 'red';
      specialReq.style.color = /[^A-Za-z0-9]/.test(password) ? 'green' : 'red';

      return (
        password.length >= 12 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
      );
    }

    passwordInput.addEventListener('input', () => validatePassword(passwordInput.value));
    confirmInput.addEventListener('input', () => {
      confirmError.textContent = passwordInput.value !== confirmInput.value ? 'As passwords não coincidem' : '';
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      confirmError.textContent = '';
      emailError.textContent = '';

      const name = document.getElementById('name').value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmInput.value;

      if (password !== confirmPassword) {
        confirmError.textContent = 'As passwords não coincidem';
        return;
      }

      if (!validatePassword(password)) {
        showModal('A password não cumpre os requisitos de segurança.');
        return;
      }

      // Mostra spinner
      loadingSpinner.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          showModal('✅ Conta criada com sucesso! A redirecionar para login...');
          setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
          showModal(`❌ ${data.error || 'Erro ao criar a conta.'}`);
        }
      } catch (err) {
        console.error('Erro ao registar:', err);
        showModal('❌ Ocorreu um erro. Tenta novamente mais tarde.');
      } finally {
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  });
})();
