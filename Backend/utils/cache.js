// Backend/utils/cache.js
// Versão simplificada sem Redis

/**
 * Wrapper simples para invalidação de cache
 * Apenas chama o middleware
 */

const { invalidateCache, clearAllCache, cleanupExpiredCache } = require('../middlewares/cache.middleware');

exports.invalidateCache = invalidateCache;
exports.clearAllCache = clearAllCache;
exports.cleanupExpiredCache = cleanupExpiredCache;

// Export para usar nos controllers
module.exports = {
  invalidateCache,
  clearAllCache,
  cleanupExpiredCache
};