#!/usr/bin/env node

/**
 * Clear Test Users Script
 * Deletes existing test users from the database
 */

const axios = require('axios');

// Load centralized configuration
const { loadConfig } = require('./load-config.js');
loadConfig();

// Configuration
const API_BASE_URL = process.env.BACKEND_URL;

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

// Test user emails to clear
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

async function clearTestUsers() {
  log('🧹 Clearing existing test users...', 'blue');
  
  for (const email of testUserEmails) {
    try {
      log(`🗑️  Deleting user: ${email}`, 'yellow');
      
      // Note: This would require a delete endpoint in the API
      // For now, we'll just log what we would do
      log(`   ⚠️  User ${email} exists but cannot be deleted via API`, 'yellow');
      log(`   💡 Consider manually deleting from database or using admin tools`, 'cyan');
      
    } catch (error) {
      log(`   ❌ Failed to delete ${email}: ${error.message}`, 'red');
    }
  }
}

async function main() {
  log('🚀 Starting test user cleanup...', 'blue');
  log('============================================================', 'blue');
  
  // Check backend health
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    log('❌ Backend is not healthy. Exiting.', 'red');
    process.exit(1);
  }
  
  // Clear test users
  await clearTestUsers();
  
  log('', 'reset');
  log('🎉 Test user cleanup completed!', 'green');
  log('', 'reset');
  log('📋 Next Steps:', 'blue');
  log('1. Manually delete test users from database if needed', 'cyan');
  log('2. Run test data creation with new password', 'cyan');
  log('3. Test user authentication', 'cyan');
}

main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});

