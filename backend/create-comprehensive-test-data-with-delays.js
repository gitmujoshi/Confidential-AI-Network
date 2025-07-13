const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_PASSWORD = 'Test123!';

// Delay function to handle rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test data arrays (same as before)
const testTDPs = [
  {
    name: 'Healthcare Data Corp',
    email: 'healthcare@example.com',
    organization: 'Healthcare Data Corporation',
    description: 'Leading provider of healthcare datasets for AI research'
  },
  {
    name: 'Financial Analytics Inc',
    email: 'financial@example.com',
    organization: 'Financial Analytics Inc',
    description: 'Specialized in financial market datasets'
  },
  {
    name: 'Retail Insights Ltd',
    email: 'retail@example.com',
    organization: 'Retail Insights Ltd',
    description: 'Consumer behavior and retail analytics data'
  },
  {
    name: 'Manufacturing Data Co',
    email: 'manufacturing@example.com',
    organization: 'Manufacturing Data Co',
    description: 'Industrial and manufacturing datasets'
  },
  {
    name: 'Transportation Data Hub',
    email: 'transport@example.com',
    organization: 'Transportation Data Hub',
    description: 'Logistics and transportation datasets'
  }
];

const testTDCs = [
  {
    name: 'AI Research Institute',
    email: 'ai-research@example.com',
    organization: 'AI Research Institute',
    description: 'Research organization focused on AI model development'
  },
  {
    name: 'Tech Startup Alpha',
    email: 'tech-alpha@example.com',
    organization: 'Tech Startup Alpha',
    description: 'Innovative startup developing AI solutions'
  },
  {
    name: 'University AI Lab',
    email: 'university-ai@example.com',
    organization: 'University AI Laboratory',
    description: 'Academic research in artificial intelligence'
  },
  {
    name: 'Enterprise Solutions Corp',
    email: 'enterprise@example.com',
    organization: 'Enterprise Solutions Corp',
    description: 'Enterprise AI solutions provider'
  },
  {
    name: 'Data Science Consulting',
    email: 'datascience@example.com',
    organization: 'Data Science Consulting',
    description: 'Consulting firm specializing in data science'
  }
];

const testCCRPs = [
  {
    name: 'Secure Compute Hub',
    email: 'secure-compute@example.com',
    organization: 'Secure Compute Hub',
    description: 'Enterprise-grade secure computing environment'
  },
  {
    name: 'Privacy First Computing',
    email: 'privacy-first@example.com',
    organization: 'Privacy First Computing',
    description: 'Specialized in privacy-preserving computation'
  },
  {
    name: 'Cloud Security Solutions',
    email: 'cloud-security@example.com',
    organization: 'Cloud Security Solutions',
    description: 'Secure cloud-based processing environments'
  },
  {
    name: 'Confidential Computing Lab',
    email: 'confidential-lab@example.com',
    organization: 'Confidential Computing Lab',
    description: 'Research lab for confidential computing'
  },
  {
    name: 'Enterprise Security Hub',
    email: 'enterprise-security@example.com',
    organization: 'Enterprise Security Hub',
    description: 'Enterprise-grade security and compliance'
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
  },
  {
    datasetId: 'MANUFACTURING-001',
    name: 'Production Line Data',
    description: 'Manufacturing process data for predictive maintenance',
    category: 'MANUFACTURING',
    size: 3000000,
    recordCount: 150000,
    price: 4000.00,
    license: 'Commercial',
    tags: ['manufacturing', 'production', 'IoT', 'predictive'],
    metadata: {
      'data_type': 'sensor_data',
      'format': 'JSON',
      'sensor_types': ['temperature', 'pressure', 'vibration'],
      'sampling_rate': '1_minute'
    }
  },
  {
    datasetId: 'TRANSPORT-001',
    name: 'Logistics Network Data',
    description: 'Transportation and logistics network optimization data',
    category: 'TRANSPORTATION',
    size: 1000000,
    recordCount: 25000,
    price: 2000.00,
    license: 'Academic',
    tags: ['transportation', 'logistics', 'optimization', 'routes'],
    metadata: {
      'data_type': 'network_data',
      'format': 'CSV',
      'coverage': 'national',
      'update_frequency': 'weekly'
    }
  }
];

const testModels = [
  {
    name: 'Healthcare Predictor',
    type: 'neural_network',
    description: 'Deep learning model for healthcare predictions',
    architecture: 'CNN-LSTM',
    parameters: 5000000,
    accuracy: 0.92,
    metadata: {
      'framework': 'TensorFlow',
      'optimizer': 'Adam',
      'loss_function': 'Binary Crossentropy'
    }
  },
  {
    name: 'Financial Analyzer',
    type: 'machine_learning',
    description: 'Machine learning model for financial analysis',
    architecture: 'Random Forest',
    parameters: 100000,
    accuracy: 0.88,
    metadata: {
      'framework': 'Scikit-learn',
      'algorithm': 'Random Forest',
      'features': 50
    }
  },
  {
    name: 'Retail Recommender',
    type: 'recommendation',
    description: 'Recommendation system for retail applications',
    architecture: 'Collaborative Filtering',
    parameters: 250000,
    accuracy: 0.85,
    metadata: {
      'framework': 'Surprise',
      'algorithm': 'SVD++',
      'evaluation_metric': 'RMSE'
    }
  },
  {
    name: 'Manufacturing Predictor',
    type: 'time_series',
    description: 'Time series model for manufacturing predictions',
    architecture: 'LSTM',
    parameters: 3000000,
    accuracy: 0.90,
    metadata: {
      'framework': 'PyTorch',
      'model_type': 'LSTM',
      'sequence_length': 100
    }
  },
  {
    name: 'Transport Optimizer',
    type: 'optimization',
    description: 'Optimization model for transportation logistics',
    architecture: 'Genetic Algorithm',
    parameters: 50000,
    accuracy: 0.87,
    metadata: {
      'framework': 'Custom',
      'algorithm': 'Genetic Algorithm',
      'population_size': 1000
    }
  }
];

// Helper function to create user via API with retry logic
async function createUser(userData, partyType, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Creating ${partyType} user: ${userData.name} (${userData.email}) - Attempt ${attempt}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: userData.name,
        email: userData.email,
        password: TEST_PASSWORD,
        partyType: partyType,
        organization: userData.organization,
        description: userData.description
      });

      if (response.data.success) {
        console.log(`✅ Created ${partyType} user: ${userData.name}`);
        return response.data.user;
      } else {
        console.log(`❌ Failed to create ${partyType} user: ${userData.name}`);
        return null;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`⚠️  User already exists: ${userData.name}`);
        return null;
      } else if (error.response?.data?.error?.includes('Too many authentication requests')) {
        console.log(`⏳ Rate limited, waiting 10 seconds before retry...`);
        await delay(10000);
        continue;
      } else {
        console.log(`❌ Error creating ${partyType} user ${userData.name}:`, error.response?.data?.error || error.message);
        if (attempt < retries) {
          console.log(`⏳ Waiting 5 seconds before retry...`);
          await delay(5000);
        }
      }
    }
  }
  return null;
}

// Helper function to create dataset via API with retry logic
async function createDataset(datasetData, tdpUser, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Creating dataset: ${datasetData.name} for TDP: ${tdpUser.name} - Attempt ${attempt}`);
      
      // First, get authentication token for the TDP user
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: tdpUser.email,
        password: TEST_PASSWORD
      });

      if (!loginResponse.data.accessToken) {
        console.log(`❌ Failed to login TDP user: ${tdpUser.name}`);
        return null;
      }

      const token = loginResponse.data.accessToken;

      // Wait a bit before making the next request
      await delay(2000);

      // Create dataset
      const datasetResponse = await axios.post(`${API_BASE_URL}/datasets`, {
        datasetId: datasetData.datasetId,
        name: datasetData.name,
        description: datasetData.description,
        category: datasetData.category,
        size: datasetData.size,
        recordCount: datasetData.recordCount,
        price: datasetData.price,
        license: datasetData.license,
        tags: datasetData.tags,
        metadata: datasetData.metadata,
        isPublic: true,
        isActive: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (datasetResponse.data.success) {
        console.log(`✅ Created dataset: ${datasetData.name}`);
        return datasetResponse.data.dataset;
      } else {
        console.log(`❌ Failed to create dataset: ${datasetData.name}`);
        return null;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`⚠️  Dataset already exists: ${datasetData.name}`);
        return null;
      } else if (error.response?.data?.error?.includes('Too many authentication requests')) {
        console.log(`⏳ Rate limited, waiting 15 seconds before retry...`);
        await delay(15000);
        continue;
      } else {
        console.log(`❌ Error creating dataset ${datasetData.name}:`, error.response?.data?.error || error.message);
        if (attempt < retries) {
          console.log(`⏳ Waiting 5 seconds before retry...`);
          await delay(5000);
        }
      }
    }
  }
  return null;
}

// Helper function to create AI model via API with retry logic
async function createAIModel(modelData, tdpUser, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Creating AI model: ${modelData.name} for TDP: ${tdpUser.name} - Attempt ${attempt}`);
      
      // Get authentication token for the TDP user
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: tdpUser.email,
        password: TEST_PASSWORD
      });

      if (!loginResponse.data.accessToken) {
        console.log(`❌ Failed to login TDP user: ${tdpUser.name}`);
        return null;
      }

      const token = loginResponse.data.accessToken;

      // Wait a bit before making the next request
      await delay(2000);

      // Create AI model
      const modelResponse = await axios.post(`${API_BASE_URL}/ai-models`, {
        name: modelData.name,
        type: modelData.type,
        description: modelData.description,
        architecture: modelData.architecture,
        parameters: modelData.parameters,
        accuracy: modelData.accuracy,
        metadata: modelData.metadata,
        isActive: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (modelResponse.data.success) {
        console.log(`✅ Created AI model: ${modelData.name}`);
        return modelResponse.data.model;
      } else {
        console.log(`❌ Failed to create AI model: ${modelData.name}`);
        return null;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`⚠️  AI model already exists: ${modelData.name}`);
        return null;
      } else if (error.response?.data?.error?.includes('Too many authentication requests')) {
        console.log(`⏳ Rate limited, waiting 15 seconds before retry...`);
        await delay(15000);
        continue;
      } else {
        console.log(`❌ Error creating AI model ${modelData.name}:`, error.response?.data?.error || error.message);
        if (attempt < retries) {
          console.log(`⏳ Waiting 5 seconds before retry...`);
          await delay(5000);
        }
      }
    }
  }
  return null;
}

// Main function to create comprehensive test data with delays
async function createComprehensiveTestDataWithDelays() {
  console.log('🚀 Starting comprehensive test data creation with rate limiting protection...\n');

  const createdUsers = {
    TDPs: [],
    TDCs: [],
    CCRPs: []
  };

  // Create TDP users with delays
  console.log('📊 Creating TDP users...');
  for (let i = 0; i < testTDPs.length; i++) {
    const tdpData = testTDPs[i];
    const user = await createUser(tdpData, 'TDP');
    if (user) {
      createdUsers.TDPs.push(user);
    }
    // Wait between user creations to avoid rate limiting
    if (i < testTDPs.length - 1) {
      console.log('⏳ Waiting 3 seconds before next user creation...');
      await delay(3000);
    }
  }

  // Wait before creating TDC users
  console.log('\n⏳ Waiting 5 seconds before creating TDC users...');
  await delay(5000);

  // Create TDC users with delays
  console.log('📊 Creating TDC users...');
  for (let i = 0; i < testTDCs.length; i++) {
    const tdcData = testTDCs[i];
    const user = await createUser(tdcData, 'TDC');
    if (user) {
      createdUsers.TDCs.push(user);
    }
    // Wait between user creations
    if (i < testTDCs.length - 1) {
      console.log('⏳ Waiting 3 seconds before next user creation...');
      await delay(3000);
    }
  }

  // Wait before creating CCRP users
  console.log('\n⏳ Waiting 5 seconds before creating CCRP users...');
  await delay(5000);

  // Create CCRP users with delays
  console.log('📊 Creating CCRP users...');
  for (let i = 0; i < testCCRPs.length; i++) {
    const ccrpData = testCCRPs[i];
    const user = await createUser(ccrpData, 'CCRP');
    if (user) {
      createdUsers.CCRPs.push(user);
    }
    // Wait between user creations
    if (i < testCCRPs.length - 1) {
      console.log('⏳ Waiting 3 seconds before next user creation...');
      await delay(3000);
    }
  }

  // Wait before creating datasets
  console.log('\n⏳ Waiting 10 seconds before creating datasets...');
  await delay(10000);

  // Create datasets for TDPs with delays
  console.log('📊 Creating datasets...');
  const createdDatasets = [];
  for (let i = 0; i < Math.min(createdUsers.TDPs.length, testDatasets.length); i++) {
    const dataset = await createDataset(testDatasets[i], createdUsers.TDPs[i]);
    if (dataset) {
      createdDatasets.push(dataset);
    }
    // Wait between dataset creations
    if (i < Math.min(createdUsers.TDPs.length, testDatasets.length) - 1) {
      console.log('⏳ Waiting 5 seconds before next dataset creation...');
      await delay(5000);
    }
  }

  // Wait before creating AI models
  console.log('\n⏳ Waiting 10 seconds before creating AI models...');
  await delay(10000);

  // Create AI models for TDPs with delays
  console.log('📊 Creating AI models...');
  const createdModels = [];
  for (let i = 0; i < Math.min(createdUsers.TDPs.length, testModels.length); i++) {
    const model = await createAIModel(testModels[i], createdUsers.TDPs[i]);
    if (model) {
      createdModels.push(model);
    }
    // Wait between model creations
    if (i < Math.min(createdUsers.TDPs.length, testModels.length) - 1) {
      console.log('⏳ Waiting 5 seconds before next model creation...');
      await delay(5000);
    }
  }

  // Summary
  console.log('\n📋 Test Data Creation Summary:');
  console.log(`✅ TDP Users: ${createdUsers.TDPs.length}`);
  console.log(`✅ TDC Users: ${createdUsers.TDCs.length}`);
  console.log(`✅ CCRP Users: ${createdUsers.CCRPs.length}`);
  console.log(`✅ Datasets: ${createdDatasets.length}`);
  console.log(`✅ AI Models: ${createdModels.length}`);

  console.log('\n🎉 Comprehensive test data creation completed!');
  
  // Print credentials for testing
  console.log('\n🔑 Test User Credentials:');
  console.log('Password for all users: Test123!');
  console.log('\nTDP Users:');
  createdUsers.TDPs.forEach(user => {
    console.log(`  - ${user.name}: ${user.email}`);
  });
  console.log('\nTDC Users:');
  createdUsers.TDCs.forEach(user => {
    console.log(`  - ${user.name}: ${user.email}`);
  });
  console.log('\nCCRP Users:');
  createdUsers.CCRPs.forEach(user => {
    console.log(`  - ${user.name}: ${user.email}`);
  });
}

// Run the script
if (require.main === module) {
  createComprehensiveTestDataWithDelays().catch(console.error);
}

module.exports = { createComprehensiveTestDataWithDelays }; 