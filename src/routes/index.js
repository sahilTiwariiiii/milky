const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const customerRoutes = require('./customer.routes');
const productRoutes = require('./product.routes');
const transactionRoutes = require('./transaction.routes');
const systemConfigRoutes = require('./systemConfig.routes');
const uploadRoutes = require('./upload.routes');

// Health check / API information
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Customer QR & Milk Management API'
  });
});

// Route registration
router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionRoutes);
router.use('/system-config', systemConfigRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
