const SystemConfigService = require('../services/systemConfig.service');
const ApiResponse = require('../utils/apiResponse');

class SystemConfigController {
  static async getConfig(req, res, next) {
    try {
      const config = await SystemConfigService.getConfig();
      return ApiResponse.success(res, 'System configuration retrieved successfully', { config });
    } catch (error) {
      next(error);
    }
  }

  static async updateConfig(req, res, next) {
    try {
      const config = await SystemConfigService.updateConfig(req.body, req.user);
      return ApiResponse.success(res, 'System configuration updated successfully', { config });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SystemConfigController;
