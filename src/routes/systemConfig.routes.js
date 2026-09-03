const express = require('express');
const router = express.Router();
const SystemConfigController = require('../controllers/systemConfig.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/constants');

router.use(protect);
router.get('/', SystemConfigController.getConfig);
router.put('/', restrictTo(ROLES.SUPER_ADMIN), SystemConfigController.updateConfig);

module.exports = router;
