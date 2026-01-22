(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  async function loadUsers() {
    try {
      console.log('A carregar users...');
      const res = await fetch(`${API_BASE}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Users recebidos:', data);

      const usersList = document.getElementById('usersList');
      usersList.innerHTML = '';

      data.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
          <span>${user.name} (${user.email}) - ${user.role}</span>
          <button class="action-btn" data-id="${user.id}">Gerir</button>
        `;
        usersList.appendChild(div);

        div.querySelector('button').addEventListener('click', () => {
          alert(`Gerir user: ${user.name}`);
        });
      });
    } catch (err) {
      console.error('Erro ao carregar users:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadUsers);
})();
