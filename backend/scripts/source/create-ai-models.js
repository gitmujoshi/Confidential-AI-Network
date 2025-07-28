const { AIModel } = require('../../models');

async function createAIModels() {
  console.log('🤖 Creating AI models...');
  
  try {
    const models = [
      {
        modelId: 'transformer-gpt-4',
        name: 'GPT-4 Transformer Model',
        description: 'Large language model for natural language processing',
        type: 'transformer',
        architecture: 'decoder-only',
        parameters: '175B',
        framework: 'PyTorch',
        privacyTechnique: 'federated-learning',
        validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
        maxEpochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        isActive: true
      },
      {
        modelId: 'bert-classifier',
        name: 'BERT Text Classifier',
        description: 'Bidirectional encoder for text classification tasks',
        type: 'transformer',
        architecture: 'encoder-only',
        parameters: '110M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: ['accuracy', 'f1-score', 'precision', 'recall'],
        maxEpochs: 50,
        batchSize: 16,
        learningRate: 0.0001,
        isActive: true
      },
      {
        modelId: 'cnn-image-classifier',
        name: 'CNN Image Classifier',
        description: 'Convolutional neural network for image classification',
        type: 'cnn',
        architecture: 'resnet-50',
        parameters: '25M',
        framework: 'PyTorch',
        privacyTechnique: 'homomorphic-encryption',
        validationMetrics: ['accuracy', 'top-5-accuracy', 'precision', 'recall'],
        maxEpochs: 200,
        batchSize: 64,
        learningRate: 0.01,
        isActive: true
      },
      {
        modelId: 'lstm-sequence-model',
        name: 'LSTM Sequence Model',
        description: 'Long short-term memory for sequence prediction',
        type: 'rnn',
        architecture: 'lstm',
        parameters: '10M',
        framework: 'TensorFlow',
        privacyTechnique: 'secure-multi-party-computation',
        validationMetrics: ['accuracy', 'perplexity', 'bleu-score'],
        maxEpochs: 150,
        batchSize: 128,
        learningRate: 0.001,
        isActive: true
      },
      {
        modelId: 'gan-generative-model',
        name: 'GAN Generative Model',
        description: 'Generative adversarial network for image generation',
        type: 'gan',
        architecture: 'dcgan',
        parameters: '15M',
        framework: 'PyTorch',
        privacyTechnique: 'federated-learning',
        validationMetrics: ['fid-score', 'inception-score', 'diversity'],
        maxEpochs: 300,
        batchSize: 32,
        learningRate: 0.0002,
        isActive: true
      }
    ];

    for (const modelData of models) {
      const model = await AIModel.create(modelData);
      console.log(`✅ Created AI model: ${model.name} (${model.modelId})`);
    }

    console.log('🎉 AI models creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating AI models:', error);
  } finally {
    process.exit(0);
  }
}

createAIModels(); 