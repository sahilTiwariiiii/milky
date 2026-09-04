const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transaction.controller');
const validate = require('../middlewares/validate.middleware');
const { protect } = require('../middlewares/auth.middleware');
const {
  createTransactionSchema,
  transactionQuerySchema
} = require('../validations/transaction.validation');

router.use(protect);

router.post('/', validate(createTransactionSchema), TransactionController.createTransaction);
router.get('/', validate(transactionQuerySchema, 'query'), TransactionController.getAllTransactions);
router.get('/:id', TransactionController.getTransactionById);
router.put('/:id', TransactionController.updateTransaction);
router.delete('/:id', TransactionController.deleteTransaction);

module.exports = router;
