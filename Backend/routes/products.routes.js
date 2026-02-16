const express = require('express');
const { uploadModels, uploadImages } = require('../utils/upload');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/products.controller');

const router = express.Router();

// GET produtos
router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);

// CREATE produto
router.post('/', auth, admin, uploadModels.single('modelFile'), controller.createProduct);

// UPDATE produto (dados + modelo 3D)
router.put('/:id', auth, admin, uploadModels.single('modelFile'), controller.updateProduct);

// DELETE produto
router.delete('/:id', auth, admin, controller.deleteProduct);

// === GESTÃO DE IMAGENS ===

// GET imagens
router.get('/:id/images', controller.getProductImages);
// ⭐ REORDENAR imagens (ANTES do PUT genérico)
router.put('/:id/images/reorder', auth, admin, controller.reorderProductImages);

// ADICIONAR imagens (até 4 novas)
router.post('/:id/images', auth, admin, uploadImages.array('images', 4), controller.uploadProductImages);

// SUBSTITUIR todas as imagens
router.put('/:id/images', auth, admin, uploadImages.array('images', 4), controller.replaceProductImages);

// ELIMINAR uma imagem específica
router.delete('/:id/images', auth, admin, controller.deleteProductImage);

module.exports = router;