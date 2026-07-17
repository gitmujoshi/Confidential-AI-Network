const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

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

async function createSampleModels() {
  try {
    console.log('🤖 Creating sample AI models...');
    const now = new Date();
    const models = [
      {
        modelId: 'gpt-4',
        name: 'GPT-4 Transformer',
        description: 'Large language model for NLP tasks',
        type: 'transformer',
        architecture: 'decoder-only',
        parameters: '175B',
        framework: 'PyTorch',
        privacyTechnique: 'federated-learning',
        validationMetrics: JSON.stringify(['accuracy', 'f1']),
        maxEpochs: 10,
        batchSize: 32,
        learningRate: 0.0001,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        modelId: 'resnet50',
        name: 'ResNet-50',
        description: 'Image classification CNN',
        type: 'cnn',
        architecture: 'resnet',
        parameters: '25M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: JSON.stringify(['accuracy']),
        maxEpochs: 20,
        batchSize: 64,
        learningRate: 0.001,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        modelId: 'lstm-seq',
        name: 'LSTM Sequence Model',
        description: 'RNN for sequence prediction',
        type: 'rnn',
        architecture: 'lstm',
        parameters: '2M',
        framework: 'TensorFlow',
        privacyTechnique: 'homomorphic-encryption',
        validationMetrics: JSON.stringify(['accuracy', 'recall']),
        maxEpochs: 15,
        batchSize: 16,
        learningRate: 0.002,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const model of models) {
      await sequelize.query(
        `INSERT INTO ai_models ("modelId", name, description, type, architecture, parameters, framework, "privacyTechnique", "validationMetrics", "maxEpochs", "batchSize", "learningRate", "isActive", "createdAt", "updatedAt")
         VALUES (:modelId, :name, :description, :type, :architecture, :parameters, :framework, :privacyTechnique, :validationMetrics::jsonb, :maxEpochs, :batchSize, :learningRate, :isActive, :createdAt, :updatedAt)
         ON CONFLICT ("modelId") DO NOTHING`,
        { replacements: model }
      );
      console.log(`✅ Created model: ${model.name}`);
    }
    await sequelize.close();
    console.log('🎉 Sample AI models created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample models:', error);
    process.exit(1);
  }
}

createSampleModels(); 