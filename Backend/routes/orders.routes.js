// Backend/routes/orders.routes.js
const express = require('express');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/orders.controller');

const router = express.Router();

// Criar pedido (público ou autenticado)
router.post('/', controller.createOrder);

// Obter todos os pedidos (admin)
router.get('/', auth, admin, controller.getAllOrders);

// Obter pedido por ID (admin)
router.get('/:id', auth, admin, controller.getOrderById);

// Atualizar status do pedido (admin)
router.put('/:id/status', auth, admin, controller.updateOrderStatus);

module.exports = router;