const ProductService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');

class ProductController {
  static async createProduct(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body);
      return ApiResponse.created(res, 'Product created successfully', { product });
    } catch (error) {
      next(error);
    }
  }

  static async getAllProducts(req, res, next) {
    try {
      const { products, meta } = await ProductService.getAllProducts(req.query);
      return ApiResponse.success(res, 'Products retrieved successfully', { products }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      return ApiResponse.success(res, 'Product retrieved successfully', { product });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      return ApiResponse.success(res, 'Product updated successfully', { product });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req, res, next) {
    try {
      const result = await ProductService.deleteProduct(req.params.id);
      return ApiResponse.success(res, 'Product deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
