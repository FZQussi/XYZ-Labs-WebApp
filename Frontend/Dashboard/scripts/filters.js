// Frontend/Dashboard/scripts/filters.js
(() => {
  const API_BASE = '';
  const token = () => localStorage.getItem('token');

  // ============================================================
  // STATE — dados em memória, nunca lidos do DOM
  // ============================================================
  let selectedCategoryId = null;
  let selectedFilterId   = null;
  let filtersData        = [];   // cache local dos filtros carregados
  let tagsData           = [];   // cache local das tags carregadas

  // ============================================================
  // HELPERS
  // ============================================================
  function authHeaders() {
    return { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
  }

  function showModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
  function hideModal(id)  { document.getElementById(id)?.classList.add('hidden'); }

  function encodeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setLoading(containerId, msg = '⏳ A carregar...') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="loading-state" style="padding:16px">${msg}</div>`;
  }

  function setError(containerId, msg = 'Erro ao carregar.') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div style="color:red;padding:16px;font-family:'Courier New',monospace">${msg}</div>`;
  }

  // ============================================================
  // 1. CARREGAR CATEGORIAS PRIMÁRIAS NO SELECT
  // ============================================================
  async function loadPrimaryCategories() {
    const select = document.getElementById('filterCategorySelect');
    if (!select) return;

    try {
      const res = await fetch(`${API_BASE}/api/categories/primary`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const categories = await res.json();

      select.innerHTML = '<option value="">-- Seleciona uma categoria --</option>';
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon || '📂'} ${cat.name}`;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error('❌ Erro ao carregar categorias:', err);
      select.innerHTML = '<option value="">Erro ao carregar categorias</option>';
    }
  }

  // ============================================================
  // 2. CARREGAR FILTROS DA CATEGORIA SELECIONADA
  // ============================================================
  async function loadFilters() {
    if (!selectedCategoryId) return;

    setLoading('filtersList');

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/categories/${selectedCategoryId}/filters`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      filtersData = await res.json();
      renderFilters();
    } catch (err) {
      console.error('❌ Erro ao carregar filtros:', err);
      setError('filtersList', '❌ Erro ao carregar filtros. Verifica a ligação ao servidor.');
    }
  }

  function renderFilters() {
    const list = document.getElementById('filtersList');
    if (!list) return;

    if (!filtersData.length) {
      list.innerHTML = `
        <div style="padding:24px;text-align:center;font-family:'Courier New',monospace;color:#666">
          Nenhum filtro criado para esta categoria.<br>
          <strong>Clica em "➕ Novo Filtro" para começar.</strong>
        </div>`;
      return;
    }

    list.innerHTML = filtersData.map(f => `
      <div class="category-row" data-filter-id="${f.id}" style="align-items:flex-start;gap:12px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="cat-name">${encodeHTML(f.filter_name)}</span>
            <span style="font-family:'Courier New',monospace;font-size:11px;background:#f0f0f0;border:1px solid #ccc;padding:2px 6px">${encodeHTML(f.filter_key)}</span>
            <span style="font-family:'Courier New',monospace;font-size:11px;background:#000;color:#fff;padding:2px 6px">${encodeHTML(f.filter_type)}</span>
            ${!f.is_active ? '<span style="font-size:11px;color:#999;font-family:\'Courier New\',monospace">INATIVO</span>' : ''}
          </div>
          ${f.description ? `<div style="font-size:12px;color:#666;margin-top:4px;font-family:'Courier New',monospace">${encodeHTML(f.description)}</div>` : ''}
          <div style="font-size:11px;color:#aaa;margin-top:2px;font-family:'Courier New',monospace">
            ${Array.isArray(f.tags) && f.tags.length ? `${f.tags.length} tag(s)` : 'Sem tags'}
          </div>
        </div>
        <div class="cat-actions" style="flex-shrink:0">
          <button class="secondary-btn filter-tags-btn" data-id="${f.id}" title="Ver/gerir tags">🏷️ Tags</button>
          <button class="secondary-btn filter-edit-btn" data-id="${f.id}" title="Editar filtro">✏️ Editar</button>
          <button class="btn-danger filter-delete-btn" data-id="${f.id}" title="Eliminar filtro">🗑️</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.filter-tags-btn').forEach(btn => {
      btn.addEventListener('click', () => selectFilterForTags(parseInt(btn.dataset.id)));
    });
    list.querySelectorAll('.filter-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openFilterModal(parseInt(btn.dataset.id)));
    });
    list.querySelectorAll('.filter-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteFilter(parseInt(btn.dataset.id)));
    });
  }

  // ============================================================
  // 3. ABRIR MODAL DE FILTRO (criar ou editar)
  // ============================================================
  function openFilterModal(filterId = null) {
    const form       = document.getElementById('filterForm');
    const title      = document.getElementById('filterModalTitle');
    const deleteBtn  = document.getElementById('deleteFilterBtn');
    const idInput    = document.getElementById('filterId');
    const keyInput   = document.getElementById('filterKey');
    const nameInput  = document.getElementById('filterName');
    const typeSelect = document.getElementById('filterType');
    const descInput  = document.getElementById('filterDescription');
    const orderInput = document.getElementById('filterOrder');
    const activeChk  = document.getElementById('filterActive');

    form.reset();

    if (filterId) {
      // Editar — buscar dados do state em memória
      const filter = filtersData.find(f => f.id === filterId);
      if (!filter) return;

      idInput.value    = filter.id;
      keyInput.value   = filter.filter_key;
      nameInput.value  = filter.filter_name;
      typeSelect.value = filter.filter_type;
      descInput.value  = filter.description || '';
      orderInput.value = filter.display_order || 0;
      activeChk.checked = filter.is_active !== false;

      // filter_key não pode ser alterado após criação (evita inconsistências)
      keyInput.disabled = true;
      keyInput.title = 'A chave não pode ser alterada após criação';

      title.textContent = '✏️ EDITAR FILTRO';
      deleteBtn.style.display = 'block';
    } else {
      // Criar novo
      idInput.value = '';
      keyInput.disabled = false;
      keyInput.title = '';
      activeChk.checked = true;
      title.textContent = '➕ NOVO FILTRO';
      deleteBtn.style.display = 'none';
    }

    showModal('filterModal');
  }

  // ============================================================
  // 4. SUBMETER FORM DE FILTRO
  // ============================================================
  async function handleFilterFormSubmit(e) {
    e.preventDefault();

    const filterId  = document.getElementById('filterId').value;
    const submitBtn = document.querySelector('#filterForm button[type="submit"]');

    const body = {
      filter_key:    document.getElementById('filterKey').value.trim().toLowerCase().replace(/\s+/g, '_'),
      filter_name:   document.getElementById('filterName').value.trim(),
      filter_type:   document.getElementById('filterType').value,
      description:   document.getElementById('filterDescription').value.trim(),
      display_order: parseInt(document.getElementById('filterOrder').value) || 0,
      is_active:     document.getElementById('filterActive').checked
    };

    if (!body.filter_key || !body.filter_name) {
      alert('⚠️ Chave e Nome são obrigatórios.');
      return;
    }

    // Validar chave: apenas lowercase, números e underscore
    if (!/^[a-z0-9_]+$/.test(body.filter_key)) {
      alert('⚠️ A chave só pode conter letras minúsculas, números e underscore (_).');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ A guardar...';

    try {
      const url    = filterId
        ? `${API_BASE}/api/admin/filters/${filterId}`
        : `${API_BASE}/api/admin/categories/${selectedCategoryId}/filters`;
      const method = filterId ? 'PUT' : 'POST';

      // Se é PUT, não enviar filter_key (não pode ser alterada)
      if (filterId) delete body.filter_key;

      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);

      hideModal('filterModal');
      await loadFilters();
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Guardar Filtro';
    }
  }

  // ============================================================
  // 5. ELIMINAR FILTRO
  // ============================================================
  async function deleteFilter(filterId) {
    const filter = filtersData.find(f => f.id === filterId);
    const nome   = filter ? filter.filter_name : `#${filterId}`;
    const tagsN  = Array.isArray(filter?.tags) ? filter.tags.length : '?';

    if (!confirm(`Eliminar o filtro "${nome}"?\n\nIsso irá apagar também todos os ${tagsN} tag(s) associados e removê-los dos produtos.\n\nEsta ação não pode ser desfeita.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/filters/${filterId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);

      // Se o filtro eliminado era o selecionado, esconder secção de tags
      if (selectedFilterId === filterId) {
        selectedFilterId = null;
        document.getElementById('filterDetailsSection').style.display = 'none';
      }

      hideModal('filterModal');
      await loadFilters();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  }

  // ============================================================
  // 6. SELECIONAR FILTRO PARA VER TAGS
  // ============================================================
  async function selectFilterForTags(filterId) {
    selectedFilterId = filterId;
    const filter = filtersData.find(f => f.id === filterId);

    const nameEl = document.getElementById('selectedFilterName');
    if (nameEl) nameEl.textContent = filter ? filter.filter_name : `#${filterId}`;

    document.getElementById('filterDetailsSection').style.display = 'block';
    document.getElementById('filterDetailsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

    await loadTags();
  }

  // ============================================================
  // 7. CARREGAR TAGS DO FILTRO SELECIONADO
  // ============================================================
  async function loadTags() {
    if (!selectedFilterId) return;

    setLoading('tagsList');

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/filters/${selectedFilterId}/tags`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      tagsData = await res.json();
      renderTags();
    } catch (err) {
      console.error('❌ Erro ao carregar tags:', err);
      setError('tagsList', '❌ Erro ao carregar tags.');
    }
  }

  function renderTags() {
    const list = document.getElementById('tagsList');
    if (!list) return;

    if (!tagsData.length) {
      list.innerHTML = `
        <div style="padding:24px;text-align:center;font-family:'Courier New',monospace;color:#666">
          Nenhum tag criado para este filtro.<br>
          <strong>Clica em "➕ Novo Tag" para adicionar opções.</strong>
        </div>`;
      return;
    }

    list.innerHTML = tagsData.map(t => `
      <div class="category-row" data-tag-id="${t.id}">
        <span class="cat-name">${encodeHTML(t.tag_name)}</span>
        <span style="font-family:'Courier New',monospace;font-size:11px;background:#f0f0f0;border:1px solid #ccc;padding:2px 6px">${encodeHTML(t.tag_key || '')}</span>
        <span style="font-size:12px;color:#666;font-family:'Courier New',monospace">📊 ${t.product_count || 0} produto(s)</span>
        ${!t.is_active ? '<span style="font-size:11px;color:#999;font-family:\'Courier New\',monospace">INATIVO</span>' : ''}
        <div class="cat-actions" style="margin-left:auto">
          <button class="secondary-btn tag-edit-btn" data-id="${t.id}">✏️ Editar</button>
          <button class="btn-danger tag-delete-btn" data-id="${t.id}">🗑️</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.tag-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openTagModal(parseInt(btn.dataset.id)));
    });
    list.querySelectorAll('.tag-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteTag(parseInt(btn.dataset.id)));
    });
  }

  // ============================================================
  // 8. ABRIR MODAL DE TAG (criar ou editar)
  // ============================================================
  function openTagModal(tagId = null) {
    const form      = document.getElementById('tagForm');
    const title     = document.getElementById('tagModalTitle');
    const deleteBtn = document.getElementById('deleteTagBtn');
    const idInput   = document.getElementById('tagId');
    const nameInput = document.getElementById('tagName');
    const keyInput  = document.getElementById('tagKey');
    const orderInput = document.getElementById('tagOrder');
    const activeChk  = document.getElementById('tagActive');

    form.reset();
    document.getElementById('tagFilterId').value = selectedFilterId;

    if (tagId) {
      const tag = tagsData.find(t => t.id === tagId);
      if (!tag) return;

      idInput.value    = tag.id;
      nameInput.value  = tag.tag_name;
      keyInput.value   = tag.tag_key || '';
      orderInput.value = tag.display_order || 0;
      activeChk.checked = tag.is_active !== false;

      title.textContent = '✏️ EDITAR TAG';
      deleteBtn.style.display = 'block';
    } else {
      idInput.value = '';
      activeChk.checked = true;
      title.textContent = '➕ NOVO TAG';
      deleteBtn.style.display = 'none';
    }

    showModal('tagModal');
  }

  // ============================================================
  // 9. SUBMETER FORM DE TAG
  // ============================================================
  async function handleTagFormSubmit(e) {
    e.preventDefault();

    const tagId    = document.getElementById('tagId').value;
    const filterId = document.getElementById('tagFilterId').value;
    const submitBtn = document.querySelector('#tagForm button[type="submit"]');

    const body = {
      tag_name:      document.getElementById('tagName').value.trim(),
      tag_key:       document.getElementById('tagKey').value.trim() || null,
      display_order: parseInt(document.getElementById('tagOrder').value) || 0,
      is_active:     document.getElementById('tagActive').checked
    };

    if (!body.tag_name) {
      alert('⚠️ O nome do tag é obrigatório.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ A guardar...';

    try {
      const url    = tagId
        ? `${API_BASE}/api/admin/tags/${tagId}`
        : `${API_BASE}/api/admin/filters/${filterId}/tags`;
      const method = tagId ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);

      hideModal('tagModal');
      await loadTags();
      // Recarregar filtros para atualizar contagem de tags
      await loadFilters();
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Guardar Tag';
    }
  }

  // ============================================================
  // 10. ELIMINAR TAG
  // ============================================================
  async function deleteTag(tagId) {
    const tag   = tagsData.find(t => t.id === tagId);
    const nome  = tag ? tag.tag_name : `#${tagId}`;
    const count = tag?.product_count || 0;

    const aviso = count > 0
      ? `\n\n⚠️ Este tag está associado a ${count} produto(s) — será removido de todos eles.`
      : '';

    if (!confirm(`Eliminar o tag "${nome}"?${aviso}\n\nEsta ação não pode ser desfeita.`)) return;

    try {
      const res  = await fetch(`${API_BASE}/api/admin/tags/${tagId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro HTTP ${res.status}`);

      hideModal('tagModal');
      await loadTags();
      await loadFilters(); // atualizar contagem
    } catch (err) {
      alert('❌ ' + err.message);
    }
  }

  // ============================================================
  // 11. INICIALIZAÇÃO — tudo dentro do DOMContentLoaded
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {

    // --- Select de categoria ---
    const categorySelect = document.getElementById('filterCategorySelect');
    categorySelect?.addEventListener('change', (e) => {
      selectedCategoryId = e.target.value ? parseInt(e.target.value) : null;
      selectedFilterId   = null;

      const mgmtSection    = document.getElementById('filtersManagementSection');
      const detailsSection = document.getElementById('filterDetailsSection');

      if (selectedCategoryId) {
        mgmtSection.style.display    = 'block';
        detailsSection.style.display = 'none';
        loadFilters();
      } else {
        mgmtSection.style.display    = 'none';
        detailsSection.style.display = 'none';
        filtersData = [];
        tagsData    = [];
      }
    });

    // --- Botão Novo Filtro ---
    document.getElementById('addFilterBtn')?.addEventListener('click', () => {
      if (!selectedCategoryId) {
        alert('⚠️ Seleciona uma categoria primeiro.');
        return;
      }
      openFilterModal();
    });

    // --- Botão Novo Tag ---
    document.getElementById('addTagBtn')?.addEventListener('click', () => {
      if (!selectedFilterId) {
        alert('⚠️ Seleciona um filtro primeiro (clica em 🏷️ Tags).');
        return;
      }
      openTagModal();
    });

    // --- Form de filtro ---
    document.getElementById('filterForm')?.addEventListener('submit', handleFilterFormSubmit);

    // --- Form de tag ---
    document.getElementById('tagForm')?.addEventListener('submit', handleTagFormSubmit);

    // --- Botão eliminar filtro (dentro do modal) ---
    document.getElementById('deleteFilterBtn')?.addEventListener('click', () => {
      const filterId = parseInt(document.getElementById('filterId').value);
      if (filterId) deleteFilter(filterId);
    });

    // --- Botão eliminar tag (dentro do modal) ---
    document.getElementById('deleteTagBtn')?.addEventListener('click', () => {
      const tagId = parseInt(document.getElementById('tagId').value);
      if (tagId) deleteTag(tagId);
    });

    // --- Fechar modais ---
    document.querySelector('[data-close="filter"]')?.addEventListener('click', () => hideModal('filterModal'));
    document.querySelector('[data-close="tag"]')?.addEventListener('click',    () => hideModal('tagModal'));

    // --- Fechar modal ao clicar fora ---
    ['filterModal', 'tagModal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideModal(id);
      });
    });

    // --- Auto-gerar filter_key a partir do nome (só na criação) ---
    const filterNameInput = document.getElementById('filterName');
    const filterKeyInput  = document.getElementById('filterKey');

    filterNameInput?.addEventListener('input', () => {
      // Só auto-preencher se for criação (key não está disabled) e o campo estiver vazio ou igual ao auto-gerado anterior
      if (!filterKeyInput.disabled) {
        const autoKey = filterNameInput.value
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .replace(/_+/g, '_');
        filterKeyInput.value = autoKey;
      }
    });

    // --- Carregar categorias quando a aba de filtros é aberta ---
    // Integração com o sistema de tabs do dashboard
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tab === 'filters') {
          loadPrimaryCategories();
        }
      });
    });

    // Carregar imediatamente se a aba já estiver ativa
    const filtersSection = document.getElementById('filters');
    if (filtersSection && !filtersSection.classList.contains('hidden')) {
      loadPrimaryCategories();
    }

    console.log('✅ filters.js inicializado');
  });

})();