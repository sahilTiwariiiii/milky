const Customer = require('../models/Customer');
const User = require('../models/User');
const QrService = require('./qr.service');
const AppError = require('../utils/appError');
const { ROLES } = require('../config/constants');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

class CustomerService {
  /**
   * Helper to verify if the requesting user owns or can access the customer
   */
  static verifyCustomerAccess(customer, user) {
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (user.role === ROLES.ADMIN) {
      const customerAdminId = customer.adminId._id
        ? customer.adminId._id.toString()
        : customer.adminId.toString();

      if (customerAdminId !== user._id.toString()) {
        throw new AppError(
          'Access denied: You are not authorized to access this customer.',
          403
        );
      }
    }
  }

  /**
   * Create a new Customer with auto-generated QR code & token
   */
  static async createCustomer(customerData, creatorUser) {
    // If Admin is creating customer, force adminId to be their own ID
    let targetAdminId = customerData.adminId || creatorUser._id;
    if (creatorUser.role === ROLES.ADMIN) {
      targetAdminId = creatorUser._id;
    }

    // Verify assigned admin exists and is an active Admin
    const admin = await User.findOne({ _id: targetAdminId, role: ROLES.ADMIN });
    if (!admin) {
      throw new AppError('The specified Admin does not exist or is invalid', 400);
    }

    // Generate unique QR token and QR code image
    const { qrToken, qrCode } = await QrService.createTokenAndQr();

    const imgVal = customerData.profileImage || customerData.image || '';
    const customer = await Customer.create({
      ...customerData,
      adminId: targetAdminId,
      qrToken,
      qrCode,
      adharNumber: customerData.adharNumber || '',
      panNumber: customerData.panNumber || '',
      image: imgVal,
      profileImage: imgVal
    });

    return Customer.findById(customer._id).populate('adminId', 'name email mobile');
  }

  /**
   * Get customers list with pagination and role-based filtering
   */
  static async getCustomers(queryParams, user) {
    const { page, limit, skip } = getPagination(queryParams);
    const filter = {};

    // Strict Admin Isolation: Admin can ONLY view their own assigned customers
    if (user.role === ROLES.ADMIN) {
      filter.adminId = user._id;
    } else if (queryParams.adminId) {
      filter.adminId = queryParams.adminId;
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    if (queryParams.search) {
      filter.$or = [
        { name: { $regex: queryParams.search, $options: 'i' } },
        { mobile: { $regex: queryParams.search, $options: 'i' } },
        { qrToken: { $regex: queryParams.search, $options: 'i' } }
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('adminId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(filter)
    ]);

    const meta = getPaginationMeta(total, page, limit);

    return {
      customers,
      meta
    };
  }

  /**
   * Get single customer by ID with access verification
   */
  static async getCustomerById(customerId, user) {
    const customer = await Customer.findById(customerId).populate(
      'adminId',
      'name email mobile'
    );

    this.verifyCustomerAccess(customer, user);

    return customer;
  }

  /**
   * QR Scan Flow: Find customer by qrToken, ID, or mobile, and verify Admin ownership
   */
  static async getCustomerByQrToken(qrToken, user) {
    if (!qrToken) {
      throw new AppError('QR token is required', 400);
    }

    let raw = decodeURIComponent(qrToken).trim();
    // Strip surrounding quotes
    raw = raw.replace(/^["']|["']$/g, '');

    // Extract CUST_ token if embedded in URL or json
    const custMatch = raw.match(/CUST_[A-Za-z0-9]+/i);
    const candidateToken = custMatch ? custMatch[0] : raw;

    // Build lookup query
    const orConditions = [
      { qrToken: candidateToken },
      { qrToken: { $regex: new RegExp(`^${candidateToken}$`, 'i') } },
      { qrToken: raw },
      { qrToken: { $regex: new RegExp(`^${raw}$`, 'i') } }
    ];

    // Support MongoDB ObjectId match
    if (/^[0-9a-fA-F]{24}$/.test(raw) || /^[0-9a-fA-F]{24}$/.test(candidateToken)) {
      orConditions.push({ _id: /^[0-9a-fA-F]{24}$/.test(raw) ? raw : candidateToken });
    }

    // Support 10-digit mobile lookup
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      orConditions.push({ mobile: digitsOnly });
    }

    let customer = await Customer.findOne({ $or: orConditions }).populate(
      'adminId',
      'name email mobile'
    );

    // Fallback: partial match on qrToken if candidate is at least 4 characters
    if (!customer && candidateToken.length >= 4) {
      customer = await Customer.findOne({
        qrToken: { $regex: new RegExp(candidateToken.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') }
      }).populate('adminId', 'name email mobile');
    }

    if (!customer) {
      throw new AppError(`Customer not found for this QR code ("${candidateToken}").`, 404);
    }

    // Strict Admin Isolation check
    this.verifyCustomerAccess(customer, user);

    return customer;
  }

  /**
   * Regenerate QR Code for a customer
   */
  static async regenerateQrCode(customerId, user) {
    const customer = await Customer.findById(customerId);
    this.verifyCustomerAccess(customer, user);

    const { qrToken, qrCode } = await QrService.createTokenAndQr();
    customer.qrToken = qrToken;
    customer.qrCode = qrCode;

    await customer.save();

    return Customer.findById(customerId).populate('adminId', 'name email mobile');
  }

  /**
   * Update customer profile
   */
  static async updateCustomer(customerId, updateData, user) {
    const customer = await Customer.findById(customerId);
    this.verifyCustomerAccess(customer, user);

    // If changing admin assignment, verify new admin exists (Super Admin only feature)
    if (updateData.adminId && updateData.adminId !== customer.adminId.toString()) {
      if (user.role !== ROLES.SUPER_ADMIN) {
        throw new AppError('Only Super Admin can reassign customers to another Admin.', 403);
      }
      const newAdmin = await User.findOne({ _id: updateData.adminId, role: ROLES.ADMIN });
      if (!newAdmin) {
        throw new AppError('Assigned Admin does not exist', 400);
      }
    }

    if (updateData.profileImage !== undefined && updateData.image === undefined) {
      updateData.image = updateData.profileImage;
    } else if (updateData.image !== undefined && updateData.profileImage === undefined) {
      updateData.profileImage = updateData.image;
    }

    Object.keys(updateData).forEach((key) => {
      // qrToken and qrCode shouldn't be manually edited here
      if (key !== 'qrToken' && key !== 'qrCode') {
        customer[key] = updateData[key];
      }
    });

    await customer.save();

    return Customer.findById(customerId).populate('adminId', 'name email mobile');
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(customerId, user) {
    const customer = await Customer.findById(customerId);
    this.verifyCustomerAccess(customer, user);

    await Customer.findByIdAndDelete(customerId);
    return { id: customerId };
  }
}

module.exports = CustomerService;
