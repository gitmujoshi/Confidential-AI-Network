/**
 * TDC (Training Data Consumer) Attribute Constraints
 * 
 * This file defines all the constrained values for TDC attributes including AI models
 * to ensure consistency and prevent invalid data entry.
 */

// AI Model Types
export const AI_MODEL_TYPES = [
  {
    value: 'transformer',
    label: 'Transformer',
    description: 'Attention-based neural network architecture',
    icon: '🔄',
    category: 'nlp',
    complexity: 'high',
    useCases: ['Language Processing', 'Translation', 'Text Generation']
  },
  {
    value: 'cnn',
    label: 'Convolutional Neural Network (CNN)',
    description: 'Deep learning model for image and video processing',
    icon: '🖼️',
    category: 'computer-vision',
    complexity: 'medium',
    useCases: ['Image Classification', 'Object Detection', 'Image Segmentation']
  },
  {
    value: 'rnn',
    label: 'Recurrent Neural Network (RNN)',
    description: 'Sequential data processing neural network',
    icon: '🔄',
    category: 'sequence',
    complexity: 'medium',
    useCases: ['Time Series', 'Speech Recognition', 'Language Modeling']
  },
  {
    value: 'gan',
    label: 'Generative Adversarial Network (GAN)',
    description: 'Generative model with competing networks',
    icon: '🎨',
    category: 'generative',
    complexity: 'very-high',
    useCases: ['Image Generation', 'Data Augmentation', 'Synthetic Data']
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Custom or specialized model architecture',
    icon: '⚙️',
    category: 'custom',
    complexity: 'variable',
    useCases: ['Custom Applications', 'Research', 'Specialized Tasks']
  }
];

// AI Model Architectures
export const AI_MODEL_ARCHITECTURES = [
  // Transformer Architectures
  {
    value: 'bert-base',
    label: 'BERT Base',
    description: 'Bidirectional Encoder Representations from Transformers (110M parameters)',
    type: 'transformer',
    parameters: '110M',
    framework: 'PyTorch',
    recommended: true
  },
  {
    value: 'bert-large',
    label: 'BERT Large',
    description: 'Large BERT model (340M parameters)',
    type: 'transformer',
    parameters: '340M',
    framework: 'PyTorch',
    recommended: false
  },
  {
    value: 'gpt-2',
    label: 'GPT-2',
    description: 'Generative Pre-trained Transformer 2 (1.5B parameters)',
    type: 'transformer',
    parameters: '1.5B',
    framework: 'PyTorch',
    recommended: true
  },
  {
    value: 'gpt-3',
    label: 'GPT-3',
    description: 'Generative Pre-trained Transformer 3 (175B parameters)',
    type: 'transformer',
    parameters: '175B',
    framework: 'PyTorch',
    recommended: false
  },
  {
    value: 't5-base',
    label: 'T5 Base',
    description: 'Text-to-Text Transfer Transformer (220M parameters)',
    type: 'transformer',
    parameters: '220M',
    framework: 'TensorFlow',
    recommended: true
  },
  
  // CNN Architectures
  {
    value: 'resnet-50',
    label: 'ResNet-50',
    description: 'Residual Neural Network with 50 layers (25M parameters)',
    type: 'cnn',
    parameters: '25M',
    framework: 'PyTorch',
    recommended: true
  },
  {
    value: 'resnet-101',
    label: 'ResNet-101',
    description: 'Residual Neural Network with 101 layers (44M parameters)',
    type: 'cnn',
    parameters: '44M',
    framework: 'PyTorch',
    recommended: false
  },
  {
    value: 'vgg-16',
    label: 'VGG-16',
    description: 'Visual Geometry Group 16-layer CNN (138M parameters)',
    type: 'cnn',
    parameters: '138M',
    framework: 'TensorFlow',
    recommended: false
  },
  {
    value: 'inception-v3',
    label: 'Inception v3',
    description: 'Inception architecture version 3 (24M parameters)',
    type: 'cnn',
    parameters: '24M',
    framework: 'TensorFlow',
    recommended: true
  },
  
  // RNN Architectures
  {
    value: 'lstm',
    label: 'LSTM',
    description: 'Long Short-Term Memory network',
    type: 'rnn',
    parameters: 'Variable',
    framework: 'PyTorch',
    recommended: true
  },
  {
    value: 'gru',
    label: 'GRU',
    description: 'Gated Recurrent Unit network',
    type: 'rnn',
    parameters: 'Variable',
    framework: 'PyTorch',
    recommended: true
  },
  
  // GAN Architectures
  {
    value: 'dcgan',
    label: 'DCGAN',
    description: 'Deep Convolutional GAN',
    type: 'gan',
    parameters: 'Variable',
    framework: 'PyTorch',
    recommended: true
  },
  {
    value: 'stylegan',
    label: 'StyleGAN',
    description: 'Style-based GAN for high-quality image generation',
    type: 'gan',
    parameters: 'Variable',
    framework: 'TensorFlow',
    recommended: false
  }
];

// AI Frameworks
export const AI_FRAMEWORKS = [
  {
    value: 'PyTorch',
    label: 'PyTorch',
    description: 'Facebook\'s deep learning framework',
    icon: '🔥',
    language: 'Python',
    popularity: 'high',
    features: ['Dynamic Graphs', 'Research Friendly', 'Pythonic']
  },
  {
    value: 'TensorFlow',
    label: 'TensorFlow',
    description: 'Google\'s machine learning platform',
    icon: '🧠',
    language: 'Python',
    popularity: 'high',
    features: ['Production Ready', 'Scalable', 'Multi-language']
  },
  {
    value: 'JAX',
    label: 'JAX',
    description: 'Google\'s high-performance machine learning library',
    icon: '⚡',
    language: 'Python',
    popularity: 'growing',
    features: ['JIT Compilation', 'Functional', 'NumPy Compatible']
  },
  {
    value: 'Other',
    label: 'Other',
    description: 'Custom or specialized framework',
    icon: '⚙️',
    language: 'Variable',
    popularity: 'variable',
    features: ['Custom Implementation', 'Specialized', 'Research']
  }
];

// Privacy Techniques for AI Models
export const AI_PRIVACY_TECHNIQUES = [
  {
    value: 'federated-learning',
    label: 'Federated Learning',
    description: 'Train models across decentralized data without sharing raw data',
    category: 'distributed',
    complexity: 'high',
    recommended: true,
    useCases: ['Healthcare', 'Finance', 'Mobile Devices']
  },
  {
    value: 'differential-privacy',
    label: 'Differential Privacy',
    description: 'Add mathematical noise to protect individual privacy',
    category: 'mathematical',
    complexity: 'medium',
    recommended: true,
    useCases: ['Statistics', 'Analytics', 'Research']
  },
  {
    value: 'homomorphic-encryption',
    label: 'Homomorphic Encryption',
    description: 'Compute on encrypted data without decryption',
    category: 'cryptographic',
    complexity: 'very-high',
    recommended: false,
    useCases: ['Secure Computation', 'Privacy-Preserving ML']
  },
  {
    value: 'secure-multi-party-computation',
    label: 'Secure Multi-Party Computation',
    description: 'Joint computation without revealing individual inputs',
    category: 'cryptographic',
    complexity: 'very-high',
    recommended: false,
    useCases: ['Collaborative ML', 'Privacy-Preserving Analytics']
  },
  {
    value: 'zero-knowledge-proofs',
    label: 'Zero-Knowledge Proofs',
    description: 'Prove knowledge without revealing the knowledge itself',
    category: 'cryptographic',
    complexity: 'very-high',
    recommended: false,
    useCases: ['Authentication', 'Verification', 'Privacy']
  },
  {
    value: 'none',
    label: 'No Privacy Technique',
    description: 'Standard training without privacy protection',
    category: 'none',
    complexity: 'low',
    recommended: false,
    useCases: ['Public Data', 'Non-Sensitive Applications']
  }
];

// Validation Metrics
export const VALIDATION_METRICS = [
  {
    value: 'accuracy',
    label: 'Accuracy',
    description: 'Percentage of correct predictions',
    category: 'classification',
    range: '0-1',
    higherIsBetter: true
  },
  {
    value: 'precision',
    label: 'Precision',
    description: 'True positives / (True positives + False positives)',
    category: 'classification',
    range: '0-1',
    higherIsBetter: true
  },
  {
    value: 'recall',
    label: 'Recall',
    description: 'True positives / (True positives + False negatives)',
    category: 'classification',
    range: '0-1',
    higherIsBetter: true
  },
  {
    value: 'f1-score',
    label: 'F1-Score',
    description: 'Harmonic mean of precision and recall',
    category: 'classification',
    range: '0-1',
    higherIsBetter: true
  },
  {
    value: 'mse',
    label: 'Mean Squared Error',
    description: 'Average squared difference between predicted and actual values',
    category: 'regression',
    range: '0-∞',
    higherIsBetter: false
  },
  {
    value: 'mae',
    label: 'Mean Absolute Error',
    description: 'Average absolute difference between predicted and actual values',
    category: 'regression',
    range: '0-∞',
    higherIsBetter: false
  },
  {
    value: 'rmse',
    label: 'Root Mean Squared Error',
    description: 'Square root of mean squared error',
    category: 'regression',
    range: '0-∞',
    higherIsBetter: false
  },
  {
    value: 'r2-score',
    label: 'R² Score',
    description: 'Coefficient of determination',
    category: 'regression',
    range: '-∞ to 1',
    higherIsBetter: true
  },
  {
    value: 'auc-roc',
    label: 'AUC-ROC',
    description: 'Area Under the ROC Curve',
    category: 'classification',
    range: '0-1',
    higherIsBetter: true
  },
  {
    value: 'bleu',
    label: 'BLEU Score',
    description: 'Bilingual Evaluation Understudy for text generation',
    category: 'nlp',
    range: '0-1',
    higherIsBetter: true
  }
];

// Training Parameters
export const TRAINING_PARAMETERS = {
  maxEpochs: {
    min: 1,
    max: 1000,
    default: 100,
    description: 'Maximum number of training epochs'
  },
  batchSize: {
    min: 1,
    max: 1024,
    default: 32,
    description: 'Number of samples per training batch'
  },
  learningRate: {
    min: 0.0001,
    max: 1.0,
    default: 0.001,
    description: 'Learning rate for optimization'
  },
  validationSplit: {
    min: 0.1,
    max: 0.5,
    default: 0.2,
    description: 'Fraction of data used for validation'
  }
};

// Model Complexity Levels
export const MODEL_COMPLEXITY_LEVELS = [
  {
    value: 'low',
    label: 'Low Complexity',
    description: 'Simple models with few parameters',
    parameters: '< 1M',
    trainingTime: '< 1 hour',
    memory: '< 2GB'
  },
  {
    value: 'medium',
    label: 'Medium Complexity',
    description: 'Moderate models with balanced performance',
    parameters: '1M - 100M',
    trainingTime: '1-24 hours',
    memory: '2-16GB'
  },
  {
    value: 'high',
    label: 'High Complexity',
    description: 'Complex models requiring significant resources',
    parameters: '100M - 1B',
    trainingTime: '1-7 days',
    memory: '16-64GB'
  },
  {
    value: 'very-high',
    label: 'Very High Complexity',
    description: 'State-of-the-art models with massive parameters',
    parameters: '> 1B',
    trainingTime: '> 7 days',
    memory: '> 64GB'
  }
];

// Use Case Categories
export const USE_CASE_CATEGORIES = [
  {
    value: 'computer-vision',
    label: 'Computer Vision',
    description: 'Image and video processing applications',
    icon: '🖼️',
    models: ['cnn', 'gan']
  },
  {
    value: 'natural-language-processing',
    label: 'Natural Language Processing',
    description: 'Text and language understanding applications',
    icon: '📝',
    models: ['transformer', 'rnn']
  },
  {
    value: 'speech-recognition',
    label: 'Speech Recognition',
    description: 'Audio and speech processing applications',
    icon: '🎤',
    models: ['rnn', 'transformer']
  },
  {
    value: 'recommendation-systems',
    label: 'Recommendation Systems',
    description: 'Personalized content and product recommendations',
    icon: '💡',
    models: ['other']
  },
  {
    value: 'time-series-forecasting',
    label: 'Time Series Forecasting',
    description: 'Predicting future values in time series data',
    icon: '📈',
    models: ['rnn', 'transformer']
  },
  {
    value: 'generative-modeling',
    label: 'Generative Modeling',
    description: 'Creating new content and synthetic data',
    icon: '🎨',
    models: ['gan', 'transformer']
  }
];

// Helper function to get model type info
export const getModelTypeInfo = (type) => {
  return AI_MODEL_TYPES.find(t => t.value === type) || null;
};

// Helper function to get architecture info
export const getArchitectureInfo = (architecture) => {
  return AI_MODEL_ARCHITECTURES.find(a => a.value === architecture) || null;
};

// Helper function to get frameworks by model type
export const getFrameworksByModelType = (modelType) => {
  const architectures = AI_MODEL_ARCHITECTURES.filter(a => a.type === modelType);
  const frameworks = [...new Set(architectures.map(a => a.framework))];
  return frameworks.map(f => AI_FRAMEWORKS.find(fw => fw.value === f)).filter(Boolean);
};

// Helper function to get recommended architectures by use case
export const getRecommendedArchitectures = (useCase) => {
  const category = USE_CASE_CATEGORIES.find(c => c.value === useCase);
  if (!category) return [];
  
  return AI_MODEL_ARCHITECTURES.filter(a => 
    category.models.includes(a.type) && a.recommended
  );
};

// Helper function to validate training parameters
export const validateTrainingParameters = (params) => {
  const errors = [];
  
  if (params.maxEpochs < TRAINING_PARAMETERS.maxEpochs.min || 
      params.maxEpochs > TRAINING_PARAMETERS.maxEpochs.max) {
    errors.push(`Max epochs must be between ${TRAINING_PARAMETERS.maxEpochs.min} and ${TRAINING_PARAMETERS.maxEpochs.max}`);
  }
  
  if (params.batchSize < TRAINING_PARAMETERS.batchSize.min || 
      params.batchSize > TRAINING_PARAMETERS.batchSize.max) {
    errors.push(`Batch size must be between ${TRAINING_PARAMETERS.batchSize.min} and ${TRAINING_PARAMETERS.batchSize.max}`);
  }
  
  if (params.learningRate < TRAINING_PARAMETERS.learningRate.min || 
      params.learningRate > TRAINING_PARAMETERS.learningRate.max) {
    errors.push(`Learning rate must be between ${TRAINING_PARAMETERS.learningRate.min} and ${TRAINING_PARAMETERS.learningRate.max}`);
  }
  
  return errors;
};

// Helper function to get complexity level by parameters
export const getComplexityLevel = (parameters) => {
  const paramCount = parseInt(parameters.replace(/[^\d]/g, ''));
  if (paramCount < 1000000) return 'low';
  if (paramCount < 100000000) return 'medium';
  if (paramCount < 1000000000) return 'high';
  return 'very-high';
};
