module.exports = async function globalTeardown() {
  if (global.__MONGOD__) {
    console.log('\n[Jest Global Teardown] Stopping MongoMemoryServer...');
    await global.__MONGOD__.stop();
  }
};
