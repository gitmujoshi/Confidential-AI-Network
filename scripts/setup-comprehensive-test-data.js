#!/usr/bin/env node

/**
 * Comprehensive Test Data Setup Script
 * 
 * This script creates complete test data using APIs for all roles:
 * - TDP with datasets for ML Training
 * - TDC with initial training models
 * - TSP with training environments
 * - AppAdmin for system management
 * 
 * Uses common config.env and API endpoints only
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

class ComprehensiveTestDataCreator {
  constructor() {
    this.authTokens = {};
    this.testUsers = {};
    this.testDatasets = {};
    this.testContracts = {};
    this.testEnvironments = {};
    this.testJobs = {};
  }

  async createAllTestData() {
    console.log('🚀 Starting comprehensive test data creation using APIs...');
    console.log(`📡 Using backend URL: ${BASE_URL}`);
    
    try {
      // 1. Create test users via registration API
      await this.createTestUsers();
      
      // 2. Login all users to get auth tokens
      await this.loginAllUsers();
      
      // 3. Create datasets via TDP users
      await this.createTestDatasets();
      
      // 4. Create contracts via TDC users
      await this.createTestContracts();
      
      // 5. Create training environments via TSP users
      await this.createTestTrainingEnvironments();
      
      // 6. Create training jobs
      await this.createTestTrainingJobs();
      
      // 7. Create AI models
      await this.createTestAIModels();
      
      // 8. Create notifications
      await this.createTestNotifications();
      
      console.log('🎉 All test data created successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test data creation failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async createTestUsers() {
    console.log('👥 Creating test users via registration API...');
    
    const users = [
      {
        name: 'Alice Johnson',
        email: 'alice@tdp.com',
        password: 'password123',
        partyType: 'TDP',
        organization: 'DataCorp Inc',
        description: 'Leading data provider specializing in healthcare datasets',
        phoneNumber: '+1-555-0101',
        location: 'San Francisco, CA',
        website: 'https://datacorp.com'
      },
      {
        name: 'Bob Smith',
        email: 'bob@tdc.com',
        password: 'password123',
        partyType: 'TDC',
        organization: 'AI Research Labs',
        description: 'AI research company focused on machine learning models',
        phoneNumber: '+1-555-0102',
        location: 'Boston, MA',
        website: 'https://airesearch.com'
      },
      {
        name: 'Carol Davis',
        email: 'carol@tsp.com',
        password: 'password123',
        partyType: 'TSP',
        organization: 'SecureCompute Solutions',
        description: 'Confidential computing infrastructure provider',
        phoneNumber: '+1-555-0103',
        location: 'Austin, TX',
        website: 'https://securecompute.com'
      },
      {
        name: 'David Wilson',
        email: 'david@admin.com',
        password: 'password123',
        partyType: 'AppAdmin',
        organization: 'Contract Management Corp',
        description: 'System administrator for the contract management platform',
        phoneNumber: '+1-555-0104',
        location: 'New York, NY',
        website: 'https://contractmgmt.com'
      },
      {
        name: 'Eve Brown',
        email: 'eve@tdp2.com',
        password: 'password123',
        partyType: 'TDP',
        organization: 'Financial Data Co',
        description: 'Financial data provider with banking and trading datasets',
        phoneNumber: '+1-555-0105',
        location: 'Chicago, IL',
        website: 'https://financialdata.com'
      },
      {
        name: 'Frank Miller',
        email: 'frank@tdc2.com',
        password: 'password123',
        partyType: 'TDC',
        organization: 'TechStartup Inc',
        description: 'Startup developing AI-powered analytics solutions',
        phoneNumber: '+1-555-0106',
        location: 'Seattle, WA',
        website: 'https://techstartup.com'
      }
    ];

    for (const userData of users) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
        
        if (response.data.success) {
          this.testUsers[userData.partyType] = this.testUsers[userData.partyType] || [];
          this.testUsers[userData.partyType].push({
            ...userData,
            id: response.data.user.id,
            depaId: response.data.user.depaId
          });
          console.log(`  ✅ Created ${userData.partyType}: ${userData.name} (${userData.email})`);
        }
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`  ⚠️ User ${userData.email} already exists, will use existing`);
          // Try to get user info for existing user
          this.testUsers[userData.partyType] = this.testUsers[userData.partyType] || [];
          this.testUsers[userData.partyType].push({
            ...userData,
            id: 'existing',
            depaId: `${userData.partyType}-existing`
          });
        } else {
          console.log(`  ❌ Failed to create user ${userData.email}:`, error.response?.data?.error || error.message);
        }
      }
    }
  }

  async loginAllUsers() {
    console.log('🔐 Logging in all users to get auth tokens...');
    
    for (const [partyType, users] of Object.entries(this.testUsers)) {
      for (const user of users) {
        try {
          const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: user.email,
            password: user.password
          });
          
          if (response.data.success && response.data.token) {
            this.authTokens[user.email] = response.data.token;
            console.log(`  ✅ Logged in ${partyType}: ${user.name}`);
          }
        } catch (error) {
          console.log(`  ❌ Failed to login ${user.email}:`, error.response?.data?.error || error.message);
        }
      }
    }
  }

  async createTestDatasets() {
    console.log('📊 Creating test datasets via TDP users...');
    
    const datasets = [
      {
        name: 'Healthcare Patient Records',
        description: 'Anonymized patient records from major hospitals for AI model training',
        category: 'Healthcare',
        size: '2.5TB',
        recordCount: 1500000,
        price: 50000,
        license: 'Commercial',
        tags: ['healthcare', 'patient-data', 'anonymized', 'medical-records', 'ai-training'],
        metadata: {
          source: 'Hospital Network',
          collectionDate: '2024-01-15',
          lastUpdated: '2024-09-01',
          qualityScore: 0.95,
          completeness: 0.98,
          dataFormat: 'CSV',
          encoding: 'UTF-8'
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
          verification: 'required',
          frequency: 'continuous'
        },
        access_control_policy: {
          rbac: true,
          mfa: true,
          ipWhitelist: false
        },
        retention_policy: {
          duration: '2 years',
          autoDelete: true,
          archive: true
        },
        audit_configuration: {
          logging: true,
          monitoring: true,
          alerts: true
        }
      },
      {
        name: 'Financial Transaction Data',
        description: 'Banking transaction data for fraud detection model training',
        category: 'Finance',
        size: '850GB',
        recordCount: 5000000,
        price: 75000,
        license: 'Commercial',
        tags: ['finance', 'transactions', 'fraud-detection', 'banking', 'ai-training'],
        metadata: {
          source: 'Major Bank',
          collectionDate: '2024-02-01',
          lastUpdated: '2024-09-10',
          qualityScore: 0.92,
          completeness: 0.96,
          dataFormat: 'Parquet',
          encoding: 'UTF-8'
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
          verification: 'required',
          frequency: 'continuous'
        },
        access_control_policy: {
          rbac: true,
          mfa: true,
          ipWhitelist: true
        },
        retention_policy: {
          duration: '1 year',
          autoDelete: true,
          archive: false
        },
        audit_configuration: {
          logging: true,
          monitoring: true,
          alerts: true
        }
      },
      {
        name: 'E-commerce Customer Behavior',
        description: 'Online shopping behavior and preferences for recommendation systems',
        category: 'E-commerce',
        size: '1.2TB',
        recordCount: 3000000,
        price: 25000,
        license: 'Commercial',
        tags: ['ecommerce', 'customer-behavior', 'shopping', 'preferences', 'recommendation'],
        metadata: {
          source: 'Online Retailer',
          collectionDate: '2024-03-01',
          lastUpdated: '2024-09-05',
          qualityScore: 0.88,
          completeness: 0.94,
          dataFormat: 'JSON',
          encoding: 'UTF-8'
        },
        data_classification: 'INTERNAL',
        secure_enclave_required: false,
        attestation_required: false,
        encryption_algorithm: 'AES-256-GCM',
        encryption_at_rest: true,
        encryption_in_transit: true,
        data_residency_region: 'US-CENTRAL',
        processing_location: 'US-CENTRAL-1',
        cross_border_transfer_allowed: true,
        attestation_policy: {
          provider: 'None',
          verification: 'none',
          frequency: 'none'
        },
        access_control_policy: {
          rbac: true,
          mfa: false,
          ipWhitelist: false
        },
        retention_policy: {
          duration: '6 months',
          autoDelete: true,
          archive: false
        },
        audit_configuration: {
          logging: true,
          monitoring: false,
          alerts: false
        }
      },
      {
        name: 'IoT Sensor Data',
        description: 'Industrial IoT sensor readings from manufacturing for predictive maintenance',
        category: 'Manufacturing',
        size: '3.1TB',
        recordCount: 10000000,
        price: 40000,
        license: 'Commercial',
        tags: ['iot', 'sensors', 'manufacturing', 'time-series', 'predictive-maintenance'],
        metadata: {
          source: 'Manufacturing Plant',
          collectionDate: '2024-04-01',
          lastUpdated: '2024-09-12',
          qualityScore: 0.90,
          completeness: 0.97,
          dataFormat: 'TimeSeries',
          encoding: 'UTF-8'
        },
        data_classification: 'INTERNAL',
        secure_enclave_required: false,
        attestation_required: false,
        encryption_algorithm: 'AES-256-GCM',
        encryption_at_rest: true,
        encryption_in_transit: true,
        data_residency_region: 'US-EAST',
        processing_location: 'US-EAST-1',
        cross_border_transfer_allowed: true,
        attestation_policy: {
          provider: 'None',
          verification: 'none',
          frequency: 'none'
        },
        access_control_policy: {
          rbac: true,
          mfa: false,
          ipWhitelist: false
        },
        retention_policy: {
          duration: '1 year',
          autoDelete: true,
          archive: true
        },
        audit_configuration: {
          logging: true,
          monitoring: true,
          alerts: false
        }
      }
    ];

    for (let i = 0; i < datasets.length; i++) {
      const datasetData = datasets[i];
      const tdpUser = this.testUsers.TDP[i % this.testUsers.TDP.length];
      const authToken = this.authTokens[tdpUser.email];
      
      if (!authToken) {
        console.log(`  ⚠️ No auth token for TDP user ${tdpUser.email}, skipping dataset`);
        continue;
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/datasets`, {
          ...datasetData,
          datasetId: `DATASET-${crypto.randomUUID()}`,
          ownerId: tdpUser.id,
          isPublic: false,
          confidentialComputingRequired: datasetData.secure_enclave_required
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          this.testDatasets[response.data.dataset.datasetId] = response.data.dataset;
          console.log(`  ✅ Created dataset: ${datasetData.name} (${datasetData.category})`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create dataset ${datasetData.name}:`, error.response?.data?.error || error.message);
      }
    }
  }

  async createTestContracts() {
    console.log('📋 Creating test contracts via TDC users...');
    
    const datasetIds = Object.keys(this.testDatasets);
    if (datasetIds.length === 0) {
      console.log('  ⚠️ No datasets available for contract creation');
      return;
    }

    const contracts = [
      {
        title: 'Healthcare AI Model Training Agreement',
        description: 'Comprehensive contract for training AI models on healthcare patient data with full privacy protection',
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
        termsAndConditions: 'This contract governs the use of healthcare data for AI model training. All data must be processed in secure enclaves with continuous attestation. Models trained must comply with HIPAA and GDPR regulations.',
        tspId: this.testUsers.TSP[0].id,
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
          },
          validationSplit: 0.2,
          testSplit: 0.1
        },
        privacyRequirements: {
          differentialPrivacy: true,
          kAnonymity: 5,
          lDiversity: 3,
          tCloseness: 0.1
        },
        trainingEnvironment: {
          cloudProvider: 'AWS',
          region: 'us-east-1',
          instanceType: 'ml.m5.2xlarge',
          secureEnclave: 'AWS Nitro Enclaves'
        },
        complianceSpecs: {
          regulations: ['HIPAA', 'GDPR'],
          certifications: ['SOC2', 'ISO27001'],
          auditRequirements: true
        },
        kmsConfigs: {
          encryptionKey: 'kms-key-healthcare-001',
          keyRotation: '90 days',
          keyBackup: true
        }
      },
      {
        title: 'Financial Fraud Detection Model Contract',
        description: 'Contract for developing fraud detection models using banking transaction data',
        datasetSelections: [
          {
            datasetId: datasetIds[1],
            individualPrice: 75000
          }
        ],
        duration: {
          durationValue: 180,
          durationUnit: 'DAYS'
        },
        termsAndConditions: 'This contract governs the use of financial transaction data for fraud detection model training. All processing must occur in secure enclaves with continuous monitoring and audit trails.',
        tspId: this.testUsers.TSP[0].id,
        contractType: 'AI_TRAINING',
        environmentSpecs: {
          computeRequirements: {
            cpu: '8 vCPUs',
            memory: '32 GB',
            gpu: 'None',
            storage: '1 TB SSD'
          },
          securityRequirements: {
            encryption: 'AES-256',
            networkIsolation: true,
            accessControl: 'RBAC'
          }
        },
        trainingParams: {
          algorithm: 'XGBoost',
          hyperparameters: {
            n_estimators: 200,
            max_depth: 8,
            learning_rate: 0.1
          },
          validationSplit: 0.2,
          testSplit: 0.1
        },
        privacyRequirements: {
          differentialPrivacy: true,
          kAnonymity: 10,
          lDiversity: 5,
          tCloseness: 0.05
        },
        trainingEnvironment: {
          cloudProvider: 'Azure',
          region: 'eastus',
          instanceType: 'Standard_D8s_v3',
          secureEnclave: 'Azure SGX Enclaves'
        },
        complianceSpecs: {
          regulations: ['SOX', 'PCI-DSS'],
          certifications: ['SOC2', 'ISO27001'],
          auditRequirements: true
        },
        kmsConfigs: {
          encryptionKey: 'kms-key-financial-001',
          keyRotation: '30 days',
          keyBackup: true
        }
      }
    ];

    for (let i = 0; i < contracts.length; i++) {
      const contractData = contracts[i];
      const tdcUser = this.testUsers.TDC[i % this.testUsers.TDC.length];
      const authToken = this.authTokens[tdcUser.email];
      
      if (!authToken) {
        console.log(`  ⚠️ No auth token for TDC user ${tdcUser.email}, skipping contract`);
        continue;
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/contracts/ricardian`, contractData, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
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

  async createTestTrainingEnvironments() {
    console.log('🏗️ Creating test training environments via TSP users...');
    
    const contractIds = Object.keys(this.testContracts);
    if (contractIds.length === 0) {
      console.log('  ⚠️ No contracts available for environment creation');
      return;
    }

    const environments = [
      {
        contractId: contractIds[0],
        config: {
          name: 'Healthcare Training Environment',
          environmentType: 'CLOUD',
          provisioningMethod: 'AUTOMATED',
          cloudProvider: 'AWS',
          region: 'us-east-1',
          instanceType: 'ml.m5.2xlarge',
          resourceSpecs: {
            cpu: '8 vCPUs',
            memory: '32 GB',
            gpu: 'None',
            storage: '500 GB SSD'
          },
          securityConfig: {
            encryption: 'AES-256',
            networkIsolation: true,
            accessControl: 'RBAC'
          },
          attestationData: {
            provider: 'AWS Nitro Enclaves',
            verified: true,
            timestamp: new Date().toISOString()
          }
        }
      },
      {
        contractId: contractIds[1],
        config: {
          name: 'Financial Training Environment',
          environmentType: 'CLOUD',
          provisioningMethod: 'AUTOMATED',
          cloudProvider: 'Azure',
          region: 'eastus',
          instanceType: 'Standard_D8s_v3',
          resourceSpecs: {
            cpu: '8 vCPUs',
            memory: '32 GB',
            gpu: 'None',
            storage: '1 TB SSD'
          },
          securityConfig: {
            encryption: 'AES-256',
            networkIsolation: true,
            accessControl: 'RBAC'
          },
          attestationData: {
            provider: 'Azure SGX Enclaves',
            verified: false,
            timestamp: null
          }
        }
      }
    ];

    for (const envData of environments) {
      const tspUser = this.testUsers.TSP[0];
      const authToken = this.authTokens[tspUser.email];
      
      if (!authToken) {
        console.log(`  ⚠️ No auth token for TSP user ${tspUser.email}, skipping environment`);
        continue;
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/infrastructure/environments`, envData, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          this.testEnvironments[response.data.environment.id] = response.data.environment;
          console.log(`  ✅ Created environment: ${envData.config.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create environment ${envData.config.name}:`, error.response?.data?.error || error.message);
      }
    }
  }

  async createTestTrainingJobs() {
    console.log('🤖 Creating test training jobs...');
    
    const contractIds = Object.keys(this.testContracts);
    const environmentIds = Object.keys(this.testEnvironments);
    
    if (contractIds.length === 0 || environmentIds.length === 0) {
      console.log('  ⚠️ No contracts or environments available for job creation');
      return;
    }

    const jobs = [
      {
        contractId: contractIds[0],
        options: {
          name: 'Healthcare Model Training Job',
          priority: 'HIGH',
          estimatedDuration: 480,
          resourceRequirements: {
            cpu: '8 vCPUs',
            memory: '32 GB',
            gpu: 'None'
          },
          trainingConfiguration: {
            algorithm: 'Random Forest',
            hyperparameters: {
              n_estimators: 100,
              max_depth: 10,
              random_state: 42
            }
          }
        }
      },
      {
        contractId: contractIds[1],
        options: {
          name: 'Financial Fraud Detection Job',
          priority: 'NORMAL',
          estimatedDuration: 720,
          resourceRequirements: {
            cpu: '8 vCPUs',
            memory: '32 GB',
            gpu: 'None'
          },
          trainingConfiguration: {
            algorithm: 'XGBoost',
            hyperparameters: {
              n_estimators: 200,
              max_depth: 8,
              learning_rate: 0.1
            }
          }
        }
      }
    ];

    for (const jobData of jobs) {
      try {
        const response = await axios.post(`${BASE_URL}/api/training/execute/${jobData.contractId}`, jobData.options);

        if (response.data.success) {
          this.testJobs[response.data.trainingJob.jobId] = response.data.trainingJob;
          console.log(`  ✅ Created training job: ${jobData.options.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create training job ${jobData.options.name}:`, error.response?.data?.error || error.message);
      }
    }
  }

  async createTestAIModels() {
    console.log('🧠 Creating test AI models...');
    
    const models = [
      {
        name: 'Healthcare Prediction Model',
        modelType: 'CLASSIFICATION',
        version: '1.0.0',
        description: 'Model for predicting patient outcomes based on medical records',
        modelData: {
          algorithm: 'Random Forest',
          accuracy: 0.95,
          precision: 0.93,
          recall: 0.91,
          f1Score: 0.92,
          trainingData: 'Healthcare Patient Records',
          validationData: '20% split',
          testData: '10% split'
        }
      },
      {
        name: 'Fraud Detection Model',
        modelType: 'CLASSIFICATION',
        version: '2.1.0',
        description: 'Model for detecting fraudulent transactions in real-time',
        modelData: {
          algorithm: 'XGBoost',
          accuracy: 0.98,
          precision: 0.96,
          recall: 0.94,
          f1Score: 0.95,
          trainingData: 'Financial Transaction Data',
          validationData: '20% split',
          testData: '10% split'
        }
      }
    ];

    for (const modelData of models) {
      try {
        const response = await axios.post(`${BASE_URL}/api/ai-models`, modelData);

        if (response.data.success) {
          console.log(`  ✅ Created AI model: ${modelData.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create AI model ${modelData.name}:`, error.response?.data?.error || error.message);
      }
    }
  }

  async createTestNotifications() {
    console.log('📢 Creating test notifications...');
    
    const notifications = [
      {
        type: 'INFO',
        title: 'Welcome to Contract Management System',
        message: 'Your account has been successfully created and is ready to use. You can now start creating contracts and managing your data.',
        userId: this.testUsers.TDP[0].id
      },
      {
        type: 'SUCCESS',
        title: 'Contract Signed Successfully',
        message: 'The healthcare AI model training contract has been signed by all parties. Training environment provisioning will begin shortly.',
        userId: this.testUsers.TDC[0].id
      },
      {
        type: 'WARNING',
        title: 'Training Environment Provisioning',
        message: 'Your training environment is being provisioned. This may take 10-15 minutes. You will be notified when it\'s ready.',
        userId: this.testUsers.TSP[0].id
      },
      {
        type: 'ERROR',
        title: 'Data Access Denied',
        message: 'Access to the financial dataset has been denied due to insufficient permissions. Please contact your administrator.',
        userId: this.testUsers.TDC[1]?.id
      }
    ];

    for (const notifData of notifications) {
      if (!notifData.userId) continue;
      
      try {
        const response = await axios.post(`${BASE_URL}/api/notifications`, notifData);

        if (response.data.success) {
          console.log(`  ✅ Created notification: ${notifData.title}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to create notification ${notifData.title}:`, error.response?.data?.error || error.message);
      }
    }
  }

  printSummary() {
    console.log('\n📋 Comprehensive Test Data Summary:');
    console.log('==================================');
    
    Object.entries(this.testUsers).forEach(([type, users]) => {
      console.log(`👥 ${type} Users: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.depaId}`);
      });
    });
    
    console.log(`📊 Datasets: ${Object.keys(this.testDatasets).length}`);
    Object.values(this.testDatasets).forEach(dataset => {
      console.log(`   - ${dataset.name} (${dataset.category}) - $${dataset.price}`);
    });
    
    console.log(`📋 Contracts: ${Object.keys(this.testContracts).length}`);
    Object.values(this.testContracts).forEach(contract => {
      console.log(`   - ${contract.title} (${contract.status})`);
    });
    
    console.log(`🏗️ Training Environments: ${Object.keys(this.testEnvironments).length}`);
    Object.values(this.testEnvironments).forEach(env => {
      console.log(`   - ${env.name} (${env.status})`);
    });
    
    console.log(`🤖 Training Jobs: ${Object.keys(this.testJobs).length}`);
    Object.values(this.testJobs).forEach(job => {
      console.log(`   - ${job.name} (${job.status})`);
    });
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('========================');
    console.log('TDP User: alice@tdp.com / password123');
    console.log('TDC User: bob@tdc.com / password123');
    console.log('TSP User: carol@tsp.com / password123');
    console.log('Admin User: david@admin.com / password123');
    
    console.log('\n🚀 Ready to test the application with comprehensive data!');
    console.log('💡 All data was created using APIs and follows the new enhancements');
  }
}

// Run the test data creation
async function main() {
  try {
    const creator = new ComprehensiveTestDataCreator();
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

module.exports = ComprehensiveTestDataCreator;
