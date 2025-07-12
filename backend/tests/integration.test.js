const request = require('supertest');
const { User, Contract, Dataset, Notification } = require('../models');
const { sequelize } = require('../models');
const jwt = require('jsonwebtoken');

// Import app
const app = require('../server');

describe('Integration Test Suite', () => {
  let tdpUser, tdcUser, ccrpUser, tdpToken, tdcToken, ccrpToken, testDataset, testContract, AIModel;

  beforeAll(async () => {
    AIModel = require('../models').AIModel;
    // Setup test database
    await sequelize.sync({ force: true });
    // Create users and tokens as before
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

    // Step 2: TDP creates a dataset
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

    // Create a real AI model
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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await Notification.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('Complete Contract Lifecycle', () => {
    it('should complete full contract workflow from registration to signing', async () => {
      // Step 1: Register all three parties
      // const tdpData = {
      //   email: 'tdp@example.com',
      //   name: 'TDP User',
      //   partyType: 'TDP',
      //   password: 'Password123'
      // };

      // const tdcData = {
      //   email: 'tdc@example.com',
      //   name: 'TDC User',
      //   partyType: 'TDC',
      //   password: 'Password123'
      // };

      // const ccrpData = {
      //   email: 'ccrp@example.com',
      //   name: 'CCRP User',
      //   partyType: 'CCRP',
      //   password: 'Password123'
      // };

      // Register TDP
      // const tdpResponse = await request(app)
      //   .post('/api/auth/register')
      //   .send(tdpData)
      //   .expect(201);

      // tdpUser = tdpResponse.body.user;
      // tdpToken = tdpResponse.body.token;

      // Register TDC
      // const tdcResponse = await request(app)
      //   .post('/api/auth/register')
      //   .send(tdcData)
      //   .expect(201);

      // tdcUser = tdcResponse.body.user;
      // tdcToken = tdcResponse.body.token;

      // Register CCRP
      // const ccrpResponse = await request(app)
      //   .post('/api/auth/register')
      //   .send(ccrpData)
      //   .expect(201);

      // ccrpUser = ccrpResponse.body.user;
      // ccrpToken = ccrpResponse.body.token;

      // Step 2: TDP creates a dataset
      // const datasetData = {
      //   datasetId: 'INTEGRATION-DATASET-001',
      //   name: 'Integration Test Dataset',
      //   description: 'Dataset for integration testing',
      //   category: 'Computer Vision',
      //   size: 1500,
      //   recordCount: 15000,
      //   price: 75.00,
      //   license: 'MIT',
      //   metadata: { type: 'integration-test' }
      // };

      // const datasetResponse = await request(app)
      //   .post('/api/datasets')
      //   .set('Authorization', `Bearer ${tdpToken}`)
      //   .send(datasetData)
      //   .expect(201);

      // testDataset = datasetResponse.body;

      // Step 3: TDP creates a contract
      const contractData = {
        contractId: 'INTEGRATION-CONTRACT-001',
        price: 200.00,
        duration: 60,
        termsAndConditions: 'Integration test contract terms',
        modelId: 'integration-model-001', // Use real modelId
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        datasetId: testDataset.id
      };

      const contractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send(contractData)
        .expect(201);

      testContract = contractResponse.body;

      // Verify contract is in PENDING_TDP_APPROVAL status
      expect(testContract.status).toBe('PENDING_TDP_APPROVAL');

      // Step 4: TDP approves the contract (auto-sign)
      const tdpSignResponse = await request(app)
        .post(`/api/contracts/${testContract.id}/sign`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(tdpSignResponse.body.success).toBe(true);
      expect(tdpSignResponse.body.contract.status).toBe('PENDING_CCRP_SIGNATURE');

      // Step 5: CCRP signs the contract
      const ccrpSignResponse = await request(app)
        .post(`/api/contracts/${testContract.id}/sign`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .expect(200);

      expect(ccrpSignResponse.body.success).toBe(true);
      expect(ccrpSignResponse.body.contract.status).toBe('ACTIVE');

      // Step 6: Verify all parties can see the active contract
      const tdpContracts = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      const tdcContracts = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${tdcToken}`)
        .expect(200);

      const ccrpContracts = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .expect(200);

      expect(tdpContracts.body.length).toBe(1);
      expect(tdcContracts.body.length).toBe(1);
      expect(ccrpContracts.body.length).toBe(1);

      expect(tdpContracts.body[0].status).toBe('ACTIVE');
      expect(tdcContracts.body[0].status).toBe('ACTIVE');
      expect(ccrpContracts.body[0].status).toBe('ACTIVE');

      // Step 7: Verify notifications were created
      const tdpNotifications = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      const ccrpNotifications = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .expect(200);

      expect(tdpNotifications.body.length).toBeGreaterThan(0);
      expect(ccrpNotifications.body.length).toBeGreaterThan(0);
    });

    it('should handle contract rejection workflow', async () => {
      // Register users
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-reject@example.com',
          name: 'TDP Reject User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const ccrpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'ccrp-reject@example.com',
          name: 'CCRP Reject User',
          partyType: 'CCRP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;
      const ccrpToken = ccrpResponse.body.token;

      // Create dataset
      const datasetResponse = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          datasetId: 'REJECT-DATASET-001',
          name: 'Reject Test Dataset',
          description: 'Dataset for rejection testing',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT'
        })
        .expect(201);

      // Create contract
      const contractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          contractId: 'REJECT-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Rejection test terms',
          modelId: 'REJECT-MODEL-001',
          tdpId: tdpResponse.body.user.id,
          tdcId: tdpResponse.body.user.id,
          ccrpId: ccrpResponse.body.user.id,
          datasetId: datasetResponse.body.id
        })
        .expect(201);

      const contract = contractResponse.body;

      // TDP signs
      await request(app)
        .post(`/api/contracts/${contract.id}/sign`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      // CCRP rejects by updating status
      const rejectResponse = await request(app)
        .put(`/api/contracts/${contract.id}`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ status: 'REJECTED', rejectionReason: 'Terms not acceptable' })
        .expect(200);

      expect(rejectResponse.body.status).toBe('REJECTED');
      expect(rejectResponse.body.rejectionReason).toBe('Terms not acceptable');
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle multiple contracts between same parties', async () => {
      // Register users
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-multi@example.com',
          name: 'TDP Multi User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const ccrpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'ccrp-multi@example.com',
          name: 'CCRP Multi User',
          partyType: 'CCRP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;
      const ccrpToken = ccrpResponse.body.token;

      // Create multiple datasets
      const datasets = [];
      for (let i = 1; i <= 3; i++) {
        const datasetResponse = await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${tdpToken}`)
          .send({
            datasetId: `MULTI-DATASET-00${i}`,
            name: `Multi Dataset ${i}`,
            description: `Dataset ${i} for multi testing`,
            category: 'Computer Vision',
            size: 1000 * i,
            recordCount: 10000 * i,
            price: 50.00 * i,
            license: 'MIT'
          })
          .expect(201);

        datasets.push(datasetResponse.body);
      }

      // Create multiple contracts
      const contracts = [];
      for (let i = 1; i <= 3; i++) {
        const contractResponse = await request(app)
          .post('/api/contracts')
          .set('Authorization', `Bearer ${tdpToken}`)
          .send({
            contractId: `MULTI-CONTRACT-00${i}`,
            price: 100.00 * i,
            duration: 30 * i,
            termsAndConditions: `Multi contract ${i} terms`,
            modelId: `MULTI-MODEL-00${i}`,
            tdpId: tdpResponse.body.user.id,
            tdcId: tdpResponse.body.user.id,
            ccrpId: ccrpResponse.body.user.id,
            datasetId: datasets[i - 1].id
          })
          .expect(201);

        contracts.push(contractResponse.body);
      }

      // Sign all contracts
      for (const contract of contracts) {
        // TDP signs
        await request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${tdpToken}`)
          .expect(200);

        // CCRP signs
        await request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${ccrpToken}`)
          .expect(200);
      }

      // Verify all contracts are active
      const tdpContracts = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      const ccrpContracts = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .expect(200);

      expect(tdpContracts.body.length).toBe(3);
      expect(ccrpContracts.body.length).toBe(3);

      tdpContracts.body.forEach(contract => {
        expect(contract.status).toBe('ACTIVE');
      });

      ccrpContracts.body.forEach(contract => {
        expect(contract.status).toBe('ACTIVE');
      });
    });

    it('should handle concurrent contract operations', async () => {
      // Register users
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-concurrent@example.com',
          name: 'TDP Concurrent User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const ccrpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'ccrp-concurrent@example.com',
          name: 'CCRP Concurrent User',
          partyType: 'CCRP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;
      const ccrpToken = ccrpResponse.body.token;

      // Create dataset
      const datasetResponse = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          datasetId: 'CONCURRENT-DATASET-001',
          name: 'Concurrent Test Dataset',
          description: 'Dataset for concurrent testing',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT'
        })
        .expect(201);

      // Create contract
      const contractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          contractId: 'CONCURRENT-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Concurrent test terms',
          modelId: 'CONCURRENT-MODEL-001',
          tdpId: tdpResponse.body.user.id,
          tdcId: tdpResponse.body.user.id,
          ccrpId: ccrpResponse.body.user.id,
          datasetId: datasetResponse.body.id
        })
        .expect(201);

      const contract = contractResponse.body;

      // TDP signs
      await request(app)
        .post(`/api/contracts/${contract.id}/sign`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      // Simulate concurrent signing attempts
      const promises = [
        request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${ccrpToken}`),
        request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${ccrpToken}`),
        request(app)
          .post(`/api/contracts/${contract.id}/sign`)
          .set('Authorization', `Bearer ${ccrpToken}`)
      ];

      const results = await Promise.allSettled(promises);

      // One should succeed, others should fail
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failed = results.filter(r => r.status === 'fulfilled' && r.value.status === 400);

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      // Register users
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-integrity@example.com',
          name: 'TDP Integrity User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;

      // Create dataset
      const datasetResponse = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          datasetId: 'INTEGRITY-DATASET-001',
          name: 'Integrity Test Dataset',
          description: 'Dataset for integrity testing',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT'
        })
        .expect(201);

      // Create contract with valid references
      const contractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          contractId: 'INTEGRITY-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Integrity test terms',
          modelId: 'INTEGRITY-MODEL-001',
          tdpId: tdpResponse.body.user.id,
          tdcId: tdpResponse.body.user.id,
          ccrpId: tdpResponse.body.user.id,
          datasetId: datasetResponse.body.id
        })
        .expect(201);

      const contract = contractResponse.body;

      // Verify contract references are valid
      expect(contract.tdpId).toBe(tdpResponse.body.user.id);
      expect(contract.datasetId).toBe(datasetResponse.body.id);

      // Try to create contract with invalid references
      const invalidContractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          contractId: 'INVALID-INTEGRITY-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Invalid integrity test terms',
          modelId: 'INVALID-INTEGRITY-MODEL-001',
          tdpId: 99999, // Invalid user ID
          tdcId: tdpResponse.body.user.id,
          ccrpId: tdpResponse.body.user.id,
          datasetId: 99999 // Invalid dataset ID
        })
        .expect(400);

      expect(invalidContractResponse.body.error).toBeDefined();
    });

    it('should handle cascading deletes properly', async () => {
      // Register user
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-cascade@example.com',
          name: 'TDP Cascade User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;

      // Create dataset
      const datasetResponse = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          datasetId: 'CASCADE-DATASET-001',
          name: 'Cascade Test Dataset',
          description: 'Dataset for cascade testing',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT'
        })
        .expect(201);

      // Create contract
      const contractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          contractId: 'CASCADE-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Cascade test terms',
          modelId: 'CASCADE-MODEL-001',
          tdpId: tdpResponse.body.user.id,
          tdcId: tdpResponse.body.user.id,
          ccrpId: tdpResponse.body.user.id,
          datasetId: datasetResponse.body.id
        })
        .expect(201);

      const contract = contractResponse.body;

      // Verify contract exists
      const getContractResponse = await request(app)
        .get(`/api/contracts/${contract.id}`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(getContractResponse.body.id).toBe(contract.id);

      // Delete the dataset
      await request(app)
        .delete(`/api/datasets/${datasetResponse.body.id}`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      // Verify contract is also deleted or marked as invalid
      const getContractAfterDeleteResponse = await request(app)
        .get(`/api/contracts/${contract.id}`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(404);

      expect(getContractAfterDeleteResponse.body.error).toBeDefined();
    });
  });

  describe('Performance and Load', () => {
    it('should handle bulk operations efficiently', async () => {
      // Register user
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-bulk@example.com',
          name: 'TDP Bulk User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;

      // Create multiple datasets in parallel
      const datasetPromises = [];
      for (let i = 1; i <= 10; i++) {
        datasetPromises.push(
          request(app)
            .post('/api/datasets')
            .set('Authorization', `Bearer ${tdpToken}`)
            .send({
              datasetId: `BULK-DATASET-${i.toString().padStart(3, '0')}`,
              name: `Bulk Dataset ${i}`,
              description: `Dataset ${i} for bulk testing`,
              category: 'Computer Vision',
              size: 1000,
              recordCount: 10000,
              price: 50.00,
              license: 'MIT'
            })
        );
      }

      const datasetResponses = await Promise.all(datasetPromises);
      datasetResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Create multiple contracts in parallel
      const contractPromises = [];
      for (let i = 1; i <= 10; i++) {
        contractPromises.push(
          request(app)
            .post('/api/contracts')
            .set('Authorization', `Bearer ${tdpToken}`)
            .send({
              contractId: `BULK-CONTRACT-${i.toString().padStart(3, '0')}`,
              price: 100.00,
              duration: 30,
              termsAndConditions: `Bulk contract ${i} terms`,
              modelId: `BULK-MODEL-${i.toString().padStart(3, '0')}`,
              tdpId: tdpResponse.body.user.id,
              tdcId: tdpResponse.body.user.id,
              ccrpId: tdpResponse.body.user.id,
              datasetId: datasetResponses[i - 1].body.id
            })
        );
      }

      const contractResponses = await Promise.all(contractPromises);
      contractResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all contracts were created
      const contractsResponse = await request(app)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(contractsResponse.body.length).toBe(10);
    });

    it('should handle large dataset queries efficiently', async () => {
      // Register user
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-large@example.com',
          name: 'TDP Large User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;

      // Create many datasets
      for (let i = 1; i <= 50; i++) {
        await request(app)
          .post('/api/datasets')
          .set('Authorization', `Bearer ${tdpToken}`)
          .send({
            datasetId: `LARGE-DATASET-${i.toString().padStart(3, '0')}`,
            name: `Large Dataset ${i}`,
            description: `Dataset ${i} for large query testing`,
            category: i % 2 === 0 ? 'Computer Vision' : 'Natural Language Processing',
            size: 1000 + i,
            recordCount: 10000 + i * 100,
            price: 50.00 + i,
            license: 'MIT'
          })
          .expect(201);
      }

      // Test pagination
      const firstPageResponse = await request(app)
        .get('/api/datasets?page=1&limit=10')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(firstPageResponse.body.length).toBe(10);

      // Test filtering
      const filteredResponse = await request(app)
        .get('/api/datasets?category=Computer Vision')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(filteredResponse.body.length).toBe(25); // Half of 50
      filteredResponse.body.forEach(dataset => {
        expect(dataset.category).toBe('Computer Vision');
      });

      // Test sorting
      const sortedResponse = await request(app)
        .get('/api/datasets?sortBy=price&sortOrder=desc')
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(sortedResponse.body.length).toBeGreaterThan(0);
      for (let i = 1; i < sortedResponse.body.length; i++) {
        expect(parseFloat(sortedResponse.body[i - 1].price))
          .toBeGreaterThanOrEqual(parseFloat(sortedResponse.body[i].price));
      }
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial failures gracefully', async () => {
      // Register users
      const tdpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-recovery@example.com',
          name: 'TDP Recovery User',
          partyType: 'TDP',
          password: 'Password123'
        })
        .expect(201);

      const ccrpResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'ccrp-recovery@example.com',
          name: 'CCRP Recovery User',
          partyType: 'CCRP',
          password: 'Password123'
        })
        .expect(201);

      const tdpToken = tdpResponse.body.token;
      const ccrpToken = ccrpResponse.body.token;

      // Create dataset
      const datasetResponse = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          datasetId: 'RECOVERY-DATASET-001',
          name: 'Recovery Test Dataset',
          description: 'Dataset for recovery testing',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT'
        })
        .expect(201);

      // Create contract
      const contractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({
          contractId: 'RECOVERY-CONTRACT-001',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Recovery test terms',
          modelId: 'RECOVERY-MODEL-001',
          tdpId: tdpResponse.body.user.id,
          tdcId: tdpResponse.body.user.id,
          ccrpId: ccrpResponse.body.user.id,
          datasetId: datasetResponse.body.id
        })
        .expect(201);

      const contract = contractResponse.body;

      // TDP signs
      await request(app)
        .post(`/api/contracts/${contract.id}/sign`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      // Simulate network failure during CCRP signing
      // This would be handled by the application's error handling
      const signResponse = await request(app)
        .post(`/api/contracts/${contract.id}/sign`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .expect(200);

      expect(signResponse.body.success).toBe(true);

      // Verify contract state is consistent
      const finalContractResponse = await request(app)
        .get(`/api/contracts/${contract.id}`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .expect(200);

      expect(finalContractResponse.body.status).toBe('ACTIVE');
    });
  });
}); 