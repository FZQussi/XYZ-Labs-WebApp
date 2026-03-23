// Backend/routes/filters.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const { cacheMiddleware } = require('../middlewares/cache.middleware');

// Controllers
const categoryFiltersController = require('../controllers/categoryFilters.controller');
const filterTagsController = require('../controllers/filterTags.controller');
const productFilterTagsController = require('../controllers/productFilterTags.controller');
const filterTranslationsController = require('../controllers/filterTranslations.controller');

// =============================================================
// ROTAS PÚBLICAS (sem autenticação, com cache)
// Montadas em server.js como: app.use('/', filtersRoutes)
// URL final: GET /api/v1/categories/:id/filters
// =============================================================

router.get(
  '/api/v1/categories/:primaryCategoryId/filters',
  cacheMiddleware('filters', 3600),
  categoryFiltersController.getFiltersForCategory
);

router.get(
  '/api/v1/categories/:primaryCategoryId/filters/public',
  cacheMiddleware('filters', 3600),
  categoryFiltersController.getFiltersForCategory
);

// =============================================================
// ROTAS ADMIN — CATEGORY FILTERS
// URL final: /api/admin/categories/:id/filters
// =============================================================

// GET  /api/admin/categories/:primaryCategoryId/filters
router.get(
  '/api/admin/categories/:primaryCategoryId/filters',
  auth,
  admin,
  categoryFiltersController.getFiltersForCategoryAdmin
);

// POST /api/admin/categories/:primaryCategoryId/filters
router.post(
  '/api/admin/categories/:primaryCategoryId/filters',
  auth,
  admin,
  categoryFiltersController.createFilter
);

// PUT  /api/admin/filters/:filterId
router.put(
  '/api/admin/filters/:filterId',
  auth,
  admin,
  categoryFiltersController.updateFilter
);

// DELETE /api/admin/filters/:filterId
router.delete(
  '/api/admin/filters/:filterId',
  auth,
  admin,
  categoryFiltersController.deleteFilter
);

// PUT /api/admin/filters/:filterId/reorder
router.put(
  '/api/admin/filters/:filterId/reorder',
  auth,
  admin,
  categoryFiltersController.reorderFilters
);

// =============================================================
// ROTAS ADMIN — FILTER TAGS
// =============================================================

// GET  /api/admin/filters/:filterId/tags
router.get(
  '/api/admin/filters/:filterId/tags',
  auth,
  admin,
  filterTagsController.getTagsForFilter
);

// POST /api/admin/filters/:filterId/tags
router.post(
  '/api/admin/filters/:filterId/tags',
  auth,
  admin,
  filterTagsController.createTag
);

// PUT  /api/admin/tags/:tagId
router.put(
  '/api/admin/tags/:tagId',
  auth,
  admin,
  filterTagsController.updateTag
);

// DELETE /api/admin/tags/:tagId
router.delete(
  '/api/admin/tags/:tagId',
  auth,
  admin,
  filterTagsController.deleteTag
);

// PUT /api/admin/filters/:filterId/tags/reorder
router.put(
  '/api/admin/filters/:filterId/tags/reorder',
  auth,
  admin,
  filterTagsController.reorderTags
);

// PUT /api/admin/categories/:categoryId/tags/update-counts
router.put(
  '/api/admin/categories/:categoryId/tags/update-counts',
  auth,
  admin,
  filterTagsController.updateProductCounts
);

// =============================================================
// ROTAS PRODUTO — FILTER TAGS
// =============================================================

// GET    /api/products/:productId/filter-tags
router.get(
  '/api/products/:productId/filter-tags',
  productFilterTagsController.getProductFilterTags
);

// POST   /api/products/:productId/filter-tags
router.post(
  '/api/products/:productId/filter-tags',
  auth,
  admin,
  productFilterTagsController.addTagToProduct
);

// DELETE /api/products/:productId/filter-tags/:tagId
router.delete(
  '/api/products/:productId/filter-tags/:tagId',
  auth,
  admin,
  productFilterTagsController.removeTagFromProduct
);

// PUT    /api/products/:productId/filter-tags
router.put(
  '/api/products/:productId/filter-tags',
  auth,
  admin,
  productFilterTagsController.replaceProductFilterTags
);

// =============================================================
// ROTAS ADMIN — TRANSLATIONS
// =============================================================

// GET  /api/admin/filters/:filterId/translations
router.get(
  '/api/admin/filters/:filterId/translations',
  auth,
  admin,
  filterTranslationsController.getFilterTranslations
);

// POST /api/admin/filters/:filterId/translations
router.post(
  '/api/admin/filters/:filterId/translations',
  auth,
  admin,
  filterTranslationsController.createFilterTranslation
);

// PUT  /api/admin/tags/:tagId/translations
router.put(
  '/api/admin/tags/:tagId/translations',
  auth,
  admin,
  filterTranslationsController.updateTagTranslation
);

// =============================================================
// ROTA DEBUG (publica para facilitar diagnostico — remover em producao)
// GET /api/v1/categories/:primaryCategoryId/filters/debug
// =============================================================

router.get(
  '/api/v1/categories/:primaryCategoryId/filters/debug',
  categoryFiltersController.debugFiltersForCategory
);

// =============================================================
// ROTA ADMIN — CACHE
// =============================================================

// POST /api/admin/cache/filters/clear  — limpar cache de filtros (debugging)
router.post(
  '/api/admin/cache/filters/clear',
  auth,
  admin,
  categoryFiltersController.clearFiltersCache
);

// GET /api/admin/cache/filters/keys  — listar chaves de cache (debugging)
router.get(
  '/api/admin/cache/filters/keys',
  auth,
  admin,
  (req, res) => {
    const { getCacheKeys } = require('../utils/cache');
    const keys = getCacheKeys().filter(k => k.includes('filters') || k.includes('categories'));
    res.json({ keys, total: keys.length });
  }
);

module.exports = router;