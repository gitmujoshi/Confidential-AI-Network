module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup.js',
    '<rootDir>/tests/integration/role-crud.setup.js',
  ],
  testMatch: ['<rootDir>/tests/integration/role-crud.integration.test.js'],
  verbose: true,
  testTimeout: 90000,
  forceExit: true,
  detectOpenHandles: true,
};
