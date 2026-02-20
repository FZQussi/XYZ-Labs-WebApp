// Frontend/Dashboard/scripts/users.js
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  // ===== ELEMENTOS =====
  const usersList = document.getElementById('usersList');
  const userSearch = document.getElementById('userSearch');
  const userFilterRole = document.getElementById('userFilterRole');
  const addUserBtn = document.getElementById('addUserBtn');

  // Estatísticas
  const totalUsers = document.getElementById('totalUsers');
  const totalAdmins = document.getElementById('totalAdmins');
  const newUsers = document.getElementById('newUsers');

  // Modal Criar
  const createUserModal = document.getElementById('createUserModal');
  const createUserForm = document.getElementById('createUserForm');
  const createUserName = document.getElementById('createUserName');
  const createUserEmail = document.getElementById('createUserEmail');
  const createUserPassword = document.getElementById('createUserPassword');
  const createUserRole = document.getElementById('createUserRole');

  // Modal Ver
  const viewUserModal = document.getElementById('viewUserModal');
  const viewUserName = document.getElementById('viewUserName');
  const viewUserEmail = document.getElementById('viewUserEmail');
  const viewUserRole = document.getElementById('viewUserRole');
  const viewUserCreated = document.getElementById('viewUserCreated');
  const editUserFromViewBtn = document.getElementById('editUserFromViewBtn');
  const deleteUserFromViewBtn = document.getElementById('deleteUserFromViewBtn');

  // Modal Editar
  const editUserModal = document.getElementById('editUserModal');
  const editUserForm = document.getElementById('editUserForm');
  const editUserId = document.getElementById('editUserId');
  const editUserName = document.getElementById('editUserName');
  const editUserEmail = document.getElementById('editUserEmail');
  const editUserRole = document.getElementById('editUserRole');
  const editUserPassword = document.getElementById('editUserPassword');

  let allUsers = [];
  let currentViewUser = null;

  // ===== HELPERS =====
  function authHeaders() {
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function validatePassword(password) {
    return (
      password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  function updatePasswordReqs(password, prefix) {
    document.getElementById(`${prefix}LengthReq`).style.color = 
      password.length >= 12 ? '#10b981' : '#dc2626';
    document.getElementById(`${prefix}UppercaseReq`).style.color = 
      /[A-Z]/.test(password) ? '#10b981' : '#dc2626';
    document.getElementById(`${prefix}LowercaseReq`).style.color = 
      /[a-z]/.test(password) ? '#10b981' : '#dc2626';
    document.getElementById(`${prefix}NumberReq`).style.color = 
      /[0-9]/.test(password) ? '#10b981' : '#dc2626';
    document.getElementById(`${prefix}SpecialReq`).style.color = 
      /[^A-Za-z0-9]/.test(password) ? '#10b981' : '#dc2626';
  }

  // ===== LOAD STATS =====
  async function loadStats() {
    try {
      const res = await fetch(`${API_BASE}/users/stats/overview`, {
        headers: authHeaders()
      });
      const stats = await res.json();

      totalUsers.textContent = stats.total_users || 0;
      totalAdmins.textContent = stats.total_admins || 0;
      newUsers.textContent = stats.new_users_30days || 0;
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }

  // ===== LOAD USERS =====
  async function loadUsers() {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: authHeaders()
      });
      allUsers = await res.json();
      renderUsers(allUsers);
    } catch (err) {
      console.error('Erro ao carregar utilizadores:', err);
      usersList.innerHTML = '<p style="padding:20px;color:#dc2626;">Erro ao carregar utilizadores</p>';
    }
  }

  // ===== RENDER USERS =====
  function renderUsers(users) {
    if (users.length === 0) {
      usersList.innerHTML = '<p style="padding:20px;color:#6b7280;">Nenhum utilizador encontrado</p>';
      return;
    }

    usersList.innerHTML = users.map(user => `
      <div class="user-item">
        <span class="user-name">${user.name}</span>
        <span class="user-email">${user.email}</span>
        <span class="role-badge ${user.role}">${user.role}</span>
        <span class="user-date">${formatDate(user.created_at)}</span>
        <div class="user-actions">
          <button class="view-user-btn" data-id="${user.id}">Ver</button>
          <button class="edit-user-btn" data-id="${user.id}">Editar</button>
          <button class="delete-user-btn" data-id="${user.id}">Eliminar</button>
        </div>
      </div>
    `).join('');

    // Event listeners
    document.querySelectorAll('.view-user-btn').forEach(btn => {
      btn.addEventListener('click', () => viewUser(btn.dataset.id));
    });

    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.id));
    });
  }

  // ===== FILTER & SEARCH =====
  function filterUsers() {
    const searchTerm = userSearch.value.toLowerCase();
    const roleFilter = userFilterRole.value;

    const filtered = allUsers.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm);

      const matchesRole = !roleFilter || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });

    renderUsers(filtered);
  }

  userSearch.addEventListener('input', filterUsers);
  userFilterRole.addEventListener('change', filterUsers);

  // ===== CREATE USER =====
  addUserBtn.addEventListener('click', () => {
    createUserForm.reset();
    createUserModal.classList.remove('hidden');
  });

  document.querySelector('[data-close="createUser"]').addEventListener('click', () => {
    createUserModal.classList.add('hidden');
  });

  createUserPassword.addEventListener('input', () => {
    updatePasswordReqs(createUserPassword.value, 'create');
  });

  createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = createUserPassword.value;
    if (!validatePassword(password)) {
      alert('Password não cumpre os requisitos de segurança');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: createUserName.value,
          email: createUserEmail.value,
          password: password,
          role: createUserRole.value
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao criar utilizador');
      }

      console.log('✅ Utilizador criado com sucesso');
      createUserModal.classList.add('hidden');
      await loadUsers();
      await loadStats();
    } catch (err) {
      console.error('Erro ao criar utilizador:', err);
      alert(err.message);
    }
  });

  // ===== VIEW USER =====
  async function viewUser(userId) {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        headers: authHeaders()
      });
      const user = await res.json();

      currentViewUser = user;

      viewUserName.textContent = user.name;
      viewUserEmail.textContent = user.email;
      viewUserRole.textContent = user.role;
      viewUserRole.className = `role-badge ${user.role}`;
      viewUserCreated.textContent = formatDate(user.created_at);

      viewUserModal.classList.remove('hidden');
    } catch (err) {
      console.error('Erro ao carregar utilizador:', err);
      alert('Erro ao carregar utilizador');
    }
  }

  document.querySelector('[data-close="viewUser"]').addEventListener('click', () => {
    viewUserModal.classList.add('hidden');
  });

  editUserFromViewBtn.addEventListener('click', () => {
    viewUserModal.classList.add('hidden');
    openEditModal(currentViewUser.id);
  });

  deleteUserFromViewBtn.addEventListener('click', () => {
    viewUserModal.classList.add('hidden');
    deleteUser(currentViewUser.id);
  });

  // ===== EDIT USER =====
  async function openEditModal(userId) {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        headers: authHeaders()
      });
      const user = await res.json();

      editUserId.value = user.id;
      editUserName.value = user.name;
      editUserEmail.value = user.email;
      editUserRole.value = user.role;
      editUserPassword.value = '';

      editUserModal.classList.remove('hidden');
    } catch (err) {
      console.error('Erro ao carregar utilizador:', err);
      alert('Erro ao carregar utilizador');
    }
  }

  document.querySelector('[data-close="editUser"]').addEventListener('click', () => {
    editUserModal.classList.add('hidden');
  });

  editUserPassword.addEventListener('input', () => {
    if (editUserPassword.value) {
      updatePasswordReqs(editUserPassword.value, 'edit');
    }
  });

  editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = editUserPassword.value;
    if (password && !validatePassword(password)) {
      alert('Password não cumpre os requisitos de segurança');
      return;
    }

    const updateData = {
      name: editUserName.value,
      email: editUserEmail.value,
      role: editUserRole.value
    };

    if (password) {
      updateData.password = password;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${editUserId.value}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao atualizar utilizador');
      }

      console.log('✅ Utilizador atualizado com sucesso');
      editUserModal.classList.add('hidden');
      await loadUsers();
      await loadStats();
    } catch (err) {
      console.error('Erro ao atualizar utilizador:', err);
      alert(err.message);
    }
  });

  // ===== DELETE USER =====
  async function deleteUser(userId) {
    if (!confirm('⚠️ Tens a certeza que queres eliminar este utilizador?\n\nEsta ação não pode ser revertida!')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao eliminar utilizador');
      }

      console.log('✅ Utilizador eliminado com sucesso');
      await loadUsers();
      await loadStats();
    } catch (err) {
      console.error('Erro ao eliminar utilizador:', err);
      alert(err.message);
    }
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', async () => {
    await loadStats();
    await loadUsers();
  });

  // Expor para recarregar
  window.reloadUsers = async () => {
    await loadStats();
    await loadUsers();
  };
})();