module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  /** Default CI/local: CAN JCS path only (needs fewer tables). Run legacy suites via npm run test:integration:contracts */
  testMatch: [
    '<rootDir>/tests/integration/can-jcs.integration.test.js',
    '<rootDir>/tests/integration/huggingface.integration.test.js',
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 60000, // Longer timeout for integration tests
  forceExit: true,
  detectOpenHandles: true
};
