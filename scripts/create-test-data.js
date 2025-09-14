#!/usr/bin/env node

/**
 * Comprehensive Test Data Creator
 * 
 * This script creates all necessary test data including:
 * - Users (TDP, TDC, CCRP, AppAdmin)
 * - Contracts
 * - Datasets
 * - Training environments
 * - Signing keys
 * - Notifications
 * - And more...
 */

const path = require('path');

// Change to backend directory to access models and dependencies
process.chdir(path.join(__dirname, '..', 'backend'));

const { setTestEnv } = require('../tests/test-env');
const { sequelize } = require('./models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Set environment
setTestEnv('integration');

// Import models
const {
  User, Contract, Dataset, TrainingEnvironment, TrainingJob,
  Signature, SigningEvent, UserKey, Notification, AuditLog,
  AIModel, SystemHealthLog, ProvenanceNode, MerkleTree
} = require('./models');

class TestDataCreator {
  constructor() {
    this.testUsers = {};
    this.testContracts = {};
    this.testDatasets = {};
    this.testEnvironments = {};
    this.testJobs = {};
  }

  async createAllTestData() {
    console.log('🚀 Starting comprehensive test data creation...');
    
    try {
      // 1. Create test users
      await this.createTestUsers();
      
      // 2. Create test datasets
      await this.createTestDatasets();
      
      // 3. Create test contracts
      await this.createTestContracts();
      
      // 4. Create test training environments
      await this.createTestTrainingEnvironments();
      
      // 5. Create test training jobs
      await this.createTestTrainingJobs();
      
      // 6. Create test AI models
      await this.createTestAIModels();
      
      // 7. Create test signing keys
      await this.createTestSigningKeys();
      
      // 8. Create test signatures
      await this.createTestSignatures();
      
      // 9. Create test notifications
      await this.createTestNotifications();
      
      // 10. Create test audit logs
      await this.createTestAuditLogs();
      
      // 11. Create test system health logs
      await this.createTestSystemHealthLogs();
      
      // 12. Create test provenance data
      await this.createTestProvenanceData();
      
      // 13. Create test merkle trees
      await this.createTestMerkleTrees();
      
      console.log('🎉 All test data created successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test data creation failed:', error.message);
      throw error;
    }
  }

  async createTestUsers() {
    console.log('👥 Creating test users...');
    
    const users = [
      {
        name: 'Alice Johnson',
        email: 'alice@tdp.com',
        password: 'password123',
        partyType: 'TDP',
        organization: 'DataCorp Inc',
        phoneNumber: '+1-555-0101',
        location: 'San Francisco, CA',
        website: 'https://datacorp.com',
        description: 'Leading data provider specializing in healthcare datasets'
      },
      {
        name: 'Bob Smith',
        email: 'bob@tdc.com',
        password: 'password123',
        partyType: 'TDC',
        organization: 'AI Research Labs',
        phoneNumber: '+1-555-0102',
        location: 'Boston, MA',
        website: 'https://airesearch.com',
        description: 'AI research company focused on machine learning models'
      },
      {
        name: 'Carol Davis',
        email: 'carol@ccrp.com',
        password: 'password123',
        partyType: 'CCRP',
        organization: 'SecureCompute Solutions',
        phoneNumber: '+1-555-0103',
        location: 'Austin, TX',
        website: 'https://securecompute.com',
        description: 'Confidential computing infrastructure provider'
      },
      {
        name: 'David Wilson',
        email: 'david@admin.com',
        password: 'password123',
        partyType: 'AppAdmin',
        organization: 'Contract Management Corp',
        phoneNumber: '+1-555-0104',
        location: 'New York, NY',
        website: 'https://contractmgmt.com',
        description: 'System administrator for the contract management platform'
      },
      {
        name: 'Eve Brown',
        email: 'eve@tdp2.com',
        password: 'password123',
        partyType: 'TDP',
        organization: 'Financial Data Co',
        phoneNumber: '+1-555-0105',
        location: 'Chicago, IL',
        website: 'https://financialdata.com',
        description: 'Financial data provider with banking and trading datasets'
      },
      {
        name: 'Frank Miller',
        email: 'frank@tdc2.com',
        password: 'password123',
        partyType: 'TDC',
        organization: 'TechStartup Inc',
        phoneNumber: '+1-555-0106',
        location: 'Seattle, WA',
        website: 'https://techstartup.com',
        description: 'Startup developing AI-powered analytics solutions'
      }
    ];

    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const depaId = this.generateDEPAId(userData.partyType);
        
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          partyType: userData.partyType,
          organization: userData.organization,
          phoneNumber: userData.phoneNumber,
          location: userData.location,
          website: userData.website,
          description: userData.description,
          depaId: depaId,
          isRegistered: true,
          isActive: true,
          emailVerified: true,
          profileCompleted: true,
          firstLogin: false,
          onboardingStatus: 'COMPLETED',
          iamUserId: crypto.randomUUID(),
          iamUsername: userData.email,
          did: `did:web:example.com:user:${userData.email.split('@')[0]}`,
          didVerified: true,
          didSource: 'SYSTEM_GENERATED'
        });

        this.testUsers[userData.partyType] = this.testUsers[userData.partyType] || [];
        this.testUsers[userData.partyType].push(user);
        
        console.log(`  ✅ Created ${userData.partyType}: ${userData.name} (${userData.email})`);
      } catch (error) {
        console.log(`  ⚠️ User ${userData.email} might already exist, skipping`);
      }
    }
  }

  async createTestDatasets() {
    console.log('📊 Creating test datasets...');
    
    const datasets = [
      {
        name: 'Healthcare Patient Records',
        description: 'Anonymized patient records from major hospitals',
        domain: 'Healthcare',
        dataType: 'TABULAR',
        size: '2.5TB',
        recordCount: 1500000,
        ownerId: this.testUsers.TDP[0].id,
        dataClassification: 'CONFIDENTIAL',
        secureEnclaveRequired: true,
        attestationRequired: true,
        dataResidencyRegion: 'US-EAST',
        tags: ['healthcare', 'patient-data', 'anonymized', 'medical-records'],
        metadata: {
          source: 'Hospital Network',
          collectionDate: '2024-01-15',
          lastUpdated: '2024-09-01',
          qualityScore: 0.95,
          completeness: 0.98
        }
      },
      {
        name: 'Financial Transaction Data',
        description: 'Banking transaction data for fraud detection',
        domain: 'Finance',
        dataType: 'TABULAR',
        size: '850GB',
        recordCount: 5000000,
        ownerId: this.testUsers.TDP[1].id,
        dataClassification: 'RESTRICTED',
        secureEnclaveRequired: true,
        attestationRequired: true,
        dataResidencyRegion: 'US-WEST',
        tags: ['finance', 'transactions', 'fraud-detection', 'banking'],
        metadata: {
          source: 'Major Bank',
          collectionDate: '2024-02-01',
          lastUpdated: '2024-09-10',
          qualityScore: 0.92,
          completeness: 0.96
        }
      },
      {
        name: 'E-commerce Customer Behavior',
        description: 'Online shopping behavior and preferences',
        domain: 'E-commerce',
        dataType: 'TABULAR',
        size: '1.2TB',
        recordCount: 3000000,
        ownerId: this.testUsers.TDP[0].id,
        dataClassification: 'INTERNAL',
        secureEnclaveRequired: false,
        attestationRequired: false,
        dataResidencyRegion: 'US-CENTRAL',
        tags: ['ecommerce', 'customer-behavior', 'shopping', 'preferences'],
        metadata: {
          source: 'Online Retailer',
          collectionDate: '2024-03-01',
          lastUpdated: '2024-09-05',
          qualityScore: 0.88,
          completeness: 0.94
        }
      },
      {
        name: 'IoT Sensor Data',
        description: 'Industrial IoT sensor readings from manufacturing',
        domain: 'Manufacturing',
        dataType: 'TIME_SERIES',
        size: '3.1TB',
        recordCount: 10000000,
        ownerId: this.testUsers.TDP[1].id,
        dataClassification: 'INTERNAL',
        secureEnclaveRequired: false,
        attestationRequired: false,
        dataResidencyRegion: 'US-EAST',
        tags: ['iot', 'sensors', 'manufacturing', 'time-series'],
        metadata: {
          source: 'Manufacturing Plant',
          collectionDate: '2024-04-01',
          lastUpdated: '2024-09-12',
          qualityScore: 0.90,
          completeness: 0.97
        }
      }
    ];

    for (const datasetData of datasets) {
      try {
        const dataset = await Dataset.create({
          name: datasetData.name,
          description: datasetData.description,
          domain: datasetData.domain,
          dataType: datasetData.dataType,
          size: datasetData.size,
          recordCount: datasetData.recordCount,
          ownerId: datasetData.ownerId,
          dataClassification: datasetData.dataClassification,
          secureEnclaveRequired: datasetData.secureEnclaveRequired,
          attestationRequired: datasetData.attestationRequired,
          dataResidencyRegion: datasetData.dataResidencyRegion,
          tags: datasetData.tags,
          metadata: datasetData.metadata,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        this.testDatasets[dataset.id] = dataset;
        console.log(`  ✅ Created dataset: ${dataset.name}`);
      } catch (error) {
        console.log(`  ⚠️ Dataset ${datasetData.name} creation failed:`, error.message);
      }
    }
  }

  async createTestContracts() {
    console.log('📋 Creating test contracts...');
    
    const contracts = [
      {
        title: 'Healthcare AI Model Training Agreement',
        description: 'Contract for training AI models on healthcare patient data',
        tdpId: this.testUsers.TDP[0].id,
        tdcId: this.testUsers.TDC[0].id,
        ccrpId: this.testUsers.CCRP[0].id,
        status: 'ACTIVE',
        contractType: 'AI_TRAINING',
        dataUsage: 'MODEL_TRAINING',
        duration: 365,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        terms: {
          dataRetention: '2 years',
          modelOwnership: 'TDC',
          dataSharing: 'Prohibited',
          compliance: ['HIPAA', 'GDPR'],
          penalties: 'Contract termination for violations'
        },
        datasets: [Object.keys(this.testDatasets)[0]]
      },
      {
        title: 'Financial Fraud Detection Model',
        description: 'Contract for developing fraud detection models using banking data',
        tdpId: this.testUsers.TDP[1].id,
        tdcId: this.testUsers.TDC[1].id,
        ccrpId: this.testUsers.CCRP[0].id,
        status: 'PENDING',
        contractType: 'AI_TRAINING',
        dataUsage: 'MODEL_TRAINING',
        duration: 180,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-11-28'),
        terms: {
          dataRetention: '1 year',
          modelOwnership: 'Shared',
          dataSharing: 'Restricted',
          compliance: ['SOX', 'PCI-DSS'],
          penalties: 'Financial penalties for violations'
        },
        datasets: [Object.keys(this.testDatasets)[1]]
      },
      {
        title: 'E-commerce Recommendation System',
        description: 'Contract for building recommendation systems using customer data',
        tdpId: this.testUsers.TDP[0].id,
        tdcId: this.testUsers.TDC[0].id,
        ccrpId: this.testUsers.CCRP[0].id,
        status: 'DRAFT',
        contractType: 'AI_TRAINING',
        dataUsage: 'MODEL_TRAINING',
        duration: 90,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-30'),
        terms: {
          dataRetention: '6 months',
          modelOwnership: 'TDC',
          dataSharing: 'Prohibited',
          compliance: ['CCPA'],
          penalties: 'Data deletion required for violations'
        },
        datasets: [Object.keys(this.testDatasets)[2]]
      }
    ];

    for (const contractData of contracts) {
      try {
        const contract = await Contract.create({
          title: contractData.title,
          description: contractData.description,
          tdpId: contractData.tdpId,
          tdcId: contractData.tdcId,
          ccrpId: contractData.ccrpId,
          status: contractData.status,
          contractType: contractData.contractType,
          dataUsage: contractData.dataUsage,
          duration: contractData.duration,
          startDate: contractData.startDate,
          endDate: contractData.endDate,
          terms: contractData.terms,
          contractData: {
            datasets: contractData.datasets,
            modelRequirements: {
              accuracy: 0.95,
              performance: 'high',
              explainability: 'required'
            },
            privacyRequirements: {
              differentialPrivacy: true,
              kAnonymity: 5,
              lDiversity: 3
            }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        this.testContracts[contract.id] = contract;
        console.log(`  ✅ Created contract: ${contract.title}`);
      } catch (error) {
        console.log(`  ⚠️ Contract ${contractData.title} creation failed:`, error.message);
      }
    }
  }

  async createTestTrainingEnvironments() {
    console.log('🏗️ Creating test training environments...');
    
    const environments = [
      {
        name: 'Healthcare Training Environment',
        status: 'ACTIVE',
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
          timestamp: new Date()
        }
      },
      {
        name: 'Financial Training Environment',
        status: 'PENDING',
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
    ];

    for (const envData of environments) {
      try {
        const environment = await TrainingEnvironment.create({
          name: envData.name,
          status: envData.status,
          environmentType: envData.environmentType,
          provisioningMethod: envData.provisioningMethod,
          cloudProvider: envData.cloudProvider,
          region: envData.region,
          instanceType: envData.instanceType,
          resourceSpecs: envData.resourceSpecs,
          securityConfig: envData.securityConfig,
          attestationData: envData.attestationData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        this.testEnvironments[environment.id] = environment;
        console.log(`  ✅ Created environment: ${environment.name}`);
      } catch (error) {
        console.log(`  ⚠️ Environment ${envData.name} creation failed:`, error.message);
      }
    }
  }

  async createTestTrainingJobs() {
    console.log('🤖 Creating test training jobs...');
    
    const jobs = [
      {
        name: 'Healthcare Model Training Job',
        status: 'RUNNING',
        environmentId: Object.keys(this.testEnvironments)[0],
        contractId: Object.keys(this.testContracts)[0],
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
      },
      {
        name: 'Financial Fraud Detection Job',
        status: 'PENDING',
        environmentId: Object.keys(this.testEnvironments)[1],
        contractId: Object.keys(this.testContracts)[1],
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
    ];

    for (const jobData of jobs) {
      try {
        const job = await TrainingJob.create({
          name: jobData.name,
          status: jobData.status,
          environmentId: jobData.environmentId,
          contractId: jobData.contractId,
          priority: jobData.priority,
          estimatedDuration: jobData.estimatedDuration,
          resourceRequirements: jobData.resourceRequirements,
          trainingConfiguration: jobData.trainingConfiguration,
          provenanceData: {
            dataHash: crypto.randomBytes(32).toString('hex'),
            codeHash: crypto.randomBytes(32).toString('hex'),
            modelHash: crypto.randomBytes(32).toString('hex')
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });

        this.testJobs[job.id] = job;
        console.log(`  ✅ Created training job: ${job.name}`);
      } catch (error) {
        console.log(`  ⚠️ Training job ${jobData.name} creation failed:`, error.message);
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
        description: 'Model for predicting patient outcomes',
        modelData: {
          algorithm: 'Random Forest',
          accuracy: 0.95,
          precision: 0.93,
          recall: 0.91,
          f1Score: 0.92
        }
      },
      {
        name: 'Fraud Detection Model',
        modelType: 'CLASSIFICATION',
        version: '2.1.0',
        description: 'Model for detecting fraudulent transactions',
        modelData: {
          algorithm: 'XGBoost',
          accuracy: 0.98,
          precision: 0.96,
          recall: 0.94,
          f1Score: 0.95
        }
      }
    ];

    for (const modelData of models) {
      try {
        const model = await AIModel.create({
          name: modelData.name,
          modelType: modelData.modelType,
          version: modelData.version,
          description: modelData.description,
          modelData: modelData.modelData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`  ✅ Created AI model: ${model.name}`);
      } catch (error) {
        console.log(`  ⚠️ AI model ${modelData.name} creation failed:`, error.message);
      }
    }
  }

  async createTestSigningKeys() {
    console.log('🔐 Creating test signing keys...');
    
    for (const userType of ['TDP', 'TDC', 'CCRP']) {
      if (this.testUsers[userType]) {
        for (const user of this.testUsers[userType]) {
          try {
            const keyId = `KEY-${crypto.randomUUID()}`;
            const keyPair = crypto.generateKeyPairSync('rsa', {
              modulusLength: 2048,
              publicKeyEncoding: { type: 'spki', format: 'pem' },
              privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });

            await UserKey.create({
              userId: user.id,
              keyId: keyId,
              keyType: 'RSA-2048',
              publicKey: keyPair.publicKey,
              isActive: true,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            });

            console.log(`  ✅ Created signing key for ${user.name}`);
          } catch (error) {
            console.log(`  ⚠️ Signing key for ${user.name} creation failed:`, error.message);
          }
        }
      }
    }
  }

  async createTestSignatures() {
    console.log('✍️ Creating test signatures...');
    
    const contractIds = Object.keys(this.testContracts);
    const userIds = Object.values(this.testUsers).flat().map(u => u.id);

    for (let i = 0; i < Math.min(contractIds.length, userIds.length); i++) {
      try {
        const signature = await Signature.create({
          contractId: contractIds[i],
          userId: userIds[i],
          signatureData: {
            signature: crypto.randomBytes(64).toString('hex'),
            algorithm: 'RSA-2048',
            timestamp: new Date(),
            contractHash: crypto.randomBytes(32).toString('hex')
          },
          signatureAlgorithm: 'RSA-2048',
          keyId: `KEY-${crypto.randomUUID()}`,
          isVerified: true,
          verificationTimestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`  ✅ Created signature for contract ${contractIds[i]}`);
      } catch (error) {
        console.log(`  ⚠️ Signature creation failed:`, error.message);
      }
    }
  }

  async createTestNotifications() {
    console.log('📢 Creating test notifications...');
    
    const notifications = [
      {
        type: 'INFO',
        title: 'Welcome to Contract Management System',
        message: 'Your account has been successfully created and is ready to use.',
        userId: this.testUsers.TDP[0].id
      },
      {
        type: 'SUCCESS',
        title: 'Contract Signed Successfully',
        message: 'The healthcare AI model training contract has been signed by all parties.',
        userId: this.testUsers.TDC[0].id
      },
      {
        type: 'WARNING',
        title: 'Training Environment Provisioning',
        message: 'Your training environment is being provisioned. This may take 10-15 minutes.',
        userId: this.testUsers.CCRP[0].id
      },
      {
        type: 'ERROR',
        title: 'Data Access Denied',
        message: 'Access to the financial dataset has been denied due to insufficient permissions.',
        userId: this.testUsers.TDC[1].id
      }
    ];

    for (const notifData of notifications) {
      try {
        await Notification.create({
          type: notifData.type,
          title: notifData.title,
          message: notifData.message,
          isRead: false,
          metadata: {
            priority: 'normal',
            category: 'system'
          },
          userId: notifData.userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`  ✅ Created notification: ${notifData.title}`);
      } catch (error) {
        console.log(`  ⚠️ Notification creation failed:`, error.message);
      }
    }
  }

  async createTestAuditLogs() {
    console.log('📝 Creating test audit logs...');
    
    const auditLogs = [
      {
        userId: this.testUsers.TDP[0].id,
        action: 'LOGIN',
        resourceType: 'USER',
        resourceId: this.testUsers.TDP[0].id,
        details: { loginMethod: 'email', ipAddress: '192.168.1.100' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        userId: this.testUsers.TDC[0].id,
        action: 'CONTRACT_CREATED',
        resourceType: 'CONTRACT',
        resourceId: Object.keys(this.testContracts)[0],
        details: { contractTitle: 'Healthcare AI Model Training Agreement' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        userId: this.testUsers.CCRP[0].id,
        action: 'ENVIRONMENT_PROVISIONED',
        resourceType: 'TRAINING_ENVIRONMENT',
        resourceId: Object.keys(this.testEnvironments)[0],
        details: { environmentName: 'Healthcare Training Environment' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      }
    ];

    for (const logData of auditLogs) {
      try {
        await AuditLog.create({
          userId: logData.userId,
          action: logData.action,
          resourceType: logData.resourceType,
          resourceId: logData.resourceId,
          details: logData.details,
          ipAddress: logData.ipAddress,
          userAgent: logData.userAgent,
          createdAt: new Date()
        });

        console.log(`  ✅ Created audit log: ${logData.action}`);
      } catch (error) {
        console.log(`  ⚠️ Audit log creation failed:`, error.message);
      }
    }
  }

  async createTestSystemHealthLogs() {
    console.log('📊 Creating test system health logs...');
    
    const healthLogs = [
      {
        systemName: 'ethereum',
        healthStatus: false,
        responseTime: 5000,
        errorMessage: 'Connection timeout',
        metrics: { uptime: 0.95, lastBlock: 18500000 }
      },
      {
        systemName: 'scittCcf',
        healthStatus: true,
        responseTime: 150,
        errorMessage: null,
        metrics: { uptime: 0.99, lastClaim: 'claim-123' }
      },
      {
        systemName: '***REMOVED-KEYCLOAK_DB_PASSWORD***',
        healthStatus: true,
        responseTime: 200,
        errorMessage: null,
        metrics: { uptime: 0.98, activeUsers: 25 }
      }
    ];

    for (const logData of healthLogs) {
      try {
        await SystemHealthLog.create({
          systemName: logData.systemName,
          healthStatus: logData.healthStatus,
          responseTime: logData.responseTime,
          errorMessage: logData.errorMessage,
          metrics: logData.metrics,
          createdAt: new Date()
        });

        console.log(`  ✅ Created health log: ${logData.systemName}`);
      } catch (error) {
        console.log(`  ⚠️ Health log creation failed:`, error.message);
      }
    }
  }

  async createTestProvenanceData() {
    console.log('🔗 Creating test provenance data...');
    
    const provenanceNodes = [
      {
        nodeId: 'node-data-001',
        nodeType: 'DATA',
        dataHash: crypto.randomBytes(32).toString('hex'),
        parentHash: null,
        metadata: {
          source: 'Healthcare Dataset',
          size: '2.5TB',
          recordCount: 1500000
        }
      },
      {
        nodeId: 'node-code-001',
        nodeType: 'CODE',
        dataHash: crypto.randomBytes(32).toString('hex'),
        parentHash: 'node-data-001',
        metadata: {
          language: 'Python',
          framework: 'scikit-learn',
          version: '1.0.0'
        }
      },
      {
        nodeId: 'node-model-001',
        nodeType: 'MODEL',
        dataHash: crypto.randomBytes(32).toString('hex'),
        parentHash: 'node-code-001',
        metadata: {
          algorithm: 'Random Forest',
          accuracy: 0.95,
          trainingTime: '2 hours'
        }
      }
    ];

    for (const nodeData of provenanceNodes) {
      try {
        await ProvenanceNode.create({
          nodeId: nodeData.nodeId,
          nodeType: nodeData.nodeType,
          dataHash: nodeData.dataHash,
          parentHash: nodeData.parentHash,
          metadata: nodeData.metadata,
          createdAt: new Date()
        });

        console.log(`  ✅ Created provenance node: ${nodeData.nodeId}`);
      } catch (error) {
        console.log(`  ⚠️ Provenance node creation failed:`, error.message);
      }
    }
  }

  async createTestMerkleTrees() {
    console.log('🌳 Creating test Merkle trees...');
    
    const merkleTrees = [
      {
        treeId: 'tree-provenance-001',
        rootHash: crypto.randomBytes(32).toString('hex'),
        leafCount: 3,
        treeData: {
          leaves: ['node-data-001', 'node-code-001', 'node-model-001'],
          height: 2,
          algorithm: 'SHA-256'
        }
      }
    ];

    for (const treeData of merkleTrees) {
      try {
        await MerkleTree.create({
          treeId: treeData.treeId,
          rootHash: treeData.rootHash,
          leafCount: treeData.leafCount,
          treeData: treeData.treeData,
          createdAt: new Date()
        });

        console.log(`  ✅ Created Merkle tree: ${treeData.treeId}`);
      } catch (error) {
        console.log(`  ⚠️ Merkle tree creation failed:`, error.message);
      }
    }
  }

  generateDEPAId(partyType) {
    const prefix = partyType.toUpperCase();
    const uuid = crypto.randomUUID();
    return `${prefix}-${uuid}`;
  }

  printSummary() {
    console.log('\n📋 Test Data Summary:');
    console.log('==================');
    
    Object.entries(this.testUsers).forEach(([type, users]) => {
      console.log(`👥 ${type} Users: ${users.length}`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.depaId}`);
      });
    });
    
    console.log(`📊 Datasets: ${Object.keys(this.testDatasets).length}`);
    Object.values(this.testDatasets).forEach(dataset => {
      console.log(`   - ${dataset.name} (${dataset.domain})`);
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
    console.log('CCRP User: carol@ccrp.com / password123');
    console.log('Admin User: david@admin.com / password123');
    
    console.log('\n🚀 Ready to test the application!');
  }
}

// Run the test data creation
async function main() {
  try {
    const creator = new TestDataCreator();
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

module.exports = TestDataCreator;
