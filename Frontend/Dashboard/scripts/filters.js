// Frontend/Dashboard/scripts/filters.js - NOVO SISTEMA DE FILTROS
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  // ============================================================
  // STATE
  // ============================================================
  let selectedCategoryId = null;
  let selectedFilterId = null;

  // ============================================================
  // HELPERS
  // ============================================================
  function authHeaders() {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  function showModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  }

  function hideModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  }

  // ============================================================
  // 1. CARREGAR CATEGORIAS PRIMÁRIAS
  // ============================================================
  async function loadPrimaryCategories() {
    try {
      const res = await fetch(`${API_BASE}/api/categories/primary`, { headers: authHeaders() });
      const categories = await res.json();

      const select = document.getElementById('filterCategorySelect');
      select.innerHTML = '<option value="">-- Seleciona uma categoria --</option>';
      
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon || ''} ${cat.name}`;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        selectedCategoryId = e.target.value ? parseInt(e.target.value) : null;
        selectedFilterId = null;
        if (selectedCategoryId) {
          document.getElementById('filtersManagementSection').style.display = 'block';
          document.getElementById('filterDetailsSection').style.display = 'none';
          loadFilters();
        } else {
          document.getElementById('filtersManagementSection').style.display = 'none';
          document.getElementById('filterDetailsSection').style.display = 'none';
        }
      });
    } catch (err) {
      console.error('❌ Erro ao carregar categorias:', err);
    }
  }

  // ============================================================
  // 2. CARREGAR FILTROS
  // ============================================================
  async function loadFilters() {
    if (!selectedCategoryId) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/categories/${selectedCategoryId}/filters`,
        { headers: authHeaders() }
      );
      const filters = await res.json();

      const list = document.getElementById('filtersList');
      if (!filters.length) {
        list.innerHTML = '<p style="color: #666; padding: 16px;">Nenhum filtro. Cria o primeiro! ➕</p>';
        return;
      }

      list.innerHTML = filters.map(f => `
        <div class="filter-card" data-id="${f.id}">
          <div class="filter-header">
            <div class="filter-title">
              <strong>${f.filter_name}</strong>
              <span class="filter-key">${f.filter_key}</span>
              <span class="filter-type">${f.filter_type}</span>
            </div>
            <div class="filter-actions">
              <button class="filter-edit-btn" data-id="${f.id}">✏️</button>
              <button class="filter-view-tags-btn" data-id="${f.id}">🏷️ ${f.tags?.length || 0} tags</button>
            </div>
          </div>
          ${f.description ? `<p class="filter-desc">${f.description}</p>` : ''}
        </div>
      `).join('');

      // Events
      list.querySelectorAll('.filter-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openFilterModal(parseInt(btn.dataset.id)));
      });

      list.querySelectorAll('.filter-view-tags-btn').forEach(btn => {
        btn.addEventListener('click', () => selectFilterForTags(parseInt(btn.dataset.id)));
      });
    } catch (err) {
      console.error('❌ Erro ao carregar filtros:', err);
    }
  }

  // ============================================================
  // 3. CRIAR/EDITAR FILTRO
  // ============================================================
  function openFilterModal(filterId = null) {
    const modal = document.getElementById('filterModal');
    const form = document.getElementById('filterForm');
    const title = document.getElementById('filterModalTitle');
    const deleteBtn = document.getElementById('deleteFilterBtn');

    form.reset();

    if (filterId) {
      // Editar - buscar dados
      const filterCard = document.querySelector(`[data-id="${filterId}"]`);
      if (filterCard) {
        const key = filterCard.querySelector('.filter-key').textContent;
        const name = filterCard.querySelector('strong').textContent;
        const type = filterCard.querySelector('.filter-type').textContent;
        const desc = filterCard.querySelector('.filter-desc')?.textContent || '';

        document.getElementById('filterId').value = filterId;
        document.getElementById('filterKey').value = key;
        document.getElementById('filterName').value = name;
        document.getElementById('filterType').value = type;
        document.getElementById('filterDescription').value = desc;
        document.getElementById('filterActive').checked = true;

        title.textContent = '✏️ Editar Filtro';
        deleteBtn.style.display = 'block';

        deleteBtn.onclick = () => deleteFilter(filterId);
      }
    } else {
      // Criar novo
      document.getElementById('filterId').value = '';
      title.textContent = '➕ Novo Filtro';
      deleteBtn.style.display = 'none';
    }

    showModal('filterModal');
  }

  document.getElementById('filterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const filterId = document.getElementById('filterId').value;
    const body = {
      filter_key: document.getElementById('filterKey').value,
      filter_name: document.getElementById('filterName').value,
      filter_type: document.getElementById('filterType').value,
      description: document.getElementById('filterDescription').value,
      display_order: 0,
      is_active: document.getElementById('filterActive').checked
    };

    try {
      const url = filterId
        ? `${API_BASE}/api/admin/filters/${filterId}`
        : `${API_BASE}/api/admin/categories/${selectedCategoryId}/filters`;
      const method = filterId ? 'PUT' : 'POST';

      const res = await fetch(url, { 
        method, 
        headers: authHeaders(), 
        body: JSON.stringify(body) 
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro');
      }

      hideModal('filterModal');
      await loadFilters();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  });

  async function deleteFilter(filterId) {
    if (!confirm('Eliminar este filtro e todos os seus tags?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/filters/${filterId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) throw new Error('Erro ao eliminar');

      hideModal('filterModal');
      await loadFilters();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  }

  // ============================================================
  // 4. SELECIONAR FILTRO PARA VER/GERENCIAR TAGS
  // ============================================================
  async function selectFilterForTags(filterId) {
    selectedFilterId = filterId;

    // Buscar nome do filtro
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/categories/${selectedCategoryId}/filters`,
        { headers: authHeaders() }
      );
      const filters = await res.json();
      const filter = filters.find(f => f.id === filterId);

      if (filter) {
        document.getElementById('selectedFilterName').textContent = filter.filter_name;
      }
    } catch (err) {
      console.error('Erro:', err);
    }

    document.getElementById('filterDetailsSection').style.display = 'block';
    await loadTags();
  }

  // ============================================================
  // 5. CARREGAR TAGS
  // ============================================================
  async function loadTags() {
    if (!selectedFilterId) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/filters/${selectedFilterId}/tags`,
        { headers: authHeaders() }
      );
      const tags = await res.json();

      const list = document.getElementById('tagsList');
      if (!tags.length) {
        list.innerHTML = '<p style="color: #666; padding: 16px;">Nenhum tag. Cria o primeiro! ➕</p>';
        return;
      }

      list.innerHTML = tags.map(t => `
        <div class="tag-card" data-id="${t.id}">
          <div class="tag-header">
            <div class="tag-info">
              <strong>${t.tag_name}</strong>
              <span class="tag-key">${t.tag_key}</span>
              <span class="tag-count">📊 ${t.product_count || 0} produtos</span>
            </div>
            <div class="tag-actions">
              <button class="tag-edit-btn" data-id="${t.id}">✏️</button>
              <button class="tag-delete-btn" data-id="${t.id}">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('.tag-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openTagModal(parseInt(btn.dataset.id)));
      });

      list.querySelectorAll('.tag-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteTag(parseInt(btn.dataset.id)));
      });
    } catch (err) {
      console.error('❌ Erro ao carregar tags:', err);
    }
  }

  // ============================================================
  // 6. CRIAR/EDITAR TAG
  // ============================================================
  function openTagModal(tagId = null) {
    const modal = document.getElementById('tagModal');
    const form = document.getElementById('tagForm');
    const title = document.getElementById('tagModalTitle');
    const deleteBtn = document.getElementById('deleteTagBtn');

    form.reset();
    document.getElementById('tagFilterId').value = selectedFilterId;

    if (tagId) {
      // Editar
      const tagCard = document.querySelector(`[data-id="${tagId}"]`);
      if (tagCard) {
        const name = tagCard.querySelector('strong').textContent;
        const key = tagCard.querySelector('.tag-key').textContent;

        document.getElementById('tagId').value = tagId;
        document.getElementById('tagName').value = name;
        document.getElementById('tagKey').value = key;
        document.getElementById('tagActive').checked = true;

        title.textContent = '✏️ Editar Tag';
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = () => deleteTag(tagId);
      }
    } else {
      // Criar novo
      document.getElementById('tagId').value = '';
      title.textContent = '➕ Novo Tag';
      deleteBtn.style.display = 'none';
    }

    showModal('tagModal');
  }

  document.getElementById('tagForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tagId = document.getElementById('tagId').value;
    const filterId = document.getElementById('tagFilterId').value;
    const body = {
      tag_name: document.getElementById('tagName').value,
      tag_key: document.getElementById('tagKey').value || null
    };

    try {
      const url = tagId
        ? `${API_BASE}/api/admin/tags/${tagId}`
        : `${API_BASE}/api/admin/filters/${filterId}/tags`;
      const method = tagId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro');
      }

      hideModal('tagModal');
      await loadTags();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  });

  async function deleteTag(tagId) {
    if (!confirm('Eliminar este tag (será removido dos produtos)?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/tags/${tagId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) throw new Error('Erro ao eliminar');

      hideModal('tagModal');
      await loadTags();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  }

  // ============================================================
  // 7. BOTÕES PRINCIPAIS
  // ============================================================
  document.getElementById('addFilterBtn')?.addEventListener('click', () => {
    openFilterModal();
  });

  document.getElementById('addTagBtn')?.addEventListener('click', () => {
    if (!selectedFilterId) {
      alert('⚠️ Seleciona um filtro primeiro!');
      return;
    }
    openTagModal();
  });

  // ============================================================
  // 8. FECHAR MODAIS
  // ============================================================
  document.querySelector('[data-close="filter"]')?.addEventListener('click', () => {
    hideModal('filterModal');
  });

  document.querySelector('[data-close="tag"]')?.addEventListener('click', () => {
    hideModal('tagModal');
  });

  // ============================================================
  // 9. INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    loadPrimaryCategories();
  });

  console.log('✅ filters.js carregado');
})();