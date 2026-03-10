// ============================================
// DASHBOARD.JS - Controlador Principal (CORRIGIDO)
// ============================================

const API_BASE = '';

// ===== FUNÇÃO PARA INICIALIZAR DASHBOARD =====
async function initDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  console.log('🚀 Inicializando dashboard...');
  console.log('User:', user);

  // Verificar autenticação e role
  if (!token || user.role !== 'admin') {
    console.warn('⚠️ Acesso não autorizado');
    alert('Acesso não autorizado. Apenas administradores podem aceder ao dashboard.');
    window.location.href = '/userpages/html/login.html';
    return;
  }

  // Mostrar informação do user na sidebar
  const userName = document.getElementById('userName');
  if (userName && user.name) {
    userName.textContent = user.name;
  }

  // Mostrar user info no header se existir
  const userInfo = document.getElementById('userInfo');
  if (userInfo && user.name) {
    const nameSpan = userInfo.querySelector('.user-name');
    if (nameSpan) nameSpan.textContent = user.name;
  }

  console.log('✅ Dashboard inicializado para:', user.name);
}

// ===== SISTEMA DE TABS =====
function initTabs() {
  const navButtons = document.querySelectorAll('[data-tab]');
  const sections = document.querySelectorAll('.tab');

  // Função para trocar de tab
  function switchTab(tabName) {
    console.log('📑 Trocando para tab:', tabName);

    // Desativar todos os botões e esconder todas as sections
    navButtons.forEach(btn => btn.classList.remove('active'));
    sections.forEach(section => section.classList.add('hidden'));

    // Ativar botão atual
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Mostrar section correspondente
    const targetSection = document.getElementById(tabName);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      
      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger events específicos por tab
      triggerTabEvents(tabName);
    } else {
      console.warn(`⚠️ Secção ${tabName} não encontrada`);
    }
  }

  // Função para trigger events específicos
  function triggerTabEvents(tabName) {
    switch(tabName) {
      case 'dashboard':
        // Recarregar estatísticas
        console.log('📊 Tentando chamar reloadDashboardStats...');
        if (window.reloadDashboardStats) {
          console.log('✅ reloadDashboardStats encontrada, executando...');
          window.reloadDashboardStats();
        } else {
          console.warn('⚠️ reloadDashboardStats não está definida ainda!');
        }
        break;
      
      case 'users':
        // Recarregar users se a função existir
        if (window.reloadUsers) {
          window.reloadUsers();
        }
        break;
      
      case 'products':
        // Recarregar products se a função existir
        if (window.reloadProducts) {
          window.reloadProducts();
        }
        break;
    }
  }

  // Event listeners nos botões de navegação
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
      
      // Salvar tab atual no sessionStorage
      sessionStorage.setItem('currentTab', tabName);
    });
  });

  // Restaurar última tab visitada ou mostrar dashboard
  const savedTab = sessionStorage.getItem('currentTab') || 'dashboard';
  switchTab(savedTab);

  console.log('✅ Sistema de tabs inicializado');
}

// ===== LOGOUT =====
function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('👋 Logout iniciado');
      
      if (confirm('Tem a certeza que deseja terminar a sessão?')) {
        // Usar o security manager se disponível
        if (window.securityManager) {
          window.securityManager.logout();
        } else {
          // Fallback manual
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenTimestamp');
          sessionStorage.clear();
          window.location.href = '/userpages/html/login.html';
        }
      }
    });
  }

  console.log('✅ Logout handler configurado');
}

// ===== MODAL HANDLERS =====
function initModals() {
  // Fechar modais ao clicar no X ou fora do modal
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    // Fechar ao clicar no X
    const closeBtn = modal.querySelector('.modal-close, [data-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Fechar modais com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modals.forEach(modal => {
        if (!modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  console.log('✅ Handlers de modais configurados');
}

// ===== NOTIFICAÇÕES =====
function showNotification(message, type = 'info') {
  // Criar container de notificações se não existir
  let container = document.getElementById('notificationsContainer');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationsContainer';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  // Criar notificação
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const colors = {
    success: '#00FF00',
    error: '#FF0000',
    warning: '#FFFF00',
    info: '#00FFFF'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  notification.style.cssText = `
    background: ${colors[type] || colors.info};
    color: #000;
    padding: 16px;
    border: 3px solid #000;
    box-shadow: 4px 4px 0 #000;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <span style="font-size: 20px;">${icons[type] || icons.info}</span>
    <span style="flex: 1;">${window.encodeHTML ? window.encodeHTML(message) : message}</span>
    <button style="
      background: transparent;
      border: 2px solid #000;
      width: 24px;
      height: 24px;
      cursor: pointer;
      font-weight: bold;
      font-size: 16px;
      line-height: 1;
    ">×</button>
  `;

  // Fechar ao clicar no X
  const closeBtn = notification.querySelector('button');
  closeBtn.addEventListener('click', () => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  });

  container.appendChild(notification);

  // Auto-remover após 5 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Adicionar animações
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyles);

// Exportar para uso global
window.showNotification = showNotification;

// ===== HELPERS DE FORMATAÇÃO =====
window.formatCurrency = (value) => {
  return `€${Number(value).toFixed(2)}`;
};

window.formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

window.formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ===== LOADING STATES =====
function showLoading(container) {
  if (typeof container === 'string') {
    container = document.getElementById(container);
  }
  
  if (container) {
    container.innerHTML = '<div class="loading-state">⏳ A carregar...</div>';
  }
}

function hideLoading(container) {
  if (typeof container === 'string') {
    container = document.getElementById(container);
  }
  
  if (container) {
    const loadingState = container.querySelector('.loading-state');
    if (loadingState) {
      loadingState.remove();
    }
  }
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;

// ===== ERROR HANDLING GLOBAL =====
window.addEventListener('error', (event) => {
  console.error('❌ Erro global capturado:', event.error);
  
  // Não mostrar notificação para todos os erros
  // apenas logar no console
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejection não tratada:', event.reason);
  
  // Prevenir que erros de rede façam crash da aplicação
  event.preventDefault();
});

// ===== INICIALIZAÇÃO PRINCIPAL =====
// CORRIGIDO: Verificar se documento está pronto
function initializeApp() {
  console.log('🎯 Inicializando aplicação (readyState: ' + document.readyState + ')');

  // Ordem de inicialização
  initDashboard();
  initTabs();
  initLogout();
  initModals();

  console.log('✅ Dashboard completamente inicializado');
}

// Verificar se o documento já está pronto
if (document.readyState === 'loading') {
  // Documento ainda está sendo carregado
  console.log('📄 Documento ainda está a carregar, aguardando DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Documento já foi completamente carregado
  console.log('📄 Documento já estava carregado, inicializando imediatamente...');
  initializeApp();
}

// Log de carregamento
console.log('📄 dashboard.js carregado');