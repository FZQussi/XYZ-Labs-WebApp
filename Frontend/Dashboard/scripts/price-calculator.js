// ============================================
// PRICE-CALCULATOR.JS — Calculadora de Impressão 3D
// Todo o cálculo é delegado ao backend via API.
// O frontend apenas recolhe inputs e apresenta resultados.
// ============================================

(() => {

  // API_BASE: lê de window.API_BASE (se definido no HTML/dashboard),
  // ou usa o valor por defeito. Para mudar o URL do servidor, define
  //   window.API_BASE = 'http://...'; numa <script> no dashboard.html
  //   antes de carregar este ficheiro.
  const API_BASE = (typeof window.API_BASE !== 'undefined' && window.API_BASE)
    ? window.API_BASE
    : 'http://localhost:3001';

  // ===== STATE =====
  let filaments    = [{ id: 1, material: 'PLA', costPerKg: 19.99, weight: 1 }];
  let savedQuotes  = JSON.parse(localStorage.getItem('calc_saved_quotes') || '[]');
  let selectedTier = 'standard';
  let customMargin = 50;
  let lastResult   = null;
  let calcDebounce = null;

  const DONUT_COLORS = {
    packaging: '#00FFFF',
    hardware:  '#00FF00',
    labor:     '#FFFF00',
    machine:   '#FF6600',
    material:  '#FF00FF'
  };

  const TIER_MARGINS = { competitive: 25, standard: 40, premium: 60, luxury: 80 };

  // ===== FORMAT =====
  function fmt(n) {
    return Number(n).toLocaleString('pt-PT', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + ' €';
  }
  function fmtShort(n) {
    return Number(n).toLocaleString('pt-PT', {
      minimumFractionDigits: 2, maximumFractionDigits: 4
    });
  }
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ===== AUTH HEADERS =====
  function authHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // ===== BUILD PAYLOAD =====
  function buildPayload() {
    const g = id => parseFloat(document.getElementById(id)?.value) || 0;

    return {
      filaments:    filaments.map(f => ({
        material:   f.material,
        costPerKg:  f.costPerKg,
        weight:     f.weight
      })),
      printHours:    g('calcPrintHours')    || 1,
      printMins:     g('calcPrintMins'),
      laborMins:     g('calcLaborMins'),
      hardwareCost:  g('calcHardwareCost'),
      packagingCost: g('calcPackagingCost'),
      vatRate:       g('calcVatRate')       || 20,
      laborRate:     g('calcLaborRate')     || 20,
      efficiency:    g('calcEfficiency')    || 1.1,
      printerCost:   g('calcPrinterCost')   || 749,
      upfrontCost:   g('calcUpfrontCost'),
      maintenance:   g('calcMaintenance')   || 75,
      printerLife:   g('calcPrinterLife')   || 3,
      uptime:        g('calcUptime')        || 50,
      powerW:        g('calcPowerW')        || 150,
      energyRate:    g('calcEnergyRate')    || 0.20,
      bufferFactor:  g('calcBufferFactor')  || 1.3,
      customMargin:  customMargin
    };
  }

  // ===== FETCH CALCULATION FROM BACKEND =====
  async function fetchCalcResult() {
    const payload = buildPayload();
    const url = `${API_BASE}/api/dashboard/calculate-full`;

    let res;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: authHeaders(),
        body:    JSON.stringify(payload)
      });
    } catch (networkErr) {
      // Falha de rede: servidor não responde, CORS bloqueado, etc.
      const msg = `Não foi possível ligar ao servidor (${API_BASE}). Verifica se o backend está a correr.`;
      console.error('❌ [Calculadora] Erro de rede:', networkErr.message, '→ URL:', url);
      if (window.showNotification) window.showNotification(msg, 'error');
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      console.warn('⚠️ [Calculadora] Sem autorização — verifica o token de sessão.');
      if (window.showNotification) window.showNotification('Sessão expirada. Faz login novamente.', 'warning');
      return null;
    }

    if (!res.ok) {
      let errMsg = `Erro HTTP ${res.status}`;
      try { const body = await res.json(); errMsg = body.error || errMsg; } catch (_) {}
      console.error('❌ [Calculadora] Resposta de erro:', res.status, errMsg);
      if (window.showNotification) window.showNotification('Erro no cálculo: ' + errMsg, 'error');
      return null;
    }

    try {
      return await res.json();
    } catch (parseErr) {
      console.error('❌ [Calculadora] Resposta inválida do servidor:', parseErr.message);
      if (window.showNotification) window.showNotification('Resposta inválida do servidor.', 'error');
      return null;
    }
  }

  // ===== UPDATE UI WITH BACKEND RESULT =====
  function updateUI(result) {
    if (!result) return;
    lastResult = result;

    const { breakdown, suggestedPrices, printerMetrics } = result;

    // Peso display
    const tw = document.getElementById('calcTotalWeightDisplay');
    if (tw) {
      const totalW = filaments.reduce((s, f) => s + f.weight, 0);
      tw.textContent = totalW.toFixed(2) + 'g';
    }

    // Breakdown
    setText('breakdownMaterial',  fmt(breakdown.materialCost));
    setText('breakdownHardware',  fmt(breakdown.hardwareCost));
    setText('breakdownPackaging', fmt(breakdown.packagingCost));
    setText('breakdownLabor',     fmt(breakdown.laborCost));
    setText('breakdownMachine',   fmt(breakdown.machineCost));
    setText('breakdownTotal',     fmt(breakdown.baseLanded));
    setText('donutTotalValue',    fmt(breakdown.baseLanded));
    setText('allocationTotal',    fmt(breakdown.baseLanded));

    // Pricing tiers
    ['competitive', 'standard', 'premium', 'luxury'].forEach(tier => {
      const t = suggestedPrices[tier];
      if (!t) return;
      setText(`price${capitalize(tier)}`, fmt(t.price));
      setText(`vat${capitalize(tier)}`,   fmt(t.priceVat) + ' c/ IVA');
    });

    // Custom tier
    const custom = suggestedPrices.custom;
    if (custom) {
      setText('priceCustom',       fmt(custom.price));
      setText('vatCustom',         fmt(custom.priceVat) + ' c/ IVA');
      setText('customMarginLabel', custom.margin + '% margem de lucro');
    }

    // Selected price
    const sel = suggestedPrices[selectedTier] || suggestedPrices.standard;
    if (sel) {
      setText('selectedPriceDisplay', fmt(sel.priceVat) + ' c/ IVA');
      setText('selectedMarginDisplay', sel.margin + '% margem');
    }

    // Advanced metrics
    if (printerMetrics) {
      setText('metricTotalInvestment', fmt(printerMetrics.totalInvestment));
      setText('metricLifetimeCost',    fmt(printerMetrics.lifetimeCost));
      setText('metricUptime',          printerMetrics.uptimeHoursPerYear + ' hrs/ano');
      setText('metricDepreciation',    fmtShort(printerMetrics.depreciation)         + ' €/hr');
      setText('metricMaintenanceCost', fmtShort(printerMetrics.maintenanceCostPerHr) + ' €/hr');
      setText('metricPrinterCost',     fmtShort(printerMetrics.printerCostPerHr)     + ' €/hr');
    }

    updateDonut(breakdown);
  }

  // ===== TRIGGER (debounced) =====
  function triggerCalculation() {
    clearTimeout(calcDebounce);
    calcDebounce = setTimeout(async () => {
      const result = await fetchCalcResult();
      updateUI(result);
    }, 350);
  }

  // ===== DONUT CHART =====
  function updateDonut(breakdown) {
    const svg = document.getElementById('costDonut');
    if (!svg || !breakdown) return;

    const total = breakdown.baseLanded;
    if (total <= 0) return;

    const segments = [
      { label: 'Embalagem',   value: breakdown.packagingCost, color: DONUT_COLORS.packaging },
      { label: 'Hardware',    value: breakdown.hardwareCost,  color: DONUT_COLORS.hardware  },
      { label: 'Mão de Obra', value: breakdown.laborCost,     color: DONUT_COLORS.labor     },
      { label: 'Máquina',     value: breakdown.machineCost,   color: DONUT_COLORS.machine   },
      { label: 'Material',    value: breakdown.materialCost,  color: DONUT_COLORS.material  }
    ];

    svg.querySelectorAll('.donut-seg').forEach(s => s.remove());

    const cx = 100, cy = 100, radius = 70, strokeW = 30;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    segments.forEach(seg => {
      const fraction = seg.value / total;
      const dash     = fraction * circumference;
      const circle   = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class',            'donut-seg');
      circle.setAttribute('cx',               cx);
      circle.setAttribute('cy',               cy);
      circle.setAttribute('r',                radius);
      circle.setAttribute('fill',             'none');
      circle.setAttribute('stroke',           seg.color);
      circle.setAttribute('stroke-width',     strokeW);
      circle.setAttribute('stroke-dasharray', `${dash} ${circumference - dash}`);
      circle.setAttribute('stroke-dashoffset', circumference - offset * circumference);
      circle.setAttribute('transform',        `rotate(-90 ${cx} ${cy})`);
      svg.appendChild(circle);
      offset += fraction;
    });

    const legend = document.getElementById('calcLegend');
    if (legend) {
      legend.innerHTML = segments.map(s => {
        const pct = ((s.value / total) * 100).toFixed(1);
        return `
          <div class="legend-item">
            <span class="legend-dot" style="background:${s.color}"></span>
            <span class="legend-label">${s.label}</span>
            <span class="legend-value">${fmt(s.value)}</span>
            <span class="legend-pct">${pct}%</span>
          </div>
        `;
      }).join('');
    }

    const largest    = segments.reduce((a, b) => a.value > b.value ? a : b);
    const largestPct = ((largest.value / total) * 100).toFixed(1);
    setText('allocationLargest', `Maior: ${largest.label} (${largestPct}%)`);
  }

  // ===== FILAMENTS =====
  function renderFilaments() {
    const container = document.getElementById('filamentsContainer');
    if (!container) return;

    container.innerHTML = filaments.map((f, i) => `
      <div class="filament-row" data-filament-id="${f.id}">
        <div class="filament-row-header">
          <span class="filament-row-num">Material ${i + 1}</span>
          ${filaments.length > 1
            ? `<button class="filament-remove-btn" data-id="${f.id}">×</button>`
            : ''}
        </div>
        <div class="filament-row-inputs">
          <div class="form-group">
            <label>Material</label>
            <select class="filament-material" data-id="${f.id}">
              <option value="PLA"   ${f.material==='PLA'   ?'selected':''}>PLA</option>
              <option value="PETG"  ${f.material==='PETG'  ?'selected':''}>PETG</option>
              <option value="ABS"   ${f.material==='ABS'   ?'selected':''}>ABS</option>
              <option value="TPU"   ${f.material==='TPU'   ?'selected':''}>TPU</option>
              <option value="ASA"   ${f.material==='ASA'   ?'selected':''}>ASA</option>
              <option value="Nylon" ${f.material==='Nylon' ?'selected':''}>Nylon</option>
              <option value="Resin" ${f.material==='Resin' ?'selected':''}>Resina</option>
            </select>
          </div>
          <div class="form-group">
            <label>Custo/kg (€)</label>
            <input type="number" class="filament-cost"   data-id="${f.id}"
              value="${f.costPerKg}" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label>Peso (g)</label>
            <input type="number" class="filament-weight" data-id="${f.id}"
              value="${f.weight}" min="0" step="0.1">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.filament-material').forEach(el => {
      el.addEventListener('change', e => {
        const f = filaments.find(x => x.id == e.target.dataset.id);
        if (f) { f.material = e.target.value; triggerCalculation(); }
      });
    });
    container.querySelectorAll('.filament-cost').forEach(el => {
      el.addEventListener('input', e => {
        const f = filaments.find(x => x.id == e.target.dataset.id);
        if (f) { f.costPerKg = parseFloat(e.target.value) || 0; triggerCalculation(); }
      });
    });
    container.querySelectorAll('.filament-weight').forEach(el => {
      el.addEventListener('input', e => {
        const f = filaments.find(x => x.id == e.target.dataset.id);
        if (f) { f.weight = parseFloat(e.target.value) || 0; triggerCalculation(); }
      });
    });
    container.querySelectorAll('.filament-remove-btn').forEach(el => {
      el.addEventListener('click', e => {
        filaments = filaments.filter(x => x.id != e.target.dataset.id);
        renderFilaments();
        triggerCalculation();
      });
    });
  }

  // ===== SAVED QUOTES =====
  function renderSavedQuotes() {
    const container = document.getElementById('savedQuotesList');
    if (!container) return;

    if (!savedQuotes.length) {
      container.innerHTML = '<div class="calc-empty-state">Nenhum orçamento guardado ainda.</div>';
      return;
    }

    container.innerHTML = savedQuotes.map((q, i) => `
      <div class="quote-item">
        <div class="quote-item-info">
          <div class="quote-item-name">${q.name || 'Peça sem nome'}</div>
          <div class="quote-item-price">${q.selectedPrice} (${q.margin}% margem)</div>
          <div class="quote-item-date">${q.date}</div>
        </div>
        <button class="quote-delete-btn" data-index="${i}">×</button>
      </div>
    `).join('');

    container.querySelectorAll('.quote-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index);
        savedQuotes.splice(idx, 1);
        localStorage.setItem('calc_saved_quotes', JSON.stringify(savedQuotes));
        renderSavedQuotes();
      });
    });
  }

  // ===== INIT EVENTS =====
  function initEvents() {

    // Inputs → recalculate
    [
      'calcTotalWeight','calcPrintHours','calcPrintMins','calcLaborMins',
      'calcHardwareCost','calcPackagingCost','calcVatRate',
      'calcLaborRate','calcEfficiency','calcPrinterCost','calcUpfrontCost',
      'calcMaintenance','calcPrinterLife','calcUptime','calcPowerW',
      'calcEnergyRate','calcBufferFactor','calcPrinterProfile'
    ].forEach(id => document.getElementById(id)?.addEventListener('input', triggerCalculation));

    // Add filament
    document.getElementById('addFilamentBtn')?.addEventListener('click', () => {
      if (filaments.length >= 4) { alert('Máximo 4 materiais.'); return; }
      filaments.push({ id: Date.now(), material: 'PLA', costPerKg: 19.99, weight: 0 });
      renderFilaments();
      triggerCalculation();
    });

    // ── ADVANCED SETTINGS TOGGLE ─────────────────────────────
    // Corrigido: usa getElementById diretamente em vez de event delegation
    const advancedToggle = document.getElementById('advancedToggle');
    const advancedBody   = document.getElementById('advancedSettingsBody');

    if (advancedToggle && advancedBody) {
      // Estado inicial: fechado
      advancedBody.style.display = 'none';
      advancedToggle.checked     = false;

      advancedToggle.addEventListener('change', function () {
        advancedBody.style.display = this.checked ? 'block' : 'none';
      });
    } else {
      console.warn('⚠️ [Calculadora] Elementos do toggle avançado não encontrados no DOM.');
    }

    // Pricing tier selection
    document.querySelectorAll('.pricing-tier').forEach(tier => {
      tier.addEventListener('click', () => {
        document.querySelectorAll('.pricing-tier').forEach(t => t.classList.remove('selected'));
        document.querySelector('.calc-custom-pricing')?.classList.remove('selected');
        tier.classList.add('selected');
        selectedTier = Object.keys(TIER_MARGINS).find(k => tier.classList.contains(k)) || 'standard';
        if (lastResult) updateUI(lastResult);
      });
    });

    // Custom pricing block
    const customPricingEl = document.querySelector('.calc-custom-pricing');
    customPricingEl?.addEventListener('click', () => {
      document.querySelectorAll('.pricing-tier').forEach(t => t.classList.remove('selected'));
      customPricingEl.classList.add('selected');
      selectedTier = 'custom';
      if (lastResult) updateUI(lastResult);
    });

    // Prevent slider/input from bubbling to custom pricing block
    document.getElementById('customMarginSlider')?.addEventListener('click', e => e.stopPropagation());
    document.getElementById('customMarginInput')?.addEventListener('click',  e => e.stopPropagation());

    document.getElementById('customMarginSlider')?.addEventListener('input', e => {
      customMargin = parseInt(e.target.value);
      const inp = document.getElementById('customMarginInput');
      if (inp) inp.value = customMargin;
      triggerCalculation();
    });

    document.getElementById('customMarginInput')?.addEventListener('input', e => {
      customMargin = parseInt(e.target.value) || 0;
      const slider = document.getElementById('customMarginSlider');
      if (slider) slider.value = customMargin;
      triggerCalculation();
    });

    // Save quote
    document.getElementById('saveQuoteBtn')?.addEventListener('click', () => {
      if (!lastResult) {
        if (window.showNotification) window.showNotification('Aguarda o cálculo terminar.', 'warning');
        return;
      }
      const partName = document.getElementById('calcPartName')?.value || 'Peça sem nome';
      const margin   = selectedTier === 'custom' ? customMargin : (TIER_MARGINS[selectedTier] || 40);
      const tierData = lastResult.suggestedPrices[selectedTier] || lastResult.suggestedPrices.standard;

      savedQuotes.unshift({
        name:          partName,
        selectedPrice: fmt(tierData.priceVat),
        margin,
        date:          new Date().toLocaleDateString('pt-PT')
      });
      if (savedQuotes.length > 20) savedQuotes = savedQuotes.slice(0, 20);
      localStorage.setItem('calc_saved_quotes', JSON.stringify(savedQuotes));
      renderSavedQuotes();
      if (window.showNotification) window.showNotification('Orçamento guardado!', 'success');
    });

    // Copy
    document.getElementById('copyCalcBtn')?.addEventListener('click', () => {
      if (!lastResult) return;
      const partName = document.getElementById('calcPartName')?.value || '';
      const margin   = selectedTier === 'custom' ? customMargin : (TIER_MARGINS[selectedTier] || 40);
      const tierData = lastResult.suggestedPrices[selectedTier] || lastResult.suggestedPrices.standard;
      const text = [
        partName,
        `Custo Landed: ${fmt(lastResult.breakdown.baseLanded)}`,
        `Preço (${margin}% margem): ${fmt(tierData.priceVat)} c/ IVA`
      ].filter(Boolean).join('\n');
      navigator.clipboard.writeText(text).then(() => {
        if (window.showNotification) window.showNotification('Copiado para clipboard!', 'info');
      });
    });

    // Reset
    document.getElementById('resetCalcBtn')?.addEventListener('click', () => {
      if (!confirm('Repor todos os valores padrão?')) return;

      filaments = [{ id: 1, material: 'PLA', costPerKg: 19.99, weight: 1 }];
      renderFilaments();

      const defaults = {
        calcTotalWeight: 1,   calcPrintHours: 1,    calcPrintMins: 1,
        calcLaborMins:   1,   calcHardwareCost: 1,  calcPackagingCost: 1,
        calcVatRate:    20,   calcLaborRate:   20,  calcEfficiency:   1.1,
        calcPrinterCost: 749, calcUpfrontCost:  0,  calcMaintenance:  75,
        calcPrinterLife:  3,  calcUptime:      50,  calcPowerW:      150,
        calcEnergyRate: 0.20, calcBufferFactor: 1.3
      };
      Object.entries(defaults).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      });

      customMargin = 50;
      const slider = document.getElementById('customMarginSlider');
      const inp    = document.getElementById('customMarginInput');
      if (slider) slider.value = 50;
      if (inp)    inp.value    = 50;

      selectedTier = 'standard';
      document.querySelectorAll('.pricing-tier').forEach(t => t.classList.remove('selected'));
      document.querySelector('.pricing-tier.standard')?.classList.add('selected');
      document.querySelector('.calc-custom-pricing')?.classList.remove('selected');

      const advToggle = document.getElementById('advancedToggle');
      const advBody   = document.getElementById('advancedSettingsBody');
      if (advToggle) advToggle.checked     = false;
      if (advBody)   advBody.style.display = 'none';

      triggerCalculation();
    });

    // Clear quotes
    document.getElementById('clearQuotesBtn')?.addEventListener('click', () => {
      if (!confirm('Limpar todos os orçamentos guardados?')) return;
      savedQuotes = [];
      localStorage.removeItem('calc_saved_quotes');
      renderSavedQuotes();
    });
  }

  // ===== INIT =====
  function init() {
    console.log('🧮 [Calculadora] A inicializar... API_BASE =', API_BASE);

    renderFilaments();
    renderSavedQuotes();
    initEvents();

    document.querySelector('.pricing-tier.standard')?.classList.add('selected');

    triggerCalculation();
    console.log('✅ [Calculadora] Pronta.');
  }

  document.addEventListener('DOMContentLoaded', init);
  window.reloadPriceCalculator = init;

})();