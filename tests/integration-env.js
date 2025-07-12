// Integration test environment configuration
// This file configures environment variables for integration tests with real services

const integrationEnv = {
  // Database configuration for integration tests
  DATABASE_URL: '***REMOVED-DB_PASSWORD***ql://testuser:testpass@localhost:5433/contract_management_test',
  
  // Keycloak configuration for integration tests
  KEYCLOAK_URL: 'http://localhost:8081',
  KEYCLOAK_ADMIN: 'admin',
  KEYCLOAK_ADMIN_PASSWORD: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
  KEYCLOAK_REALM: 'contract-management-test',
  KEYCLOAK_CLIENT_ID: 'backend-test',
  KEYCLOAK_CLIENT_SECRET: 'test-client-secret',
  
  // Blockchain configuration for integration tests
  // You can choose between Ganache (8546) or Hardhat (8547)
  BLOCKCHAIN_URL: 'http://localhost:8546', // Ganache
  // BLOCKCHAIN_URL: 'http://localhost:8547', // Hardhat
  BLOCKCHAIN_ENABLED: 'true',
  
  // JWT configuration
  JWT_SECRET: 'integration-test-secret-key-for-jwt-signing',
  
  // Test configuration
  NODE_ENV: 'test',
  TEST_TIMEOUT: '30000',
  
  // Service URLs
  BACKEND_URL: 'http://localhost:5001',
  FRONTEND_URL: 'http://localhost:3000',
  
  // Test data
  TEST_TDP_EMAIL: 'tdp-test@example.com',
  TEST_TDC_EMAIL: 'tdc-test@example.com',
  TEST_CCRP_EMAIL: 'ccrp-test@example.com',
  TEST_ADMIN_EMAIL: 'admin-test@example.com',
  
  // Blockchain test accounts (from Ganache deterministic mnemonic)
  TEST_PRIVATE_KEYS: {
    TDP: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    TDC: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    CCRP: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    ADMIN: '0x7c852118eafd6e862e4eaa3b37b6c7b1e6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b'
  },
  
  TEST_ADDRESSES: {
    TDP: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    TDC: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    CCRP: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    ADMIN: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  }
};

// Apply environment variables for integration tests
Object.entries(integrationEnv).forEach(([key, value]) => {
  process.env[key] = value;
});

module.exports = integrationEnv; 