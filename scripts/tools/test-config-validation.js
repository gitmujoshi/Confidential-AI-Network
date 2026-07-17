#!/usr/bin/env node

/**
 * Test Configuration Validation Script
 * 
 * This script validates that the test environment is properly configured
 * using the centralized config.env and secrets.env files.
 * 
 * Usage:
 *   node test-config-validation.js
 *   npm run test:config
 */

const { getTestConfig, validateConfig, showConfig } = require('../load-config');
const axios = require('axios');

// Colors for output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(`${prefix} ${colors.green}✅ ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${prefix} ${colors.red}❌ ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${prefix} ${colors.yellow}⚠️  ${message}${colors.reset}`);
      break;
    case 'info':
    default:
      console.log(`${prefix} ${colors.blue}🔍 ${message}${colors.reset}`);
      break;
  }
}

async function validateTestEnvironment() {
  console.log(`${colors.blue}🧪 Test Environment Validation${colors.reset}`);
  console.log('=====================================\n');

  let allValid = true;

  try {
    // 1. Load and validate configuration
    log('Loading configuration from config.env and secrets.env...');
    const config = getTestConfig();
    validateConfig({ verbose: true });
    log('Configuration loaded and validated successfully', 'success');

    // 2. Show current configuration
    console.log('');
    showConfig();
    console.log('');

    // 3. Test backend connectivity
    log('Testing backend connectivity...');
    try {
      const response = await axios.get(`${config.backend}/api/auth/profile`, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status === 401) {
        log('Backend is running and responding (expected 401 for unauthenticated request)', 'success');
      } else if (response.status >= 200 && response.status < 300) {
        log('Backend is running and responding', 'success');
      } else {
        log(`Backend responded with status ${response.status}`, 'warning');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log('Backend is not running or not accessible', 'error');
        log(`Expected backend at: ${config.backend}`, 'info');
        allValid = false;
      } else {
        log(`Backend connectivity test failed: ${error.message}`, 'error');
        allValid = false;
      }
    }

    // 4. Test frontend connectivity (optional)
    log('Testing frontend connectivity...');
    try {
      const response = await axios.get(config.frontend, { 
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (response.status >= 200 && response.status < 400) {
        log('Frontend is running and accessible', 'success');
      } else {
        log(`Frontend responded with status ${response.status}`, 'warning');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        log('Frontend is not running (this is optional for API tests)', 'warning');
        log(`Expected frontend at: ${config.frontend}`, 'info');
      } else {
        log(`Frontend connectivity test failed: ${error.message}`, 'warning');
      }
    }

    // 5. Validate test-specific configuration
    log('Validating test-specific configuration...');
    
    const requiredTestVars = [
      'BACKEND_URL',
      'FRONTEND_URL',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'KEYCLOAK_URL',
      'KEYCLOAK_REALM'
    ];

    const missingTestVars = requiredTestVars.filter(varName => !process.env[varName]);
    
    if (missingTestVars.length > 0) {
      log(`Missing test configuration variables: ${missingTestVars.join(', ')}`, 'error');
      allValid = false;
    } else {
      log('All required test configuration variables are present', 'success');
    }

    // 6. Show test configuration summary
    console.log(`\n${colors.blue}📋 Test Configuration Summary:${colors.reset}`);
    console.log('=====================================');
    console.log(`Backend URL: ${config.backend}`);
    console.log(`Frontend URL: ${config.frontend}`);
    console.log(`Keycloak URL: ${config.keycloak}`);
    console.log(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log(`Test Timeout: ${config.timeout}ms`);
    console.log(`Verbose Mode: ${config.verbose}`);
    console.log('=====================================\n');

    // 7. Final validation result
    if (allValid) {
      log('Test environment validation completed successfully', 'success');
      console.log(`\n${colors.green}🎉 Test environment is ready for E2E testing!${colors.reset}`);
      console.log(`\nYou can now run:`);
      console.log(`  npm run test:e2e`);
      console.log(`  npm run test:e2e:verbose`);
      console.log(`  npm run test:e2e:mocha`);
      return true;
    } else {
      log('Test environment validation failed', 'error');
      console.log(`\n${colors.red}❌ Please fix the issues above before running E2E tests${colors.reset}`);
      return false;
    }

  } catch (error) {
    log(`Test environment validation failed: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  validateTestEnvironment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = {
  validateTestEnvironment
};
