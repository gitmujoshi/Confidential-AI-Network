#!/usr/bin/env node

/**
 * Test Registration with Password Script
 * Tests the updated registration API with a known password
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

async function testRegistrationWithPassword() {
  const testUser = {
    name: 'Test User with Password',
    email: 'test-password@example.com',
    password: 'TestPassword123!',
    partyType: 'TDP',
    organization: 'Test Organization',
    description: 'Test user created with known password'
  };

  try {
    log('🧪 Testing registration with password...', 'blue');
    log('============================================================', 'blue');
    
    // Check backend health
    log('🔍 Checking backend health...', 'yellow');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    log('✅ Backend is healthy', 'green');
    
    // Register user with password
    log(`📝 Registering user: ${testUser.email}`, 'yellow');
    log(`   Password: ${testUser.password}`, 'cyan');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.success) {
      log('✅ User registered successfully!', 'green');
      log(`   User ID: ${response.data.user.id}`, 'cyan');
      log(`   Email: ${response.data.user.email}`, 'cyan');
      log(`   Party Type: ${response.data.user.partyType}`, 'cyan');
      
      if (response.data.loginCredentials) {
        log('🔐 Login Credentials:', 'yellow');
        log(`   Email: ${response.data.loginCredentials.email}`, 'cyan');
        log(`   Password: ${response.data.loginCredentials.password}`, 'cyan');
        log(`   Note: ${response.data.loginCredentials.note}`, 'cyan');
      }
      
      // Test login with the provided credentials
      log('', 'reset');
      log('🔐 Testing login with provided credentials...', 'yellow');
      
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (loginResponse.data.accessToken) {
        log('✅ Login successful!', 'green');
        log(`   Token: ${loginResponse.data.accessToken.substring(0, 20)}...`, 'cyan');
      } else {
        log('❌ Login failed', 'red');
        log(`   Response: ${JSON.stringify(loginResponse.data, null, 2)}`, 'red');
      }
      
    } else {
      log('❌ Registration failed', 'red');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'red');
    }
    
  } catch (error) {
    if (error.response?.status === 409) {
      log('⚠️ User already exists, testing login instead...', 'yellow');
      
      // Test login with existing user
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: testUser.email,
          password: testUser.password
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (loginResponse.data.accessToken) {
          log('✅ Login successful with existing user!', 'green');
          log(`   Token: ${loginResponse.data.accessToken.substring(0, 20)}...`, 'cyan');
        } else {
          log('❌ Login failed with existing user', 'red');
          log(`   Response: ${JSON.stringify(loginResponse.data, null, 2)}`, 'red');
        }
      } catch (loginError) {
        log('❌ Login test failed', 'red');
        log(`   Error: ${JSON.stringify(loginError.response?.data || loginError.message, null, 2)}`, 'red');
      }
    } else {
      log('❌ Registration test failed', 'red');
      log(`   Error: ${error.response?.data || error.message}`, 'red');
    }
  }
}

async function main() {
  await testRegistrationWithPassword();
  
  log('', 'reset');
  log('🎉 Test completed!', 'green');
}

main().catch(error => {
  log(`❌ Script failed: ${error.message}`, 'red');
  process.exit(1);
});
