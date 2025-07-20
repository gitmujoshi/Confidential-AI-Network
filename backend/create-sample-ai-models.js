/**
 * Create Sample AI Models Script
 * 
 * This script creates a comprehensive set of AI models for different use cases
 * including privacy-preserving models, large language models, and specialized models.
 */

const db = require('./models');

const sampleModels = [
  // Privacy-Preserving Models
  {
    modelId: 'privacy-bert-001',
    name: 'Privacy-Preserving BERT',
    description: 'BERT model with differential privacy for text classification',
    type: 'transformer',
    architecture: 'BERT-Base',
    parameters: '110M',
    framework: 'PyTorch',
    privacyTechnique: 'differential-privacy',
    validationMetrics: ['accuracy', 'f1-score', 'privacy-loss'],
    maxEpochs: 10,
    batchSize: 16,
    learningRate: '0.0001',
    metadata: {
      privacyEpsilon: 0.1,
      privacyDelta: 1e-5,
      noiseScale: 0.01
    }
  },
  {
    modelId: 'federated-cnn-001',
    name: 'Federated Learning CNN',
    description: 'Convolutional Neural Network for federated learning on medical images',
    type: 'cnn',
    architecture: 'ResNet-50',
    parameters: '25M',
    framework: 'TensorFlow',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'precision', 'recall'],
    maxEpochs: 50,
    batchSize: 32,
    learningRate: '0.001',
    metadata: {
      federatedRounds: 100,
      clientParticipation: 0.8,
      aggregationMethod: 'fedavg'
    }
  },
  {
    modelId: 'secure-mpc-gan-001',
    name: 'Secure MPC GAN',
    description: 'Generative Adversarial Network with Secure Multi-Party Computation',
    type: 'gan',
    architecture: 'DCGAN',
    parameters: '15M',
    framework: 'PyTorch',
    privacyTechnique: 'secure-multi-party-computation',
    validationMetrics: ['fid-score', 'inception-score', 'privacy-preservation'],
    maxEpochs: 200,
    batchSize: 64,
    learningRate: '0.0002',
    metadata: {
      mpcProtocol: 'shamir-secret-sharing',
      threshold: 3,
      parties: 5
    }
  },

  // Large Language Models
  {
    modelId: 'llm-gpt-001',
    name: 'GPT-3 Style Model',
    description: 'Large language model for text generation and completion',
    type: 'transformer',
    architecture: 'GPT-3',
    parameters: '175B',
    framework: 'PyTorch',
    privacyTechnique: 'none',
    validationMetrics: ['perplexity', 'bleu-score', 'rouge-score'],
    maxEpochs: 100,
    batchSize: 8,
    learningRate: '0.00001',
    metadata: {
      contextLength: 2048,
      vocabSize: 50257,
      attentionHeads: 96
    }
  },
  {
    modelId: 'llm-bert-002',
    name: 'BERT Large Model',
    description: 'Bidirectional Encoder Representations from Transformers for NLP tasks',
    type: 'transformer',
    architecture: 'BERT-Large',
    parameters: '340M',
    framework: 'TensorFlow',
    privacyTechnique: 'none',
    validationMetrics: ['accuracy', 'f1-score', 'exact-match'],
    maxEpochs: 3,
    batchSize: 16,
    learningRate: '0.00002',
    metadata: {
      maxSequenceLength: 512,
      hiddenSize: 1024,
      numLayers: 24
    }
  },

  // Computer Vision Models
  {
    modelId: 'cv-resnet-001',
    name: 'ResNet-101 for Image Classification',
    description: 'Deep residual network for image classification tasks',
    type: 'cnn',
    architecture: 'ResNet-101',
    parameters: '44M',
    framework: 'PyTorch',
    privacyTechnique: 'none',
    validationMetrics: ['top-1-accuracy', 'top-5-accuracy'],
    maxEpochs: 90,
    batchSize: 32,
    learningRate: '0.1',
    metadata: {
      inputSize: '224x224',
      numClasses: 1000,
      pretrained: true
    }
  },
  {
    modelId: 'cv-yolo-001',
    name: 'YOLO v5 Object Detection',
    description: 'Real-time object detection model for computer vision',
    type: 'cnn',
    architecture: 'YOLO-v5',
    parameters: '7M',
    framework: 'PyTorch',
    privacyTechnique: 'none',
    validationMetrics: ['mAP', 'precision', 'recall'],
    maxEpochs: 300,
    batchSize: 16,
    learningRate: '0.01',
    metadata: {
      inputSize: '640x640',
      numClasses: 80,
      anchors: 3
    }
  },

  // Time Series Models
  {
    modelId: 'ts-lstm-001',
    name: 'LSTM for Time Series Prediction',
    description: 'Long Short-Term Memory network for time series forecasting',
    type: 'rnn',
    architecture: 'LSTM',
    parameters: '2M',
    framework: 'TensorFlow',
    privacyTechnique: 'differential-privacy',
    validationMetrics: ['mse', 'mae', 'rmse'],
    maxEpochs: 100,
    batchSize: 32,
    learningRate: '0.001',
    metadata: {
      sequenceLength: 50,
      hiddenUnits: 128,
      numLayers: 2
    }
  },
  {
    modelId: 'ts-transformer-001',
    name: 'Transformer for Time Series',
    description: 'Transformer model adapted for time series forecasting',
    type: 'transformer',
    architecture: 'TimeSeries-Transformer',
    parameters: '5M',
    framework: 'PyTorch',
    privacyTechnique: 'none',
    validationMetrics: ['mse', 'mae', 'rmse'],
    maxEpochs: 50,
    batchSize: 64,
    learningRate: '0.0001',
    metadata: {
      sequenceLength: 100,
      attentionHeads: 8,
      numLayers: 6
    }
  },

  // Healthcare Models
  {
    modelId: 'health-xray-001',
    name: 'X-Ray Classification Model',
    description: 'CNN model for chest X-ray classification with privacy preservation',
    type: 'cnn',
    architecture: 'DenseNet-121',
    parameters: '7M',
    framework: 'TensorFlow',
    privacyTechnique: 'federated-learning',
    validationMetrics: ['accuracy', 'sensitivity', 'specificity'],
    maxEpochs: 100,
    batchSize: 16,
    learningRate: '0.001',
    metadata: {
      inputSize: '224x224',
      numClasses: 14,
      dataType: 'chest-xray'
    }
  },
  {
    modelId: 'health-ecg-001',
    name: 'ECG Analysis Model',
    description: 'Deep learning model for ECG signal analysis and arrhythmia detection',
    type: 'cnn',
    architecture: '1D-CNN',
    parameters: '1M',
    framework: 'PyTorch',
    privacyTechnique: 'differential-privacy',
    validationMetrics: ['accuracy', 'f1-score', 'auc'],
    maxEpochs: 200,
    batchSize: 32,
    learningRate: '0.001',
    metadata: {
      signalLength: 1000,
      numClasses: 5,
      samplingRate: 500
    }
  },

  // Financial Models
  {
    modelId: 'finance-lstm-001',
    name: 'Financial Time Series LSTM',
    description: 'LSTM model for stock price prediction and financial forecasting',
    type: 'rnn',
    architecture: 'LSTM',
    parameters: '3M',
    framework: 'TensorFlow',
    privacyTechnique: 'secure-multi-party-computation',
    validationMetrics: ['mse', 'mae', 'rmse'],
    maxEpochs: 150,
    batchSize: 64,
    learningRate: '0.001',
    metadata: {
      sequenceLength: 60,
      hiddenUnits: 256,
      numLayers: 3
    }
  },
  {
    modelId: 'finance-transformer-001',
    name: 'Financial Transformer',
    description: 'Transformer model for financial data analysis and prediction',
    type: 'transformer',
    architecture: 'Financial-Transformer',
    parameters: '10M',
    framework: 'PyTorch',
    privacyTechnique: 'none',
    validationMetrics: ['mse', 'mae', 'rmse'],
    maxEpochs: 100,
    batchSize: 32,
    learningRate: '0.0001',
    metadata: {
      sequenceLength: 100,
      attentionHeads: 12,
      numLayers: 8
    }
  }
];

async function createSampleModels() {
  try {
    console.log('🚀 Creating sample AI models...');
    
    for (const modelData of sampleModels) {
      // Check if model already exists
      const existingModel = await db.AIModel.findOne({
        where: { modelId: modelData.modelId }
      });

      if (existingModel) {
        console.log(`⚠️  Model ${modelData.modelId} already exists, skipping...`);
        continue;
      }

      // Create the model
      const model = await db.AIModel.create(modelData);
      console.log(`✅ Created model: ${model.name} (${model.modelId})`);
    }

    console.log('🎉 Sample AI models created successfully!');
    
    // Get total count
    const totalModels = await db.AIModel.count();
    console.log(`📊 Total AI models in database: ${totalModels}`);
    
  } catch (error) {
    console.error('❌ Error creating sample models:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createSampleModels()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSampleModels }; 