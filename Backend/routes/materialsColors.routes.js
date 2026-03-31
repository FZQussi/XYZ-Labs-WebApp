'use strict';
// backend/routes/materialsColors.routes.js

const router    = require('express').Router();
const ctrl      = require('../controllers/materialsColors.controller');
const auth      = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

// ─────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────

// Compatibilidade com o options.json antigo.
// No server.js montar como:  app.use('/data', materialsColorsRoutes);
// O fetch no frontend continua a funcionar sem alterações
router.get('/options',              ctrl.getOptionsCompat);
router.get('/options.json',         ctrl.getOptionsCompat);

// Lista de materiais ativos (com cores embutidas)
router.get('/materials',            ctrl.getPublicMaterials);

// Cores de um material específico — usado no checkout
router.get('/materials/:id/colors', ctrl.getColorsByMaterial);

// ─────────────────────────────────────────────────────────────
// ROTAS DE ADMIN  (requerem auth + adminOnly)
// ─────────────────────────────────────────────────────────────

// Materiais
router.get   ('/admin/materials',      auth, adminOnly, ctrl.adminGetMaterials);
router.get   ('/admin/materials/:id',  auth, adminOnly, ctrl.adminGetMaterial);
router.post  ('/admin/materials',      auth, adminOnly, ctrl.adminCreateMaterial);
router.put   ('/admin/materials/:id',  auth, adminOnly, ctrl.adminUpdateMaterial);
router.delete('/admin/materials/:id',  auth, adminOnly, ctrl.adminDeleteMaterial);

// Cores
router.get   ('/admin/colors',         auth, adminOnly, ctrl.adminGetColors);
router.get   ('/admin/colors/:id',     auth, adminOnly, ctrl.adminGetColor);
router.post  ('/admin/colors',         auth, adminOnly, ctrl.adminCreateColor);
router.put   ('/admin/colors/:id',     auth, adminOnly, ctrl.adminUpdateColor);
router.delete('/admin/colors/:id',     auth, adminOnly, ctrl.adminDeleteColor);

module.exports = router;