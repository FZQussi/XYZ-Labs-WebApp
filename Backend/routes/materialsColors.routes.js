'use strict';
// backend/routes/materialsColors.routes.js
//
// IMPORTANTE: Este ficheiro é carregado duas vezes no server.js com dois
// require() separados, de forma a obter instâncias de router distintas para
// os prefixos /api e /data. Não consolidar os dois requires num só.

const router    = require('express').Router();
const ctrl      = require('../controllers/materialsColors.controller');
const auth      = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware');

// ─────────────────────────────────────────────────────────────
// ROTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────

// Compatibilidade com o options.json antigo.
// Montado em /data no server.js → GET /data/options  e  GET /data/options.json
router.get('/options',              ctrl.getOptionsCompat);
router.get('/options.json',         ctrl.getOptionsCompat);

// Lista de materiais ativos (com cores embutidas)
// Montado em /api → GET /api/materials
router.get('/materials',            ctrl.getPublicMaterials);

// Cores de um material específico — usado no checkout
// Montado em /api → GET /api/materials/:id/colors
router.get('/materials/:id/colors', ctrl.getColorsByMaterial);

// ─────────────────────────────────────────────────────────────
// ROTAS DE ADMIN  (requerem auth + adminOnly)
// ─────────────────────────────────────────────────────────────

// Materiais
router.get   ('/admin/materials',     auth, adminOnly, ctrl.adminGetMaterials);
router.get   ('/admin/materials/:id', auth, adminOnly, ctrl.adminGetMaterial);
router.post  ('/admin/materials',     auth, adminOnly, ctrl.adminCreateMaterial);
router.put   ('/admin/materials/:id', auth, adminOnly, ctrl.adminUpdateMaterial);
router.delete('/admin/materials/:id', auth, adminOnly, ctrl.adminDeleteMaterial);

// Cores
router.get   ('/admin/colors',        auth, adminOnly, ctrl.adminGetColors);
router.get   ('/admin/colors/:id',    auth, adminOnly, ctrl.adminGetColor);
router.post  ('/admin/colors',        auth, adminOnly, ctrl.adminCreateColor);
router.put   ('/admin/colors/:id',    auth, adminOnly, ctrl.adminUpdateColor);
router.delete('/admin/colors/:id',    auth, adminOnly, ctrl.adminDeleteColor);

module.exports = router;