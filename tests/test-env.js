// Centralized test environment configuration for all test modes
// Usage: require and call setTestEnv('mock') or setTestEnv('integration') at the top of your test files or runner

const ENV_CONFIG = {
  mock: {
    TEST_MODE: 'mock',
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-key',
    DATABASE_URL: 'postgresql://mukeshjoshi@localhost:5432/contract_management_test',
    BLOCKCHAIN_ENABLED: 'false',
    KEYCLOAK_ENABLED: 'false',
    KEYCLOAK_URL: 'http://localhost:8080',
    // Add any other mock-specific variables here
  },
  integration: {
    TEST_MODE: 'integration',
    NODE_ENV: 'test',
    JWT_SECRET: 'integration-test-secret-key-for-jwt-signing',
    DATABASE_URL: 'postgresql://testuser:testpass@localhost:5433/contract_management_test',
    BLOCKCHAIN_ENABLED: 'true',
    BLOCKCHAIN_URL: 'http://localhost:8546', // or 8547 for Hardhat
    KEYCLOAK_ENABLED: 'true',
    KEYCLOAK_URL: 'http://localhost:8081',
    KEYCLOAK_ADMIN: 'admin',
    KEYCLOAK_ADMIN_PASSWORD: 'admin123',
    KEYCLOAK_REALM: 'contract-management-test',
    KEYCLOAK_CLIENT_ID: 'backend-test',
    KEYCLOAK_CLIENT_SECRET: 'test-client-secret',
    TEST_TIMEOUT: '30000',
    BACKEND_URL: 'http://localhost:5001',
    FRONTEND_URL: 'http://localhost:3000',
    // Add any other integration-specific variables here
  }
};

function setTestEnv(mode = 'mock') {
  const config = ENV_CONFIG[mode] || ENV_CONFIG.mock;
  Object.entries(config).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

module.exports = { setTestEnv, ENV_CONFIG }; 