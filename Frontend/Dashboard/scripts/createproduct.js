// Frontend/Dashboard/scripts/createproduct.js — ATUALIZADO
(() => {
  const API_BASE = '';
  const token = localStorage.getItem('token');

  const createModal    = document.getElementById('createProductModal');
  const createForm     = document.getElementById('createProductForm');
  const createName     = document.getElementById('createName');
  const createPrice    = document.getElementById('createPrice');
  const createStock    = document.getElementById('createStock');
  const createModelFile = document.getElementById('createModelFile');
  const createImages   = document.getElementById('createImages');
  const addProductBtn  = document.getElementById('addProductBtn');
  const createCloseBtn = createModal?.querySelector('[data-close="create"]');

  // Categoria principal
  const primaryCatSelect = document.getElementById('createPrimaryCategory');
  // Categorias secundárias
  const secondaryContainer = document.getElementById('createSecondaryCategories');
  // Editor de descrição
  const createDescEditor = document.getElementById('createDescEditor');

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== POPULAR SELECTS =====
  function populateCategories() {
    // Categoria primária
    if (primaryCatSelect) {
      primaryCatSelect.innerHTML = '<option value="">-- Seleciona categoria principal --</option>';
      (window._primaryCategories || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon || ''} ${c.name}`;
        primaryCatSelect.appendChild(opt);
      });
    }

    // Categorias secundárias (checkboxes)
    if (secondaryContainer) {
      secondaryContainer.innerHTML = (window._secondaryCategories || []).map(c => `
        <label class="sec-cat-checkbox">
          <input type="checkbox" value="${c.id}" class="sec-cat-input">
          <span class="sec-cat-badge role-${c.category_role || 'secondary'}">${c.category_role === 'tag' ? '🏷️' : '📌'} ${c.name}</span>
        </label>
      `).join('');
    }
  }

  // Reagir quando categorias forem carregadas
  document.addEventListener('categoriesLoaded', populateCategories);

  // ===== ABRIR MODAL =====
  addProductBtn?.addEventListener('click', () => {
    createForm?.reset();
    if (createDescEditor) createDescEditor.innerHTML = '';
    populateCategories();
    createModal?.classList.remove('hidden');
  });

  createCloseBtn?.addEventListener('click', () => {
    createModal?.classList.add('hidden');
  });

  // ===== SUBMIT =====
  createForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const primaryCatId = primaryCatSelect?.value;
    if (!primaryCatId) {
      alert('⚠️ Seleciona uma categoria principal');
      return;
    }

    // Categorias secundárias selecionadas
    const secIds = Array.from(
      secondaryContainer?.querySelectorAll('.sec-cat-input:checked') || []
    ).map(cb => parseInt(cb.value));

    // Descrição HTML do editor
    const descriptionHtml = createDescEditor?.innerHTML || '';

    try {
      const formData = new FormData();
      formData.append('name',                   createName.value);
      formData.append('price',                  createPrice.value);
      formData.append('description',            descriptionHtml);
      formData.append('stock',                  createStock.checked);
      formData.append('primary_category_id',    primaryCatId);
      formData.append('secondary_category_ids', JSON.stringify(secIds));

      if (createModelFile?.files[0]) {
        formData.append('modelFile', createModelFile.files[0]);
      }

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar produto');
      }

      const newProduct = await res.json();

      // Upload de imagens
// Upload de imagens
if (createImages?.files.length) {
  const imgData = new FormData();
  for (let i = 0; i < Math.min(4, createImages.files.length); i++) {
    imgData.append('images', createImages.files[i]);
  }

  console.log('📤 A enviar imagens para:', `${API_BASE}/products/${newProduct.id}/images`);
  console.log('📦 Número de imagens:', createImages.files.length);
  for (let i = 0; i < createImages.files.length; i++) {
    console.log(`  Imagem ${i+1}:`, createImages.files[i].name, createImages.files[i].size, 'bytes');
  }

  const imgRes = await fetch(`${API_BASE}/products/${newProduct.id}/images`, {
    method: 'POST',
    headers: authHeaders(),
    body: imgData
  });

  const imgBody = await imgRes.json();
  console.log('📥 Resposta do servidor:', imgRes.status, imgBody);

  if (!imgRes.ok) {
    console.error('❌ Erro no upload de imagens:', imgBody);
    alert(`Produto criado mas erro nas imagens: ${imgBody.error || 'Erro desconhecido'}`);
  } else {
    console.log('✅ Imagens enviadas com sucesso:', imgBody);
  }
}

      createModal?.classList.add('hidden');
      window.reloadProducts?.();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao criar produto');
    }
  });

  document.addEventListener('DOMContentLoaded', populateCategories);

  console.log('✅ createproduct.js carregado');
})();