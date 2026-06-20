#!/usr/bin/env node

/**
 * Simple Test Data Creator
 * 
 * This script creates test data using the existing users and APIs
 * Focuses on creating datasets, contracts, and training environments
 */

const { setTestEnv } = require('../tests/test-env');
const axios = require('axios');
const crypto = require('crypto');

// Set environment
setTestEnv('integration');

// Load configuration
const { loadConfig } = require('./load-config');
const config = loadConfig();

const BASE_URL = `http://localhost:${config.PORT || 5001}`;

class SimpleTestDataCreator {
  constructor() {
    this.authTokens = {};
    this.testUsers = {};
    this.testDatasets = {};
    this.testContracts = {};
  }

  async createAllTestData() {
    console.log('🚀 Starting simple test data creation...');
    console.log(`📡 Using backend URL: ${BASE_URL}`);
    
    try {
      // 1. Login with existing users
      await this.loginExistingUsers();
      
      // 2. Create datasets via TDP users
      await this.createTestDatasets();
      
      // 3. Create contracts via TDC users
      await this.createTestContracts();
      
      console.log('🎉 Test data created successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test data creation failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async loginExistingUsers() {
    console.log('🔐 Logging in existing users...');
    
    const users = [
      { email: 'alice@tdp.com', password: 'password123', partyType: 'TDP' },
      { email: 'bob@tdc.com', password: 'password123', partyType: 'TDC' },
      { email: 'carol@tsp.com', password: 'password123', partyType: 'TSP' },
      { email: 'david@admin.com', password: 'password123', partyType: 'AppAdmin' }
    ];

    for (const user of users) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });
        
        if (response.data.success && response.data.token) {
          this.authTokens[user.email] = response.data.token;
          this.testUsers[user.partyType] = {
            email: user.email,
            partyType: user.partyType,
            token: response.data.token
          };
          console.log(`  ✅ Logged in ${user.partyType}: ${user.email}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to login ${user.email}:`, error.response?.data?.error || error.message);
      }
    }
  }

  async createTestDatasets() {
    console.log('📊 Creating test datasets...');
    
    const tdpUser = this.testUsers.TDP;
    if (!tdpUser || !tdpUser.token) {
      console.log('  ⚠️ No TDP user available for dataset creation');
      return;
    }

    const datasets = [
      {
        datasetId: `DATASET-${crypto.randomUUID()}`,
        name: 'Healthcare Patient Records',
        description: 'Anonymized patient records from major hospitals for AI model training',
        category: 'Healthcare',
        size: '2.5TB',
        recordCount: 1500000,
        price: 50000,
        license: 'Commercial',
        tags: ['healthcare', 'patient-data', 'anonymized', 'ai-training'],
        metadata: {
          source: 'Hospital Network',
          collectionDate: '2024-01-15',
          qualityScore: 0.95,
          completeness: 0.98
        },
        data_classification: 'CONFIDENTIAL',
        secure_enclave_required: true,
        attestation_required: true,
        encryption_algorithm: 'AES-256-GCM',
        encryption_at_rest: true,
        encryption_in_transit: true,
        data_residency_region: 'US-EAST',
        processing_location: 'US-EAST-1',
        cross_border_transfer_allowed: false,
        attestation_policy: {
          provider: 'AWS Nitro Enclaves',
          verification: 'required'
        },
        access_control_policy: {
          rbac: true,
          mfa: true
        },
        retention_policy: {
          duration: '2 years',
          autoDelete: true
        },
        audit_configuration: {
          logging: true,
          monitoring: true
        }
      },
      {
        datasetId: `DATASET-${crypto.randomUUID()}`,
        name: 'Financial Transaction Data',
        description: 'Banking transaction data for fraud detection model training',
        category: 'Finance',
        size: '850GB',
        recordCount: 5000000,
        price: 75000,
        license: 'Commercial',
        tags: ['finance', 'transactions', 'fraud-detection', 'ai-training'],
        metadata: {
          source: 'Major Bank',
          collectionDate: '2024-02-01',
          qualityScore: 0.92,
          completeness: 0.96
        },
        data_classification: 'RESTRICTED',
        secure_enclave_required: true,
        attestation_required: true,
        encryption_algorithm: 'AES-256-GCM',
        encryption_at_rest: true,
        encryption_in_transit: true,
        data_residency_region: 'US-WEST',
        processing_location: 'US-WEST-2',
        cross_border_transfer_allowed: false,
        attestation_policy: {
          provider: 'Azure SGX Enclaves',
          verification: 'required'
        },
        access_control_policy: {
          rbac: true,
          mfa: true
        },
        retention_policy: {
          duration: '1 year',
          autoDelete: true
        },
        audit_configuration: {
          logging: true,
          monitoring: true
        }
      }
    ];

    for (const datasetData of datasets) {
      try {
        // First get the user ID
        const userResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${tdpUser.token}` }
        });
        
        const response = await axios.post(`${BASE_URL}/api/datasets`, {
          ...datasetData,
          ownerId: userResponse.data.user.id,
          isPublic: false,
          confidentialComputingRequired: datasetData.secure_enclave_required
        }, {
          headers: {
            'Authorization': `Bearer ${tdpUser.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          this.testDatasets[response.data.dataset.datasetId] = response.data.dataset;
          console.log(`  ✅ Created dataset: ${datasetData.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create dataset ${datasetData.name}:`, error.response?.data?.error || error.message);
      }
    }
  }

  async createTestContracts() {
    console.log('📋 Creating test contracts...');
    
    const tdcUser = this.testUsers.TDC;
    if (!tdcUser || !tdcUser.token) {
      console.log('  ⚠️ No TDC user available for contract creation');
      return;
    }

    const datasetIds = Object.keys(this.testDatasets);
    if (datasetIds.length === 0) {
      console.log('  ⚠️ No datasets available for contract creation');
      return;
    }

    const contracts = [
      {
        title: 'Healthcare AI Model Training Agreement',
        description: 'Comprehensive contract for training AI models on healthcare patient data',
        datasetSelections: [
          {
            datasetId: datasetIds[0],
            individualPrice: 50000
          }
        ],
        duration: {
          durationValue: 365,
          durationUnit: 'DAYS'
        },
        termsAndConditions: 'This contract governs the use of healthcare data for AI model training. All data must be processed in secure enclaves with continuous attestation.',
        tspId: this.testUsers.TSP?.email ? 'existing' : null,
        contractType: 'AI_TRAINING',
        environmentSpecs: {
          computeRequirements: {
            cpu: '8 vCPUs',
            memory: '32 GB',
            gpu: 'None',
            storage: '500 GB SSD'
          },
          securityRequirements: {
            encryption: 'AES-256',
            networkIsolation: true,
            accessControl: 'RBAC'
          }
        },
        trainingParams: {
          algorithm: 'Random Forest',
          hyperparameters: {
            n_estimators: 100,
            max_depth: 10,
            random_state: 42
          }
        },
        privacyRequirements: {
          differentialPrivacy: true,
          kAnonymity: 5,
          lDiversity: 3
        },
        trainingEnvironment: {
          cloudProvider: 'AWS',
          region: 'us-east-1',
          instanceType: 'ml.m5.2xlarge',
          secureEnclave: 'AWS Nitro Enclaves'
        },
        complianceSpecs: {
          regulations: ['HIPAA', 'GDPR'],
          certifications: ['SOC2', 'ISO27001']
        }
      }
    ];

    for (const contractData of contracts) {
      try {
        const response = await axios.post(`${BASE_URL}/api/contracts/ricardian`, contractData, {
          headers: {
            'Authorization': `Bearer ${tdcUser.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          this.testContracts[response.data.contract.contractId] = response.data.contract;
          console.log(`  ✅ Created contract: ${contractData.title}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create contract ${contractData.title}:`, error.response?.data?.error || error.message);
      }
    }
  }

  printSummary() {
    console.log('\n📋 Simple Test Data Summary:');
    console.log('============================');
    
    Object.entries(this.testUsers).forEach(([type, user]) => {
      console.log(`👥 ${type} User: ${user.email}`);
    });
    
    console.log(`📊 Datasets: ${Object.keys(this.testDatasets).length}`);
    Object.values(this.testDatasets).forEach(dataset => {
      console.log(`   - ${dataset.name} (${dataset.category}) - $${dataset.price}`);
    });
    
    console.log(`📋 Contracts: ${Object.keys(this.testContracts).length}`);
    Object.values(this.testContracts).forEach(contract => {
      console.log(`   - ${contract.title} (${contract.status})`);
    });
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('========================');
    console.log('TDP User: alice@tdp.com / password123');
    console.log('TDC User: bob@tdc.com / password123');
    console.log('TSP User: carol@tsp.com / password123');
    console.log('Admin User: david@admin.com / password123');
    
    console.log('\n🚀 Ready to test the application!');
  }
}

// Run the test data creation
async function main() {
  try {
    const creator = new SimpleTestDataCreator();
    await creator.createAllTestData();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleTestDataCreator;
