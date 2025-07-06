const request = require('supertest');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import models
const { User, Contract, Dataset, Notification } = require('../models');
const { sequelize } = require('../models');

// Import services
const DIDService = require('../services/didService');
const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const BlockchainService = require('../services/blockchainService');

// Import app
const app = require('../server');

describe('Contract Management System - Comprehensive Test Suite', () => {
  let testUser, testContract, testDataset;
  let authToken;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: await bcrypt.hash('Password123', 10),
      role: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:testuser',
      didVerified: true
    });

    // Create test contract
    testContract = await Contract.create({
      title: 'Test Contract',
      description: 'Test contract description',
      status: 'DRAFT',
      tdpId: testUser.id,
      tdcId: testUser.id,
      ccrpId: testUser.id
    });

    // Create test dataset
    testDataset = await Dataset.create({
      name: 'Test Dataset',
      description: 'Test dataset description',
      ownerId: testUser.id,
      status: 'ACTIVE'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, role: testUser.role },
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
          username: 'newuser',
          password: 'hashed-password',
          role: 'TDC',
          publicKey: 'new-public-key',
          did: 'did:web:github.com:newuser',
          didVerified: false
        };

        const user = await User.create(userData);
        
        expect(user.email).toBe(userData.email);
        expect(user.username).toBe(userData.username);
        expect(user.role).toBe(userData.role);
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
          username: 'duplicateuser',
          password: 'hashed-password',
          role: 'TDC'
        };

        await expect(User.create(duplicateUser)).rejects.toThrow();
      });

      it('should validate role enum values', async () => {
        const invalidUser = {
          email: 'invalid@example.com',
          username: 'invaliduser',
          password: 'hashed-password',
          role: 'INVALID_ROLE'
        };

        await expect(User.create(invalidUser)).rejects.toThrow();
      });
    });

    describe('Contract Model', () => {
      it('should create a contract with valid data', async () => {
        const contractData = {
          title: 'New Contract',
          description: 'New contract description',
          status: 'PENDING',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id
        };

        const contract = await Contract.create(contractData);
        
        expect(contract.title).toBe(contractData.title);
        expect(contract.description).toBe(contractData.description);
        expect(contract.status).toBe(contractData.status);
        expect(contract.tdpId).toBe(contractData.tdpId);
        expect(contract.tdcId).toBe(contractData.tdcId);
        expect(contract.ccrpId).toBe(contractData.ccrpId);
        expect(contract.id).toBeDefined();
        expect(contract.createdAt).toBeDefined();
        expect(contract.updatedAt).toBeDefined();
      });

      it('should validate status enum values', async () => {
        const invalidContract = {
          title: 'Invalid Contract',
          description: 'Invalid contract description',
          status: 'INVALID_STATUS',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id
        };

        await expect(Contract.create(invalidContract)).rejects.toThrow();
      });

      it('should enforce foreign key constraints', async () => {
        const invalidContract = {
          title: 'Invalid Contract',
          description: 'Invalid contract description',
          status: 'DRAFT',
          tdpId: 'non-existent-id',
          tdcId: testUser.id,
          ccrpId: testUser.id
        };

        await expect(Contract.create(invalidContract)).rejects.toThrow();
      });
    });

    describe('Dataset Model', () => {
      it('should create a dataset with valid data', async () => {
        const datasetData = {
          name: 'New Dataset',
          description: 'New dataset description',
          ownerId: testUser.id,
          metadata: { type: 'training', size: 1000 },
          status: 'ACTIVE'
        };

        const dataset = await Dataset.create(datasetData);
        
        expect(dataset.name).toBe(datasetData.name);
        expect(dataset.description).toBe(datasetData.description);
        expect(dataset.ownerId).toBe(datasetData.ownerId);
        expect(dataset.metadata).toEqual(datasetData.metadata);
        expect(dataset.status).toBe(datasetData.status);
        expect(dataset.id).toBeDefined();
        expect(dataset.createdAt).toBeDefined();
        expect(dataset.updatedAt).toBeDefined();
      });

      it('should validate status enum values', async () => {
        const invalidDataset = {
          name: 'Invalid Dataset',
          description: 'Invalid dataset description',
          ownerId: testUser.id,
          status: 'INVALID_STATUS'
        };

        await expect(Dataset.create(invalidDataset)).rejects.toThrow();
      });
    });

    describe('Notification Model', () => {
      it('should create a notification with valid data', async () => {
        const notificationData = {
          userId: testUser.id,
          type: 'CONTRACT_SIGNED',
          title: 'Contract Signed',
          message: 'Your contract has been signed',
          read: false
        };

        const notification = await Notification.create(notificationData);
        
        expect(notification.userId).toBe(notificationData.userId);
        expect(notification.type).toBe(notificationData.type);
        expect(notification.title).toBe(notificationData.title);
        expect(notification.message).toBe(notificationData.message);
        expect(notification.read).toBe(notificationData.read);
        expect(notification.id).toBeDefined();
        expect(notification.createdAt).toBeDefined();
        expect(notification.updatedAt).toBeDefined();
      });

      it('should validate type enum values', async () => {
        const invalidNotification = {
          userId: testUser.id,
          type: 'INVALID_TYPE',
          title: 'Invalid Notification',
          message: 'Invalid notification message'
        };

        await expect(Notification.create(invalidNotification)).rejects.toThrow();
      });
    });
  });

  describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          email: 'register@example.com',
          username: 'registeruser',
          password: 'Password123',
          role: 'TDC'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.username).toBe(userData.username);
        expect(response.body.user.role).toBe(userData.role);
        expect(response.body.user.password).toBeUndefined();
        expect(response.body.token).toBeDefined();
        expect(response.body.***REMOVED-KEYCLOAK_DB_PASSWORD***Success).toBeDefined();
      });

      it('should fail with invalid email format', async () => {
        const userData = {
          email: 'invalid-email',
          username: 'invaliduser',
          password: 'Password123',
          role: 'TDC'
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
          username: 'weakuser',
          password: '123',
          role: 'TDC'
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
          username: 'duplicateuser',
          password: 'Password123',
          role: 'TDC'
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
          username: 'diduser',
          password: 'Password123',
          role: 'TDP',
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
        const loginData = {
          email: testUser.email,
          password: 'Password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
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
        const loginData = {
          email: testUser.email,
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

  describe('User Management API', () => {
    describe('GET /api/users', () => {
      it('should return all users for admin', async () => {
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
          .get('/api/users/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/users/:id', () => {
      it('should update user profile', async () => {
        const updateData = {
          username: 'updateduser',
          publicKey: 'updated-public-key'
        };

        const response = await request(app)
          .put(`/api/users/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.username).toBe(updateData.username);
        expect(response.body.publicKey).toBe(updateData.publicKey);
      });

      it('should reject updating other users without permission', async () => {
        const otherUser = await User.create({
          email: 'other@example.com',
          username: 'otheruser',
          password: await bcrypt.hash('Password123', 10),
          role: 'TDC'
        });

        const updateData = { username: 'hacked' };

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

  describe('Contract Management API', () => {
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
          .get('/api/contracts?status=DRAFT')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach(contract => {
          expect(contract.status).toBe('DRAFT');
        });
      });
    });

    describe('POST /api/contracts', () => {
      it('should create a new contract', async () => {
        const contractData = {
          title: 'New API Contract',
          description: 'Contract created via API',
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
        expect(response.body.tdpId).toBe(contractData.tdpId);
      });

      it('should validate required fields', async () => {
        const invalidContract = {
          title: 'Invalid Contract'
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidContract)
          .expect(400);

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
        expect(response.body.title).toBe(testContract.title);
      });

      it('should return 404 for non-existent contract', async () => {
        const response = await request(app)
          .get('/api/contracts/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('PUT /api/contracts/:id', () => {
      it('should update contract', async () => {
        const updateData = {
          title: 'Updated Contract Title',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/contracts/${testContract.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.title).toBe(updateData.title);
        expect(response.body.description).toBe(updateData.description);
      });
    });

    describe('POST /api/contracts/:id/sign', () => {
      it('should sign contract', async () => {
        const response = await request(app)
          .post(`/api/contracts/${testContract.id}/sign`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.contract.status).toBe('SIGNED');
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

  describe('Dataset Management API', () => {
    describe('GET /api/datasets', () => {
      it('should return all datasets', async () => {
        const response = await request(app)
          .get('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/datasets', () => {
      it('should create a new dataset', async () => {
        const datasetData = {
          name: 'New API Dataset',
          description: 'Dataset created via API',
          metadata: { type: 'training', size: 500 }
        };

        const response = await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(datasetData)
          .expect(201);

        expect(response.body.name).toBe(datasetData.name);
        expect(response.body.description).toBe(datasetData.description);
        expect(response.body.metadata).toEqual(datasetData.metadata);
        expect(response.body.ownerId).toBe(testUser.id);
      });
    });

    describe('GET /api/datasets/:id', () => {
      it('should return dataset by ID', async () => {
        const response = await request(app)
          .get(`/api/datasets/${testDataset.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testDataset.id);
        expect(response.body.name).toBe(testDataset.name);
      });
    });

    describe('PUT /api/datasets/:id', () => {
      it('should update dataset', async () => {
        const updateData = {
          name: 'Updated Dataset Name',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/datasets/${testDataset.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.description).toBe(updateData.description);
      });
    });
  });

  describe('DID Service', () => {
    describe('DID Resolution', () => {
      it('should resolve web DID successfully', async () => {
        const did = 'did:web:github.com:testuser';
        const didDocument = await DIDService.resolveDID(did);
        
        expect(didDocument).toBeDefined();
        expect(didDocument.id).toBe(did);
        expect(didDocument.verificationMethod).toBeDefined();
      });

      it('should extract public key from DID document', async () => {
        const did = 'did:web:github.com:testuser';
        const didDocument = await DIDService.resolveDID(did);
        const publicKey = await DIDService.extractPublicKey(didDocument);
        
        expect(publicKey).toBeDefined();
        expect(publicKey.kty).toBeDefined();
      });

      it('should handle invalid DID format', async () => {
        const invalidDid = 'invalid:did:format';
        
        await expect(DIDService.resolveDID(invalidDid))
          .rejects
          .toThrow('Unsupported DID method');
      });

      it('should handle non-existent DID', async () => {
        const nonExistentDid = 'did:web:github.com:nonexistentuser';
        
        await expect(DIDService.resolveDID(nonExistentDid))
          .rejects
          .toThrow();
      });
    });
  });

  describe('Keycloak Service', () => {
    describe('User Management', () => {
      it('should create user in Keycloak', async () => {
        const userData = {
          username: '***REMOVED-KEYCLOAK_DB_PASSWORD***user',
          email: '***REMOVED-KEYCLOAK_DB_PASSWORD***@example.com',
          password: 'Password123'
        };

        const result = await KeycloakService.createUser(userData);
        expect(result).toBeDefined();
      });

      it('should handle Keycloak connection errors', async () => {
        // Test with invalid Keycloak configuration
        const originalUrl = process.env.KEYCLOAK_URL;
        process.env.KEYCLOAK_URL = 'http://invalid-url:8080';

        const userData = {
          username: 'erroruser',
          email: 'error@example.com',
          password: 'Password123'
        };

        await expect(KeycloakService.createUser(userData))
          .rejects
          .toThrow();

        // Restore original configuration
        process.env.KEYCLOAK_URL = originalUrl;
      });
    });
  });

  describe('Blockchain Service', () => {
    describe('Contract Operations', () => {
      it('should create contract on blockchain', async () => {
        const contractData = {
          title: 'Blockchain Contract',
          description: 'Contract for blockchain testing',
          tdp: '0x1234567890123456789012345678901234567890',
          tdc: '0x2345678901234567890123456789012345678901',
          ccrp: '0x3456789012345678901234567890123456789012'
        };

        const result = await BlockchainService.createContract(contractData);
        expect(result).toBeDefined();
      });

      it('should sign contract on blockchain', async () => {
        const contractId = 1;
        const signerAddress = '0x1234567890123456789012345678901234567890';

        const result = await BlockchainService.signContract(contractId, signerAddress);
        expect(result).toBeDefined();
      });

      it('should handle blockchain connection errors', async () => {
        // Test with invalid blockchain configuration
        const originalRpcUrl = process.env.BLOCKCHAIN_RPC_URL;
        process.env.BLOCKCHAIN_RPC_URL = 'http://invalid-url:8545';

        const contractData = {
          title: 'Error Contract',
          description: 'Contract for error testing',
          tdp: '0x1234567890123456789012345678901234567890',
          tdc: '0x2345678901234567890123456789012345678901',
          ccrp: '0x3456789012345678901234567890123456789012'
        };

        await expect(BlockchainService.createContract(contractData))
          .rejects
          .toThrow();

        // Restore original configuration
        process.env.BLOCKCHAIN_RPC_URL = originalRpcUrl;
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Temporarily close database connection
      await sequelize.close();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).toBeDefined();

      // Reconnect database
      await sequelize.authenticate();
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        username: '',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.details).toBeDefined();
    });

    it('should handle authentication errors', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should handle authorization errors', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        username: 'otheruser',
        password: await bcrypt.hash('Password123', 10),
        role: 'TDC'
      });

      const response = await request(app)
        .delete(`/api/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle large dataset queries', async () => {
      // Create multiple test records
      const users = await Promise.all(
        Array(50).fill().map((_, i) =>
          User.create({
            email: `perf${i}@example.com`,
            username: `perfuser${i}`,
            password: await bcrypt.hash('Password123', 10),
            role: 'TDC'
          })
        )
      );

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.length).toBeGreaterThan(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      // Cleanup
      await Promise.all(users.map(user => user.destroy()));
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get(`/api/users?search=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not crash and should return empty results or error
      expect(response.body).toBeDefined();
    });

    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: xssPayload,
          description: 'Test contract',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id
        })
        .expect(201);

      // Should sanitize input
      expect(response.body.title).not.toContain('<script>');
    });

    it('should enforce password complexity', async () => {
      const weakPasswords = ['123', 'password', 'abc', 'qwerty'];
      
      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `weak${Date.now()}@example.com`,
            username: `weakuser${Date.now()}`,
            password: password,
            role: 'TDC'
          })
          .expect(400);

        expect(response.body.error).toBeDefined();
      }
    });

    it('should rate limit authentication attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'WrongPassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          expect(response.status).toBe(429); // Rate limited
        }
      }
    });
  });

  describe('Integration Tests', () => {
    it('should complete full contract lifecycle', async () => {
      // 1. Create contract
      const contractData = {
        title: 'Integration Test Contract',
        description: 'Full lifecycle test',
        tdpId: testUser.id,
        tdcId: testUser.id,
        ccrpId: testUser.id
      };

      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(201);

      const contractId = createResponse.body.id;

      // 2. Update contract
      const updateResponse = await request(app)
        .put(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PENDING' })
        .expect(200);

      expect(updateResponse.body.status).toBe('PENDING');

      // 3. Sign contract
      const signResponse = await request(app)
        .post(`/api/contracts/${contractId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(signResponse.body.contract.status).toBe('SIGNED');

      // 4. Verify final state
      const finalResponse = await request(app)
        .get(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.status).toBe('SIGNED');
    });

    it('should handle user registration with DID and Keycloak', async () => {
      const userData = {
        email: 'integration@example.com',
        username: 'integrationuser',
        password: 'Password123',
        role: 'TDP',
        did: 'did:web:github.com:testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.did).toBe(userData.did);
      expect(response.body.user.publicKey).toBeDefined();
      expect(response.body.user.didVerified).toBe(true);
      expect(response.body.***REMOVED-KEYCLOAK_DB_PASSWORD***Success).toBeDefined();
    });
  });
}); 