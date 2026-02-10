// Frontend/Dashboard/scripts/attributes-manager.js
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  let selectedSubcategoryId = null;
  let currentAttributes = [];

  // ===== ELEMENTOS DOM =====
  const subcategorySelect = document.getElementById('attributeSubcategorySelect');
  const attributesContainer = document.getElementById('attributesContainer');
  const addAttributeBtn = document.getElementById('addAttributeBtn');
  const attributeModal = document.getElementById('attributeModal');
  const attributeForm = document.getElementById('attributeForm');
  
  // ===== HELPERS =====
  function authHeaders() {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  function showModal() {
    attributeModal.classList.remove('hidden');
  }

  function hideModal() {
    attributeModal.classList.add('hidden');
    attributeForm.reset();
    document.getElementById('optionsContainer').style.display = 'none';
  }

  // ===== LOAD SUBCATEGORIES =====
  async function loadSubcategories() {
    try {
      const res = await fetch(`${API_BASE}/subcategories`, {
        headers: authHeaders()
      });
      const subcategories = await res.json();

      subcategorySelect.innerHTML = '<option value="">-- Seleciona Subcategoria --</option>';
      
      subcategories.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.id;
        option.textContent = sub.name;
        subcategorySelect.appendChild(option);
      });

    } catch (err) {
      console.error('Erro ao carregar subcategorias:', err);
    }
  }

  // ===== LOAD ATTRIBUTES BY SUBCATEGORY =====
  async function loadAttributes(subcategoryId) {
    if (!subcategoryId) {
      attributesContainer.innerHTML = '<p>Seleciona uma subcategoria para ver os atributos</p>';
      addAttributeBtn.disabled = true;
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/attributes/subcategory/${subcategoryId}`, {
        headers: authHeaders()
      });
      currentAttributes = await res.json();

      addAttributeBtn.disabled = false;
      renderAttributes();

    } catch (err) {
      console.error('Erro ao carregar atributos:', err);
      attributesContainer.innerHTML = '<p style="color:red;">Erro ao carregar atributos</p>';
    }
  }

  // ===== RENDER ATTRIBUTES =====
  function renderAttributes() {
    if (!currentAttributes.length) {
      attributesContainer.innerHTML = '<p>Nenhum atributo definido. Clica em "+ Novo Atributo" para adicionar.</p>';
      return;
    }

    attributesContainer.innerHTML = currentAttributes.map(attr => `
      <div class="attribute-item" data-id="${attr.id}">
        <div class="attribute-info">
          <h4>${attr.attribute_name}</h4>
          <span class="attribute-type">${attr.attribute_type}</span>
          ${attr.is_required ? '<span class="required-badge">Obrigatório</span>' : ''}
          ${attr.attribute_options ? `<p class="options">Opções: ${JSON.parse(attr.attribute_options).join(', ')}</p>` : ''}
        </div>
        <div class="attribute-actions">
          <button class="edit-attr-btn" data-id="${attr.id}">✏️ Editar</button>
          <button class="delete-attr-btn" data-id="${attr.id}">🗑️ Eliminar</button>
        </div>
      </div>
    `).join('');

    // Event listeners
    document.querySelectorAll('.edit-attr-btn').forEach(btn => {
      btn.addEventListener('click', () => editAttribute(btn.dataset.id));
    });

    document.querySelectorAll('.delete-attr-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteAttribute(btn.dataset.id));
    });
  }

  // ===== ADD/EDIT ATTRIBUTE =====
  addAttributeBtn.addEventListener('click', () => {
    document.getElementById('attributeModalTitle').textContent = 'Novo Atributo';
    document.getElementById('attributeId').value = '';
    showModal();
  });

  async function editAttribute(attributeId) {
    const attr = currentAttributes.find(a => a.id == attributeId);
    if (!attr) return;

    document.getElementById('attributeModalTitle').textContent = 'Editar Atributo';
    document.getElementById('attributeId').value = attr.id;
    document.getElementById('attributeName').value = attr.attribute_name;
    document.getElementById('attributeType').value = attr.attribute_type;
    document.getElementById('attributeRequired').checked = attr.is_required;
    document.getElementById('displayOrder').value = attr.display_order;

    if (attr.attribute_options) {
      document.getElementById('optionsContainer').style.display = 'block';
      document.getElementById('attributeOptions').value = JSON.parse(attr.attribute_options).join('\n');
    }

    showModal();
  }

  // ===== SAVE ATTRIBUTE =====
  attributeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const attributeId = document.getElementById('attributeId').value;
    const attributeName = document.getElementById('attributeName').value;
    const attributeType = document.getElementById('attributeType').value;
    const isRequired = document.getElementById('attributeRequired').checked;
    const displayOrder = document.getElementById('displayOrder').value;

    let attributeOptions = null;
    if (attributeType === 'select' || attributeType === 'multiselect') {
      const optionsText = document.getElementById('attributeOptions').value.trim();
      if (optionsText) {
        attributeOptions = optionsText.split('\n').filter(o => o.trim());
      }
    }

    const data = {
      attribute_name: attributeName,
      attribute_type: attributeType,
      attribute_options: attributeOptions,
      is_required: isRequired,
      display_order: parseInt(displayOrder) || 0
    };

    try {
      let res;
      if (attributeId) {
        // Update
        res = await fetch(`${API_BASE}/attributes/${attributeId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(data)
        });
      } else {
        // Create
        res = await fetch(`${API_BASE}/attributes/subcategory/${selectedSubcategoryId}`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(data)
        });
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao guardar atributo');
      }

      console.log('✅ Atributo guardado com sucesso');
      hideModal();
      await loadAttributes(selectedSubcategoryId);

    } catch (err) {
      console.error('Erro ao guardar atributo:', err);
      alert(err.message);
    }
  });

  // ===== DELETE ATTRIBUTE =====
  async function deleteAttribute(attributeId) {
    if (!confirm('Tens a certeza que queres eliminar este atributo?\n\nTodos os valores associados aos produtos serão perdidos!')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/attributes/${attributeId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (!res.ok) throw new Error('Erro ao eliminar atributo');

      console.log('✅ Atributo eliminado');
      await loadAttributes(selectedSubcategoryId);

    } catch (err) {
      console.error('Erro ao eliminar atributo:', err);
      alert('Erro ao eliminar atributo');
    }
  }

  // ===== SHOW/HIDE OPTIONS BASED ON TYPE =====
  document.getElementById('attributeType').addEventListener('change', (e) => {
    const optionsContainer = document.getElementById('optionsContainer');
    if (e.target.value === 'select' || e.target.value === 'multiselect') {
      optionsContainer.style.display = 'block';
    } else {
      optionsContainer.style.display = 'none';
    }
  });

  // ===== SUBCATEGORY CHANGE =====
  subcategorySelect.addEventListener('change', (e) => {
    selectedSubcategoryId = e.target.value;
    loadAttributes(selectedSubcategoryId);
  });

  // ===== CLOSE MODAL =====
  document.querySelector('[data-close="attribute"]').addEventListener('click', hideModal);

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', loadSubcategories);

})();