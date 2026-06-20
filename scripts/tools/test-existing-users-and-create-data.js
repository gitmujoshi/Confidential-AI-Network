#!/usr/bin/env node

/**
 * Test Existing Users and Create Data via APIs
 * 
 * This script tests login for existing users and creates role-specific data
 * using only the public APIs. Uses centralized config.env for all configuration.
 */

const axios = require('axios');

// Load centralized configuration from config.env
const { loadConfig } = require('../load-config.js');
loadConfig();

// Configuration from config.env
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

// Test users with different password attempts
const testUsers = [
  // Try with TestPassword123! first
  { email: 'tdp.medical@example.com', password: 'TestPassword123!', partyType: 'TDP' },
  { email: 'tdp.nlp@example.com', password: 'TestPassword123!', partyType: 'TDP' },
  { email: 'tdp.autodrive@example.com', password: 'TestPassword123!', partyType: 'TDP' },
  { email: 'tdc.healthcare@example.com', password: 'TestPassword123!', partyType: 'TDC' },
  { email: 'tdc.fintech@example.com', password: 'TestPassword123!', partyType: 'TDC' },
  { email: 'tdc.language@example.com', password: 'TestPassword123!', partyType: 'TDC' },
  { email: 'tsp.securecloud@example.com', password: 'TestPassword123!', partyType: 'TSP' },
  { email: 'tsp.trustedai@example.com', password: 'TestPassword123!', partyType: 'TSP' },
  { email: 'tsp.privacyfirst@example.com', password: 'TestPassword123!', partyType: 'TSP' },
  { email: 'admin.system@example.com', password: '2|8Y1C#T$GGJ', partyType: 'AppAdmin' },
  // Try with password123 as fallback
  { email: 'tdp.medical@example.com', password: 'password123', partyType: 'TDP' },
  { email: 'tdp.nlp@example.com', password: 'password123', partyType: 'TDP' },
  { email: 'tdp.autodrive@example.com', password: 'password123', partyType: 'TDP' },
  { email: 'tdc.healthcare@example.com', password: 'password123', partyType: 'TDC' },
  { email: 'tdc.fintech@example.com', password: 'password123', partyType: 'TDC' },
  { email: 'tdc.language@example.com', password: 'password123', partyType: 'TDC' },
  { email: 'tsp.securecloud@example.com', password: 'password123', partyType: 'TSP' },
  { email: 'tsp.trustedai@example.com', password: 'password123', partyType: 'TSP' },
  { email: 'tsp.privacyfirst@example.com', password: 'password123', partyType: 'TSP' }
];

// Store successful logins
const successfulLogins = [];

/**
 * API Helper Functions
 */
class APIHelper {
  static async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 30000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  static async checkHealth() {
    const response = await this.makeRequest('GET', '/health');
    if (response.success) {
      log('✅ Backend is healthy', 'green');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.error}`, 'red');
      return false;
    }
  }
}

async function testUserLogin(userData) {
  try {
    log(`🔐 Testing login for: ${userData.email} (${userData.partyType})`, 'blue');
    
    const response = await APIHelper.makeRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });
    
    if (response.success && response.data.accessToken) {
      log(`✅ Login successful: ${userData.email}`, 'green');
      log(`   Password: ${userData.password}`, 'cyan');
      log(`   User: ${response.data.user?.name || 'Unknown'}`, 'cyan');
      log(`   Party Type: ${response.data.user?.partyType || 'Unknown'}`, 'cyan');
      
      successfulLogins.push({
        ...userData,
        accessToken: response.data.accessToken,
        user: response.data.user
      });
      
      return { success: true, accessToken: response.data.accessToken, user: response.data.user };
    } else {
      log(`❌ Login failed: ${response.error?.error || response.error}`, 'red');
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function createDataset(user, accessToken) {
  if (user.partyType !== 'TDP') {
    log(`⏭️ Skipping dataset creation for ${user.partyType} user`, 'yellow');
    return { success: true, message: 'Not a TDP user' };
  }
  
  try {
    log(`📊 Creating dataset for TDP user: ${user.email}`, 'blue');
    
    const datasetData = {
      name: `Test Dataset - ${user.user?.name || user.email}`,
      description: `Test dataset created for ${user.user?.name || user.email}`,
      dataType: 'TRAINING_DATA',
      category: 'HEALTHCARE',
      size: '1000',
      format: 'CSV',
      location: 'AWS S3',
      accessLevel: 'RESTRICTED',
      compliance: ['GDPR', 'HIPAA'],
      metadata: {
        source: 'Test Data Generator',
        created: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/datasets', datasetData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ Dataset created: ${response.data.dataset.name}`, 'green');
      return { success: true, dataset: response.data.dataset };
    } else {
      log(`❌ Dataset creation failed: ${response.error?.error || response.error}`, 'red');
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`❌ Dataset creation failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function createAIModel(user, accessToken) {
  if (user.partyType !== 'TDC') {
    log(`⏭️ Skipping AI model creation for ${user.partyType} user`, 'yellow');
    return { success: true, message: 'Not a TDC user' };
  }
  
  try {
    log(`🤖 Creating AI model for TDC user: ${user.email}`, 'blue');
    
    const modelData = {
      name: `Test AI Model - ${user.user?.name || user.email}`,
      description: `Test AI model created for ${user.user?.name || user.email}`,
      modelType: 'MACHINE_LEARNING',
      algorithm: 'RANDOM_FOREST',
      framework: 'SCIKIT_LEARN',
      version: '1.0.0',
      performance: {
        accuracy: 0.95,
        precision: 0.92,
        recall: 0.88
      },
      metadata: {
        source: 'Test Data Generator',
        created: new Date().toISOString(),
        trainingData: 'Synthetic'
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/ai-models', modelData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ AI model created: ${response.data.model.name}`, 'green');
      return { success: true, model: response.data.model };
    } else {
      log(`❌ AI model creation failed: ${response.error?.error || response.error}`, 'red');
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`❌ AI model creation failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function createEnvironment(user, accessToken) {
  if (user.partyType !== 'TSP') {
    log(`⏭️ Skipping environment creation for ${user.partyType} user`, 'yellow');
    return { success: true, message: 'Not a TSP user' };
  }
  
  try {
    log(`🏗️ Creating environment for TSP user: ${user.email}`, 'blue');
    
    const environmentData = {
      name: `Test Environment - ${user.user?.name || user.email}`,
      description: `Test environment created for ${user.user?.name || user.email}`,
      environmentType: 'CONFIDENTIAL_COMPUTING',
      infrastructure: 'AZURE_CONFIDENTIAL_COMPUTING',
      securityLevel: 'HIGH',
      compliance: ['SOC2', 'ISO27001'],
      capabilities: ['GPU_ACCELERATION', 'SECURE_ENCLAVES'],
      metadata: {
        provider: user.user?.name || user.email,
        created: new Date().toISOString(),
        region: 'US-East'
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/environments', environmentData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ Environment created: ${response.data.environment.name}`, 'green');
      return { success: true, environment: response.data.environment };
    } else {
      log(`❌ Environment creation failed: ${response.error?.error || response.error}`, 'red');
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`❌ Environment creation failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    log('🚀 Testing Existing Users and Creating Data via APIs', 'bright');
    log('=' .repeat(60), 'cyan');
    
    // Step 1: Check backend health
    log('\n🔍 Step 1: Checking backend health...', 'blue');
    const isHealthy = await APIHelper.checkHealth();
    if (!isHealthy) {
      log('❌ Backend is not healthy, aborting', 'red');
      return;
    }
    
    // Step 2: Test user logins
    log('\n🔍 Step 2: Testing user logins...', 'blue');
    const loginResults = {
      successful: [],
      failed: []
    };
    
    for (const userData of testUsers) {
      const loginResult = await testUserLogin(userData);
      
      if (loginResult.success) {
        loginResults.successful.push({
          ...userData,
          accessToken: loginResult.accessToken,
          user: loginResult.user
        });
      } else {
        loginResults.failed.push({
          ...userData,
          error: loginResult.error
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 3: Create role-specific data for successful logins
    log('\n🔍 Step 3: Creating role-specific data...', 'blue');
    const dataResults = {
      datasets: 0,
      aiModels: 0,
      environments: 0
    };
    
    for (const user of loginResults.successful) {
      if (user.partyType === 'TDP') {
        const result = await createDataset(user, user.accessToken);
        if (result.success) dataResults.datasets++;
      } else if (user.partyType === 'TDC') {
        const result = await createAIModel(user, user.accessToken);
        if (result.success) dataResults.aiModels++;
      } else if (user.partyType === 'TSP') {
        const result = await createEnvironment(user, user.accessToken);
        if (result.success) dataResults.environments++;
      }
    }
    
    // Step 4: Summary
    log('\n📊 Test Results Summary', 'bright');
    log('=' .repeat(30), 'cyan');
    log(`✅ Successful logins: ${loginResults.successful.length}`, 'green');
    log(`❌ Failed logins: ${loginResults.failed.length}`, 'red');
    log(`📊 Datasets created: ${dataResults.datasets}`, 'green');
    log(`🤖 AI models created: ${dataResults.aiModels}`, 'green');
    log(`🏗️ Environments created: ${dataResults.environments}`, 'green');
    
    if (loginResults.successful.length > 0) {
      log('\n✅ Successfully Logged In Users:', 'green');
      loginResults.successful.forEach(user => {
        log(`   ${user.partyType}: ${user.user?.name || user.email}`, 'cyan');
        log(`   Password: ${user.password}`, 'cyan');
        log(`   Email: ${user.email}`, 'cyan');
        log('');
      });
    }
    
    if (loginResults.failed.length > 0) {
      log('\n❌ Failed Login Attempts:', 'red');
      loginResults.failed.forEach(user => {
        log(`   ${user.partyType}: ${user.email}`, 'red');
        log(`   Password tried: ${user.password}`, 'red');
        log(`   Error: ${user.error?.error || user.error}`, 'red');
        log('');
      });
    }
    
    // Find working credentials
    const workingCredentials = {};
    loginResults.successful.forEach(user => {
      if (!workingCredentials[user.email]) {
        workingCredentials[user.email] = {
          email: user.email,
          password: user.password,
          partyType: user.partyType,
          name: user.user?.name || user.email
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

module.exports = { testUserLogin, APIHelper };
