const axios = require('axios');
const { User, Dataset, AIModel } = require('../../models');

// Configuration
const BASE_URL = 'http://localhost:5001/api';
const BACKEND_URL = 'http://localhost:5001';

// Test users data (same as before)
const testUsers = [
  {
    name: 'MedData Solutions Inc.',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    organization: 'MedData Solutions Inc.',
    description: 'Leading provider of medical imaging datasets for AI healthcare applications',
    phoneNumber: '+1-555-0101',
    website: 'https://meddata-solutions.com',
    location: 'Boston, MA'
  },
  {
    name: 'NLP Research Foundation',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    organization: 'NLP Research Foundation',
    description: 'Specialized in natural language processing datasets and text analytics',
    phoneNumber: '+1-555-0102',
    website: 'https://nlp-research.org',
    location: 'San Francisco, CA'
  },
  {
    name: 'AutoDrive Technologies',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    organization: 'AutoDrive Technologies',
    description: 'Autonomous vehicle sensor data and driving behavior datasets',
    phoneNumber: '+1-555-0103',
    website: 'https://autodrive-tech.com',
    location: 'Detroit, MI'
  },
  {
    name: 'AI Healthcare Innovations',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    organization: 'AI Healthcare Innovations',
    description: 'Developing AI-powered diagnostic tools for medical imaging',
    phoneNumber: '+1-555-0201',
    website: 'https://ai-healthcare.com',
    location: 'New York, NY'
  },
  {
    name: 'FinTech Analytics Corp',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    organization: 'FinTech Analytics Corp',
    description: 'Financial data analytics and risk assessment AI models',
    phoneNumber: '+1-555-0202',
    website: 'https://fintech-analytics.com',
    location: 'Chicago, IL'
  },
  {
    name: 'Language AI Labs',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    organization: 'Language AI Labs',
    description: 'Multilingual AI models and language processing solutions',
    phoneNumber: '+1-555-0203',
    website: 'https://language-ai-labs.com',
    location: 'Seattle, WA'
  },
  {
    name: 'SecureCloud Confidential Computing',
    email: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    organization: 'SecureCloud Confidential Computing',
    description: 'Enterprise-grade confidential computing platform for secure AI training',
    phoneNumber: '+1-555-0301',
    website: 'https://securecloud-cc.com',
    location: 'Austin, TX'
  },
  {
    name: 'TrustedAI Environment Provider',
    email: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    organization: 'TrustedAI Environment Provider',
    description: 'Trusted execution environments for AI model training and inference',
    phoneNumber: '+1-555-0302',
    website: 'https://trustedai-env.com',
    location: 'Denver, CO'
  },
  {
    name: 'PrivacyFirst Computing Solutions',
    email: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    organization: 'PrivacyFirst Computing Solutions',
    description: 'Privacy-preserving AI training environments with zero-knowledge proofs',
    phoneNumber: '+1-555-0303',
    website: 'https://privacyfirst-computing.com',
    location: 'Portland, OR'
  }
];

// Function to check if backend is running
async function checkBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running');
    return true;
  } catch (error) {
    console.error('❌ Backend is not running. Please start the backend server first.');
    return false;
  }
}

// Function to clean up existing users from database
async function cleanupExistingUsers() {
  console.log('🧹 Cleaning up existing users...');
  
  try {
    // Get all users
    const users = await User.findAll();
    console.log(`📋 Found ${users.length} existing users`);
    
    if (users.length === 0) {
      console.log('ℹ️ No users to clean up');
      return;
    }
    
    // Delete users that match our test user emails
    const testEmails = testUsers.map(u => u.email);
    const usersToDelete = users.filter(user => testEmails.includes(user.email));
    
    console.log(`🗑️ Deleting ${usersToDelete.length} test users...`);
    
    for (const user of usersToDelete) {
      console.log(`   Deleting: ${user.name} (${user.email})`);
      await user.destroy();
    }
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

// Function to register a user via API
async function registerUser(userData) {
  try {
    console.log(`🔄 Registering: ${userData.name} (${userData.email})`);
    
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    
    console.log(`✅ Successfully registered: ${userData.name}`);
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Party Type: ${response.data.user.partyType}`);
    
    if (response.data.loginCredentials) {
      console.log(`   Login Email: ${response.data.loginCredentials.email}`);
      console.log(`   Login Password: ${response.data.loginCredentials.password}`);
    }
    
    return {
      success: true,
      user: response.data.user,
      credentials: response.data.loginCredentials
    };
  } catch (error) {
    console.error(`❌ Failed to register ${userData.name}:`, error.response?.data || error.message);
    return {
      success: false,
      reason: 'ERROR',
      error: error.response?.data || error.message
    };
  }
}

// Function to create test datasets
async function createTestDatasets() {
  console.log('\n📊 Creating test datasets...');
  
  try {
    // Get TDP users
    const tdpUsers = await User.findAll({
      where: { partyType: 'TDP' }
    });
    
    if (tdpUsers.length === 0) {
      console.log('⚠️ No TDP users found for dataset creation');
      return;
    }
    
    const datasets = [
      {
        name: 'Medical Imaging Dataset',
        description: 'Comprehensive medical imaging dataset for AI healthcare applications',
        category: 'Healthcare',
        size: '2.5GB',
        recordCount: 50000,
        price: 1000,
        license: 'Commercial',
        tags: ['medical', 'imaging', 'healthcare', 'AI'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true
      },
      {
        name: 'Financial Transaction Dataset',
        description: 'Secure financial transaction data for fraud detection and risk assessment',
        category: 'Finance',
        size: '1.8GB',
        recordCount: 75000,
        price: 1500,
        license: 'Commercial',
        tags: ['finance', 'transactions', 'fraud-detection'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true
      },
      {
        name: 'NLP Text Dataset',
        description: 'Natural language processing dataset for text analytics and language models',
        category: 'NLP',
        size: '3.2GB',
        recordCount: 100000,
        price: 800,
        license: 'Academic',
        tags: ['nlp', 'text', 'language', 'analytics'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false
      },
      {
        name: 'Autonomous Vehicle Dataset',
        description: 'Sensor data from autonomous vehicles for AI training and validation',
        category: 'Transportation',
        size: '5.1GB',
        recordCount: 25000,
        price: 2000,
        license: 'Commercial',
        tags: ['autonomous', 'vehicles', 'sensors', 'AI'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true
      },
      {
        name: 'E-commerce Dataset',
        description: 'E-commerce transaction and user behavior data for recommendation systems',
        category: 'E-commerce',
        size: '1.2GB',
        recordCount: 60000,
        price: 1200,
        license: 'Commercial',
        tags: ['ecommerce', 'transactions', 'recommendations'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false
      },
      {
        name: 'Satellite Imagery Dataset',
        description: 'High-resolution satellite imagery for environmental monitoring and analysis',
        category: 'Remote Sensing',
        size: '8.7GB',
        recordCount: 15000,
        price: 3000,
        license: 'Commercial',
        tags: ['satellite', 'imagery', 'environmental', 'monitoring'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true
      }
    ];
    
    let createdCount = 0;
    
    for (let i = 0; i < datasets.length; i++) {
      const dataset = datasets[i];
      const owner = tdpUsers[i % tdpUsers.length]; // Distribute datasets among TDP users
      
      try {
        await Dataset.create({
          ...dataset,
          ownerId: owner.id,
          datasetId: `dataset-${Date.now()}-${i}`
        });
        
        console.log(`✅ Created dataset: ${dataset.name} (Owner: ${owner.name})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create dataset ${dataset.name}:`, error.message);
      }
    }
    
    console.log(`📊 Created ${createdCount} datasets`);
    
  } catch (error) {
    console.error('❌ Dataset creation failed:', error.message);
  }
}

// Function to create test AI models
async function createTestAIModels() {
  console.log('\n🤖 Creating test AI models...');
  
  try {
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
        description: 'BERT-based model for text classification tasks',
        type: 'transformer',
        architecture: 'encoder-only',
        parameters: '110M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: ['accuracy', 'precision', 'recall'],
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
        validationMetrics: ['accuracy', 'top-5-accuracy'],
        maxEpochs: 200,
        batchSize: 64,
        learningRate: 0.01,
        isActive: true
      },
      {
        modelId: 'lstm-sequence-model',
        name: 'LSTM Sequence Model',
        description: 'Long short-term memory network for sequence prediction',
        type: 'lstm',
        architecture: 'bidirectional',
        parameters: '15M',
        framework: 'TensorFlow',
        privacyTechnique: 'secure-multi-party-computation',
        validationMetrics: ['mse', 'mae', 'r2-score'],
        maxEpochs: 150,
        batchSize: 32,
        learningRate: 0.001,
        isActive: true
      },
      {
        modelId: 'gan-generative-model',
        name: 'GAN Generative Model',
        description: 'Generative adversarial network for synthetic data generation',
        type: 'gan',
        architecture: 'dcgan',
        parameters: '50M',
        framework: 'PyTorch',
        privacyTechnique: 'zero-knowledge-proofs',
        validationMetrics: ['fid-score', 'inception-score'],
        maxEpochs: 300,
        batchSize: 128,
        learningRate: 0.0002,
        isActive: true
      }
    ];
    
    let createdCount = 0;
    
    for (const model of models) {
      try {
        await AIModel.create(model);
        console.log(`✅ Created AI model: ${model.name}`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Failed to create AI model ${model.name}:`, error.message);
      }
    }
    
    console.log(`🤖 Created ${createdCount} AI models`);
    
  } catch (error) {
    console.error('❌ AI model creation failed:', error.message);
  }
}

// Main function
async function cleanupAndRecreateUsers() {
  console.log('🚀 Cleaning up and recreating test users properly...');
  
  // Check if backend is running
  if (!await checkBackendHealth()) {
    return;
  }
  
  try {
    // Step 1: Clean up existing users
    await cleanupExistingUsers();
    
    // Step 2: Create users via proper registration API
    console.log('\n🔄 Creating users via registration API...');
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (const user of testUsers) {
      const result = await registerUser(user);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 3: Create test datasets
    await createTestDatasets();
    
    // Step 4: Create test AI models
    await createTestAIModels();
    
    // Summary
    console.log('\n📊 Final Summary:');
    console.log(`✅ Successfully created: ${successCount} users`);
    console.log(`❌ Failed to create: ${errorCount} users`);
    console.log(`📋 Total processed: ${testUsers.length} users`);
    
    // Show credentials for successful registrations
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      console.log('\n🔑 Login Credentials for New Users:');
      successfulResults.forEach(result => {
        if (result.credentials) {
          console.log(`   ${result.user.email}: ${result.credentials.password}`);
        }
      });
    }
    
    if (errorCount === 0) {
      console.log('\n🎉 All users created successfully via proper registration API!');
    } else {
      console.log('\n⚠️ Some users failed to register. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  cleanupAndRecreateUsers()
    .then(() => {
      console.log('\n🎉 Cleanup and recreation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAndRecreateUsers }; 