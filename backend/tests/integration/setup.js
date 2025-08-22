// Integration Test Setup - Uses real services, NO mocks
const { setTestEnv } = require('../../../tests/test-env');

// Load test environment variables
require('dotenv').config({ path: './config.test.env' });

// Force integration tests to use real services
process.env.TEST_MODE = 'integration';
setTestEnv('integration');

// Import centralized test utilities
const testUtils = require('../utils');

// Global test utilities
global.testUtils = testUtils;

// Global test tracking for integration tests
global.testTracker = {
  createdKeycloakUsers: [],
  createdDatabaseUsers: [],
  testMode: 'integration',
  ***REMOVED-KEYCLOAK_DB_PASSWORD***Service: null,
  scittCcfService: null
};

// NO MOCKS for integration tests
console.log('✅ Running integration tests without mocks - using real services');

// Global test setup for integration tests
beforeAll(async () => {
  // Connect to real database for integration tests
  try {
    const { sequelize } = require('../../models');
    await sequelize.authenticate();
    console.log('✅ Database connection established for integration tests');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }

  // Initialize real Keycloak service for integration tests
  try {
    const KeycloakService = require('../../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
    global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
    await global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getAdminToken();
    console.log('✅ Keycloak service initialized for integration tests');
  } catch (error) {
    console.warn('⚠️ Keycloak service not available, some tests may fail');
    // Don't throw error, let tests handle Keycloak unavailability
  }

  // Initialize SCITT CCF service for integration tests
  try {
    const ScittCcfService = require('../../services/scittCcfService');
    global.testTracker.scittCcfService = new ScittCcfService();
    await global.testTracker.scittCcfService.initialize();
    console.log('✅ SCITT CCF service initialized for integration tests');
  } catch (error) {
    console.warn('⚠️ SCITT CCF service not available, some tests may be skipped');
  }
});

// Global test teardown for integration tests
afterAll(async () => {
  // Clean up Keycloak test users
  if (global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service) {
    try {
      console.log('🧹 Cleaning up Keycloak test users...');
      for (const userId of global.testTracker.createdKeycloakUsers) {
        try {
          await global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service.deleteUser(userId);
          console.log(`✅ Deleted Keycloak user: ${userId}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete Keycloak user ${userId}:`, error.message);
        }
      }
      console.log('✅ Keycloak cleanup completed');
    } catch (error) {
      console.error('❌ Keycloak cleanup failed:', error.message);
    }
  }

  // Close database connection
  try {
    const { sequelize } = require('../../models');
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
});
