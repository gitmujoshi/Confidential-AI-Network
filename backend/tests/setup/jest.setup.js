/**
 * Jest Setup for Contract Signing Tests
 * 
 * Global setup and configuration for all contract signing tests.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/contract_management_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CCF_NODE_URL = 'http://localhost:8000';
process.env.CCF_API_KEY = 'test-api-key';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  generateTestHash: (data) => {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  },
  
  generateTestSignature: () => {
    const signature = [];
    for (let i = 0; i < 64; i++) {
      signature.push(Math.floor(Math.random() * 256));
    }
    return signature;
  },
  
  generateAuthToken: (user) => {
    return `mock-token-${user.id}`;
  },
  
  createTestUser: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    name: 'Test User',
    email: 'test@example.com',
    partyType: 'TDC',
    depaId: 'TEST_TDC_001',
    isActive: true,
    firstLogin: false,
    ...overrides
  }),
  
  createTestContract: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    contractId: 'TEST_CONTRACT_001',
    name: 'Test Contract',
    description: 'Test contract description',
    tdcId: 1,
    ccrpId: 2,
    status: 'PENDING_SIGNATURES',
    contractData: {
      price: 1000,
      duration: 30,
      terms: 'Test terms'
    },
    isActive: true,
    ...overrides
  }),
  
  createTestKey: (overrides = {}) => ({
    id: Math.floor(Math.random() * 1000),
    userId: 1,
    keyId: 'TEST_KEY_001',
    keyType: 'ECDSA-P256',
    publicKey: '-----BEGIN PUBLIC KEY-----\ntest-public-key\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----',
    keyStatus: 'active',
    ...overrides
  })
};

// Mock external services
jest.mock('../../services/scittCcfService', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  submitClaim: jest.fn().mockResolvedValue({
    claimId: 'MOCK_CLAIM_001',
    receipt: 'MOCK_RECEIPT_001',
    status: 'SUBMITTED'
  }),
  getClaim: jest.fn().mockResolvedValue({
    claimId: 'MOCK_CLAIM_001',
    status: 'verified'
  }),
  getHealthStatus: jest.fn().mockResolvedValue({
    isHealthy: true,
    responseTime: 100
  })
}));

// Mock key management service for some tests
jest.mock('../../services/keyManagementService', () => ({
  generateKeyPair: jest.fn().mockImplementation(async ({ algorithm, userId }) => ({
    keyId: `MOCK_KEY_${Date.now()}`,
    userId,
    keyType: algorithm,
    publicKey: '-----BEGIN PUBLIC KEY-----\nmock-public-key\n-----END PUBLIC KEY-----',
    privateKey: '-----BEGIN PRIVATE KEY-----\nmock-private-key\n-----END PRIVATE KEY-----',
    keyStatus: 'active',
    createdAt: new Date()
  })),
  generateSignature: jest.fn().mockImplementation(async (data, privateKey, algorithm) => ({
    signature: global.testUtils.generateTestSignature(),
    algorithm: 'ECDSA',
    timestamp: Date.now()
  })),
  verifySignature: jest.fn().mockResolvedValue(true),
  encryptPrivateKey: jest.fn().mockImplementation((privateKey, password) => ({
    encrypted: Buffer.from(privateKey).toString('base64'),
    iv: Buffer.from('mock-iv').toString('base64'),
    authTag: Buffer.from('mock-auth-tag').toString('base64'),
    algorithm: 'aes-256-gcm'
  })),
  decryptPrivateKey: jest.fn().mockImplementation((encrypted, password) => {
    return Buffer.from(encrypted.encrypted, 'base64').toString();
  }),
  validateKeyData: jest.fn().mockReturnValue(true),
  getSupportedAlgorithms: jest.fn().mockReturnValue(['ECDSA-P256', 'RSA-2048', 'RSA-4096']),
  getAlgorithmInfo: jest.fn().mockImplementation((algorithm) => {
    const info = {
      'ECDSA-P256': { name: 'ECDSA', namedCurve: 'P-256' },
      'RSA-2048': { name: 'RSA', modulusLength: 2048 },
      'RSA-4096': { name: 'RSA', modulusLength: 4096 }
    };
    return info[algorithm] || { name: algorithm };
  }),
  getAlgorithmDescription: jest.fn().mockReturnValue('Mock algorithm description')
}));

// Global test hooks
beforeAll(async () => {
  // Setup test database if needed
  try {
    const { sequelize } = require('../../models');
    await sequelize.authenticate();
  } catch (error) {
    console.warn('Database connection failed, tests will use mocks');
  }
});

afterAll(async () => {
  // Cleanup after all tests
  try {
    const { sequelize } = require('../../models');
    await sequelize.close();
  } catch (error) {
    // Ignore cleanup errors
  }
});

// Restore console after each test
afterEach(() => {
  global.console = originalConsole;
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
