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

/**
 * ═════════════════════════════════════════════════
 * ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
 * ═════════════════════════════════════════════════
 */

/**
 * GET /api/v1/categories/:categoryId/filters
 * 
 * Obter filtros de uma categoria (com cache)
 * Usado pela página de produtos para renderizar filtros
 */
router.get(
  '/api/v1/categories/:primaryCategoryId/filters',
  cacheMiddleware('filters', 3600), // Cache 1 hora
  categoryFiltersController.getFiltersForCategory
);

/**
 * GET /api/v1/categories/:categoryId/filters/public
 * 
 * Alias alternativo
 */
router.get(
  '/api/v1/categories/:primaryCategoryId/filters/public',
  cacheMiddleware('filters', 3600),
  categoryFiltersController.getFiltersForCategory
);

/**
 * ═════════════════════════════════════════════════
 * ROTAS ADMIN (REQUEREM AUTENTICAÇÃO + ROLE ADMIN)
 * ═════════════════════════════════════════════════
 */

// ──── CATEGORY FILTERS ────

/**
 * GET /api/admin/categories/:categoryId/filters
 * 
 * Obter filtros para edição no dashboard (com translations)
 */
router.get(
  '/api/admin/categories/:primaryCategoryId/filters',
  auth,
  admin,
  categoryFiltersController.getFiltersForCategoryAdmin
);

/**
 * POST /api/admin/categories/:categoryId/filters
 * 
 * Criar novo filtro
 * 
 * Body:
 * {
 *   "filter_key": "brand",
 *   "filter_name": "Marca",
 *   "filter_type": "multi-select",
 *   "display_order": 1,
 *   "description": "Marca do automóvel"
 * }
 */
router.post(
  '/api/admin/categories/:primaryCategoryId/filters',
  auth,
  admin,
  categoryFiltersController.createFilter
);

/**
 * PUT /api/admin/filters/:filterId
 * 
 * Atualizar filtro
 * 
 * Body: { "filter_name": "Marca", "is_active": true, ... }
 */
router.put(
  '/api/admin/filters/:filterId',
  auth,
  admin,
  categoryFiltersController.updateFilter
);

/**
 * DELETE /api/admin/filters/:filterId
 * 
 * Deletar filtro
 */
router.delete(
  '/api/admin/filters/:filterId',
  auth,
  admin,
  categoryFiltersController.deleteFilter
);

/**
 * PUT /api/admin/filters/:filterId/reorder
 * 
 * Reordenar filtros
 * 
 * Body: { "order": [1001, 1003, 1002] }
 */
router.put(
  '/api/admin/filters/:filterId/reorder',
  auth,
  admin,
  categoryFiltersController.reorderFilters
);

// ──── FILTER TAGS ────

/**
 * GET /api/admin/filters/:filterId/tags
 * 
 * Obter tags de um filtro
 */
router.get(
  '/api/admin/filters/:filterId/tags',
  auth,
  admin,
  filterTagsController.getTagsForFilter
);

/**
 * POST /api/admin/filters/:filterId/tags
 * 
 * Criar novo tag
 * 
 * Body:
 * {
 *   "tag_name": "BMW",
 *   "tag_key": "bmw" (opcional, gerado automaticamente)
 * }
 */
router.post(
  '/api/admin/filters/:filterId/tags',
  auth,
  admin,
  filterTagsController.createTag
);

/**
 * PUT /api/admin/tags/:tagId
 * 
 * Atualizar tag
 * 
 * Body: { "tag_name": "BMW", "is_active": true, ... }
 */
router.put(
  '/api/admin/tags/:tagId',
  auth,
  admin,
  filterTagsController.updateTag
);

/**
 * DELETE /api/admin/tags/:tagId
 * 
 * Deletar tag
 */
router.delete(
  '/api/admin/tags/:tagId',
  auth,
  admin,
  filterTagsController.deleteTag
);

/**
 * PUT /api/admin/filters/:filterId/tags/reorder
 * 
 * Reordenar tags
 * 
 * Body: { "order": [2001, 2003, 2002] }
 */
router.put(
  '/api/admin/filters/:filterId/tags/reorder',
  auth,
  admin,
  filterTagsController.reorderTags
);

/**
 * PUT /api/admin/categories/:categoryId/tags/update-counts
 * 
 * Atualizar contagem de produtos por tag
 * (Útil para cron jobs ou manual trigger)
 */
router.put(
  '/api/admin/categories/:categoryId/tags/update-counts',
  auth,
  admin,
  filterTagsController.updateProductCounts
);

// ──── PRODUCT FILTER TAGS ────

/**
 * GET /api/products/:productId/filter-tags
 * 
 * Obter tags de um produto
 */
router.get(
  '/api/products/:productId/filter-tags',
  productFilterTagsController.getProductFilterTags
);

/**
 * POST /api/products/:productId/filter-tags
 * 
 * Adicionar tag a um produto
 * 
 * Body: { "filter_tag_id": 2001 }
 */
router.post(
  '/api/products/:productId/filter-tags',
  auth,
  admin,
  productFilterTagsController.addTagToProduct
);

/**
 * DELETE /api/products/:productId/filter-tags/:tagId
 * 
 * Remover tag de um produto
 */
router.delete(
  '/api/products/:productId/filter-tags/:tagId',
  auth,
  admin,
  productFilterTagsController.removeTagFromProduct
);

/**
 * PUT /api/products/:productId/filter-tags
 * 
 * Substituir TODOS os tags de um produto
 * 
 * Body: { "filter_tags": [2001, 3001, 3002] }
 */
router.put(
  '/api/products/:productId/filter-tags',
  auth,
  admin,
  productFilterTagsController.replaceProductFilterTags
);

// ──── TRANSLATIONS (i18n) ────

/**
 * GET /api/admin/filters/:filterId/translations
 * 
 * Obter traduções de um filtro
 */
router.get(
  '/api/admin/filters/:filterId/translations',
  auth,
  admin,
  filterTranslationsController.getFilterTranslations
);

/**
 * POST /api/admin/filters/:filterId/translations
 * 
 * Adicionar tradução
 * 
 * Body:
 * {
 *   "language_code": "es",
 *   "translated_name": "Marca"
 * }
 */
router.post(
  '/api/admin/filters/:filterId/translations',
  auth,
  admin,
  filterTranslationsController.createFilterTranslation
);

/**
 * PUT /api/admin/tags/:tagId/translations
 * 
 * Traduzir um tag
 */
router.put(
  '/api/admin/tags/:tagId/translations',
  auth,
  admin,
  filterTranslationsController.updateTagTranslation
);

module.exports = router;