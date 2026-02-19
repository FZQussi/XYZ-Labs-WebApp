const express = require('express');
const controller = require('../controllers/forgot.controller');
const { forgotPasswordLimiter } = require('../middlewares/rateLimiter.middleware');
const router = express.Router();

// 3 requests per 15 minutes per IP — prevents email bombing
router.post('/', forgotPasswordLimiter, controller.forgotPassword);

module.exports = router;
