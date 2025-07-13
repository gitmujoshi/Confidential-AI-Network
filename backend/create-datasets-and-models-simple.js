const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_PASSWORD = 'Test123!';

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test datasets for existing TDP users
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

// Test AI models for existing TDP users
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

// List of TDP users to use
const tdpUsers = [
  { name: 'Healthcare Data Corp', email: 'healthcare@example.com' },
  { name: 'Financial Analytics Inc', email: 'financial@example.com' },
  { name: 'Retail Insights Ltd', email: 'retail@example.com' },
  { name: 'Manufacturing Data Co', email: 'manufacturing@example.com' },
  { name: 'Transportation Data Hub', email: 'transport@example.com' }
];

// Helper function to create dataset via API
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

// Helper function to create AI model via API
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

// Main function to create datasets and models for existing TDP users
async function createDatasetsAndModels() {
  console.log('🚀 Creating datasets and models for existing TDP users...\n');

  console.log('\n📊 TDP Users to use:');
  tdpUsers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.name} (${user.email})`);
  });

  // Create datasets for TDPs
  console.log('\n📊 Creating datasets...');
  const createdDatasets = [];
  for (let i = 0; i < Math.min(tdpUsers.length, testDatasets.length); i++) {
    const dataset = await createDataset(testDatasets[i], tdpUsers[i]);
    if (dataset) {
      createdDatasets.push(dataset);
    }
    // Wait between dataset creations
    if (i < Math.min(tdpUsers.length, testDatasets.length) - 1) {
      console.log('⏳ Waiting 5 seconds before next dataset creation...');
      await delay(5000);
    }
  }

  // Wait before creating AI models
  console.log('\n⏳ Waiting 10 seconds before creating AI models...');
  await delay(10000);

  // Create AI models for TDPs
  console.log('📊 Creating AI models...');
  const createdModels = [];
  for (let i = 0; i < Math.min(tdpUsers.length, testModels.length); i++) {
    const model = await createAIModel(testModels[i], tdpUsers[i]);
    if (model) {
      createdModels.push(model);
    }
    // Wait between model creations
    if (i < Math.min(tdpUsers.length, testModels.length) - 1) {
      console.log('⏳ Waiting 5 seconds before next model creation...');
      await delay(5000);
    }
  }

  // Summary
  console.log('\n📋 Test Data Creation Summary:');
  console.log(`✅ TDP Users: ${tdpUsers.length}`);
  console.log(`✅ Datasets: ${createdDatasets.length}`);
  console.log(`✅ AI Models: ${createdModels.length}`);

  console.log('\n🎉 Dataset and model creation completed!');
  
  // Print TDP user credentials for testing
  console.log('\n🔑 TDP User Credentials:');
  console.log('Password for all users: Test123!');
  console.log('\nTDP Users:');
  tdpUsers.forEach(user => {
    console.log(`  - ${user.name}: ${user.email}`);
  });
}

// Run the script
if (require.main === module) {
  createDatasetsAndModels().catch(console.error);
}

module.exports = { createDatasetsAndModels }; 