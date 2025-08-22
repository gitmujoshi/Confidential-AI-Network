/**
 * Integration Test Suite - Refactored with Test Data Management
 * 
 * Uses the new TestDataFactory and TestScenarioManager for:
 * - Isolated test data for each test
 * - Better error handling and cleanup
 * - Reusable test scenarios
 * - Proper test isolation
 */

const request = require('supertest');
const TestScenarioManager = require('./test-scenario-manager');
const TestHelpers = require('./test-helpers');

// Import test server instead of main server
const app = require('../test-server');

describe('Integration Test Suite', () => {
  let scenarioManager;
  let testHelpers;
  let currentScenario;

  beforeAll(async () => {
    try {
      console.log('🧪 Starting integration test setup...');
      
      // Initialize test helpers
      testHelpers = new TestHelpers(app);
      
      // Wait for service health
      await testHelpers.waitForServiceHealth('/health', 10000);
      
      console.log('✅ Integration test setup completed successfully');
    } catch (error) {
      console.error('🧪 Integration test setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up any remaining test data
    if (scenarioManager) {
      await scenarioManager.cleanup();
    }
  });

  describe('User Registration Integration', () => {
    beforeEach(async () => {
      // Create isolated test scenario for each test
      scenarioManager = new TestScenarioManager();
      currentScenario = await scenarioManager.createMinimalScenario();
    });

    afterEach(async () => {
      // Clean up test data after each test
      if (scenarioManager) {
        await scenarioManager.cleanup();
      }
    });

    it('should register user with both database and Keycloak integration', async () => {
      const userData = testHelpers.generateUniqueData('integration');
      userData.partyType = 'TDP';
      userData.password = 'Password123';

      const response = await testHelpers.unauthenticatedRequest('POST', '/api/auth/register', userData);
      
      testHelpers.validateSuccessResponse(response, 201);
      testHelpers.validateUserData(response.body.user, 'TDP');
      
      expect(response.body.details).toBeDefined();
      expect(response.body.loginCredentials).toBeDefined();
    });

    it('should handle duplicate email registration gracefully', async () => {
      const userData = testHelpers.generateUniqueData('duplicate');
      userData.partyType = 'TDP';
      userData.password = 'Password123';

      // First registration should succeed
      const firstResponse = await testHelpers.unauthenticatedRequest('POST', '/api/auth/register', userData);
      testHelpers.validateSuccessResponse(firstResponse, 201);

      // Second registration with same email should fail
      const secondResponse = await testHelpers.unauthenticatedRequest('POST', '/api/auth/register', userData);
      testHelpers.validateErrorResponse(secondResponse, 409);
    });
  });

  describe('Contract Creation Integration', () => {
    beforeEach(async () => {
      // Create comprehensive test scenario for contract testing
      scenarioManager = new TestScenarioManager();
      currentScenario = await scenarioManager.createComprehensiveScenario();
      
      // Validate scenario has required data
      scenarioManager.validateScenario(['users', 'datasets', 'aiModels']);
    });

    afterEach(async () => {
      // Clean up test data after each test
      if (scenarioManager) {
        await scenarioManager.cleanup();
      }
    });

    it('should create Ricardian contract with all required parties', async () => {
      const { tdcUser, dataset } = currentScenario;
      const tdcToken = currentScenario.getTdcToken();
      
      const contractData = {
        datasetSelections: [
          {
            datasetId: dataset.datasetId,
            individualPrice: 100.00
          }
        ],
        duration: 30,
        termsAndConditions: 'Integration test terms',
        contractType: 'AI_TRAINING'
      };

      const response = await testHelpers.authenticatedRequest(
        'POST', 
        '/api/contracts/ricardian', 
        tdcToken, 
        contractData
      );

      console.log('🧪 Contract creation response status:', response.status);
      console.log('🧪 Contract creation response body:', JSON.stringify(response.body, null, 2));
      
      testHelpers.validateSuccessResponse(response, 201);
      testHelpers.validateContractData(response.body.contract, 'PENDING_TDP_APPROVAL');
      expect(response.body.legalDocument).toBeDefined();
    });
  });

  describe('Dataset Management Integration', () => {
    beforeEach(async () => {
      // Create test scenario with TDP user
      scenarioManager = new TestScenarioManager();
      currentScenario = await scenarioManager.createMinimalScenario();
    });

    afterEach(async () => {
      // Clean up test data after each test
      if (scenarioManager) {
        await scenarioManager.cleanup();
      }
    });

    it('should create and retrieve datasets', async () => {
      const { tdpUser } = currentScenario;
      const tdpToken = currentScenario.getTdpToken();
      
      const datasetData = testHelpers.generateUniqueData('dataset');
      datasetData.ownerId = tdpUser.id;
      datasetData.category = 'Natural Language Processing';
      datasetData.size = 2000;
      datasetData.recordCount = 20000;
      datasetData.price = 100.00;
      datasetData.license = 'Apache 2.0';

      const createResponse = await testHelpers.authenticatedRequest(
        'POST', 
        '/api/datasets', 
        tdpToken, 
        datasetData
      );

      console.log('🧪 Dataset creation response status:', createResponse.status);
      console.log('🧪 Dataset creation response body:', JSON.stringify(createResponse.body, null, 2));

      testHelpers.validateSuccessResponse(createResponse, 201);
      testHelpers.validateDatasetData(createResponse.body.dataset, tdpUser.id);
      expect(createResponse.body.dataset.datasetId).toBe(datasetData.datasetId);

      // Retrieve the dataset
      const getResponse = await testHelpers.authenticatedRequest(
        'GET', 
        `/api/datasets/${datasetData.datasetId}`, 
        tdpToken
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.datasetId).toBe(datasetData.datasetId);
    });
  });

  describe('AI Model Integration', () => {
    beforeEach(async () => {
      // Create test scenario with TDP user
      scenarioManager = new TestScenarioManager();
      currentScenario = await scenarioManager.createMinimalScenario();
    });

    afterEach(async () => {
      // Clean up test data after each test
      if (scenarioManager) {
        await scenarioManager.cleanup();
      }
    });

    it('should retrieve available AI models', async () => {
      const tdpToken = currentScenario.getTdpToken();

      const response = await testHelpers.authenticatedRequest('GET', '/api/ai-models', tdpToken);

      expect(response.status).toBe(200);
      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
    });
  });

  describe('Notification Integration', () => {
    beforeEach(async () => {
      // Create test scenario with TDP user
      scenarioManager = new TestScenarioManager();
      currentScenario = await scenarioManager.createMinimalScenario();
    });

    afterEach(async () => {
      // Clean up test data after each test
      if (scenarioManager) {
        await scenarioManager.cleanup();
      }
    });

    it('should create notifications directly in database', async () => {
      const { tdpUser } = currentScenario;
      
      // Create notification directly in database using the scenario manager
      const notification = await scenarioManager.dataFactory.createNotification(tdpUser.id, {
        type: 'CONTRACT_CREATED',
        title: 'Integration Test Notification',
        message: 'This is an integration test notification'
      });

      console.log('🧪 Created notification:', JSON.stringify(notification, null, 2));
      console.log('🧪 Expected userId:', tdpUser.id);

      expect(notification).toBeDefined();
      expect(notification.userId).toBeDefined();
      expect(notification.type).toBe('CONTRACT_CREATED');
      expect(notification.title).toBe('Integration Test Notification');

      // Verify we can retrieve it from database
      const { Notification } = require('../../models');
      const retrievedNotification = await Notification.findOne({
        where: { id: notification.id }
      });

      expect(retrievedNotification).toBeDefined();
      expect(retrievedNotification.type).toBe('CONTRACT_CREATED');
    });
  });

  describe('End-to-End Contract Workflow', () => {
    beforeEach(async () => {
      // Create comprehensive test scenario for full workflow testing
      scenarioManager = new TestScenarioManager();
      currentScenario = await scenarioManager.createComprehensiveScenario();
      
      // Validate scenario has required data
      scenarioManager.validateScenario(['users', 'datasets', 'aiModels']);
    });

    afterEach(async () => {
      // Clean up test data after each test
      if (scenarioManager) {
        await scenarioManager.cleanup();
      }
    });

    it('should complete full contract lifecycle', async () => {
      const { tdpUser, tdcUser, dataset, aiModel } = currentScenario;
      const tdcToken = currentScenario.getTdcToken();
      const tdpToken = currentScenario.getTdpToken();
      
      // Step 1: Create contract
      const contractData = {
        datasetSelections: [
          {
            datasetId: dataset.datasetId,
            individualPrice: 150.00
          }
        ],
        duration: 60,
        termsAndConditions: 'Full lifecycle test terms',
        contractType: 'AI_TRAINING'
      };

      const createResponse = await testHelpers.authenticatedRequest(
        'POST', 
        '/api/contracts/ricardian', 
        tdcToken, 
        contractData
      );

      testHelpers.validateSuccessResponse(createResponse, 201);
      const contract = createResponse.body.contract;
      
      console.log('🧪 Contract created:', contract.id);
      console.log('🧪 Contract status:', contract.status);

      // Step 2: TDP approves contract
      const approveResponse = await testHelpers.authenticatedRequest(
        'PUT', 
        `/api/contracts/${contract.id}/approve`, 
        tdpToken
      );

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.contract.status).toBe('APPROVED');

      console.log('🧪 Contract approved by TDP');

      // Step 3: Verify contract state
      const getResponse = await testHelpers.authenticatedRequest(
        'GET', 
        `/api/contracts/${contract.id}`, 
        tdcToken
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.contract.status).toBe('APPROVED');
      expect(getResponse.body.contract.tdpApproved).toBe(true);

      console.log('🧪 Full contract lifecycle completed successfully');
    });
  });
}); 