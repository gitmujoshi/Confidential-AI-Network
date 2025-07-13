const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_PASSWORD = 'Test123!';

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// TDP users with their datasets
const tdpDatasets = [
  // Healthcare Data Corp datasets
  {
    tdpEmail: 'healthcare@example.com',
    datasets: [
      {
        datasetId: 'HEALTH-PATIENT-001',
        name: 'Patient Health Records',
        description: 'Anonymized patient health records for medical AI research and disease prediction models',
        category: 'Tabular',
        size: 5000000,
        recordCount: 100000,
        price: 5000.00,
        license: 'Academic',
        tags: ['healthcare', 'medical', 'patient', 'anonymized', 'clinical'],
        metadata: {
          'data_type': 'structured',
          'format': 'CSV',
          'anonymization_level': 'high',
          'compliance': ['HIPAA', 'GDPR'],
          'fields': ['age', 'gender', 'diagnosis', 'medications', 'lab_results']
        }
      },
      {
        datasetId: 'HEALTH-IMAGING-001',
        name: 'Medical Imaging Dataset',
        description: 'X-ray and MRI images for computer vision applications in medical diagnosis',
        category: 'Computer Vision',
        size: 8000000,
        recordCount: 50000,
        price: 7500.00,
        license: 'Commercial',
        tags: ['healthcare', 'imaging', 'x-ray', 'mri', 'diagnosis'],
        metadata: {
          'data_type': 'image',
          'format': 'DICOM',
          'image_types': ['X-ray', 'MRI', 'CT'],
          'body_parts': ['chest', 'brain', 'abdomen'],
          'resolution': '1024x1024'
        }
      }
    ]
  },

  // Financial Analytics Inc datasets
  {
    tdpEmail: 'financial@example.com',
    datasets: [
      {
        datasetId: 'FINANCE-TRADING-001',
        name: 'Market Trading Data',
        description: 'Historical stock market trading data for financial AI models and algorithmic trading',
        category: 'Tabular',
        size: 2000000,
        recordCount: 50000,
        price: 3000.00,
        license: 'Commercial',
        tags: ['finance', 'trading', 'stocks', 'historical', 'market'],
        metadata: {
          'data_type': 'time_series',
          'format': 'JSON',
          'time_period': '5_years',
          'update_frequency': 'daily',
          'symbols': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
        }
      },
      {
        datasetId: 'FINANCE-CREDIT-001',
        name: 'Credit Risk Assessment Data',
        description: 'Credit card transaction data for fraud detection and risk assessment models',
        category: 'Tabular',
        size: 3000000,
        recordCount: 75000,
        price: 4500.00,
        license: 'Commercial',
        tags: ['finance', 'credit', 'fraud', 'risk', 'transactions'],
        metadata: {
          'data_type': 'transactional',
          'format': 'CSV',
          'time_period': '3_years',
          'anonymization_level': 'high',
          'features': ['amount', 'merchant', 'location', 'time', 'card_type']
        }
      }
    ]
  },

  // Retail Insights Ltd datasets
  {
    tdpEmail: 'retail@example.com',
    datasets: [
      {
        datasetId: 'RETAIL-PURCHASE-001',
        name: 'Customer Purchase History',
        description: 'Customer purchase patterns and behavior data for recommendation systems',
        category: 'Tabular',
        size: 1500000,
        recordCount: 75000,
        price: 2500.00,
        license: 'Academic',
        tags: ['retail', 'customer', 'purchases', 'behavior', 'recommendations'],
        metadata: {
          'data_type': 'transactional',
          'format': 'CSV',
          'time_period': '2_years',
          'anonymization_level': 'medium',
          'categories': ['electronics', 'clothing', 'home', 'books']
        }
      },
      {
        datasetId: 'RETAIL-REVIEWS-001',
        name: 'Product Reviews Dataset',
        description: 'Customer product reviews and sentiment analysis data',
        category: 'Natural Language Processing',
        size: 1000000,
        recordCount: 100000,
        price: 2000.00,
        license: 'Academic',
        tags: ['retail', 'reviews', 'sentiment', 'nlp', 'products'],
        metadata: {
          'data_type': 'text',
          'format': 'JSON',
          'languages': ['English', 'Spanish', 'French'],
          'rating_scale': '1-5',
          'categories': ['electronics', 'clothing', 'home', 'books']
        }
      }
    ]
  },

  // Manufacturing Data Co datasets
  {
    tdpEmail: 'manufacturing@example.com',
    datasets: [
      {
        datasetId: 'MANUFACTURING-SENSOR-001',
        name: 'Production Line Sensor Data',
        description: 'IoT sensor data from manufacturing production lines for predictive maintenance',
        category: 'Tabular',
        size: 3000000,
        recordCount: 150000,
        price: 4000.00,
        license: 'Commercial',
        tags: ['manufacturing', 'production', 'IoT', 'predictive', 'sensors'],
        metadata: {
          'data_type': 'sensor_data',
          'format': 'JSON',
          'sensor_types': ['temperature', 'pressure', 'vibration', 'humidity'],
          'sampling_rate': '1_minute',
          'equipment_types': ['conveyor', 'robot', 'furnace', 'press']
        }
      },
      {
        datasetId: 'MANUFACTURING-DEFECT-001',
        name: 'Quality Control Images',
        description: 'Product defect detection images for computer vision quality control systems',
        category: 'Computer Vision',
        size: 4000000,
        recordCount: 25000,
        price: 3500.00,
        license: 'Commercial',
        tags: ['manufacturing', 'quality', 'defects', 'vision', 'inspection'],
        metadata: {
          'data_type': 'image',
          'format': 'JPEG',
          'image_types': ['defect', 'normal', 'borderline'],
          'resolution': '2048x2048',
          'products': ['automotive', 'electronics', 'textiles']
        }
      }
    ]
  },

  // Transportation Data Hub datasets
  {
    tdpEmail: 'transport@example.com',
    datasets: [
      {
        datasetId: 'TRANSPORT-LOGISTICS-001',
        name: 'Logistics Network Data',
        description: 'Transportation and logistics network optimization data for route planning',
        category: 'Tabular',
        size: 1000000,
        recordCount: 25000,
        price: 2000.00,
        license: 'Academic',
        tags: ['transportation', 'logistics', 'optimization', 'routes', 'delivery'],
        metadata: {
          'data_type': 'network_data',
          'format': 'CSV',
          'coverage': 'national',
          'update_frequency': 'weekly',
          'vehicle_types': ['truck', 'van', 'bike', 'drone']
        }
      },
      {
        datasetId: 'TRANSPORT-TRAFFIC-001',
        name: 'Traffic Pattern Analysis',
        description: 'Real-time traffic data for urban planning and congestion prediction',
        category: 'Tabular',
        size: 2500000,
        recordCount: 100000,
        price: 3000.00,
        license: 'Commercial',
        tags: ['transportation', 'traffic', 'urban', 'congestion', 'planning'],
        metadata: {
          'data_type': 'time_series',
          'format': 'JSON',
          'update_frequency': '5_minutes',
          'cities': ['NYC', 'LA', 'Chicago', 'Houston'],
          'metrics': ['speed', 'volume', 'density', 'flow']
        }
      }
    ]
  }
];

// Helper function to get TDP user ID by email
async function getTDPUserId(email) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    
    if (response.data.success) {
      const user = response.data.users.find(u => u.email === email && u.partyType === 'TDP');
      return user ? user.id : null;
    }
    return null;
  } catch (error) {
    console.log(`❌ Error getting user ID for ${email}:`, error.response?.data?.error || error.message);
    return null;
  }
}

// Helper function to create dataset via API
async function createDataset(datasetData, tdpUser, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Creating dataset: ${datasetData.name} for TDP: ${tdpUser.name} - Attempt ${attempt}`);
      
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
        ownerId: tdpUser.id
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

// Main function to create datasets for TDP users
async function createTDPDatasets() {
  console.log('🚀 Creating datasets for TDP users...\n');

  const createdDatasets = [];

  for (const tdpData of tdpDatasets) {
    console.log(`📊 Processing TDP: ${tdpData.tdpEmail}`);
    
    // Get TDP user details
    const tdpUserId = await getTDPUserId(tdpData.tdpEmail);
    if (!tdpUserId) {
      console.log(`❌ TDP user not found: ${tdpData.tdpEmail}`);
      continue;
    }

    // Get user details for authentication
    const userResponse = await axios.get(`${API_BASE_URL}/users`);
    const tdpUser = userResponse.data.users.find(u => u.id === tdpUserId);
    
    if (!tdpUser) {
      console.log(`❌ TDP user details not found: ${tdpData.tdpEmail}`);
      continue;
    }

    console.log(`✅ Found TDP user: ${tdpUser.name} (ID: ${tdpUser.id})`);

    // Create datasets for this TDP
    for (const datasetData of tdpData.datasets) {
      const dataset = await createDataset(datasetData, tdpUser);
      if (dataset) {
        createdDatasets.push(dataset);
      }
      
      // Wait between dataset creations
      console.log('⏳ Waiting 3 seconds before next dataset creation...');
      await delay(3000);
    }

    // Wait between TDP users
    console.log('⏳ Waiting 5 seconds before next TDP user...');
    await delay(5000);
  }

  // Summary
  console.log('\n📋 Dataset Creation Summary:');
  console.log(`✅ Total Datasets Created: ${createdDatasets.length}`);
  
  console.log('\n🎉 Dataset creation completed!');
  
  // Print TDP user credentials for testing
  console.log('\n🔑 TDP User Credentials:');
  console.log('Password for all users: Test123!');
  console.log('\nTDP Users with Datasets:');
  tdpDatasets.forEach(tdpData => {
    console.log(`  - ${tdpData.tdpEmail} (${tdpData.datasets.length} datasets)`);
  });
}

// Run the script
if (require.main === module) {
  createTDPDatasets().catch(console.error);
}

module.exports = { createTDPDatasets }; 