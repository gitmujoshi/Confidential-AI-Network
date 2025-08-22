/**
 * Test Scenario Manager for Integration Tests
 * 
 * Provides high-level test scenario management with:
 * - Isolated test scenarios for each test
 * - Automatic cleanup and rollback
 * - Pre-built test scenarios
 * - Better test isolation
 */

const TestDataFactory = require('./test-data-factory');

class TestScenarioManager {
  constructor() {
    this.currentScenario = null;
    this.dataFactory = null;
  }

  /**
   * Initialize a new test scenario
   */
  async initializeScenario(scenarioType = 'contract') {
    try {
      console.log(`🏗️ Initializing ${scenarioType} test scenario...`);
      
      // Create new data factory instance
      this.dataFactory = new TestDataFactory();
      
      // Initialize the factory
      await this.dataFactory.initialize();
      
      // Create the specific scenario
      switch (scenarioType) {
        case 'contract':
          this.currentScenario = await this.dataFactory.createContractTestScenario();
          break;
        case 'dataset':
          this.currentScenario = await this.dataFactory.createDatasetTestScenario();
          break;
        case 'ai-model':
          this.currentScenario = await this.dataFactory.createAIModelTestScenario();
          break;
        case 'user-management':
          this.currentScenario = await this.dataFactory.createUserManagementTestScenario();
          break;
        default:
          throw new Error(`Unknown scenario type: ${scenarioType}`);
      }
      
      console.log(`✅ ${scenarioType} test scenario initialized successfully`);
      return this.currentScenario;
    } catch (error) {
      console.error(`❌ Failed to initialize ${scenarioType} test scenario:`, error.message);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Get the current test scenario
   */
  getCurrentScenario() {
    if (!this.currentScenario) {
      throw new Error('No test scenario initialized. Call initializeScenario() first.');
    }
    return this.currentScenario;
  }

  /**
   * Get specific data from current scenario
   */
  getData(dataType, identifier = null) {
    const scenario = this.getCurrentScenario();
    
    switch (dataType) {
      case 'users':
        return identifier ? scenario.users[identifier] : scenario.users;
      case 'dataset':
        return scenario.dataset;
      case 'aiModel':
        return scenario.aiModel;
      case 'notification':
        return scenario.notification;
      case 'token':
        if (!identifier) {
          throw new Error('Token identifier required (tdp, tdc, ccrp)');
        }
        return scenario[`get${identifier.charAt(0).toUpperCase() + identifier.slice(1)}Token`]();
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Add additional test data to current scenario
   */
  async addData(dataType, options = {}) {
    try {
      if (!this.dataFactory) {
        throw new Error('No test scenario initialized');
      }
      
      let newData;
      switch (dataType) {
        case 'user':
          newData = await this.dataFactory.createUser(options.role, options);
          this.currentScenario.users[options.role.toLowerCase() + 'User'] = newData;
          break;
        case 'dataset':
          newData = await this.dataFactory.createDataset(options.ownerId, options);
          this.currentScenario.datasets = this.currentScenario.datasets || [];
          this.currentScenario.datasets.push(newData);
          break;
        case 'aiModel':
          newData = await this.dataFactory.createAIModel(options);
          this.currentScenario.aiModels = this.currentScenario.aiModels || [];
          this.currentScenario.aiModels.push(newData);
          break;
        case 'contract':
          newData = await this.dataFactory.createContract(options.contractData, options);
          this.currentScenario.contracts = this.currentScenario.contracts || [];
          this.currentScenario.contracts.push(newData);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      console.log(`✅ Added ${dataType} to current scenario`);
      return newData;
    } catch (error) {
      console.error(`❌ Failed to add ${dataType} to scenario:`, error.message);
      throw error;
    }
  }

  /**
   * Validate current scenario has required data
   */
  validateScenario(requiredData = []) {
    try {
      const scenario = this.getCurrentScenario();
      const missing = [];
      
      for (const data of requiredData) {
        if (!scenario[data]) {
          missing.push(data);
        }
      }
      
      if (missing.length > 0) {
        throw new Error(`Missing required scenario data: ${missing.join(', ')}`);
      }
      
      console.log('✅ Scenario validation passed');
      return true;
    } catch (error) {
      console.error('❌ Scenario validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get scenario summary
   */
  getScenarioSummary() {
    if (!this.currentScenario) {
      return { status: 'No scenario initialized' };
    }
    
    const summary = {
      status: 'Active',
      users: Object.keys(this.currentScenario.users || {}).length,
      dataset: !!this.currentScenario.dataset,
      aiModel: !!this.currentScenario.aiModel,
      notification: !!this.currentScenario.notification,
      contracts: (this.currentScenario.contracts || []).length,
      aiModels: (this.currentScenario.aiModels || []).length
    };
    
    if (this.dataFactory) {
      Object.assign(summary, this.dataFactory.getSummary());
    }
    
    return summary;
  }

  /**
   * Commit current scenario (make data persistent)
   */
  async commit() {
    try {
      if (this.dataFactory) {
        await this.dataFactory.commit();
        console.log('✅ Test scenario committed successfully');
      }
    } catch (error) {
      console.error('❌ Failed to commit test scenario:', error.message);
      throw error;
    }
  }

  /**
   * Rollback current scenario (undo all changes)
   */
  async rollback() {
    try {
      if (this.dataFactory) {
        await this.dataFactory.rollback();
        console.log('🔄 Test scenario rolled back successfully');
      }
    } catch (error) {
      console.error('❌ Failed to rollback test scenario:', error.message);
      throw error;
    }
  }

  /**
   * Clean up current scenario
   */
  async cleanup() {
    try {
      console.log('🧹 Cleaning up test scenario...');
      
      if (this.dataFactory) {
        await this.dataFactory.cleanup();
        this.dataFactory = null;
      }
      
      this.currentScenario = null;
      
      console.log('✅ Test scenario cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test scenario:', error.message);
      throw error;
    }
  }

  /**
   * Create a minimal test scenario for quick tests
   */
  async createMinimalScenario() {
    try {
      console.log('🏗️ Creating minimal test scenario...');
      
      this.dataFactory = new TestDataFactory();
      await this.dataFactory.initialize();
      
      // Create just one TDP user for basic testing
      const tdpUser = await this.dataFactory.createUser('TDP', {
        organization: 'Minimal Test Org',
        description: 'Minimal test user'
      });
      
      this.currentScenario = {
        users: { tdpUser },
        getTdpToken: () => tdpUser.token
      };
      
      console.log('✅ Minimal test scenario created');
      return this.currentScenario;
    } catch (error) {
      console.error('❌ Failed to create minimal test scenario:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Create a comprehensive test scenario for full integration tests
   */
  async createComprehensiveScenario() {
    try {
      console.log('🏗️ Creating comprehensive test scenario...');
      
      this.dataFactory = new TestDataFactory();
      await this.dataFactory.initialize();
      
      // Create all user types
      const { tdpUser, tdcUser, ccrpUser } = await this.dataFactory.createContractParties();
      
      // Create multiple datasets
      const dataset1 = await this.dataFactory.createDataset(tdpUser.id, {
        name: 'Primary Test Dataset',
        category: 'Computer Vision'
      });
      
      const dataset2 = await this.dataFactory.createDataset(tdpUser.id, {
        name: 'Secondary Test Dataset',
        category: 'Natural Language Processing'
      });
      
      // Create multiple AI models
      const aiModel1 = await this.dataFactory.createAIModel({
        name: 'Primary AI Model',
        type: 'cnn'
      });
      
      const aiModel2 = await this.dataFactory.createAIModel({
        name: 'Secondary AI Model',
        type: 'transformer'
      });
      
      // Create notifications
      const notification1 = await this.dataFactory.createNotification(tdpUser.id, {
        type: 'DATASET_CREATED',
        title: 'Dataset Created',
        message: 'Primary test dataset has been created'
      });
      
      const notification2 = await this.dataFactory.createNotification(tdcUser.id, {
        type: 'MODEL_AVAILABLE',
        title: 'AI Model Available',
        message: 'New AI model is available for training'
      });
      
      this.currentScenario = {
        users: { tdpUser, tdcUser, ccrpUser },
        datasets: [dataset1, dataset2],
        aiModels: [aiModel1, aiModel2],
        notifications: [notification1, notification2],
        // Helper methods
        getTdpToken: () => tdpUser.token,
        getTdcToken: () => tdcUser.token,
        getCcrpToken: () => ccrpUser.token,
        getPrimaryDataset: () => dataset1,
        getSecondaryDataset: () => dataset2,
        getPrimaryAIModel: () => aiModel1,
        getSecondaryAIModel: () => aiModel2
      };
      
      console.log('✅ Comprehensive test scenario created');
      return this.currentScenario;
    } catch (error) {
      console.error('❌ Failed to create comprehensive test scenario:', error.message);
      await this.cleanup();
      throw error;
    }
  }
}

module.exports = TestScenarioManager;
