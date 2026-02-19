// ===================================================================
// rateLimiter.middleware.js
// Centralized rate limiting configuration for all sensitive endpoints
// ===================================================================
const rateLimit = require('express-rate-limit');

// ─── Helper: standard limiter response ─────────────────────────────
function limitHandler(req, res) {
  res.status(429).json({
    error: 'Demasiados pedidos. Tenta novamente mais tarde.',
    retryAfter: Math.ceil(req.rateLimit?.resetTime
      ? (req.rateLimit.resetTime - Date.now()) / 1000
      : 60)
  });
}

// ─── LOGIN ──────────────────────────────────────────────────────────
// 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
  message: 'Demasiadas tentativas de login. Aguarda 15 minutos.'
});

// ─── REGISTER ───────────────────────────────────────────────────────
// 5 registrations per hour per IP (prevents account spam)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// ─── FORGOT PASSWORD ────────────────────────────────────────────────
// 3 requests per 15 minutes per IP (prevents email bombing)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// ─── RESET PASSWORD ─────────────────────────────────────────────────
// 5 attempts per 15 minutes per IP (prevents token brute-force)
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// ─── CONTACT FORM ───────────────────────────────────────────────────
// 5 messages per hour per IP (prevents spam)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// ─── ORDERS (guest) ─────────────────────────────────────────────────
// 20 orders per hour per IP (prevents fake order flooding)
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

// ─── GLOBAL API ─────────────────────────────────────────────────────
// 200 requests per minute per IP (general DDoS protection)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  contactLimiter,
  orderLimiter,
  globalLimiter
};
