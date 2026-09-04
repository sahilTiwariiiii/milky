const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const Transaction = require('../src/models/Transaction');
const { ROLES, PRODUCT_UNITS } = require('../src/config/constants');
const AuthService = require('../src/services/auth.service');

describe('Transaction Management & Price Snapshot Tests', () => {
  let superAdminToken;
  let adminToken;
  let admin;
  let customer;
  let milkProduct;

  beforeEach(async () => {
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'super@test.com',
      password: 'Password123',
      role: ROLES.SUPER_ADMIN
    });

    admin = await User.create({
      name: 'Admin One',
      email: 'admin1@test.com',
      password: 'Password123',
      role: ROLES.ADMIN
    });

    superAdminToken = AuthService.generateToken(superAdmin);
    adminToken = AuthService.generateToken(admin);

    customer = await Customer.create({
      name: 'Rahul Sharma',
      mobile: '9876543210',
      adminId: admin._id,
      qrToken: 'CUST_RAHUL01',
      qrCode: 'data:image/png;base64,sampleqr'
    });

    milkProduct = await Product.create({
      name: 'Fresh Milk',
      category: 'Dairy',
      unit: PRODUCT_UNITS.LITRE,
      price: 60
    });
  });

  describe('POST /api/transactions', () => {
    it('should create transaction with automatic price snapshot and totalAmount calculation', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          productId: milkProduct._id.toString(),
          quantity: 2.5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const txn = res.body.data.transaction;
      expect(txn.productName).toBe('Fresh Milk');
      expect(txn.unit).toBe(PRODUCT_UNITS.LITRE);
      expect(txn.priceAtTransaction).toBe(60);
      expect(txn.quantity).toBe(2.5);
      expect(txn.totalAmount).toBe(150); // 2.5 * 60 = 150
      expect(txn.adminId._id.toString()).toBe(admin._id.toString());
    });

    it('CRITICAL TEST: Historical transactions must preserve priceAtTransaction when product price changes', async () => {
      // 1. Admin records transaction on 01 Sep (Milk = 60, Qty = 2, Total = 120)
      const txn1Res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          productId: milkProduct._id.toString(),
          quantity: 2
        });

      expect(txn1Res.status).toBe(201);
      const txn1Id = txn1Res.body.data.transaction._id;

      // 2. Super Admin changes Milk price from 60 to 75
      const updatePriceRes = await request(app)
        .put(`/api/products/${milkProduct._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ price: 75 });

      expect(updatePriceRes.status).toBe(200);
      expect(updatePriceRes.body.data.product.price).toBe(75);

      // 3. Verify old transaction STILL shows 60 and 120
      const oldTxn = await Transaction.findById(txn1Id);
      expect(oldTxn.priceAtTransaction).toBe(60);
      expect(oldTxn.totalAmount).toBe(120);

      // 4. Admin records new transaction (Milk = 75, Qty = 2, Total = 150)
      const txn2Res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          productId: milkProduct._id.toString(),
          quantity: 2
        });

      expect(txn2Res.status).toBe(201);
      const txn2 = txn2Res.body.data.transaction;
      expect(txn2.priceAtTransaction).toBe(75);
      expect(txn2.totalAmount).toBe(150);
    });
  });

  describe('GET /api/customers/:customerId/transactions', () => {
    it('should return customer transaction history and summary metrics', async () => {
      // Record two transactions
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          productId: milkProduct._id.toString(),
          quantity: 2
        });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          productId: milkProduct._id.toString(),
          quantity: 1
        });

      const res = await request(app)
        .get(`/api/customers/${customer._id}/transactions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.transactions).toHaveLength(2);
      expect(res.body.data.summary.totalTransactions).toBe(2);
      expect(res.body.data.summary.totalSpent).toBe(180); // (2*60) + (1*60) = 180
    });
  });
});
