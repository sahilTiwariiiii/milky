const env = require('../src/config/env');

describe('AWS S3 config', () => {
  it('should load AWS S3 variables from environment', () => {
    expect(env).toHaveProperty('AWS_ACCESS_KEY_ID');
    expect(env).toHaveProperty('AWS_SECRET_ACCESS_KEY');
    expect(env).toHaveProperty('AWS_REGION');
    expect(env).toHaveProperty('S3_BUCKET_NAME');
  });
});
