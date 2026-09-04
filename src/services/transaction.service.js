const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const AppError = require('../utils/appError');
const { ROLES, PRODUCT_STATUS } = require('../config/constants');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

class TransactionService {
  /**
   * Record a new product distribution transaction
   */
  static async recordTransaction(data, user) {
    const { customerId, productId, quantity, notes } = data;

    // 1. Fetch customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // 2. Admin Isolation Check:
    // If the caller is an ADMIN, ensure this customer is assigned to this Admin
    if (user.role === ROLES.ADMIN) {
      if (customer.adminId.toString() !== user._id.toString()) {
        throw new AppError(
          'Access denied: You cannot record transactions for another Admin\'s customer.',
          403
        );
      }
    }

    // Determine adminId for transaction:
    // If Admin, use user._id; If Super Admin, use customer's assigned adminId
    const effectiveAdminId = user.role === ROLES.ADMIN ? user._id : customer.adminId;

    // 3. Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError(`Product "${product.name}" is currently inactive.`, 400);
    }

    // 4. Calculate total amount and take snapshot of current price, name, and unit
    const priceAtTransaction = product.price;
    const totalAmount = Math.round(quantity * priceAtTransaction * 100) / 100;

    // 5. Create transaction record
    const transaction = await Transaction.create({
      customerId: customer._id,
      adminId: effectiveAdminId,
      productId: product._id,
      productName: product.name,
      quantity,
      unit: product.unit,
      priceAtTransaction,
      totalAmount,
      notes: notes || ''
    });

    return Transaction.findById(transaction._id)
      .populate('customerId', 'name mobile qrToken')
      .populate('adminId', 'name email mobile')
      .populate('productId', 'name category unit price');
  }

  /**
   * Get transaction history for a specific customer
   */
  static async getCustomerTransactions(customerId, queryParams, user) {
    // 1. Verify customer exists and populate admin details
    const customer = await Customer.findById(customerId).populate('adminId', 'name email mobile');
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // 2. Admin Isolation Check
    if (user.role === ROLES.ADMIN) {
      const customerAdminId = customer.adminId?._id
        ? customer.adminId._id.toString()
        : customer.adminId?.toString();
      if (customerAdminId !== user._id.toString()) {
        throw new AppError(
          'Access denied: You cannot view transaction history for another Admin\'s customer.',
          403
        );
      }
    }

    const { page, limit, skip } = getPagination(queryParams);
    const filter = { customerId };

    if (queryParams.startDate || queryParams.endDate) {
      filter.createdAt = {};
      if (queryParams.startDate) {
        filter.createdAt.$gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        // End of the day if just a date is given
        const end = new Date(queryParams.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const aggMatch = { customerId: customer._id };
    if (filter.createdAt) {
      aggMatch.createdAt = filter.createdAt;
    }

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(filter)
        .populate('adminId', 'name email mobile')
        .populate('productId', 'name category unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: aggMatch },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$totalAmount' },
            totalVolume: { $sum: '$quantity' },
            totalTransactions: { $sum: 1 }
          }
        }
      ])
    ]);

    const meta = getPaginationMeta(total, page, limit);

    return {
      customer: {
        id: customer._id,
        _id: customer._id,
        name: customer.name,
        mobile: customer.mobile,
        qrToken: customer.qrToken,
        qrCode: customer.qrCode,
        address: customer.address || '',
        adharNumber: customer.adharNumber || '',
        panNumber: customer.panNumber || '',
        image: customer.image || customer.profileImage || '',
        profileImage: customer.profileImage || customer.image || '',
        status: customer.status,
        adminId: customer.adminId
      },
      summary: {
        totalSpent: summary[0]?.totalSpent || 0,
        totalVolume: summary[0]?.totalVolume || 0,
        totalTransactions: summary[0]?.totalTransactions || 0
      },
      transactions,
      meta
    };
  }

  /**
   * Get all transactions with filters & pagination
   */
  static async getAllTransactions(queryParams, user) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    // Admin Isolation
    if (user.role === ROLES.ADMIN) {
      filter.adminId = user._id;
    } else if (queryParams.adminId) {
      filter.adminId = queryParams.adminId;
    }

    if (queryParams.customerId) {
      filter.customerId = queryParams.customerId;
    }

    if (queryParams.productId) {
      filter.productId = queryParams.productId;
    }

    if (queryParams.startDate || queryParams.endDate) {
      filter.createdAt = {};
      if (queryParams.startDate) {
        filter.createdAt.$gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        const end = new Date(queryParams.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (queryParams.search && queryParams.search.trim()) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i');
      const matchingCustomerIds = await Customer.find({
        $or: [
          { name: searchRegex },
          { mobile: searchRegex },
          { qrToken: searchRegex }
        ]
      }).distinct('_id');

      filter.$or = [
        { customerId: { $in: matchingCustomerIds } },
        { productName: searchRegex },
        { notes: searchRegex }
      ];
    }

    const [transactions, total, aggregateSummary] = await Promise.all([
      Transaction.find(filter)
        .populate('customerId', 'name mobile qrToken')
        .populate('adminId', 'name email')
        .populate('productId', 'name category unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalVolume: { $sum: '$quantity' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const meta = getPaginationMeta(total, page, limit);

    return {
      summary: {
        totalRevenue: aggregateSummary[0]?.totalRevenue || 0,
        totalVolume: aggregateSummary[0]?.totalVolume || 0,
        totalTransactions: aggregateSummary[0]?.count || 0
      },
      transactions,
      meta
    };
  }

  /**
   * Get single transaction by ID
   */
  static async getTransactionById(transactionId, user) {
    const transaction = await Transaction.findById(transactionId)
      .populate('customerId', 'name mobile qrToken address')
      .populate('adminId', 'name email mobile')
      .populate('productId', 'name category unit price');

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (user.role === ROLES.ADMIN) {
      if (transaction.adminId._id.toString() !== user._id.toString()) {
        throw new AppError(
          'Access denied: You cannot view another Admin\'s transaction.',
          403
        );
      }
    }

    return transaction;
  }

  /**
   * Update transaction entry (quantity, price, product, notes, date)
   */
  static async updateTransaction(transactionId, updateData, user) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    // Admin Isolation: Admin can only edit their own transactions
    if (user.role === ROLES.ADMIN) {
      if (transaction.adminId.toString() !== user._id.toString()) {
        throw new AppError('Access denied: You cannot edit another admin\'s transaction record.', 403);
      }
    }

    if (updateData.productId) {
      const product = await Product.findById(updateData.productId);
      if (product) {
        transaction.productId = product._id;
        transaction.productName = product.name;
        transaction.unit = product.unit;
        if (updateData.priceAtTransaction === undefined) {
          transaction.priceAtTransaction = product.price;
        }
      }
    }

    if (updateData.priceAtTransaction !== undefined) {
      transaction.priceAtTransaction = Number(updateData.priceAtTransaction);
    }

    if (updateData.quantity !== undefined) {
      transaction.quantity = Number(updateData.quantity);
    }

    if (updateData.notes !== undefined) {
      transaction.notes = updateData.notes;
    }

    if (updateData.createdAt) {
      transaction.createdAt = new Date(updateData.createdAt);
    }

    // Recalculate total amount
    transaction.totalAmount = Math.round(transaction.quantity * transaction.priceAtTransaction * 100) / 100;
    await transaction.save();

    return Transaction.findById(transaction._id)
      .populate('customerId', 'name mobile qrToken')
      .populate('adminId', 'name email mobile')
      .populate('productId', 'name category unit price');
  }

  /**
   * Delete a transaction record
   */
  static async deleteTransaction(transactionId, user) {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (user.role === ROLES.ADMIN) {
      if (transaction.adminId.toString() !== user._id.toString()) {
        throw new AppError('Access denied: You cannot delete another admin\'s transaction record.', 403);
      }
    }

    await Transaction.findByIdAndDelete(transactionId);
    return { message: 'Transaction record deleted successfully' };
  }
}

module.exports = TransactionService;
