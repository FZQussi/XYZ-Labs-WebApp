const express = require('express');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/users.controller');

const router = express.Router();

// ===== ROTAS DO UTILIZADOR AUTENTICADO (self) =====
router.get('/me', auth, controller.getMyProfile);
router.put('/me', auth, controller.updateMyProfile);
router.get('/me/orders', auth, controller.getMyOrders);
router.get('/me/login-history', auth, controller.getMyLoginHistory);

// ===== ROTAS ADMIN =====
router.get('/stats/overview', auth, admin, controller.getUserStats);
router.get('/', auth, admin, controller.getAllUsers);
router.get('/:id', auth, admin, controller.getUserById);
router.post('/', auth, admin, controller.createUser);
router.put('/:id', auth, admin, controller.updateUser);
router.delete('/:id', auth, admin, controller.deleteUser);

module.exports = router;