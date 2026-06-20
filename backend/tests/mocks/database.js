// Mock database models for testing
const mockUsers = new Map(); // Track created users

const mockModels = {
  User: {
    create: jest.fn().mockImplementation((userData) => {
      const user = {
        id: Date.now(), // Unique ID
        ...userData,
        isActive: true,
        isRegistered: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockUsers.set(userData.email.toLowerCase(), user);
      return Promise.resolve(user);
    }),
    findOne: jest.fn().mockImplementation((query) => {
      if (query && query.where && query.where.email) {
        const email = query.where.email.toLowerCase();
        const user = mockUsers.get(email);
        return Promise.resolve(user || null);
      }
      return Promise.resolve(null);
    }),
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      partyType: 'TDP',
      isActive: true,
      isRegistered: true,
      walletAddress: '0x1234567890123456789012345678901234567890'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  },
  Dataset: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      datasetId: 'test-dataset',
      name: 'Test Dataset',
      description: 'Test dataset for testing',
      category: 'Tabular',
      size: 1000,
      recordCount: 10000,
      price: 100.00,
      license: 'MIT',
      ownerId: 1,
      isPublic: true,
      isActive: true
    }),
    findOne: jest.fn().mockResolvedValue({
      id: 1,
      datasetId: 'test-dataset',
      name: 'Test Dataset',
      description: 'Test dataset for testing',
      category: 'Tabular',
      size: 1000,
      recordCount: 10000,
      price: 100.00,
      license: 'MIT',
      ownerId: 1,
      isPublic: true,
      isActive: true
    }),
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      datasetId: 'test-dataset',
      name: 'Test Dataset',
      description: 'Test dataset for testing',
      category: 'Tabular',
      size: 1000,
      recordCount: 10000,
      price: 100.00,
      license: 'MIT',
      ownerId: 1,
      isPublic: true,
      isActive: true
    }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  },
  Contract: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      contractId: 'TEST-CONTRACT-001',
      title: 'Test Contract',
      description: 'Test contract for testing',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      status: 'DRAFT',
      tdcId: 1,
      datasetId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findOne: jest.fn().mockResolvedValue({
      id: 1,
      contractId: 'TEST-CONTRACT-001',
      title: 'Test Contract',
      description: 'Test contract for testing',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      status: 'DRAFT',
      tdcId: 1,
      datasetId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findByPk: jest.fn().mockResolvedValue({
      id: 1,
      contractId: 'TEST-CONTRACT-001',
      title: 'Test Contract',
      description: 'Test contract for testing',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      status: 'DRAFT',
      tdcId: 1,
      datasetId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  },
  ContractDataset: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      contractId: 1,
      datasetId: 1,
      tdpId: 1,
      datasetName: 'Test Dataset',
      tdpName: 'Test TDP',
      individualPrice: 100.00,
      paymentStatus: 'PENDING'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  },
  ScittClaim: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      claimId: 'mock-claim-id',
      contractId: 1,
      status: 'ACTIVE',
      data: 'mock-claim-data',
      createdAt: new Date()
    }),
    findOne: jest.fn().mockResolvedValue({
      id: 1,
      claimId: 'mock-claim-id',
      contractId: 1,
      status: 'ACTIVE',
      data: 'mock-claim-data',
      createdAt: new Date()
    }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  },
  Notification: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      type: 'CONTRACT_UPDATE',
      message: 'Test notification',
      isRead: false,
      createdAt: new Date()
    }),
    findAll: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
};

// Mock Sequelize
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  transaction: jest.fn().mockImplementation(async (callback) => {
    return await callback();
  })
};

// Mock database index
const mockDb = {
  ...mockModels,
  sequelize: mockSequelize,
  // Add any other database properties that might be needed
  AuditLog: mockModels.User, // Reuse mock for other models
  AIModel: mockModels.User,
  TSPAzureCredentials: mockModels.User,
  TSPCloudCredentials: mockModels.User,
  Consent: mockModels.User,
  ContractTemplate: mockModels.User,
  DataBreach: mockModels.User,
  DataProcessingRecord: mockModels.User,
  EnvironmentCost: mockModels.User,
  EnvironmentResource: mockModels.User,
  Grievance: mockModels.User,
  MerkleTree: mockModels.User,
  PrivacyBudget: mockModels.User,
  PrivacyBudgetLog: mockModels.User,
  PrivacyOperationsLog: mockModels.User,
  ProvenanceCapture: mockModels.User,
  ProvenanceNode: mockModels.User,
  ProvenanceVerification: mockModels.User,
  SystemHealthLog: mockModels.User,
  TrainingEnvironment: mockModels.User,
  TrainingJob: mockModels.User
};

module.exports = {
  mockModels,
  mockSequelize,
  mockDb
};
