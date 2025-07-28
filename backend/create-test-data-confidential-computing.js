#!/usr/bin/env node

/**
 * Test Data Generator for Confidential Computing Features
 * 
 * This script creates comprehensive test data for testing confidential computing features
 * including datasets, users, contracts, and infrastructure configurations.
 * 
 * Usage: node backend/create-test-data-confidential-computing.js
 */

require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./models');
const { User, Dataset, Contract, CCRPAzureCredentials, TrainingEnvironment, AIModel } = require('./models');
const { v4: uuidv4 } = require('uuid');

// Fix table name case sensitivity issue
const fixTableReferences = async () => {
  try {
    // Drop and recreate the ccrp_azure_credentials table with correct references
    await sequelize.query('DROP TABLE IF EXISTS "ccrp_azure_credentials" CASCADE;');
    
    await sequelize.query(`
      CREATE TABLE "ccrp_azure_credentials" (
        "id" SERIAL PRIMARY KEY,
        "ccrpUserId" INTEGER NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "subscriptionId" VARCHAR(255) NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL,
        "clientId" VARCHAR(255) NOT NULL,
        "clientSecret" TEXT NOT NULL,
        "authMethod" "public"."enum_ccrp_azure_credentials_authMethod" NOT NULL DEFAULT 'SERVICE_PRINCIPAL',
        "defaultLocation" VARCHAR(255) NOT NULL DEFAULT 'eastus',
        "defaultResourceGroupPrefix" VARCHAR(255) NOT NULL DEFAULT 'training',
        "defaultVMSize" VARCHAR(255) NOT NULL DEFAULT 'Standard_D2s_v3',
        "defaultStorageSku" VARCHAR(255) NOT NULL DEFAULT 'Standard_LRS',
        "defaultDatabaseSku" VARCHAR(255) NOT NULL DEFAULT 'Basic',
        "vnetAddressSpace" VARCHAR(255) NOT NULL DEFAULT '10.0.0.0/16',
        "privateSubnetPrefix" VARCHAR(255) NOT NULL DEFAULT '10.0.1.0/24',
        "publicSubnetPrefix" VARCHAR(255) NOT NULL DEFAULT '10.0.2.0/24',
        "enableEncryption" BOOLEAN NOT NULL DEFAULT true,
        "enableMonitoring" BOOLEAN NOT NULL DEFAULT true,
        "enableKeyVault" BOOLEAN NOT NULL DEFAULT true,
        "budgetLimit" DECIMAL(10,2),
        "alertThreshold" DECIMAL(3,2) DEFAULT 0.8,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastValidated" TIMESTAMP WITH TIME ZONE,
        "validationStatus" "public"."enum_ccrp_azure_credentials_validationStatus" NOT NULL DEFAULT 'PENDING',
        "createdBy" INTEGER REFERENCES "users" ("id"),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    
    // Add indexes
    await sequelize.query('CREATE UNIQUE INDEX "ccrp_azure_credentials_ccrpUserId_unique" ON "ccrp_azure_credentials" ("ccrpUserId");');
    await sequelize.query('CREATE INDEX "ccrp_azure_credentials_subscriptionId" ON "ccrp_azure_credentials" ("subscriptionId");');
    await sequelize.query('CREATE INDEX "ccrp_azure_credentials_isActive" ON "ccrp_azure_credentials" ("isActive");');
    await sequelize.query('CREATE INDEX "ccrp_azure_credentials_validationStatus" ON "ccrp_azure_credentials" ("validationStatus");');
    
    console.log('✅ Fixed CCRP Azure credentials table references');
  } catch (error) {
    console.log('⚠️ CCRP Azure credentials table already exists or error occurred:', error.message);
  }
};

async function createTestData() {
  try {
    console.log('🧪 Creating comprehensive test data for confidential computing features...');
    
    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');
    
    // Fix table references
    await fixTableReferences();

    // Create test users
    console.log('\n👥 Creating test users...');
    
    const testUsers = {
      // TDP Users (Training Data Providers)
      tdp1: await User.create({
        name: 'Medical Data Corp',
        email: 'medical@test.com',
        partyType: 'TDP',
        walletAddress: '0x1234567890123456789012345678901234567890',
        did: 'did:web:medical-data-corp.com',
        iamUserId: 'tdp-medical-001',
        organization: 'Medical Data Corporation',
        phoneNumber: '+1-555-0101',
        website: 'https://medical-data-corp.com',
        location: 'United States',
        isActive: true
      }),

      tdp2: await User.create({
        name: 'Financial Analytics Inc',
        email: 'financial@test.com',
        partyType: 'TDP',
        walletAddress: '0x2345678901234567890123456789012345678901',
        did: 'did:web:financial-analytics.com',
        iamUserId: 'tdp-financial-001',
        organization: 'Financial Analytics Inc',
        phoneNumber: '+1-555-0102',
        website: 'https://financial-analytics.com',
        location: 'United States',
        isActive: true
      }),

      tdp3: await User.create({
        name: 'Retail Insights Ltd',
        email: 'retail@test.com',
        partyType: 'TDP',
        walletAddress: '0x3456789012345678901234567890123456789012',
        did: 'did:web:retail-insights.com',
        iamUserId: 'tdp-retail-001',
        organization: 'Retail Insights Ltd',
        phoneNumber: '+1-555-0103',
        website: 'https://retail-insights.com',
        location: 'United Kingdom',
        isActive: true
      }),

      // TDC Users (Training Data Consumers)
      tdc1: await User.create({
        name: 'AI Research Lab',
        email: 'ai-research@test.com',
        partyType: 'TDC',
        walletAddress: '0x4567890123456789012345678901234567890123',
        did: 'did:web:ai-research-lab.com',
        iamUserId: 'tdc-ai-research-001',
        organization: 'AI Research Laboratory',
        phoneNumber: '+1-555-0201',
        website: 'https://ai-research-lab.com',
        location: 'United States',
        isActive: true
      }),

      tdc2: await User.create({
        name: 'Healthcare Analytics',
        email: 'healthcare@test.com',
        partyType: 'TDC',
        walletAddress: '0x5678901234567890123456789012345678901234',
        did: 'did:web:healthcare-analytics.com',
        iamUserId: 'tdc-healthcare-001',
        organization: 'Healthcare Analytics Inc',
        phoneNumber: '+1-555-0202',
        website: 'https://healthcare-analytics.com',
        location: 'United States',
        isActive: true
      }),

      // CCRP Users (Confidential Clean Room Providers)
      ccrp1: await User.create({
        name: 'Secure Cloud Analytics',
        email: 'secure-cloud@test.com',
        partyType: 'CCRP',
        walletAddress: '0x6789012345678901234567890123456789012345',
        did: 'did:web:secure-cloud-analytics.com',
        iamUserId: 'ccrp-secure-cloud-001',
        organization: 'Secure Cloud Analytics LLC',
        phoneNumber: '+1-555-0301',
        website: 'https://secure-cloud-analytics.com',
        location: 'United States',
        cloudProviders: ['AWS', 'Azure', 'GCP'],
        isActive: true
      }),

      ccrp2: await User.create({
        name: 'Privacy First Computing',
        email: 'privacy-first@test.com',
        partyType: 'CCRP',
        walletAddress: '0x7890123456789012345678901234567890123456',
        did: 'did:web:privacy-first-computing.com',
        iamUserId: 'ccrp-privacy-first-001',
        organization: 'Privacy First Computing Inc',
        phoneNumber: '+1-555-0302',
        website: 'https://privacy-first-computing.com',
        location: 'Canada',
        cloudProviders: ['Azure', 'GCP'],
        isActive: true
      }),

      ccrp3: await User.create({
        name: 'Confidential Computing Lab',
        email: 'confidential-lab@test.com',
        partyType: 'CCRP',
        walletAddress: '0x8901234567890123456789012345678901234567',
        did: 'did:web:confidential-computing-lab.com',
        iamUserId: 'ccrp-confidential-lab-001',
        organization: 'Confidential Computing Laboratory',
        phoneNumber: '+1-555-0303',
        website: 'https://confidential-computing-lab.com',
        location: 'Germany',
        cloudProviders: ['GCP', 'OCI'],
        isActive: true
      }),

      // AppAdmin User
      appAdmin: await User.create({
        name: 'System Administrator',
        email: 'admin@test.com',
        partyType: 'AppAdmin',
        walletAddress: '0x9012345678901234567890123456789012345678',
        did: 'did:web:contract-management-system.com',
        iamUserId: 'admin-system-001',
        organization: 'Contract Management System',
        phoneNumber: '+1-555-0000',
        website: 'https://contract-management-system.com',
        location: 'United States',
        isActive: true
      })
    };

    console.log(`✅ Created ${Object.keys(testUsers).length} test users`);

    // Create CCRP Azure credentials
    console.log('\n🔐 Creating CCRP Azure credentials...');
    
    const ccrpCredentials = {
      ccrp1: await CCRPAzureCredentials.create({
        ccrpUserId: testUsers.ccrp1.id,
        subscriptionId: 'test-subscription-1',
        tenantId: 'test-tenant-1',
        clientId: 'test-client-id-1',
        clientSecret: 'test-client-secret-1',
        authMethod: 'SERVICE_PRINCIPAL',
        defaultLocation: 'eastus',
        defaultResourceGroupPrefix: 'secure-training',
        defaultVMSize: 'Standard_DC8s_v3',
        defaultStorageSku: 'Premium_LRS',
        defaultDatabaseSku: 'Standard',
        vnetAddressSpace: '10.0.0.0/16',
        privateSubnetPrefix: '10.0.1.0/24',
        publicSubnetPrefix: '10.0.2.0/24',
        enableEncryption: true,
        enableMonitoring: true,
        enableKeyVault: true,
        budgetLimit: 2000.00,
        alertThreshold: 0.8,
        isActive: true,
        validationStatus: 'VALID',
        lastValidated: new Date(),
        createdBy: testUsers.ccrp1.id
      }),

      ccrp2: await CCRPAzureCredentials.create({
        ccrpUserId: testUsers.ccrp2.id,
        subscriptionId: 'test-subscription-2',
        tenantId: 'test-tenant-2',
        clientId: 'test-client-id-2',
        clientSecret: 'test-client-secret-2',
        authMethod: 'SERVICE_PRINCIPAL',
        defaultLocation: 'canadacentral',
        defaultResourceGroupPrefix: 'privacy-training',
        defaultVMSize: 'Standard_DC4s_v3',
        defaultStorageSku: 'Standard_LRS',
        defaultDatabaseSku: 'Basic',
        vnetAddressSpace: '10.1.0.0/16',
        privateSubnetPrefix: '10.1.1.0/24',
        publicSubnetPrefix: '10.1.2.0/24',
        enableEncryption: true,
        enableMonitoring: true,
        enableKeyVault: true,
        budgetLimit: 1500.00,
        alertThreshold: 0.75,
        isActive: true,
        validationStatus: 'VALID',
        lastValidated: new Date(),
        createdBy: testUsers.ccrp2.id
      }),

      ccrp3: await CCRPAzureCredentials.create({
        ccrpUserId: testUsers.ccrp3.id,
        subscriptionId: 'test-subscription-3',
        tenantId: 'test-tenant-3',
        clientId: 'test-client-id-3',
        clientSecret: 'test-client-secret-3',
        authMethod: 'SERVICE_PRINCIPAL',
        defaultLocation: 'westeurope',
        defaultResourceGroupPrefix: 'confidential-training',
        defaultVMSize: 'Standard_DC2s_v3',
        defaultStorageSku: 'Standard_LRS',
        defaultDatabaseSku: 'Basic',
        vnetAddressSpace: '10.2.0.0/16',
        privateSubnetPrefix: '10.2.1.0/24',
        publicSubnetPrefix: '10.2.2.0/24',
        enableEncryption: true,
        enableMonitoring: true,
        enableKeyVault: true,
        budgetLimit: 1000.00,
        alertThreshold: 0.7,
        isActive: true,
        validationStatus: 'VALID',
        lastValidated: new Date(),
        createdBy: testUsers.ccrp3.id
      })
    };

    console.log(`✅ Created ${Object.keys(ccrpCredentials).length} CCRP Azure credentials`);

    // Create AI Models
    console.log('\n🤖 Creating AI models...');
    
    const aiModels = {
      llm1: await AIModel.create({
        modelId: 'TEST-LLM-001',
        name: 'GPT-4 Test Model',
        description: 'Large language model for natural language processing',
        type: 'LLM',
        framework: 'PyTorch',
        version: '1.0.0',
        isActive: true,
        metadata: {
          parameters: '175B',
          architecture: 'Transformer',
          trainingData: 'Web text, books, articles'
        }
      }),

      vision1: await AIModel.create({
        modelId: 'TEST-VISION-001',
        name: 'Vision Transformer Test',
        description: 'Computer vision model for image classification',
        type: 'VISION',
        framework: 'TensorFlow',
        version: '2.0.0',
        isActive: true,
        metadata: {
          parameters: '86M',
          architecture: 'Vision Transformer',
          trainingData: 'ImageNet, COCO'
        }
      }),

      audio1: await AIModel.create({
        modelId: 'TEST-AUDIO-001',
        name: 'Speech Recognition Test',
        description: 'Audio model for speech recognition and processing',
        type: 'AUDIO',
        framework: 'PyTorch',
        version: '1.5.0',
        isActive: true,
        metadata: {
          parameters: '95M',
          architecture: 'Conformer',
          trainingData: 'LibriSpeech, Common Voice'
        }
      })
    };

    console.log(`✅ Created ${Object.keys(aiModels).length} AI models`);

    // Create datasets with confidential computing requirements
    console.log('\n📊 Creating datasets with confidential computing requirements...');
    
    const datasets = {
      // Confidential computing required datasets
      medicalSpeech: await Dataset.create({
        datasetId: 'MEDICAL-SPEECH-001',
        name: 'Medical Speech Dataset',
        description: 'Sensitive medical speech data requiring confidential computing for HIPAA compliance',
        category: 'Audio',
        size: 500,
        recordCount: 10000,
        price: 150.00,
        license: 'Restricted',
        tags: ['medical', 'speech', 'confidential', 'hipaa'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true,
        ownerId: testUsers.tdp1.id,
        depaId: 'DATASET-MEDICAL-SPEECH-123456789012'
      }),

      financialData: await Dataset.create({
        datasetId: 'FINANCIAL-DATA-001',
        name: 'Financial Transaction Dataset',
        description: 'Sensitive financial transaction data requiring confidential computing for SOX compliance',
        category: 'Tabular',
        size: 300,
        recordCount: 50000,
        price: 200.00,
        license: 'Restricted',
        tags: ['financial', 'transactions', 'confidential', 'sox'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true,
        ownerId: testUsers.tdp2.id,
        depaId: 'DATASET-FINANCIAL-DATA-234567890123'
      }),

      patientRecords: await Dataset.create({
        datasetId: 'PATIENT-RECORDS-001',
        name: 'Patient Health Records',
        description: 'Sensitive patient health records requiring confidential computing for HIPAA compliance',
        category: 'Tabular',
        size: 800,
        recordCount: 25000,
        price: 300.00,
        license: 'Restricted',
        tags: ['medical', 'patient', 'confidential', 'hipaa'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true,
        ownerId: testUsers.tdp1.id,
        depaId: 'DATASET-PATIENT-RECORDS-345678901234'
      }),

      // Standard processing datasets
      publicImages: await Dataset.create({
        datasetId: 'PUBLIC-IMAGES-001',
        name: 'Public Image Dataset',
        description: 'Public image dataset for standard computer vision processing',
        category: 'Computer Vision',
        size: 200,
        recordCount: 5000,
        price: 50.00,
        license: 'MIT',
        tags: ['images', 'public', 'computer-vision'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false,
        ownerId: testUsers.tdp3.id,
        depaId: 'DATASET-PUBLIC-IMAGES-456789012345'
      }),

      retailData: await Dataset.create({
        datasetId: 'RETAIL-DATA-001',
        name: 'Retail Sales Dataset',
        description: 'Public retail sales data for standard analytics processing',
        category: 'Tabular',
        size: 150,
        recordCount: 15000,
        price: 75.00,
        license: 'Apache-2.0',
        tags: ['retail', 'sales', 'public', 'analytics'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false,
        ownerId: testUsers.tdp3.id,
        depaId: 'DATASET-RETAIL-DATA-567890123456'
      }),

      nlpText: await Dataset.create({
        datasetId: 'NLP-TEXT-001',
        name: 'NLP Text Dataset',
        description: 'Public text dataset for natural language processing',
        category: 'Natural Language Processing',
        size: 100,
        recordCount: 8000,
        price: 60.00,
        license: 'MIT',
        tags: ['nlp', 'text', 'public', 'language'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false,
        ownerId: testUsers.tdp2.id,
        depaId: 'DATASET-NLP-TEXT-678901234567'
      })
    };

    console.log(`✅ Created ${Object.keys(datasets).length} datasets (${Object.values(datasets).filter(d => d.confidentialComputingRequired).length} confidential, ${Object.values(datasets).filter(d => !d.confidentialComputingRequired).length} standard)`);

    // Create contracts with confidential computing datasets
    console.log('\n📋 Creating contracts with confidential computing datasets...');
    
    const contracts = {
      // Contract with confidential computing dataset
      confidentialContract: await Contract.create({
        contractId: 'CONFIDENTIAL-CONTRACT-001',
        tdcId: testUsers.tdc1.id,
        ccrpId: testUsers.ccrp1.id,
        ccrpCloudProvider: 'Azure',
        status: 'SIGNED',
        price: 150.00,
        duration: 30,
        termsAndConditions: 'Test contract for confidential computing dataset processing',
        contractDatasets: [{
          datasetId: datasets.medicalSpeech.datasetId,
          tdpId: testUsers.tdp1.id,
          datasetName: datasets.medicalSpeech.name,
          tdpName: testUsers.tdp1.name,
          individualPrice: 150.00,
          paymentStatus: 'PENDING',
          confidentialComputingRequired: true,
          category: 'Audio',
          size: 500,
          recordCount: 10000,
          license: 'Restricted',
          tags: ['medical', 'speech', 'confidential', 'hipaa']
        }],
        datasetCount: 1,
        tdpCount: 1,
        totalPrice: 150.00,
        // Azure configuration
        ccrpAzureSubscriptionId: ccrpCredentials.ccrp1.subscriptionId,
        ccrpAzureTenantId: ccrpCredentials.ccrp1.tenantId,
        ccrpAzureLocation: 'eastus',
        ccrpAzureResourceGroupPrefix: 'confidential-training',
        ccrpAzureVMSize: 'Standard_DC8s_v3',
        ccrpAzureStorageSku: 'Premium_LRS',
        ccrpAzureDatabaseSku: 'Standard',
        ccrpAzureEnableEncryption: true,
        ccrpAzureEnableMonitoring: true,
        ccrpAzureBudgetLimit: 2000.00
      }),

      // Contract with multiple confidential datasets
      multiConfidentialContract: await Contract.create({
        contractId: 'MULTI-CONFIDENTIAL-CONTRACT-001',
        tdcId: testUsers.tdc2.id,
        ccrpId: testUsers.ccrp2.id,
        ccrpCloudProvider: 'Azure',
        status: 'SIGNED',
        price: 500.00,
        duration: 60,
        termsAndConditions: 'Test contract for multiple confidential computing datasets',
        contractDatasets: [
          {
            datasetId: datasets.financialData.datasetId,
            tdpId: testUsers.tdp2.id,
            datasetName: datasets.financialData.name,
            tdpName: testUsers.tdp2.name,
            individualPrice: 200.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: true,
            category: 'Tabular',
            size: 300,
            recordCount: 50000,
            license: 'Restricted',
            tags: ['financial', 'transactions', 'confidential', 'sox']
          },
          {
            datasetId: datasets.patientRecords.datasetId,
            tdpId: testUsers.tdp1.id,
            datasetName: datasets.patientRecords.name,
            tdpName: testUsers.tdp1.name,
            individualPrice: 300.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: true,
            category: 'Tabular',
            size: 800,
            recordCount: 25000,
            license: 'Restricted',
            tags: ['medical', 'patient', 'confidential', 'hipaa']
          }
        ],
        datasetCount: 2,
        tdpCount: 2,
        totalPrice: 500.00,
        // Azure configuration
        ccrpAzureSubscriptionId: ccrpCredentials.ccrp2.subscriptionId,
        ccrpAzureTenantId: ccrpCredentials.ccrp2.tenantId,
        ccrpAzureLocation: 'canadacentral',
        ccrpAzureResourceGroupPrefix: 'multi-confidential-training',
        ccrpAzureVMSize: 'Standard_DC4s_v3',
        ccrpAzureStorageSku: 'Standard_LRS',
        ccrpAzureDatabaseSku: 'Basic',
        ccrpAzureEnableEncryption: true,
        ccrpAzureEnableMonitoring: true,
        ccrpAzureBudgetLimit: 1500.00
      }),

      // Contract with mixed datasets (confidential + standard)
      mixedContract: await Contract.create({
        contractId: 'MIXED-CONTRACT-001',
        tdcId: testUsers.tdc1.id,
        ccrpId: testUsers.ccrp3.id,
        ccrpCloudProvider: 'GCP',
        status: 'SIGNED',
        price: 185.00,
        duration: 45,
        termsAndConditions: 'Test contract with mixed confidential and standard datasets',
        contractDatasets: [
          {
            datasetId: datasets.medicalSpeech.datasetId,
            tdpId: testUsers.tdp1.id,
            datasetName: datasets.medicalSpeech.name,
            tdpName: testUsers.tdp1.name,
            individualPrice: 150.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: true,
            category: 'Audio',
            size: 500,
            recordCount: 10000,
            license: 'Restricted',
            tags: ['medical', 'speech', 'confidential', 'hipaa']
          },
          {
            datasetId: datasets.publicImages.datasetId,
            tdpId: testUsers.tdp3.id,
            datasetName: datasets.publicImages.name,
            tdpName: testUsers.tdp3.name,
            individualPrice: 35.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: false,
            category: 'Computer Vision',
            size: 200,
            recordCount: 5000,
            license: 'MIT',
            tags: ['images', 'public', 'computer-vision']
          }
        ],
        datasetCount: 2,
        tdpCount: 2,
        totalPrice: 185.00,
        // GCP configuration
        ccrpAzureLocation: 'westeurope',
        ccrpAzureResourceGroupPrefix: 'mixed-training',
        ccrpAzureVMSize: 'Standard_DC2s_v3',
        ccrpAzureStorageSku: 'Standard_LRS',
        ccrpAzureDatabaseSku: 'Basic',
        ccrpAzureEnableEncryption: true,
        ccrpAzureEnableMonitoring: true,
        ccrpAzureBudgetLimit: 1000.00
      }),

      // Contract with only standard datasets
      standardContract: await Contract.create({
        contractId: 'STANDARD-CONTRACT-001',
        tdcId: testUsers.tdc2.id,
        ccrpId: testUsers.ccrp1.id,
        ccrpCloudProvider: 'Azure',
        status: 'SIGNED',
        price: 135.00,
        duration: 30,
        termsAndConditions: 'Test contract for standard processing datasets',
        contractDatasets: [
          {
            datasetId: datasets.publicImages.datasetId,
            tdpId: testUsers.tdp3.id,
            datasetName: datasets.publicImages.name,
            tdpName: testUsers.tdp3.name,
            individualPrice: 50.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: false,
            category: 'Computer Vision',
            size: 200,
            recordCount: 5000,
            license: 'MIT',
            tags: ['images', 'public', 'computer-vision']
          },
          {
            datasetId: datasets.retailData.datasetId,
            tdpId: testUsers.tdp3.id,
            datasetName: datasets.retailData.name,
            tdpName: testUsers.tdp3.name,
            individualPrice: 75.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: false,
            category: 'Tabular',
            size: 150,
            recordCount: 15000,
            license: 'Apache-2.0',
            tags: ['retail', 'sales', 'public', 'analytics']
          },
          {
            datasetId: datasets.nlpText.datasetId,
            tdpId: testUsers.tdp2.id,
            datasetName: datasets.nlpText.name,
            tdpName: testUsers.tdp2.name,
            individualPrice: 10.00,
            paymentStatus: 'PENDING',
            confidentialComputingRequired: false,
            category: 'Natural Language Processing',
            size: 100,
            recordCount: 8000,
            license: 'MIT',
            tags: ['nlp', 'text', 'public', 'language']
          }
        ],
        datasetCount: 3,
        tdpCount: 2,
        totalPrice: 135.00,
        // Azure configuration
        ccrpAzureSubscriptionId: ccrpCredentials.ccrp1.subscriptionId,
        ccrpAzureTenantId: ccrpCredentials.ccrp1.tenantId,
        ccrpAzureLocation: 'eastus',
        ccrpAzureResourceGroupPrefix: 'standard-training',
        ccrpAzureVMSize: 'Standard_D2s_v3',
        ccrpAzureStorageSku: 'Standard_LRS',
        ccrpAzureDatabaseSku: 'Basic',
        ccrpAzureEnableEncryption: true,
        ccrpAzureEnableMonitoring: true,
        ccrpAzureBudgetLimit: 500.00
      })
    };

    console.log(`✅ Created ${Object.keys(contracts).length} contracts`);

    // Create training environments
    console.log('\n🏗️ Creating training environments...');
    
    const trainingEnvironments = {
      confidentialEnv: await TrainingEnvironment.create({
        contractId: contracts.confidentialContract.contractId,
        environmentId: 'CONFIDENTIAL-ENV-001',
        cloudProvider: 'Azure',
        region: 'eastus',
        status: 'ACTIVE',
        infrastructureConfig: {
          compute: {
            instanceType: 'Standard_DC8s_v3',
            cpuCores: 8,
            memoryGB: 32,
            gpuEnabled: true,
            gpuType: 'V100',
            gpuCount: 2,
            confidentialComputing: true,
            secureEnclave: true,
            trustedExecutionEnvironment: true
          },
          storage: {
            type: 'Premium SSD',
            sizeGB: 500,
            encryptionAlgorithm: 'AES-256-GCM',
            dataRetention: 365,
            accessLogging: true,
            versioning: true,
            replication: true
          },
          network: {
            vpcEnabled: true,
            privateSubnet: true,
            loadBalancer: true,
            cdnEnabled: false,
            bandwidth: '10Gbps',
            firewall: true,
            networkSecurityGroup: true,
            vpnRequired: true,
            privateLink: true
          },
          database: {
            type: 'PostgreSQL',
            version: '13',
            sizeGB: 100,
            highAvailability: true,
            sslRequired: true,
            auditLogging: true,
            connectionPooling: true
          },
          monitoring: {
            enabled: true,
            metrics: ['CPU', 'Memory', 'Network', 'Storage', 'Security', 'Compliance', 'Attestation'],
            logRetention: 365,
            securityMonitoring: true,
            complianceMonitoring: true,
            realTimeAlerts: true,
            anomalyDetection: true
          },
          security: {
            keyManagement: true,
            certificateManagement: true,
            identityProvider: true,
            accessControl: true
          },
          compliance: {
            auditTrail: true,
            complianceReporting: true,
            regularAudits: true,
            breachNotification: true
          }
        },
        securityConfig: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          encryptionAlgorithm: 'AES-256-GCM',
          keyRotation: true,
          keyRotationInterval: 30,
          networkIsolation: true,
          privateSubnet: true,
          vpnRequired: true,
          networkSecurityGroup: true,
          roleBasedAccess: true,
          multiFactorAuth: true,
          sessionTimeout: 1800,
          privilegedAccess: false,
          auditLogging: true,
          securityMonitoring: true,
          threatDetection: true,
          realTimeAlerts: true,
          anomalyDetection: true,
          dataResidency: 'US',
          regulatoryCompliance: ['GDPR', 'HIPAA', 'SOX', 'FedRAMP', 'ISO-27001'],
          attestationRequired: true,
          hardwareSecurityModule: true,
          secureEnclave: true,
          confidentialComputing: true,
          trustedExecutionEnvironment: true,
          dataLossPrevention: true,
          endpointProtection: true,
          intrusionDetection: true,
          vulnerabilityScanning: true,
          complianceMonitoring: true,
          regularAudits: true,
          breachNotification: true
        },
        monitoringConfig: {
          enabled: true,
          metrics: ['CPU', 'Memory', 'Network', 'Storage', 'Security', 'Compliance', 'Attestation'],
          alerts: true,
          logRetention: 365,
          securityMonitoring: true,
          complianceMonitoring: true,
          realTimeAlerts: true,
          anomalyDetection: true
        },
        createdBy: testUsers.tdc1.id
      }),

      standardEnv: await TrainingEnvironment.create({
        contractId: contracts.standardContract.contractId,
        environmentId: 'STANDARD-ENV-001',
        cloudProvider: 'Azure',
        region: 'eastus',
        status: 'ACTIVE',
        infrastructureConfig: {
          compute: {
            instanceType: 'Standard_D2s_v3',
            cpuCores: 4,
            memoryGB: 16,
            gpuEnabled: false,
            gpuType: null,
            gpuCount: 0,
            confidentialComputing: false,
            secureEnclave: false,
            trustedExecutionEnvironment: false
          },
          storage: {
            type: 'SSD',
            sizeGB: 100,
            encryptionAlgorithm: 'AES-256-GCM',
            dataRetention: 90,
            accessLogging: false,
            versioning: false,
            replication: false
          },
          network: {
            vpcEnabled: true,
            privateSubnet: true,
            loadBalancer: false,
            cdnEnabled: false,
            bandwidth: '1Gbps',
            firewall: true,
            networkSecurityGroup: false,
            vpnRequired: false,
            privateLink: false
          },
          database: {
            type: 'PostgreSQL',
            version: '13',
            sizeGB: 20,
            highAvailability: false,
            sslRequired: true,
            auditLogging: false,
            connectionPooling: false
          },
          monitoring: {
            enabled: true,
            metrics: ['CPU', 'Memory', 'Network', 'Storage'],
            logRetention: 30,
            securityMonitoring: false,
            complianceMonitoring: false,
            realTimeAlerts: false,
            anomalyDetection: false
          }
        },
        securityConfig: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          encryptionAlgorithm: 'AES-256-GCM',
          keyRotation: false,
          keyRotationInterval: null,
          networkIsolation: true,
          privateSubnet: true,
          vpnRequired: false,
          networkSecurityGroup: false,
          roleBasedAccess: true,
          multiFactorAuth: false,
          sessionTimeout: 3600,
          privilegedAccess: false,
          auditLogging: true,
          securityMonitoring: false,
          threatDetection: false,
          realTimeAlerts: false,
          anomalyDetection: false,
          dataResidency: 'US',
          regulatoryCompliance: ['GDPR'],
          attestationRequired: false,
          hardwareSecurityModule: false,
          secureEnclave: false,
          confidentialComputing: false,
          trustedExecutionEnvironment: false,
          dataLossPrevention: false,
          endpointProtection: false,
          intrusionDetection: false,
          vulnerabilityScanning: false,
          complianceMonitoring: false,
          regularAudits: false,
          breachNotification: false
        },
        monitoringConfig: {
          enabled: true,
          metrics: ['CPU', 'Memory', 'Network', 'Storage'],
          alerts: true,
          logRetention: 30,
          securityMonitoring: false,
          complianceMonitoring: false,
          realTimeAlerts: false,
          anomalyDetection: false
        },
        createdBy: testUsers.tdc2.id
      })
    };

    console.log(`✅ Created ${Object.keys(trainingEnvironments).length} training environments`);

    // Print summary
    console.log('\n📊 Test Data Summary:');
    console.log('=====================');
    console.log(`👥 Users: ${Object.keys(testUsers).length}`);
    console.log(`  - TDP: ${Object.keys(testUsers).filter(k => k.startsWith('tdp')).length}`);
    console.log(`  - TDC: ${Object.keys(testUsers).filter(k => k.startsWith('tdc')).length}`);
    console.log(`  - CCRP: ${Object.keys(testUsers).filter(k => k.startsWith('ccrp')).length}`);
    console.log(`  - Admin: ${Object.keys(testUsers).filter(k => k.startsWith('appAdmin')).length}`);
    
    console.log(`🔐 CCRP Credentials: ${Object.keys(ccrpCredentials).length}`);
    console.log(`🤖 AI Models: ${Object.keys(aiModels).length}`);
    console.log(`📊 Datasets: ${Object.keys(datasets).length}`);
    console.log(`  - Confidential Computing Required: ${Object.values(datasets).filter(d => d.confidentialComputingRequired).length}`);
    console.log(`  - Standard Processing: ${Object.values(datasets).filter(d => !d.confidentialComputingRequired).length}`);
    console.log(`📋 Contracts: ${Object.keys(contracts).length}`);
    console.log(`🏗️ Training Environments: ${Object.keys(trainingEnvironments).length}`);

    console.log('\n🎯 Test Scenarios Available:');
    console.log('==========================');
    console.log('1. ✅ Confidential Computing Dataset Processing');
    console.log('2. ✅ Multi-Confidential Dataset Contract');
    console.log('3. ✅ Mixed Confidential + Standard Datasets');
    console.log('4. ✅ Standard Processing Only');
    console.log('5. ✅ CCRP Azure Credentials Management');
    console.log('6. ✅ Infrastructure Provisioning with Enhanced Security');
    console.log('7. ✅ Training Environment with Confidential Computing');
    console.log('8. ✅ API Testing for Confidential Computing Features');

    console.log('\n🔑 Test Credentials:');
    console.log('==================');
    console.log('TDP Users:');
    Object.entries(testUsers).filter(([key]) => key.startsWith('tdp')).forEach(([key, user]) => {
      console.log(`  - ${user.name}: ${user.email}`);
    });
    
    console.log('\nTDC Users:');
    Object.entries(testUsers).filter(([key]) => key.startsWith('tdc')).forEach(([key, user]) => {
      console.log(`  - ${user.name}: ${user.email}`);
    });
    
    console.log('\nCCRP Users:');
    Object.entries(testUsers).filter(([key]) => key.startsWith('ccrp')).forEach(([key, user]) => {
      console.log(`  - ${user.name}: ${user.email}`);
    });

    console.log('\n📊 Confidential Computing Datasets:');
    Object.entries(datasets).filter(([key, dataset]) => dataset.confidentialComputingRequired).forEach(([key, dataset]) => {
      console.log(`  - ${dataset.name}: $${dataset.price} (${dataset.category})`);
    });

    console.log('\n✅ Test data creation completed successfully!');
    console.log('\n🚀 Ready for testing confidential computing features!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
if (require.main === module) {
  createTestData();
}

module.exports = { createTestData }; 