const express = require('express');
const upload = require('../utils/upload');
const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');
const controller = require('../controllers/products.controller');

const router = express.Router();

router.get('/', controller.getProducts);
router.get('/:id', controller.getProductById);

router.post(
  '/',
  auth,
  admin,
  upload.single('modelFile'),
  controller.createProduct
);

router.put(
  '/:id',
  auth,
  admin,
  upload.single('modelFile'),
  controller.updateProduct
);

router.delete('/:id', auth, admin, controller.deleteProduct);

module.exports = router;
