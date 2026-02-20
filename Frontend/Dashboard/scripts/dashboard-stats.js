// ============================================
// DASHBOARD-STATS.JS - Sistema de Estatísticas
// ============================================

(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  // ===== HELPERS =====
  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    return `Há ${diffDays}d`;
  }

  // ===== CARREGAR ESTATÍSTICAS =====
  async function loadDashboardStats() {
    try {
      console.log('📊 A carregar estatísticas do dashboard...');

      // Carregar dados em paralelo
      const [productsData, usersData, categoriesData] = await Promise.all([
        loadProductsStats(),
        loadUsersStats(),
        loadCategoriesStats()
      ]);

      // Atualizar estatísticas principais
      updateMainStats(productsData, usersData, categoriesData);

      // Atualizar atividade recente
      updateRecentActivity(productsData, usersData);

      // Atualizar produtos recentes
      updateRecentProducts(productsData);

      // Atualizar estatísticas de stock
      updateStockStats(productsData);

      // Atualizar timestamp
      updateLastUpdateTime();

      console.log('✅ Estatísticas carregadas com sucesso');

    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      showError('Erro ao carregar estatísticas do dashboard');
    }
  }

  // ===== CARREGAR DADOS =====
  async function loadProductsStats() {
    const res = await fetch(`${API_BASE}/products`, {
      headers: authHeaders()
    });
    
    if (!res.ok) throw new Error('Erro ao carregar produtos');
    
    const products = await res.json();
    return {
      total: products.length,
      active: products.filter(p => p.is_active).length,
      inactive: products.filter(p => !p.is_active).length,
      inStock: products.filter(p => p.stock).length,
      outOfStock: products.filter(p => !p.stock).length,
      recent: products.slice(0, 5),
      all: products
    };
  }

  async function loadUsersStats() {
    try {
      const res = await fetch(`${API_BASE}/users/stats/overview`, {
        headers: authHeaders()
      });
      
      if (!res.ok) {
        // Fallback: carregar todos os users e calcular stats
        const usersRes = await fetch(`${API_BASE}/users`, {
          headers: authHeaders()
        });
        const users = await usersRes.json();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return {
          total_users: users.length,
          total_admins: users.filter(u => u.role === 'admin').length,
          new_users_30days: users.filter(u => 
            new Date(u.created_at) > thirtyDaysAgo
          ).length,
          all: users
        };
      }
      
      const stats = await res.json();
      
      // Carregar lista de users também
      const usersRes = await fetch(`${API_BASE}/users`, {
        headers: authHeaders()
      });
      const users = await usersRes.json();
      
      return {
        ...stats,
        all: users
      };
    } catch (err) {
      console.error('Erro ao carregar stats de utilizadores:', err);
      return {
        total_users: 0,
        total_admins: 0,
        new_users_30days: 0,
        all: []
      };
    }
  }

  async function loadCategoriesStats() {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: authHeaders()
      });
      
      if (!res.ok) throw new Error('Erro ao carregar categorias');
      
      const categories = await res.json();
      return {
        total: categories.length,
        all: categories
      };
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      return { total: 0, all: [] };
    }
  }

  // ===== ATUALIZAR UI =====
  function updateMainStats(products, users, categories) {
    // Produtos
    const totalProducts = document.getElementById('totalProducts');
    const activeProducts = document.getElementById('activeProducts');
    const productsTrend = document.getElementById('productsTrend');
    
    if (totalProducts) totalProducts.textContent = products.total;
    if (activeProducts) activeProducts.textContent = products.active;
    if (productsTrend) productsTrend.textContent = '📈';

    // Utilizadores
    const totalUsersStats = document.getElementById('totalUsersStats');
    const newUsersStats = document.getElementById('newUsersStats');
    const usersTrend = document.getElementById('usersTrend');
    
    if (totalUsersStats) totalUsersStats.textContent = users.total_users;
    if (newUsersStats) newUsersStats.textContent = users.new_users_30days;
    if (usersTrend) {
      usersTrend.textContent = users.new_users_30days > 0 ? '📈' : '—';
    }

    // Categorias
    const totalCategories = document.getElementById('totalCategories');
    if (totalCategories) totalCategories.textContent = categories.total;
  }

  function updateRecentActivity(products, users) {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    // Criar timeline de atividades
    const activities = [];

    // Adicionar produtos recentes
    products.all.slice(0, 3).forEach(product => {
      activities.push({
        icon: '📦',
        text: `Produto "${product.name}" criado`,
        time: product.created_at || product.updated_at,
        type: 'product'
      });
    });

    // Adicionar users recentes
    users.all.slice(0, 3).forEach(user => {
      activities.push({
        icon: '👤',
        text: `Utilizador "${user.name}" registado`,
        time: user.created_at,
        type: 'user'
      });
    });

    // Ordenar por data (mais recentes primeiro)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Renderizar
    container.innerHTML = activities.slice(0, 5).map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-details">
          <p class="activity-text">${window.encodeHTML(activity.text)}</p>
          <span class="activity-time">${formatTimeAgo(activity.time)}</span>
        </div>
      </div>
    `).join('');

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="activity-item">
          <div class="activity-icon">ℹ️</div>
          <div class="activity-details">
            <p class="activity-text">Nenhuma atividade recente</p>
          </div>
        </div>
      `;
    }
  }

  function updateRecentProducts(products) {
    const container = document.getElementById('recentProducts');
    if (!container) return;

    const recentProducts = products.recent || products.all.slice(0, 5);

    if (recentProducts.length === 0) {
      container.innerHTML = '<div class="loading-state">Nenhum produto criado ainda</div>';
      return;
    }

    container.innerHTML = recentProducts.map(product => `
      <div class="product-preview-item">
        <div class="product-preview-image">
          ${product.images && product.images[0] 
            ? `<img src="${API_BASE}/images/${product.images[0]}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
            : '📦'
          }
        </div>
        <div class="product-preview-info">
          <div class="product-preview-name">${window.encodeHTML(product.name)}</div>
          <div class="product-preview-price">€${Number(product.price).toFixed(2)}</div>
        </div>
      </div>
    `).join('');
  }

  function updateStockStats(products) {
    const stockAvailable = document.getElementById('stockAvailable');
    const stockUnavailable = document.getElementById('stockUnavailable');
    const stockBar = document.getElementById('stockBar');

    if (stockAvailable) stockAvailable.textContent = products.inStock;
    if (stockUnavailable) stockUnavailable.textContent = products.outOfStock;

    if (stockBar) {
      const total = products.inStock + products.outOfStock;
      const percentage = total > 0 ? (products.inStock / total) * 100 : 0;
      stockBar.style.width = `${percentage}%`;
    }
  }

  function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
      const now = new Date();
      lastUpdate.textContent = now.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  function showError(message) {
    const alertsSection = document.getElementById('dashboardAlerts');
    if (!alertsSection) return;

    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = `⚠️ ${message}`;
    
    alertsSection.appendChild(alert);

    // Remover após 5 segundos
    setTimeout(() => alert.remove(), 5000);
  }

  // ===== QUICK ACTIONS =====
  function initQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action-btn');
    
    quickActions.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        
        switch(action) {
          case 'add-product':
            // Trocar para tab de produtos e abrir modal
            document.querySelector('[data-tab="products"]').click();
            setTimeout(() => {
              document.getElementById('addProductBtn')?.click();
            }, 100);
            break;
            
          case 'add-user':
            // Trocar para tab de users e abrir modal
            document.querySelector('[data-tab="users"]').click();
            setTimeout(() => {
              document.getElementById('addUserBtn')?.click();
            }, 100);
            break;
            
          case 'view-products':
            document.querySelector('[data-tab="products"]').click();
            break;
            
          case 'view-users':
            document.querySelector('[data-tab="users"]').click();
            break;
        }
      });
    });
  }

  // ===== REFRESH BUTTON =====
  function initRefreshButton() {
    const refreshBtn = document.getElementById('refreshDashboard');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.style.animation = 'spin 1s linear infinite';
        await loadDashboardStats();
        refreshBtn.style.animation = '';
      });
    }
  }

  // ===== AUTO-REFRESH =====
  function startAutoRefresh() {
    // Atualizar estatísticas a cada 2 minutos
    setInterval(() => {
      console.log('🔄 Auto-refresh de estatísticas');
      loadDashboardStats();
    }, 120000); // 2 minutos
  }

  // ===== INICIALIZAÇÃO =====
  document.addEventListener('DOMContentLoaded', () => {
    // Carregar stats apenas se estamos no dashboard
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection && !dashboardSection.classList.contains('hidden')) {
      loadDashboardStats();
    }

    // Recarregar quando trocar para dashboard
    document.querySelectorAll('[data-tab="dashboard"]').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(loadDashboardStats, 100);
      });
    });

    // Inicializar quick actions
    initQuickActions();
    
    // Inicializar botão de refresh
    initRefreshButton();
    
    // Iniciar auto-refresh
    startAutoRefresh();
  });

  // Exportar para uso global
  window.reloadDashboardStats = loadDashboardStats;

  console.log('📊 Módulo de estatísticas carregado');

})();

// ===== ANIMAÇÃO DE SPIN =====
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);