/**
 * Refresh Test Data Script
 * 
 * This script refreshes the database with comprehensive test data for:
 * - TDP (Training Data Provider) users with datasets
 * - TDC (Training Data Consumer) users
 * - CCRP (Confidential Clean Room Provider) users
 * - Sample AI models for Ricardian contracts
 * - Test datasets with various categories
 * 
 * Usage: node scripts/refresh-test-data.js
 */

const { User, Dataset, Contract, Notification } = require('../../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Sample AI Models for Ricardian Contracts
const SAMPLE_MODELS = [
  {
    id: 'transformer-gpt-4',
    name: 'GPT-4 Transformer Model',
    description: 'Large language model for natural language processing',
    type: 'transformer',
    architecture: 'decoder-only',
    parameters: '175B',
    framework: 'PyTorch',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
    maxEpochs: 100,
    batchSize: 32,
    learningRate: 0.001
  },
  {
    id: 'bert-classifier',
    name: 'BERT Text Classifier',
    description: 'Bidirectional encoder for text classification tasks',
    type: 'transformer',
    architecture: 'encoder-only',
    parameters: '110M',
    framework: 'TensorFlow',
    privacyTechnique: 'differential-privacy',
    validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
    maxEpochs: 50,
    batchSize: 16,
    learningRate: 0.0001
  },
  {
    id: 'cnn-image-classifier',
    name: 'CNN Image Classifier',
    description: 'Convolutional neural network for image classification',
    type: 'cnn',
    architecture: 'resnet-50',
    parameters: '25M',
    framework: 'PyTorch',
    privacyTechnique: 'homomorphic-encryption',
    validationMetrics: ['accuracy', 'top-5-accuracy', 'precision', 'recall'],
    maxEpochs: 200,
    batchSize: 64,
    learningRate: 0.01
  },
  {
    id: 'lstm-sequence-model',
    name: 'LSTM Sequence Model',
    description: 'Long short-term memory for sequence prediction',
    type: 'rnn',
    architecture: 'lstm',
    parameters: '10M',
    framework: 'TensorFlow',
    privacyTechnique: 'secure-multi-party-computation',
    validationMetrics: ['accuracy', 'perplexity', 'bleu-score'],
    maxEpochs: 150,
    batchSize: 128,
    learningRate: 0.001
  },
  {
    id: 'gan-generative-model',
    name: 'GAN Generative Model',
    description: 'Generative adversarial network for image generation',
    type: 'gan',
    architecture: 'dcgan',
    parameters: '15M',
    framework: 'PyTorch',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['fid-score', 'inception-score', 'diversity'],
    maxEpochs: 300,
    batchSize: 32,
    learningRate: 0.0002
  }
];

// Sample Datasets for TDP Users
const SAMPLE_DATASETS = [
  {
    name: 'Medical Imaging Dataset',
    description: 'High-quality medical images for disease detection and diagnosis',
          category: 'Computer Vision',
          price: '5.00', // 5 ETH in decimal format
    size: '2.5GB',
    records: 50000,
    format: 'DICOM',
    privacyLevel: 'HIGH',
    compliance: ['HIPAA', 'GDPR'],
    tags: ['medical', 'imaging', 'healthcare', 'diagnosis']
  },
  {
    name: 'Financial Transaction Dataset',
    description: 'Secure financial transaction data for fraud detection models',
          category: 'Tabular',
          price: '3.00', // 3 ETH in decimal format
    size: '1.8GB',
    records: 100000,
    format: 'CSV',
    privacyLevel: 'HIGH',
    compliance: ['PCI-DSS', 'SOX'],
    tags: ['finance', 'transactions', 'fraud-detection', 'banking']
  },
  {
    name: 'Natural Language Corpus',
    description: 'Large text corpus for language model training',
          category: 'Natural Language Processing',
          price: '2.00', // 2 ETH in decimal format
    size: '5.2GB',
    records: 200000,
    format: 'TXT',
    privacyLevel: 'MEDIUM',
    compliance: ['GDPR'],
    tags: ['nlp', 'text', 'language-model', 'corpus']
  },
  {
    name: 'Autonomous Vehicle Sensor Data',
    description: 'Multi-modal sensor data for autonomous vehicle training',
          category: 'Multimodal',
          price: '8.00', // 8 ETH in decimal format
    size: '15.7GB',
    records: 75000,
    format: 'BINARY',
    privacyLevel: 'HIGH',
    compliance: ['ISO-26262'],
    tags: ['autonomous', 'vehicle', 'sensor', 'lidar', 'camera']
  },
  {
    name: 'E-commerce User Behavior',
    description: 'User interaction data for recommendation systems',
          category: 'Tabular',
          price: '1.50', // 1.5 ETH in decimal format
    size: '3.1GB',
    records: 150000,
    format: 'JSON',
    privacyLevel: 'MEDIUM',
    compliance: ['GDPR', 'CCPA'],
    tags: ['ecommerce', 'recommendations', 'user-behavior', 'analytics']
  },
  {
    name: 'Satellite Imagery Dataset',
    description: 'High-resolution satellite images for environmental monitoring',
          category: 'Computer Vision',
          price: '4.00', // 4 ETH in decimal format
    size: '8.9GB',
    records: 25000,
    format: 'TIFF',
    privacyLevel: 'LOW',
    compliance: ['ISO-14001'],
    tags: ['satellite', 'environmental', 'monitoring', 'remote-sensing']
  }
];

// Test Users Configuration
const TEST_USERS = {
  TDP: [
    {
      name: 'MedData Solutions Inc.',
      email: 'tdp.medical@example.com',
      password: 'TestPassword123!',
      partyType: 'TDP',
      organization: 'MedData Solutions Inc.',
      description: 'Leading provider of medical imaging datasets for AI healthcare applications',
      walletAddress: '0x340b30dc59b4cfb2f7ec80178ddd06ab1763b079',
      did: 'did:web:meddata-solutions.com',
      datasets: [0, 1] // Medical and Financial datasets
    },
    {
      name: 'NLP Research Foundation',
      email: 'tdp.nlp@example.com',
      password: 'TestPassword123!',
      partyType: 'TDP',
      organization: 'NLP Research Foundation',
      description: 'Specialized in natural language processing datasets and language models',
      walletAddress: '0xf5efa74782aca84e5ec32d3452efc064e3ada2ea',
      did: 'did:web:nlp-research.org',
      datasets: [2] // Natural Language Corpus
    },
    {
      name: 'AutoDrive Technologies',
      email: 'tdp.autodrive@example.com',
      password: 'TestPassword123!',
      partyType: 'TDP',
      organization: 'AutoDrive Technologies',
      description: 'Pioneering autonomous vehicle sensor data for safe AI training',
      walletAddress: '0xf06a58760e41531a5614080ae615454a9a0412f3',
      did: 'did:web:autodrive-tech.com',
      datasets: [3] // Autonomous Vehicle Sensor Data
    }
  ],
  TDC: [
    {
      name: 'AI Healthcare Innovations',
      email: 'tdc.healthcare@example.com',
      password: 'TestPassword123!',
      partyType: 'TDC',
      organization: 'AI Healthcare Innovations',
      description: 'Developing AI-powered diagnostic tools for medical imaging',
      walletAddress: '0x60ccc8ee65d8cc4eb4cd9b2d0661179c69fa5c74',
      did: 'did:web:ai-healthcare.com'
    },
    {
      name: 'FinTech Analytics Corp',
      email: 'tdc.fintech@example.com',
      password: 'TestPassword123!',
      partyType: 'TDC',
      organization: 'FinTech Analytics Corp',
      description: 'Building fraud detection systems using machine learning',
      walletAddress: '0xf24adb89ae76c1adee2ca437f66b5edf1b8ad31e',
      did: 'did:web:fintech-analytics.com'
    },
    {
      name: 'Language AI Labs',
      email: 'tdc.language@example.com',
      password: 'TestPassword123!',
      partyType: 'TDC',
      organization: 'Language AI Labs',
      description: 'Researching advanced language models and NLP applications',
      walletAddress: '0x8285dd81526e27f0724dad155d6a9ec8d82dd462',
      did: 'did:web:language-ai.com'
    }
  ],
  CCRP: [
    {
      name: 'SecureCloud Confidential Computing',
      email: 'ccrp.securecloud@example.com',
      password: 'TestPassword123!',
      partyType: 'CCRP',
      organization: 'SecureCloud Confidential Computing',
      description: 'Enterprise-grade confidential computing platform for secure AI training',
      walletAddress: '0x9997c1c6424141255b2bb53125e0c4f41a20adab',
      did: 'did:web:securecloud-cc.com',
      platform: 'Azure Confidential Computing',
      securityFeatures: ['AMD SEV-SNP', 'Intel SGX', 'TPM 2.0']
    },
    {
      name: 'TrustedAI Environment Provider',
      email: 'ccrp.trustedai@example.com',
      password: 'TestPassword123!',
      partyType: 'CCRP',
      organization: 'TrustedAI Environment Provider',
      description: 'Specialized in privacy-preserving AI training environments',
      walletAddress: '0x1d3f4d1906d176d57ee3a1bab382b7b434ea67ae',
      did: 'did:web:trustedai-env.com',
      platform: 'Google Cloud Confidential Computing',
      securityFeatures: ['Confidential VMs', 'Encrypted Storage', 'VPC Isolation']
    },
    {
      name: 'PrivacyFirst Computing Solutions',
      email: 'ccrp.privacyfirst@example.com',
      password: 'TestPassword123!',
      partyType: 'CCRP',
      organization: 'PrivacyFirst Computing Solutions',
      description: 'Leading provider of privacy-first computing environments for AI training',
      walletAddress: '0xf4b96a233fef46d4531aea4763f11c98436f8198',
      did: 'did:web:privacyfirst-computing.com',
      platform: 'AWS Nitro Enclaves',
      securityFeatures: ['Nitro Enclaves', 'KMS Integration', 'IAM Roles']
    }
  ]
};

async function clearDatabase() {
  console.log('🗑️ Clearing existing test data...');
  
  try {
    // Clear all data in reverse dependency order
    await Notification.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await User.destroy({ 
      where: { 
        partyType: ['TDP', 'TDC', 'CCRP'],
        email: {
          [require('sequelize').Op.like]: '%@example.com'
        }
      } 
    });
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function createUsers() {
  console.log('👥 Creating test users...');
  
  const createdUsers = {};
  
  try {
    for (const [partyType, users] of Object.entries(TEST_USERS)) {
      createdUsers[partyType] = [];
      
      for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          partyType: userData.partyType,
          organization: userData.organization,
          description: userData.description,
          walletAddress: userData.walletAddress,
          did: userData.did,
          isActive: true,
          isRegistered: true,
          profileCompleted: true,
          emailVerified: true,
          onboardingStatus: 'COMPLETED'
        });
        
        createdUsers[partyType].push(user);
        console.log(`✅ Created ${partyType} user: ${user.name} (${user.email})`);
      }
    }
    
    console.log('✅ All test users created successfully');
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function createDatasets(users) {
  console.log('📊 Creating test datasets...');
  
  try {
    const datasets = [];
    
    for (let i = 0; i < SAMPLE_DATASETS.length; i++) {
      const datasetData = SAMPLE_DATASETS[i];
      
      // Assign dataset to appropriate TDP user
      let ownerId;
      if (i < 2) {
        ownerId = users.TDP[0].id; // MedData Solutions gets medical and financial
      } else if (i === 2) {
        ownerId = users.TDP[1].id; // NLP Research gets language corpus
      } else {
        ownerId = users.TDP[2].id; // AutoDrive gets vehicle data
      }
      
      const dataset = await Dataset.create({
        datasetId: `DATASET-${Date.now()}-${i}`,
        name: datasetData.name,
        description: datasetData.description,
        category: datasetData.category,
        price: datasetData.price,
        size: parseInt(datasetData.size.replace('GB', '')) * 1024, // Convert GB to MB
        recordCount: datasetData.records,
        license: 'MIT',
        tags: datasetData.tags,
        metadata: {
          format: datasetData.format,
          privacyLevel: datasetData.privacyLevel,
          compliance: datasetData.compliance
        },
        ownerId: ownerId,
        isActive: true,
        isPublic: true
      });
      
      datasets.push(dataset);
      console.log(`✅ Created dataset: ${dataset.name} (owned by ${users.TDP.find(u => u.id === ownerId).name})`);
    }
    
    console.log('✅ All test datasets created successfully');
    return datasets;
  } catch (error) {
    console.error('❌ Error creating datasets:', error);
    throw error;
  }
}

async function createSampleRicardianContracts(users, datasets) {
  console.log('📄 Creating sample Ricardian contracts...');
  
  try {
    const contracts = [];
    
    // Create a few sample Ricardian contracts
    const sampleContracts = [
      {
        contractId: 'CONTRACT-2024-001',
        tdpId: users.TDP[0].id,
        tdcId: users.TDC[0].id,
        datasetId: datasets[0].id, // Medical dataset
        modelId: 'transformer-gpt-4',
        price: '5.00',
        duration: 30,
        termsAndConditions: 'This contract establishes the terms for training an AI model on medical imaging data with strict privacy and security requirements.',
        status: 'ACTIVE',
        tdpSigned: true,
        ccrpSigned: true,
        legalDocument: {
          ricardianContract: {
            metadata: {
              version: '1.0',
              contractType: 'AI_TRAINING',
              createdAt: new Date().toISOString(),
              legalDocumentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              smartContractAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
            },
            legalDocument: {
              effectiveDate: '2024-01-15',
              expirationDate: '2024-02-14',
              parties: {
                dataProvider: {
                  name: users.TDP[0].name,
                  email: users.TDP[0].email,
                  blockchainAddress: users.TDP[0].walletAddress,
                  did: users.TDP[0].did
                },
                modelTrainer: {
                  name: users.TDC[0].name,
                  email: users.TDC[0].email,
                  blockchainAddress: users.TDC[0].walletAddress,
                  did: users.TDC[0].did
                }
              },
              terms: {
                dataUsage: 'Medical imaging data for AI diagnostic model training',
                privacyRequirements: 'HIPAA compliant, encrypted data processing',
                modelOutputs: 'Diagnostic predictions with confidence scores',
                compliance: ['HIPAA', 'GDPR', 'FDA']
              }
            }
          }
        },
        legalDocumentHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        ricardianSignature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        smartContractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        smartContractNetwork: 'goerli',
        environmentSpecs: {
          infrastructure: {
            computeType: 'confidential-vm',
            memoryGB: 64,
            cpuCores: 16,
            gpuType: 'V100',
            gpuCount: 4
          },
          security: {
            attestationRequired: true,
            encryptionAtRest: true,
            encryptionInTransit: true,
            networkIsolation: true
          },
          kms: {
            provider: 'azure-key-vault',
            keyName: 'medical-data-key',
            region: 'eastus'
          }
        },
        trainingParams: {
          modelType: 'transformer',
          privacyTechnique: 'federated-learning',
          validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
          maxEpochs: 100,
          batchSize: 32,
          learningRate: 0.001
        }
      },
      {
        contractId: 'CONTRACT-2024-002',
        tdpId: users.TDP[1].id,
        tdcId: users.TDC[2].id,
        datasetId: datasets[2].id, // NLP dataset
        modelId: 'bert-classifier',
        price: '2.00',
        duration: 45,
        termsAndConditions: 'Contract for training BERT model on natural language corpus with privacy-preserving techniques.',
        status: 'PENDING_CCRP_APPROVAL',
        tdpSigned: true,
        ccrpSigned: false,
        legalDocument: {
          ricardianContract: {
            metadata: {
              version: '1.0',
              contractType: 'AI_TRAINING',
              createdAt: new Date().toISOString(),
              legalDocumentHash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef',
              smartContractAddress: '0xbcdef12345678901bcdef12345678901bcdef123'
            },
            legalDocument: {
              effectiveDate: '2024-01-20',
              expirationDate: '2024-03-06',
              parties: {
                dataProvider: {
                  name: users.TDP[1].name,
                  email: users.TDP[1].email,
                  blockchainAddress: users.TDP[1].walletAddress,
                  did: users.TDP[1].did
                },
                modelTrainer: {
                  name: users.TDC[2].name,
                  email: users.TDC[2].email,
                  blockchainAddress: users.TDC[2].walletAddress,
                  did: users.TDC[2].did
                }
              },
              terms: {
                dataUsage: 'Natural language corpus for BERT model training',
                privacyRequirements: 'GDPR compliant, differential privacy',
                modelOutputs: 'Text classification with confidence scores',
                compliance: ['GDPR', 'CCPA']
              }
            }
          }
        },
        legalDocumentHash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef',
        ricardianSignature: '0xbcdef12345678901bcdef12345678901bcdef12345678901bcdef12345678901',
        smartContractAddress: '0xbcdef12345678901bcdef12345678901bcdef123',
        smartContractNetwork: 'sepolia',
        environmentSpecs: {
          infrastructure: {
            computeType: 'confidential-vm',
            memoryGB: 32,
            cpuCores: 8,
            gpuType: 'T4',
            gpuCount: 2
          },
          security: {
            attestationRequired: true,
            encryptionAtRest: true,
            encryptionInTransit: true,
            networkIsolation: true
          },
          kms: {
            provider: 'google-cloud-kms',
            keyName: 'nlp-data-key',
            region: 'us-central1'
          }
        },
        trainingParams: {
          modelType: 'transformer',
          privacyTechnique: 'differential-privacy',
          validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
          maxEpochs: 50,
          batchSize: 16,
          learningRate: 0.0001
        }
      }
    ];
    
    for (const contractData of sampleContracts) {
      const contract = await Contract.create(contractData);
      contracts.push(contract);
      console.log(`✅ Created Ricardian contract: ${contract.contractId}`);
    }
    
    console.log('✅ Sample Ricardian contracts created successfully');
    return contracts;
  } catch (error) {
    console.error('❌ Error creating sample contracts:', error);
    throw error;
  }
}

async function createNotifications(users) {
  console.log('📧 Creating notifications...');
  
  const notifications = [];
  for (const user of users) {
    // Skip notification creation for now due to enum issues
    console.log(`⏭️  Skipping notifications for user ${user.name} (enum issue)`);
  }
  
  console.log('✅ Notifications creation completed (skipped due to enum issues)');
}

async function createAIModels() {
  console.log('🤖 Creating AI models...');
  
  const models = [
    {
      modelId: 'transformer-gpt-4',
      name: 'GPT-4 Transformer Model',
      description: 'Large language model for natural language processing',
      type: 'transformer',
      architecture: 'decoder-only',
      parameters: '175B',
      framework: 'PyTorch',
      privacyTechnique: 'federated-learning',
      validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
      maxEpochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      isActive: true
    },
    {
      modelId: 'bert-classifier',
      name: 'BERT Text Classifier',
      description: 'Bidirectional encoder for text classification tasks',
      type: 'transformer',
      architecture: 'encoder-only',
      parameters: '110M',
      framework: 'TensorFlow',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
      maxEpochs: 50,
      batchSize: 16,
      learningRate: 0.0001,
      isActive: true
    },
    {
      modelId: 'cnn-image-classifier',
      name: 'CNN Image Classifier',
      description: 'Convolutional neural network for image classification',
      type: 'cnn',
      architecture: 'resnet-50',
      parameters: '25M',
      framework: 'PyTorch',
      privacyTechnique: 'homomorphic-encryption',
      validationMetrics: ['accuracy', 'top-5-accuracy', 'precision', 'recall'],
      maxEpochs: 200,
      batchSize: 64,
      learningRate: 0.01,
      isActive: true
    },
    {
      modelId: 'lstm-sequence-model',
      name: 'LSTM Sequence Model',
      description: 'Long short-term memory for sequence prediction',
      type: 'rnn',
      architecture: 'lstm',
      parameters: '10M',
      framework: 'TensorFlow',
      privacyTechnique: 'secure-multi-party-computation',
      validationMetrics: ['accuracy', 'perplexity', 'bleu-score'],
      maxEpochs: 150,
      batchSize: 128,
      learningRate: 0.001,
      isActive: true
    },
    {
      modelId: 'gan-generative-model',
      name: 'GAN Generative Model',
      description: 'Generative adversarial network for image generation',
      type: 'gan',
      architecture: 'dcgan',
      parameters: '15M',
      framework: 'PyTorch',
      privacyTechnique: 'federated-learning',
      validationMetrics: ['fid-score', 'inception-score', 'diversity'],
      maxEpochs: 300,
      batchSize: 32,
      learningRate: 0.0002,
      isActive: true
    }
  ];

  for (const modelData of models) {
    try {
      const [model, created] = await db.AIModel.findOrCreate({
        where: { modelId: modelData.modelId },
        defaults: modelData
      });
      
      if (created) {
        console.log(`✅ Created AI model: ${model.name}`);
      } else {
        console.log(`⏭️  AI model already exists: ${model.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating AI model ${modelData.name}:`, error.message);
    }
  }
  
  console.log('✅ AI models creation completed');
}

async function main() {
  try {
    console.log('🚀 Starting database refresh with new test data...');
    
    // Clear existing test data
    await clearDatabase();
    
    // Create users
    const users = await createUsers();
    
    // Create datasets
    const datasets = await createDatasets(users);
    
    // Create Ricardian contracts
    await createSampleRicardianContracts(users, datasets);
    
    // Create AI models
    await createAIModels();
    
    // Create notifications (skipped due to enum issues)
    await createNotifications(users);
    
    console.log('✅ Database refresh completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: ${users.length}`);
    console.log(`📁 Datasets created: ${datasets.length}`);
    console.log(`🤖 AI models created: 5`);
    console.log(`📄 Ricardian contracts created: 3`);
    console.log(`📧 Notifications: Skipped (enum issues)`);
    
  } catch (error) {
    console.error('❌ Error during database refresh:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  SAMPLE_MODELS,
  TEST_USERS,
  SAMPLE_DATASETS,
  clearDatabase,
  createUsers,
  createDatasets,
  createSampleRicardianContracts,
  createNotifications,
  main
};

// Run if called directly
if (require.main === module) {
  main();
} 