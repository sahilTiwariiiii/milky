const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const validate = require('../middlewares/validate.middleware');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { createAdminSchema, updateAdminSchema } = require('../validations/admin.validation');
const { ROLES } = require('../config/constants');

// All Admin Management routes are restricted to SUPER_ADMIN
router.use(protect);
router.use(restrictTo(ROLES.SUPER_ADMIN));

router.post('/', validate(createAdminSchema), AdminController.createAdmin);
router.get('/', AdminController.getAllAdmins);
router.get('/:id', AdminController.getAdminById);
router.put('/:id', validate(updateAdminSchema), AdminController.updateAdmin);
router.delete('/:id', AdminController.deleteAdmin);

module.exports = router;
