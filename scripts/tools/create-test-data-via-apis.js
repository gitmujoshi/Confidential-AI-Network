#!/usr/bin/env node

/**
 * Create Comprehensive Test Data via APIs
 * 
 * This script creates test users, datasets, AI models, contracts, and environments
 * using only the public APIs (registration, login, and data creation endpoints).
 * No direct database or Keycloak access - everything goes through the API layer.
 */

const axios = require('axios');

// Load centralized configuration from config.env
const { loadConfig } = require('../load-config.js');
loadConfig();

// Configuration from config.env
const API_BASE_URL = process.env.BACKEND_URL;
const DEFAULT_PASSWORD = 'TestPassword123!';

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

// Test users configuration
const testUsers = [
  {
    name: 'MedData Solutions Inc.',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    organization: 'MedData Solutions Inc.',
    description: 'Healthcare data provider specializing in medical imaging datasets'
  },
  {
    name: 'NLP Research Foundation',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    organization: 'NLP Research Foundation',
    description: 'Natural language processing datasets for research and development'
  },
  {
    name: 'AutoDrive Technologies',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    organization: 'AutoDrive Technologies',
    description: 'Autonomous vehicle training data and sensor datasets'
  },
  {
    name: 'AI Healthcare Innovations',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    organization: 'AI Healthcare Innovations',
    description: 'AI-powered healthcare solutions company'
  },
  {
    name: 'FinTech Analytics Corp',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    organization: 'FinTech Analytics Corp',
    description: 'Financial technology and analytics solutions'
  },
  {
    name: 'Language AI Labs',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    organization: 'Language AI Labs',
    description: 'Advanced language AI research and development'
  },
  {
    name: 'SecureCloud Confidential Computing',
    email: 'tsp.securecloud@example.com',
    partyType: 'TSP',
    organization: 'SecureCloud Confidential Computing',
    description: 'Secure cloud infrastructure for confidential computing'
  },
  {
    name: 'TrustedAI Environment Provider',
    email: 'tsp.trustedai@example.com',
    partyType: 'TSP',
    organization: 'TrustedAI Environment Provider',
    description: 'Trusted AI training environments with security guarantees'
  },
  {
    name: 'PrivacyFirst Computing Solutions',
    email: 'tsp.privacyfirst@example.com',
    partyType: 'TSP',
    organization: 'PrivacyFirst Computing Solutions',
    description: 'Privacy-first computing infrastructure and services'
  },
  {
    name: 'System Administrator',
    email: 'admin.system@example.com',
    partyType: 'AppAdmin',
    organization: 'Contract Management System',
    description: 'System administrator for contract management platform'
  }
];

// Store created data
const createdData = {
  users: [],
  datasets: [],
  aiModels: [],
  contracts: [],
  environments: []
};

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

/**
 * User Management Functions
 */
async function registerUser(userData) {
  try {
    log(`📝 Registering user: ${userData.email} (${userData.partyType})`, 'blue');
    
    const response = await APIHelper.makeRequest('POST', '/api/auth/register', userData);
    
    if (response.success && response.data.success) {
      const user = response.data.user;
      const credentials = response.data.loginCredentials;
      
      log(`✅ User registered: ${user.name}`, 'green');
      log(`   Email: ${user.email}`, 'cyan');
      log(`   Password: ${credentials.password}`, 'cyan');
      log(`   DEPA ID: ${user.depaId}`, 'cyan');
      
      createdData.users.push({
        ...user,
        password: credentials.password,
        accessToken: null
      });
      
      return { success: true, user, credentials };
    } else {
      log(`❌ Registration failed: ${response.error?.error || response.error}`, 'red');
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`❌ Registration failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    log(`🔐 Logging in user: ${email}`, 'blue');
    
    const response = await APIHelper.makeRequest('POST', '/api/auth/login', {
      email: email,
      password: password
    });
    
    if (response.success && response.data.accessToken) {
      log(`✅ Login successful: ${email}`, 'green');
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

/**
 * Data Creation Functions
 */
async function createDataset(user, accessToken) {
  if (user.partyType !== 'TDP') {
    log(`⏭️ Skipping dataset creation for ${user.partyType} user`, 'yellow');
    return { success: true, message: 'Not a TDP user' };
  }
  
  try {
    log(`📊 Creating dataset for TDP user: ${user.email}`, 'blue');
    
    const datasetData = {
      name: `Medical Dataset - ${user.organization}`,
      description: `Comprehensive medical dataset from ${user.organization} for AI training`,
      dataType: 'TRAINING_DATA',
      category: 'HEALTHCARE',
      size: '50000',
      format: 'CSV',
      location: 'AWS S3',
      accessLevel: 'RESTRICTED',
      compliance: ['GDPR', 'HIPAA', 'SOC2'],
      metadata: {
        source: user.organization,
        created: new Date().toISOString(),
        version: '1.0',
        quality: 'High',
        anonymized: true
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/datasets', datasetData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ Dataset created: ${response.data.dataset.name}`, 'green');
      createdData.datasets.push(response.data.dataset);
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
      name: `AI Model - ${user.organization}`,
      description: `Advanced AI model developed by ${user.organization}`,
      modelType: 'MACHINE_LEARNING',
      algorithm: 'DEEP_LEARNING',
      framework: 'TENSORFLOW',
      version: '2.1.0',
      performance: {
        accuracy: 0.94,
        precision: 0.91,
        recall: 0.89,
        f1Score: 0.90
      },
      metadata: {
        source: user.organization,
        created: new Date().toISOString(),
        trainingData: 'Multiple datasets',
        validationMethod: 'Cross-validation'
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/ai-models', modelData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ AI model created: ${response.data.model.name}`, 'green');
      createdData.aiModels.push(response.data.model);
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
      name: `Secure Environment - ${user.organization}`,
      description: `Confidential computing environment provided by ${user.organization}`,
      environmentType: 'CONFIDENTIAL_COMPUTING',
      infrastructure: 'AZURE_CONFIDENTIAL_COMPUTING',
      securityLevel: 'HIGH',
      compliance: ['SOC2', 'ISO27001', 'FEDRAMP'],
      capabilities: ['GPU_ACCELERATION', 'SECURE_ENCLAVES', 'ENCRYPTED_STORAGE'],
      metadata: {
        provider: user.organization,
        created: new Date().toISOString(),
        region: 'US-East',
        availability: '99.9%'
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/environments', environmentData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ Environment created: ${response.data.environment.name}`, 'green');
      createdData.environments.push(response.data.environment);
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

async function createContract(tdpUser, tdcUser, tspUser, accessToken) {
  try {
    log(`📋 Creating contract between TDP, TDC, and TSP`, 'blue');
    
    const contractData = {
      title: `Data Sharing Agreement - ${tdpUser.organization} & ${tdcUser.organization}`,
      description: `Comprehensive data sharing agreement for AI model training`,
      parties: [
        { type: 'TDP', userId: tdpUser.id, organization: tdpUser.organization },
        { type: 'TDC', userId: tdcUser.id, organization: tdcUser.organization },
        { type: 'TSP', userId: tspUser.id, organization: tspUser.organization }
      ],
      terms: {
        dataUsage: 'AI_MODEL_TRAINING',
        duration: '12_MONTHS',
        dataRetention: '6_MONTHS_AFTER_CONTRACT_END',
        confidentiality: 'HIGH',
        compliance: ['GDPR', 'HIPAA', 'SOC2']
      },
      metadata: {
        created: new Date().toISOString(),
        version: '1.0',
        status: 'DRAFT'
      }
    };
    
    const response = await APIHelper.makeRequest('POST', '/api/contracts', contractData, {
      'Authorization': `Bearer ${accessToken}`
    });
    
    if (response.success && response.data.success) {
      log(`✅ Contract created: ${response.data.contract.title}`, 'green');
      createdData.contracts.push(response.data.contract);
      return { success: true, contract: response.data.contract };
    } else {
      log(`❌ Contract creation failed: ${response.error?.error || response.error}`, 'red');
      return { success: false, error: response.error };
    }
  } catch (error) {
    log(`❌ Contract creation failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Main Test Data Creation Function
 */
async function createTestData() {
  try {
    log('🚀 Starting Comprehensive Test Data Creation via APIs', 'bright');
    log('=' .repeat(60), 'cyan');
    
    // Step 1: Check backend health
    log('\n🔍 Step 1: Checking backend health...', 'blue');
    const isHealthy = await APIHelper.checkHealth();
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
    const loggedInUsers = [];
    
    for (const user of createdData.users) {
      const loginResult = await loginUser(user.email, user.password);
      if (loginResult.success) {
        user.accessToken = loginResult.accessToken;
        loggedInUsers.push(user);
        
        // Create role-specific data
        if (user.partyType === 'TDP') {
          await createDataset(user, user.accessToken);
        } else if (user.partyType === 'TDC') {
          await createAIModel(user, user.accessToken);
        } else if (user.partyType === 'TSP') {
          await createEnvironment(user, user.accessToken);
        }
      }
    }
    
    // Step 4: Create contracts between parties
    log('\n🔍 Step 4: Creating contracts...', 'blue');
    const tdpUsers = loggedInUsers.filter(u => u.partyType === 'TDP');
    const tdcUsers = loggedInUsers.filter(u => u.partyType === 'TDC');
    const tspUsers = loggedInUsers.filter(u => u.partyType === 'TSP');
    
    if (tdpUsers.length > 0 && tdcUsers.length > 0 && tspUsers.length > 0) {
      // Create a contract using the first user of each type
      await createContract(tdpUsers[0], tdcUsers[0], tspUsers[0], tdpUsers[0].accessToken);
    }
    
    // Step 5: Summary
    log('\n📊 Test Data Creation Summary', 'bright');
    log('=' .repeat(40), 'cyan');
    log(`✅ Users created: ${createdData.users.length}`, 'green');
    log(`✅ Users logged in: ${loggedInUsers.length}`, 'green');
    log(`✅ Datasets created: ${createdData.datasets.length}`, 'green');
    log(`✅ AI models created: ${createdData.aiModels.length}`, 'green');
    log(`✅ Environments created: ${createdData.environments.length}`, 'green');
    log(`✅ Contracts created: ${createdData.contracts.length}`, 'green');
    
    log('\n👥 Created Users:', 'blue');
    createdData.users.forEach(user => {
      log(`   ${user.partyType}: ${user.name} (${user.email})`, 'cyan');
      log(`   Password: ${user.password}`, 'cyan');
      log(`   DEPA ID: ${user.depaId}`, 'cyan');
      log(`   Login Status: ${user.accessToken ? '✅ Success' : '❌ Failed'}`, user.accessToken ? 'green' : 'red');
      log('');
    });
    
    if (createdData.datasets.length > 0) {
      log('\n📊 Created Datasets:', 'blue');
      createdData.datasets.forEach(dataset => {
        log(`   ${dataset.name} (${dataset.category})`, 'cyan');
      });
    }
    
    if (createdData.aiModels.length > 0) {
      log('\n🤖 Created AI Models:', 'blue');
      createdData.aiModels.forEach(model => {
        log(`   ${model.name} (${model.algorithm})`, 'cyan');
      });
    }
    
    if (createdData.environments.length > 0) {
      log('\n🏗️ Created Environments:', 'blue');
      createdData.environments.forEach(env => {
        log(`   ${env.name} (${env.environmentType})`, 'cyan');
      });
    }
    
    if (createdData.contracts.length > 0) {
      log('\n📋 Created Contracts:', 'blue');
      createdData.contracts.forEach(contract => {
        log(`   ${contract.title}`, 'cyan');
      });
    }
    
    log('\n🎉 Comprehensive test data creation completed!', 'bright');
    log('💡 All users can login with their respective passwords', 'yellow');
    
  } catch (error) {
    log(`❌ Test data creation failed: ${error.message}`, 'red');
  }
}

// Run the test data creation
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData, APIHelper };
