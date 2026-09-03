const AuthService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return ApiResponse.success(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = req.user;
      return ApiResponse.success(res, 'User profile fetched successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // In stateless JWT, client deletes token; endpoint confirms logout
      return ApiResponse.success(res, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
