const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const ordersController = require('../controllers/orders.controller');

// Middleware que tenta autenticar mas não falha se não houver token
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return next(); // guest, segue sem user

  const jwt = require('jsonwebtoken');
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    // token inválido, trata como guest
  }
  next();
}


// ────────────────────────────────────────────────
// PÚBLICAS / pedidos de cliente (criar encomenda)
// (Autenticação opcional — guest pode criar)
// ────────────────────────────────────────────────
router.post('/', optionalAuth, ordersController.createOrder);

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
