// routes/reset.routes.js
const express = require('express');
const controller = require('../controllers/reset.controller');
const { resetPasswordLimiter } = require('../middlewares/rateLimiter.middleware');
const router = express.Router();

// 5 attempts per 15 minutes per IP — prevents token brute-force
router.post('/', resetPasswordLimiter, controller.resetPassword);

module.exports = router;
