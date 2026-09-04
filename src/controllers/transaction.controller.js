const TransactionService = require('../services/transaction.service');
const ApiResponse = require('../utils/apiResponse');

class TransactionController {
  static async createTransaction(req, res, next) {
    try {
      const transaction = await TransactionService.recordTransaction(req.body, req.user);
      return ApiResponse.created(res, 'Transaction recorded successfully', { transaction });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerTransactions(req, res, next) {
    try {
      const { customerId } = req.params;
      const result = await TransactionService.getCustomerTransactions(
        customerId,
        req.query,
        req.user
      );
      return ApiResponse.success(
        res,
        'Customer transaction history retrieved successfully',
        result,
        200,
        result.meta
      );
    } catch (error) {
      next(error);
    }
  }

  static async getAllTransactions(req, res, next) {
    try {
      const result = await TransactionService.getAllTransactions(req.query, req.user);
      return ApiResponse.success(
        res,
        'Transactions retrieved successfully',
        result,
        200,
        result.meta
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTransactionById(req, res, next) {
    try {
      const transaction = await TransactionService.getTransactionById(
        req.params.id,
        req.user
      );
      return ApiResponse.success(res, 'Transaction retrieved successfully', { transaction });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionController;
