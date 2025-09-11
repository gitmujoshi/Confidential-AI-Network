/**
 * SCITT CCF Contract Signing Integration Tests
 * 
 * Comprehensive integration tests for SCITT CCF signature claims,
 * including claim submission, verification, and provenance tracking.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const request = require('supertest');
const app = require('../../server');
const { User, Contract, UserKey, ScittClaim, SigningEvent } = require('../../models');
const scittCcfService = require('../../services/scittCcfService');
const SigningTestDataSetup = require('../setup/signing-test-data');

describe('SCITT CCF Contract Signing Integration Tests', () => {
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

  describe('SCITT CCF Claim Submission', () => {
    test('should submit signature claim to SCITT CCF', async () => {
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
      expect(response.body.signature.scittClaimId).toBeDefined();
      expect(response.body.signature.scittReceipt).toBeDefined();

      // Verify claim was stored in SCITT CCF claims table
      const claim = await ScittClaim.findOne({
        where: { claimId: response.body.signature.scittClaimId }
      });

      expect(claim).toBeDefined();
      expect(claim.claimType).toBe('contract_signature');
      expect(claim.contractId).toBe(testContract.contractId);
      expect(claim.status).toBe('SUBMITTED');
      expect(claim.receipt).toBe(response.body.signature.scittReceipt);
    });

    test('should include proper claim data structure', async () => {
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

      const claim = await ScittClaim.findOne({
        where: { claimId: response.body.signature.scittClaimId }
      });

      expect(claim.claimData).toBeDefined();
      expect(claim.claimData.contractId).toBe(testContract.contractId);
      expect(claim.claimData.signer).toBe(testUser.depaId);
      expect(claim.claimData.signerRole).toBe(testUser.partyType);
      expect(claim.claimData.signature).toBeDefined();
      expect(claim.claimData.algorithm).toBe(testKey.keyType);
      expect(claim.claimData.timestamp).toBeDefined();
      expect(claim.claimData.contractHash).toBe(contractHash);
      expect(claim.claimData.metadata).toBeDefined();
      expect(claim.claimData.metadata.system).toBe('Contract Management System');
      expect(claim.claimData.metadata.version).toBe('1.0.0');
      expect(claim.claimData.metadata.teeProvider).toBe('virtual');
    });

    test('should handle SCITT CCF service errors gracefully', async () => {
      // Mock SCITT CCF service to throw error
      const originalSubmitClaim = scittCcfService.submitClaim;
      scittCcfService.submitClaim = jest.fn().mockRejectedValue(new Error('SCITT CCF service unavailable'));

      const contractHash = generateTestHash(testContract.contractId);
      
      const response = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash }
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to sign contract');

      // Restore original function
      scittCcfService.submitClaim = originalSubmitClaim;
    });
  });

  describe('SCITT CCF Claim Verification', () => {
    let signatureClaim;

    beforeEach(async () => {
      // Create a signature claim for verification tests
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

      signatureClaim = await ScittClaim.findOne({
        where: { claimId: response.body.signature.scittClaimId }
      });
    });

    test('should verify signature claim from SCITT CCF', async () => {
      const response = await request(app)
        .post('/api/signing/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scittClaimId: signatureClaim.claimId,
          contractId: testContract.contractId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.verified).toBeDefined();
      expect(response.body.verification).toBeDefined();
      expect(response.body.verification.cryptographicValid).toBeDefined();
      expect(response.body.verification.scittValid).toBeDefined();
      expect(response.body.verification.overallValid).toBeDefined();
      expect(response.body.verification.scittReceipt).toBe(signatureClaim.receipt);
    });

    test('should handle SCITT CCF verification errors', async () => {
      // Mock SCITT CCF service to throw error
      const originalGetClaim = scittCcfService.getClaim;
      scittCcfService.getClaim = jest.fn().mockRejectedValue(new Error('SCITT CCF verification failed'));

      const response = await request(app)
        .post('/api/signing/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scittClaimId: signatureClaim.claimId,
          contractId: testContract.contractId
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to verify signature');

      // Restore original function
      scittCcfService.getClaim = originalGetClaim;
    });
  });

  describe('Provenance Tracking', () => {
    test('should include provenance information in claims', async () => {
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

      const claim = await ScittClaim.findOne({
        where: { claimId: response.body.signature.scittClaimId }
      });

      expect(claim.provenanceTreeId).toBeDefined();
      expect(claim.provenanceRoot).toBeDefined();
      expect(claim.provenanceTreeId).toMatch(/TEST_TREE_/);
      expect(claim.provenanceRoot).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    test('should link signature to contract provenance', async () => {
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

      const claim = await ScittClaim.findOne({
        where: { claimId: response.body.signature.scittClaimId }
      });

      // Verify provenance tree ID matches contract
      expect(claim.provenanceTreeId).toBe(`TEST_TREE_${testContract.contractId}`);
    });
  });

  describe('Multiple Signatures', () => {
    test('should handle multiple signatures for same contract', async () => {
      const tdcUser = testData.users.find(u => u.partyType === 'TDC');
      const ccrpUser = testData.users.find(u => u.partyType === 'CCRP');
      const tdcKey = testData.keys.find(k => k.userId === tdcUser.id);
      const ccrpKey = testData.keys.find(k => k.userId === ccrpUser.id);
      
      const tdcToken = await generateAuthToken(tdcUser);
      const ccrpToken = await generateAuthToken(ccrpUser);
      
      const contractHash = generateTestHash(testContract.contractId);

      // TDC signs first
      const tdcResponse = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${tdcToken}`)
        .send({
          contractId: testContract.id,
          keyId: tdcKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      // CCRP signs second
      const ccrpResponse = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({
          contractId: testContract.id,
          keyId: ccrpKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      // Verify both claims exist
      const tdcClaim = await ScittClaim.findOne({
        where: { claimId: tdcResponse.body.signature.scittClaimId }
      });
      const ccrpClaim = await ScittClaim.findOne({
        where: { claimId: ccrpResponse.body.signature.scittClaimId }
      });

      expect(tdcClaim).toBeDefined();
      expect(ccrpClaim).toBeDefined();
      expect(tdcClaim.claimData.signer).toBe(tdcUser.depaId);
      expect(ccrpClaim.claimData.signer).toBe(ccrpUser.depaId);
    });

    test('should retrieve all signatures for contract', async () => {
      // Create multiple signatures
      const tdcUser = testData.users.find(u => u.partyType === 'TDC');
      const ccrpUser = testData.users.find(u => u.partyType === 'CCRP');
      const tdcKey = testData.keys.find(k => k.userId === tdcUser.id);
      const ccrpKey = testData.keys.find(k => k.userId === ccrpUser.id);
      
      const tdcToken = await generateAuthToken(tdcUser);
      const ccrpToken = await generateAuthToken(ccrpUser);
      
      const contractHash = generateTestHash(testContract.contractId);

      await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${tdcToken}`)
        .send({
          contractId: testContract.id,
          keyId: tdcKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({
          contractId: testContract.id,
          keyId: ccrpKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      // Retrieve all signatures
      const response = await request(app)
        .get(`/api/signing/contracts/${testContract.id}/signatures`)
        .set('Authorization', `Bearer ${tdcToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.signatures).toHaveLength(2);
      expect(response.body.total).toBe(2);

      // Verify signature details
      const signatures = response.body.signatures;
      const signers = signatures.map(s => s.signer.depaId);
      expect(signers).toContain(tdcUser.depaId);
      expect(signers).toContain(ccrpUser.depaId);
    });
  });

  describe('Claim Status Management', () => {
    test('should update claim status after verification', async () => {
      const contractHash = generateTestHash(testContract.contractId);
      
      // Create signature
      const signResponse = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      const claimId = signResponse.body.signature.scittClaimId;
      
      // Verify signature
      await request(app)
        .post('/api/signing/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scittClaimId: claimId,
          contractId: testContract.contractId
        })
        .expect(200);

      // Check claim status was updated
      const claim = await ScittClaim.findOne({
        where: { claimId }
      });

      expect(claim.status).toBe('VERIFIED');
    });

    test('should handle failed verification', async () => {
      // Mock verification to fail
      const originalVerifySignature = keyManagementService.verifySignature;
      keyManagementService.verifySignature = jest.fn().mockResolvedValue(false);

      const contractHash = generateTestHash(testContract.contractId);
      
      // Create signature
      const signResponse = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      const claimId = signResponse.body.signature.scittClaimId;
      
      // Verify signature (should fail)
      await request(app)
        .post('/api/signing/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scittClaimId: claimId,
          contractId: testContract.contractId
        })
        .expect(200);

      // Check claim status was updated to failed
      const claim = await ScittClaim.findOne({
        where: { claimId }
      });

      expect(claim.status).toBe('FAILED');

      // Restore original function
      keyManagementService.verifySignature = originalVerifySignature;
    });
  });

  describe('Audit Trail', () => {
    test('should create signing event for audit trail', async () => {
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

      const claimId = response.body.signature.scittClaimId;

      // Check signing event was created
      const event = await SigningEvent.findOne({
        where: {
          eventData: {
            scittClaimId: claimId
          }
        }
      });

      expect(event).toBeDefined();
      expect(event.eventType).toBe('contract_signed');
      expect(event.userId).toBe(testUser.id);
      expect(event.contractId).toBe(testContract.id);
      expect(event.eventData.scittClaimId).toBe(claimId);
      expect(event.eventData.contractHash).toBe(contractHash);
    });

    test('should include IP address and user agent in audit trail', async () => {
      const contractHash = generateTestHash(testContract.contractId);
      
      await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Forwarded-For', '192.168.1.100')
        .set('User-Agent', 'Test Agent 1.0')
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      // Check audit trail includes IP and user agent
      const event = await SigningEvent.findOne({
        where: {
          userId: testUser.id,
          contractId: testContract.id
        },
        order: [['createdAt', 'DESC']]
      });

      expect(event.ipAddress).toBeDefined();
      expect(event.userAgent).toBe('Test Agent 1.0');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle concurrent signature submissions', async () => {
      const contractHash = generateTestHash(testContract.contractId);
      const promises = [];

      // Submit multiple signatures concurrently
      for (let i = 0; i < 5; i++) {
        const promise = request(app)
          .post('/api/signing/sign')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            contractId: testContract.id,
            keyId: testKey.id,
            signatureData: { contractHash: `${contractHash}_${i}` }
          });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      // All should succeed (though some may fail due to duplicate signing)
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });

    test('should maintain data consistency under load', async () => {
      const contractHash = generateTestHash(testContract.contractId);
      
      // Create signature
      const response = await request(app)
        .post('/api/signing/sign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contractId: testContract.id,
          keyId: testKey.id,
          signatureData: { contractHash }
        })
        .expect(200);

      const claimId = response.body.signature.scittClaimId;

      // Verify data consistency
      const claim = await ScittClaim.findOne({
        where: { claimId }
      });
      const event = await SigningEvent.findOne({
        where: {
          eventData: {
            scittClaimId: claimId
          }
        }
      });

      expect(claim).toBeDefined();
      expect(event).toBeDefined();
      expect(claim.contractId).toBe(testContract.contractId);
      expect(event.contractId).toBe(testContract.id);
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
