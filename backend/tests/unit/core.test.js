const request = require('supertest');
const { User, Contract, Dataset, Notification } = require('../../models');
const { sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import app
const app = require('../test-server');

describe('Contract Management System - Core Test Suite', () => {
  let testUser, testContract, testDataset;
  let authToken;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      partyType: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:testuser',
      didVerified: true
    });

    // Create test dataset
    testDataset = await Dataset.create({
      datasetId: 'TEST-DATASET-001',
      name: 'Test Dataset',
      description: 'Test dataset description',
      category: 'Computer Vision',
      size: 1000,
      recordCount: 10000,
      price: 50.00,
      license: 'MIT',
      ownerId: testUser.id,
      status: 'ACTIVE'
    });

    // Create test contract
    testContract = await Contract.create({
      contractId: 'TEST-CONTRACT-001',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms and conditions',
      status: 'PENDING_TDP_APPROVAL',
      tdpId: testUser.id,
      tdcId: testUser.id,
      ccrpId: testUser.id,
      datasetId: testDataset.id,
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

  describe('Database Models', () => {
    describe('User Model', () => {
      it('should create a user with valid data', async () => {
        const userData = {
          email: 'newuser@example.com',
          name: 'New User',
          partyType: 'TDC',
          publicKey: 'new-public-key',
          did: 'did:web:github.com:newuser',
          didVerified: false
        };

        const user = await User.create(userData);
        
        expect(user.email).toBe(userData.email);
        expect(user.name).toBe(userData.name);
        expect(user.partyType).toBe(userData.partyType);
        expect(user.publicKey).toBe(userData.publicKey);
        expect(user.did).toBe(userData.did);
        expect(user.didVerified).toBe(userData.didVerified);
        expect(user.id).toBeDefined();
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
      });

      it('should enforce unique email constraint', async () => {
        const duplicateUser = {
          email: testUser.email,
          name: 'Duplicate User',
          partyType: 'TDC'
        };

        await expect(User.create(duplicateUser)).rejects.toThrow();
      });

      it('should validate role enum values', async () => {
        const invalidUser = {
          email: 'invalid@example.com',
          name: 'Invalid User',
          partyType: 'INVALID_ROLE'
        };

        await expect(User.create(invalidUser)).rejects.toThrow();
      });
    });

    describe('Contract Model', () => {
      it('should create a contract with valid data', async () => {
        const contractData = {
          contractId: 'NEW-CONTRACT-001',
          price: 150.00,
          duration: 45,
          termsAndConditions: 'New contract terms and conditions',
          status: 'PENDING_TDP_APPROVAL',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id,
          datasetId: testDataset.id,
          contractDatasets: [{
            datasetId: testDataset.datasetId,
            tdpId: testUser.id,
            datasetName: testDataset.name,
            tdpName: testUser.name,
            individualPrice: 150.00,
            paymentStatus: 'PENDING'
          }],
          datasetCount: 1,
          tdpCount: 1,
          totalPrice: 150.00
        };

        const contract = await Contract.create(contractData);
        
        expect(contract.contractId).toBe(contractData.contractId);
        expect(contract.price).toBe(contractData.price);
        expect(contract.duration).toBe(contractData.duration);
        expect(contract.termsAndConditions).toBe(contractData.termsAndConditions);
        expect(contract.status).toBe(contractData.status);
        expect(contract.tdpId).toBe(contractData.tdpId);
        expect(contract.tdcId).toBe(contractData.tdcId);
        expect(contract.ccrpId).toBe(contractData.ccrpId);
        expect(contract.datasetId).toBe(contractData.datasetId);
        expect(contract.id).toBeDefined();
        expect(contract.createdAt).toBeDefined();
        expect(contract.updatedAt).toBeDefined();
      });

      it('should validate status enum values', async () => {
        const invalidContract = {
          contractId: 'INVALID-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Invalid contract terms',
          status: 'INVALID_STATUS',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id,
          datasetId: testDataset.id
        };

        await expect(Contract.create(invalidContract)).rejects.toThrow();
      });
    });

    describe('Dataset Model', () => {
      it('should create a dataset with valid data', async () => {
        const datasetData = {
          datasetId: 'NEW-DATASET-001',
          name: 'New Dataset',
          description: 'New dataset description',
          category: 'Natural Language Processing',
          size: 2000,
          recordCount: 20000,
          price: 75.00,
          license: 'Apache 2.0',
          ownerId: testUser.id,
          metadata: { type: 'training', size: 1000 },
          status: 'ACTIVE'
        };

        const dataset = await Dataset.create(datasetData);
        
        expect(dataset.datasetId).toBe(datasetData.datasetId);
        expect(dataset.name).toBe(datasetData.name);
        expect(dataset.description).toBe(datasetData.description);
        expect(dataset.category).toBe(datasetData.category);
        expect(dataset.size).toBe(datasetData.size);
        expect(dataset.recordCount).toBe(datasetData.recordCount);
        expect(dataset.price).toBe(datasetData.price);
        expect(dataset.license).toBe(datasetData.license);
        expect(dataset.ownerId).toBe(datasetData.ownerId);
        expect(dataset.metadata).toEqual(datasetData.metadata);
        expect(dataset.status).toBe(datasetData.status);
        expect(dataset.id).toBeDefined();
        expect(dataset.createdAt).toBeDefined();
        expect(dataset.updatedAt).toBeDefined();
      });
    });

    describe('Notification Model', () => {
      it('should create a notification with valid data', async () => {
        const notificationData = {
          userId: testUser.id,
          type: 'CONTRACT_SIGNED',
          title: 'Contract Signed',
          message: 'Your contract has been signed',
          isRead: false
        };

        const notification = await Notification.create(notificationData);
        
        expect(notification.userId).toBe(notificationData.userId);
        expect(notification.type).toBe(notificationData.type);
        expect(notification.title).toBe(notificationData.title);
        expect(notification.message).toBe(notificationData.message);
        expect(notification.isRead).toBe(notificationData.isRead);
        expect(notification.id).toBeDefined();
        expect(notification.createdAt).toBeDefined();
        expect(notification.updatedAt).toBeDefined();
      });
    });
  });

  describe('API Endpoints', () => {
    describe('Health Check', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    describe('User Management', () => {
      it('should get all users', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should get user by ID', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testUser.id);
        expect(response.body.email).toBe(testUser.email);
      });

      it('should reject unauthorized access', async () => {
        const response = await request(app)
          .get('/api/users')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('Contract Management', () => {
      it('should get all contracts', async () => {
        const response = await request(app)
          .get('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should get contract by ID', async () => {
        const response = await request(app)
          .get(`/api/contracts/${testContract.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testContract.id);
        expect(response.body.title).toBe(testContract.title);
      });

      it('should create new contract', async () => {
        const contractData = {
          title: 'API Test Contract',
          description: 'Contract created via API test',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id
        };

        const response = await request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(contractData)
          .expect(201);

        expect(response.body.title).toBe(contractData.title);
        expect(response.body.description).toBe(contractData.description);
        expect(response.body.status).toBe('DRAFT');
      });
    });

    describe('Dataset Management', () => {
      it('should get all datasets', async () => {
        const response = await request(app)
          .get('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should get dataset by ID', async () => {
        const response = await request(app)
          .get(`/api/datasets/${testDataset.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testDataset.id);
        expect(response.body.name).toBe(testDataset.name);
      });

      it('should create new dataset', async () => {
        const datasetData = {
          name: 'API Test Dataset',
          description: 'Dataset created via API test',
          metadata: { type: 'test', size: 100 }
        };

        const response = await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(datasetData)
          .expect(201);

        expect(response.body.name).toBe(datasetData.name);
        expect(response.body.description).toBe(datasetData.description);
        expect(response.body.ownerId).toBe(testUser.id);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent resources', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
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
        .send({ title: 'Incomplete Contract' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject missing tokens', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Test User',
        partyType: 'TDP'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should validate contract status', async () => {
      const invalidContract = {
        title: 'Test Contract',
        description: 'Test description',
        status: 'INVALID_STATUS',
        tdpId: testUser.id,
        tdcId: testUser.id,
        ccrpId: testUser.id
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidContract)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Database Operations', () => {
    it('should handle database transactions', async () => {
      const transaction = await sequelize.transaction();
      
      try {
        const user = await User.create({
          email: 'transaction@example.com',
          name: 'Transaction User',
          partyType: 'TDC'
        }, { transaction });

        expect(user.id).toBeDefined();
        
        await transaction.commit();
        
        // Verify user was created
        const savedUser = await User.findByPk(user.id);
        expect(savedUser).toBeDefined();
        expect(savedUser.email).toBe('transaction@example.com');
        
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    it('should handle database rollback on error', async () => {
      const transaction = await sequelize.transaction();
      
      try {
        // Create user successfully
        const user = await User.create({
          email: 'rollback@example.com',
          name: 'Rollback User',
          partyType: 'TDC'
        }, { transaction });

        // Try to create duplicate user (should fail)
        await User.create({
          email: 'rollback@example.com',
          name: 'Duplicate User',
          partyType: 'TDC'
        }, { transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        
        // Verify user was not created
        const savedUser = await User.findOne({ where: { email: 'rollback@example.com' } });
        expect(savedUser).toBeNull();
      }
    });
  });
}); 