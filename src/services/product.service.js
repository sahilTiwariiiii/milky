const Product = require('../models/Product');
const AppError = require('../utils/appError');
const { PRODUCT_STATUS } = require('../config/constants');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

class ProductService {
  /**
   * Create a new product (Super Admin only)
   */
  static async createProduct(productData) {
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${productData.name.trim()}$`, 'i') }
    });

    if (existingProduct) {
      throw new AppError(`A product with name "${productData.name}" already exists.`, 409);
    }

    const product = await Product.create(productData);
    return product;
  }

  /**
   * Get products list with optional filters and pagination
   */
  static async getAllProducts(queryParams) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    if (queryParams.category) {
      filter.category = queryParams.category;
    }

    if (queryParams.search) {
      filter.name = { $regex: queryParams.search, $options: 'i' };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    const meta = getPaginationMeta(total, page, limit);

    return {
      products,
      meta
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  /**
   * Update product (Super Admin only)
   */
  static async updateProduct(productId, updateData) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (updateData.name && updateData.name.toLowerCase() !== product.name.toLowerCase()) {
      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
        _id: { $ne: productId }
      });

      if (existingProduct) {
        throw new AppError(`A product with name "${updateData.name}" already exists.`, 409);
      }
    }

    Object.keys(updateData).forEach((key) => {
      product[key] = updateData[key];
    });

    await product.save();
    return product;
  }

  /**
   * Delete product (Super Admin only)
   */
  static async deleteProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await Product.findByIdAndDelete(productId);
    return { id: productId };
  }
}

module.exports = ProductService;
