// Backend/utils/cache.js
const { 
  invalidateCache, 
  clearAllCache, 
  cleanupExpiredCache,
  getCacheStats,
  getCacheKeys
} = require('../middlewares/cache.middleware');

module.exports = {
  invalidateCache,
  clearAllCache,
  cleanupExpiredCache,
  getCacheStats,
  getCacheKeys
};