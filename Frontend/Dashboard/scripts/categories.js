// Frontend/Dashboard/scripts/categories.js — ATUALIZADO
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  function authHeaders() {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // ============================================================
  // DADOS GLOBAIS
  // ============================================================
  window._primaryCategories   = [];
  window._secondaryCategories = [];

  // ============================================================
  // CARREGAR PARA USO GLOBAL (createproduct / editproduct)
  // ============================================================
async function loadAllCategories() {
  try {
    const [primRes, secRes] = await Promise.all([
      fetch(`/api/categories/primary`, { headers: authHeaders() }),
      fetch(`/api/categories/secondary`, { headers: authHeaders() })
    ]);

    if (primRes.ok) {
      const text = await primRes.text();
      window._primaryCategories = text ? JSON.parse(text) : [];
    } else {
      window._primaryCategories = [];
      console.error('Erro HTTP primary:', primRes.status);
    }

    if (secRes.ok) {
      const text2 = await secRes.text();
      window._secondaryCategories = text2 ? JSON.parse(text2) : [];
    } else {
      window._secondaryCategories = [];
      console.error('Erro HTTP secondary:', secRes.status);
    }

    document.dispatchEvent(new Event('categoriesLoaded'));
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}


  // ============================================================
  // GESTÃO DE CATEGORIAS PRIMÁRIAS (tab no dashboard)
  // ============================================================
  function initPrimaryCategoriesUI() {
    const container  = document.getElementById('primaryCategoriesList');
    const addBtn     = document.getElementById('addPrimaryCategoryBtn');
    const modal      = document.getElementById('primaryCategoryModal');
    const form       = document.getElementById('primaryCategoryForm');
    const closeBtn   = modal?.querySelector('[data-close="primaryCat"]');
    const modalTitle = document.getElementById('primaryCatModalTitle');
    const hiddenId   = document.getElementById('primaryCatId');
    const nameInput  = document.getElementById('primaryCatName');
    const descInput  = document.getElementById('primaryCatDesc');
    const iconInput  = document.getElementById('primaryCatIcon');
    const orderInput = document.getElementById('primaryCatOrder');

    if (!container || !addBtn || !modal || !form) return;

    async function renderPrimaryCategories() {
      container.innerHTML = '<div class="loading-state">⏳ A carregar...</div>';
      try {
        const res = await fetch(`${API_BASE}/api/categories/primary`, { headers: authHeaders() });
        const cats = await res.json();
        window._primaryCategories = cats;

        if (!cats.length) {
          container.innerHTML = '<div style="padding:16px;color:#666">Sem categorias primárias.</div>';
          return;
        }

        container.innerHTML = cats.map(c => `
          <div class="category-row" data-id="${c.id}">
            <span class="cat-icon">${c.icon || '📂'}</span>
            <span class="cat-name">${window.encodeHTML ? window.encodeHTML(c.name) : c.name}</span>
            <span class="cat-desc">${c.description || ''}</span>
            <span class="cat-order">#${c.display_order}</span>
            <div class="cat-actions">
              <button class="secondary-btn cat-edit-btn" data-id="${c.id}">✏️ Editar</button>
              <button class="btn-danger cat-delete-btn" data-id="${c.id}">🗑️</button>
            </div>
          </div>
        `).join('');

        container.querySelectorAll('.cat-edit-btn').forEach(btn => {
          btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        container.querySelectorAll('.cat-delete-btn').forEach(btn => {
          btn.addEventListener('click', () => deleteCategory(parseInt(btn.dataset.id)));
        });
      } catch (err) {
        container.innerHTML = '<div style="color:red;padding:16px">Erro ao carregar.</div>';
      }
    }

    function openCreateModal() {
      form.reset();
      hiddenId.value = '';
      modalTitle.textContent = 'NOVA CATEGORIA PRINCIPAL';
      modal.classList.remove('hidden');
    }

    function openEditModal(id) {
      const cat = window._primaryCategories.find(c => c.id === id);
      if (!cat) return;
      hiddenId.value  = cat.id;
      nameInput.value  = cat.name;
      descInput.value  = cat.description || '';
      iconInput.value  = cat.icon || '';
      orderInput.value = cat.display_order || 0;
      modalTitle.textContent = 'EDITAR CATEGORIA PRINCIPAL';
      modal.classList.remove('hidden');
    }

    async function deleteCategory(id) {
      if (!confirm('Eliminar esta categoria principal?')) return;
      try {
        const res = await fetch(`${API_BASE}/api/categories/primary/${id}`, {
          method: 'DELETE', headers: authHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao eliminar');
        await renderPrimaryCategories();
        await loadAllCategories();
      } catch (err) {
        alert(err.message);
      }
    }

    addBtn.addEventListener('click', openCreateModal);

    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id   = hiddenId.value;
      const body = {
        name:          nameInput.value,
        description:   descInput.value,
        icon:          iconInput.value || '📂',
        display_order: parseInt(orderInput.value) || 0,
        is_active:     true
      };

      try {
        const url    = id ? `${API_BASE}/api/categories/primary/${id}` : `${API_BASE}/api/categories/primary`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        const data   = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro');
        modal.classList.add('hidden');
        await renderPrimaryCategories();
        await loadAllCategories();
      } catch (err) {
        alert(err.message);
      }
    });

    renderPrimaryCategories();
    window.reloadPrimaryCategories = renderPrimaryCategories;
  }

  // ============================================================
  // GESTÃO DE CATEGORIAS SECUNDÁRIAS (tags/materiais)
  // ============================================================
  function initSecondaryCategoriesUI() {
    const container  = document.getElementById('secondaryCategoriesList');
    const addBtn     = document.getElementById('addSecondaryCategoryBtn');
    const modal      = document.getElementById('secondaryCategoryModal');
    const form       = document.getElementById('secondaryCategoryForm');
    const closeBtn   = modal?.querySelector('[data-close="secondaryCat"]');
    const modalTitle = document.getElementById('secondaryCatModalTitle');
    const hiddenId   = document.getElementById('secondaryCatId');
    const nameInput  = document.getElementById('secondaryCatName');
    const descInput  = document.getElementById('secondaryCatDesc');
    const roleSelect = document.getElementById('secondaryCatRole');
    const orderInput = document.getElementById('secondaryCatOrder');

    if (!container || !addBtn || !modal || !form) return;

    async function renderSecondaryCategories() {
      container.innerHTML = '<div class="loading-state">⏳ A carregar...</div>';
      try {
        const res  = await fetch(`${API_BASE}/api/categories/secondary`, { headers: authHeaders() });
        const cats = await res.json();
        window._secondaryCategories = cats;

        if (!cats.length) {
          container.innerHTML = '<div style="padding:16px;color:#666">Sem categorias secundárias.</div>';
          return;
        }

        container.innerHTML = cats.map(c => `
          <div class="category-row" data-id="${c.id}">
            <span class="cat-role-badge role-${c.category_role || 'secondary'}">${c.category_role === 'tag' ? '🏷️ Tag' : '📌 Secundária'}</span>
            <span class="cat-name">${window.encodeHTML ? window.encodeHTML(c.name) : c.name}</span>
            <span class="cat-desc">${c.description || ''}</span>
            <span class="cat-order">#${c.display_order}</span>
            <div class="cat-actions">
              <button class="secondary-btn cat-edit-btn" data-id="${c.id}">✏️ Editar</button>
              <button class="btn-danger cat-delete-btn" data-id="${c.id}">🗑️</button>
            </div>
          </div>
        `).join('');

        container.querySelectorAll('.cat-edit-btn').forEach(btn => {
          btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        container.querySelectorAll('.cat-delete-btn').forEach(btn => {
          btn.addEventListener('click', () => deleteCategory(parseInt(btn.dataset.id)));
        });
      } catch (err) {
        container.innerHTML = '<div style="color:red;padding:16px">Erro ao carregar.</div>';
      }
    }

    function openCreateModal() {
      form.reset();
      hiddenId.value = '';
      modalTitle.textContent = 'NOVA CATEGORIA SECUNDÁRIA';
      modal.classList.remove('hidden');
    }

    function openEditModal(id) {
      const cat = window._secondaryCategories.find(c => c.id === id);
      if (!cat) return;
      hiddenId.value  = cat.id;
      nameInput.value  = cat.name;
      descInput.value  = cat.description || '';
      roleSelect.value = cat.category_role || 'secondary';
      orderInput.value = cat.display_order || 0;
      modalTitle.textContent = 'EDITAR CATEGORIA SECUNDÁRIA';
      modal.classList.remove('hidden');
    }

    async function deleteCategory(id) {
      if (!confirm('Eliminar esta categoria secundária?')) return;
      try {
        const res  = await fetch(`${API_BASE}/api/categories/secondary/${id}`, {
          method: 'DELETE', headers: authHeaders()
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao eliminar');
        await renderSecondaryCategories();
        await loadAllCategories();
      } catch (err) {
        alert(err.message);
      }
    }

    addBtn.addEventListener('click', openCreateModal);
    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id   = hiddenId.value;
      const body = {
        name:          nameInput.value,
        description:   descInput.value,
        category_role: roleSelect.value,
        display_order: parseInt(orderInput.value) || 0,
        is_active:     true
      };

      try {
        const url    = id ? `${API_BASE}/api/categories/secondary/${id}` : `${API_BASE}/api/categories/secondary`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        const data   = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro');
        modal.classList.add('hidden');
        await renderSecondaryCategories();
        await loadAllCategories();
      } catch (err) {
        alert(err.message);
      }
    });

    renderSecondaryCategories();
    window.reloadSecondaryCategories = renderSecondaryCategories;
  }

  // ============================================================
  // INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', async () => {
    await loadAllCategories();
    initPrimaryCategoriesUI();
    initSecondaryCategoriesUI();
  });

  window.loadAllCategories = loadAllCategories;

  console.log('📂 categories.js carregado');
})();