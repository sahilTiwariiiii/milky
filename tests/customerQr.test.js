const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const { ROLES } = require('../src/config/constants');
const AuthService = require('../src/services/auth.service');

describe('Customer & QR Code Management Tests', () => {
  let superAdminToken;
  let adminToken;
  let admin;

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
  });

  describe('POST /api/customers', () => {
    it('should create customer and auto-generate QR token and base64 QR code image', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Rahul Kumar',
          mobile: '9876500001',
          address: 'Block A, Sector 1',
          adminId: admin._id.toString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer).toHaveProperty('qrToken');
      expect(res.body.data.customer.qrToken).toMatch(/^CUST_/);
      expect(res.body.data.customer).toHaveProperty('qrCode');
      expect(res.body.data.customer.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(res.body.data.customer.name).toBe('Rahul Kumar');
    });
  });

  describe('GET /api/customers/qr/:qrToken', () => {
    it('should return customer profile when scanning valid QR token', async () => {
      // Create a customer
      const createRes = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Sunita Roy',
          mobile: '9876500002',
          adminId: admin._id.toString()
        });

      const qrToken = createRes.body.data.customer.qrToken;

      const scanRes = await request(app)
        .get(`/api/customers/qr/${qrToken}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(scanRes.status).toBe(200);
      expect(scanRes.body.success).toBe(true);
      expect(scanRes.body.data.customer.name).toBe('Sunita Roy');
      expect(scanRes.body.data.customer.qrToken).toBe(qrToken);
    });

    it('should return 404 for non-existent QR token', async () => {
      const res = await request(app)
        .get('/api/customers/qr/CUST_NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/customers/:id/regenerate-qr', () => {
    it('should regenerate new QR token and QR code for customer', async () => {
      const customer = await Customer.create({
        name: 'Old QR Customer',
        mobile: '9876500003',
        adminId: admin._id,
        qrToken: 'CUST_OLDTOKEN1',
        qrCode: 'data:image/png;base64,oldcode'
      });

      const res = await request(app)
        .post(`/api/customers/${customer._id}/regenerate-qr`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.qrToken).not.toBe('CUST_OLDTOKEN1');
      expect(res.body.data.customer.qrToken).toMatch(/^CUST_/);
      expect(res.body.data.customer.qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });
});
