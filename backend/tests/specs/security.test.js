const request = require('supertest');
const { User, Contract, Dataset } = require('../../models');
const { sequelize } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import app
const app = require('../test-server');

describe('Security Test Suite', () => {
  let testUser, testContract, testDataset;
  let authToken;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'security@example.com',
      name: 'Security Test User',
      partyType: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:securitytestuser',
      didVerified: true
    });

    // Create test dataset
    testDataset = await Dataset.create({
      datasetId: 'SECURITY-DATASET-001',
      name: 'Security Test Dataset',
      description: 'Dataset for security testing',
      category: 'Computer Vision',
      size: 1000,
      recordCount: 10000,
      price: 50.00,
      license: 'MIT',
      ownerId: testUser.id
    });

    // Create test contract
    testContract = await Contract.create({
      contractId: 'SECURITY-CONTRACT-001',
      status: 'PENDING_TDP_APPROVAL',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Security test terms',
      modelId: 'SECURITY-MODEL-001',
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

  describe('Authentication Security', () => {
    describe('Password Security', () => {
      it('should enforce strong password requirements', async () => {
        const weakPasswords = [
          '123',
          'password',
          'abc123',
          'qwerty',
          '1234567890'
        ];

        for (const weakPassword of weakPasswords) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: `weak-${Date.now()}@example.com`,
              name: 'Weak Password User',
              partyType: 'TDC',
              password: weakPassword
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
          expect(response.body.error).toContain('password');
        }
      });

      it('should hash passwords securely', async () => {
        const userData = {
          email: 'hash@example.com',
          name: 'Hash Test User',
          partyType: 'TDC',
          password: 'SecurePassword123!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Verify password is hashed in database
        const user = await User.findOne({ where: { email: userData.email } });
        expect(user.password).not.toBe(userData.password);
        expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt pattern
      });

      it('should prevent password enumeration attacks', async () => {
        // Try to register with existing email
        const existingEmail = 'enumeration@example.com';
        
        // First registration
        await request(app)
          .post('/api/auth/register')
          .send({
            email: existingEmail,
            name: 'First User',
            partyType: 'TDC',
            password: 'Password123'
          })
          .expect(201);

        // Second registration with same email
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: existingEmail,
            name: 'Second User',
            partyType: 'TDC',
            password: 'DifferentPassword123'
          })
          .expect(409);

        expect(response.body.error).toBeDefined();
        // Should not reveal whether email exists or not
        expect(response.body.error).not.toContain('already exists');
      });
    });

    describe('JWT Security', () => {
      it('should validate JWT token format', async () => {
        const invalidTokens = [
          'invalid-token',
          'Bearer invalid',
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
          ''
        ];

        for (const invalidToken of invalidTokens) {
          const response = await request(app)
            .get('/api/users')
            .set('Authorization', invalidToken)
            .expect(401);

          expect(response.body.error).toBeDefined();
        }
      });

      it('should reject expired tokens', async () => {
        const expiredToken = jwt.sign(
          { userId: testUser.id, role: testUser.partyType },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '0s' }
        );

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should reject tokens with invalid signature', async () => {
        const invalidSignatureToken = jwt.sign(
          { userId: testUser.id, role: testUser.partyType },
          'wrong-secret',
          { expiresIn: '1h' }
        );

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${invalidSignatureToken}`)
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should include proper claims in JWT', async () => {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.valid).toBe(true);
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toBe(testUser.id);
      });
    });

    describe('Session Security', () => {
      it('should not expose sensitive information in responses', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.password).toBeUndefined();
        expect(response.body.salt).toBeUndefined();
        expect(response.body.hash).toBeUndefined();
      });

      it('should handle concurrent login attempts', async () => {
        const userData = {
          email: 'concurrent@example.com',
          name: 'Concurrent User',
          partyType: 'TDC',
          password: 'Password123'
        };

        // Register user
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Attempt concurrent logins
        const loginPromises = Array(5).fill().map(() =>
          request(app)
            .post('/api/auth/login')
            .send({
              email: userData.email,
              password: userData.password
            })
        );

        const responses = await Promise.all(loginPromises);
        
        // All should succeed (no rate limiting on successful logins)
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      });
    });
  });

  describe('Authorization Security', () => {
    describe('Resource Access Control', () => {
      it('should prevent unauthorized access to user data', async () => {
        const otherUser = await User.create({
          email: 'other@example.com',
          name: 'Other User',
          partyType: 'TDC'
        });

        // Try to access other user's data
        const response = await request(app)
          .get(`/api/users/${otherUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.error).toBeDefined();
      });

      it('should prevent unauthorized contract modifications', async () => {
        const otherUser = await User.create({
          email: 'contract-other@example.com',
          name: 'Contract Other User',
          partyType: 'TDC'
        });

        const otherToken = jwt.sign(
          { userId: otherUser.id, role: otherUser.partyType },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        // Try to modify contract owned by different user
        const response = await request(app)
          .put(`/api/contracts/${testContract.id}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send({ status: 'ACTIVE' })
          .expect(403);

        expect(response.body.error).toBeDefined();
      });

      it('should enforce party-specific permissions', async () => {
        const tdcUser = await User.create({
          email: 'tdc-permission@example.com',
          name: 'TDC Permission User',
          partyType: 'TDC'
        });

        const tdcToken = jwt.sign(
          { userId: tdcUser.id, role: tdcUser.partyType },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        // TDC user should not be able to create datasets (TDP only)
        const response = await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${tdcToken}`)
          .send({
            datasetId: 'PERMISSION-DATASET-001',
            name: 'Permission Test Dataset',
            description: 'Dataset for permission testing',
            category: 'Computer Vision',
            size: 1000,
            recordCount: 10000,
            price: 50.00,
            license: 'MIT'
          })
          .expect(403);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('Role-Based Access Control', () => {
      it('should enforce TDP-only dataset creation', async () => {
        const nonTdpUsers = [
          { email: 'tdc-dataset@example.com', partyType: 'TDC' },
          { email: 'ccrp-dataset@example.com', partyType: 'CCRP' }
        ];

        for (const userData of nonTdpUsers) {
          const user = await User.create(userData);
          const token = jwt.sign(
            { userId: user.id, role: user.partyType },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
          );

          const response = await request(app)
            .post('/api/datasets')
            .set('Authorization', `Bearer ${token}`)
            .send({
              datasetId: `ROLE-DATASET-${user.partyType}`,
              name: 'Role Test Dataset',
              description: 'Dataset for role testing',
              category: 'Computer Vision',
              size: 1000,
              recordCount: 10000,
              price: 50.00,
              license: 'MIT'
            })
            .expect(403);

          expect(response.body.error).toBeDefined();
        }
      });

      it('should allow appropriate contract signing based on role', async () => {
        const tdpUser = await User.create({
          email: 'tdp-sign@example.com',
          name: 'TDP Sign User',
          partyType: 'TDP'
        });

        const ccrpUser = await User.create({
          email: 'ccrp-sign@example.com',
          name: 'CCRP Sign User',
          partyType: 'CCRP'
        });

        const tdpToken = jwt.sign(
          { userId: tdpUser.id, role: tdpUser.partyType },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        const ccrpToken = jwt.sign(
          { userId: ccrpUser.id, role: ccrpUser.partyType },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        // Create contract with these users
        const contract = await Contract.create({
          contractId: 'ROLE-SIGN-CONTRACT-001',
          status: 'PENDING_TDP_APPROVAL',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Role sign test terms',
          modelId: 'ROLE-SIGN-MODEL-001',
          tdpId: tdpUser.id,
          tdcId: tdpUser.id,
          ccrpId: ccrpUser.id,
          datasetId: testDataset.id
        });

        // TDP should be able to sign
        const tdpSignResponse = await request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${tdpToken}`)
          .expect(200);

        expect(tdpSignResponse.body.success).toBe(true);

        // CCRP should be able to sign after TDP
        const ccrpSignResponse = await request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${ccrpToken}`)
          .expect(200);

        expect(ccrpSignResponse.body.success).toBe(true);
      });
    });
  });

  describe('Input Validation Security', () => {
    describe('SQL Injection Prevention', () => {
      it('should prevent SQL injection in email field', async () => {
        const sqlInjectionEmails = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          "admin'--",
          "'; INSERT INTO users VALUES (1, 'hacker', 'hacker'); --"
        ];

        for (const maliciousEmail of sqlInjectionEmails) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: maliciousEmail,
              name: 'SQL Injection Test',
              partyType: 'TDC',
              password: 'Password123'
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });

      it('should prevent SQL injection in search parameters', async () => {
        const maliciousQueries = [
          "'; DROP TABLE contracts; --",
          "' OR '1'='1",
          "'; UPDATE users SET partyType='ADMIN'; --"
        ];

        for (const maliciousQuery of maliciousQueries) {
          const response = await request(app)
            .get(`/api/contracts?status=${encodeURIComponent(maliciousQuery)}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });
    });

    describe('XSS Prevention', () => {
      it('should sanitize user input in names', async () => {
        const xssNames = [
          '<script>alert("XSS")</script>',
          '"><script>alert("XSS")</script>',
          'javascript:alert("XSS")',
          '<img src="x" onerror="alert(\'XSS\')">'
        ];

        for (const maliciousName of xssNames) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: `xss-${Date.now()}@example.com`,
              name: maliciousName,
              partyType: 'TDC',
              password: 'Password123'
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });

      it('should sanitize contract terms', async () => {
        const maliciousTerms = [
          '<script>alert("XSS")</script>',
          'javascript:alert("XSS")',
          '<iframe src="javascript:alert(\'XSS\')"></iframe>'
        ];

        for (const maliciousTerms of maliciousTerms) {
          const response = await request(app)
            .post('/api/contracts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              contractId: `XSS-CONTRACT-${Date.now()}`,
              price: 100.00,
              duration: 30,
              termsAndConditions: maliciousTerms,
              modelId: 'XSS-MODEL-001',
              tdpId: testUser.id,
              tdcId: testUser.id,
              ccrpId: testUser.id,
              datasetId: testDataset.id
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });
    });

    describe('Data Type Validation', () => {
      it('should validate numeric fields', async () => {
        const invalidNumericData = [
          { price: 'not-a-number' },
          { price: -100 },
          { price: 0 },
          { duration: 'invalid' },
          { duration: -30 },
          { duration: 0 }
        ];

        for (const invalidData of invalidNumericData) {
          const response = await request(app)
            .post('/api/contracts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              contractId: `INVALID-NUMERIC-${Date.now()}`,
              price: invalidData.price || 100.00,
              duration: invalidData.duration || 30,
              termsAndConditions: 'Valid terms',
              modelId: 'INVALID-NUMERIC-MODEL-001',
              tdpId: testUser.id,
              tdcId: testUser.id,
              ccrpId: testUser.id,
              datasetId: testDataset.id
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });

      it('should validate email format', async () => {
        const invalidEmails = [
          'not-an-email',
          '@example.com',
          'user@',
          'user..name@example.com',
          'user@example',
          'user name@example.com'
        ];

        for (const invalidEmail of invalidEmails) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: invalidEmail,
              name: 'Invalid Email User',
              partyType: 'TDC',
              password: 'Password123'
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });

      it('should validate enum values', async () => {
        const invalidPartyTypes = ['INVALID', 'ADMIN', 'USER', ''];

        for (const invalidPartyType of invalidPartyTypes) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: `enum-${Date.now()}@example.com`,
              name: 'Enum Test User',
              partyType: invalidPartyType,
              password: 'Password123'
            })
            .expect(400);

          expect(response.body.error).toBeDefined();
        }
      });
    });

    describe('Length and Size Validation', () => {
      it('should enforce maximum field lengths', async () => {
        const longString = 'a'.repeat(10000);
        
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'length@example.com',
            name: longString,
            partyType: 'TDC',
            password: 'Password123'
          })
          .expect(400);

        expect(response.body.error).toBeDefined();
      });

      it('should enforce minimum field lengths', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'min@example.com',
            name: 'A', // Too short
            partyType: 'TDC',
            password: 'Password123'
          })
          .expect(400);

        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for common security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should not expose server information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
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

      // Make multiple registration attempts
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            ...userData,
            email: `ratelimit${i}@example.com`
          });

        if (i < 5) {
          expect(response.status).toBe(201);
        } else {
          expect(response.status).toBe(429); // Rate limited
        }
      }
    });

    it('should enforce rate limits on API endpoints', async () => {
      // Make multiple requests to API endpoints
      for (let i = 0; i < 101; i++) {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${authToken}`);

        if (i < 100) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429); // Rate limited
        }
      }
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).not.toContain('SQL');
      expect(response.body.error).not.toContain('database');
      expect(response.body.error).not.toContain('password');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).not.toContain('SQL');
    });

    it('should handle oversized payloads', async () => {
      const largePayload = { data: 'a'.repeat(1000000) };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload)
        .expect(413); // Payload too large

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DID Security', () => {
    it('should validate DID format', async () => {
      const invalidDids = [
        'invalid:did:format',
        'did:invalid:format',
        'did:web:',
        'did:web:github.com:',
        'http://github.com/user'
      ];

      for (const invalidDid of invalidDids) {
        const response = await request(app)
          .post('/api/did/resolve')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ did: invalidDid })
          .expect(400);

        expect(response.body.error).toBeDefined();
      }
    });

    it('should handle DID resolution failures securely', async () => {
      const response = await request(app)
        .post('/api/did/resolve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ did: 'did:web:github.com:nonexistentuser' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).not.toContain('internal');
    });

    it('should validate public key format from DID', async () => {
      const response = await request(app)
        .post('/api/did/resolve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ did: 'did:web:github.com:testuser' })
        .expect(200);

      expect(response.body.publicKey).toBeDefined();
      expect(response.body.publicKey).toHaveProperty('kty');
      expect(response.body.publicKey).toHaveProperty('n');
      expect(response.body.publicKey).toHaveProperty('e');
    });
  });
}); 