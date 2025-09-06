#!/usr/bin/env node

/**
 * Test Registration API
 * Tests the registration API to see if it properly creates users in both database and Keycloak
 */

const axios = require('axios');
const https = require('https');

// Configuration
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://localhost:8443';

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

// Test user data
const testUser = {
  name: 'Test API User',
  email: 'test-api@example.com',
  partyType: 'TDP',
  organization: 'Test Organization',
  description: 'Test user created via API'
};

async function testRegistrationAPI() {
  try {
    log('🧪 Testing Registration API', 'bright');
    log('=' .repeat(50), 'cyan');

    // Step 1: Test backend health
    log('\n🔍 Step 1: Testing backend health...', 'blue');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      log('✅ Backend is healthy', 'green');
    } catch (error) {
      log(`❌ Backend health check failed: ${error.message}`, 'red');
      return;
    }

    // Step 2: Test Keycloak health
    log('\n🔍 Step 2: Testing Keycloak health...', 'blue');
    try {
      const keycloakResponse = await axios.get(`${KEYCLOAK_URL}/health`, {
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      log('✅ Keycloak is healthy', 'green');
    } catch (error) {
      log(`❌ Keycloak health check failed: ${error.message}`, 'red');
      log('⚠️ This might explain why user sync is failing', 'yellow');
    }

    // Step 3: Test registration API
    log('\n🔍 Step 3: Testing registration API...', 'blue');
    try {
      const registrationResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      log('✅ Registration API responded', 'green');
      log(`Response: ${JSON.stringify(registrationResponse.data, null, 2)}`, 'cyan');
      
      if (registrationResponse.data.success) {
        log('✅ User registration successful', 'green');
      } else {
        log('⚠️ User registration had issues', 'yellow');
      }
    } catch (error) {
      log(`❌ Registration API failed: ${error.message}`, 'red');
      if (error.response) {
        log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      }
    }

    // Step 4: Test login with the created user
    log('\n🔍 Step 4: Testing login with created user...', 'blue');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: 'password123' // Default password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (loginResponse.data.accessToken) {
        log('✅ User login successful', 'green');
        log('✅ User was properly created in both database and Keycloak', 'green');
      } else {
        log('❌ User login failed - user not properly synced', 'red');
      }
    } catch (error) {
      log(`❌ User login failed: ${error.message}`, 'red');
      if (error.response) {
        log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      }
      log('❌ This confirms the user sync issue', 'red');
    }

    // Step 5: Test Keycloak admin token
    log('\n🔍 Step 5: Testing Keycloak admin token...', 'blue');
    try {
      const adminTokenResponse = await axios.post(
        `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
        'grant_type=password&client_id=admin-cli&username=admin&password=admin123',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        }
      );
      
      if (adminTokenResponse.data.access_token) {
        log('✅ Keycloak admin token obtained successfully', 'green');
      } else {
        log('❌ Keycloak admin token failed', 'red');
      }
    } catch (error) {
      log(`❌ Keycloak admin token failed: ${error.message}`, 'red');
      log('❌ This explains why user creation in Keycloak is failing', 'red');
    }

    log('\n🎉 Registration API test completed!', 'bright');
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

// Run the test
if (require.main === module) {
  testRegistrationAPI();
}

module.exports = testRegistrationAPI;
