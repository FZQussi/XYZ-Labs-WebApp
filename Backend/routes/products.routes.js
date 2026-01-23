const express = require('express');
const { uploadModels, uploadImages } = require('../utils/upload');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/products.controller');

const router = express.Router();

// GET produtos
router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);

// CREATE / UPDATE produtos (somente dados + modelo 3D)
router.post('/', auth, admin, uploadModels.single('modelFile'), controller.createProduct);
router.put('/:id', auth, admin, uploadModels.single('modelFile'), controller.updateProduct);

// UPLOAD IMAGENS (até 4)
router.post('/:id/images', auth, admin, uploadImages.array('images', 4), controller.uploadProductImages);

// GET imagens
router.get('/:id/images', controller.getProductImages);

// DELETE produto
router.delete('/:id', auth, admin, controller.deleteProduct);

module.exports = router;

