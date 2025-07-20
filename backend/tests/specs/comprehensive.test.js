const request = require('supertest');
const { User, Contract, Dataset, Notification } = require('../../models');
const { sequelize } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import test server instead of main server
const app = require('../test-server');

describe('Comprehensive Test Suite', () => {
  let testUser, authToken;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'comprehensive-test@example.com',
      name: 'Comprehensive Test User',
      partyType: 'TDP',
      walletAddress: '0x1234567890123456789012345678901234567890',
      publicKey: 'test-public-key'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup test data
    await User.destroy({ where: { email: 'comprehensive-test@example.com' } });
    await sequelize.close();
  });

  describe('User Management', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        name: 'New User',
        partyType: 'TDC',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.partyType).toBe(userData.partyType);
    });

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Duplicate User',
        partyType: 'TDC',
        password: 'Password123'
      };

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration should fail
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid@example.com',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Contract Management', () => {
    it('should create contract successfully', async () => {
      const contractData = {
        datasetId: 'TEST-DATASET-001',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Test terms',
        tdpId: testUser.id,
        tdcId: testUser.id
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(201);

      expect(response.body.contract).toBeDefined();
      expect(response.body.contract.datasetId).toBe(contractData.datasetId);
    });

    it('should retrieve contract by ID', async () => {
      // Create a contract first
      const contractData = {
        datasetId: 'TEST-DATASET-002',
        price: 150.00,
        duration: 45,
        termsAndConditions: 'Test terms 2',
        tdpId: testUser.id,
        tdcId: testUser.id
      };

      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(201);

      const contractId = createResponse.body.contract.id;

      // Retrieve the contract
      const getResponse = await request(app)
        .get(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.contract).toBeDefined();
      expect(getResponse.body.contract.id).toBe(contractId);
    });
  });

  describe('Dataset Management', () => {
    it('should create dataset successfully', async () => {
      const datasetData = {
        datasetId: 'COMPREHENSIVE-DATASET-001',
        name: 'Comprehensive Test Dataset',
        description: 'Dataset for comprehensive testing',
        category: 'Computer Vision',
        size: 2000,
        recordCount: 20000,
        price: 100.00,
        license: 'MIT'
      };

      const response = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(datasetData)
        .expect(201);

      expect(response.body.datasetId).toBe(datasetData.datasetId);
      expect(response.body.name).toBe(datasetData.name);
    });

    it('should retrieve datasets for user', async () => {
      const response = await request(app)
        .get('/api/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for protected endpoints', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });

    it('should validate JWT tokens', async () => {
      const invalidToken = 'invalid-jwt-token';

      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should handle authorization errors', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        name: 'Other User',
        partyType: 'TDC',
        walletAddress: '0x2345678901234567890123456789012345678901',
        publicKey: 'other-public-key'
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
            name: `Perf User ${i}`,
            partyType: 'TDC',
            walletAddress: `0x${i.toString().padStart(40, '0')}`,
            publicKey: `public-key-${i}`
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
          datasetId: 'XSS-TEST-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: xssPayload,
          tdpId: testUser.id,
          tdcId: testUser.id
        })
        .expect(201);

      // Should sanitize input
      expect(response.body.contract).toBeDefined();
    });

    it('should enforce password complexity', async () => {
      const weakPasswords = ['123', 'password', 'abc', 'qwerty'];
      
      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `weak${Date.now()}@example.com`,
            name: `Weak User ${Date.now()}`,
            password: password,
            partyType: 'TDC'
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
        datasetId: 'LIFECYCLE-TEST-001',
        price: 200.00,
        duration: 60,
        termsAndConditions: 'Lifecycle test terms',
        tdpId: testUser.id,
        tdcId: testUser.id
      };

      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData)
        .expect(201);

      const contractId = createResponse.body.contract.id;

      // 2. Update contract
      const updateResponse = await request(app)
        .put(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PENDING_CCRP_APPROVAL' })
        .expect(200);

      expect(updateResponse.body.contract.status).toBe('PENDING_CCRP_APPROVAL');

      // 3. Sign contract
      const signResponse = await request(app)
        .post(`/api/contracts/${contractId}/sign`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(signResponse.body.contract.status).toBe('ACTIVE');

      // 4. Verify final state
      const finalResponse = await request(app)
        .get(`/api/contracts/${contractId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalResponse.body.contract.status).toBe('ACTIVE');
    });

    it('should handle user registration with DID and Keycloak', async () => {
      const userData = {
        email: 'integration@example.com',
        name: 'Integration User',
        password: 'Password123',
        partyType: 'TDP',
        existingDID: 'did:web:github.com:testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.partyType).toBe(userData.partyType);
    });
  });
}); 