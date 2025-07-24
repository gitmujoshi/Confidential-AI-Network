const { setTestEnv } = require('./test-env');
const { log } = require('./utils/logger');
const path = require('path');
const fs = require('fs');
const CONFIG = require('../config/config');

function setupTestEnvironment(suiteName) {
  log(`Setting up test environment for ${suiteName}...`);
  // Set environment variables for testing
  let mode = 'mock';
  if (suiteName === 'integration') mode = 'integration';
  setTestEnv(mode);
  // Create test results directory
  const resultsDir = path.join(__dirname, '..', CONFIG.reporting.outputDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  log(`✅ Test environment setup complete for ${suiteName}`);
}

module.exports = {
  setupTestEnvironment,
}; 