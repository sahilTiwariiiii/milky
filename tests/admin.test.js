const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const { ROLES } = require('../src/config/constants');
const AuthService = require('../src/services/auth.service');

describe('Admin Management API Tests', () => {
  let superAdminToken;
  let adminToken;
  let superAdmin;
  let adminA;

  beforeEach(async () => {
    superAdmin = await User.create({
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

    superAdminToken = AuthService.generateToken(superAdmin);
    adminToken = AuthService.generateToken(adminA);
  });

  describe('POST /api/admins', () => {
    it('should allow Super Admin to create a new Admin', async () => {
      const res = await request(app)
        .post('/api/admins')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'New Admin',
          email: 'newadmin@test.com',
          password: 'Password123',
          mobile: '9876543210'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe('newadmin@test.com');
      expect(res.body.data.admin.role).toBe(ROLES.ADMIN);
    });

    it('should forbid regular Admin from creating other Admins', async () => {
      const res = await request(app)
        .post('/api/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hacker Admin',
          email: 'hacker@test.com',
          password: 'Password123'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/admins', () => {
    it('should list all admins with assignedCustomerCount for Super Admin', async () => {
      // Create a customer assigned to adminA
      await Customer.create({
        name: 'Test Customer',
        mobile: '9898989898',
        adminId: adminA._id,
        qrToken: 'CUST_TEST01',
        qrCode: 'data:image/png;base64,sample'
      });

      const res = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admins).toHaveLength(1);
      expect(res.body.data.admins[0].assignedCustomerCount).toBe(1);
    });

    it('should forbid regular Admin from listing Admins', async () => {
      const res = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/admins/:id', () => {
    it('should block deletion of Admin if customers are currently assigned', async () => {
      await Customer.create({
        name: 'Dependent Customer',
        mobile: '9898989899',
        adminId: adminA._id,
        qrToken: 'CUST_TEST02',
        qrCode: 'data:image/png;base64,sample'
      });

      const res = await request(app)
        .delete(`/api/admins/${adminA._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/active customer/i);
    });

    it('should allow deletion of Admin with zero assigned customers', async () => {
      const emptyAdmin = await User.create({
        name: 'Empty Admin',
        email: 'empty@test.com',
        password: 'Password123',
        role: ROLES.ADMIN
      });

      const res = await request(app)
        .delete(`/api/admins/${emptyAdmin._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
