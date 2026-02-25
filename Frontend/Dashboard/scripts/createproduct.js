// Frontend/Dashboard/scripts/createproduct.js — CORRIGIDO COM ESPERA
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
  // Validação de imagens
  const imageValidationContainer = document.getElementById('createImageValidationContainer');
  const imagePreviewGrid = document.getElementById('createImagePreviewGrid');

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

  // ===== ESPERAR PELO IMAGE VALIDATOR =====
  function waitForImageValidator() {
    return new Promise((resolve) => {
      if (window.ImageValidator) {
        console.log('✅ ImageValidator já está carregado');
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.ImageValidator) {
          console.log('✅ ImageValidator carregado');
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout de 5 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('⚠️ ImageValidator não carregou em tempo útil');
        resolve(); // Continua mesmo sem o validador
      }, 5000);
    });
  }

  // ===== VALIDAÇÃO E PREVIEW DE IMAGENS =====
  createImages?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      if (imageValidationContainer) imageValidationContainer.innerHTML = '';
      if (imagePreviewGrid) imagePreviewGrid.innerHTML = '';
      return;
    }

    // Esperar pelo ImageValidator
    if (!window.ImageValidator) {
      console.warn('⚠️ ImageValidator ainda não está disponível');
      await waitForImageValidator();
    }

    // Se ainda não estiver disponível, não mostra validação
    if (!window.ImageValidator) {
      console.warn('⚠️ ImageValidator não está disponível');
      return;
    }

    // Validar ficheiros
    const validation = window.ImageValidator.validateFiles(files);
    
    // Mostrar notificações
    if (imageValidationContainer) {
      window.ImageValidator.showNotifications('createImageValidationContainer', validation);
    }

    // Mostrar previews
    if (imagePreviewGrid) {
      imagePreviewGrid.innerHTML = '';
      
      for (const file of files) {
        const previewData = await window.ImageValidator.createPreviewWithValidation(file);
        
        if (previewData.preview) {
          const item = document.createElement('div');
          item.className = `image-preview-item ${previewData.validation.valid ? 'success' : 'error'}`;
          
          const img = document.createElement('img');
          img.src = previewData.preview;
          img.alt = file.name;
          
          const badge = document.createElement('div');
          badge.className = 'size-badge';
          badge.textContent = previewData.validation.formatted;
          badge.title = file.name;
          
          item.appendChild(img);
          item.appendChild(badge);
          imagePreviewGrid.appendChild(item);
        }
      }
    }
  });

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
      if (createImages?.files.length) {
        const files = Array.from(createImages.files);
        
        // Esperar pelo ImageValidator se necessário
        if (!window.ImageValidator) {
          await waitForImageValidator();
        }

        // Se temos o validador, usa-o
        let validFiles = files;
        if (window.ImageValidator) {
          const validation = window.ImageValidator.validateFiles(files);
          if (!validation.valid) {
            alert(`⚠️ Algumas imagens não são válidas:\n${validation.results.map(r => !r.valid ? `❌ ${r.file.name}` : `✅ ${r.file.name}`).join('\n')}`);
          }
          validFiles = validation.validFiles || [];
        }

        // Se não há imagens válidas, termina
        if (validFiles.length === 0) {
          console.warn('⚠️ Nenhuma imagem válida para enviar');
          createModal?.classList.add('hidden');
          window.reloadProducts?.();
          return;
        }

        const imgData = new FormData();
        for (let i = 0; i < Math.min(4, validFiles.length); i++) {
          imgData.append('images', validFiles[i]);
        }

        console.log('📤 A enviar imagens válidas:', validFiles.length);

        try {
          const imgRes = await fetch(`${API_BASE}/products/${newProduct.id}/images`, {
            method: 'POST',
            headers: authHeaders(),
            body: imgData
          });

          console.log('📥 Status da resposta:', imgRes.status);
          console.log('📥 Content-Type:', imgRes.headers.get('content-type'));

          // Verificar se a resposta é JSON válida
          const contentType = imgRes.headers.get('content-type');
          let imgBody;
          
          if (contentType && contentType.includes('application/json')) {
            imgBody = await imgRes.json();
          } else {
            const text = await imgRes.text();
            console.error('❌ Resposta não é JSON:', text);
            throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}`);
          }

          console.log('📥 Resposta do servidor:', imgBody);

          if (!imgRes.ok) {
            console.error('❌ Erro no upload de imagens:', imgBody);
            alert(`Produto criado mas erro nas imagens: ${imgBody.error || 'Erro desconhecido'}`);
          } else {
            console.log('✅ Imagens enviadas com sucesso:', imgBody);
          }
        } catch (imgErr) {
          console.error('❌ Erro ao fazer upload de imagens:', imgErr);
          alert(`Produto criado mas erro nas imagens: ${imgErr.message}`);
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

  // Esperar pelo ImageValidator ao carregar
  waitForImageValidator().then(() => {
    console.log('✅ createproduct.js carregado com ImageValidator');
  });
})();