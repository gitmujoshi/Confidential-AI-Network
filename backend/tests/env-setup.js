// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt-signing';
process.env.DATABASE_URL = 'postgresql://mukeshjoshi@localhost:5432/contract_management_test';
process.env.KEYCLOAK_URL = 'http://localhost:8080';
process.env.KEYCLOAK_ADMIN = 'admin';
process.env.KEYCLOAK_ADMIN_PASSWORD = 'admin123';
process.env.BLOCKCHAIN_RPC_URL = 'http://localhost:8545';
process.env.CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.BLOCKCHAIN_ENABLED = 'false';

// Suppress console logs during tests unless verbose
if (!process.env.VERBOSE) {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
} 