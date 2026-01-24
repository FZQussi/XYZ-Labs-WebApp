const express = require('express');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/users.controller');

const router = express.Router();

// GET estatísticas (antes das rotas com :id)
router.get('/stats/overview', auth, admin, controller.getUserStats);

// GET todos os utilizadores
router.get('/', auth, admin, controller.getAllUsers);

// GET utilizador por ID
router.get('/:id', auth, admin, controller.getUserById);

// CREATE novo utilizador
router.post('/', auth, admin, controller.createUser);

// UPDATE utilizador
router.put('/:id', auth, admin, controller.updateUser);

// DELETE utilizador
router.delete('/:id', auth, admin, controller.deleteUser);

module.exports = router;