// Test setup file for Jest
const { sequelize } = require('../models');
const KeycloakService = require('../services/keycloakService');

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

// Mock external services for mock tests
if (global.testTracker.testMode === 'mock') {
  jest.mock('../services/didService', () => ({
    resolveDID: jest.fn().mockResolvedValue({
      id: 'did:web:github.com:testuser',
      verificationMethod: [{
        id: 'did:web:github.com:testuser#owner',
        type: 'JsonWebKey2020',
        publicKeyJwk: {
          kty: 'EC',
          crv: 'secp256k1',
          x: 'mock-x-coordinate',
          y: 'mock-y-coordinate'
        }
      }]
    }),
    extractPublicKey: jest.fn().mockResolvedValue({
      kty: 'EC',
      crv: 'secp256k1',
      x: 'mock-x-coordinate',
      y: 'mock-y-coordinate'
    })
  }));

  // Mock Keycloak service for mock tests
  jest.mock('../services/keycloakService', () => ({
    createUser: jest.fn().mockResolvedValue({
      keycloakUserId: 'mock-keycloak-user-id',
      temporaryPassword: 'mock-temp-password'
    }),
    updateUser: jest.fn().mockResolvedValue({
      success: true,
      message: 'User updated successfully'
    }),
    deleteUser: jest.fn().mockResolvedValue({
      success: true,
      message: 'User deleted successfully'
    }),
    authenticateUser: jest.fn().mockResolvedValue({
      success: true,
      token: 'mock-access-token',
      userInfo: {
        sub: 'mock-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }
    }),
    validateToken: jest.fn().mockResolvedValue({
      valid: true,
      payload: {
        sub: 'mock-user-id',
        email: 'test@example.com',
        realm_access: { roles: ['TDP'] }
      }
    }),
    assignRole: jest.fn().mockResolvedValue({
      success: true,
      message: 'Role assigned successfully'
    }),
    getUserRoles: jest.fn().mockResolvedValue(['TDP', 'USER'])
  }));

  // Mock axios for external API calls
  jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }));

  // Mock bcrypt
  jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true)
  }));

  // Mock jsonwebtoken
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ userId: 'mock-user-id', role: 'TDP' })
  }));
}

// Global test utilities
global.testUtils = {
  // Create test user with tracking
  createTestUser: async (userData = {}) => {
    const { User } = require('../models');
    const bcrypt = require('bcryptjs');
    
    const defaultData = {
      email: `test${Date.now()}@example.com`,
      name: `Test User ${Date.now()}`,
      partyType: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:testuser',
      didVerified: true
    };
    
    const user = await User.create({ ...defaultData, ...userData });
    global.testTracker.createdDatabaseUsers.push(user.id);
    return user;
  },
  
  // Create test contract
  createTestContract: async (contractData = {}) => {
    const { Contract } = require('../models');
    
    const defaultData = {
      title: 'Test Contract',
      description: 'Test contract description',
      status: 'DRAFT',
      tdpId: (await global.testUtils.createTestUser()).id,
      tdcId: (await global.testUtils.createTestUser()).id,
      ccrpId: (await global.testUtils.createTestUser()).id
    };
    
    return await Contract.create({ ...defaultData, ...contractData });
  },
  
  // Create test dataset
  createTestDataset: async (datasetData = {}) => {
    const { Dataset } = require('../models');
    
    const defaultData = {
      name: 'Test Dataset',
      description: 'Test dataset description',
      ownerId: (await global.testUtils.createTestUser()).id,
      status: 'ACTIVE'
    };
    
    return await Dataset.create({ ...defaultData, ...datasetData });
  },
  
  // Create Keycloak user with tracking
  createKeycloakUser: async (userData = {}) => {
    if (global.testTracker.testMode === 'mock') {
      // Return mock data for mock tests
      return {
        keycloakUserId: 'mock-keycloak-user-id',
        temporaryPassword: 'mock-temp-password'
      };
    }

    if (!global.testTracker.keycloakService) {
      throw new Error('Keycloak service not available');
    }

    const defaultData = {
      email: `keycloak-test${Date.now()}@example.com`,
      name: `Keycloak Test User ${Date.now()}`,
      partyType: 'TDP',
      walletAddress: null,
      publicKey: null,
      organization: 'Test Organization',
      phoneNumber: '',
      website: '',
      location: ''
    };

    const result = await global.testTracker.keycloakService.createUser({
      ...defaultData,
      ...userData
    });

    if (result.keycloakUserId) {
      global.testTracker.createdKeycloakUsers.push(result.keycloakUserId);
    }

    return result;
  },
  
  // Generate auth token
  generateAuthToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: user.id, role: user.partyType },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Clean up database test data
  cleanupDatabaseData: async () => {
    const { User, Contract, Dataset, Notification, AIModel } = require('../models');
    
    await Notification.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await AIModel.destroy({ where: {} });
    await User.destroy({ where: {} });
    
    // Clear tracking
    global.testTracker.createdDatabaseUsers = [];
  },
  
  // Clean up Keycloak test data
  cleanupKeycloakData: async () => {
    if (global.testTracker.testMode === 'mock') {
      return; // No cleanup needed for mock tests
    }

    if (!global.testTracker.keycloakService) {
      return;
    }

    for (const userId of global.testTracker.createdKeycloakUsers) {
      try {
        await global.testTracker.keycloakService.deleteUser(userId);
      } catch (error) {
        console.warn(`Failed to delete Keycloak user ${userId}:`, error.message);
      }
    }
    
    global.testTracker.createdKeycloakUsers = [];
  },
  
  // Comprehensive cleanup
  cleanupAllTestData: async () => {
    await global.testUtils.cleanupDatabaseData();
    await global.testUtils.cleanupKeycloakData();
  },
  
  // Get test mode
  getTestMode: () => global.testTracker.testMode,
  
  // Check if integration tests are available
  isIntegrationMode: () => global.testTracker.testMode === 'integration',
  
  // Get Keycloak service
  getKeycloakService: () => global.testTracker.keycloakService
};

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