const express = require('express');
const controller = require('../controllers/forgot.controller');
const router = express.Router();

// Endpoint para solicitar recuperação de password
router.post('/', controller.forgotPassword);

module.exports = router;
