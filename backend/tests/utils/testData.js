// Centralized test data utilities for creating and cleaning up test data
const { User, Contract, Dataset, Notification, AIModel } = require('../../models');
const jwt = require('jsonwebtoken');

// Test data tracking
const testDataTracker = {
  createdUsers: [],
  createdContracts: [],
  createdDatasets: [],
  createdNotifications: [],
  createdAIModels: []
};

// Create test user with tracking
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test${Date.now()}@example.com`,
    name: `Test User ${Date.now()}`,
    partyType: 'TDP',
    publicKey: 'test-public-key',
    did: 'did:web:github.com:testuser',
    didVerified: true
  };
  
  const user = await User.create({ ...defaultData, ...userData });
  testDataTracker.createdUsers.push(user.id);
  return user;
}

// Create test contract with tracking
async function createTestContract(contractData = {}) {
  const defaultData = {
    contractId: `TEST-CONTRACT-${Date.now()}`,
    status: 'DRAFT',
    price: 100.00,
    duration: 30,
    termsAndConditions: 'Test terms and conditions',
    tdpId: (await createTestUser()).id,
    tdcId: (await createTestUser()).id,
    ccrpId: (await createTestUser()).id,
    datasetId: (await createTestDataset()).id
  };
  
  const contract = await Contract.create({ ...defaultData, ...contractData });
  testDataTracker.createdContracts.push(contract.id);
  return contract;
}

// Create test dataset with tracking
async function createTestDataset(datasetData = {}) {
  const defaultData = {
    datasetId: `TEST-DATASET-${Date.now()}`,
    name: 'Test Dataset',
    description: 'Test dataset description',
    category: 'Computer Vision',
    size: 1000,
    recordCount: 10000,
    price: 50.00,
    license: 'MIT',
    ownerId: (await createTestUser()).id
  };
  
  const dataset = await Dataset.create({ ...defaultData, ...datasetData });
  testDataTracker.createdDatasets.push(dataset.id);
  return dataset;
}

// Create test notification with tracking
async function createTestNotification(notificationData = {}) {
  const defaultData = {
    userId: (await createTestUser()).id,
    type: 'CONTRACT_CREATED',
    title: 'Test Notification',
    message: 'Test notification message',
    isRead: false
  };
  
  const notification = await Notification.create({ ...defaultData, ...notificationData });
  testDataTracker.createdNotifications.push(notification.id);
  return notification;
}

// Create test AI model with tracking
async function createTestAIModel(modelData = {}) {
  const defaultData = {
    modelId: `TEST-MODEL-${Date.now()}`,
    name: 'Test AI Model',
    description: 'Test AI model description',
    type: 'cnn',
    architecture: 'test-cnn-arch',
    parameters: '2M',
    framework: 'TensorFlow',
    privacyTechnique: 'differential-privacy',
    validationMetrics: ['accuracy'],
    maxEpochs: 5,
    batchSize: 8,
    learningRate: 0.01,
    isActive: true
  };
  
  const model = await AIModel.create({ ...defaultData, ...modelData });
  testDataTracker.createdAIModels.push(model.id);
  return model;
}

// Generate auth token for a user
function generateAuthToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.partyType },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

// Clean up all test data
async function cleanupAllTestData() {
  await Notification.destroy({ where: {} });
  await Contract.destroy({ where: {} });
  await Dataset.destroy({ where: {} });
  await AIModel.destroy({ where: {} });
  await User.destroy({ where: {} });
  
  // Clear tracking
  testDataTracker.createdUsers = [];
  testDataTracker.createdContracts = [];
  testDataTracker.createdDatasets = [];
  testDataTracker.createdNotifications = [];
  testDataTracker.createdAIModels = [];
}

// Get test data tracker
function getTestDataTracker() {
  return testDataTracker;
}

module.exports = {
  createTestUser,
  createTestContract,
  createTestDataset,
  createTestNotification,
  createTestAIModel,
  generateAuthToken,
  cleanupAllTestData,
  getTestDataTracker
}; 