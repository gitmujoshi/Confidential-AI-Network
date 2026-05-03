module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/keyManagementService.test.js',
    '<rootDir>/tests/unit/can-*.test.js',
    '<rootDir>/tests/unit/blockchainService.constructor.test.js',
    '<rootDir>/tests/unit/blockchainService.simple.test.js',
    '<rootDir>/tests/unit/simple-ai-model.test.js',
    '<rootDir>/tests/unit/tdc-training-helpers.test.js',
    '<rootDir>/tests/unit/contract-training-inputs.service.test.js'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true
};
