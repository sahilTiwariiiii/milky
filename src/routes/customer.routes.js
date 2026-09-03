const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const TransactionController = require('../controllers/transaction.controller');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema
} = require('../validations/customer.validation');
const { transactionQuerySchema } = require('../validations/transaction.validation');

router.use(protect);

// 1. QR Code lookup route (must be before /:id)
router.get('/qr/:qrToken', CustomerController.getCustomerByQrToken);

// 2. Customer CRUD & listing
router.post('/', validate(createCustomerSchema), CustomerController.createCustomer);
router.get('/', validate(customerQuerySchema, 'query'), CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.put('/:id', validate(updateCustomerSchema), CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

// 3. QR code regeneration
router.post('/:id/regenerate-qr', CustomerController.regenerateQrCode);

// 4. Customer transaction history
router.get(
  '/:customerId/transactions',
  validate(transactionQuerySchema, 'query'),
  TransactionController.getCustomerTransactions
);

module.exports = router;
