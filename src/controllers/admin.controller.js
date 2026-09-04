const AdminService = require('../services/admin.service');
const ApiResponse = require('../utils/apiResponse');

class AdminController {
  static async createAdmin(req, res, next) {
    try {
      const admin = await AdminService.createAdmin(req.body);
      return ApiResponse.created(res, 'Admin created successfully', { admin });
    } catch (error) {
      next(error);
    }
  }

  static async getAllAdmins(req, res, next) {
    try {
      const { admins, meta } = await AdminService.getAllAdmins(req.query);
      return ApiResponse.success(res, 'Admins retrieved successfully', { admins }, 200, meta);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminById(req, res, next) {
    try {
      const admin = await AdminService.getAdminById(req.params.id);
      return ApiResponse.success(res, 'Admin retrieved successfully', { admin });
    } catch (error) {
      next(error);
    }
  }

  static async updateAdmin(req, res, next) {
    try {
      const admin = await AdminService.updateAdmin(req.params.id, req.body);
      return ApiResponse.success(res, 'Admin updated successfully', { admin });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAdmin(req, res, next) {
    try {
      const result = await AdminService.deleteAdmin(req.params.id);
      return ApiResponse.success(res, 'Admin deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
