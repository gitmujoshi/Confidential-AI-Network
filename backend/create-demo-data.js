const { User, AIModel, Dataset, Contract } = require('./models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate GUIDs with type prefixes
function generateGuid() {
    return uuidv4();
}

function generateTdpId() {
    return `TDP-${generateGuid()}`;
}

function generateTdcId() {
    return `TDC-${generateGuid()}`;
}

function generateCcrpId() {
    return `CCRP-${generateGuid()}`;
}

function generateDatasetId() {
    return `DATASET-${generateGuid()}`;
}

function generateContractId() {
    return `CONTRACT-${generateGuid()}`;
}

function generateModelId() {
    return `MODEL-${generateGuid()}`;
}

function generateUniqueEmail(prefix) {
    return `${prefix}-${generateGuid().substring(0, 8)}@example.com`;
}

async function cleanupExistingData() {
  try {
    console.log('🧹 Cleaning up existing demo data...');
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await AIModel.destroy({ where: {} });
    await User.destroy({ 
      where: { 
        email: {
          [require('sequelize').Op.like]: '%@example.com'
        }
      } 
    });
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function createDemoData() {
  try {
    console.log('🚀 Creating demo data for all roles...');
    
    // Clean up existing demo data first
    await cleanupExistingData();
    
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();

    // --- USERS ---
    // AppAdmin
    const appAdmin = await User.create({
      name: 'Alice Admin',
      email: generateUniqueEmail('appadmin'),
      password: passwordHash,
      partyType: 'AppAdmin',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });

    // TDPs
    const tdp1 = await User.create({
      name: 'TDP One',
      email: generateUniqueEmail('tdp1'),
      password: passwordHash,
      partyType: 'TDP',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });
    const tdp2 = await User.create({
      name: 'TDP Two',
      email: generateUniqueEmail('tdp2'),
      password: passwordHash,
      partyType: 'TDP',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });

    // TDCs
    const tdc1 = await User.create({
      name: 'TDC One',
      email: generateUniqueEmail('tdc1'),
      password: passwordHash,
      partyType: 'TDC',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });
    const tdc2 = await User.create({
      name: 'TDC Two',
      email: generateUniqueEmail('tdc2'),
      password: passwordHash,
      partyType: 'TDC',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });

    // CCRPs
    const ccrp1 = await User.create({
      name: 'CCRP One',
      email: generateUniqueEmail('ccrp1'),
      password: passwordHash,
      partyType: 'CCRP',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });
    const ccrp2 = await User.create({
      name: 'CCRP Two',
      email: generateUniqueEmail('ccrp2'),
      password: passwordHash,
      partyType: 'CCRP',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED',
      registrationDate: now
    });

    // --- AI MODELS ---
    const model1 = await AIModel.create({
      modelId: generateModelId(),
      name: 'VisionNet',
      description: 'Image classification model',
      type: 'cnn',
      architecture: 'ResNet-50',
      parameters: JSON.stringify({ layers: 50 }),
      framework: 'TensorFlow',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy', 'precision'],
      maxEpochs: 20,
      batchSize: 64,
      learningRate: 0.001,
      isActive: true,
      ownerId: tdp1.id
    });
    const model2 = await AIModel.create({
      modelId: generateModelId(),
      name: 'TextGen',
      description: 'Text generation model',
      type: 'transformer',
      architecture: 'GPT-2',
      parameters: JSON.stringify({ layers: 12 }),
      framework: 'PyTorch',
      privacyTechnique: 'federated-learning',
      validationMetrics: ['perplexity'],
      maxEpochs: 10,
      batchSize: 32,
      learningRate: 0.0005,
      isActive: true,
      ownerId: tdp2.id
    });
    const model3 = await AIModel.create({
      modelId: generateModelId(),
      name: 'TabularPro',
      description: 'Tabular data regression model',
      type: 'other',
      architecture: '3-layer MLP',
      parameters: JSON.stringify({ layers: 3 }),
      framework: 'Other',
      privacyTechnique: 'none',
      validationMetrics: ['rmse'],
      maxEpochs: 15,
      batchSize: 128,
      learningRate: 0.01,
      isActive: true,
      ownerId: tdp1.id
    });

    // --- DATASETS ---
    const ds1 = await Dataset.create({
      datasetId: generateDatasetId(),
      name: 'Vision Images',
      description: 'Labeled images for computer vision',
      category: 'Computer Vision',
      size: 2048,
      recordCount: 100000,
      price: 5000,
      license: 'Commercial',
      isPublic: true,
      isActive: true,
      ownerId: tdp1.id,
      metadata: { dataType: 'image', privacyLevel: 'high' }
    });
    const ds2 = await Dataset.create({
      datasetId: generateDatasetId(),
      name: 'NLP Texts',
      description: 'Text data for NLP tasks',
      category: 'Natural Language Processing',
      size: 1024,
      recordCount: 50000,
      price: 3000,
      license: 'Academic',
      isPublic: true,
      isActive: true,
      ownerId: tdp2.id,
      metadata: { dataType: 'text', privacyLevel: 'medium' }
    });
    const ds3 = await Dataset.create({
      datasetId: generateDatasetId(),
      name: 'Tabular Data',
      description: 'Structured tabular data',
      category: 'Tabular',
      size: 512,
      recordCount: 20000,
      price: 2000,
      license: 'Open',
      isPublic: true,
      isActive: true,
      ownerId: tdp1.id,
      metadata: { dataType: 'tabular', privacyLevel: 'low' }
    });

    // --- CONTRACTS ---
    await Contract.create({
      contractId: generateContractId(),
      price: 5000,
      duration: 30,
      termsAndConditions: 'Standard contract terms.',
      status: 'SIGNED',
      tdpId: tdp1.id,
      tdcId: tdc1.id,
      ccrpId: ccrp1.id,
      datasetId: ds1.id,
      primaryDatasetId: ds1.id,
      primaryTdpId: tdp1.id,
      trainingParams: { epochs: 10, batchSize: 64 },
      environmentSpecs: { cpu: '8 cores', memory: '32GB' }
    });
    await Contract.create({
      contractId: generateContractId(),
      price: 3000,
      duration: 20,
      termsAndConditions: 'Standard contract terms.',
      status: 'SIGNED',
      tdpId: tdp2.id,
      tdcId: tdc2.id,
      ccrpId: ccrp2.id,
      datasetId: ds2.id,
      primaryDatasetId: ds2.id,
      primaryTdpId: tdp2.id,
      trainingParams: { epochs: 5, batchSize: 32 },
      environmentSpecs: { cpu: '4 cores', memory: '16GB' }
    });
    await Contract.create({
      contractId: generateContractId(),
      price: 2000,
      duration: 15,
      termsAndConditions: 'Standard contract terms.',
      status: 'SIGNED',
      tdpId: tdp1.id,
      tdcId: tdc2.id,
      ccrpId: ccrp1.id,
      datasetId: ds3.id,
      primaryDatasetId: ds3.id,
      primaryTdpId: tdp1.id,
      trainingParams: { epochs: 8, batchSize: 128 },
      environmentSpecs: { cpu: '2 cores', memory: '8GB' }
    });

    console.log('✅ Demo data created!');
    console.log('📧 Generated unique emails for all users');
    console.log('🔑 All users have password: password123');
    console.log('📊 Created 3 AI models, 3 datasets, and 3 contracts');
    console.log('👥 Created users for all roles: AppAdmin, TDP, TDC, CCRP');
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  }
}

createDemoData(); 