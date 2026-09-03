const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AuthService = require('../src/services/auth.service');
const { ROLES } = require('../src/config/constants');
const path = require('path');
const fs = require('fs');

describe('File Upload and System Configuration Tests', () => {
  let superAdminToken;

  beforeEach(async () => {
    const superAdmin = await User.create({
      name: 'Super Admin Test',
      email: 'superadmin_test@milky.com',
      password: 'password123',
      role: ROLES.SUPER_ADMIN
    });
    superAdminToken = AuthService.generateToken(superAdmin);
  });

  describe('POST /api/upload', () => {
    it('should upload a file via multipart form-data and return accessible S3 or storage URL', async () => {
      // Create a temporary test image buffer
      const testBuffer = Buffer.from('fake-image-content-png');

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('file', testBuffer, 'test_image.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Validates AWS S3 URL or local storage URL
      expect(res.body.data.url).toMatch(/^(https:\/\/[a-z0-9.-]+\.amazonaws\.com\/uploads\/.+\.png|\/uploads\/.+\.png)$/);
      expect(['s3', 'local']).toContain(res.body.data.storage);
    });

    it('should accept base64 image payload as fallback and upload to S3', async () => {
      const base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ base64: base64Data });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/^(https:\/\/[a-z0-9.-]+\.amazonaws\.com\/uploads\/.+\.png|\/uploads\/.+\.png)$/);
      expect(['s3', 'local']).toContain(res.body.data.storage);
    });
  });

  describe('GET & PUT /api/system-config', () => {
    it('should return default system config', async () => {
      const res = await request(app)
        .get('/api/system-config')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.config).toHaveProperty('orgName');
      expect(res.body.data.config.categories).toBeDefined();
    });

    it('should allow Super Admin to update orgName, orgLogo, tagline, phone, address, and categories', async () => {
      const res = await request(app)
        .put('/api/system-config')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          orgName: 'Amrit Dairy Farm',
          orgLogo: '/uploads/logo.png',
          tagline: 'Fresh Farm Goodness Every Dawn',
          phone: '+91 99999 88888',
          address: 'Plot 42, Dairy Zone, Anand',
          categories: ['Cow Milk', 'Buffalo Milk', 'Ghee', 'Paneer']
        });

      expect(res.status).toBe(200);
      expect(res.body.data.config.orgName).toBe('Amrit Dairy Farm');
      expect(res.body.data.config.tagline).toBe('Fresh Farm Goodness Every Dawn');
      expect(res.body.data.config.categories).toContain('Cow Milk');
    });
  });
});
