// backend/routes/Dashboard.routes.js
const express    = require('express');
const router     = express.Router();

const auth               = require('../middlewares/auth.middleware');
const adminOnly          = require('../middlewares/admin.middleware');
const calculatorController = require('../controllers/productCalculator.controller');

// ── Rota original (simples) ───────────────────────────────────
// POST /api/dashboard/calculate-price
// Body: { base, margin, tax }
router.post(
  '/calculate-price',
  auth,
  adminOnly,
  calculatorController.calculatePrice
);

// ── Rota completa da calculadora 3D ──────────────────────────
// POST /api/dashboard/calculate-full
// Body: todos os parâmetros (filamentos, tempos, custos, avançados)
router.post(
  '/calculate-full',
  auth,
  adminOnly,
  calculatorController.calculateFull
);

module.exports = router;
