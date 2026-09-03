const express = require('express');
const router = express.Router();
const SystemConfigController = require('../controllers/systemConfig.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

// Public: anyone can fetch org branding (name, logo, helpline)
router.get('/', SystemConfigController.getConfig);

// Protected: only Super Admin can update system configuration
router.use(protect);
router.put('/', restrictTo(ROLES.SUPER_ADMIN), SystemConfigController.updateConfig);

module.exports = router;
