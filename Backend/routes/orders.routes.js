const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const auth = require('../middlewares/auth.middleware');
const { orderLimiter } = require('../middlewares/rateLimiter.middleware');
const admin = require('../middlewares/admin.middleware');
const ordersController = require('../controllers/orders.controller');

// ─── Optional auth middleware (reuses shared JWT_SECRET) ─────────────
// Uses the same authMiddleware logic but does NOT block on missing token.
// Extracted here (no inline require) for consistency with the rest of the app.
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next(); // guest — continue without user

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    // Invalid token treated as guest — not a hard error
  }
  next();
}

// ────────────────────────────────────────────────
// PÚBLICAS / pedidos de cliente (criar encomenda)
// Autenticação opcional — guest pode criar — 20 por hora por IP
// ────────────────────────────────────────────────
router.post('/', orderLimiter, optionalAuth, ordersController.createOrder);

// ────────────────────────────────────────────────
// ROTAS ADMIN
// (estas exigem auth + admin)
// ────────────────────────────────────────────────

// Colocar sempre os endpoints "fixos" antes dos endpoints com :id
router.get('/stats', auth, admin, ordersController.getOrderStats);

// Se quiseres listar tudo ou filtrar
router.get('/', auth, admin, ordersController.getAllOrders);

// Ver detalhe
router.get('/:id', auth, admin, ordersController.getOrderById);

// Atualizar status
router.put('/:id/status', auth, admin, ordersController.updateOrderStatus);

// Atualizar tracking
router.put('/:id/tracking', auth, admin, ordersController.updateOrderTracking);

module.exports = router;
