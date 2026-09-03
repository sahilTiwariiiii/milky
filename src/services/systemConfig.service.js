const SystemConfig = require('../models/SystemConfig');
const AppError = require('../utils/appError');

class SystemConfigService {
  static async getConfig() {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        orgName: 'Milky Dairy',
        orgLogo: '',
        categories: ['Dairy', 'Milk', 'Curd', 'Ghee']
      });
    }
    return config;
  }

  static async updateConfig(data, user) {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    if (data.orgName) config.orgName = data.orgName;
    const logoVal = data.profileImage !== undefined ? data.profileImage : data.orgLogo;
    if (logoVal !== undefined) {
      config.orgLogo = logoVal;
      config.profileImage = logoVal;
    }
    if (data.tagline !== undefined) config.tagline = data.tagline;
    if (data.phone !== undefined) config.phone = data.phone;
    if (data.address !== undefined) config.address = data.address;
    if (data.categories) config.categories = data.categories;
    config.updatedBy = user._id;

    await config.save();
    return config;
  }
}

module.exports = SystemConfigService;
