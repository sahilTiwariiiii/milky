const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Product = require('../src/models/Product');
const { ROLES, PRODUCT_UNITS } = require('../src/config/constants');
const AuthService = require('../src/services/auth.service');

describe('Strict Admin Isolation & Authorization Tests', () => {
  let superAdminToken;
  let adminAToken;
  let adminBToken;
  let adminA;
  let adminB;
  let customerA;
  let customerB;
  let milkProduct;

  beforeEach(async () => {
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'super@test.com',
      password: 'Password123',
      role: ROLES.SUPER_ADMIN
    });

    adminA = await User.create({
      name: 'Admin A',
      email: 'admina@test.com',
      password: 'Password123',
      role: ROLES.ADMIN
    });

    adminB = await User.create({
      name: 'Admin B',
      email: 'adminb@test.com',
      password: 'Password123',
      role: ROLES.ADMIN
    });

    superAdminToken = AuthService.generateToken(superAdmin);
    adminAToken = AuthService.generateToken(adminA);
    adminBToken = AuthService.generateToken(adminB);

    // Create Customer A (assigned to Admin A)
    customerA = await Customer.create({
      name: 'Customer of Admin A',
      mobile: '9111111111',
      adminId: adminA._id,
      qrToken: 'CUST_AAA11111',
      qrCode: 'data:image/png;base64,sampleA'
    });

    // Create Customer B (assigned to Admin B)
    customerB = await Customer.create({
      name: 'Customer of Admin B',
      mobile: '9222222222',
      adminId: adminB._id,
      qrToken: 'CUST_BBB22222',
      qrCode: 'data:image/png;base64,sampleB'
    });

    milkProduct = await Product.create({
      name: 'Cow Milk',
      category: 'Dairy',
      unit: PRODUCT_UNITS.LITRE,
      price: 60
    });
  });

  describe('QR Scanning Isolation', () => {
    it('should allow Admin A to scan Customer A QR code', async () => {
      const res = await request(app)
        .get(`/api/customers/qr/${customerA.qrToken}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.name).toBe('Customer of Admin A');
    });

    it('should FORBID Admin A from scanning Customer B QR code (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/customers/qr/${customerB.qrToken}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized|access denied/i);
    });

    it('should allow Super Admin to scan any customer QR code', async () => {
      const resA = await request(app)
        .get(`/api/customers/qr/${customerA.qrToken}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      const resB = await request(app)
        .get(`/api/customers/qr/${customerB.qrToken}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
    });
  });

  describe('Customer Data Access Isolation', () => {
    it('should FORBID Admin A from viewing Customer B profile by ID', async () => {
      const res = await request(app)
        .get(`/api/customers/${customerB._id}`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(403);
    });

    it('should only return Admin A customers when Admin A lists customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.customers).toHaveLength(1);
      expect(res.body.data.customers[0]._id.toString()).toBe(customerA._id.toString());
    });

    it('should return all customers when Super Admin lists customers', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.customers).toHaveLength(2);
    });
  });

  describe('Transaction Isolation', () => {
    it('should FORBID Admin A from recording transaction for Customer B', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          customerId: customerB._id.toString(),
          productId: milkProduct._id.toString(),
          quantity: 2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should FORBID Admin A from viewing Customer B transaction history', async () => {
      const res = await request(app)
        .get(`/api/customers/${customerB._id}/transactions`)
        .set('Authorization', `Bearer ${adminAToken}`);

      expect(res.status).toBe(403);
    });
  });
});
