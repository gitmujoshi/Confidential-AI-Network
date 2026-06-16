#!/usr/bin/env node

/**
 * Test Frontend-Backend Connection
 * 
 * This script tests if the frontend can properly connect to the backend
 * and perform login operations, simulating what the UI would do.
 */

const axios = require('axios');

// Load centralized configuration from config.env
const { loadConfig } = require('../load-config.js');
loadConfig();

// Configuration from config.env
const BACKEND_URL = process.env.BACKEND_URL;
const FRONTEND_URL = 'http://localhost:3000';

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

async function testBackendHealth() {
  try {
    log('🔍 Testing backend health...', 'blue');
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.status === 200) {
      log('✅ Backend is healthy', 'green');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFrontendAccess() {
  try {
    log('🔍 Testing frontend access...', 'blue');
    const response = await axios.get(FRONTEND_URL);
    if (response.status === 200) {
      log('✅ Frontend is accessible', 'green');
      return true;
    } else {
      log(`❌ Frontend access failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend access failed: ${error.message}`, 'red');
    return false;
  }
}

async function testLoginAPI() {
  try {
    log('🔍 Testing login API...', 'blue');
    
    const loginData = {
      email: 'tdp.medical.2025-09-05t20-39-55@test.com',
      password: 'O-?@4+n47!jA'
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      }
    });
    
    if (response.status === 200 && response.data.accessToken) {
      log('✅ Login API working correctly', 'green');
      log(`   Token: ${response.data.accessToken.substring(0, 50)}...`, 'cyan');
      log(`   User: ${response.data.user.name}`, 'cyan');
      log(`   Party Type: ${response.data.user.partyType}`, 'cyan');
      return true;
    } else {
      log(`❌ Login API failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function testCORS() {
  try {
    log('🔍 Testing CORS configuration...', 'blue');
    
    const response = await axios.options(`${BACKEND_URL}/api/auth/login`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (response.status === 200) {
      log('✅ CORS preflight successful', 'green');
      return true;
    } else {
      log(`❌ CORS preflight failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ CORS preflight failed: ${error.message}`, 'red');
    return false;
  }
}

async function testProfileAPI(accessToken) {
  try {
    log('🔍 Testing profile API...', 'blue');
    
    const response = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Origin': FRONTEND_URL
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Profile API working correctly', 'green');
      log(`   User: ${response.data.user.name}`, 'cyan');
      log(`   Email: ${response.data.user.email}`, 'cyan');
      return true;
    } else {
      log(`❌ Profile API failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Profile API failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  try {
    log('🚀 Testing Frontend-Backend Connection', 'bright');
    log('=' .repeat(50), 'cyan');
    
    // Test 1: Backend health
    const backendHealthy = await testBackendHealth();
    if (!backendHealthy) {
      log('❌ Backend is not healthy, aborting', 'red');
      return;
    }
    
    // Test 2: Frontend access
    const frontendAccessible = await testFrontendAccess();
    if (!frontendAccessible) {
      log('❌ Frontend is not accessible, aborting', 'red');
      return;
    }
    
    // Test 3: CORS
    const corsWorking = await testCORS();
    
    // Test 4: Login API
    const loginWorking = await testLoginAPI();
    if (!loginWorking) {
      log('❌ Login API not working, aborting', 'red');
      return;
    }
    
    // Test 5: Get access token and test profile API
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'tdp.medical.2025-09-05t20-39-55@test.com',
      password: 'O-?@4+n47!jA'
    });
    
    if (loginResponse.data.accessToken) {
      await testProfileAPI(loginResponse.data.accessToken);
    }
    
    // Summary
    log('\n📊 Connection Test Summary', 'bright');
    log('=' .repeat(30), 'cyan');
    log(`✅ Backend Health: ${backendHealthy ? 'Working' : 'Failed'}`, backendHealthy ? 'green' : 'red');
    log(`✅ Frontend Access: ${frontendAccessible ? 'Working' : 'Failed'}`, frontendAccessible ? 'green' : 'red');
    log(`✅ CORS: ${corsWorking ? 'Working' : 'Failed'}`, corsWorking ? 'green' : 'red');
    log(`✅ Login API: ${loginWorking ? 'Working' : 'Failed'}`, loginWorking ? 'green' : 'red');
    
    if (backendHealthy && frontendAccessible && loginWorking) {
      log('\n🎉 All tests passed! Frontend should be able to connect to backend.', 'bright');
      log('💡 If you\'re still getting network errors in the UI, try:', 'yellow');
      log('   1. Clear browser cache and cookies', 'yellow');
      log('   2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)', 'yellow');
      log('   3. Check browser developer console for specific errors', 'yellow');
    } else {
      log('\n❌ Some tests failed. Check the errors above.', 'red');
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testBackendHealth, testFrontendAccess, testLoginAPI };
