// services/price.service.js
// ============================================================
// Toda a lógica de cálculo fica EXCLUSIVAMENTE no backend.
// O frontend envia os parâmetros brutos e recebe os resultados.
// ============================================================

/**
 * Calcula todos os custos e preços sugeridos para impressão 3D.
 *
 * @param {Object} params
 * @param {Array}  params.filaments         - Array de { material, costPerKg, weight }
 * @param {number} params.printHours        - Horas de impressão
 * @param {number} params.printMins         - Minutos de impressão
 * @param {number} params.laborMins         - Minutos de mão de obra
 * @param {number} params.hardwareCost      - Custo hardware (€)
 * @param {number} params.packagingCost     - Custo embalagem (€)
 * @param {number} params.vatRate           - Taxa IVA (%)
 * @param {number} params.laborRate         - Taxa mão de obra (€/h)
 * @param {number} params.efficiency        - Fator eficiência material (ex: 1.1)
 * @param {number} params.printerCost       - Custo impressora (€)
 * @param {number} params.upfrontCost       - Custo inicial adicional (€)
 * @param {number} params.maintenance       - Manutenção anual (€)
 * @param {number} params.printerLife       - Vida útil impressora (anos)
 * @param {number} params.uptime            - Uptime (%)
 * @param {number} params.powerW            - Consumo energia (W)
 * @param {number} params.energyRate        - Custo energia (€/kWh)
 * @param {number} params.bufferFactor      - Fator buffer
 * @param {number} params.customMargin      - Margem personalizada (%)
 * @returns {Object} resultado completo com breakdown, métricas e preços sugeridos
 */
function calculateFullPrice(params) {
  const {
    filaments       = [],
    printHours      = 1,
    printMins       = 0,
    laborMins       = 0,
    hardwareCost    = 0,
    packagingCost   = 0,
    vatRate         = 20,
    laborRate       = 20,
    efficiency      = 1.1,
    printerCost     = 749,
    upfrontCost     = 0,
    maintenance     = 75,
    printerLife     = 3,
    uptime          = 50,
    powerW          = 150,
    energyRate      = 0.20,
    bufferFactor    = 1.3,
    customMargin    = 50
  } = params;

  // ── Validações básicas ──────────────────────────────────────
  if (!Array.isArray(filaments) || filaments.length === 0) {
    throw new Error('É necessário pelo menos um filamento.');
  }
  if (printerLife <= 0) throw new Error('Vida útil da impressora inválida.');
  if (uptime <= 0 || uptime > 100) throw new Error('Uptime inválido (1–100).');
  if (bufferFactor < 1) throw new Error('Fator buffer deve ser >= 1.');

  // ── 1. Custo de material ────────────────────────────────────
  const materialCost = filaments.reduce((sum, f) => {
    const cost = (Number(f.costPerKg) / 1000) * Number(f.weight) * efficiency;
    return sum + cost;
  }, 0);

  // ── 2. Custo de mão de obra ────────────────────────────────
  const laborCost = (laborMins / 60) * laborRate;

  // ── 3. Custo da máquina ────────────────────────────────────
  const totalInvestment      = printerCost + upfrontCost;
  const uptimeHoursPerYear   = (uptime / 100) * 8760;
  const lifetimeCost         = totalInvestment + maintenance * printerLife;
  const depreciation         = printerCost / (printerLife * uptimeHoursPerYear);
  const maintenanceCostPerHr = maintenance / uptimeHoursPerYear;
  const electricityCostPerHr = (powerW / 1000) * energyRate;
  const printerCostPerHr     = depreciation + maintenanceCostPerHr + electricityCostPerHr;

  const printTimeHours = printHours + printMins / 60;
  const machineCost    = printerCostPerHr * printTimeHours;

  // ── 4. Custo total landed (com buffer) ────────────────────
  const baseLanded = (
    materialCost +
    Number(hardwareCost) +
    Number(packagingCost) +
    laborCost +
    machineCost
  ) * bufferFactor;

  // ── 5. Preços sugeridos por tier ──────────────────────────
  const tiers = {
    competitive: 25,
    standard:    40,
    premium:     60,
    luxury:      80
  };

  const suggestedPrices = {};
  Object.entries(tiers).forEach(([tier, margin]) => {
    const price    = _priceFromMargin(baseLanded, margin);
    const priceVat = _withVat(price, vatRate);
    suggestedPrices[tier] = {
      margin,
      price:    _round(price),
      priceVat: _round(priceVat)
    };
  });

  // Preço personalizado
  const customPrice    = _priceFromMargin(baseLanded, customMargin);
  const customPriceVat = _withVat(customPrice, vatRate);
  suggestedPrices.custom = {
    margin:   customMargin,
    price:    _round(customPrice),
    priceVat: _round(customPriceVat)
  };

  // ── 6. Métricas avançadas da impressora ───────────────────
  const printerMetrics = {
    totalInvestment:      _round(totalInvestment),
    lifetimeCost:         _round(lifetimeCost),
    uptimeHoursPerYear:   Math.round(uptimeHoursPerYear),
    depreciation:         _round(depreciation, 4),
    maintenanceCostPerHr: _round(maintenanceCostPerHr, 4),
    electricityCostPerHr: _round(electricityCostPerHr, 4),
    printerCostPerHr:     _round(printerCostPerHr, 4)
  };

  // ── 7. Breakdown de custos ────────────────────────────────
  const breakdown = {
    materialCost:  _round(materialCost),
    hardwareCost:  _round(Number(hardwareCost)),
    packagingCost: _round(Number(packagingCost)),
    laborCost:     _round(laborCost),
    machineCost:   _round(machineCost),
    baseLanded:    _round(baseLanded)
  };

  return {
    breakdown,
    suggestedPrices,
    printerMetrics,
    vatRate
  };
}

// ── Helpers privados ──────────────────────────────────────────
function _priceFromMargin(landed, margin) {
  if (margin >= 100) throw new Error('Margem de lucro não pode ser >= 100%.');
  return landed / (1 - margin / 100);
}

function _withVat(price, vatRate) {
  return price * (1 + vatRate / 100);
}

function _round(n, decimals = 2) {
  return Number(Number(n).toFixed(decimals));
}

// Mantém compatibilidade com a rota simples original
function calculateFinalPrice(base, margin, tax) {
  if (base < 0) throw new Error('Preço base inválido.');
  const priceWithMargin = base * (1 + margin / 100);
  const finalPrice      = priceWithMargin * (1 + tax / 100);
  return _round(finalPrice);
}

module.exports = {
  calculateFullPrice,
  calculateFinalPrice
};