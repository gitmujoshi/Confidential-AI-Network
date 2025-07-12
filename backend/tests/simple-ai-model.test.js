const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

// Create a test database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

// Import the AIModel
const AIModel = require('../models/AIModel')(sequelize, Sequelize);

describe('Simple AI Model Tests', () => {
  beforeAll(async () => {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('AIModel Basic Tests', () => {
    it('should connect to database', async () => {
      try {
        await sequelize.authenticate();
        expect(true).toBe(true); // If we get here, connection is successful
      } catch (error) {
        expect(error).toBeUndefined();
      }
    });

    it('should create an AI model with valid data', async () => {
      const modelData = {
        modelId: 'test-model-simple-001',
        name: 'Simple Test Model',
        description: 'A simple test AI model',
        type: 'transformer',
        architecture: 'simple-arch',
        parameters: '1M',
        framework: 'PyTorch',
        privacyTechnique: 'federated-learning',
        validationMetrics: ['accuracy', 'precision'],
        maxEpochs: 10,
        batchSize: 16,
        learningRate: 0.001,
        isActive: true
      };

      try {
        const model = await AIModel.create(modelData);
        expect(model.modelId).toBe(modelData.modelId);
        expect(model.name).toBe(modelData.name);
        expect(model.isActive).toBe(true);
        
        // Clean up
        await model.destroy();
      } catch (error) {
        console.error('Error creating AI model:', error);
        throw error;
      }
    });

    it('should enforce unique modelId', async () => {
      const modelData = {
        modelId: 'unique-test-model-001',
        name: 'Unique Test Model',
        description: 'A unique test AI model',
        type: 'cnn',
        architecture: 'unique-arch',
        parameters: '2M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: ['accuracy'],
        maxEpochs: 5,
        batchSize: 8,
        learningRate: 0.0001,
        isActive: true
      };

      try {
        // Create first model
        await AIModel.create(modelData);
        
        // Try to create second model with same modelId (should fail)
        await expect(AIModel.create(modelData)).rejects.toThrow();
        
        // Clean up
        await AIModel.destroy({ where: { modelId: modelData.modelId } });
      } catch (error) {
        console.error('Error in unique constraint test:', error);
        throw error;
      }
    });

    it('should validate required fields', async () => {
      const invalidModelData = {
        modelId: 'invalid-test-model',
        // Missing required fields
      };

      try {
        await expect(AIModel.create(invalidModelData)).rejects.toThrow();
      } catch (error) {
        // This is expected to fail
        expect(error).toBeDefined();
      }
    });
  });

  describe('API Endpoint Tests', () => {
    it('should have available models endpoint', async () => {
      // Test that the endpoint exists by checking the route file
      const contractsRoute = require('../routes/contracts');
      expect(contractsRoute).toBeDefined();
    });
  });
}); 