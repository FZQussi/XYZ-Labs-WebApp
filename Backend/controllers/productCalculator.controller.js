// controllers/productCalculator.controller.js
const priceService = require('../services/price.service');

// ─────────────────────────────────────────────────────────────
// POST /api/dashboard/calculate-price  (rota original simples)
// Body: { base, margin, tax }
// ─────────────────────────────────────────────────────────────
exports.calculatePrice = (req, res) => {
  try {
    const { base, margin, tax } = req.body;

    if (base === undefined || margin === undefined || tax === undefined) {
      return res.status(400).json({ error: 'Parâmetros em falta: base, margin, tax.' });
    }

    const finalPrice = priceService.calculateFinalPrice(
      Number(base),
      Number(margin),
      Number(tax)
    );

    return res.json({ finalPrice });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/dashboard/calculate-full
// Body: todos os parâmetros da calculadora completa
// ─────────────────────────────────────────────────────────────
exports.calculateFull = (req, res) => {
  try {
    const {
      filaments,
      printHours,
      printMins,
      laborMins,
      hardwareCost,
      packagingCost,
      vatRate,
      laborRate,
      efficiency,
      printerCost,
      upfrontCost,
      maintenance,
      printerLife,
      uptime,
      powerW,
      energyRate,
      bufferFactor,
      customMargin
    } = req.body;

    // Validação mínima
    if (!filaments || !Array.isArray(filaments)) {
      return res.status(400).json({ error: 'Campo "filaments" é obrigatório e deve ser um array.' });
    }

    const result = priceService.calculateFullPrice({
      filaments:    filaments.map(f => ({
        material:   String(f.material  ?? 'PLA'),
        costPerKg:  Number(f.costPerKg ?? 0),
        weight:     Number(f.weight    ?? 0)
      })),
      printHours:   Number(printHours   ?? 1),
      printMins:    Number(printMins    ?? 0),
      laborMins:    Number(laborMins    ?? 0),
      hardwareCost: Number(hardwareCost ?? 0),
      packagingCost:Number(packagingCost?? 0),
      vatRate:      Number(vatRate      ?? 20),
      laborRate:    Number(laborRate    ?? 20),
      efficiency:   Number(efficiency   ?? 1.1),
      printerCost:  Number(printerCost  ?? 749),
      upfrontCost:  Number(upfrontCost  ?? 0),
      maintenance:  Number(maintenance  ?? 75),
      printerLife:  Number(printerLife  ?? 3),
      uptime:       Number(uptime       ?? 50),
      powerW:       Number(powerW       ?? 150),
      energyRate:   Number(energyRate   ?? 0.20),
      bufferFactor: Number(bufferFactor ?? 1.3),
      customMargin: Number(customMargin ?? 50)
    });

    return res.json(result);

  } catch (err) {
    console.error('❌ Erro no calculateFull:', err.message);
    return res.status(400).json({ error: err.message });
  }
};

