const { setTestEnv } = require('./test-env');

function setupEnvironment(suite) {
  log(`Setting up environment for ${suite.name}...`);
  setTestEnv(suite.environment.TEST_MODE || 'mock');
  log('✅ Environment variables configured');
} 