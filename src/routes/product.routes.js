const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const validate = require('../middlewares/validate.middleware');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const {
  createProductSchema,
  updateProductSchema
} = require('../validations/product.validation');
const { ROLES } = require('../config/constants');

router.use(protect);

// Read routes available to all authenticated users (Admins & Super Admins)
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

// Write routes restricted to SUPER_ADMIN
router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN),
  validate(createProductSchema),
  ProductController.createProduct
);

router.put(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN),
  validate(updateProductSchema),
  ProductController.updateProduct
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN),
  ProductController.deleteProduct
);

module.exports = router;
