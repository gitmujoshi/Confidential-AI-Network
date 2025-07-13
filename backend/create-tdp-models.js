const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_PASSWORD = 'Test123!';

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// TDP users with their AI models
const tdpModels = [
  // Healthcare Data Corp models
  {
    tdpEmail: 'healthcare@example.com',
    models: [
      {
        modelId: 'HEALTH-DISEASE-PREDICT-001',
        name: 'Disease Prediction Model',
        description: 'AI model for predicting disease risk based on patient health records',
        category: 'Healthcare',
        version: '1.0.0',
        framework: 'TensorFlow',
        accuracy: 0.92,
        price: 8000.00,
        license: 'Commercial',
        tags: ['healthcare', 'disease', 'prediction', 'clinical', 'risk'],
        metadata: {
          'model_type': 'classification',
          'input_features': ['age', 'gender', 'lab_results', 'medications'],
          'output_classes': ['low_risk', 'medium_risk', 'high_risk'],
          'training_data_size': '100000_records',
          'validation_accuracy': 0.89
        }
      },
      {
        modelId: 'HEALTH-IMAGING-DIAGNOSIS-001',
        name: 'Medical Imaging Diagnosis Model',
        description: 'Computer vision model for diagnosing diseases from X-ray and MRI images',
        category: 'Computer Vision',
        version: '2.1.0',
        framework: 'PyTorch',
        accuracy: 0.94,
        price: 12000.00,
        license: 'Commercial',
        tags: ['healthcare', 'imaging', 'diagnosis', 'x-ray', 'mri'],
        metadata: {
          'model_type': 'image_classification',
          'input_size': '1024x1024',
          'image_types': ['X-ray', 'MRI', 'CT'],
          'disease_classes': ['normal', 'pneumonia', 'cancer', 'fracture'],
          'training_images': '50000'
        }
      }
    ]
  },

  // Financial Analytics Inc models
  {
    tdpEmail: 'financial@example.com',
    models: [
      {
        modelId: 'FINANCE-FRAUD-DETECT-001',
        name: 'Credit Card Fraud Detection',
        description: 'Machine learning model for detecting fraudulent credit card transactions',
        category: 'Finance',
        version: '1.5.2',
        framework: 'Scikit-learn',
        accuracy: 0.96,
        price: 6000.00,
        license: 'Commercial',
        tags: ['finance', 'fraud', 'detection', 'credit', 'security'],
        metadata: {
          'model_type': 'anomaly_detection',
          'input_features': ['amount', 'merchant', 'location', 'time', 'card_type'],
          'detection_method': 'isolation_forest',
          'false_positive_rate': 0.02,
          'training_transactions': '75000'
        }
      },
      {
        modelId: 'FINANCE-TRADING-ALGO-001',
        name: 'Algorithmic Trading Model',
        description: 'AI model for automated stock trading based on market patterns',
        category: 'Finance',
        version: '3.0.1',
        framework: 'TensorFlow',
        accuracy: 0.78,
        price: 15000.00,
        license: 'Commercial',
        tags: ['finance', 'trading', 'algorithmic', 'stocks', 'automation'],
        metadata: {
          'model_type': 'time_series_prediction',
          'prediction_horizon': '1_day',
          'input_features': ['price', 'volume', 'technical_indicators'],
          'trading_pairs': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
          'backtest_performance': '15.2%_annual_return'
        }
      }
    ]
  },

  // Retail Insights Ltd models
  {
    tdpEmail: 'retail@example.com',
    models: [
      {
        modelId: 'RETAIL-RECOMMENDATION-001',
        name: 'Product Recommendation Engine',
        description: 'AI-powered recommendation system for e-commerce platforms',
        category: 'Recommendation',
        version: '2.0.0',
        framework: 'PyTorch',
        accuracy: 0.85,
        price: 5000.00,
        license: 'Academic',
        tags: ['retail', 'recommendation', 'e-commerce', 'personalization'],
        metadata: {
          'model_type': 'collaborative_filtering',
          'algorithm': 'matrix_factorization',
          'input_features': ['user_id', 'product_id', 'rating', 'purchase_history'],
          'recommendation_count': 10,
          'training_users': '50000'
        }
      },
      {
        modelId: 'RETAIL-SENTIMENT-ANALYSIS-001',
        name: 'Customer Sentiment Analysis',
        description: 'NLP model for analyzing customer sentiment from product reviews',
        category: 'Natural Language Processing',
        version: '1.3.0',
        framework: 'Transformers',
        accuracy: 0.88,
        price: 3500.00,
        license: 'Academic',
        tags: ['retail', 'sentiment', 'nlp', 'reviews', 'analysis'],
        metadata: {
          'model_type': 'sentiment_classification',
          'base_model': 'BERT',
          'sentiment_classes': ['positive', 'neutral', 'negative'],
          'languages': ['English', 'Spanish', 'French'],
          'training_reviews': '100000'
        }
      }
    ]
  },

  // Manufacturing Data Co models
  {
    tdpEmail: 'manufacturing@example.com',
    models: [
      {
        modelId: 'MANUFACTURING-PREDICTIVE-001',
        name: 'Predictive Maintenance Model',
        description: 'AI model for predicting equipment failures in manufacturing',
        category: 'Manufacturing',
        version: '1.8.0',
        framework: 'Scikit-learn',
        accuracy: 0.91,
        price: 7000.00,
        license: 'Commercial',
        tags: ['manufacturing', 'predictive', 'maintenance', 'IoT', 'equipment'],
        metadata: {
          'model_type': 'regression',
          'prediction_horizon': '7_days',
          'input_sensors': ['temperature', 'pressure', 'vibration', 'humidity'],
          'equipment_types': ['conveyor', 'robot', 'furnace', 'press'],
          'maintenance_cost_savings': '25%'
        }
      },
      {
        modelId: 'MANUFACTURING-DEFECT-DETECT-001',
        name: 'Quality Control Defect Detection',
        description: 'Computer vision model for detecting product defects in manufacturing',
        category: 'Computer Vision',
        version: '2.2.0',
        framework: 'PyTorch',
        accuracy: 0.95,
        price: 9000.00,
        license: 'Commercial',
        tags: ['manufacturing', 'quality', 'defects', 'vision', 'inspection'],
        metadata: {
          'model_type': 'object_detection',
          'input_size': '2048x2048',
          'defect_types': ['scratch', 'dent', 'crack', 'discoloration'],
          'detection_confidence': 0.85,
          'processing_speed': '100_images_per_second'
        }
      }
    ]
  },

  // Transportation Data Hub models
  {
    tdpEmail: 'transport@example.com',
    models: [
      {
        modelId: 'TRANSPORT-ROUTE-OPTIMIZATION-001',
        name: 'Route Optimization Model',
        description: 'AI model for optimizing delivery routes and logistics planning',
        category: 'Logistics',
        version: '1.6.0',
        framework: 'TensorFlow',
        accuracy: 0.87,
        price: 4500.00,
        license: 'Academic',
        tags: ['transportation', 'logistics', 'optimization', 'routes', 'delivery'],
        metadata: {
          'model_type': 'optimization',
          'algorithm': 'genetic_algorithm',
          'optimization_metrics': ['distance', 'time', 'fuel_cost'],
          'vehicle_types': ['truck', 'van', 'bike', 'drone'],
          'coverage_area': 'national'
        }
      },
      {
        modelId: 'TRANSPORT-TRAFFIC-PREDICT-001',
        name: 'Traffic Prediction Model',
        description: 'AI model for predicting traffic patterns and congestion',
        category: 'Transportation',
        version: '2.0.0',
        framework: 'PyTorch',
        accuracy: 0.82,
        price: 6000.00,
        license: 'Commercial',
        tags: ['transportation', 'traffic', 'prediction', 'congestion', 'urban'],
        metadata: {
          'model_type': 'time_series_prediction',
          'prediction_horizon': '1_hour',
          'input_features': ['speed', 'volume', 'density', 'weather'],
          'cities': ['NYC', 'LA', 'Chicago', 'Houston'],
          'update_frequency': '5_minutes'
        }
      }
    ]
  }
];

// Helper function to get admin token
async function getAdminToken() {
  try {
    console.log('🔐 Getting admin token...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'appadmin@example.com',
      password: 'AppAdmin123!'
    });

    if (response.data.accessToken) {
      console.log('✅ Admin token obtained');
      return response.data.accessToken;
    } else {
      console.log('❌ Failed to get admin token');
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting admin token:', error.response?.data?.error || error.message);
    return null;
  }
}

// Helper function to get TDP user ID by email with admin token
async function getTDPUserId(email, adminToken) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    // The API returns an array directly, not wrapped in a users property
    const users = response.data;
    const user = users.find(u => u.email === email && u.partyType === 'TDP');
    return user ? user.id : null;
  } catch (error) {
    console.log(`❌ Error getting user ID for ${email}:`, error.response?.data?.error || error.message);
    return null;
  }
}

// Helper function to create AI model via API
async function createModel(modelData, tdpUser, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Creating model: ${modelData.name} for TDP: ${tdpUser.name} - Attempt ${attempt}`);
      
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
        modelId: modelData.modelId,
        name: modelData.name,
        description: modelData.description,
        category: modelData.category,
        version: modelData.version,
        framework: modelData.framework,
        accuracy: modelData.accuracy,
        price: modelData.price,
        license: modelData.license,
        tags: modelData.tags,
        metadata: modelData.metadata,
        isPublic: true,
        ownerId: tdpUser.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (modelResponse.data.success) {
        console.log(`✅ Created model: ${modelData.name}`);
        return modelResponse.data.model;
      } else {
        console.log(`❌ Failed to create model: ${modelData.name}`);
        return null;
      }
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log(`⚠️  Model already exists: ${modelData.name}`);
        return null;
      } else {
        console.log(`❌ Error creating model ${modelData.name}:`, error.response?.data?.error || error.message);
        if (attempt < retries) {
          console.log(`⏳ Waiting 5 seconds before retry...`);
          await delay(5000);
        }
      }
    }
  }
  return null;
}

// Main function to create AI models for TDP users
async function createTDPModels() {
  console.log('🚀 Creating AI models for TDP users...\n');

  // Get admin token
  const adminToken = await getAdminToken();
  if (!adminToken) {
    console.log('❌ Failed to get admin token. Cannot proceed.');
    return;
  }

  const createdModels = [];

  for (const tdpData of tdpModels) {
    console.log(`📊 Processing TDP: ${tdpData.tdpEmail}`);
    
    // Get TDP user details
    const tdpUserId = await getTDPUserId(tdpData.tdpEmail, adminToken);
    if (!tdpUserId) {
      console.log(`❌ TDP user not found: ${tdpData.tdpEmail}`);
      continue;
    }

    // Get user details for authentication
    const userResponse = await axios.get(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const tdpUser = userResponse.data.find(u => u.id === tdpUserId);
    
    if (!tdpUser) {
      console.log(`❌ TDP user details not found: ${tdpData.tdpEmail}`);
      continue;
    }

    console.log(`✅ Found TDP user: ${tdpUser.name} (ID: ${tdpUser.id})`);

    // Create models for this TDP
    for (const modelData of tdpData.models) {
      const model = await createModel(modelData, tdpUser);
      if (model) {
        createdModels.push(model);
      }
      
      // Wait between model creations
      console.log('⏳ Waiting 3 seconds before next model creation...');
      await delay(3000);
    }

    // Wait between TDP users
    console.log('⏳ Waiting 5 seconds before next TDP user...');
    await delay(5000);
  }

  // Summary
  console.log('\n📋 AI Model Creation Summary:');
  console.log(`✅ Total Models Created: ${createdModels.length}`);
  
  console.log('\n🎉 AI model creation completed!');
  
  // Print TDP user credentials for testing
  console.log('\n🔑 TDP User Credentials:');
  console.log('Password for all users: Test123!');
  console.log('\nTDP Users with AI Models:');
  tdpModels.forEach(tdpData => {
    console.log(`  - ${tdpData.tdpEmail} (${tdpData.models.length} models)`);
  });
}

// Run the script
if (require.main === module) {
  createTDPModels().catch(console.error);
}

module.exports = { createTDPModels }; 