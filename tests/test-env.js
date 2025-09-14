// Centralized test environment configuration for all test modes
// Usage: require and call setTestEnv('mock') or setTestEnv('integration') at the top of your test files or runner
// This configuration uses ONLY common config.env and throws errors for missing variables

const { loadConfig, validateConfig } = require('../scripts/load-config');

function setTestEnv(mode = 'mock') {
  // Load common configuration first - this will throw if config.env is missing
  loadConfig({ verbose: false });
  
  // Validate required configuration variables
  validateConfig({ verbose: false });
  
  // Set base test environment
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = mode;
  
  // Validate required environment variables for tests
  const requiredVars = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'BACKEND_URL', 'FRONTEND_URL', 'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables for tests: ${missingVars.join(', ')}. Please check your config.env file.`);
  }
  
  if (mode === 'mock') {
    // Mock mode - use common config but disable external services
    process.env.DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}_test`;
    process.env.SCITT_CCF_ENABLED = 'false';
    process.env.KEYCLOAK_ENABLED = 'false';
    process.env.DB_NAME = `${process.env.DB_NAME}_test`;
  } else if (mode === 'integration') {
    // Integration mode - use common config with all services enabled
    process.env.DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}_test`;
    process.env.SCITT_CCF_ENABLED = process.env.SCITT_CCF_ENABLED || 'true';
    process.env.KEYCLOAK_ENABLED = 'true';
    process.env.DB_NAME = `${process.env.DB_NAME}_test`;
    
    // Validate integration-specific variables (using existing config.env variables)
    const integrationVars = ['SCITT_CCF_URL', 'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_ADMIN_USER', 'KEYCLOAK_ADMIN_PASSWORD'];
    const missingIntegrationVars = integrationVars.filter(varName => !process.env[varName]);
    if (missingIntegrationVars.length > 0) {
      throw new Error(`Missing required integration test variables: ${missingIntegrationVars.join(', ')}. Please add these to your config.env file.`);
    }
  }
  
  // Set test-specific environment variables (no defaults)
  if (!process.env.TEST_TIMEOUT) {
    throw new Error('TEST_TIMEOUT is required for tests. Please add it to your config.env file.');
  }
  
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
}

module.exports = { setTestEnv }; 