#!/usr/bin/env node

/**
 * Common Test Data for All Test Suites (Node.js)
 * Provides standardized test data that all Node.js test scripts can use
 * Ensures consistency across all test suites
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load centralized configuration
require('./load-config.js');

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

// Test data storage
let testData = {
  users: {},
  credentials: {},
  datasets: {},
  aiModels: {},
  contracts: {},
  environments: {},
  tokens: {}
};

// Configuration
const API_BASE_URL = process.env.BACKEND_URL;

/**
 * Initialize test data
 */
async function initTestData() {
  log('📋 Initializing Common Test Data', 'blue');
  log('==================================', 'cyan');
  
  // Check if test data already exists
  if (fs.existsSync('test-data-cache.json')) {
    log('✅ Loading cached test data', 'green');
    loadCachedTestData();
    return true;
  }
  
  log('⚠️ No cached test data found. Creating fresh test data...', 'yellow');
  await createFreshTestData();
  return true;
}

/**
 * Create fresh test data via APIs
 */
async function createFreshTestData() {
  log('🔄 Creating fresh test data via registration API', 'blue');
  
  try {
    // Create test users
    await createTestUsers();
    
    // Create test datasets
    await createTestDatasets();
    
    // Create test AI models
    await createTestAIModels();
    
    // Create test contracts
    await createTestContracts();
    
    // Create test environments
    await createTestEnvironments();
    
    // Cache the test data
    cacheTestData();
    
    log('✅ Fresh test data created and cached', 'green');
  } catch (error) {
    log(`❌ Failed to create test data: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Create test users via registration API
 */
async function createTestUsers() {
  log('👥 Creating test users...', 'blue');
  
  const users = [
    {
      type: 'tdp',
      data: {
        name: 'TDP Test User',
        email: 'tdp.test@example.com',
        partyType: 'TDP',
        organization: 'TDP Test Organization',
        description: 'Test TDP user for all test suites'
      }
    },
    {
      type: 'tdc',
      data: {
        name: 'TDC Test User',
        email: 'tdc.test@example.com',
        partyType: 'TDC',
        organization: 'TDC Test Organization',
        description: 'Test TDC user for all test suites'
      }
    },
    {
      type: 'tsp',
      data: {
        name: 'TSP Test User',
        email: 'tsp.test@example.com',
        partyType: 'TSP',
        organization: 'TSP Test Organization',
        description: 'Test TSP user for all test suites'
      }
    },
    {
      type: 'admin',
      data: {
        name: 'Admin Test User',
        email: 'admin.test@example.com',
        partyType: 'AppAdmin',
        organization: 'Admin Test Organization',
        description: 'Test Admin user for all test suites'
      }
    }
  ];
  
  for (const user of users) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, user.data, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.success) {
        testData.users[user.type] = user.data.email;
        testData.credentials[user.type] = response.data.loginCredentials.password;
        log(`✅ ${user.type.toUpperCase()} user created: ${user.data.email}`, 'green');
      } else {
        log(`❌ Failed to create ${user.type} user: ${response.data.error}`, 'red');
      }
    } catch (error) {
      log(`❌ Failed to create ${user.type} user: ${error.message}`, 'red');
    }
  }
}

/**
 * Create test datasets
 */
async function createTestDatasets() {
  log('📊 Creating test datasets...', 'blue');
  
  const tdpToken = await getUserToken('tdp');
  if (!tdpToken) {
    log('❌ Cannot create datasets without TDP user token', 'red');
    return;
  }
  
  const datasets = [
    {
      type: 'medical',
      data: {
        name: 'Medical Records Dataset',
        description: 'Anonymized medical records for AI training',
        dataType: 'TRAINING_DATA',
        category: 'HEALTHCARE',
        size: '10000',
        format: 'CSV',
        location: 'AWS S3',
        accessLevel: 'RESTRICTED',
        compliance: ['HIPAA', 'GDPR'],
        metadata: {
          source: 'Hospital Records',
          created: new Date().toISOString(),
          version: '1.0',
          anonymized: true
        }
      }
    },
    {
      type: 'financial',
      data: {
        name: 'Financial Transactions Dataset',
        description: 'Anonymized financial transaction data',
        dataType: 'TRAINING_DATA',
        category: 'FINANCE',
        size: '50000',
        format: 'JSON',
        location: 'Azure Blob',
        accessLevel: 'CONFIDENTIAL',
        compliance: ['PCI-DSS', 'SOX'],
        metadata: {
          source: 'Bank Transactions',
          created: new Date().toISOString(),
          version: '1.0',
          anonymized: true
        }
      }
    }
  ];
  
  for (const dataset of datasets) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/datasets`, dataset.data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tdpToken}`
        }
      });
      
      if (response.data.success) {
        testData.datasets[dataset.type] = response.data.dataset.id;
        log(`✅ ${dataset.type} dataset created: ${response.data.dataset.id}`, 'green');
      } else {
        log(`❌ Failed to create ${dataset.type} dataset: ${response.data.error}`, 'red');
      }
    } catch (error) {
      log(`❌ Failed to create ${dataset.type} dataset: ${error.message}`, 'red');
    }
  }
}

/**
 * Create test AI models
 */
async function createTestAIModels() {
  log('🤖 Creating test AI models...', 'blue');
  
  const tdcToken = await getUserToken('tdc');
  if (!tdcToken) {
    log('❌ Cannot create AI models without TDC user token', 'red');
    return;
  }
  
  const models = [
    {
      type: 'medical_diagnosis',
      data: {
        name: 'Medical Diagnosis Model',
        description: 'AI model for medical diagnosis prediction',
        modelType: 'MACHINE_LEARNING',
        algorithm: 'RANDOM_FOREST',
        framework: 'SCIKIT_LEARN',
        version: '1.0.0',
        performance: {
          accuracy: 0.95,
          precision: 0.92,
          recall: 0.88,
          f1Score: 0.90
        },
        metadata: {
          source: 'Medical Records Dataset',
          created: new Date().toISOString(),
          trainingData: 'Medical Records',
          validationSplit: 0.2
        }
      }
    },
    {
      type: 'fraud_detection',
      data: {
        name: 'Fraud Detection Model',
        description: 'AI model for detecting fraudulent transactions',
        modelType: 'DEEP_LEARNING',
        algorithm: 'NEURAL_NETWORK',
        framework: 'TENSORFLOW',
        version: '2.1.0',
        performance: {
          accuracy: 0.98,
          precision: 0.96,
          recall: 0.94,
          f1Score: 0.95
        },
        metadata: {
          source: 'Financial Transactions Dataset',
          created: new Date().toISOString(),
          trainingData: 'Financial Transactions',
          validationSplit: 0.15
        }
      }
    }
  ];
  
  for (const model of models) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai-models`, model.data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tdcToken}`
        }
      });
      
      if (response.data.success) {
        testData.aiModels[model.type] = response.data.model.id;
        log(`✅ ${model.type} model created: ${response.data.model.id}`, 'green');
      } else {
        log(`❌ Failed to create ${model.type} model: ${response.data.error}`, 'red');
      }
    } catch (error) {
      log(`❌ Failed to create ${model.type} model: ${error.message}`, 'red');
    }
  }
}

/**
 * Create test contracts
 */
async function createTestContracts() {
  log('📋 Creating test contracts...', 'blue');
  
  const tdpToken = await getUserToken('tdp');
  const tdcToken = await getUserToken('tdc');
  
  if (!tdpToken || !tdcToken) {
    log('❌ Cannot create contracts without user tokens', 'red');
    return;
  }
  
  const contracts = [
    {
      type: 'medical_sharing',
      data: {
        title: 'Medical Data Sharing Agreement',
        description: 'Contract for sharing medical records dataset for AI training',
        contractType: 'DATA_SHARING',
        parties: {
          provider: 'TDP Test Organization',
          consumer: 'TDC Test Organization'
        },
        dataAssets: [testData.datasets.medical],
        aiModels: [testData.aiModels.medical_diagnosis],
        terms: {
          duration: '12 months',
          dataUsage: 'AI training only',
          confidentiality: 'strict',
          compliance: ['HIPAA', 'GDPR']
        },
        status: 'DRAFT'
      }
    }
  ];
  
  for (const contract of contracts) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/contracts`, contract.data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tdpToken}`
        }
      });
      
      if (response.data.success) {
        testData.contracts[contract.type] = response.data.contract.id;
        log(`✅ ${contract.type} contract created: ${response.data.contract.id}`, 'green');
      } else {
        log(`❌ Failed to create ${contract.type} contract: ${response.data.error}`, 'red');
      }
    } catch (error) {
      log(`❌ Failed to create ${contract.type} contract: ${error.message}`, 'red');
    }
  }
}

/**
 * Create test environments
 */
async function createTestEnvironments() {
  log('🏗️ Creating test environments...', 'blue');
  
  const ccrpToken = await getUserToken('tsp');
  if (!ccrpToken) {
    log('❌ Cannot create environments without TSP user token', 'red');
    return;
  }
  
  const environments = [
    {
      type: 'medical_training',
      data: {
        name: 'Medical AI Training Environment',
        description: 'Secure environment for training medical AI models',
        environmentType: 'TRAINING',
        infrastructure: {
          cloudProvider: 'AWS',
          region: 'us-east-1',
          instanceType: 'ml.m5.xlarge',
          storage: '100GB SSD'
        },
        security: {
          encryption: 'AES-256',
          networkIsolation: true,
          accessControl: 'RBAC',
          auditLogging: true
        },
        compliance: ['HIPAA', 'SOC2'],
        status: 'ACTIVE'
      }
    }
  ];
  
  for (const env of environments) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/environments`, env.data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ccrpToken}`
        }
      });
      
      if (response.data.success) {
        testData.environments[env.type] = response.data.environment.id;
        log(`✅ ${env.type} environment created: ${response.data.environment.id}`, 'green');
      } else {
        log(`❌ Failed to create ${env.type} environment: ${response.data.error}`, 'red');
      }
    } catch (error) {
      log(`❌ Failed to create ${env.type} environment: ${error.message}`, 'red');
    }
  }
}

/**
 * Get user access token
 */
async function getUserToken(userType) {
  const email = testData.users[userType];
  const password = testData.credentials[userType];
  
  if (!email || !password) {
    log(`❌ User ${userType} not found in test data`, 'red');
    return null;
  }
  
  // Check if we already have a cached token
  if (testData.tokens[userType]) {
    return testData.tokens[userType];
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: email,
      password: password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.accessToken) {
      testData.tokens[userType] = response.data.accessToken;
      return response.data.accessToken;
    } else {
      log(`❌ Failed to get token for ${userType} user`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Failed to get token for ${userType} user: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Cache test data
 */
function cacheTestData() {
  log('💾 Caching test data...', 'blue');
  
  const cacheData = {
    users: testData.users,
    credentials: testData.credentials,
    datasets: testData.datasets,
    aiModels: testData.aiModels,
    contracts: testData.contracts,
    environments: testData.environments,
    created: new Date().toISOString()
  };
  
  fs.writeFileSync('test-data-cache.json', JSON.stringify(cacheData, null, 2));
  log('✅ Test data cached to test-data-cache.json', 'green');
}

/**
 * Load cached test data
 */
function loadCachedTestData() {
  if (!fs.existsSync('test-data-cache.json')) {
    log('❌ No cached test data found', 'red');
    return false;
  }
  
  try {
    const cacheData = JSON.parse(fs.readFileSync('test-data-cache.json', 'utf8'));
    testData.users = cacheData.users || {};
    testData.credentials = cacheData.credentials || {};
    testData.datasets = cacheData.datasets || {};
    testData.aiModels = cacheData.aiModels || {};
    testData.contracts = cacheData.contracts || {};
    testData.environments = cacheData.environments || {};
    
    log('✅ Cached test data loaded', 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to load cached test data: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Get test user email
 */
function getTestUserEmail(userType) {
  return testData.users[userType];
}

/**
 * Get test user password
 */
function getTestUserPassword(userType) {
  return testData.credentials[userType];
}

/**
 * Get test dataset ID
 */
function getTestDatasetId(datasetType) {
  return testData.datasets[datasetType];
}

/**
 * Get test AI model ID
 */
function getTestAIModelId(modelType) {
  return testData.aiModels[modelType];
}

/**
 * Get test contract ID
 */
function getTestContractId(contractType) {
  return testData.contracts[contractType];
}

/**
 * Get test environment ID
 */
function getTestEnvironmentId(envType) {
  return testData.environments[envType];
}

/**
 * Show test data summary
 */
function showTestDataSummary() {
  log('📋 Test Data Summary', 'blue');
  log('====================', 'cyan');
  log('👥 Users:', 'green');
  Object.entries(testData.users).forEach(([type, email]) => {
    log(`  ${type.toUpperCase()}: ${email}`, 'cyan');
  });
  log('');
  log('📊 Datasets:', 'green');
  Object.entries(testData.datasets).forEach(([type, id]) => {
    log(`  ${type}: ${id}`, 'cyan');
  });
  log('');
  log('🤖 AI Models:', 'green');
  Object.entries(testData.aiModels).forEach(([type, id]) => {
    log(`  ${type}: ${id}`, 'cyan');
  });
  log('');
  log('📋 Contracts:', 'green');
  Object.entries(testData.contracts).forEach(([type, id]) => {
    log(`  ${type}: ${id}`, 'cyan');
  });
  log('');
  log('🏗️ Environments:', 'green');
  Object.entries(testData.environments).forEach(([type, id]) => {
    log(`  ${type}: ${id}`, 'cyan');
  });
  log('====================', 'cyan');
}

/**
 * Clear test data
 */
function clearTestData() {
  log('🗑️ Clearing test data...', 'yellow');
  if (fs.existsSync('test-data-cache.json')) {
    fs.unlinkSync('test-data-cache.json');
  }
  testData = {
    users: {},
    credentials: {},
    datasets: {},
    aiModels: {},
    contracts: {},
    environments: {},
    tokens: {}
  };
  log('✅ Test data cleared', 'green');
}

// Export functions for use in other modules
module.exports = {
  initTestData,
  getUserToken,
  getTestUserEmail,
  getTestUserPassword,
  getTestDatasetId,
  getTestAIModelId,
  getTestContractId,
  getTestEnvironmentId,
  showTestDataSummary,
  clearTestData
};

// Main execution
if (require.main === module) {
  // If script is run directly, initialize test data
  initTestData()
    .then(() => showTestDataSummary())
    .catch(error => {
      log(`❌ Failed to initialize test data: ${error.message}`, 'red');
      process.exit(1);
    });
}
