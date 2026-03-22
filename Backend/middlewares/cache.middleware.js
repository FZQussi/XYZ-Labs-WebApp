// Backend/middlewares/cache.middleware.js
// Versão simples com cache em memória (sem Redis)

const cacheStore = new Map();
const CACHE_TTL = 3600000; // 1 hora em ms

/**
 * Middleware de cache em memória
 * 
 * Uso:
 * router.get('/api/filters', cacheMiddleware('filters', 3600), controller);
 */
exports.cacheMiddleware = (prefix, ttl = 3600) => {
  return (req, res, next) => {
    try {
      // Gerar chave de cache
      const cacheKey = `${prefix}:${req.originalUrl}`;

      // Buscar do cache
      const cached = cacheStore.get(cacheKey);
      
      if (cached && Date.now() < cached.expiresAt) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached.data));
      }

      // Se expirou, remover
      if (cached) {
        cacheStore.delete(cacheKey);
      }

      // Interceptar response.json()
      const originalJson = res.json.bind(res);
      
      res.json = function(data) {
        try {
          // Guardar em cache (em memória)
          cacheStore.set(cacheKey, {
            data: JSON.stringify(data),
            expiresAt: Date.now() + (ttl * 1000),
            size: JSON.stringify(data).length
          });

          // Log do cache
          const cacheSize = Array.from(cacheStore.values())
            .reduce((sum, item) => sum + item.size, 0);
          
          if (cacheSize > 52428800) { // 50MB
            console.warn(`⚠️ Cache tamanho: ${(cacheSize/1024/1024).toFixed(2)}MB`);
          }
        } catch (err) {
          console.warn('Cache storage error (ignorado):', err.message);
        }

        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `public, max-age=${ttl}`);
        
        return originalJson(data);
      };

      next();

    } catch (err) {
      console.warn('Cache middleware error (ignorado):', err.message);
      next(); // Continuar mesmo se cache falhar
    }
  };
};

/**
 * Invalidar cache
 */
exports.invalidateCache = async (pattern) => {
  try {
    if (pattern.endsWith('*')) {
      // Pattern wildcard
      const prefix = pattern.slice(0, -1);
      for (const key of cacheStore.keys()) {
        if (key.startsWith(prefix)) {
          cacheStore.delete(key);
        }
      }
    } else {
      // Chave específica
      cacheStore.delete(pattern);
    }
    console.log(`✓ Cache invalidated: ${pattern}`);
  } catch (err) {
    console.warn('Cache invalidation error (ignorado):', err.message);
  }
};

/**
 * Limpar todo o cache
 */
exports.clearAllCache = () => {
  cacheStore.clear();
  console.log('✓ All cache cleared');
};

/**
 * Stats de cache (para debugging)
 */
exports.getCacheStats = () => {
  const size = Array.from(cacheStore.values())
    .reduce((sum, item) => sum + item.size, 0);
  
  return {
    keys: cacheStore.size,
    size: `${(size/1024/1024).toFixed(2)}MB`,
    items: Array.from(cacheStore.entries()).map(([key, value]) => ({
      key,
      size: `${(value.size/1024).toFixed(2)}KB`,
      expiresIn: `${Math.round((value.expiresAt - Date.now())/1000)}s`
    }))
  };
};

/**
 * Limpar cache expirado (cron job)
 * Chamar periodicamente para não encher memória
 */
exports.cleanupExpiredCache = () => {
  let cleaned = 0;
  const now = Date.now();
  
  for (const [key, value] of cacheStore.entries()) {
    if (now > value.expiresAt) {
      cacheStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`✓ Cleaned ${cleaned} expired cache entries`);
  }
  
  return cleaned;
};

// Rodar cleanup a cada 30 minutos
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    exports.cleanupExpiredCache();
  }, 30 * 60 * 1000);
}