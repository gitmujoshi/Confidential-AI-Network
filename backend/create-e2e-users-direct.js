const db = require('./models');
const bcrypt = require('bcryptjs');

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
    name: 'TSP Test User',
    email: 'ccrp-test@example.com',
    password: 'password123',
    partyType: 'TSP'
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
      name: 'E2E Test Dataset 1',
      category: 'Computer Vision',
      price: 5000.00,
      description: 'Test dataset for E2E testing'
    },
    {
      name: 'E2E Test Dataset 2',
      category: 'Natural Language Processing',
      price: 3000.00,
      description: 'Another test dataset for E2E testing'
    }
  ],
  aiModels: [
    {
      modelId: 'MODEL-E2E-001',
      name: 'E2E Test Model 1',
      type: 'cnn',
      framework: 'TensorFlow',
      description: 'Test AI model for E2E testing'
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

async function createUserDirect(userData) {
  console.log(`📝 Creating user directly: ${userData.email}`);
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user directly in database
    const user = await db.User.create({
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      partyType: userData.partyType,
      isRegistered: true,
      isActive: true,
      registrationDate: new Date(),
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      emailVerified: true,
      // Generate a simple DID
      did: `did:web:example.com:user:${userData.email.split('@')[0]}`,
      didSource: 'SYSTEM_GENERATED',
      didVerified: true,
      didVerificationMethod: 'SYSTEM_GENERATED'
    });
    
    console.log(`✅ Successfully created user: ${user.email} (ID: ${user.id})`);
    return user;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log(`⚠️ User ${userData.email} already exists, skipping creation`);
      return await db.User.findOne({ where: { email: userData.email.toLowerCase() } });
    }
    console.error(`❌ Failed to create user ${userData.email}:`, error.message);
    throw error;
  }
}

async function verifyUserLogin(userData) {
  console.log(`🔐 Verifying login for: ${userData.email}`);
  
  try {
    const axios = require('axios');
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
    if (error.code === 'ECONNREFUSED') {
      console.log(`⚠️  Backend not available, skipping login verification for ${userData.email}`);
      return null;
    }
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
    const ccrpUser = users.find(u => u.partyType === 'TSP');
    
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
  console.log('🚀 Setting up E2E test environment (direct database)...');
  
  try {
    // Step 1: Purge existing users
    await purgeExistingUsers();
    
    // Step 2: Create all test users directly in database
    console.log('\n📝 Creating test users directly in database...');
    const createdUsers = [];
    for (const userData of E2E_USERS) {
      const user = await createUserDirect(userData);
      createdUsers.push(user);
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
    if (verifiedUsers.length > 0) {
      verifiedUsers.forEach(user => {
        console.log(`  - ${user.user.email} (ID: ${user.user.id}, Role: ${user.user.partyType})`);
      });
    } else {
      createdUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}, Role: ${user.partyType}) [not verified - backend not running]`);
      });
    }
    
    console.log('\n🔑 Login Credentials:');
    E2E_USERS.forEach(user => {
      console.log(`  - Email: ${user.email}, Password: ${user.password}`);
    });
    
    return verifiedUsers.length > 0 ? verifiedUsers : createdUsers;
    
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