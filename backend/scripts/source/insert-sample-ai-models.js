const { AIModel } = require('../models');

async function insertSampleAIModels() {
  const models = [
    {
      modelId: 'transformer-gpt-4',
      name: 'Transformer GPT-4',
      description: 'Large language model for NLP tasks',
      type: 'transformer',
      architecture: 'gpt-4',
      parameters: '175B',
      framework: 'PyTorch',
      privacyTechnique: 'none',
      validationMetrics: JSON.stringify(['accuracy', 'f1-score']),
      maxEpochs: 10,
      batchSize: 32,
      learningRate: 0.0001,
      isActive: true
    },
    {
      modelId: 'vision-resnet-101',
      name: 'ResNet-101',
      description: 'Deep residual network for image classification',
      type: 'cnn',
      architecture: 'resnet-101',
      parameters: '44M',
      framework: 'TensorFlow',
      privacyTechnique: 'none',
      validationMetrics: JSON.stringify(['accuracy', 'top-5-accuracy']),
      maxEpochs: 20,
      batchSize: 64,
      learningRate: 0.001,
      isActive: true
    },
    {
      modelId: 'tabular-xgboost',
      name: 'XGBoost Tabular',
      description: 'Gradient boosting for tabular data',
      type: 'other',
      architecture: 'xgboost',
      parameters: '10K',
      framework: 'Other',
      privacyTechnique: 'none',
      validationMetrics: JSON.stringify(['auc', 'accuracy']),
      maxEpochs: 100,
      batchSize: 256,
      learningRate: 0.05,
      isActive: true
    },
    {
      modelId: 'speech-wav2vec2',
      name: 'Wav2Vec 2.0',
      description: 'Self-supervised model for speech recognition',
      type: 'transformer',
      architecture: 'wav2vec2',
      parameters: '317M',
      framework: 'PyTorch',
      privacyTechnique: 'none',
      validationMetrics: JSON.stringify(['wer', 'cer']),
      maxEpochs: 30,
      batchSize: 16,
      learningRate: 0.0005,
      isActive: true
    }
  ];

  for (const model of models) {
    await AIModel.upsert(model, { where: { modelId: model.modelId } });
    console.log(`✅ Inserted/updated model: ${model.name}`);
  }
}

insertSampleAIModels()
  .then(() => {
    console.log('🎉 Sample AI models inserted successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error inserting AI models:', err);
    process.exit(1);
  }); 