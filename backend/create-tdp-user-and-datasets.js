/**
 * Create TDP User and Sample Datasets
 * 
 * This script creates a TDP user and adds sample datasets for AI model training
 * that can be used to create contracts.
 */

const axios = require('axios');
const db = require('./models');

const BASE_URL = 'http://localhost:5001/api';

async function createTDPUserAndDatasets() {
  try {
    console.log('🚀 Creating TDP User and Sample Datasets...\n');

    // Step 1: Create TDP User
    console.log('1️⃣ Creating TDP user...');
    const timestamp = Date.now();
    const tdpEmail = `tdp${timestamp}@example.com`;
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'AI Data Provider Corp',
      email: tdpEmail,
      partyType: 'TDP',
      organization: 'AI Data Provider Corporation',
      description: 'Leading provider of high-quality datasets for AI model training',
      phoneNumber: '+1-555-1234',
      website: 'https://aidataprovider.com',
      location: 'San Francisco, CA'
    });

    console.log('✅ TDP user created successfully!');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Email:', registerResponse.data.user.email);
    console.log('   Party Type:', registerResponse.data.user.partyType);
    console.log('   Login credentials:', registerResponse.data.loginCredentials);

    // Step 2: Login as TDP user
    console.log('\n2️⃣ Logging in as TDP user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: tdpEmail,
      password: registerResponse.data.loginCredentials.password
    });

    const tdpToken = loginResponse.data.accessToken;
    console.log('✅ Login successful!');

    // Step 3: Create sample datasets
    console.log('\n3️⃣ Creating sample datasets...');
    
    const datasets = [
      {
        datasetId: 'MED_IMG_001',
        name: 'Medical Imaging Dataset',
        description: 'Comprehensive collection of medical images for diagnostic AI training. Includes X-rays, CT scans, and MRI images with expert annotations.',
        category: 'Computer Vision',
        size: 51200, // 50GB in MB
        recordCount: 100000,
        price: 5000.00,
        license: 'Commercial',
        tags: ['medical', 'imaging', 'diagnostic', 'healthcare'],
        metadata: {
          resolution: '1024x1024',
          modalities: ['X-ray', 'CT', 'MRI'],
          bodyParts: ['chest', 'brain', 'abdomen'],
          annotations: 'Expert radiologist verified',
          compliance: ['HIPAA', 'GDPR'],
          qualityScore: 9.2
        }
      },
      {
        datasetId: 'FIN_TXN_001',
        name: 'Financial Transaction Dataset',
        description: 'Large-scale financial transaction data for fraud detection and risk assessment AI models. Includes transaction patterns, amounts, and fraud labels.',
        category: 'Tabular',
        size: 25600, // 25GB in MB
        recordCount: 5000000,
        price: 3000.00,
        license: 'Commercial',
        tags: ['finance', 'fraud-detection', 'transactions', 'risk-assessment'],
        metadata: {
          timeRange: '2020-2024',
          transactionTypes: ['credit', 'debit', 'transfer'],
          features: ['amount', 'location', 'merchant', 'timestamp'],
          fraudRate: '0.5%',
          compliance: ['PCI-DSS', 'SOX'],
          qualityScore: 8.8
        }
      },
      {
        datasetId: 'NLP_CORP_001',
        name: 'Natural Language Processing Corpus',
        description: 'Multi-language text corpus for NLP model training. Includes news articles, books, and web content with sentiment and topic annotations.',
        category: 'Natural Language Processing',
        size: 102400, // 100GB in MB
        recordCount: 2000000,
        price: 7500.00,
        license: 'Commercial',
        tags: ['nlp', 'text', 'multilingual', 'sentiment-analysis'],
        metadata: {
          languages: ['English', 'Spanish', 'French', 'German'],
          textTypes: ['news', 'books', 'web-content'],
          avgLength: '500 words',
          annotations: ['sentiment', 'topic', 'entity'],
          compliance: ['GDPR'],
          qualityScore: 9.0
        }
      },
      {
        datasetId: 'AV_SENSOR_001',
        name: 'Autonomous Vehicle Sensor Data',
        description: 'Comprehensive sensor data from autonomous vehicles including LIDAR, camera, and radar data for self-driving AI training.',
        category: 'Multimodal',
        size: 204800, // 200GB in MB
        recordCount: 500000,
        price: 12000.00,
        license: 'Commercial',
        tags: ['autonomous', 'vehicles', 'sensors', 'lidar', 'camera'],
        metadata: {
          sensors: ['LIDAR', 'Camera', 'Radar', 'GPS'],
          scenarios: ['highway', 'city', 'parking'],
          weather: ['sunny', 'rainy', 'snowy'],
          annotations: ['object-detection', 'segmentation'],
          compliance: ['ISO-26262'],
          qualityScore: 9.5
        }
      },
      {
        datasetId: 'ECOMM_BEHAV_001',
        name: 'E-commerce Customer Behavior Dataset',
        description: 'Customer behavior data from e-commerce platforms including browsing patterns, purchase history, and product interactions.',
        category: 'Tabular',
        size: 76800, // 75GB in MB
        recordCount: 3000000,
        price: 4000.00,
        license: 'Commercial',
        tags: ['ecommerce', 'customer-behavior', 'recommendations', 'analytics'],
        metadata: {
          timeRange: '2023-2024',
          userCount: 500000,
          productCount: 100000,
          interactions: ['view', 'cart', 'purchase'],
          compliance: ['GDPR', 'CCPA'],
          qualityScore: 8.7
        }
      }
    ];

    const createdDatasets = [];
    
    for (const datasetData of datasets) {
      try {
        const datasetResponse = await axios.post(`${BASE_URL}/datasets`, {
          ...datasetData,
          ownerId: registerResponse.data.user.id,
          isPublic: true
        }, {
          headers: {
            'Authorization': `Bearer ${tdpToken}`
          }
        });

        console.log(`✅ Dataset created: ${datasetData.name}`);
        createdDatasets.push(datasetResponse.data.dataset);
      } catch (error) {
        console.error(`❌ Failed to create dataset ${datasetData.name}:`, error.response?.data || error.message);
      }
    }

    console.log('\n🎉 TDP User and Datasets Setup Completed!');
    console.log('\n📋 Summary:');
    console.log(`   TDP User: ${tdpEmail}`);
    console.log(`   Password: ${registerResponse.data.loginCredentials.password}`);
    console.log(`   Datasets Created: ${createdDatasets.length}`);
    
    console.log('\n📊 Created Datasets:');
    createdDatasets.forEach((dataset, index) => {
      console.log(`   ${index + 1}. ${dataset.name}`);
      console.log(`      ID: ${dataset.datasetId}`);
      console.log(`      Category: ${dataset.category}`);
      console.log(`      Size: ${dataset.size} MB`);
      console.log(`      Price: $${dataset.price}`);
      console.log(`      Records: ${dataset.recordCount.toLocaleString()}`);
      console.log('');
    });

    console.log('\n🔗 Test Commands:');
    console.log(`   Login: curl -X POST ${BASE_URL}/auth/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email": "${tdpEmail}", "password": "${registerResponse.data.loginCredentials.password}"}'`);
    
    console.log('\n   List Datasets: curl -X GET ${BASE_URL}/datasets \\');
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN"`);

  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the setup
createTDPUserAndDatasets(); 