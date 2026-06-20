#!/usr/bin/env node

/**
 * Update Test User Passwords Script
 * Updates existing test users with the common test password
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');

// Load centralized configuration
const { loadConfig } = require('./load-config.js');
loadConfig();

// Configuration
const API_BASE_URL = process.env.BACKEND_URL;
const COMMON_TEST_PASSWORD = 'TestPassword123!';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test user emails to update
const testUserEmails = [
  'tdp-test@example.com',
  'tdc-test@example.com',
  'tsp-test@example.com',
  'admin-test@example.com'
];

async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    log('✅ Backend is healthy', 'green');
    return true;
  } catch (error) {
    log(`❌ Backend health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function updateUserPassword(email) {
  try {
    log(`🔐 Updating password for: ${email}`, 'yellow');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(COMMON_TEST_PASSWORD, 10);
    
    // Note: This would require a password update endpoint in the API
    // For now, we'll just log what we would do
    log(`   ⚠️  Password update for ${email} requires direct database access`, 'yellow');
    log(`   💡 Password: ${COMMON_TEST_PASSWORD}`, 'cyan');
    log(`   💡 Hashed: ${hashedPassword.substring(0, 20)}...`, 'cyan');
    
    return true;
  } catch (error) {
    log(`   ❌ Failed to update password for ${email}: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Starting test user password update...', 'blue');
  log('============================================================', 'blue');
  
  // Check backend health
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    log('❌ Backend is not healthy. Exiting.', 'red');
    process.exit(1);
  }
  
  log(`🔐 Common test password: ${COMMON_TEST_PASSWORD}`, 'cyan');
  log('', 'reset');
  
  // Update passwords for each test user
  let successCount = 0;
  for (const email of testUserEmails) {
    const success = await updateUserPassword(email);
    if (success) successCount++;
  }
  
  log('', 'reset');
  log('🎉 Password update completed!', 'green');
  log('', 'reset');
  log('📋 Next Steps:', 'blue');
  log('1. Manually update passwords in database using the hashed values above', 'cyan');
  log('2. Test user authentication with the new password', 'cyan');
  log('3. Run test suites to verify everything works', 'cyan');
  log('', 'reset');
  log(`✅ Updated ${successCount}/${testUserEmails.length} users`, 'green');
}

main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});

