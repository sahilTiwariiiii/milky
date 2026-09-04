const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const QrService = require('../services/qr.service');
const { ROLES, PRODUCT_UNITS } = require('../config/constants');

const seedData = async () => {
  try {
    console.log('--- Starting Database Seeding ---');
    await connectDB();

    // Clear existing collections
    console.log('Clearing old data...');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Transaction.deleteMany({})
    ]);

    // 1. Create Super Admin
    console.log('Creating Super Admin...');
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'admin@dairy.com',
      mobile: '9876543210',
      password: 'Admin@12345',
      role: ROLES.SUPER_ADMIN
    });

    // 2. Create Admins
    console.log('Creating Admins...');
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

    // 3. Create Products
    console.log('Creating Products...');
    const products = await Product.create([
      {
        name: 'Fresh Cow Milk',
        category: 'Dairy',
        unit: PRODUCT_UNITS.LITRE,
        price: 60
      },
      {
        name: 'Fresh Paneer',
        category: 'Dairy',
        unit: PRODUCT_UNITS.KG,
        price: 400
      },
      {
        name: 'Sweet Dahi',
        category: 'Dairy',
        unit: PRODUCT_UNITS.KG,
        price: 100
      },
      {
        name: 'Pure Desi Ghee',
        category: 'Dairy',
        unit: PRODUCT_UNITS.KG,
        price: 650
      },
      {
        name: 'Fresh Khova',
        category: 'Dairy',
        unit: PRODUCT_UNITS.KG,
        price: 350
      }
    ]);

    // 4. Create Customers with QR Codes
    console.log('Creating Customers and generating unique QR codes...');

    // Admin A's Customers
    const qrA1 = await QrService.createTokenAndQr();
    const cust1 = await Customer.create({
      name: 'Rahul Sharma',
      mobile: '9988776601',
      address: 'House #12, Sector 4, City',
      adminId: adminA._id,
      qrToken: qrA1.qrToken,
      qrCode: qrA1.qrCode
    });

    const qrA2 = await QrService.createTokenAndQr();
    const cust2 = await Customer.create({
      name: 'Priya Verma',
      mobile: '9988776602',
      address: 'Flat 402, Sunshine Apartments',
      adminId: adminA._id,
      qrToken: qrA2.qrToken,
      qrCode: qrA2.qrCode
    });

    const qrA3 = await QrService.createTokenAndQr();
    const cust3 = await Customer.create({
      name: 'Amit Patel',
      mobile: '9988776603',
      address: 'Plot 77, Green Avenue',
      adminId: adminA._id,
      qrToken: qrA3.qrToken,
      qrCode: qrA3.qrCode
    });

    // Admin B's Customers
    const qrB1 = await QrService.createTokenAndQr();
    const cust4 = await Customer.create({
      name: 'Vikram Singh',
      mobile: '9988776604',
      address: 'B-23, Lakeview Residency',
      adminId: adminB._id,
      qrToken: qrB1.qrToken,
      qrCode: qrB1.qrCode
    });

    const qrB2 = await QrService.createTokenAndQr();
    const cust5 = await Customer.create({
      name: 'Sneha Gupta',
      mobile: '9988776605',
      address: 'Villa 5, Golden Palms',
      adminId: adminB._id,
      qrToken: qrB2.qrToken,
      qrCode: qrB2.qrCode
    });

    const qrB3 = await QrService.createTokenAndQr();
    const cust6 = await Customer.create({
      name: 'Ankit Mehta',
      mobile: '9988776606',
      address: 'C-104, Royal Heights',
      adminId: adminB._id,
      qrToken: qrB3.qrToken,
      qrCode: qrB3.qrCode
    });

    // 5. Create Initial Sample Transactions
    console.log('Creating sample transactions...');
    const milk = products.find((p) => p.name.includes('Milk'));
    const paneer = products.find((p) => p.name.includes('Paneer'));
    const dahi = products.find((p) => p.name.includes('Dahi'));

    await Transaction.create([
      {
        customerId: cust1._id,
        adminId: adminA._id,
        productId: milk._id,
        productName: milk.name,
        quantity: 2,
        unit: milk.unit,
        priceAtTransaction: milk.price,
        totalAmount: 2 * milk.price,
        notes: 'Morning delivery'
      },
      {
        customerId: cust1._id,
        adminId: adminA._id,
        productId: paneer._id,
        productName: paneer.name,
        quantity: 0.5,
        unit: paneer.unit,
        priceAtTransaction: paneer.price,
        totalAmount: 0.5 * paneer.price,
        notes: 'Fresh paneer'
      },
      {
        customerId: cust4._id,
        adminId: adminB._id,
        productId: dahi._id,
        productName: dahi.name,
        quantity: 1,
        unit: dahi.unit,
        priceAtTransaction: dahi.price,
        totalAmount: 1 * dahi.price,
        notes: 'Daily supply'
      }
    ]);

    console.log('\n=============================================');
    console.log('       DATABASE SEEDING COMPLETE');
    console.log('=============================================');
    console.log('Super Admin:');
    console.log('  Email:    admin@dairy.com');
    console.log('  Password: Admin@12345\n');
    console.log('Admin A (Assigned 3 customers: Rahul, Priya, Amit):');
    console.log('  Email:    admin.rajesh@dairy.com');
    console.log('  Password: Admin@12345');
    console.log(`  Sample Customer 1 QR Token: ${cust1.qrToken}\n`);
    console.log('Admin B (Assigned 3 customers: Vikram, Sneha, Ankit):');
    console.log('  Email:    admin.sunil@dairy.com');
    console.log('  Password: Admin@12345');
    console.log(`  Sample Customer 4 QR Token: ${cust4.qrToken}\n`);
    console.log('=============================================\n');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
