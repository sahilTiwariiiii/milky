const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { ROLES, PRODUCT_UNITS } = require('../src/config/constants');
const AuthService = require('../src/services/auth.service');

describe('Product Module Tests', () => {
  let superAdminToken;
  let adminToken;

  beforeEach(async () => {
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'super@test.com',
      password: 'Password123',
      role: ROLES.SUPER_ADMIN
    });

    const admin = await User.create({
      name: 'Admin One',
      email: 'admin1@test.com',
      password: 'Password123',
      role: ROLES.ADMIN
    });

    superAdminToken = AuthService.generateToken(superAdmin);
    adminToken = AuthService.generateToken(admin);
  });

  describe('POST /api/products', () => {
    it('should allow Super Admin to create new product with price and unit', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Fresh Paneer',
          category: 'Dairy',
          unit: PRODUCT_UNITS.KG,
          price: 400
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('Fresh Paneer');
      expect(res.body.data.product.price).toBe(400);
      expect(res.body.data.product.unit).toBe(PRODUCT_UNITS.KG);
    });

    it('should FORBID Admin from creating products', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Fresh Dahi',
          unit: PRODUCT_UNITS.KG,
          price: 100
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should allow Super Admin to update product price', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Cow Milk',
          unit: PRODUCT_UNITS.LITRE,
          price: 60
        });

      const productId = createRes.body.data.product._id;

      const updateRes = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          price: 65
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.product.price).toBe(65);
    });
  });
});
