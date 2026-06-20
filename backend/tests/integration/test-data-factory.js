/**
 * Test Data Factory for Integration Tests
 * 
 * Provides centralized test data management with:
 * - Isolated test data for each test
 * - Proper cleanup and rollback
 * - Reusable data creation methods
 * - Better error handling
 */

const { User, Contract, Dataset, AIModel, Notification } = require('../../models');
const { sequelize } = require('../../models');
const jwt = require('jsonwebtoken');

class TestDataFactory {
  constructor() {
    this.createdData = {
      users: [],
      datasets: [],
      contracts: [],
      aiModels: [],
      notifications: []
    };
    this.transaction = null;
  }

  /**
   * Initialize a new test data session
   */
  async initialize() {
    try {
      // Start a database transaction for this test session
      this.transaction = await sequelize.transaction();
      
      // Clear any existing test data
      await this.cleanupExistingData();
      
      console.log('✅ Test data factory initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize test data factory:', error.message);
      throw error;
    }
  }

  /**
   * Clean up existing test data to avoid conflicts
   */
  async cleanupExistingData() {
    try {
      // Check which tables exist before trying to clean them
      const existingTables = await this.getExistingTables();
      
      if (existingTables.includes('notifications')) {
        await Notification.destroy({ where: {}, transaction: this.transaction });
      }
      
      if (existingTables.includes('contracts')) {
        await Contract.destroy({ where: {}, transaction: this.transaction });
      }
      
      if (existingTables.includes('datasets')) {
        await Dataset.destroy({ where: {}, transaction: this.transaction });
      }
      
      if (existingTables.includes('ai_models')) {
        await AIModel.destroy({ where: {}, transaction: this.transaction });
      }
      
      if (existingTables.includes('users')) {
        await User.destroy({ where: {}, transaction: this.transaction });
      }
      
      console.log('🧹 Existing test data cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup existing data:', error.message);
      // Don't throw error, just log it and continue
      console.warn('⚠️ Continuing with test setup despite cleanup errors');
    }
  }

  /**
   * Get list of existing tables in the database
   */
  async getExistingTables() {
    try {
      const [results] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
        { transaction: this.transaction }
      );
      return results.map(row => row.table_name);
    } catch (error) {
      console.warn('⚠️ Could not determine existing tables:', error.message);
      return [];
    }
  }

  /**
   * Create a test user with specified role
   */
  async createUser(role, options = {}) {
    try {
      const userData = {
        email: `${role.toLowerCase()}-${Date.now()}@test.example.com`,
        name: `${role} Test User`,
        partyType: role,
        password: options.password || 'Password123',
        organization: options.organization || 'Test Organization',
        description: `Test user for ${role} role`,
        walletAddress: options.walletAddress || null,
        publicKey: options.publicKey || null,
        ...options
      };

      // Create user in database
      const user = await User.create({
        walletAddress: userData.walletAddress,
        publicKey: userData.publicKey,
        partyType: userData.partyType,
        name: userData.name,
        email: userData.email.toLowerCase(),
        description: userData.description,
        organization: userData.organization,
        phoneNumber: userData.phoneNumber || '',
        website: userData.website || '',
        location: userData.location || '',
        did: `did:web:test.example.com:user:${userData.email.split('@')[0]}`,
        didSource: 'SYSTEM_GENERATED',
        didVerified: true,
        didVerificationMethod: 'SYSTEM_GENERATED',
        isRegistered: true,
        registrationDate: new Date(),
        isActive: true,
        onboardingStatus: 'IN_PROGRESS',
        profileCompleted: false,
        emailVerified: false,
        iamUserId: options.iamUserId || `mock-iam-${Date.now()}`,
        iamUsername: userData.email
      }, { transaction: this.transaction });

      // Generate a test JWT token for this user
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.partyType,
          email: user.email,
          sub: user.iamUserId
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      const userWithToken = {
        ...user.toJSON(),
        token
      };

      this.createdData.users.push(userWithToken);
      
      console.log(`✅ Created test user: ${user.email} (${user.partyType})`);
      return userWithToken;
    } catch (error) {
      console.error(`❌ Failed to create test user for role ${role}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a complete set of test users for contract testing
   */
  async createContractParties() {
    try {
      const tdpUser = await this.createUser('TDP', {
        organization: 'Test Data Provider Inc.',
        description: 'Test data provider for integration testing'
      });

      const tdcUser = await this.createUser('TDC', {
        organization: 'Test Data Consumer Corp.',
        description: 'Test data consumer for integration testing'
      });

      const tspUser = await this.createUser('TSP', {
        organization: 'Test Computing Resource Provider',
        description: 'Test computing resource provider for integration testing'
      });

      console.log('✅ Created contract parties: TDP, TDC, TSP');
      return { tdpUser, tdcUser, tspUser };
    } catch (error) {
      console.error('❌ Failed to create contract parties:', error.message);
      throw error;
    }
  }

  /**
   * Create a test dataset
   */
  async createDataset(ownerId, options = {}) {
    try {
      const datasetData = {
        datasetId: `TEST-DATASET-${Date.now()}`,
        name: options.name || 'Test Dataset',
        description: options.description || 'Dataset for integration testing',
        category: options.category || 'Computer Vision',
        size: options.size || 1500,
        recordCount: options.recordCount || 15000,
        price: options.price || 75.00,
        license: options.license || 'MIT',
        ownerId: ownerId,
        metadata: options.metadata || { type: 'integration-test' }
      };

      const dataset = await Dataset.create(datasetData, { transaction: this.transaction });
      
      this.createdData.datasets.push(dataset);
      
      console.log(`✅ Created test dataset: ${dataset.datasetId}`);
      return dataset;
    } catch (error) {
      console.error('❌ Failed to create test dataset:', error.message);
      throw error;
    }
  }

  /**
   * Create a test AI model
   */
  async createAIModel(options = {}) {
    try {
      const aiModelData = {
        modelId: `test-model-${Date.now()}`,
        name: options.name || 'Test AI Model',
        description: options.description || 'AI model for integration testing',
        type: options.type || 'cnn',
        architecture: options.architecture || 'test-arch',
        parameters: options.parameters || '2M',
        framework: options.framework || 'TensorFlow',
        privacyTechnique: options.privacyTechnique || 'differential-privacy',
        validationMetrics: options.validationMetrics || ['accuracy'],
        maxEpochs: options.maxEpochs || 5,
        batchSize: options.batchSize || 8,
        learningRate: options.learningRate || 0.01,
        isActive: true
      };

      const aiModel = await AIModel.create(aiModelData, { transaction: this.transaction });
      
      this.createdData.aiModels.push(aiModel);
      
      console.log(`✅ Created test AI model: ${aiModel.modelId}`);
      return aiModel;
    } catch (error) {
      console.error('❌ Failed to create test AI model:', error.message);
      throw error;
    }
  }

  /**
   * Create a test contract
   */
  async createContract(contractData, options = {}) {
    try {
      const contract = await Contract.create(contractData, { transaction: this.transaction });
      
      this.createdData.contracts.push(contract);
      
      console.log(`✅ Created test contract: ${contract.id}`);
      return contract;
    } catch (error) {
      console.error('❌ Failed to create test contract:', error.message);
      throw error;
    }
  }

  /**
   * Create a test notification
   */
  async createNotification(userId, options = {}) {
    try {
      // Check if notifications table exists
      const existingTables = await this.getExistingTables();
      if (!existingTables.includes('notifications')) {
        console.warn('⚠️ Notifications table does not exist, skipping notification creation');
        return null;
      }

      const notificationData = {
        userId: userId,
        type: options.type || 'TEST_NOTIFICATION',
        title: options.title || 'Test Notification',
        message: options.message || 'This is a test notification',
        isRead: options.isRead || false,
        metadata: options.metadata || {}
      };

      const notification = await Notification.create(notificationData, { transaction: this.transaction });
      
      this.createdData.notifications.push(notification);
      
      console.log(`✅ Created test notification: ${notification.id}`);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create test notification:', error.message);
      // Don't throw error, just return null
      console.warn('⚠️ Continuing without notification creation');
      return null;
    }
  }

  /**
   * Create a complete test scenario for contract testing
   */
  async createContractTestScenario() {
    try {
      console.log('🏗️ Creating complete contract test scenario...');
      
      // Create contract parties
      const { tdpUser, tdcUser, tspUser } = await this.createContractParties();
      
      // Create test dataset owned by TDP
      const dataset = await this.createDataset(tdpUser.id, {
        name: 'Contract Test Dataset',
        description: 'Dataset for contract integration testing'
      });
      
      // Create test AI model
      const aiModel = await this.createAIModel({
        name: 'Contract Test AI Model',
        description: 'AI model for contract integration testing'
      });
      
      // Create test notification
      const notification = await this.createNotification(tdpUser.id, {
        type: 'TEST_SCENARIO_CREATED',
        title: 'Test Scenario Ready',
        message: 'Contract test scenario has been created successfully'
      });
      
      const scenario = {
        users: { tdpUser, tdcUser, tspUser },
        dataset,
        aiModel,
        notification,
        // Helper methods for common operations
        getTdpToken: () => tdpUser.token,
        getTdcToken: () => tdcUser.token,
        getCcrpToken: () => tspUser.token
      };
      
      console.log('✅ Contract test scenario created successfully');
      return scenario;
    } catch (error) {
      console.error('❌ Failed to create contract test scenario:', error.message);
      throw error;
    }
  }

  /**
   * Commit the current test session
   */
  async commit() {
    try {
      if (this.transaction) {
        await this.transaction.commit();
        console.log('✅ Test data session committed');
      }
    } catch (error) {
      console.error('❌ Failed to commit test data session:', error.message);
      throw error;
    }
  }

  /**
   * Rollback the current test session
   */
  async rollback() {
    try {
      if (this.transaction) {
        await this.transaction.rollback();
        console.log('🔄 Test data session rolled back');
      }
    } catch (error) {
      console.error('❌ Failed to rollback test data session:', error.message);
      throw error;
    }
  }

  /**
   * Clean up all created test data
   */
  async cleanup() {
    try {
      console.log('🧹 Cleaning up test data...');
      
      // Get existing tables to avoid errors
      const existingTables = await this.getExistingTables();
      
      // Clean up in reverse order of dependencies
      if (existingTables.includes('notifications') && this.createdData.notifications.length > 0) {
        await Notification.destroy({ 
          where: { id: this.createdData.notifications.map(n => n.id) },
          force: true 
        });
      }
      
      if (existingTables.includes('contracts') && this.createdData.contracts.length > 0) {
        await Contract.destroy({ 
          where: { id: this.createdData.contracts.map(c => c.id) },
          force: true 
        });
      }
      
      if (existingTables.includes('datasets') && this.createdData.datasets.length > 0) {
        await Dataset.destroy({ 
          where: { id: this.createdData.datasets.map(d => d.id) },
          force: true 
        });
      }
      
      if (existingTables.includes('ai_models') && this.createdData.aiModels.length > 0) {
        await AIModel.destroy({ 
          where: { id: this.createdData.aiModels.map(m => m.id) },
          force: true 
        });
      }
      
      if (existingTables.includes('users') && this.createdData.users.length > 0) {
        await User.destroy({ 
          where: { id: this.createdData.users.map(u => u.id) },
          force: true 
        });
      }
      
      // Clear the tracking arrays
      this.createdData = {
        users: [],
        datasets: [],
        contracts: [],
        aiModels: [],
        notifications: []
      };
      
      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error.message);
      // Don't throw error, just log it
      console.warn('⚠️ Test data cleanup had errors, but continuing');
    }
  }

  /**
   * Get summary of created test data
   */
  getSummary() {
    return {
      users: this.createdData.users.length,
      datasets: this.createdData.datasets.length,
      contracts: this.createdData.contracts.length,
      aiModels: this.createdData.aiModels.length,
      notifications: this.createdData.notifications.length
    };
  }
}

module.exports = TestDataFactory;
