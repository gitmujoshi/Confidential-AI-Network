// Integration Test Setup - Uses real services, NO mocks
const { setTestEnv } = require('../../../tests/test-env');

// Load test environment variables (same Postgres as dev; separate DB_NAME)
require('dotenv').config({ path: './config.test.env' });
// Optional DB_PASSWORD and other secrets shared with dev (dotenv does not override existing keys)
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', 'secrets.env') });

// Force integration tests to use real services
process.env.TEST_MODE = 'integration';
setTestEnv('integration');

// Integration tests should not require an external SCITT CCF node by default.
// Individual tests can opt-in by setting SCITT_CCF_ENABLED=true within the test.
process.env.SCITT_CCF_ENABLED = 'false';

// Import centralized test utilities
const testUtils = require('../utils');

// Global test utilities
global.testUtils = testUtils;

// Global test tracking for integration tests
global.testTracker = {
  createdKeycloakUsers: [],
  createdDatabaseUsers: [],
  testMode: 'integration',
  keycloakService: null,
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

    // Idempotent schema fixes for integration runs (mirrors migration 20260501120000)
    const contractColumnSql = [
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdp_id INTEGER',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS primary_tdp_id INTEGER',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS dataset_id INTEGER',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS primary_dataset_id INTEGER',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdp_signed BOOLEAN DEFAULT false',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdp_signed_at TIMESTAMP WITH TIME ZONE',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdc_signed BOOLEAN DEFAULT false',
      'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tdc_signed_at TIMESTAMP WITH TIME ZONE',
    ];
    for (const sql of contractColumnSql) {
      try {
        await sequelize.query(sql);
      } catch (e) {
        if (!String(e.message || '').includes('does not exist')) {
          console.warn(`⚠️ Contract schema bootstrap skipped (${sql}): ${e.message}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }

  // Initialize real Keycloak service for integration tests
  try {
    const KeycloakService = require('../../services/keycloakService');
    global.testTracker.keycloakService = new KeycloakService();
    await global.testTracker.keycloakService.getAdminToken();
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
  if (global.testTracker.keycloakService) {
    try {
      console.log('🧹 Cleaning up Keycloak test users...');
      for (const userId of global.testTracker.createdKeycloakUsers) {
        try {
          await global.testTracker.keycloakService.deleteUser(userId);
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
