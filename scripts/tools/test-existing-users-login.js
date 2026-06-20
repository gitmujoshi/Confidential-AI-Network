#!/usr/bin/env node

/**
 * Test Existing Users Login
 * Tests if existing test users can login with default passwords
 */

const axios = require('axios');

// Load centralized configuration
const { loadConfig } = require('../load-config.js');
loadConfig();

// Configuration
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';

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

// Test users with their expected passwords
const testUsers = [
  {
    email: 'tdp-test@example.com',
    password: 'TestPassword123!',
    partyType: 'TDP',
    name: 'TDP Test User'
  },
  {
    email: 'tdc-test@example.com',
    password: 'TestPassword123!',
    partyType: 'TDC',
    name: 'TDC Test User'
  },
  {
    email: 'tsp-test@example.com',
    password: 'TestPassword123!',
    partyType: 'TSP',
    name: 'TSP Test User'
  },
  {
    email: 'admin-test@example.com',
    password: 'TestPassword123!',
    partyType: 'AppAdmin',
    name: 'Admin Test User'
  },
  // Also try with password123 as fallback
  {
    email: 'tdp-test@example.com',
    password: 'password123',
    partyType: 'TDP',
    name: 'TDP Test User (alt)'
  },
  {
    email: 'tdc-test@example.com',
    password: 'password123',
    partyType: 'TDC',
    name: 'TDC Test User (alt)'
  },
  {
    email: 'tsp-test@example.com',
    password: 'password123',
    partyType: 'TSP',
    name: 'TSP Test User (alt)'
  },
  {
    email: 'admin-test@example.com',
    password: 'password123',
    partyType: 'AppAdmin',
    name: 'Admin Test User (alt)'
  }
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

async function testUserLogin(userData) {
  try {
    log(`🔐 Testing login for: ${userData.email} (${userData.partyType})`, 'blue');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: userData.email,
      password: userData.password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.accessToken) {
      log(`✅ Login successful: ${userData.email}`, 'green');
      log(`   Token: ${response.data.accessToken.substring(0, 20)}...`, 'cyan');
      log(`   User: ${response.data.user?.name || 'Unknown'}`, 'cyan');
      log(`   Party Type: ${response.data.user?.partyType || 'Unknown'}`, 'cyan');
      return { success: true, accessToken: response.data.accessToken, user: response.data.user };
    } else {
      log(`❌ Login failed: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function testUserProfile(accessToken, userData) {
  try {
    log(`👤 Testing profile fetch for: ${userData.email}`, 'blue');
    
    const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      log(`✅ Profile fetch successful: ${response.data.user.name}`, 'green');
      log(`   Email: ${response.data.user.email}`, 'cyan');
      log(`   Party Type: ${response.data.user.partyType}`, 'cyan');
      log(`   Organization: ${response.data.user.organization || 'N/A'}`, 'cyan');
      return { success: true, profile: response.data.user };
    } else {
      log(`❌ Profile fetch failed: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Profile fetch failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    log('🚀 Testing Existing Users Login', 'bright');
    log('=' .repeat(50), 'cyan');
    
    // Step 1: Check backend health
    log('\n🔍 Step 1: Checking backend health...', 'blue');
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      log('❌ Backend is not healthy, aborting', 'red');
      return;
    }
    
    // Step 2: Test user logins
    log('\n🔍 Step 2: Testing user logins...', 'blue');
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userData of testUsers) {
      const loginResult = await testUserLogin(userData);
      
      if (loginResult.success) {
        results.successful.push({
          ...userData,
          accessToken: loginResult.accessToken,
          user: loginResult.user
        });
        
        // Test profile fetch
        await testUserProfile(loginResult.accessToken, userData);
      } else {
        results.failed.push({
          ...userData,
          error: loginResult.error
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 3: Summary
    log('\n📊 Login Test Summary', 'bright');
    log('=' .repeat(30), 'cyan');
    log(`✅ Successful logins: ${results.successful.length}`, 'green');
    log(`❌ Failed logins: ${results.failed.length}`, 'red');
    
    if (results.successful.length > 0) {
      log('\n✅ Successfully Logged In Users:', 'green');
      results.successful.forEach(user => {
        log(`   ${user.partyType}: ${user.name} (${user.email})`, 'cyan');
        log(`   Password: ${user.password}`, 'cyan');
        log('');
      });
    }
    
    if (results.failed.length > 0) {
      log('\n❌ Failed Login Attempts:', 'red');
      results.failed.forEach(user => {
        log(`   ${user.partyType}: ${user.name} (${user.email})`, 'red');
        log(`   Password tried: ${user.password}`, 'red');
        log(`   Error: ${user.error}`, 'red');
        log('');
      });
    }
    
    // Find working credentials
    const workingCredentials = {};
    results.successful.forEach(user => {
      if (!workingCredentials[user.email]) {
        workingCredentials[user.email] = {
          email: user.email,
          password: user.password,
          partyType: user.partyType,
          name: user.name
        };
      }
    });
    
    if (Object.keys(workingCredentials).length > 0) {
      log('\n🎉 Working Test User Credentials:', 'bright');
      log('=' .repeat(40), 'cyan');
      Object.values(workingCredentials).forEach(user => {
        log(`Email: ${user.email}`, 'green');
        log(`Password: ${user.password}`, 'green');
        log(`Party Type: ${user.partyType}`, 'green');
        log(`Name: ${user.name}`, 'green');
        log('---', 'cyan');
      });
    }
    
    log('\n🎉 Test completed!', 'bright');
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = { testUserLogin, testUserProfile };
