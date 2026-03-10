// ============================================
// SECURITY.JS - Sistema de Segurança do Dashboard (CORRIGIDO)
// ============================================

(() => {
  const API_BASE = '';
  
  // ===== CONFIGURAÇÕES DE SEGURANÇA =====
  const SECURITY_CONFIG = {
    // Tempo de inatividade antes de logout automático (15 minutos)
    INACTIVITY_TIMEOUT: 15 * 60 * 1000,
    
    // Tempo de expiração do token (1 hora)
    TOKEN_EXPIRATION: 60 * 60 * 1000,
    
    // Rate limiting - máximo de requisições por minuto
    MAX_REQUESTS_PER_MINUTE: 6000,
    
    // Lista de eventos considerados "atividade"
    ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart'],
    
    // Tentativas de login falhadas permitidas
    MAX_FAILED_ATTEMPTS: 5,
    
    // Tempo de bloqueio após tentativas falhadas (5 minutos)
    LOCKOUT_DURATION: 5 * 60 * 1000
  };

  // ===== VARIÁVEIS GLOBAIS DE SEGURANÇA =====
  let inactivityTimer = null;
  let tokenExpirationTimer = null;
  let requestCount = 0;
  let requestResetTimer = null;
  let failedAttempts = parseInt(localStorage.getItem('failedAttempts') || '0');
  let lockoutUntil = parseInt(localStorage.getItem('lockoutUntil') || '0');

  // ===== CLASSE DE SEGURANÇA =====
  class SecurityManager {
    constructor() {
      this.init();
    }

    init() {
      console.log('🔒 Sistema de segurança iniciado');
      
      // Verificar autenticação
      if (!this.checkAuth()) {
        this.redirectToLogin();
        return;
      }

      // Verificar bloqueio por tentativas falhadas
      if (this.isLockedOut()) {
        alert('Conta temporariamente bloqueada devido a múltiplas tentativas falhadas.');
        this.redirectToLogin();
        return;
      }

      // Iniciar monitoramento de segurança
      this.startInactivityMonitor();
      this.startTokenExpirationMonitor();
      this.sanitizeAllInputs();
      this.setupCSRFProtection();
      this.startRequestRateLimiting();
      
      // Adicionar indicador visual de segurança
      this.addSecurityIndicator();
    }

    // ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
    checkAuth() {
      const token = localStorage.getItem('token');
      const user = this.getUser();

      if (!token || !user) {
        console.warn('⚠️ Token ou utilizador não encontrado');
        return false;
      }

      // Verificar se é admin
      if (user.role !== 'admin') {
        console.warn('⚠️ Utilizador não tem permissões de admin');
        alert('Acesso negado: Apenas administradores podem aceder ao dashboard');
        return false;
      }

      // Verificar expiração do token (se tiver timestamp)
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      if (tokenTimestamp) {
        const elapsed = Date.now() - parseInt(tokenTimestamp);
        if (elapsed > SECURITY_CONFIG.TOKEN_EXPIRATION) {
          console.warn('⚠️ Token expirado');
          alert('Sessão expirada. Por favor, faça login novamente.');
          return false;
        }
      }

      return true;
    }

    getUser() {
      try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
      } catch (err) {
        console.error('Erro ao parsear utilizador:', err);
        return null;
      }
    }

    // ===== MONITORAMENTO DE INATIVIDADE =====
    startInactivityMonitor() {
      const resetTimer = () => {
        clearTimeout(inactivityTimer);
        
        inactivityTimer = setTimeout(() => {
          console.log('⏰ Timeout de inatividade atingido');
          alert('Sessão expirada por inatividade');
          this.logout();
        }, SECURITY_CONFIG.INACTIVITY_TIMEOUT);
      };

      // Resetar timer em cada evento de atividade
      SECURITY_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });

      // Iniciar timer
      resetTimer();
      
      console.log('✅ Monitor de inatividade ativo');
    }

    // ===== MONITORAMENTO DE EXPIRAÇÃO DE TOKEN =====
    startTokenExpirationMonitor() {
      const tokenTimestamp = localStorage.getItem('tokenTimestamp') || Date.now();
      localStorage.setItem('tokenTimestamp', tokenTimestamp.toString());

      const timeUntilExpiration = SECURITY_CONFIG.TOKEN_EXPIRATION - 
                                  (Date.now() - parseInt(tokenTimestamp));

      if (timeUntilExpiration > 0) {
        tokenExpirationTimer = setTimeout(() => {
          console.log('⏰ Token expirado');
          alert('Sessão expirada. Por favor, faça login novamente.');
          this.logout();
        }, timeUntilExpiration);
        
        console.log(`✅ Token expira em ${Math.round(timeUntilExpiration / 60000)} minutos`);
      } else {
        console.warn('⚠️ Token já expirado');
        this.logout();
      }
    }

    // ===== SANITIZAÇÃO DE INPUTS =====
    sanitizeAllInputs() {
      // Observador para novos inputs adicionados dinamicamente
      const observer = new MutationObserver(() => {
        this.attachInputSanitizers();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Sanitizar inputs existentes
      this.attachInputSanitizers();
      
      console.log('✅ Sanitização de inputs ativa');
    }

    attachInputSanitizers() {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
      
      inputs.forEach(input => {
        if (!input.dataset.sanitized) {
          input.addEventListener('input', (e) => {
            // Remover caracteres potencialmente perigosos
            e.target.value = this.sanitizeInput(e.target.value);
          });
          input.dataset.sanitized = 'true';
        }
      });
    }

    sanitizeInput(value) {
      if (typeof value !== 'string') return value;
      
      // Remover scripts e tags HTML perigosas
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers inline
    }

    // ===== PROTEÇÃO CSRF =====
    setupCSRFProtection() {
      // Gerar token CSRF se não existir
      let csrfToken = sessionStorage.getItem('csrfToken');
      
      if (!csrfToken) {
        csrfToken = this.generateCSRFToken();
        sessionStorage.setItem('csrfToken', csrfToken);
      }

      // Interceptar todas as requisições fetch
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        const [url, options = {}] = args;
        
        // Adicionar token CSRF em requests que modificam dados
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
          options.headers = {
            ...options.headers,
            'X-CSRF-Token': csrfToken
          };
        }

        return originalFetch(url, options);
      };

      console.log('✅ Proteção CSRF ativa');
    }

    generateCSRFToken() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // ===== RATE LIMITING =====
    startRequestRateLimiting() {
      // Resetar contador a cada minuto
      requestResetTimer = setInterval(() => {
        if (requestCount > 0) {
          console.log(`📊 Requests no último minuto: ${requestCount}`);
        }
        requestCount = 0;
      }, 60000);

      // Interceptar fetch para contar requests
      const originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        requestCount++;
        
        if (requestCount > SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
          console.error('🚫 Rate limit excedido');
          throw new Error('Muitas requisições. Por favor, aguarde um momento.');
        }

        return originalFetch(...args);
      };

      console.log('✅ Rate limiting ativo');
    }

    // ===== BLOQUEIO POR TENTATIVAS FALHADAS =====
    isLockedOut() {
      const now = Date.now();
      if (lockoutUntil > now) {
        const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
        console.warn(`🔒 Conta bloqueada por mais ${minutesLeft} minutos`);
        return true;
      }
      
      // Reset se o período de bloqueio passou
      if (lockoutUntil > 0 && lockoutUntil <= now) {
        this.resetFailedAttempts();
      }
      
      return false;
    }

    recordFailedAttempt() {
      failedAttempts++;
      localStorage.setItem('failedAttempts', failedAttempts.toString());
      
      if (failedAttempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
        lockoutUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
        localStorage.setItem('lockoutUntil', lockoutUntil.toString());
        console.warn('🔒 Conta bloqueada temporariamente');
      }
    }

    resetFailedAttempts() {
      failedAttempts = 0;
      lockoutUntil = 0;
      localStorage.removeItem('failedAttempts');
      localStorage.removeItem('lockoutUntil');
    }

    // ===== INDICADOR VISUAL DE SEGURANÇA =====
    addSecurityIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'securityIndicator';
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #00FF00;
        color: #000;
        padding: 8px 16px;
        border: 3px solid #000;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: bold;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 4px 4px 0 #000;
      `;
      
      indicator.innerHTML = `
        <span>🔒</span>
        <span>SESSÃO SEGURA</span>
      `;
      
      document.body.appendChild(indicator);

      // Atualizar indicador com tempo restante
      setInterval(() => {
        const tokenTimestamp = parseInt(localStorage.getItem('tokenTimestamp') || '0');
        const timeLeft = SECURITY_CONFIG.TOKEN_EXPIRATION - (Date.now() - tokenTimestamp);
        const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));
        
        if (minutesLeft < 5) {
          indicator.style.background = '#FFFF00';
          indicator.innerHTML = `
            <span>⚠️</span>
            <span>EXPIRA EM ${minutesLeft}min</span>
          `;
        }
      }, 60000);
    }

    // ===== LOGOUT SEGURO =====
    logout() {
      // Limpar timers
      clearTimeout(inactivityTimer);
      clearTimeout(tokenExpirationTimer);
      clearInterval(requestResetTimer);

      // Limpar dados sensíveis
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenTimestamp');
      sessionStorage.clear();

      // Redirecionar
      this.redirectToLogin();
    }

    redirectToLogin() {
      window.location.href = '/userpages/html/login.html';
    }

    // ===== LIMPEZA =====
    destroy() {
      clearTimeout(inactivityTimer);
      clearTimeout(tokenExpirationTimer);
      clearInterval(requestResetTimer);
    }
  }

  // ===== FUNÇÕES AUXILIARES GLOBAIS =====
  
  // Validação de email
  window.isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validação de password forte
  window.isStrongPassword = (password) => {
    return password.length >= 12 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  };

  // Encode HTML para prevenir XSS
  window.encodeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // Decode HTML
  window.decodeHTML = (str) => {
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent;
  };

  // Verificar se token é válido (formato JWT básico)
  window.isValidToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3;
  };

  // ===== INICIALIZAÇÃO CORRIGIDA =====
  
  function initializeSecurity() {
    console.log('🔐 Inicializando sistema de segurança (readyState: ' + document.readyState + ')');
    window.securityManager = new SecurityManager();
  }

  // Verificar se documento está pronto
  if (document.readyState === 'loading') {
    console.log('🔐 Documento ainda está a carregar...');
    document.addEventListener('DOMContentLoaded', initializeSecurity);
  } else {
    console.log('🔐 Documento já estava carregado, inicializando imediatamente...');
    initializeSecurity();
  }

  // Exportar para uso global
  window.SecurityManager = SecurityManager;
  
  console.log('🔐 Módulo de segurança carregado');

})();