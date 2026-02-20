(() => {
  const API = '/auth/register';

  document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const confirmError = document.getElementById('confirmError');
    const emailError = document.getElementById('emailError');

    const modal = document.getElementById('feedbackModal');
    const modalMessage = document.getElementById('modalMessage');
    const closeModal = document.getElementById('closeModal');

    // Cria referência ao balão
    const passwordBubble = document.createElement('div');
    passwordBubble.classList.add('password-bubble');
    passwordBubble.innerHTML = `
      <ul class="password-reqs">
        <li data-rule="length">≥ 12 caracteres</li>
        <li data-rule="uppercase">Letra maiúscula</li>
        <li data-rule="lowercase">Letra minúscula</li>
        <li data-rule="number">Número</li>
        <li data-rule="special">Carácter especial</li>
      </ul>
    `;
    passwordInput.parentElement.classList.add('password-wrapper');
    passwordInput.parentElement.appendChild(passwordBubble);

    closeModal.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

 function showModal(message, type = 'error') {
  const icon = document.getElementById('modalIcon');
  const modalEl = document.getElementById('feedbackModal');
  const messageEl = document.getElementById('modalMessage');

  messageEl.textContent = message;

  if (type === 'success') {
    icon.textContent = '✔';
    icon.classList.add('success');
    icon.classList.remove('error');
  } else {
    icon.textContent = '!';
    icon.classList.add('error');
    icon.classList.remove('success');
  }

  modalEl.classList.remove('hidden');
  modalEl.classList.add('show');


}


    function validatePassword(password) {
      const rules = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
      };

      // Atualiza as cores das regras no balão
      const items = passwordBubble.querySelectorAll('li');
      items.forEach(item => {
        const rule = item.dataset.rule;
        if (rules[rule]) {
          item.classList.add('valid');
          item.classList.remove('invalid');
        } else {
          item.classList.add('invalid');
          item.classList.remove('valid');
        }
      });

      return Object.values(rules).every(Boolean);
    }

    // Mostra balão ao focar no campo de password
    passwordInput.addEventListener('focus', () => {
      passwordBubble.classList.add('show');
    });

    // Esconde balão ao desfocar
    passwordInput.addEventListener('blur', () => {
      passwordBubble.classList.remove('show');
    });

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