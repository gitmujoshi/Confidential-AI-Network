const axios = require('axios');
const db = require('./models');
const KeycloakService = require('./services/keycloakService');

const keycloakService = new KeycloakService();

// E2E Test Users Configuration
const E2E_USERS = [
  {
    name: 'TDC Test User',
    email: 'tdc-test@example.com',
    password: 'password123',
    partyType: 'TDC'
  },
  {
    name: 'TDP Test User',
    email: 'tdp-test@example.com',
    password: 'password123',
    partyType: 'TDP'
  },
  {
    name: 'CCRP Test User',
    email: 'ccrp-test@example.com',
    password: 'password123',
    partyType: 'CCRP'
  },
  {
    name: 'AppAdmin Test User',
    email: 'appadmin-test@example.com',
    password: 'password123',
    partyType: 'AppAdmin'
  }
];

// Test data for contracts, datasets, etc.
const TEST_DATA = {
  datasets: [
    {
      datasetId: 'E2E-DATASET-001',
      name: 'E2E Test Dataset 1',
      category: 'Computer Vision',
      price: 5000.00,
      description: 'Test dataset for E2E testing',
      size: 1000,
      recordCount: 10000,
      license: 'CC-BY-4.0'
    },
    {
      datasetId: 'E2E-DATASET-002',
      name: 'E2E Test Dataset 2',
      category: 'Natural Language Processing',
      price: 3000.00,
      description: 'Another test dataset for E2E testing',
      size: 500,
      recordCount: 5000,
      license: 'CC-BY-4.0'
    }
  ],
  aiModels: [
    {
      modelId: 'MODEL-E2E-001',
      name: 'E2E Test Model 1',
      type: 'cnn',
      framework: 'TensorFlow',
      description: 'Test AI model for E2E testing',
      architecture: 'ResNet-50',
      parameters: JSON.stringify({ layers: 50, activation: 'relu' }),
      privacyTechnique: 'differential-privacy',
      validationMetrics: JSON.stringify(['accuracy', 'loss']),
      maxEpochs: 10,
      batchSize: 32,
      learningRate: 0.001
    }
  ]
};

async function purgeExistingUsers() {
  console.log('🧹 Purging existing test users...');
  
  try {
    // Delete users from local database
    const deletedUsers = await db.User.destroy({
      where: {
        email: {
          [db.Sequelize.Op.like]: '%@example.com'
        }
      }
    });
    console.log(`✅ Deleted ${deletedUsers} users from local database`);
    
    // Delete datasets
    const deletedDatasets = await db.Dataset.destroy({
      where: {
        name: {
          [db.Sequelize.Op.like]: '%E2E Test%'
        }
      }
    });
    console.log(`✅ Deleted ${deletedDatasets} datasets from local database`);
    
    // Delete AI models
    const deletedModels = await db.AIModel.destroy({
      where: {
        modelId: {
          [db.Sequelize.Op.like]: '%E2E%'
        }
      }
    });
    console.log(`✅ Deleted ${deletedModels} AI models from local database`);
    
    // Delete contracts
    const deletedContracts = await db.Contract.destroy({
      where: {
        contractId: {
          [db.Sequelize.Op.like]: '%E2E%'
        }
      }
    });
    console.log(`✅ Deleted ${deletedContracts} contracts from local database`);
    
  } catch (error) {
    console.error('❌ Error purging existing users:', error);
    throw error;
  }
}

async function purgeKeycloakTestUsers() {
  console.log('🧹 Purging existing test users from Keycloak...');
  try {
    const adminToken = await keycloakService.getAdminToken();
    for (const user of E2E_USERS) {
      // Find user by username/email
      const response = await axios.get(
        `${keycloakService.baseURL}/admin/realms/${keycloakService.realm}/users?username=${encodeURIComponent(user.email)}`,
        {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        }
      );
      if (Array.isArray(response.data) && response.data.length > 0) {
        for (const found of response.data) {
          await axios.delete(
            `${keycloakService.baseURL}/admin/realms/${keycloakService.realm}/users/${found.id}`,
            {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            }
          );
          console.log(`✅ Deleted Keycloak user: ${user.email}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error purging Keycloak users:', error.response?.data || error.message);
    // Do not throw, continue
  }
}

async function registerUser(userData) {
  console.log(`📝 Registering user: ${userData.email}`);
  
  try {
    const response = await axios.post('http://localhost:5001/api/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      partyType: userData.partyType
    });
    
    console.log(`✅ Successfully registered ${userData.email}`);
    
    // If registration was successful, set the password in the local database
    if (response.data.success && response.data.user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await db.User.update(
        { password: hashedPassword },
        { where: { id: response.data.user.id } }
      );
      
      console.log(`🔐 Password set in local database for ${userData.email}`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️ User ${userData.email} already exists, skipping registration`);
      return null;
    }
    console.error(`❌ Failed to register ${userData.email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function verifyUserLogin(userData) {
  console.log(`🔐 Verifying login for: ${userData.email}`);
  
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: userData.email,
      password: userData.password
    });
    
    if (response.data.accessToken) {
      console.log(`✅ Login successful for ${userData.email}`);
      
      // Test profile endpoint
      const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: { Authorization: `Bearer ${response.data.accessToken}` }
      });
      
      console.log(`✅ Profile verified for ${userData.email}:`, {
        id: profileResponse.data.user.id,
        email: profileResponse.data.user.email,
        partyType: profileResponse.data.user.partyType
      });
      
      return {
        token: response.data.accessToken,
        user: profileResponse.data.user
      };
    }
  } catch (error) {
    console.error(`❌ Login verification failed for ${userData.email}:`, error.response?.data || error.message);
    throw error;
  }
}

async function createTestData() {
  console.log('📊 Creating test data (datasets, AI models, contracts)...');
  
  try {
    // Get registered users
    const users = await db.User.findAll({
      where: {
        email: {
          [db.Sequelize.Op.in]: E2E_USERS.map(u => u.email)
        }
      }
    });
    
    const tdpUser = users.find(u => u.partyType === 'TDP');
    const tdcUser = users.find(u => u.partyType === 'TDC');
    const ccrpUser = users.find(u => u.partyType === 'CCRP');
    
    if (!tdpUser || !tdcUser || !ccrpUser) {
      throw new Error('Required users not found for test data creation');
    }
    
    // Create datasets
    for (const datasetData of TEST_DATA.datasets) {
      const dataset = await db.Dataset.create({
        ...datasetData,
        ownerId: tdpUser.id,
        isPublic: true,
        isActive: true
      });
      console.log(`✅ Created dataset: ${dataset.name}`);
    }
    
    // Create AI models
    for (const modelData of TEST_DATA.aiModels) {
      const model = await db.AIModel.create({
        ...modelData,
        ownerId: tdpUser.id,
        isActive: true
      });
      console.log(`✅ Created AI model: ${model.name}`);
    }
    
    // Create a test contract
    const datasets = await db.Dataset.findAll({
      where: { name: { [db.Sequelize.Op.like]: '%E2E Test%' } }
    });
    
    if (datasets.length > 0) {
      const contract = await db.Contract.create({
        contractId: `CONTRACT-E2E-${Date.now()}`,
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        datasetId: datasets[0].id,
        primaryDatasetId: datasets[0].id,
        primaryTdpId: tdpUser.id,
        status: 'SIGNED',
        price: 5000.00,
        duration: 30,
        termsAndConditions: 'E2E test contract terms',
        environmentSpecs: { cpu: '4 cores', memory: '16GB' },
        trainingParams: { epochs: 10, batchSize: 32 }
      });
      console.log(`✅ Created test contract: ${contract.contractId}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function setupE2EEnvironment() {
  console.log('🚀 Setting up E2E test environment...');
  
  try {
    // Step 0: Purge Keycloak users first
    await purgeKeycloakTestUsers();
    // Step 1: Purge existing users from DB
    await purgeExistingUsers();
    
    // Step 2: Register all test users
    console.log('\n📝 Registering test users...');
    for (const userData of E2E_USERS) {
      await registerUser(userData);
    }
    
    // Step 3: Verify login for all users
    console.log('\n🔐 Verifying user logins...');
    const verifiedUsers = [];
    for (const userData of E2E_USERS) {
      const loginResult = await verifyUserLogin(userData);
      if (loginResult) {
        verifiedUsers.push(loginResult);
      }
    }
    
    // Step 4: Create test data
    await createTestData();
    
    console.log('\n✅ E2E environment setup complete!');
    console.log('\n📋 E2E Test Users:');
    verifiedUsers.forEach(user => {
      console.log(`  - ${user.user.email} (ID: ${user.user.id}, Role: ${user.user.partyType})`);
    });
    
    console.log('\n🔑 Login Credentials:');
    E2E_USERS.forEach(user => {
      console.log(`  - Email: ${user.email}, Password: ${user.password}`);
    });
    
    return verifiedUsers;
    
  } catch (error) {
    console.error('❌ E2E environment setup failed:', error);
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupE2EEnvironment()
    .then(() => {
      console.log('\n🎉 E2E setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 E2E setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupE2EEnvironment, E2E_USERS }; 