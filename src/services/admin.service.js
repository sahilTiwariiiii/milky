const User = require('../models/User');
const Customer = require('../models/Customer');
const AppError = require('../utils/appError');
const { ROLES } = require('../config/constants');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

class AdminService {
  /**
   * Create a new Admin user
   */
  static async createAdmin(adminData) {
    const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409);
    }

    const admin = await User.create({
      ...adminData,
      role: ROLES.ADMIN
    });

    return admin;
  }

  /**
   * Get all admins with customer count
   */
  static async getAllAdmins(queryParams) {
    const { page, limit, skip } = getPagination(queryParams);

    const filter = { role: ROLES.ADMIN };
    if (queryParams.status) {
      filter.status = queryParams.status;
    }
    if (queryParams.search) {
      filter.$or = [
        { name: { $regex: queryParams.search, $options: 'i' } },
        { email: { $regex: queryParams.search, $options: 'i' } },
        { mobile: { $regex: queryParams.search, $options: 'i' } }
      ];
    }

    const [admins, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    // Aggregate customer counts for these admins
    const adminIds = admins.map((admin) => admin._id);
    const customerCounts = await Customer.aggregate([
      { $match: { adminId: { $in: adminIds } } },
      { $group: { _id: '$adminId', count: { $sum: 1 } } }
    ]);

    const countMap = customerCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const adminsWithStats = admins.map((admin) => {
      const adminObj = admin.toJSON();
      adminObj.assignedCustomerCount = countMap[admin._id.toString()] || 0;
      return adminObj;
    });

    const meta = getPaginationMeta(total, page, limit);

    return {
      admins: adminsWithStats,
      meta
    };
  }

  /**
   * Get admin by ID with assigned customers
   */
  static async getAdminById(adminId) {
    const admin = await User.findOne({ _id: adminId, role: ROLES.ADMIN });
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const assignedCustomers = await Customer.find({ adminId })
      .select('name mobile status qrToken createdAt')
      .sort({ createdAt: -1 });

    const adminObj = admin.toJSON();
    adminObj.assignedCustomerCount = assignedCustomers.length;
    adminObj.assignedCustomers = assignedCustomers;

    return adminObj;
  }

  /**
   * Update an existing admin
   */
  static async updateAdmin(adminId, updateData) {
    const admin = await User.findOne({ _id: adminId, role: ROLES.ADMIN });
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (updateData.email && updateData.email.toLowerCase() !== admin.email) {
      const emailExists = await User.findOne({ email: updateData.email.toLowerCase() });
      if (emailExists) {
        throw new AppError('An account with this email already exists', 409);
      }
    }

    Object.keys(updateData).forEach((key) => {
      admin[key] = updateData[key];
    });

    await admin.save();
    return admin;
  }

  /**
   * Delete an admin
   */
  static async deleteAdmin(adminId) {
    const admin = await User.findOne({ _id: adminId, role: ROLES.ADMIN });
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const assignedCount = await Customer.countDocuments({ adminId });
    if (assignedCount > 0) {
      throw new AppError(
        `Cannot delete Admin. There are ${assignedCount} active customer(s) assigned. Please reassign the customers first.`,
        400
      );
    }

    await User.findByIdAndDelete(adminId);
    return { id: adminId };
  }
}

module.exports = AdminService;
