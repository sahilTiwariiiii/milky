const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  console.log('\n[Jest Global Setup] Starting MongoMemoryServer...');
  const instance = await MongoMemoryServer.create({
    binary: {
      version: '7.0.14'
    }
  });
  const uri = instance.getUri();
  global.__MONGOD__ = instance;
  process.env.TEST_MONGO_URI = uri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_antigravity_987654321';
  process.env.JWT_EXPIRES_IN = '1d';
  console.log(`[Jest Global Setup] MongoMemoryServer ready at: ${uri}`);
};
