// backend/routes/Dashboard.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');
const calculatorController = require('../controllers/productCalculator.controller');

// 🔒 Rota protegida
router.post(
  '/calculate-price',
  auth,
  adminOnly,
  calculatorController.calculatePrice
);

module.exports = router;
