// Backend/routes/attributes.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/attributes.controller');

// GET todos os atributos (para admin)
router.get('/', auth, admin, controller.getAllAttributes);

// GET atributos por subcategoria (público)
router.get('/subcategory/:subcategoryId', controller.getAttributesBySubcategory);

// CREATE atributo para uma subcategoria
router.post('/subcategory/:subcategoryId', auth, admin, controller.createAttribute);

// UPDATE atributo
router.put('/:attributeId', auth, admin, controller.updateAttribute);

// DELETE atributo
router.delete('/:attributeId', auth, admin, controller.deleteAttribute);

module.exports = router;