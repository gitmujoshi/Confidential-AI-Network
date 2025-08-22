// Unit Test Setup - Uses mocks for all external services
const { setTestEnv } = require('../../../tests/test-env');

// Load test environment variables
require('dotenv').config({ path: './config.test.env' });

// Force unit tests to use mock mode
process.env.TEST_MODE = 'mock';
setTestEnv('mock');

// Import centralized test utilities
const testUtils = require('../utils');

// Global test utilities
global.testUtils = testUtils;

// Global test tracking for unit tests
global.testTracker = {
  createdKeycloakUsers: [],
  createdDatabaseUsers: [],
  testMode: 'mock',
  ***REMOVED-KEYCLOAK_DB_PASSWORD***Service: null,
  scittCcfService: null
};

// Always enable mocks for unit tests
require('../mocks').setupMocks();
console.log('✅ Mocks enabled for unit tests');

// Global test setup for unit tests
beforeAll(async () => {
  console.log('✅ Running unit tests with mocks - no external services required');
});

// Global test teardown for unit tests
afterAll(async () => {
  // Clear mock registry instances
  try {
    const MockRegistry = require('../mocks/registry');
    MockRegistry.instances.clear();
    console.log('✅ Mock registry cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up mock registry:', error.message);
  }
});
