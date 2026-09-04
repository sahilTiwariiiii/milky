const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const QrService = require('../services/qr.service');
const { ROLES, PRODUCT_UNITS } = require('../config/constants');

const autoSeedIfEmpty = async () => {
  try {
    const adminCount = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    if (adminCount > 0) {
      return; // Already initialized
    }

    console.log('[AutoSeed] Initializing default database accounts and catalog...');

    // 1. Super Admin
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'admin@dairy.com',
      mobile: '9876543210',
      password: 'Admin@12345',
      role: ROLES.SUPER_ADMIN
    });

    // 2. Delivery Admins
    const adminA = await User.create({
      name: 'Rajesh Kumar (Admin A)',
      email: 'admin.rajesh@dairy.com',
      mobile: '9876543211',
      password: 'Admin@12345',
      role: ROLES.ADMIN
    });

    const adminB = await User.create({
      name: 'Sunil Sharma (Admin B)',
      email: 'admin.sunil@dairy.com',
      mobile: '9876543212',
      password: 'Admin@12345',
      role: ROLES.ADMIN
    });

    // 3. Products
    const products = await Product.create([
      { name: 'Fresh Cow Milk', category: 'Dairy', unit: PRODUCT_UNITS.LITRE, price: 60 },
      { name: 'Fresh Paneer', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 400 },
      { name: 'Sweet Dahi', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 100 },
      { name: 'Pure Desi Ghee', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 650 },
      { name: 'Fresh Khova', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 350 }
    ]);

    // 4. Customers with QRs for Admin A
    const qrA1 = await QrService.createTokenAndQr();
    const cust1 = await Customer.create({
      name: 'Rahul Sharma',
      mobile: '9988776601',
      address: 'House #12, Sector 4',
      adminId: adminA._id,
      qrToken: qrA1.qrToken,
      qrCode: qrA1.qrCode
    });

    const qrA2 = await QrService.createTokenAndQr();
    const cust2 = await Customer.create({
      name: 'Priya Verma',
      mobile: '9988776602',
      address: 'Flat 402, Sunshine Apts',
      adminId: adminA._id,
      qrToken: qrA2.qrToken,
      qrCode: qrA2.qrCode
    });

    // Customers for Admin B
    const qrB1 = await QrService.createTokenAndQr();
    const cust3 = await Customer.create({
      name: 'Vikram Singh',
      mobile: '9988776604',
      address: 'B-23, Lakeview Residency',
      adminId: adminB._id,
      qrToken: qrB1.qrToken,
      qrCode: qrB1.qrCode
    });

    // Sample Transaction
    await Transaction.create([
      {
        customerId: cust1._id,
        adminId: adminA._id,
        productId: products[0]._id,
        productName: products[0].name,
        quantity: 2,
        unit: products[0].unit,
        priceAtTransaction: products[0].price,
        totalAmount: 120,
        notes: 'Morning delivery'
      }
    ]);

    console.log('[AutoSeed] ✅ Successfully seeded Super Admin (admin@dairy.com / Admin@12345), Admins, Products, and Customers!');
  } catch (err) {
    console.error('[AutoSeed Error]', err.message);
  }
};

module.exports = autoSeedIfEmpty;
