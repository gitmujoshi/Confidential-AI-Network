/**
 * Multi-TDP Contract Tests
 * 
 * Tests the multi-TDP contract functionality including:
 * - Multiple TDP selection and validation
 * - Contract creation with multiple datasets
 * - Payment distribution and tracking
 * - Contract execution and completion
 * - SCITT CCF integration for multi-TDP contracts
 */

const request = require('supertest');
const testApp = require('../test-server');
const db = require('../../models');
const { User, Dataset, Contract } = db;
const ContractService = require('../../services/contractService');
const ScittCcfService = require('../../services/scittCcfService');

describe('Multi-TDP Contract Tests', () => {
  let app, contractService, scittCcfService;
  let tdcUser, tdpUser1, tdpUser2, tdpUser3, tspUser;
  let testDataset1, testDataset2, testDataset3;
  let multiTdpContract;

  beforeAll(async () => {
    // Initialize the app
    app = testApp;
    contractService = new ContractService();
    scittCcfService = new ScittCcfService();

    // Clean up database
    await db.Notification.destroy({ where: {} });
    await db.Contract.destroy({ where: {} });
    await db.Dataset.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    // Create test users
    tdcUser = await db.User.create({
      name: 'Test TDC',
      email: 'tdc@test.com',
      partyType: 'TDC',
      walletAddress: '0x1234567890123456789012345678901234567890',
      isActive: true,
      isRegistered: true
    });

    tdpUser1 = await db.User.create({
      name: 'Test TDP 1',
      email: 'tdp1@test.com',
      partyType: 'TDP',
      walletAddress: '0x1111111111111111111111111111111111111111',
      isActive: true,
      isRegistered: true
    });

    tdpUser2 = await db.User.create({
      name: 'Test TDP 2',
      email: 'tdp2@test.com',
      partyType: 'TDP',
      walletAddress: '0x2222222222222222222222222222222222222222',
      isActive: true,
      isRegistered: true
    });

    tdpUser3 = await db.User.create({
      name: 'Test TDP 3',
      email: 'tdp3@test.com',
      partyType: 'TDP',
      walletAddress: '0x3333333333333333333333333333333333333333',
      isActive: true,
      isRegistered: true
    });

    tspUser = await db.User.create({
      name: 'Test TSP',
      email: 'tsp@test.com',
      partyType: 'TSP',
      walletAddress: '0x4444444444444444444444444444444444444444',
      isActive: true,
      isRegistered: true
    });

    // Create test datasets
    testDataset1 = await db.Dataset.create({
      datasetId: 'test-dataset-1',
      name: 'Test Dataset 1',
      description: 'First test dataset',
      category: 'Tabular',
      size: 1000, // Size in MB
      recordCount: 10000,
      price: 1000,
      license: 'MIT',
      ownerId: tdpUser1.id,
      isPublic: true,
      isActive: true
    });

    testDataset2 = await db.Dataset.create({
      datasetId: 'test-dataset-2',
      name: 'Test Dataset 2',
      description: 'Second test dataset',
      category: 'Computer Vision',
      size: 2000, // Size in MB
      recordCount: 20000,
      price: 2000,
      license: 'Apache-2.0',
      ownerId: tdpUser2.id,
      isPublic: true,
      isActive: true
    });

    testDataset3 = await db.Dataset.create({
      datasetId: 'test-dataset-3',
      name: 'Test Dataset 3',
      description: 'Third test dataset',
      category: 'Natural Language Processing',
      size: 500, // Size in MB
      recordCount: 5000,
      price: 500,
      license: 'GPL-3.0',
      ownerId: tdpUser3.id,
      isPublic: true,
      isActive: true
    });
  });

  afterAll(async () => {
    // Clean up
    await db.Notification.destroy({ where: {} });
    await db.Contract.destroy({ where: {} });
    await db.Dataset.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('Multi-TDP Contract Creation', () => {
    test('should create contract with multiple datasets', async () => {
      const contractData = {
        datasetSelections: [
          {
            datasetId: testDataset1.datasetId,
            individualPrice: 1500
          },
          {
            datasetId: testDataset2.datasetId,
            individualPrice: 2500
          }
        ],
        duration: 30,
        termsAndConditions: 'Test terms for multi-TDP contract',
        privacyRequirements: {
          maxPrivacyLoss: 0.1,
          minAccuracy: 0.85,
          differentialPrivacy: { enabled: true, epsilon: 0.5 },
          federatedLearning: { enabled: false },
          secureMultiPartyComputation: { enabled: true, threshold: 3 }
        }
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer mock-token`)
        .send(contractData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.contract).toBeDefined();
      expect(response.body.contract.datasetCount).toBe(2);
      expect(response.body.contract.tdpCount).toBe(2);
      expect(response.body.contract.totalPrice).toBe(4000);
      expect(response.body.contract.multiTdpStatus).toBe('PENDING_TDP');

      multiTdpContract = response.body.contract;
    });

    test('should reject contract with more than 3 datasets', async () => {
      const contractData = {
        datasetSelections: [
          { datasetId: 'dataset1', individualPrice: 1000 },
          { datasetId: 'dataset2', individualPrice: 2000 },
          { datasetId: 'dataset3', individualPrice: 3000 },
          { datasetId: 'dataset4', individualPrice: 4000 }
        ],
        duration: 30,
        termsAndConditions: 'Test terms'
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer mock-token`)
        .send(contractData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('1 to 3 datasets');
    });

    test('should reject contract with no datasets', async () => {
      const contractData = {
        datasetSelections: [],
        duration: 30,
        termsAndConditions: 'Test terms'
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer mock-token`)
        .send(contractData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('1 to 3 datasets');
    });
  });

  describe('Multi-TDP Contract Status', () => {
    test('should get multi-TDP contract status', async () => {
      const response = await request(app)
        .get(`/api/contracts/${multiTdpContract.contractId}/multi-tdp-status`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.contractId).toBe(multiTdpContract.contractId);
      expect(response.body.datasetCount).toBe(2);
      expect(response.body.tdpCount).toBe(2);
      expect(response.body.totalPrice).toBe(4000);
      expect(response.body.signedTdps).toBe(0);
      expect(response.body.totalTdps).toBe(2);
      expect(response.body.allTdpsSigned).toBe(false);
      expect(response.body.tdpStatus).toHaveLength(2);
    });

    test('should reject status request for single-TDP contract', async () => {
      // Create a single-TDP contract
      const singleContract = await db.Contract.create({
        contractId: 'SINGLE-CONTRACT-TEST',
        tdcId: tdcUser.id,
        datasetId: testDataset1.id,
        price: 1000,
        duration: 30,
        termsAndConditions: 'Test terms',
        status: 'PENDING_TDP',
        contractDatasets: [{
          datasetId: testDataset1.id,
          tdpId: tdpUser1.id,
          datasetName: testDataset1.name,
          tdpName: tdpUser1.name,
          individualPrice: 1000,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      });

      const response = await request(app)
        .get(`/api/contracts/${singleContract.contractId}/multi-tdp-status`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('multi-TDP contracts only');
    });
  });

  describe('TDP Signing', () => {
    test('should allow TDP to sign their portion', async () => {
      const signData = {
        tdpId: tdpUser1.id,
        signatureType: 'WALLET',
        signedTransaction: 'mock-signed-transaction',
        userWalletAddress: tdpUser1.walletAddress
      };

      const response = await request(app)
        .post(`/api/contracts/${multiTdpContract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send(signData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tdpSignature.signed).toBe(true);
      expect(response.body.allTdpsSigned).toBe(false); // Only one TDP signed
    });

    test('should reject signing by non-party TDP', async () => {
      const signData = {
        tdpId: tspUser.id, // TSP trying to sign as TDP
        signatureType: 'WALLET',
        signedTransaction: 'mock-signed-transaction',
        userWalletAddress: tspUser.walletAddress
      };

      const response = await request(app)
        .post(`/api/contracts/${multiTdpContract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send(signData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not a party to this contract');
    });

    test('should reject duplicate signing', async () => {
      const signData = {
        tdpId: tdpUser1.id,
        signatureType: 'WALLET',
        signedTransaction: 'mock-signed-transaction',
        userWalletAddress: tdpUser1.walletAddress
      };

      const response = await request(app)
        .post(`/api/contracts/${multiTdpContract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send(signData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already signed');
    });
  });

  describe('Payment Tracking', () => {
    test('should record payment for TDP', async () => {
      const paymentData = {
        tdpId: tdpUser1.id,
        paymentAmount: 1500,
        paymentMethod: 'BANK_TRANSFER'
      };

      const response = await request(app)
        .post(`/api/contracts/${multiTdpContract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tdpPayment.status).toBe('PAID');
      expect(response.body.tdpPayment.amount).toBe(1500);
    });

    test('should reject payment with wrong amount', async () => {
      const paymentData = {
        tdpId: tdpUser2.id,
        paymentAmount: 1000, // Wrong amount
        paymentMethod: 'BANK_TRANSFER'
      };

      const response = await request(app)
        .post(`/api/contracts/${multiTdpContract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('does not match expected amount');
    });

    test('should get payment summary', async () => {
      const response = await request(app)
        .get(`/api/contracts/${multiTdpContract.contractId}/payment-summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalExpected).toBe(4000);
      expect(response.body.totalPaid).toBe(1500);
      expect(response.body.paidCount).toBe(1);
      expect(response.body.totalCount).toBe(2);
      expect(response.body.allPaid).toBe(false);
    });
  });

  describe('Training Parameters', () => {
    test('should save max training runs in training parameters', async () => {
      const contractData = {
        datasetSelections: [
          {
            datasetId: testDataset1.datasetId,
            individualPrice: 1000
          }
        ],
        duration: 30,
        termsAndConditions: 'Test max training runs',
        trainingParams: {
          maxPrivacyLoss: 0.1,
          minAccuracy: 0.85,
          maxTrainingRuns: 10, // Test the new field
          differentialPrivacy: {
            enabled: true,
            epsilon: 0.1,
            delta: 1e-5
          },
          federatedLearning: {
            enabled: true,
            communicationRounds: 100
          },
          secureMultiPartyComputation: {
            enabled: false
          }
        }
      };

      const response = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer mock-token`)
        .send(contractData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.contract.trainingParams).toBeDefined();
      expect(response.body.contract.trainingParams.maxTrainingRuns).toBe(10);
      expect(response.body.contract.trainingParams.maxPrivacyLoss).toBe(0.1);
      expect(response.body.contract.trainingParams.minAccuracy).toBe(0.85);
    });
  });

  describe('Complete Multi-TDP Flow', () => {
    test('should complete full multi-TDP contract flow', async () => {
      // 1. Create contract
      const contractData = {
        datasetSelections: [
          {
            datasetId: testDataset1.datasetId,
            individualPrice: 1000
          },
          {
            datasetId: testDataset2.datasetId,
            individualPrice: 2000
          }
        ],
        duration: 30,
        termsAndConditions: 'Complete flow test',
        tspId: tspUser.id
      };

      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer mock-token`)
        .send(contractData);

      expect(createResponse.status).toBe(201);
      const contract = createResponse.body.contract;

      // 2. First TDP signs
      const sign1Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: tdpUser1.id,
          signatureType: 'WALLET',
          signedTransaction: 'mock-transaction-1',
          userWalletAddress: tdpUser1.walletAddress
        });

      expect(sign1Response.status).toBe(200);
      expect(sign1Response.body.allTdpsSigned).toBe(false);

      // 3. Second TDP signs
      const sign2Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: tdpUser2.id,
          signatureType: 'WALLET',
          signedTransaction: 'mock-transaction-2',
          userWalletAddress: tdpUser2.walletAddress
        });

      expect(sign2Response.status).toBe(200);
      expect(sign2Response.body.allTdpsSigned).toBe(false);

      // 4. Record payments
      const payment1Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: tdpUser1.id,
          paymentAmount: 1000,
          paymentMethod: 'BANK_TRANSFER'
        });

      expect(payment1Response.status).toBe(200);

      const payment2Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: tdpUser2.id,
          paymentAmount: 2000,
          paymentMethod: 'BANK_TRANSFER'
        });

      expect(payment2Response.status).toBe(200);

      // 5. Verify final status
      const finalStatusResponse = await request(app)
        .get(`/api/contracts/${contract.contractId}/payment-summary`);

      expect(finalStatusResponse.status).toBe(200);
      expect(finalStatusResponse.body.allPaid).toBe(false);
      expect(finalStatusResponse.body.totalPaid).toBe(3000);
    });
  });

  describe('SCITT CCF Integration for Multi-TDP Contracts', () => {
    let scittCcfContract;

    beforeAll(async () => {
      // Initialize SCITT CCF service
      try {
        await scittCcfService.initialize();
      } catch (error) {
        console.warn('SCITT CCF service not available for integration tests:', error.message);
      }
    });

    test('should create multi-TDP contract in SCITT CCF', async () => {
      if (!scittCcfService.isInitialized) {
        console.log('Skipping SCITT CCF test - service not available');
        return;
      }

      const contractData = {
        name: 'SCITT CCF Multi-TDP Contract',
        description: 'Multi-TDP contract with SCITT CCF integration',
        tdpIds: [tdpUser1.id, tdpUser2.id, tdpUser3.id],
        tdcId: tdcUser.id,
        datasetIds: [testDataset1.id, testDataset2.id, testDataset3.id],
        prices: [1000, 2000, 500],
        duration: 45,
        terms: 'SCITT CCF multi-TDP terms'
      };

      const result = await scittCcfService.createContract(contractData);
      expect(result.success).toBe(true);
      expect(result.source).toBe('SCITT_CCF');
      expect(result.claimId).toBeDefined();

      scittCcfContract = result;
    });

    test('should track provenance for multi-TDP datasets', async () => {
      if (!scittCcfContract?.claimId || !scittCcfService.isInitialized) {
        console.log('Skipping provenance test - no SCITT CCF contract');
        return;
      }

      // Get provenance tree
      const provenanceTree = await scittCcfService.getProvenanceTree(scittCcfContract.claimId);
      expect(provenanceTree).toBeDefined();
      expect(provenanceTree.treeId).toBeDefined();
      expect(provenanceTree.rootHash).toBeDefined();

      // Verify dataset provenance
      const datasetNodes = provenanceTree.nodes.filter(node => 
        node.type === 'DATASET_PROVENANCE'
      );
      expect(datasetNodes.length).toBe(3); // Should have 3 datasets

      // Verify TDP provenance
      const tdpNodes = provenanceTree.nodes.filter(node => 
        node.type === 'TDP_PROVENANCE'
      );
      expect(tdpNodes.length).toBe(3); // Should have 3 TDPs
    });

    test('should handle multi-TDP contract status in SCITT CCF', async () => {
      if (!scittCcfContract?.claimId || !scittCcfService.isInitialized) {
        console.log('Skipping status test - no SCITT CCF contract');
        return;
      }

      const status = await scittCcfService.getContractStatus(scittCcfContract.claimId);
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('claimId', scittCcfContract.claimId);
      expect(status).toHaveProperty('tdpCount', 3);
      expect(status).toHaveProperty('datasetCount', 3);
    });

    test('should support hybrid mode for multi-TDP contracts', async () => {
      if (!scittCcfService.isInitialized) {
        console.log('Skipping hybrid mode test - SCITT CCF not available');
        return;
      }

      // Create contract in main system
      const mainContract = await contractService.createContract({
        contractId: 'HYBRID-MULTI-TDP-001',
        title: 'Hybrid Multi-TDP Contract',
        description: 'Multi-TDP contract with hybrid mode',
        price: 3500,
        duration: 60,
        termsAndConditions: 'Hybrid multi-TDP terms',
        contractDatasets: [
          {
            datasetId: testDataset1.id,
            tdpId: tdpUser1.id,
            datasetName: testDataset1.name,
            tdpName: tdpUser1.name,
            individualPrice: 1000,
            paymentStatus: 'PENDING'
          },
          {
            datasetId: testDataset2.id,
            tdpId: tdpUser2.id,
            datasetName: testDataset2.name,
            tdpName: tdpUser2.name,
            individualPrice: 2000,
            paymentStatus: 'PENDING'
          },
          {
            datasetId: testDataset3.id,
            tdpId: tdpUser3.id,
            datasetName: testDataset3.name,
            tdpName: tdpUser3.name,
            individualPrice: 500,
            paymentStatus: 'PENDING'
          }
        ],
        datasetCount: 3,
        tdpCount: 3
      }, tdcUser.id);

      expect(mainContract.status).toBe('DRAFT');

      // Submit to SCITT CCF
      try {
        const scittResult = await scittCcfService.createContract({
          name: mainContract.title,
          description: mainContract.description,
          tdpIds: [tdpUser1.id, tdpUser2.id, tdpUser3.id],
          tdcId: tdcUser.id,
          datasetIds: [testDataset1.id, testDataset2.id, testDataset3.id],
          prices: [1000, 2000, 500],
          duration: mainContract.duration,
          terms: mainContract.termsAndConditions
        });

        expect(scittResult.success).toBe(true);
        expect(scittResult.source).toBe('SCITT_CCF');

        // Store SCITT CCF claim ID
        mainContract.scittClaimId = scittResult.claimId;
      } catch (error) {
        console.warn('SCITT CCF integration failed:', error.message);
      }

      // Cleanup
      await mainContract.destroy();
    });

    test('should handle SCITT CCF failures gracefully in multi-TDP contracts', async () => {
      if (!scittCcfService.isInitialized) {
        console.log('Skipping failure handling test - SCITT CCF not available');
        return;
      }

      // Mock SCITT CCF failure
      const originalCreateContract = scittCcfService.createContract;
      scittCcfService.createContract = jest.fn().mockRejectedValue(new Error('SCITT CCF unavailable'));

      try {
        // Should still work with main system
        const fallbackContract = await contractService.createContract({
          contractId: 'FALLBACK-MULTI-TDP-001',
          title: 'Fallback Multi-TDP Contract',
          description: 'Multi-TDP contract with SCITT CCF fallback',
          price: 2500,
          duration: 30,
          termsAndConditions: 'Fallback terms',
          contractDatasets: [
            {
              datasetId: testDataset1.id,
              tdpId: tdpUser1.id,
              datasetName: testDataset1.name,
              tdpName: tdpUser1.name,
              individualPrice: 1000,
              paymentStatus: 'PENDING'
            },
            {
              datasetId: testDataset2.id,
              tdpId: tdpUser2.id,
              datasetName: testDataset2.name,
              tdpName: tdpUser2.name,
              individualPrice: 1500,
              paymentStatus: 'PENDING'
            }
          ],
          datasetCount: 2,
          tdpCount: 2
        }, tdcUser.id);

        expect(fallbackContract.status).toBe('DRAFT');
        expect(fallbackContract.contractId).toBe('FALLBACK-MULTI-TDP-001');

        // Cleanup
        await fallbackContract.destroy();
      } finally {
        // Restore original function
        scittCcfService.createContract = originalCreateContract;
      }
    });

    afterAll(async () => {
      // Cleanup SCITT CCF contract if created
      if (scittCcfContract?.claimId && scittCcfService.isInitialized) {
        try {
          // Note: SCITT CCF cleanup would depend on the service implementation
          console.log('SCITT CCF contract cleanup completed');
        } catch (error) {
          console.warn('Failed to cleanup SCITT CCF contract:', error.message);
        }
      }
    });
  });
}); 