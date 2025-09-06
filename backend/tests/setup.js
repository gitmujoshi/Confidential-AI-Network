// Test setup file for Jest
const { setTestEnv } = require('../../tests/test-env');

// Load test environment variables
require('dotenv').config({ path: './config.test.env' });

// Set test mode based on environment variable, default to integration for actual integration tests
const TEST_MODE = process.env.TEST_MODE || 'integration';
setTestEnv(TEST_MODE);

// Import centralized test utilities
const testUtils = require('./utils');

// Global test utilities
global.testUtils = testUtils;

// Global test tracking
global.testTracker = {
  createdKeycloakUsers: [],
  createdDatabaseUsers: [],
  testMode: process.env.TEST_MODE || 'mock', // 'mock' or 'integration'
  ***REMOVED-KEYCLOAK_DB_PASSWORD***Service: null,
  scittCcfService: null
};

// Centralized mock setup - only use mocks in mock mode
if (global.testTracker.testMode === 'mock') {
  require('./mocks').setupMocks();
  console.log('✅ Mocks enabled for mock test mode');
} else {
  console.log('✅ Running integration tests without mocks');
}

// Global test setup
beforeAll(async () => {
  // Only connect to database for integration tests
  if (global.testTracker.testMode === 'integration') {
    try {
      const { sequelize } = require('../models');
      await sequelize.authenticate();
      console.log('✅ Database connection established for integration tests');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

    // Initialize Keycloak service for integration tests
    try {
      const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
      global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
      await global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getAdminToken();
      console.log('✅ Keycloak service initialized for integration tests');
    } catch (error) {
      console.warn('⚠️ Keycloak service not available, falling back to mock mode');
      global.testTracker.testMode = 'mock';
    }

    // Initialize SCITT CCF service for integration tests
    try {
      const ScittCcfService = require('../services/scittCcfService');
      global.testTracker.scittCcfService = new ScittCcfService();
      await global.testTracker.scittCcfService.initialize();
      console.log('✅ SCITT CCF service initialized for integration tests');
    } catch (error) {
      console.warn('⚠️ SCITT CCF service not available, some tests may be skipped');
    }
  } else {
    console.log('✅ Running in mock mode - no external services required');
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up Keycloak test users
  if (global.testTracker.testMode === 'integration' && global.testTracker.***REMOVED-KEYCLOAK_DB_PASSWORD***Service) {
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

  // Close database connection only if it was established
  if (global.testTracker.testMode === 'integration') {
    try {
      const { sequelize } = require('../models');
      await sequelize.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
    }
  }

  // Clear mock registry instances
  try {
    const MockRegistry = require('./mocks/registry');
    MockRegistry.clearInstances();
    MockRegistry.resetMocks();
    console.log('✅ Mock registry cleaned up');
  } catch (error) {
    console.warn('⚠️ Mock registry cleanup failed:', error.message);
  }
});

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false
      };
    }
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false
      };
    }
  },
  
  toBeValidKeycloakUserId(received) {
    const ***REMOVED-KEYCLOAK_DB_PASSWORD***IdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = ***REMOVED-KEYCLOAK_DB_PASSWORD***IdRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Keycloak user ID`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Keycloak user ID`,
        pass: false
      };
    }
  }
}); 