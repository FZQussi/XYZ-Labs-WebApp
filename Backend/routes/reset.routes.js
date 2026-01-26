// routes/reset.routes.js
const express = require('express');
const controller = require('../controllers/reset.controller');
const router = express.Router();

// Endpoint para reset-password
router.post('/', controller.resetPassword);

module.exports = router;
