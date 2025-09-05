#!/usr/bin/env node

/**
 * Comprehensive Test Data Creation via APIs Only
 * 
 * This script creates all test data using APIs only, following project rules.
 * It uses Keycloak Admin API and Application APIs to create:
 * - Keycloak realm and users
 * - Application users, datasets, models, and contracts
 * 
 * Usage: node scripts/create-test-data-via-apis.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'https://localhost:8443';
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const TEST_PASSWORD = 'Test123!';

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

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test data definitions
const testUsers = [
  {
    username: 'admin',
    email: 'admin@contractmanagement.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN',
    organization: 'Contract Management System',
    walletAddress: '0x1234567890123456789012345678901234567890'
  },
  {
    username: 'healthcare_tdp',
    email: 'healthcare@tdp.com',
    firstName: 'Healthcare',
    lastName: 'Data Corp',
    role: 'TDP',
    organization: 'Healthcare Data Corporation',
    walletAddress: '0x1111111111111111111111111111111111111111'
  },
  {
    username: 'finance_tdp',
    email: 'finance@tdp.com',
    firstName: 'Financial',
    lastName: 'Analytics Inc',
    role: 'TDP',
    organization: 'Financial Analytics Incorporated',
    walletAddress: '0x2222222222222222222222222222222222222222'
  },
  {
    username: 'research_tdc',
    email: 'research@tdc.com',
    firstName: 'AI Research',
    lastName: 'Institute',
    role: 'TDC',
    organization: 'AI Research Institute',
    walletAddress: '0x4444444444444444444444444444444444444444'
  },
  {
    username: 'tech_tdc',
    email: 'tech@tdc.com',
    firstName: 'Tech',
    lastName: 'Startup Co',
    role: 'TDC',
    organization: 'Tech Startup Company',
    walletAddress: '0x5555555555555555555555555555555555555555'
  },
  {
    username: 'secure_ccrp',
    email: 'secure@ccrp.com',
    firstName: 'Secure Compute',
    lastName: 'Solutions',
    role: 'CCRP',
    organization: 'Secure Compute Solutions',
    walletAddress: '0x6666666666666666666666666666666666666666'
  }
];

const testDatasets = [
  {
    datasetId: 'HEALTH-001',
    name: 'Patient Health Records',
    description: 'Anonymized patient health records for medical AI research',
    category: 'HEALTHCARE',
    size: 5000000,
    recordCount: 100000,
    price: 5000.00,
    license: 'Academic',
    tags: ['healthcare', 'medical', 'patient', 'anonymized'],
    metadata: {
      'data_type': 'structured',
      'format': 'CSV',
      'anonymization_level': 'high',
      'compliance': ['HIPAA', 'GDPR']
    }
  },
  {
    datasetId: 'FINANCE-001',
    name: 'Market Trading Data',
    description: 'Historical stock market trading data for financial AI models',
    category: 'FINANCE',
    size: 2000000,
    recordCount: 50000,
    price: 3000.00,
    license: 'Commercial',
    tags: ['finance', 'trading', 'stocks', 'historical'],
    metadata: {
      'data_type': 'time_series',
      'format': 'JSON',
      'time_period': '5_years',
      'update_frequency': 'daily'
    }
  },
  {
    datasetId: 'RETAIL-001',
    name: 'Customer Purchase History',
    description: 'Customer purchase patterns and behavior data',
    category: 'RETAIL',
    size: 1500000,
    recordCount: 75000,
    price: 2500.00,
    license: 'Academic',
    tags: ['retail', 'customer', 'purchases', 'behavior'],
    metadata: {
      'data_type': 'transactional',
      'format': 'CSV',
      'time_period': '2_years',
      'anonymization_level': 'medium'
    }
  }
];

const testModels = [
  {
    modelId: 'MODEL-001',
    name: 'Medical Image Classifier',
    description: 'Deep learning model for medical image classification',
    category: 'HEALTHCARE',
    framework: 'TensorFlow',
    version: '1.0.0',
    size: 500000000,
    accuracy: 0.95,
    price: 10000.00,
    license: 'Academic',
    tags: ['medical', 'imaging', 'classification', 'deep-learning'],
    metadata: {
      'input_format': 'DICOM',
      'output_classes': 10,
      'training_data_size': '50GB',
      'validation_accuracy': 0.95
    }
  },
  {
    modelId: 'MODEL-002',
    name: 'Financial Risk Predictor',
    description: 'Machine learning model for financial risk assessment',
    category: 'FINANCE',
    framework: 'PyTorch',
    version: '2.1.0',
    size: 200000000,
    accuracy: 0.88,
    price: 8000.00,
    license: 'Commercial',
    tags: ['finance', 'risk', 'prediction', 'machine-learning'],
    metadata: {
      'input_features': 50,
      'output_type': 'probability',
      'training_period': '3_years',
      'validation_accuracy': 0.88
    }
  }
];

class TestDataCreator {
  constructor() {
    this.adminToken = null;
    this.userTokens = {};
  }

  async getKeycloakAdminToken() {
    try {
      log('🔐 Getting Keycloak admin token...', 'blue');
      
      const response = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: 'admin',
          password: 'admin123',
          grant_type: 'password',
          client_id: 'admin-cli'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        }
      );

      this.adminToken = response.data.access_token;
      log('✅ Keycloak admin token obtained', 'green');
      return this.adminToken;
    } catch (error) {
      log(`❌ Failed to get Keycloak admin token: ${error.message}`, 'red');
      throw error;
    }
  }

  async createKeycloakRealm() {
    try {
      log('🏰 Creating Keycloak realm...', 'blue');
      
      const realmConfig = {
        realm: 'contract-management',
        displayName: 'Contract Management System',
        enabled: true,
        registrationAllowed: false,
        loginWithEmailAllowed: true,
        duplicateEmailsAllowed: false,
        resetPasswordAllowed: true,
        editUsernameAllowed: false,
        bruteForceProtected: true,
        permanentLockout: false,
        maxFailureWaitSeconds: 900,
        minimumQuickLoginWaitSeconds: 60,
        waitIncrementSeconds: 60,
        quickLoginCheckMilliSeconds: 1000,
        maxDeltaTimeSeconds: 43200,
        failureFactor: 30
      };

      await axios.post(`${KEYCLOAK_URL}/admin/realms`, realmConfig, {
        headers: { 'Authorization': `Bearer ${this.adminToken}` },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });

      log('✅ Keycloak realm created', 'green');
    } catch (error) {
      if (error.response?.status === 409) {
        log('⚠️ Keycloak realm already exists', 'yellow');
      } else {
        log(`❌ Failed to create Keycloak realm: ${error.message}`, 'red');
        throw error;
      }
    }
  }

  async createKeycloakUsers() {
    try {
      log('👥 Creating Keycloak users...', 'blue');
      
      for (const user of testUsers) {
        try {
          const userConfig = {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            enabled: true,
            emailVerified: true,
            credentials: [{
              type: 'password',
              value: TEST_PASSWORD,
              temporary: false
            }]
          };

          await axios.post(`${KEYCLOAK_URL}/admin/realms/contract-management/users`, userConfig, {
            headers: { 'Authorization': `Bearer ${this.adminToken}` },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
          });

          log(`✅ Created user: ${user.username}`, 'green');
          await delay(500); // Rate limiting
        } catch (error) {
          if (error.response?.status === 409) {
            log(`⚠️ User ${user.username} already exists`, 'yellow');
          } else {
            log(`❌ Failed to create user ${user.username}: ${error.message}`, 'red');
          }
        }
      }
    } catch (error) {
      log(`❌ Failed to create Keycloak users: ${error.message}`, 'red');
      throw error;
    }
  }

  async checkBackendHealth() {
    try {
      log('🔍 Checking backend health...', 'blue');
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
      log('✅ Backend is healthy', 'green');
      return true;
    } catch (error) {
      log(`❌ Backend is not responding: ${error.message}`, 'red');
      return false;
    }
  }

  async createApplicationUsers() {
    try {
      log('👤 Creating application users via API...', 'blue');
      
      for (const user of testUsers) {
        try {
          const userData = {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            partyType: user.role,
            organization: user.organization,
            walletAddress: user.walletAddress,
            isActive: true
          };

          const response = await axios.post(`${API_BASE_URL}/users`, userData, {
            headers: { 'Content-Type': 'application/json' }
          });

          log(`✅ Created application user: ${user.email}`, 'green');
          await delay(500);
        } catch (error) {
          if (error.response?.status === 409) {
            log(`⚠️ Application user ${user.email} already exists`, 'yellow');
          } else {
            log(`❌ Failed to create application user ${user.email}: ${error.message}`, 'red');
          }
        }
      }
    } catch (error) {
      log(`❌ Failed to create application users: ${error.message}`, 'red');
      throw error;
    }
  }

  async createTestDatasets() {
    try {
      log('📊 Creating test datasets via API...', 'blue');
      
      for (const dataset of testDatasets) {
        try {
          const response = await axios.post(`${API_BASE_URL}/datasets`, dataset, {
            headers: { 'Content-Type': 'application/json' }
          });

          log(`✅ Created dataset: ${dataset.name}`, 'green');
          await delay(500);
        } catch (error) {
          log(`❌ Failed to create dataset ${dataset.name}: ${error.message}`, 'red');
        }
      }
    } catch (error) {
      log(`❌ Failed to create test datasets: ${error.message}`, 'red');
      throw error;
    }
  }

  async createTestModels() {
    try {
      log('🤖 Creating test AI models via API...', 'blue');
      
      for (const model of testModels) {
        try {
          const response = await axios.post(`${API_BASE_URL}/ai-models`, model, {
            headers: { 'Content-Type': 'application/json' }
          });

          log(`✅ Created AI model: ${model.name}`, 'green');
          await delay(500);
        } catch (error) {
          log(`❌ Failed to create AI model ${model.name}: ${error.message}`, 'red');
        }
      }
    } catch (error) {
      log(`❌ Failed to create test AI models: ${error.message}`, 'red');
      throw error;
    }
  }

  async run() {
    try {
      log('🚀 Starting comprehensive test data creation via APIs...', 'bright');
      log('=' .repeat(60), 'cyan');

      // Step 1: Setup Keycloak
      await this.getKeycloakAdminToken();
      await this.createKeycloakRealm();
      await this.createKeycloakUsers();

      // Step 2: Check if backend is available
      const backendHealthy = await this.checkBackendHealth();
      
      if (backendHealthy) {
        // Step 3: Create application data via APIs
        await this.createApplicationUsers();
        await this.createTestDatasets();
        await this.createTestModels();
        
        log('=' .repeat(60), 'cyan');
        log('🎉 Test data creation completed successfully!', 'green');
        log('📋 Summary:', 'blue');
        log(`   • Keycloak realm: contract-management`, 'green');
        log(`   • Users created: ${testUsers.length}`, 'green');
        log(`   • Datasets created: ${testDatasets.length}`, 'green');
        log(`   • AI models created: ${testModels.length}`, 'green');
      } else {
        log('=' .repeat(60), 'cyan');
        log('⚠️ Backend is not available - Keycloak setup completed only', 'yellow');
        log('📋 Keycloak Summary:', 'blue');
        log(`   • Realm: contract-management`, 'green');
        log(`   • Users created: ${testUsers.length}`, 'green');
        log('💡 Run this script again once the backend is running to create application data', 'yellow');
      }

    } catch (error) {
      log(`❌ Test data creation failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  const creator = new TestDataCreator();
  creator.run();
}

module.exports = TestDataCreator;
