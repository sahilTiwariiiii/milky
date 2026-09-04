const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const { ROLES, USER_STATUS } = require('../src/config/constants');

describe('Customer feature API', () => {
  let adminToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await Customer.deleteMany({});

    const admin = await User.create({
      name: 'Admin One',
      email: 'admin1@test.com',
      password: 'Password123',
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin1@test.com', password: 'Password123' });

    adminToken = loginRes.body.data.token;
    expect(adminToken).toBeTruthy();
    expect(admin._id).toBeTruthy();
  });

  it('should create customer with aadhaar/pan/image and return pagination meta', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Amit Sharma',
        mobile: '9876543210',
        address: 'West Delhi',
        adharNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        image: 'https://cdn.example.com/avatar.png'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer.adharNumber).toBe('123456789012');
    expect(res.body.data.customer.panNumber).toBe('ABCDE1234F');
    expect(res.body.data.customer.image).toBe('https://cdn.example.com/avatar.png');

    const listRes = await request(app)
      .get('/api/customers?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.meta).toHaveProperty('totalItems');
    expect(listRes.body.meta.page).toBe(1);
  });
});
