// Frontend/Dashboard/scripts/materials.js
// Gestão de Materiais & Cores no Dashboard Admin
(() => {
  const API_BASE = '';
  const token    = localStorage.getItem('token');
  const LOG_TAG  = '🎨 [Materials]';

  function authHeaders() {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // ─────────────────────────────────────────────
  // LOGGER centralizado
  // ─────────────────────────────────────────────
  const log = {
    info:    (...a) => console.log(`${LOG_TAG}`,   ...a),
    success: (...a) => console.log(`✅ ${LOG_TAG}`, ...a),
    warn:    (...a) => console.warn(`⚠️ ${LOG_TAG}`, ...a),
    error:   (...a) => console.error(`❌ ${LOG_TAG}`, ...a),
    fetch:   (method, url) => console.log(`📡 ${LOG_TAG} ${method.toUpperCase()} ${url}`),
    action:  (action, detail) => console.log(`🔧 ${LOG_TAG} ${action}`, detail ?? ''),
  };

  // ─────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────
  let allMaterials = [];
  let allColors    = [];

  // ─────────────────────────────────────────────
  // ELEMENTOS
  // ─────────────────────────────────────────────
  const materialsList        = document.getElementById('materialsList');
  const colorsList           = document.getElementById('colorsList');
  const materialsCount       = document.getElementById('materialsCount');
  const colorsCount          = document.getElementById('colorsCount');
  const colorMaterialFilter  = document.getElementById('colorMaterialFilter');

  const addMaterialBtn       = document.getElementById('addMaterialBtn');
  const addColorBtn          = document.getElementById('addColorBtn');

  // Modal Material
  const materialModal        = document.getElementById('materialModal');
  const materialForm         = document.getElementById('materialForm');
  const materialModalTitle   = document.getElementById('materialModalTitle');
  const materialId           = document.getElementById('materialId');
  const materialName         = document.getElementById('materialName');
  const materialCategory     = document.getElementById('materialCategory');
  const materialBadge        = document.getElementById('materialBadge');
  const materialMultiplier   = document.getElementById('materialMultiplier');
  const materialPriceMin     = document.getElementById('materialPriceMin');
  const materialPriceMax     = document.getElementById('materialPriceMax');
  const materialTempMin      = document.getElementById('materialTempMin');
  const materialTempMax      = document.getElementById('materialTempMax');
  const materialDesc         = document.getElementById('materialDesc');
  const materialGradient     = document.getElementById('materialGradient');
  const materialImageUrl     = document.getElementById('materialImageUrl');
  const propResistance       = document.getElementById('propResistance');
  const propFlexibility      = document.getElementById('propFlexibility');
  const propDurability       = document.getElementById('propDurability');
  const propResistanceVal    = document.getElementById('propResistanceVal');
  const propFlexibilityVal   = document.getElementById('propFlexibilityVal');
  const propDurabilityVal    = document.getElementById('propDurabilityVal');
  const specsList            = document.getElementById('specsList');
  const addSpecBtn           = document.getElementById('addSpecBtn');
  const materialActive       = document.getElementById('materialActive');
  const materialFeatured     = document.getElementById('materialFeatured');
  const materialOrder        = document.getElementById('materialOrder');
  const materialFormError    = document.getElementById('materialFormError');
  const materialSubmitBtn    = document.getElementById('materialSubmitBtn');
  const deleteMaterialBtn    = document.getElementById('deleteMaterialBtn');

  // Modal Cor
  const colorModal           = document.getElementById('colorModal');
  const colorForm            = document.getElementById('colorForm');
  const colorModalTitle      = document.getElementById('colorModalTitle');
  const colorId              = document.getElementById('colorId');
  const colorName            = document.getElementById('colorName');
  const colorMaterialId      = document.getElementById('colorMaterialId');
  const colorHex             = document.getElementById('colorHex');
  const colorHexPicker       = document.getElementById('colorHexPicker');
  const colorMultiplier      = document.getElementById('colorMultiplier');
  const colorFinish          = document.getElementById('colorFinish');
  const colorCategory        = document.getElementById('colorCategory');
  const colorGradient        = document.getElementById('colorGradient');
  const colorSampleImage     = document.getElementById('colorSampleImage');
  const colorActive          = document.getElementById('colorActive');
  const colorFeatured        = document.getElementById('colorFeatured');
  const colorOrder           = document.getElementById('colorOrder');
  const colorFormError       = document.getElementById('colorFormError');
  const colorSubmitBtn       = document.getElementById('colorSubmitBtn');
  const deleteColorBtn       = document.getElementById('deleteColorBtn');

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  function enc(str) {
    const d = document.createElement('div');
    d.textContent = String(str ?? '');
    return d.innerHTML;
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function categoryLabel(cat) {
    const map = { pla:'PLA', abs:'ABS', petg:'PETG', tpu:'TPU', specialty:'Especial', flexible:'Flexível', other:'Outro' };
    return map[cat] || cat;
  }

  function finishLabel(f) {
    const map = { glossy:'Brilhante', matte:'Mate', metallic:'Metálico', transparent:'Translúcido', satin:'Acetinado', other:'Outro' };
    return map[f] || f;
  }

  function categoryColorClass(cat) {
    const map = { pla:'cat-pla', abs:'cat-abs', petg:'cat-petg', tpu:'cat-tpu', specialty:'cat-specialty', flexible:'cat-flexible', other:'cat-other' };
    return map[cat] || 'cat-other';
  }

  // ─────────────────────────────────────────────
  // CARREGAR MATERIAIS
  // ─────────────────────────────────────────────
  async function loadMaterials() {
    const url = `${API_BASE}/api/admin/materials`;
    log.fetch('GET', url);

    if (materialsList) materialsList.innerHTML = `
      <div class="mat-loading">⏳ A carregar materiais...</div>`;

    try {
      const res = await fetch(url, { headers: authHeaders() });

      log.info(`Resposta materiais: HTTP ${res.status}`);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allMaterials = await res.json();

      log.success(`${allMaterials.length} material(ais) carregado(s)`, allMaterials.map(m => `[${m.id}] ${m.name}`));

      if (materialsCount) materialsCount.textContent = allMaterials.length;
      renderMaterials();
      populateMaterialSelects();
    } catch (err) {
      log.error('loadMaterials falhou:', err);
      if (materialsList) materialsList.innerHTML = `
        <div class="mat-error-state">❌ Erro ao carregar materiais: ${enc(err.message)}</div>`;
    }
  }

  // ─────────────────────────────────────────────
  // CARREGAR CORES
  // ─────────────────────────────────────────────
  async function loadColors(filterMaterialId = '') {
    const qs  = filterMaterialId ? `?material_id=${filterMaterialId}` : '';
    const url = `${API_BASE}/api/admin/colors${qs}`;
    log.fetch('GET', url);

    if (filterMaterialId) {
      const matName = allMaterials.find(m => m.id == filterMaterialId)?.name || `ID ${filterMaterialId}`;
      log.info(`A filtrar cores por material: "${matName}"`);
    } else {
      log.info('A carregar todas as cores (sem filtro de material)');
    }

    if (colorsList) colorsList.innerHTML = `
      <div class="mat-loading">⏳ A carregar cores...</div>`;

    try {
      const res = await fetch(url, { headers: authHeaders() });

      log.info(`Resposta cores: HTTP ${res.status}`);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allColors = await res.json();

      log.success(`${allColors.length} cor(es) carregada(s)`, allColors.map(c => `[${c.id}] ${c.name} (${c.material_name})`));

      if (colorsCount) colorsCount.textContent = allColors.length;
      renderColors();
    } catch (err) {
      log.error('loadColors falhou:', err);
      if (colorsList) colorsList.innerHTML = `
        <div class="mat-error-state">❌ Erro ao carregar cores: ${enc(err.message)}</div>`;
    }
  }

  // ─────────────────────────────────────────────
  // RENDER MATERIAIS
  // ─────────────────────────────────────────────
  function renderMaterials() {
    if (!materialsList) return;
    log.info(`A renderizar ${allMaterials.length} materiais`);

    if (!allMaterials.length) {
      materialsList.innerHTML = `
        <div class="mat-empty-state">
          <span class="mat-empty-icon">⚙️</span>
          <p>Nenhum material criado.</p>
          <small>Clica em <strong>➕ NOVO MATERIAL</strong> para começar.</small>
        </div>`;
      return;
    }

    materialsList.innerHTML = allMaterials.map(m => {
      const gradStyle  = m.gradient ? `background:${m.gradient}` : `background:${m.hex_code || '#cccccc'}`;
      const activeClass = m.is_active ? '' : 'mat-row-inactive';
      const catClass    = categoryColorClass(m.category);

      return `
        <div class="mat-row ${activeClass}" data-id="${m.id}" title="ID: ${m.id} | Slug: ${enc(m.slug)}">
          <div class="mat-color-dot" style="${gradStyle}"></div>
          <span class="mat-name">${enc(m.name)}</span>
          <span class="mat-badge ${catClass}">${enc(categoryLabel(m.category))}</span>
          ${m.badge ? `<span class="mat-badge mat-badge-custom">${enc(m.badge)}</span>` : ''}
          ${!m.is_active ? `<span class="mat-badge mat-badge-off">INATIVO</span>` : ''}
          <span class="mat-multiplier">×${parseFloat(m.multiplier).toFixed(2)}</span>
          <span class="mat-colors-count" title="Cores ativas / Total">
            ${m.active_colors_count ?? 0}<span style="color:#ccc">/</span>${m.total_colors_count ?? 0} cores
          </span>
          <div class="mat-actions">
            <button class="mat-btn-add-color" data-action="add-color" data-id="${m.id}" title="Adicionar cor a este material">+ Cor</button>
            <button data-action="edit-material" data-id="${m.id}" title="Editar material">✏️</button>
            <button data-action="delete-material" data-id="${m.id}" class="btn-danger-sm" title="Eliminar material e todas as suas cores">🗑️</button>
          </div>
        </div>`;
    }).join('');

    materialsList.querySelectorAll('[data-action="edit-material"]').forEach(btn =>
      btn.addEventListener('click', () => {
        log.action('Abrir edição de material', `ID=${btn.dataset.id}`);
        openEditMaterial(parseInt(btn.dataset.id));
      })
    );
    materialsList.querySelectorAll('[data-action="delete-material"]').forEach(btn =>
      btn.addEventListener('click', () => {
        log.action('Pedido de eliminação de material', `ID=${btn.dataset.id}`);
        deleteMaterial(parseInt(btn.dataset.id));
      })
    );
    materialsList.querySelectorAll('[data-action="add-color"]').forEach(btn =>
      btn.addEventListener('click', () => {
        log.action('Abrir criar cor para material', `ID=${btn.dataset.id}`);
        openCreateColor(btn.dataset.id);
      })
    );
  }

  // ─────────────────────────────────────────────
  // RENDER CORES
  // ─────────────────────────────────────────────
  function renderColors() {
    if (!colorsList) return;
    log.info(`A renderizar ${allColors.length} cores`);

    if (!allColors.length) {
      colorsList.innerHTML = `
        <div class="mat-empty-state">
          <span class="mat-empty-icon">🎨</span>
          <p>Nenhuma cor criada.</p>
          <small>Clica em <strong>🎨 NOVA COR</strong> para começar.</small>
        </div>`;
      return;
    }

    // Agrupar por material para separadores visuais
    let lastMatId = null;
    const rows = allColors.map(c => {
      const bg           = c.gradient ? `background:${c.gradient}` : `background:${c.hex_code}`;
      const activeClass  = c.is_active ? '' : 'mat-row-inactive';
      const finishClass  = `finish-${c.finish}`;
      let separator      = '';

      if (c.material_id !== lastMatId) {
        if (lastMatId !== null) separator = `<div class="color-group-separator"></div>`;
        lastMatId = c.material_id;
      }

      return `${separator}
        <div class="mat-row ${activeClass}" data-id="${c.id}" title="ID: ${c.id} | Slug: ${enc(c.slug)} | Hex: ${enc(c.hex_code)}">
          <div class="color-dot-preview ${finishClass}" style="${bg}"></div>
          <span class="mat-name">${enc(c.name)}</span>
          <span class="mat-badge mat-badge-material">${enc(c.material_name || '—')}</span>
          <span class="mat-badge mat-badge-finish">${enc(finishLabel(c.finish))}</span>
          ${!c.is_active ? `<span class="mat-badge mat-badge-off">INATIVA</span>` : ''}
          <span class="mat-multiplier">×${parseFloat(c.multiplier).toFixed(2)}</span>
          <div class="mat-actions">
            <button data-action="edit-color" data-id="${c.id}" title="Editar cor">✏️</button>
            <button data-action="delete-color" data-id="${c.id}" class="btn-danger-sm" title="Eliminar cor">🗑️</button>
          </div>
        </div>`;
    }).join('');

    colorsList.innerHTML = rows;

    colorsList.querySelectorAll('[data-action="edit-color"]').forEach(btn =>
      btn.addEventListener('click', () => {
        log.action('Abrir edição de cor', `ID=${btn.dataset.id}`);
        openEditColor(parseInt(btn.dataset.id));
      })
    );
    colorsList.querySelectorAll('[data-action="delete-color"]').forEach(btn =>
      btn.addEventListener('click', () => {
        log.action('Pedido de eliminação de cor', `ID=${btn.dataset.id}`);
        deleteColor(parseInt(btn.dataset.id));
      })
    );
  }

  // ─────────────────────────────────────────────
  // POPULAR SELECTS DE MATERIAL
  // ─────────────────────────────────────────────
  function populateMaterialSelects() {
    if (colorMaterialId) {
      colorMaterialId.innerHTML = '<option value="">-- Selecionar --</option>' +
        allMaterials.map(m => `<option value="${m.id}">${enc(m.name)}</option>`).join('');
    }
    if (colorMaterialFilter) {
      const current = colorMaterialFilter.value;
      colorMaterialFilter.innerHTML = '<option value="">Todos os materiais</option>' +
        allMaterials.map(m => `<option value="${m.id}">${enc(m.name)}</option>`).join('');
      colorMaterialFilter.value = current;
    }
    log.info('Selects de material atualizados', `${allMaterials.length} opções`);
  }

  // ─────────────────────────────────────────────
  // SPECS — helpers
  // ─────────────────────────────────────────────
  function addSpecRow(value = '') {
    const row = document.createElement('div');
    row.className = 'spec-item';
    row.innerHTML = `
      <input type="text" placeholder="ex: Temperatura: 190-220°C" value="${enc(value)}" autocomplete="off">
      <button type="button" title="Remover">✕</button>`;
    row.querySelector('button').addEventListener('click', () => {
      log.action('Remover spec', value || '(vazio)');
      row.remove();
    });
    specsList.appendChild(row);
  }

  function getSpecs() {
    return Array.from(specsList.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);
  }

  function setSpecs(specs) {
    specsList.innerHTML = '';
    (specs || []).forEach(s => addSpecRow(s));
  }

  // ─────────────────────────────────────────────
  // MODAL MATERIAL — abrir criar
  // ─────────────────────────────────────────────
  function openCreateMaterial() {
    log.action('Abrir modal: NOVO MATERIAL');
    materialForm.reset();
    materialId.value = '';
    materialModalTitle.textContent = 'NOVO MATERIAL';
    deleteMaterialBtn.style.display = 'none';
    showError(materialFormError, '');
    setSpecs([]);
    propResistance.value  = 0; propResistanceVal.textContent  = '0';
    propFlexibility.value = 0; propFlexibilityVal.textContent = '0';
    propDurability.value  = 0; propDurabilityVal.textContent  = '0';
    document.getElementById('materialGradientPreview').style.background = '';
    materialModal.classList.remove('hidden');
    materialName.focus();
  }

  // ─────────────────────────────────────────────
  // MODAL MATERIAL — abrir editar
  // ─────────────────────────────────────────────
  function openEditMaterial(id) {
    const m = allMaterials.find(x => x.id === id);
    if (!m) { log.warn(`Material ID=${id} não encontrado no estado local`); return; }

    log.action('Abrir modal: EDITAR MATERIAL', { id: m.id, name: m.name, category: m.category, active: m.is_active });

    materialId.value         = m.id;
    materialModalTitle.textContent = `EDITAR — ${m.name}`;
    materialName.value       = m.name        || '';
    materialCategory.value   = m.category    || 'pla';
    materialBadge.value      = m.badge       || '';
    materialMultiplier.value = m.multiplier  || 1;
    materialPriceMin.value   = m.price_per_kg_min || '';
    materialPriceMax.value   = m.price_per_kg_max || '';
    materialTempMin.value    = m.temp_min    || '';
    materialTempMax.value    = m.temp_max    || '';
    materialDesc.value       = m.description || '';
    materialGradient.value   = m.gradient    || '';
    materialImageUrl.value   = m.image_url   || '';
    materialActive.checked   = m.is_active;
    materialFeatured.checked = m.is_featured;
    materialOrder.value      = m.display_order || 0;

    propResistance.value  = m.prop_resistance  || 0; propResistanceVal.textContent  = m.prop_resistance  || 0;
    propFlexibility.value = m.prop_flexibility || 0; propFlexibilityVal.textContent = m.prop_flexibility || 0;
    propDurability.value  = m.prop_durability  || 0; propDurabilityVal.textContent  = m.prop_durability  || 0;

    document.getElementById('materialGradientPreview').style.background = m.gradient || '';
    setSpecs(m.specs || []);

    deleteMaterialBtn.style.display = 'inline-flex';
    showError(materialFormError, '');
    materialModal.classList.remove('hidden');
    materialName.focus();
  }

  // ─────────────────────────────────────────────
  // SUBMIT MATERIAL
  // ─────────────────────────────────────────────
  materialForm?.addEventListener('submit', async e => {
    e.preventDefault();
    showError(materialFormError, '');

    const id   = materialId.value;
    const body = {
      name:             materialName.value.trim(),
      category:         materialCategory.value,
      badge:            materialBadge.value.trim() || null,
      multiplier:       parseFloat(materialMultiplier.value),
      price_per_kg_min: materialPriceMin.value !== '' ? parseFloat(materialPriceMin.value) : null,
      price_per_kg_max: materialPriceMax.value !== '' ? parseFloat(materialPriceMax.value) : null,
      temp_min:         materialTempMin.value  !== '' ? parseInt(materialTempMin.value)    : null,
      temp_max:         materialTempMax.value  !== '' ? parseInt(materialTempMax.value)    : null,
      description:      materialDesc.value.trim()    || null,
      gradient:         materialGradient.value.trim()    || null,
      image_url:        materialImageUrl.value.trim()    || null,
      prop_resistance:  parseInt(propResistance.value),
      prop_flexibility: parseInt(propFlexibility.value),
      prop_durability:  parseInt(propDurability.value),
      specs:            getSpecs(),
      is_active:        materialActive.checked,
      is_featured:      materialFeatured.checked,
      display_order:    parseInt(materialOrder.value) || 0,
    };

    if (!body.name)        { showError(materialFormError, 'Nome é obrigatório'); return; }
    if (isNaN(body.multiplier) || body.multiplier <= 0) { showError(materialFormError, 'Multiplicador inválido'); return; }

    const url    = id ? `${API_BASE}/api/admin/materials/${id}` : `${API_BASE}/api/admin/materials`;
    const method = id ? 'PUT' : 'POST';
    const action = id ? `ATUALIZAR material ID=${id}` : 'CRIAR novo material';

    log.fetch(method, url);
    log.action(action, body);

    materialSubmitBtn.disabled = true;
    materialSubmitBtn.textContent = '⏳ A guardar...';

    try {
      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();

      log.info(`Resposta ${method} material: HTTP ${res.status}`, data);

      if (!res.ok) throw new Error(data.error || 'Erro ao guardar');

      log.success(`Material "${data.name}" (ID=${data.id}) guardado com sucesso`);

      materialModal.classList.add('hidden');
      await loadMaterials();
      await loadColors(colorMaterialFilter?.value || '');
      window.showNotification?.(`Material "${data.name}" guardado com sucesso`, 'success');
    } catch (err) {
      log.error(`${action} falhou:`, err);
      showError(materialFormError, err.message);
    } finally {
      materialSubmitBtn.disabled = false;
      materialSubmitBtn.textContent = '💾 GUARDAR MATERIAL';
    }
  });

  // ─────────────────────────────────────────────
  // ELIMINAR MATERIAL
  // ─────────────────────────────────────────────
  async function deleteMaterial(id) {
    const m = allMaterials.find(x => x.id === id);
    if (!m) return;

    log.action(`Confirmação de eliminação: "${m.name}" (ID=${id})`, `Cores associadas: ${m.total_colors_count ?? '?'}`);

    if (!confirm(`Eliminar o material "${m.name}" e todas as suas cores?\n\nEsta ação não pode ser revertida.`)) {
      log.info('Eliminação cancelada pelo utilizador');
      return;
    }

    const url = `${API_BASE}/api/admin/materials/${id}`;
    log.fetch('DELETE', url);

    try {
      const res  = await fetch(url, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();

      log.info(`Resposta DELETE material: HTTP ${res.status}`, data);

      if (!res.ok) throw new Error(data.error || 'Erro ao eliminar');

      log.success(`Material "${m.name}" (ID=${id}) eliminado com sucesso`);

      materialModal.classList.add('hidden');
      await loadMaterials();
      await loadColors(colorMaterialFilter?.value || '');
      window.showNotification?.(`Material "${m.name}" eliminado`, 'success');
    } catch (err) {
      log.error(`Eliminação de material ID=${id} falhou:`, err);
      alert(err.message);
    }
  }

  deleteMaterialBtn?.addEventListener('click', () => {
    const id = parseInt(materialId.value);
    if (id) deleteMaterial(id);
  });

  // ─────────────────────────────────────────────
  // MODAL COR — abrir criar
  // ─────────────────────────────────────────────
  function openCreateColor(presetMaterialId = '') {
    const presetName = presetMaterialId
      ? allMaterials.find(m => m.id == presetMaterialId)?.name || `ID ${presetMaterialId}`
      : '(sem pré-seleção)';

    log.action('Abrir modal: NOVA COR', `Material pré-selecionado: ${presetName}`);

    colorForm.reset();
    colorId.value = '';
    colorModalTitle.textContent = 'NOVA COR';
    deleteColorBtn.style.display = 'none';
    showError(colorFormError, '');
    colorHex.value       = '#000000';
    colorHexPicker.value = '#000000';
    document.getElementById('colorGradientPreview').style.background = '#000000';
    populateMaterialSelects();
    if (presetMaterialId) colorMaterialId.value = presetMaterialId;
    colorModal.classList.remove('hidden');
    colorName.focus();
  }

  // ─────────────────────────────────────────────
  // MODAL COR — abrir editar
  // ─────────────────────────────────────────────
  function openEditColor(id) {
    const c = allColors.find(x => x.id === id);
    if (!c) { log.warn(`Cor ID=${id} não encontrada no estado local`); return; }

    log.action('Abrir modal: EDITAR COR', {
      id: c.id, name: c.name, material: c.material_name,
      hex: c.hex_code, finish: c.finish, active: c.is_active
    });

    populateMaterialSelects();

    colorId.value               = c.id;
    colorModalTitle.textContent = `EDITAR — ${c.name}`;
    colorName.value             = c.name          || '';
    colorMaterialId.value       = c.material_id   || '';
    colorHex.value              = c.hex_code      || '#000000';
    colorHexPicker.value        = c.hex_code      || '#000000';
    colorMultiplier.value       = c.multiplier    || 1;
    colorFinish.value           = c.finish        || 'glossy';
    colorCategory.value         = c.category      || 'basic';
    colorGradient.value         = c.gradient      || '';
    colorSampleImage.value      = c.sample_image  || '';
    colorActive.checked         = c.is_active;
    colorFeatured.checked       = c.is_featured;
    colorOrder.value            = c.display_order || 0;

    document.getElementById('colorGradientPreview').style.background = c.gradient || c.hex_code || '#000';

    deleteColorBtn.style.display = 'inline-flex';
    showError(colorFormError, '');
    colorModal.classList.remove('hidden');
    colorName.focus();
  }

  // ─────────────────────────────────────────────
  // SUBMIT COR
  // ─────────────────────────────────────────────
  colorForm?.addEventListener('submit', async e => {
    e.preventDefault();
    showError(colorFormError, '');

    const id   = colorId.value;
    const body = {
      name:          colorName.value.trim(),
      material_id:   parseInt(colorMaterialId.value),
      hex_code:      colorHex.value.trim(),
      multiplier:    parseFloat(colorMultiplier.value),
      finish:        colorFinish.value,
      category:      colorCategory.value,
      gradient:      colorGradient.value.trim()    || null,
      sample_image:  colorSampleImage.value.trim() || null,
      is_active:     colorActive.checked,
      is_featured:   colorFeatured.checked,
      display_order: parseInt(colorOrder.value) || 0,
    };

    if (!body.name)         { showError(colorFormError, 'Nome é obrigatório');     return; }
    if (!body.material_id)  { showError(colorFormError, 'Material é obrigatório'); return; }
    if (!/^#[0-9A-Fa-f]{6}$/.test(body.hex_code)) { showError(colorFormError, 'Código hex inválido (ex: #FF0000)'); return; }

    const url    = id ? `${API_BASE}/api/admin/colors/${id}` : `${API_BASE}/api/admin/colors`;
    const method = id ? 'PUT' : 'POST';
    const action = id ? `ATUALIZAR cor ID=${id}` : 'CRIAR nova cor';

    log.fetch(method, url);
    log.action(action, body);

    colorSubmitBtn.disabled = true;
    colorSubmitBtn.textContent = '⏳ A guardar...';

    try {
      const res  = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();

      log.info(`Resposta ${method} cor: HTTP ${res.status}`, data);

      if (!res.ok) throw new Error(data.error || 'Erro ao guardar');

      log.success(`Cor "${data.name}" (ID=${data.id}) guardada com sucesso`);

      colorModal.classList.add('hidden');
      await loadColors(colorMaterialFilter?.value || '');
      await loadMaterials(); // Atualizar contagem de cores nos materiais
      window.showNotification?.(`Cor "${data.name}" guardada com sucesso`, 'success');
    } catch (err) {
      log.error(`${action} falhou:`, err);
      showError(colorFormError, err.message);
    } finally {
      colorSubmitBtn.disabled = false;
      colorSubmitBtn.textContent = '💾 GUARDAR COR';
    }
  });

  // ─────────────────────────────────────────────
  // ELIMINAR COR
  // ─────────────────────────────────────────────
  async function deleteColor(id) {
    const c = allColors.find(x => x.id === id);
    if (!c) return;

    log.action(`Confirmação de eliminação: cor "${c.name}" (ID=${id})`, `Material: ${c.material_name}`);

    if (!confirm(`Eliminar a cor "${c.name}"?\n\nEsta ação não pode ser revertida.`)) {
      log.info('Eliminação de cor cancelada pelo utilizador');
      return;
    }

    const url = `${API_BASE}/api/admin/colors/${id}`;
    log.fetch('DELETE', url);

    try {
      const res  = await fetch(url, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();

      log.info(`Resposta DELETE cor: HTTP ${res.status}`, data);

      if (!res.ok) throw new Error(data.error || 'Erro ao eliminar');

      log.success(`Cor "${c.name}" (ID=${id}) eliminada com sucesso`);

      colorModal.classList.add('hidden');
      await loadColors(colorMaterialFilter?.value || '');
      await loadMaterials(); // Atualizar contagem de cores nos materiais
      window.showNotification?.(`Cor "${c.name}" eliminada`, 'success');
    } catch (err) {
      log.error(`Eliminação de cor ID=${id} falhou:`, err);
      alert(err.message);
    }
  }

  deleteColorBtn?.addEventListener('click', () => {
    const id = parseInt(colorId.value);
    if (id) deleteColor(id);
  });

  // ─────────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────────
  addMaterialBtn?.addEventListener('click', openCreateMaterial);
  addColorBtn?.addEventListener('click',   () => openCreateColor(colorMaterialFilter?.value || ''));
  addSpecBtn?.addEventListener('click',    () => { log.action('Adicionar linha de spec'); addSpecRow(); });

  colorMaterialFilter?.addEventListener('change', () => {
    const val = colorMaterialFilter.value;
    const name = val ? allMaterials.find(m => m.id == val)?.name || val : 'todos';
    log.action(`Filtro de cores alterado para: ${name}`);
    loadColors(val);
  });

  // Fechar modais
  materialModal?.querySelector('[data-close="material"]')?.addEventListener('click', () => {
    log.info('Modal de material fechado');
    materialModal.classList.add('hidden');
  });
  colorModal?.querySelector('[data-close="color"]')?.addEventListener('click', () => {
    log.info('Modal de cor fechado');
    colorModal.classList.add('hidden');
  });

  materialModal?.addEventListener('click', e => { if (e.target === materialModal) materialModal.classList.add('hidden'); });
  colorModal?.addEventListener('click',    e => { if (e.target === colorModal)    colorModal.classList.add('hidden'); });

  // ─────────────────────────────────────────────
  // CARREGAR AO ENTRAR NA ABA
  // ─────────────────────────────────────────────
  document.querySelector('[data-tab="materials"]')?.addEventListener('click', () => {
    log.info('Tab Materials ativada');
    if (!allMaterials.length) {
      log.info('Primeiro acesso — a carregar dados...');
      loadMaterials().then(() => loadColors());
    } else {
      log.info('Dados já em memória — sem re-fetch (usa Recarregar se necessário)');
    }
  });

  // Botão de recarregar (se existir no HTML)
  document.getElementById('reloadMaterialsBtn')?.addEventListener('click', () => {
    log.action('Recarregamento manual solicitado');
    loadMaterials().then(() => loadColors(colorMaterialFilter?.value || ''));
  });

  // Exportar para uso externo
  window.reloadMaterials = () => {
    log.action('reloadMaterials() chamado externamente');
    return loadMaterials().then(() => loadColors(colorMaterialFilter?.value || ''));
  };
  window.reloadColors = (matId) => {
    log.action('reloadColors() chamado externamente', matId ? `material_id=${matId}` : 'todos');
    return loadColors(matId || '');
  };

  log.info('materials.js carregado ✓');
})();