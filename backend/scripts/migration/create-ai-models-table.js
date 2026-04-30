const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });
const DEPAIdService = require('../../services/depaIdService');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: console.log
  }
);

async function createAIModelsTable() {
  try {
    console.log('🤖 Creating AI models table...');
    const depaIdService = new DEPAIdService();
    
    // Create the AI models table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        "modelId" VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('transformer', 'cnn', 'rnn', 'gan', 'other')),
        architecture VARCHAR(255) NOT NULL,
        parameters VARCHAR(50) NOT NULL,
        framework VARCHAR(50) NOT NULL CHECK (framework IN ('PyTorch', 'TensorFlow', 'JAX', 'Other')),
        "privacyTechnique" VARCHAR(100) NOT NULL CHECK ("privacyTechnique" IN ('federated-learning', 'differential-privacy', 'homomorphic-encryption', 'secure-multi-party-computation', 'zero-knowledge-proofs', 'none')),
        "validationMetrics" JSONB NOT NULL,
        "maxEpochs" INTEGER NOT NULL,
        "batchSize" INTEGER NOT NULL,
        "learningRate" DECIMAL(10,6) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        metadata JSONB,
        depa_id VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(type);
      CREATE INDEX IF NOT EXISTS idx_ai_models_framework ON ai_models(framework);
      CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models("isActive");
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_models_depa_id ON ai_models(depa_id) WHERE depa_id IS NOT NULL;
    `);
    
    console.log('✅ AI models table created successfully');
    
    // Test the table by inserting a sample model
    const sampleModel = {
      modelId: 'test-model',
      name: 'Test AI Model',
      description: 'A test AI model for validation',
      type: 'transformer',
      architecture: 'test-arch',
      parameters: '1M',
      framework: 'PyTorch',
      privacyTechnique: 'federated-learning',
      validationMetrics: ['accuracy', 'precision'],
      maxEpochs: 10,
      batchSize: 16,
      learningRate: 0.001,
      isActive: true
    };
    
    await sequelize.query(`
      INSERT INTO ai_models ("modelId", name, description, type, architecture, parameters, framework, "privacyTechnique", "validationMetrics", "maxEpochs", "batchSize", "learningRate", "isActive", depa_id, "createdAt", "updatedAt")
      VALUES (:modelId, :name, :description, :type, :architecture, :parameters, :framework, :privacyTechnique, :validationMetrics::jsonb, :maxEpochs, :batchSize, :learningRate, :isActive, :depaId, NOW(), NOW())
      ON CONFLICT ("modelId") DO NOTHING
    `, {
      replacements: {
        ...sampleModel,
        validationMetrics: JSON.stringify(sampleModel.validationMetrics),
        depaId: depaIdService.generateDEPAId('AIMODEL'),
      }
    });
    
    console.log('✅ Sample model inserted successfully');
    
  } catch (error) {
    console.error('❌ Error creating AI models table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
createAIModelsTable()
  .then(() => {
    console.log('🎉 AI models table migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 