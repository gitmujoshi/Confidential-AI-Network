#!/usr/bin/env node

/**
 * E2E Test Runner for User Registration and First Login
 * 
 * This script runs comprehensive tests for the user registration and first login flow.
 * It can be run independently or as part of a CI/CD pipeline.
 * 
 * Usage:
 *   node run-e2e-tests.js
 *   npm run test:e2e
 */

const axios = require('axios');
const colors = require('colors'); // Optional: for colored output
const { getTestConfig } = require('./scripts/load-config');

// Load configuration from centralized config.env and secrets.env
const config = getTestConfig();

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(`${prefix} ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`${prefix} ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`${prefix} ⚠️  ${message}`.yellow);
      break;
    case 'info':
    default:
      console.log(`${prefix} 🔍 ${message}`.blue);
      break;
  }
}

function logVerbose(message) {
  if (config.verbose) {
    console.log(`    ${message}`.gray);
  }
}

async function runTest(testName, testFunction) {
  testResults.total++;
  try {
    log(`Running: ${testName}`);
    await testFunction();
    testResults.passed++;
    log(`PASSED: ${testName}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`FAILED: ${testName} - ${error.message}`, 'error');
    if (config.verbose) {
      console.error(error);
    }
  }
}

// Test data
const testUser = {
  email: `e2e-test-${Date.now()}@example.com`,
  name: 'E2E Test User',
  partyType: 'TDC'
};

let temporaryPassword = '';
let newPassword = 'NewSecurePassword123!';

// Test functions
async function testSystemHealth() {
  logVerbose('Checking backend health...');
  // Try a simple endpoint that should exist - auth profile (will return 401 but proves backend is running)
  try {
    await axios.get(`${config.backend}/api/auth/profile`, { timeout: 5000 });
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logVerbose('Backend is healthy (returned expected 401 for unauthenticated request)');
      return;
    }
    throw new Error(`Backend health check failed: ${error.message}`);
  }
  logVerbose('Backend is healthy');
}

async function testUserRegistration() {
  logVerbose(`Registering user: ${testUser.email}`);
  
  const response = await axios.post(`${config.backend}/api/auth/register`, testUser, {
    timeout: config.timeout
  });
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Registration failed with status: ${response.status}`);
  }
  
  const data = response.data;
  if (!data.success || !data.user || !data.loginCredentials) {
    throw new Error('Registration response missing required fields');
  }
  
  if (data.user.email !== testUser.email) {
    throw new Error('Registration returned incorrect user email');
  }
  
  temporaryPassword = data.loginCredentials.password;
  logVerbose(`Temporary password: ${temporaryPassword}`);
}

async function testDuplicateRegistration() {
  logVerbose('Testing duplicate registration prevention...');
  
  try {
    await axios.post(`${config.backend}/api/auth/register`, testUser, {
      timeout: config.timeout
    });
    throw new Error('Duplicate registration should have failed');
  } catch (error) {
    if (error.response && (error.response.status === 400 || error.response.status === 409) && 
        error.response.data.code === 'EMAIL_ALREADY_EXISTS') {
      logVerbose('Duplicate registration correctly rejected');
    } else {
      throw new Error(`Unexpected error in duplicate registration test: ${error.message}`);
    }
  }
}

async function testFirstLoginDetection() {
  logVerbose('Testing first login detection...');
  
  if (!temporaryPassword) {
    throw new Error('No temporary password available from registration');
  }
  
  const response = await axios.post(`${config.backend}/api/auth/login`, {
    email: testUser.email,
    password: temporaryPassword
  }, { timeout: config.timeout });
  
  if (response.status !== 200) {
    throw new Error(`First login failed with status: ${response.status}`);
  }
  
  const data = response.data;
  if (!data.requiresPasswordChange || !data.isFirstLogin) {
    throw new Error('First login not properly detected');
  }
  
  if (data.user.email !== testUser.email || !data.user.firstLogin) {
    throw new Error('First login response has incorrect user data');
  }
  
  logVerbose('First login correctly detected');
}

async function testInvalidLogin() {
  logVerbose('Testing invalid login credentials...');
  
  try {
    await axios.post(`${config.backend}/api/auth/login`, {
      email: testUser.email,
      password: 'wrongpassword'
    }, { timeout: config.timeout });
    throw new Error('Invalid login should have failed');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logVerbose('Invalid credentials correctly rejected');
    } else {
      throw new Error(`Unexpected error in invalid login test: ${error.message}`);
    }
  }
}

async function testPasswordChange() {
  logVerbose('Testing first-login password change...');
  
  const response = await axios.post(`${config.backend}/api/auth/first-login-password`, {
    email: testUser.email,
    currentPassword: temporaryPassword,
    newPassword: newPassword
  }, { timeout: config.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Password change failed with status: ${response.status}`);
  }
  
  const data = response.data;
  if (!data.success || !data.firstLoginCompleted) {
    throw new Error('Password change response indicates failure');
  }
  
  logVerbose('Password changed successfully');
}

async function testNormalLoginAfterPasswordChange() {
  logVerbose('Testing normal login with new password...');
  
  const response = await axios.post(`${config.backend}/api/auth/login`, {
    email: testUser.email,
    password: newPassword
  }, { timeout: config.timeout });
  
  if (response.status !== 200) {
    throw new Error(`Normal login failed with status: ${response.status}`);
  }
  
  const data = response.data;
  if (data.requiresPasswordChange || !data.accessToken) {
    throw new Error('Normal login response incorrect');
  }
  
  if (data.user.firstLogin !== false) {
    throw new Error('User firstLogin flag not cleared after password change');
  }
  
  logVerbose('Normal login successful with new password');
}

async function testOldPasswordRejection() {
  logVerbose('Testing old password rejection...');
  
  try {
    await axios.post(`${config.backend}/api/auth/login`, {
      email: testUser.email,
      password: temporaryPassword
    }, { timeout: config.timeout });
    throw new Error('Old password should have been rejected');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logVerbose('Old password correctly rejected');
    } else {
      throw new Error(`Unexpected error in old password test: ${error.message}`);
    }
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting E2E Tests for User Registration and First Login'.bold);
  console.log(`Backend: ${config.backend}`);
  console.log(`Frontend: ${config.frontend}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log(`Test User: ${testUser.email}`);
  console.log('');

  // Run tests in sequence
  await runTest('System Health Check', testSystemHealth);
  await runTest('User Registration', testUserRegistration);
  await runTest('Duplicate Registration Prevention', testDuplicateRegistration);
  await runTest('First Login Detection', testFirstLoginDetection);
  await runTest('Invalid Login Rejection', testInvalidLogin);
  await runTest('First-Login Password Change', testPasswordChange);
  await runTest('Normal Login After Password Change', testNormalLoginAfterPasswordChange);
  await runTest('Old Password Rejection', testOldPasswordRejection);

  // Print results
  console.log('\n📊 Test Results Summary'.bold);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`.green);
  console.log(`Failed: ${testResults.failed}`.red);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed Tests:'.red);
    testResults.errors.forEach(error => {
      console.log(`  - ${error.test}: ${error.error}`.red);
    });
  }

  console.log('\n🧹 Test Data:');
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Temporary Password: ${temporaryPassword}`);
  console.log(`  New Password: ${newPassword}`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors and cleanup
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'error');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('Tests interrupted by user', 'warning');
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  config,
  testUser
};
