const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { ROLES, USER_STATUS } = require('../src/config/constants');

describe('Auth Module API Tests', () => {
  beforeEach(async () => {
    // Seed a Super Admin and an Admin
    await User.create([
      {
        name: 'Super Admin',
        email: 'super@test.com',
        password: 'Password123',
        role: ROLES.SUPER_ADMIN,
        status: USER_STATUS.ACTIVE
      },
      {
        name: 'Admin One',
        email: 'admin1@test.com',
        password: 'Password123',
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE
      },
      {
        name: 'Inactive Admin',
        email: 'inactive@test.com',
        password: 'Password123',
        role: ROLES.ADMIN,
        status: USER_STATUS.INACTIVE
      }
    ]);
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login Super Admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'super@test.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('super@test.com');
      expect(res.body.data.user.role).toBe(ROLES.SUPER_ADMIN);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should successfully login Admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin1@test.com',
          password: 'Password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(ROLES.ADMIN);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin1@test.com',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should reject login for inactive user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'Password123'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive/i);
    });

    it('should validate missing email or password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'super@test.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get authenticated profile with valid token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin1@test.com',
          password: 'Password123'
        });

      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.email).toBe('admin1@test.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
