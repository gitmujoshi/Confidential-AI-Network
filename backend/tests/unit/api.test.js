const request = require('supertest');
const { User, Contract, Dataset, Notification } = require('../../models');
const { sequelize } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import app
const app = require('../test-server');

describe('API Endpoints Test Suite', () => {
  let testUser, testContract, testDataset;
  let authToken;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'api@example.com',
      name: 'API Test User',
      partyType: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:apitestuser',
      didVerified: true
    });

    // Create test dataset
    testDataset = await Dataset.create({
      datasetId: 'API-DATASET-001',
      name: 'API Test Dataset',
      description: 'Dataset for API testing',
      category: 'Computer Vision',
      size: 1000,
      recordCount: 10000,
      price: 50.00,
      license: 'MIT',
      ownerId: testUser.id
    });

    // Create test contract
    testContract = await Contract.create({
      contractId: 'API-CONTRACT-001',
      status: 'PENDING_TDP',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Standard terms for API testing',
      tdpId: testUser.id,
      tdcId: testUser.id,
      ccrpId: testUser.id,
      datasetId: testDataset.id,
      primaryDatasetId: testDataset.id,
      primaryTdpId: testUser.id,
      contractDatasets: [{
        datasetId: testDataset.datasetId,
        tdpId: testUser.id,
        datasetName: testDataset.name,
        tdpName: testUser.name,
        individualPrice: 100.00,
        paymentStatus: 'PENDING'
      }],
      datasetCount: 1,
      tdpCount: 1,
      totalPrice: 100.00
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.partyType },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear notifications before each test
    await Notification.destroy({ where: {} });
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('healthy');
    });

    it('should return API info', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          email: 'register@example.com',
          name: 'Register User',
          partyType: 'TDC',
          password: 'Password123'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.name).toBe(userData.name);
        expect(response.body.user.partyType).toBe(userData.partyType);
        expect(response.body.user.password).toBeUndefined();
        expect(response.body.token).toBeDefined();
      });

      it('should fail with invalid email format', async () => {
        const userData = {
          email: 'invalid-email',
          name: 'Invalid User',
          partyType: 'TDC',
          password: 'Password123'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should fail with weak password', async () => {
        const userData = {
          email: 'weak@example.com',
          name: 'Weak User',
          partyType: 'TDC',
          password: '123'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should fail with duplicate email', async () => {
        const userData = {
          email: testUser.email,
          name: 'Duplicate User',
          partyType: 'TDC',
          password: 'Password123'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(409);

        expect(response.body.error).toBeDefined();
      });

      it('should handle DID registration with public key fetch', async () => {
        const userData = {
          email: 'did@example.com',
          name: 'DID User',
          partyType: 'TDP',
          password: 'Password123',
          did: 'did:web:github.com:testuser'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.did).toBe(userData.did);
        expect(response.body.user.publicKey).toBeDefined();
        expect(response.body.user.didVerified).toBe(true);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        // First register a user
        const userData = {
          email: 'login@example.com',
          name: 'Login User',
          partyType: 'TDC',
          password: 'Password123'
        };

        await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Then login
        const loginData = {
          email: userData.email,
          password: userData.password
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.password).toBeUndefined();
      });

      it('should fail with invalid email', async () => {
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'Password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should fail with invalid password', async () => {
        // First register a user
        const userData = {
          email: 'wrongpass@example.com',
          name: 'Wrong Pass User',
          partyType: 'TDC',
          password: 'Password123'
        };

        await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Then try wrong password
        const loginData = {
          email: userData.email,
          password: 'WrongPassword'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('GET /api/auth/verify', () => {
      it('should verify valid token', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.valid).toBe(true);
        expect(response.body.user).toBeDefined();
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should reject missing token', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('User Management Endpoints', () => {
    describe('GET /api/users', () => {
      it('should return all users for authenticated user', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].password).toBeUndefined();
      });

      it('should reject unauthorized access', async () => {
        const response = await request(app)
          .get('/api/users')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should filter users by party type', async () => {
        const response = await request(app)
          .get('/api/users?partyType=TDP')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(user => {
          expect(user.partyType).toBe('TDP');
        });
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return user by ID', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testUser.id);
        expect(response.body.email).toBe(testUser.email);
        expect(response.body.password).toBeUndefined();
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/users/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update user profile', async () => {
        const updateData = {
          name: 'Updated Name',
          publicKey: 'updated-public-key'
        };

        const response = await request(app)
          .put(`/api/users/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.publicKey).toBe(updateData.publicKey);
      });

      it('should reject updating other users without permission', async () => {
        const otherUser = await User.create({
          email: 'other@example.com',
          name: 'Other User',
          partyType: 'TDC'
        });

        const updateData = { name: 'Hacked' };

        const response = await request(app)
          .put(`/api/users/${otherUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/users/wallet/connect', () => {
      it('should connect wallet to user', async () => {
        const walletData = {
          address: '0x1234567890123456789012345678901234567890',
          publicKey: 'wallet-public-key'
        };

        const response = await request(app)
          .post(`/api/users/${testUser.id}/wallet/connect`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(walletData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.publicKey).toBe(walletData.publicKey);
      });
    });
  });

  describe('Contract Management Endpoints', () => {
    describe('GET /api/contracts', () => {
      it('should return all contracts', async () => {
        const response = await request(app)
          .get('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should filter contracts by status', async () => {
        const response = await request(app)
          .get('/api/contracts?status=PENDING_TDP_APPROVAL')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(contract => {
          expect(contract.status).toBe('PENDING_TDP_APPROVAL');
        });
      });

      it('should filter contracts by party', async () => {
        const response = await request(app)
          .get('/api/contracts?tdpId=' + testUser.id)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(contract => {
          expect(contract.tdpId).toBe(testUser.id);
        });
      });
    });

    describe('POST /api/contracts', () => {
      it('should create a new contract', async () => {
        const contractData = {
          contractId: 'NEW-CONTRACT-001',
          price: 150.00,
          duration: 45,
          termsAndConditions: 'New contract terms',
          modelId: 'MODEL-002',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id,
          datasetId: testDataset.id
        };

        const response = await request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(contractData)
          .expect(201);

        expect(response.body.contractId).toBe(contractData.contractId);
        expect(response.body.status).toBe('PENDING_TDP_APPROVAL');
        expect(response.body.tdpId).toBe(contractData.tdpId);
      });

      it('should validate required fields', async () => {
        const invalidContract = {
          contractId: 'INVALID-001'
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidContract)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should enforce unique contract ID', async () => {
        const duplicateContract = {
          contractId: testContract.contractId, // Duplicate ID
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Duplicate contract',
          modelId: 'MODEL-001',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id,
          datasetId: testDataset.id
        };

        const response = await request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(duplicateContract)
          .expect(409);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('GET /api/contracts/:id', () => {
      it('should return contract by ID', async () => {
        const response = await request(app)
          .get(`/api/contracts/${testContract.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testContract.id);
        expect(response.body.contractId).toBe(testContract.contractId);
      });

      it('should return 404 for non-existent contract', async () => {
        const response = await request(app)
          .get('/api/contracts/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/contracts/:id', () => {
      it('should update contract', async () => {
        const updateData = {
          status: 'ACTIVE',
          price: 200.00
        };

        const response = await request(app)
          .put(`/api/contracts/${testContract.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.status).toBe(updateData.status);
        expect(parseFloat(response.body.price)).toBe(updateData.price);
      });
    });

    describe('POST /api/contracts/:id/sign', () => {
      it('should sign contract', async () => {
        const response = await request(app)
          .post(`/api/contracts/${testContract.id}/sign`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.contract.status).toBe('ACTIVE');
      });

      it('should prevent signing already signed contract', async () => {
        // First sign the contract
        await request(app)
          .post(`/api/contracts/${testContract.id}/sign`)
          .set('Authorization', `Bearer ${authToken}`);

        // Try to sign again
        const response = await request(app)
          .post(`/api/contracts/${testContract.id}/sign`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Dataset Management Endpoints', () => {
    describe('GET /api/datasets', () => {
      it('should return all datasets', async () => {
        const response = await request(app)
          .get('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should filter datasets by category', async () => {
        const response = await request(app)
          .get('/api/datasets?category=Computer Vision')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(dataset => {
          expect(dataset.category).toBe('Computer Vision');
        });
      });

      it('should filter datasets by owner', async () => {
        const response = await request(app)
          .get('/api/datasets?ownerId=' + testUser.id)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(dataset => {
          expect(dataset.ownerId).toBe(testUser.id);
        });
      });
    });

    describe('POST /api/datasets', () => {
      it('should create a new dataset', async () => {
        const datasetData = {
          datasetId: 'NEW-DATASET-001',
          name: 'New API Dataset',
          description: 'Dataset created via API test',
          category: 'Natural Language Processing',
          size: 2000,
          recordCount: 20000,
          price: 75.00,
          license: 'Apache 2.0',
          metadata: { type: 'test', size: 200 }
        };

        const response = await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(datasetData)
          .expect(201);

        expect(response.body.datasetId).toBe(datasetData.datasetId);
        expect(response.body.name).toBe(datasetData.name);
        expect(response.body.ownerId).toBe(testUser.id);
      });

      it('should validate required fields', async () => {
        const invalidDataset = {
          datasetId: 'INVALID-001',
          name: 'Invalid Dataset'
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidDataset)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('GET /api/datasets/:id', () => {
      it('should return dataset by ID', async () => {
        const response = await request(app)
          .get(`/api/datasets/${testDataset.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testDataset.id);
        expect(response.body.datasetId).toBe(testDataset.datasetId);
      });
    });

    describe('PUT /api/datasets/:id', () => {
      it('should update dataset', async () => {
        const updateData = {
          name: 'Updated Dataset Name',
          description: 'Updated description',
          price: 100.00
        };

        const response = await request(app)
          .put(`/api/datasets/${testDataset.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.description).toBe(updateData.description);
        expect(parseFloat(response.body.price)).toBe(updateData.price);
      });
    });
  });

  describe('DID Management Endpoints', () => {
    describe('POST /api/did/resolve', () => {
      it('should resolve DID successfully', async () => {
        const didData = {
          did: 'did:web:github.com:testuser'
        };

        const response = await request(app)
          .post('/api/did/resolve')
          .set('Authorization', `Bearer ${authToken}`)
          .send(didData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.didDocument).toBeDefined();
        expect(response.body.publicKey).toBeDefined();
      });

      it('should handle invalid DID format', async () => {
        const didData = {
          did: 'invalid:did:format'
        };

        const response = await request(app)
          .post('/api/did/resolve')
          .set('Authorization', `Bearer ${authToken}`)
          .send(didData)
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/did/verify', () => {
      it('should verify DID signature', async () => {
        const verifyData = {
          did: 'did:web:github.com:testuser',
          message: 'Test message',
          signature: 'test-signature'
        };

        const response = await request(app)
          .post('/api/did/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send(verifyData)
          .expect(200);

        expect(response.body.success).toBeDefined();
      });
    });
  });

  describe('AI Model API Endpoints', () => {
    let authToken, AIModel;
    beforeAll(async () => {
      AIModel = require('../../models').AIModel;
      // Create a test user and token
      const user = await User.create({
        email: 'aimodelapi@example.com',
        name: 'AI Model API User',
        partyType: 'TDC',
        publicKey: 'test-public-key',
        did: 'did:web:github.com:aimodelapi',
        didVerified: true
      });
      authToken = jwt.sign(
        { userId: user.id, role: user.partyType },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      // Create a test AI model
      await AIModel.create({
        modelId: 'api-model-001',
        name: 'API Model',
        description: 'API test model',
        type: 'transformer',
        architecture: 'api-arch',
        parameters: '1M',
        framework: 'PyTorch',
        privacyTechnique: 'federated-learning',
        validationMetrics: ['accuracy'],
        maxEpochs: 10,
        batchSize: 16,
        learningRate: 0.001,
        isActive: true
      });
    });

    it('should fetch available AI models', async () => {
      const response = await request(app)
        .get('/api/contracts/available-models')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
      expect(response.body.models[0].id).toBeDefined();
    });

    it('should return empty if no active models', async () => {
      // Deactivate all models
      await AIModel.update({ isActive: false }, { where: {} });
      const response = await request(app)
        .get('/api/contracts/available-models')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBe(0);
      // Reactivate for other tests
      await AIModel.update({ isActive: true }, { where: {} });
    });
  });

  describe('Ricardian Contract Endpoints', () => {
    let tdcUser, tdpUser, tdcToken, tdpDataset, AIModel;

    beforeAll(async () => {
      AIModel = require('../../models').AIModel;
      // Register TDP
      tdpUser = await User.create({
        email: 'tdp-ricardian@example.com',
        name: 'Ricardian TDP',
        partyType: 'TDP',
        publicKey: 'tdp-public-key',
        did: 'did:web:github.com:ricardian-tdp',
        didVerified: true
      });
      // Register TDC
      tdcUser = await User.create({
        email: 'tdc-ricardian@example.com',
        name: 'Ricardian TDC',
        partyType: 'TDC',
        publicKey: 'tdc-public-key',
        did: 'did:web:github.com:ricardian-tdc',
        didVerified: true
      });
      // Create dataset owned by TDP
      tdpDataset = await Dataset.create({
        datasetId: 'RICARDIAN-DS-001',
        name: 'Ricardian Test Dataset',
        description: 'Dataset for Ricardian contract E2E test',
        category: 'Computer Vision',
        size: 500,
        recordCount: 5000,
        price: 123.45,
        license: 'MIT',
        ownerId: tdpUser.id
      });
      // Create a real AI model
      await AIModel.create({
        modelId: 'api-model-001',
        name: 'API Model',
        description: 'API test model',
        type: 'transformer',
        architecture: 'api-arch',
        parameters: '1M',
        framework: 'PyTorch',
        privacyTechnique: 'federated-learning',
        validationMetrics: ['accuracy'],
        maxEpochs: 10,
        batchSize: 16,
        learningRate: 0.001,
        isActive: true
      });
      // Authenticate as TDC
      tdcToken = jwt.sign(
        { userId: tdcUser.id, partyType: tdcUser.partyType, email: tdcUser.email, walletAddress: '0xtdc', partyType: 'TDC' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should create a Ricardian contract successfully with a real AI model', async () => {
      const contractPayload = {
        tdpId: tdpUser.id,
        datasetId: tdpDataset.datasetId,
        modelId: 'api-model-001',
        price: 123.45,
        duration: 45,
        termsAndConditions: 'Ricardian contract E2E test terms',
        contractType: 'AI_TRAINING',
        environmentSpecs: { infrastructure: { computeType: 'confidential-vm' } },
        trainingParams: { modelType: 'transformer' },
        kmsConfigs: { provider: 'azure-key-vault' }
      };
      const response = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${tdcToken}`)
        .send(contractPayload)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.contract).toBeDefined();
      expect(response.body.legalDocument).toBeDefined();
      expect(response.body.smartContractData).toBeDefined();
      expect(response.body.contract.termsAndConditions).toBe(contractPayload.termsAndConditions);
    });

    it('should fail if modelId does not exist', async () => {
      const contractPayload = {
        tdpId: tdpUser.id,
        datasetId: tdpDataset.datasetId,
        modelId: 'nonexistent-model',
        price: 123.45,
        duration: 45,
        termsAndConditions: 'Ricardian contract E2E test terms',
        contractType: 'AI_TRAINING'
      };
      const response = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${tdcToken}`)
        .send(contractPayload)
        .expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('should fail if dataset does not exist or not owned by TDP', async () => {
      const contractPayload = {
        tdpId: tdpUser.id,
        datasetId: 'NON-EXISTENT-DS',
        modelId: 'ricardian-model-2',
        price: 123.45,
        duration: 45,
        termsAndConditions: 'Ricardian contract E2E test terms',
        contractType: 'AI_TRAINING'
      };
      const response = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${tdcToken}`)
        .send(contractPayload)
        .expect(404);
      expect(response.body.error).toBeDefined();
    });

    it('should fail if user is not TDC', async () => {
      // Authenticate as TDP
      const tdpToken = jwt.sign(
        { userId: tdpUser.id, partyType: tdpUser.partyType, email: tdpUser.email, walletAddress: '0xtdp', partyType: 'TDP' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      const contractPayload = {
        tdpId: tdpUser.id,
        datasetId: tdpDataset.datasetId,
        modelId: 'ricardian-model-3',
        price: 123.45,
        duration: 45,
        termsAndConditions: 'Ricardian contract E2E test terms',
        contractType: 'AI_TRAINING'
      };
      const response = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send(contractPayload)
        .expect(403);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      // Try to create contract with non-existent dataset
      const contractData = {
        contractId: 'ERROR-001',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Test terms',
        modelId: 'MODEL-001',
        tdpId: testUser.id,
        tdcId: testUser.id,
        ccrpId: testUser.id,
        datasetId: 99999 // Non-existent dataset
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const userData = {
        email: 'ratelimit@example.com',
        name: 'Rate Limit User',
        partyType: 'TDC',
        password: 'Password123'
      };

      // Make multiple requests
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        if (i < 5) {
          expect(response.status).toBe(409); // Duplicate email after first
        } else {
          expect(response.status).toBe(429); // Rate limited
        }
      }
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
}); 