/**
 * Contract Signing Integration Tests
 * 
 * Comprehensive integration tests for contract signing API endpoints
 * including SCITT CCF integration, key management, and signature verification.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const request = require('supertest');
const app = require('../../server');
const { User, Contract, UserKey, ScittClaim, SigningEvent } = require('../../models');
const SigningTestDataSetup = require('../setup/signing-test-data');
const keyManagementService = require('../../services/keyManagementService');

describe('Contract Signing Integration Tests', () => {
  let testData;
  let authToken;
  let testUser;
  let testContract;
  let testKey;

  beforeAll(async () => {
    // Setup test data
    const setup = new SigningTestDataSetup();
    testData = await setup.setupAll();
    
    // Get test user and contract
    testUser = testData.users.find(u => u.partyType === 'TDC');
    testContract = testData.contracts.find(c => c.contractId === 'TEST_CONTRACT_001');
    testKey = testData.keys.find(k => k.userId === testUser.id);
    
    // Generate auth token for test user
    authToken = await generateAuthToken(testUser);
  });

  afterAll(async () => {
    // Cleanup test data
    const setup = new SigningTestDataSetup();
    await setup.cleanup();
  });

  describe('Key Management Endpoints', () => {
    describe('GET /api/signing/keys', () => {
      test('should get user signing keys', async () => {
        const response = await request(app)
          .get('/api/signing/keys')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.keys).toBeDefined();
        expect(Array.isArray(response.body.keys)).toBe(true);
        expect(response.body.keys.length).toBeGreaterThan(0);
        
        const userKey = response.body.keys[0];
        expect(userKey).toHaveProperty('id');
        expect(userKey).toHaveProperty('keyId');
        expect(userKey).toHaveProperty('keyType');
        expect(userKey).toHaveProperty('keyStatus');
        expect(userKey).toHaveProperty('createdAt');
      });

      test('should require authentication', async () => {
        await request(app)
          .get('/api/signing/keys')
          .expect(401);
      });
    });

    describe('POST /api/signing/keys/generate', () => {
      test('should generate new signing key', async () => {
        const response = await request(app)
          .post('/api/signing/keys/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ keyType: 'ECDSA-P256' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.key).toBeDefined();
        expect(response.body.key.keyType).toBe('ECDSA-P256');
        expect(response.body.key.keyStatus).toBe('active');
        expect(response.body.key.keyId).toBeDefined();
      });

      test('should generate RSA key', async () => {
        const response = await request(app)
          .post('/api/signing/keys/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ keyType: 'RSA-2048' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.key.keyType).toBe('RSA-2048');
      });

      test('should handle invalid key type', async () => {
        const response = await request(app)
          .post('/api/signing/keys/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ keyType: 'INVALID-TYPE' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Failed to generate signing key');
      });
    });

    describe('POST /api/signing/keys/import', () => {
      test('should import valid key', async () => {
        const keyData = {
          keyId: 'IMPORTED_KEY_001',
          keyType: 'ECDSA-P256',
          publicKey: '-----BEGIN PUBLIC KEY-----\ntest-public-key\n-----END PUBLIC KEY-----',
          privateKey: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----'
        };

        const response = await request(app)
          .post('/api/signing/keys/import')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ keyData, keyType: 'ECDSA-P256' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.key.keyId).toBe('IMPORTED_KEY_001');
        expect(response.body.key.keyType).toBe('ECDSA-P256');
      });

      test('should reject invalid key data', async () => {
        const invalidKeyData = {
          keyId: 'INVALID_KEY',
          keyType: 'ECDSA-P256'
          // Missing publicKey and privateKey
        };

        const response = await request(app)
          .post('/api/signing/keys/import')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ keyData: invalidKeyData, keyType: 'ECDSA-P256' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid key data format');
      });

      test('should reject duplicate key ID', async () => {
        const keyData = {
          keyId: testKey.keyId, // Use existing key ID
          keyType: 'ECDSA-P256',
          publicKey: '-----BEGIN PUBLIC KEY-----\ntest-public-key\n-----END PUBLIC KEY-----',
          privateKey: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----'
        };

        const response = await request(app)
          .post('/api/signing/keys/import')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ keyData, keyType: 'ECDSA-P256' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Key with this ID already exists');
      });
    });

    describe('DELETE /api/signing/keys/:keyId', () => {
      test('should delete user key', async () => {
        // Create a key to delete
        const keyToDelete = await UserKey.create({
          userId: testUser.id,
          keyId: 'KEY_TO_DELETE',
          keyType: 'ECDSA-P256',
          publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
          keyStatus: 'active'
        });

        const response = await request(app)
          .delete(`/api/signing/keys/${keyToDelete.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        // Verify key is soft deleted
        const deletedKey = await UserKey.findByPk(keyToDelete.id);
        expect(deletedKey.keyStatus).toBe('revoked');
      });

      test('should not delete other user keys', async () => {
        const otherUser = testData.users.find(u => u.partyType === 'TSP');
        const otherUserKey = await UserKey.create({
          userId: otherUser.id,
          keyId: 'OTHER_USER_KEY',
          keyType: 'ECDSA-P256',
          publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
          keyStatus: 'active'
        });

        const response = await request(app)
          .delete(`/api/signing/keys/${otherUserKey.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Key not found');
      });
    });

    describe('GET /api/signing/keys/:keyId/export', () => {
      test('should export user key', async () => {
        const response = await request(app)
          .get(`/api/signing/keys/${testKey.id}/export`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.keyData).toBeDefined();
        expect(response.body.keyData.keyId).toBe(testKey.keyId);
        expect(response.body.keyData.keyType).toBe(testKey.keyType);
      });

      test('should not export other user keys', async () => {
        const otherUser = testData.users.find(u => u.partyType === 'TSP');
        const otherUserKey = testData.keys.find(k => k.userId === otherUser.id);

        const response = await request(app)
          .get(`/api/signing/keys/${otherUserKey.id}/export`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Key not found');
      });
    });
  });

  describe('Contract Signing Endpoints', () => {
    describe('POST /api/signing/sign', () => {
      test('should sign contract successfully', async () => {
        const contractHash = generateTestHash(testContract.contractId);
        
        const response = await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id,
            keyId: testKey.id,
            signatureData: { contractHash }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.signature).toBeDefined();
        expect(response.body.signature.scittClaimId).toBeDefined();
        expect(response.body.signature.signature).toBeDefined();
        expect(response.body.signature.algorithm).toBe(testKey.keyType);
        expect(response.body.signature.contractHash).toBe(contractHash);
        expect(response.body.signature.scittReceipt).toBeDefined();

        // Verify SCITT CCF claim was created
        const claim = await ScittClaim.findOne({
          where: { claimId: response.body.signature.scittClaimId }
        });
        expect(claim).toBeDefined();
        expect(claim.claimType).toBe('contract_signature');
        expect(claim.contractId).toBe(testContract.contractId);
      });

      test('should not allow signing same contract twice', async () => {
        const contractHash = generateTestHash(testContract.contractId);
        
        // First signature
        await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id,
            keyId: testKey.id,
            signatureData: { contractHash }
          })
          .expect(200);

        // Second signature should fail
        const response = await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id,
            keyId: testKey.id,
            signatureData: { contractHash }
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Contract already signed by this user');
      });

      test('should not allow unauthorized user to sign', async () => {
        const otherUser = testData.users.find(u => u.partyType === 'TDP');
        const otherUserToken = await generateAuthToken(otherUser);
        const contractHash = generateTestHash(testContract.contractId);
        
        const response = await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({
            contractId: testContract.id,
            keyId: testKey.id,
            signatureData: { contractHash }
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Not authorized to sign this contract');
      });

      test('should require valid key', async () => {
        const contractHash = generateTestHash(testContract.contractId);
        
        const response = await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id,
            keyId: 99999, // Non-existent key ID
            signatureData: { contractHash }
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Signing key not found or inactive');
      });

      test('should require all required fields', async () => {
        const response = await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id
            // Missing keyId and signatureData
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Missing required fields');
      });
    });

    describe('POST /api/signing/verify', () => {
      test('should verify signature successfully', async () => {
        // First create a signature
        const contractHash = generateTestHash(testContract.contractId);
        const signResponse = await request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id,
            keyId: testKey.id,
            signatureData: { contractHash }
          })
          .expect(200);

        const scittClaimId = signResponse.body.signature.scittClaimId;

        // Now verify the signature
        const response = await request(app)
          .post('/api/signing/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            scittClaimId,
            contractId: testContract.contractId
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.verified).toBeDefined();
        expect(response.body.verification).toBeDefined();
        expect(response.body.verification.cryptographicValid).toBeDefined();
        expect(response.body.verification.scittValid).toBeDefined();
        expect(response.body.verification.overallValid).toBeDefined();
      });

      test('should handle non-existent signature', async () => {
        const response = await request(app)
          .post('/api/signing/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            scittClaimId: 'NON_EXISTENT_CLAIM',
            contractId: testContract.contractId
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Signature claim not found');
      });
    });

    describe('GET /api/signing/contracts/:contractId/signatures', () => {
      test('should get contract signatures', async () => {
        const response = await request(app)
          .get(`/api/signing/contracts/${testContract.id}/signatures`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.signatures).toBeDefined();
        expect(Array.isArray(response.body.signatures)).toBe(true);
        expect(response.body.total).toBeDefined();
      });

      test('should not allow unauthorized access', async () => {
        const otherUser = testData.users.find(u => u.partyType === 'TDP');
        const otherUserToken = await generateAuthToken(otherUser);
        
        const response = await request(app)
          .get(`/api/signing/contracts/${testContract.id}/signatures`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Not authorized to view contract signatures');
      });

      test('should handle non-existent contract', async () => {
        const response = await request(app)
          .get('/api/signing/contracts/99999/signatures')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Contract not found');
      });
    });
  });

  describe('Signing Events Endpoints', () => {
    describe('GET /api/signing/events', () => {
      test('should get signing events for admin', async () => {
        const adminUser = testData.users.find(u => u.partyType === 'AppAdmin');
        const adminToken = await generateAuthToken(adminUser);
        
        const response = await request(app)
          .get('/api/signing/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.events).toBeDefined();
        expect(Array.isArray(response.body.events)).toBe(true);
        expect(response.body.total).toBeDefined();
      });

      test('should not allow non-admin access', async () => {
        const response = await request(app)
          .get('/api/signing/events')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Admin access required');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const originalFindByPk = Contract.findByPk;
      Contract.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash: 'test' }
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to sign contract');

      // Restore original function
      Contract.findByPk = originalFindByPk;
    });

    test('should handle SCITT CCF service errors', async () => {
      // Mock SCITT CCF service error
      const scittCcfService = require('../../services/scittCcfService');
      const originalSubmitClaim = scittCcfService.submitClaim;
      scittCcfService.submitClaim = jest.fn().mockRejectedValue(new Error('SCITT CCF error'));

      const response = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash: 'test' }
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to sign contract');

      // Restore original function
      scittCcfService.submitClaim = originalSubmitClaim;
    });
  });

  describe('Performance Tests', () => {
    test('should sign contract within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash: 'test' }
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      expect(response.body.success).toBe(true);
    });

    test('should verify signature within reasonable time', async () => {
      // First create a signature
      const signResponse = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash: 'test' }
        })
        .expect(200);

      const scittClaimId = signResponse.body.signature.scittClaimId;

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/signing/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scittClaimId,
          contractId: testContract.contractId
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(response.body.success).toBe(true);
    });
  });
});

// Helper functions
async function generateAuthToken(user) {
  // This would typically use your actual auth service
  // For testing, we'll create a mock token
  return `mock-token-${user.id}`;
}

function generateTestHash(data) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}
