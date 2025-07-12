// Test setup file for Jest
const { sequelize } = require('../models');

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
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
});

// Mock external services
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

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const { User } = require('../models');
    const bcrypt = require('bcryptjs');
    
    const defaultData = {
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: await bcrypt.hash('Password123', 10),
      role: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:testuser',
      didVerified: true
    };
    
    return await User.create({ ...defaultData, ...userData });
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
  
  // Generate auth token
  generateAuthToken: (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Clean up test data
  cleanupTestData: async () => {
    const { User, Contract, Dataset, Notification } = require('../models');
    
    await Notification.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await User.destroy({ where: {} });
  }
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
  }
}); 