const mongoose = require('mongoose');
const env = require('./env');

let memoryServerInstance = null;

const connectDB = async (uri = env.MONGODB_URI) => {
  try {
    console.log(`[Database] Attempting connection to MongoDB...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });
    console.log(`[Database] MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`\n⚠️  [Database Warning] Could not connect to primary MongoDB URI (${error.message})`);

    // In development mode, automatically spin up in-memory MongoDB fallback so server NEVER crashes
    if (env.NODE_ENV === 'development') {
      try {
        console.log(`[Database] Starting In-Memory MongoDB Dev Database fallback...`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create({
          binary: {
            version: '7.0.14'
          }
        });
        const fallbackUri = memoryServerInstance.getUri();

        const fallbackConn = await mongoose.connect(fallbackUri);
        console.log(`[Database] ✅ In-Memory MongoDB Connected at: ${fallbackUri}`);
        console.log(`[Database] Running initial database seed...`);

        // Automatically seed demo data
        const seedData = require('../seeds/seed');
        // Run seed without calling process.exit
        try {
          const User = require('../models/User');
          const count = await User.countDocuments();
          if (count === 0) {
            const { ROLES, PRODUCT_UNITS } = require('./constants');
            const Customer = require('../models/Customer');
            const Product = require('../models/Product');
            const Transaction = require('../models/Transaction');
            const QrService = require('../services/qr.service');

            const superAdmin = await User.create({
              name: 'Super Administrator',
              email: 'admin@dairy.com',
              mobile: '9876543210',
              password: 'Admin@12345',
              role: ROLES.SUPER_ADMIN
            });

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

            const products = await Product.create([
              { name: 'Fresh Cow Milk', category: 'Dairy', unit: PRODUCT_UNITS.LITRE, price: 60 },
              { name: 'Fresh Paneer', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 400 },
              { name: 'Sweet Dahi', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 100 },
              { name: 'Pure Desi Ghee', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 650 },
              { name: 'Fresh Khova', category: 'Dairy', unit: PRODUCT_UNITS.KG, price: 350 }
            ]);

            const qr1 = await QrService.createTokenAndQr();
            const cust1 = await Customer.create({
              name: 'Rahul Sharma',
              mobile: '9988776601',
              address: 'House #12, Sector 4',
              adminId: adminA._id,
              qrToken: qr1.qrToken,
              qrCode: qr1.qrCode
            });

            const qr2 = await QrService.createTokenAndQr();
            const cust2 = await Customer.create({
              name: 'Priya Verma',
              mobile: '9988776602',
              address: 'Flat 402, Sunshine Apts',
              adminId: adminA._id,
              qrToken: qr2.qrToken,
              qrCode: qr2.qrCode
            });

            const qr3 = await QrService.createTokenAndQr();
            const cust3 = await Customer.create({
              name: 'Vikram Singh',
              mobile: '9988776604',
              address: 'B-23, Lakeview Residency',
              adminId: adminB._id,
              qrToken: qr3.qrToken,
              qrCode: qr3.qrCode
            });

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

            console.log(`[Database] ✅ Seeded Super Admin (admin@dairy.com), 2 Admins, Products, and Customers with QRs!\n`);
          }
        } catch (seedErr) {
          console.error('[Database Seed Warning]', seedErr.message);
        }

        return fallbackConn;
      } catch (fallbackErr) {
        console.error(`[Database Error] Fallback in-memory database failed: ${fallbackErr.message}`);
      }
    }

    if (env.NODE_ENV !== 'test') {
      console.error(`\n💡 Troubleshooting MongoDB Atlas Error:`);
      console.error(`1. Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> Allow Access From Anywhere / 0.0.0.0/0).`);
      console.error(`2. If your ISP/router blocks SRV DNS queries, change DNS to Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1).\n`);
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
    }
    console.log('[Database] MongoDB connection closed');
  } catch (error) {
    console.error(`[Database Error] Disconnect failed: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
