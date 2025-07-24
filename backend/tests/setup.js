// Test setup file for Jest
const { sequelize } = require('../models');
const KeycloakService = require('../services/keycloakService');
const { setTestEnv } = require('../../tests/test-env');
setTestEnv(process.env.TEST_MODE || 'mock');

// Centralized mock setup
if ((process.env.TEST_MODE || 'mock') === 'mock') {
  require('./mocks').setupMocks();
}

// Import centralized test utilities
const testUtils = require('./utils');

// Global test utilities
global.testUtils = testUtils;

// Global test tracking
global.testTracker = {
  createdKeycloakUsers: [],
  createdDatabaseUsers: [],
  testMode: process.env.TEST_MODE || 'mock', // 'mock' or 'integration'
  keycloakService: null
};

// Global test setup
beforeAll(async () => {
  // Ensure database connection
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established for tests');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }

  // Initialize Keycloak service for integration tests
  if (global.testTracker.testMode === 'integration') {
    try {
      global.testTracker.keycloakService = new KeycloakService();
      await global.testTracker.keycloakService.getAdminToken();
      console.log('✅ Keycloak service initialized for integration tests');
    } catch (error) {
      console.warn('⚠️ Keycloak service not available, falling back to mock mode');
      global.testTracker.testMode = 'mock';
    }
  }
});

// Global test teardown
afterAll(async () => {
  // Clean up Keycloak test users
  if (global.testTracker.testMode === 'integration' && global.testTracker.keycloakService) {
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
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
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
    const keycloakIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = keycloakIdRegex.test(received);
    
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