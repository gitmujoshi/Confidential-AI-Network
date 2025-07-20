const request = require('supertest');
const app = require('../test-server');
const db = require('../models');

describe('Multi-TDP Contract Tests', () => {
  let testUsers = {};
  let testDatasets = {};
  let testContract = null;

  beforeAll(async () => {
    // Clean up database
    await db.Notification.destroy({ where: {} });
    await db.Contract.destroy({ where: {} });
    await db.Dataset.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    // Create test users
    testUsers.tdc = await db.User.create({
      name: 'Test TDC',
      email: 'tdc@test.com',
      partyType: 'TDC',
      walletAddress: '0x1234567890123456789012345678901234567890',
      isActive: true,
      isRegistered: true
    });

    testUsers.tdp1 = await db.User.create({
      name: 'Test TDP 1',
      email: 'tdp1@test.com',
      partyType: 'TDP',
      walletAddress: '0x1111111111111111111111111111111111111111',
      isActive: true,
      isRegistered: true
    });

    testUsers.tdp2 = await db.User.create({
      name: 'Test TDP 2',
      email: 'tdp2@test.com',
      partyType: 'TDP',
      walletAddress: '0x2222222222222222222222222222222222222222',
      isActive: true,
      isRegistered: true
    });

    testUsers.ccrp = await db.User.create({
      name: 'Test CCRP',
      email: 'ccrp@test.com',
      partyType: 'CCRP',
      walletAddress: '0x3333333333333333333333333333333333333333',
      isActive: true,
      isRegistered: true
    });

    // Create test datasets
    testDatasets.dataset1 = await db.Dataset.create({
      datasetId: 'test-dataset-1',
      name: 'Test Dataset 1',
      description: 'First test dataset',
      category: 'Tabular',
      size: 1000, // Size in MB
      recordCount: 10000,
      price: 1000,
      license: 'MIT',
      ownerId: testUsers.tdp1.id,
      isPublic: true,
      isActive: true
    });

    testDatasets.dataset2 = await db.Dataset.create({
      datasetId: 'test-dataset-2',
      name: 'Test Dataset 2',
      description: 'Second test dataset',
      category: 'Computer Vision',
      size: 2000, // Size in MB
      recordCount: 20000,
      price: 2000,
      license: 'Apache-2.0',
      ownerId: testUsers.tdp2.id,
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
    await db.sequelize.close();
  });

  describe('Multi-TDP Contract Creation', () => {
    test('should create contract with multiple datasets', async () => {
      const contractData = {
        datasetSelections: [
          {
            datasetId: testDatasets.dataset1.datasetId,
            individualPrice: 1500
          },
          {
            datasetId: testDatasets.dataset2.datasetId,
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

      testContract = response.body.contract;
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
        .get(`/api/contracts/${testContract.contractId}/multi-tdp-status`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.contractId).toBe(testContract.contractId);
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
        tdcId: testUsers.tdc.id,
        datasetId: testDatasets.dataset1.id,
        price: 1000,
        duration: 30,
        termsAndConditions: 'Test terms',
        status: 'PENDING_TDP',
        contractDatasets: [{
          datasetId: testDatasets.dataset1.id,
          tdpId: testUsers.tdp1.id,
          datasetName: testDatasets.dataset1.name,
          tdpName: testUsers.tdp1.name,
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
        tdpId: testUsers.tdp1.id,
        signatureType: 'WALLET',
        signedTransaction: 'mock-signed-transaction',
        userWalletAddress: testUsers.tdp1.walletAddress
      };

      const response = await request(app)
        .post(`/api/contracts/${testContract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send(signData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tdpSignature.signed).toBe(true);
      expect(response.body.allTdpsSigned).toBe(false); // Only one TDP signed
    });

    test('should reject signing by non-party TDP', async () => {
      const signData = {
        tdpId: testUsers.ccrp.id, // CCRP trying to sign as TDP
        signatureType: 'WALLET',
        signedTransaction: 'mock-signed-transaction',
        userWalletAddress: testUsers.ccrp.walletAddress
      };

      const response = await request(app)
        .post(`/api/contracts/${testContract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send(signData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not a party to this contract');
    });

    test('should reject duplicate signing', async () => {
      const signData = {
        tdpId: testUsers.tdp1.id,
        signatureType: 'WALLET',
        signedTransaction: 'mock-signed-transaction',
        userWalletAddress: testUsers.tdp1.walletAddress
      };

      const response = await request(app)
        .post(`/api/contracts/${testContract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send(signData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already signed');
    });
  });

  describe('Payment Tracking', () => {
    test('should record payment for TDP', async () => {
      const paymentData = {
        tdpId: testUsers.tdp1.id,
        paymentAmount: 1500,
        paymentMethod: 'BANK_TRANSFER'
      };

      const response = await request(app)
        .post(`/api/contracts/${testContract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tdpPayment.status).toBe('PAID');
      expect(response.body.tdpPayment.amount).toBe(1500);
    });

    test('should reject payment with wrong amount', async () => {
      const paymentData = {
        tdpId: testUsers.tdp2.id,
        paymentAmount: 1000, // Wrong amount
        paymentMethod: 'BANK_TRANSFER'
      };

      const response = await request(app)
        .post(`/api/contracts/${testContract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('does not match expected amount');
    });

    test('should get payment summary', async () => {
      const response = await request(app)
        .get(`/api/contracts/${testContract.contractId}/payment-summary`);

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
            datasetId: testDatasets.dataset1.datasetId,
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
            datasetId: testDatasets.dataset1.datasetId,
            individualPrice: 1000
          },
          {
            datasetId: testDatasets.dataset2.datasetId,
            individualPrice: 2000
          }
        ],
        duration: 30,
        termsAndConditions: 'Complete flow test',
        ccrpId: testUsers.ccrp.id
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
          tdpId: testUsers.tdp1.id,
          signatureType: 'WALLET',
          signedTransaction: 'mock-transaction-1',
          userWalletAddress: testUsers.tdp1.walletAddress
        });

      expect(sign1Response.status).toBe(200);
      expect(sign1Response.body.allTdpsSigned).toBe(false);

      // 3. Second TDP signs
      const sign2Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-sign`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: testUsers.tdp2.id,
          signatureType: 'WALLET',
          signedTransaction: 'mock-transaction-2',
          userWalletAddress: testUsers.tdp2.walletAddress
        });

      expect(sign2Response.status).toBe(200);
      expect(sign2Response.body.allTdpsSigned).toBe(true);

      // 4. Record payments
      const payment1Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: testUsers.tdp1.id,
          paymentAmount: 1000,
          paymentMethod: 'BANK_TRANSFER'
        });

      expect(payment1Response.status).toBe(200);

      const payment2Response = await request(app)
        .post(`/api/contracts/${contract.contractId}/tdp-payment`)
        .set('Authorization', `Bearer mock-token`)
        .send({
          tdpId: testUsers.tdp2.id,
          paymentAmount: 2000,
          paymentMethod: 'BANK_TRANSFER'
        });

      expect(payment2Response.status).toBe(200);

      // 5. Verify final status
      const finalStatusResponse = await request(app)
        .get(`/api/contracts/${contract.contractId}/payment-summary`);

      expect(finalStatusResponse.status).toBe(200);
      expect(finalStatusResponse.body.allPaid).toBe(true);
      expect(finalStatusResponse.body.totalPaid).toBe(3000);
    });
  });
}); 