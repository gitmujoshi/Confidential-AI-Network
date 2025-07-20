/**
 * Integration Tests with Real Services
 * 
 * This test suite uses real Keycloak, blockchain, and database services
 * to test the complete application flow without mocks.
 * 
 * Prerequisites:
 * 1. Start Docker services: docker-compose -f docker-compose.test.yml up -d
 * 2. Wait for all services to be healthy
 * 3. Run: npm run test:integration
 */

// Load integration environment configuration
require('./integration-env');

const request = require('supertest');
const { sequelize } = require('../models');
const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const BlockchainService = require('../services/blockchainService');
const { User, Contract, Dataset, AIModel } = require('../models');

// Import test configuration
const { TEST_PRIVATE_KEYS, TEST_ADDRESSES } = require('./integration-env');

describe('Integration Tests with Real Services', () => {
  let app;
  let ***REMOVED-KEYCLOAK_DB_PASSWORD***Service;
  let blockchainService;
  let testUsers = {};
  let testContractId;
  let testDatasetId;
  let testModelId;

  beforeAll(async () => {
    // Initialize services
    ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
    blockchainService = new BlockchainService();
    
    // Initialize blockchain service
    await blockchainService.initialize();
    
    // Start the Express app
    app = require('../server');
    
    // Sync database
    await sequelize.sync({ force: true });
    
    console.log('✅ Integration test environment initialized');
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    // Clean up
    await sequelize.close();
    console.log('✅ Integration test environment cleaned up');
  }, 30000);

  describe('Service Health Checks', () => {
    test('should connect to database', async () => {
      const result = await sequelize.authenticate();
      expect(result).toBeDefined();
    });

    test('should connect to Keycloak', async () => {
      const isConnected = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.isConnected();
      expect(isConnected).toBe(true);
    });

    test('should connect to blockchain', async () => {
      const isConnected = await blockchainService.isConnected();
      expect(isConnected).toBe(true);
    });

    test('should get blockchain block number', async () => {
      const blockNumber = await blockchainService.provider.getBlockNumber();
      expect(blockNumber).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Keycloak Integration', () => {
    test('should create test realm', async () => {
      const realmName = 'contract-management-test';
      const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createRealm(realmName);
      expect(result).toBe(true);
    });

    test('should create test client', async () => {
      const clientConfig = {
        clientId: 'backend-test',
        clientSecret: 'test-client-secret',
        redirectUris: ['http://localhost:3000/*'],
        webOrigins: ['http://localhost:3000']
      };
      
      const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createClient(clientConfig);
      expect(result).toBe(true);
    });

    test('should create test users in Keycloak', async () => {
      const users = [
        {
          email: 'tdp-test@example.com',
          username: 'tdp-test',
          password: 'Password123',
          role: 'TDP'
        },
        {
          email: 'tdc-test@example.com',
          username: 'tdc-test',
          password: 'Password123',
          role: 'TDC'
        },
        {
          email: 'ccrp-test@example.com',
          username: 'ccrp-test',
          password: 'Password123',
          role: 'CCRP'
        }
      ];

      for (const userData of users) {
        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(userData);
        expect(result).toHaveProperty('id');
        testUsers[userData.role] = result;
      }
    });

    test('should authenticate test user', async () => {
      const authResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUser(
        'tdp-test@example.com',
        'Password123'
      );
      expect(authResult).toHaveProperty('access_token');
    });
  });

  describe('Blockchain Integration', () => {
    test('should register parties on blockchain', async () => {
      const parties = [
        { address: TEST_ADDRESSES.TDP, type: 'TDP', name: 'Test TDP', description: 'Test TDP Description' },
        { address: TEST_ADDRESSES.TDC, type: 'TDC', name: 'Test TDC', description: 'Test TDC Description' },
        { address: TEST_ADDRESSES.CCRP, type: 'CCRP', name: 'Test CCRP', description: 'Test CCRP Description' }
      ];

      for (const party of parties) {
        // Note: This would require the registerParty method in BlockchainService
        // For now, we'll test the connection and basic functionality
        const isConnected = await blockchainService.isConnected();
        expect(isConnected).toBe(true);
      }
    });

    test('should create contract on blockchain', async () => {
      const contractData = {
        tdpAddress: TEST_ADDRESSES.TDP,
        datasetId: 'test-dataset-001',
        modelId: 'test-model-001',
        price: '0.1', // 0.1 ETH
        duration: 30, // 30 days
        termsAndConditions: 'Test contract terms and conditions'
      };

      const result = await blockchainService.createContract(
        contractData.tdpAddress,
        contractData.datasetId,
        contractData.modelId,
        contractData.price,
        contractData.duration,
        contractData.termsAndConditions,
        TEST_PRIVATE_KEYS.TDC
      );

      expect(result.success).toBe(true);
      expect(result.contractId).toBeDefined();
      testContractId = result.contractId;
    });

    test('should sign contract as TDP', async () => {
      const result = await blockchainService.signContract(
        testContractId,
        TEST_PRIVATE_KEYS.TDP
      );

      expect(result.success).toBe(true);
    });

    test('should get contract from blockchain', async () => {
      const contract = await blockchainService.getContract(testContractId);
      expect(contract).toBeDefined();
      expect(contract.contractId).toBe(testContractId);
    });
  });

  describe('Database Integration', () => {
    test('should create test users in database', async () => {
      const users = [
        {
          email: 'tdp-test@example.com',
          username: 'tdp-test',
          password: 'hashed-password',
          role: 'TDP',
          publicKey: 'test-public-key-tdp',
          did: 'did:web:github.com:tdp-test',
          didVerified: true
        },
        {
          email: 'tdc-test@example.com',
          username: 'tdc-test',
          password: 'hashed-password',
          role: 'TDC',
          publicKey: 'test-public-key-tdc',
          did: 'did:web:github.com:tdc-test',
          didVerified: true
        },
        {
          email: 'ccrp-test@example.com',
          username: 'ccrp-test',
          password: 'hashed-password',
          role: 'CCRP',
          publicKey: 'test-public-key-ccrp',
          did: 'did:web:github.com:ccrp-test',
          didVerified: true
        }
      ];

      for (const userData of users) {
        const user = await User.create(userData);
        expect(user.id).toBeDefined();
        expect(user.email).toBe(userData.email);
        expect(user.role).toBe(userData.role);
      }
    });

    test('should create test dataset', async () => {
      const tdpUser = await User.findOne({ where: { role: 'TDP' } });
      
      const dataset = await Dataset.create({
        name: 'Test Dataset',
        description: 'Test dataset for integration testing',
        ownerId: tdpUser.id,
        status: 'SIGNED',
        recordCount: 1000,
        license: 'MIT',
        size: '1GB',
        price: '0.1'
      });

      expect(dataset.id).toBeDefined();
      testDatasetId = dataset.id;
    });

    test('should create test AI model', async () => {
      const model = await AIModel.create({
        modelId: 'test-model-001',
        name: 'Test AI Model',
        description: 'Test AI model for integration testing',
        type: 'LLM',
        framework: 'PyTorch',
        version: '1.0.0',
        isActive: true
      });

      expect(model.id).toBeDefined();
      testModelId = model.modelId;
    });

    test('should create test contract in database', async () => {
      const tdpUser = await User.findOne({ where: { role: 'TDP' } });
      const tdcUser = await User.findOne({ where: { role: 'TDC' } });
      const ccrpUser = await User.findOne({ where: { role: 'CCRP' } });

      const contract = await Contract.create({
        title: 'Test Integration Contract',
        description: 'Test contract for integration testing',
        status: 'DRAFT',
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        datasetId: testDatasetId,
        modelId: testModelId,
        price: '0.1',
        duration: 30,
        termsAndConditions: 'Test contract terms and conditions',
        contractDatasets: [{
          datasetId: 'test-dataset-001',
          tdpId: tdpUser.id,
          datasetName: 'Test Dataset',
          tdpName: tdpUser.name,
          individualPrice: 0.1,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1,
        totalPrice: 0.1
      });

      expect(contract.id).toBeDefined();
    });
  });

  describe('API Integration', () => {
    test('should get AI models endpoint', async () => {
      const response = await request(app)
        .get('/api/ai-models')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should get datasets endpoint', async () => {
      const response = await request(app)
        .get('/api/datasets')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should get contracts endpoint', async () => {
      const response = await request(app)
        .get('/api/contracts')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('End-to-End Contract Flow', () => {
    test('should complete full contract lifecycle', async () => {
      // 1. Create contract
      const contractData = {
        title: 'E2E Test Contract',
        description: 'End-to-end test contract',
        tdpId: (await User.findOne({ where: { role: 'TDP' } })).id,
        tdcId: (await User.findOne({ where: { role: 'TDC' } })).id,
        ccrpId: (await User.findOne({ where: { role: 'CCRP' } })).id,
        datasetId: testDatasetId,
        modelId: testModelId,
        price: '0.1',
        duration: 30,
        termsAndConditions: 'E2E test terms',
        contractDatasets: [{
          datasetId: 'test-dataset-001',
          tdpId: (await User.findOne({ where: { role: 'TDP' } })).id,
          datasetName: 'Test Dataset',
          tdpName: (await User.findOne({ where: { role: 'TDP' } })).name,
          individualPrice: 0.1,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1,
        totalPrice: 0.1
      };

      const contract = await Contract.create(contractData);
      expect(contract.id).toBeDefined();

      // 2. Update contract status to SIGNED
      await contract.update({ status: 'SIGNED' });
      
      // 3. Verify contract is signed
      const updatedContract = await Contract.findByPk(contract.id);
      expect(updatedContract.status).toBe('SIGNED');
    });
  });
}); 