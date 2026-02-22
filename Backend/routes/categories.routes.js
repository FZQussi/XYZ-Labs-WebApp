// Backend/routes/categories.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/categories.controller');

// === CATEGORIAS PRIMÁRIAS ===
router.get('/primary',          controller.getPrimaryCategories);
router.post('/primary',         auth, admin, controller.createPrimaryCategory);
router.put('/primary/:id',      auth, admin, controller.updatePrimaryCategory);
router.delete('/primary/:id',   auth, admin, controller.deletePrimaryCategory);

// === CATEGORIAS SECUNDÁRIAS ===
router.get('/secondary',        controller.getSecondaryCategories);
router.post('/secondary',       auth, admin, controller.createSecondaryCategory);
router.put('/secondary/:id',    auth, admin, controller.updateSecondaryCategory);
router.delete('/secondary/:id', auth, admin, controller.deleteSecondaryCategory);

// Compatibilidade legado — /categories devolve secundárias
router.get('/', controller.getSecondaryCategories);

module.exports = router;