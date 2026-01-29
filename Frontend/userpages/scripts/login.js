const API = 'http://localhost:3001/auth/login';

// Modern Brutalist Login Form JavaScript
class ModernBrutalistLoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.submitButton = this.form.querySelector('.login-btn');
        this.successMessage = document.getElementById('successMessage');
        this.socialButtons = document.querySelectorAll('.social-btn');

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupPasswordToggle();
        this.setupSocialButtons();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        this.passwordInput.addEventListener('input', () => this.clearError('password'));
    }

    setupPasswordToggle() {
        if (!this.passwordToggle) return;

        this.passwordToggle.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;

            const toggleText = this.passwordToggle.querySelector('.toggle-text');
            toggleText.textContent = type === 'password' ? 'SHOW' : 'HIDE';
        });
    }

    setupSocialButtons() {
        this.socialButtons.forEach(button => {
            button.addEventListener('click', () => {
                const provider = button.querySelector('.social-text').textContent;
                alert(`${provider} login ainda não implementado`);
            });
        });
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError('email', 'Email é obrigatório');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError('email', 'Email inválido');
            return false;
        }

        this.clearError('email');
        return true;
    }

    validatePassword() {
        const password = this.passwordInput.value;

        if (!password) {
            this.showError('password', 'Password é obrigatória');
            return false;
        }

        if (password.length < 6) {
            this.showError('password', 'Mínimo 6 caracteres');
            return false;
        }

        this.clearError('password');
        return true;
    }

    showError(field, message) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);

        formGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    clearError(field) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);

        formGroup.classList.remove('error');
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    }

    setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.disabled = loading;

        this.socialButtons.forEach(button => {
            button.style.pointerEvents = loading ? 'none' : 'auto';
            button.style.opacity = loading ? '0.6' : '1';
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const emailValid = this.validateEmail();
        const passwordValid = this.validatePassword();
        if (!emailValid || !passwordValid) return;

        this.setLoading(true);

        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: this.emailInput.value.trim(),
                    password: this.passwordInput.value
                })
            });

            const data = await res.json();

            // 🔹 Log para inspecionar o user
            console.log('User retornado do login:', data.user);

            if (!res.ok) {
                this.showError('password', data.error || 'Erro ao iniciar sessão');
                return;
            }

            // Guardar sessão
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Sucesso visual
            this.showSuccess();

            // Redirecionar
            setTimeout(() => {
                window.location.href = '../../PaginaFrontal/html/HomePage.html';
            }, 2500);

        } catch (err) {
            console.error(err);
            this.showError('password', 'Erro no servidor');
        } finally {
            this.setLoading(false);
        }
    }

    showSuccess() {
        // Esconder o formulário com animação
        this.form.style.opacity = '0';
        this.form.style.transform = 'scale(0.95)';

        setTimeout(() => {
            this.form.style.display = 'none';
            
            // Esconder a secção de divider se existir
            const divider = document.querySelector('.divider');
            if (divider) {
                divider.style.display = 'none';
            }
            
            // Esconder o signup link
            const signupLink = document.querySelector('.signup-link');
            if (signupLink) {
                signupLink.style.display = 'none';
            }
            
            // Mostrar mensagem de sucesso
            this.successMessage.classList.add('show');
        }, 300);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    new ModernBrutalistLoginForm();
});



agora precisamos de averiguar os produtos eu quero que tenham uma categoria por exemplo auutomovel e depois dentro dessa categoria tenham uma subcategoria tipo marca e dentro dessa subcategoria pode ter um array de outras coisas tipo, ano, parte do carro. mas preciso de atualizar o meu back end para isso. e atualizar a pagina para criar o produto e a pagina para exibir os produtos