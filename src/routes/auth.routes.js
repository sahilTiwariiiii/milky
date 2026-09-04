const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { loginSchema } = require('../validations/auth.validation');
const { protect } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', protect, AuthController.logout);
router.get('/me', protect, AuthController.getMe);

module.exports = router;
