(() => {
  const API = 'http://localhost:3001/auth/forgot-password';

  document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgotForm');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emailError = document.getElementById('emailError');

    const modal = document.getElementById('feedbackModal');
    const modalMessage = document.getElementById('modalMessage');
    const modalIcon = document.getElementById('modalIcon');
    const closeModal = document.getElementById('closeModal');

    closeModal.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Função para mostrar modal com ícone animado
    function showModal(message, type = 'error') {
      modalMessage.textContent = message;
      modal.classList.remove('hidden');

      if (type === 'success') {
        modalIcon.textContent = '✔';
        modalIcon.classList.add('success');
        modalIcon.classList.remove('error');
      } else {
        modalIcon.textContent = '!';
        modalIcon.classList.add('error');
        modalIcon.classList.remove('success');
      }
    }

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      emailError.textContent = '';

      const email = emailInput.value.trim();
      if (!email) {
        emailError.textContent = 'O email é obrigatório';
        return;
      }

      loadingSpinner.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok) {
          showModal('✅ Instruções enviadas para o teu email!', 'success');
        } else {
          showModal(`❌ ${data.error || 'Erro ao enviar instruções.'}`, 'error');
        }
      } catch (err) {
        console.error('Erro:', err);
        showModal('❌ Ocorreu um erro. Tenta novamente mais tarde.', 'error');
      } finally {
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  });
})();
