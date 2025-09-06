#!/usr/bin/env node

/**
 * Create Test Data via Registration API
 * Uses the same APIs that the frontend uses - registration and login
 */

const axios = require('axios');
const https = require('https');

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

// Test users data with common password
const COMMON_TEST_PASSWORD = 'TestPassword123!';

const testUsers = [
  {
    name: 'TDP Test User',
    email: 'tdp-test@example.com',
    password: COMMON_TEST_PASSWORD,
    partyType: 'TDP',
    organization: 'TDP Test Organization',
    description: 'Test TDP user created via registration API'
  },
  {
    name: 'TDC Test User',
    email: 'tdc-test@example.com',
    password: COMMON_TEST_PASSWORD,
    partyType: 'TDC',
    organization: 'TDC Test Organization',
    description: 'Test TDC user created via registration API'
  },
  {
    name: 'CCRP Test User',
    email: 'ccrp-test@example.com',
    password: COMMON_TEST_PASSWORD,
    partyType: 'CCRP',
    organization: 'CCRP Test Organization',
    description: 'Test CCRP user created via registration API'
  },
  {
    name: 'Admin Test User',
    email: 'admin-test@example.com',
    password: COMMON_TEST_PASSWORD,
    partyType: 'AppAdmin',
    organization: 'Admin Test Organization',
    description: 'Test Admin user created via registration API'
  }
];

// Store created users with their credentials
const createdUsers = [];

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

async function registerUser(userData) {
  try {
    log(`📝 Registering user: ${userData.email} (${userData.partyType})`, 'blue');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.success) {
      const user = response.data.user;
      const credentials = response.data.loginCredentials;
      
      log(`✅ User registered successfully: ${user.name}`, 'green');
      log(`   Email: ${user.email}`, 'cyan');
      log(`   Password: ${credentials.password}`, 'cyan');
      log(`   DEPA ID: ${user.depaId}`, 'cyan');
      
      // Store user with credentials for later use
      createdUsers.push({
        ...user,
        password: credentials.password,
        accessToken: null // Will be set after login
      });
      
      return { success: true, user, credentials };
    } else {
      log(`❌ User registration failed: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ User registration failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    log(`🔐 Logging in user: ${email}`, 'blue');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: email,
      password: password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.accessToken) {
      log(`✅ User login successful: ${email}`, 'green');
      return { success: true, accessToken: response.data.accessToken };
    } else {
      log(`❌ User login failed: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ User login failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
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
      name: `Test Dataset for ${user.name}`,
      description: `Test dataset created for ${user.name}`,
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
    
    const response = await axios.post(`${API_BASE_URL}/api/datasets`, datasetData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.success) {
      log(`✅ Dataset created successfully: ${response.data.dataset.name}`, 'green');
      return { success: true, dataset: response.data.dataset };
    } else {
      log(`❌ Dataset creation failed: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ Dataset creation failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
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
      name: `Test AI Model for ${user.name}`,
      description: `Test AI model created for ${user.name}`,
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
    
    const response = await axios.post(`${API_BASE_URL}/api/ai-models`, modelData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data.success) {
      log(`✅ AI model created successfully: ${response.data.model.name}`, 'green');
      return { success: true, model: response.data.model };
    } else {
      log(`❌ AI model creation failed: ${response.data.error}`, 'red');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    log(`❌ AI model creation failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return { success: false, error: error.message };
  }
}

async function createTestData() {
  try {
    log('🚀 Starting test data creation via Registration API', 'bright');
    log('=' .repeat(60), 'cyan');
    
    // Step 1: Check backend health
    log('\n🔍 Step 1: Checking backend health...', 'blue');
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      log('❌ Backend is not healthy, aborting', 'red');
      return;
    }
    
    // Step 2: Register all test users
    log('\n🔍 Step 2: Registering test users...', 'blue');
    for (const userData of testUsers) {
      await registerUser(userData);
    }
    
    // Step 3: Login all users and create role-specific data
    log('\n🔍 Step 3: Logging in users and creating data...', 'blue');
    for (const user of createdUsers) {
      const loginResult = await loginUser(user.email, user.password);
      if (loginResult.success) {
        user.accessToken = loginResult.accessToken;
        
        // Create role-specific data
        if (user.partyType === 'TDP') {
          await createDataset(user, user.accessToken);
        } else if (user.partyType === 'TDC') {
          await createAIModel(user, user.accessToken);
        }
      }
    }
    
    // Step 4: Summary
    log('\n📊 Test Data Creation Summary', 'bright');
    log('=' .repeat(40), 'cyan');
    log(`✅ Users created: ${createdUsers.length}`, 'green');
    log(`✅ Users logged in: ${createdUsers.filter(u => u.accessToken).length}`, 'green');
    
    log('\n👥 Created Users:', 'blue');
    createdUsers.forEach(user => {
      log(`   ${user.partyType}: ${user.name} (${user.email})`, 'cyan');
      log(`   Password: ${user.password}`, 'cyan');
      log(`   DEPA ID: ${user.depaId}`, 'cyan');
      log(`   Login Status: ${user.accessToken ? '✅ Success' : '❌ Failed'}`, user.accessToken ? 'green' : 'red');
      log('');
    });
    
    log('🎉 Test data creation completed!', 'bright');
    
  } catch (error) {
    log(`❌ Test data creation failed: ${error.message}`, 'red');
  }
}

// Run the test data creation
if (require.main === module) {
  createTestData();
}

module.exports = createTestData;
