const express = require('express');
const { uploadModels } = require('../utils/upload');
const uploadImages = require('../utils/multerCloudinary');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/products.controller');

const router = express.Router();

// === CATEGORIAS PRIMÁRIAS ===
router.get('/primary-categories', controller.getPrimaryCategories);
router.post('/primary-categories', auth, admin, controller.createPrimaryCategory);
router.put('/primary-categories/:catId', auth, admin, controller.updatePrimaryCategory);
router.delete('/primary-categories/:catId', auth, admin, controller.deletePrimaryCategory);

// === CATEGORIAS SECUNDÁRIAS ===
router.get('/secondary-categories', controller.getSecondaryCategories);
router.post('/secondary-categories', auth, admin, controller.createSecondaryCategory);
router.put('/secondary-categories/:catId', auth, admin, controller.updateSecondaryCategory);
router.delete('/secondary-categories/:catId', auth, admin, controller.deleteSecondaryCategory);

// === PROMOÇÕES ===
// Listar todos os produtos com promoção ativa
router.get('/promotions', controller.getPromotions);
// Definir/atualizar promoção de um produto
router.put('/:id/promotion', auth, admin, controller.setPromotion);
// Remover promoção de um produto
router.delete('/:id/promotion', auth, admin, controller.removePromotion);

// === PRODUTOS ===
router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);
router.post('/', auth, admin, uploadModels.single('modelFile'), controller.createProduct);
router.put('/:id', auth, admin, uploadModels.single('modelFile'), controller.updateProduct);
router.delete('/:id', auth, admin, controller.deleteProduct);

// === GESTÃO DE IMAGENS ===
router.get('/:id/images', controller.getProductImages);
router.put('/:id/images/reorder', auth, admin, controller.reorderProductImages);
router.post('/:id/images', auth, admin, uploadImages.array('images', 4), controller.uploadProductImages);
router.put('/:id/images', auth, admin, uploadImages.array('images', 4), controller.replaceProductImages);
router.delete('/:id/images', auth, admin, controller.deleteProductImage);

module.exports = router;    