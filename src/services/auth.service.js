const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const env = require('../config/env');
const { USER_STATUS, ROLES } = require('../config/constants');

class AuthService {
  /**
   * Issue a signed JWT token for a user
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN
      }
    );
  }

  /**
   * Authenticate user by email & password
   */
  static async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail }).select('+password');

    // If database was empty and user is logging in with default credentials, auto-provision Super Admin
    if (!user && cleanEmail === 'admin@dairy.com') {
      const superAdminCount = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
      if (superAdminCount === 0) {
        user = await User.create({
          name: 'Super Administrator',
          email: 'admin@dairy.com',
          mobile: '9876543210',
          password: 'Admin@12345',
          role: ROLES.SUPER_ADMIN,
          status: USER_STATUS.ACTIVE
        });
        // Refetch with password for verification
        user = await User.findById(user._id).select('+password');
      }
    }

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new AppError('Account is inactive. Please contact Super Admin.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status
      }
    };
  }
}

module.exports = AuthService;
