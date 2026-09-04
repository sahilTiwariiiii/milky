const CustomerService = require('../services/customer.service');
const ApiResponse = require('../utils/apiResponse');

class CustomerController {
  static async createCustomer(req, res, next) {
    try {
      const customer = await CustomerService.createCustomer(req.body, req.user);
      return ApiResponse.created(res, 'Customer created successfully with QR code', { customer });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomers(req, res, next) {
    try {
      const { customers, meta } = await CustomerService.getCustomers(req.query, req.user);
      return ApiResponse.success(res, 'Customers retrieved successfully', { customers }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req, res, next) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id, req.user);
      return ApiResponse.success(res, 'Customer retrieved successfully', { customer });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerByQrToken(req, res, next) {
    try {
      const { qrToken } = req.params;
      const customer = await CustomerService.getCustomerByQrToken(qrToken, req.user);
      return ApiResponse.success(res, 'Customer QR scan verified successfully', { customer });
    } catch (error) {
      next(error);
    }
  }

  static async regenerateQrCode(req, res, next) {
    try {
      const customer = await CustomerService.regenerateQrCode(req.params.id, req.user);
      return ApiResponse.success(res, 'Customer QR code regenerated successfully', { customer });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req, res, next) {
    try {
      const customer = await CustomerService.updateCustomer(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Customer updated successfully', { customer });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req, res, next) {
    try {
      const result = await CustomerService.deleteCustomer(req.params.id, req.user);
      return ApiResponse.success(res, 'Customer deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CustomerController;
