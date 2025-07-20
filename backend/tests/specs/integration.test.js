const request = require('supertest');
const { User, Contract, Dataset, AIModel } = require('../../models');
const { sequelize } = require('../../models');
const jwt = require('jsonwebtoken');

// Import test server instead of main server
const app = require('../test-server');

describe('Integration Test Suite', () => {
  let tdpUser, tdcUser, ccrpUser, tdpToken, tdcToken, ccrpToken, testDataset, testContract;
  let keycloakTdpUser, keycloakTdcUser, keycloakCcrpUser;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    console.log(`🧪 Running integration tests`);
    
    // Create test users and tokens
    await createTestUsers();
    
    // Create test dataset
    await createTestDataset();
    
    // Create test AI model
    await createTestAIModel();
  });

  afterAll(async () => {
    // Clean up all test data
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear test data before each test if needed
  });

  async function createTestUsers() {
    const tdpData = {
      email: 'tdp@example.com',
      name: 'TDP User',
      partyType: 'TDP',
      password: 'Password123'
    };

    const tdcData = {
      email: 'tdc@example.com',
      name: 'TDC User',
      partyType: 'TDC',
      password: 'Password123'
    };

    const ccrpData = {
      email: 'ccrp@example.com',
      name: 'CCRP User',
      partyType: 'CCRP',
      password: 'Password123'
    };

    // Register TDP
    const tdpResponse = await request(app)
      .post('/api/auth/register')
      .send(tdpData)
      .expect(201);

    tdpUser = tdpResponse.body.user;
    tdpToken = tdpResponse.body.token;

    // Register TDC
    const tdcResponse = await request(app)
      .post('/api/auth/register')
      .send(tdcData)
      .expect(201);

    tdcUser = tdcResponse.body.user;
    tdcToken = tdcResponse.body.token;

    // Register CCRP
    const ccrpResponse = await request(app)
      .post('/api/auth/register')
      .send(ccrpData)
      .expect(201);

    ccrpUser = ccrpResponse.body.user;
    ccrpToken = ccrpResponse.body.token;
  }

  async function createTestDataset() {
    const datasetData = {
      datasetId: 'INTEGRATION-DATASET-001',
      name: 'Integration Test Dataset',
      description: 'Dataset for integration testing',
      category: 'Computer Vision',
      size: 1500,
      recordCount: 15000,
      price: 75.00,
      license: 'MIT',
      metadata: { type: 'integration-test' }
    };

    const datasetResponse = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${tdpToken}`)
      .send(datasetData)
      .expect(201);

    testDataset = datasetResponse.body;
  }

  async function createTestAIModel() {
    await AIModel.create({
      modelId: 'integration-model-001',
      name: 'Integration Model',
      description: 'Integration test model',
      type: 'cnn',
      architecture: 'cnn-arch',
      parameters: '2M',
      framework: 'TensorFlow',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy'],
      maxEpochs: 5,
      batchSize: 8,
      learningRate: 0.01,
      isActive: true
    });
  }

  describe('User Registration Integration', () => {
    it('should register user with both database and Keycloak integration', async () => {
      const userData = {
        email: 'integration-test@example.com',
        name: 'Integration Test User',
        partyType: 'TDP',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.partyType).toBe(userData.partyType);
    });

    it('should handle duplicate email registration gracefully', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Duplicate User',
        partyType: 'TDP',
        password: 'Password123'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);
    });
  });

  describe('Contract Creation Integration', () => {
    it('should create contract with all required parties', async () => {
      const contractData = {
        datasetId: testDataset.datasetId,
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Integration test terms',
        tdpId: tdpUser.id,
        tdcId: tdcUser.id
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdcToken}`)
        .send(contractData)
        .expect(201);

      expect(response.body.contract).toBeDefined();
      expect(response.body.contract.datasetId).toBe(testDataset.datasetId);
      expect(response.body.contract.status).toBe('PENDING_TDP_APPROVAL');
    });
  });

  describe('Dataset Management Integration', () => {
    it('should create and retrieve datasets', async () => {
      const datasetData = {
        datasetId: 'INTEGRATION-DATASET-002',
        name: 'Integration Dataset 2',
        description: 'Second integration test dataset',
        category: 'Natural Language Processing',
        size: 2000,
        recordCount: 20000,
        price: 100.00,
        license: 'Apache 2.0'
      };

      const createResponse = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send(datasetData)
        .expect(201);

      expect(createResponse.body.datasetId).toBe(datasetData.datasetId);

      // Retrieve the dataset
      const getResponse = await request(app)
        .get(`/api/datasets/${datasetData.datasetId}`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(getResponse.body.datasetId).toBe(datasetData.datasetId);
    });
  });

  describe('AI Model Integration', () => {
    it('should retrieve available AI models', async () => {
      const response = await request(app)
        .get('/api/ai-models')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
    });
  });

  describe('Notification Integration', () => {
    it('should create and retrieve notifications', async () => {
      // Create a notification via API
      const notificationData = {
        userId: tdpUser.id,
        type: 'CONTRACT_CREATED',
        title: 'Integration Test Notification',
        message: 'This is an integration test notification'
      };

      const createResponse = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send(notificationData)
        .expect(201);

      expect(createResponse.body.notification).toBeDefined();

      // Retrieve notifications for user
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(response.body.notifications).toBeDefined();
      expect(Array.isArray(response.body.notifications)).toBe(true);
    });
  });
}); 