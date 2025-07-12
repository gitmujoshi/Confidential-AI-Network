const { User, Contract, Dataset, Notification } = require('../models');
const { sequelize } = require('../models');

describe('Database Models Test Suite', () => {
  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await Notification.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        partyType: 'TDP',
        publicKey: 'test-public-key',
        did: 'did:web:github.com:testuser',
        didVerified: true
      };

      const user = await User.create(userData);
      
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.partyType).toBe(userData.partyType);
      expect(user.publicKey).toBe(userData.publicKey);
      expect(user.did).toBe(userData.did);
      expect(user.didVerified).toBe(userData.didVerified);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const user1 = await User.create({
        email: 'duplicate@example.com',
        name: 'User 1',
        partyType: 'TDP'
      });

      const duplicateUser = {
        email: 'duplicate@example.com',
        name: 'User 2',
        partyType: 'TDC'
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    it('should validate partyType enum values', async () => {
      const invalidUser = {
        email: 'invalid@example.com',
        name: 'Invalid User',
        partyType: 'INVALID_TYPE'
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        name: 'Invalid User',
        partyType: 'TDP'
      };

      await expect(User.create(invalidUser)).rejects.toThrow();
    });

    it('should allow optional fields to be null', async () => {
      const minimalUser = {
        email: 'minimal@example.com',
        name: 'Minimal User',
        partyType: 'TDC'
      };

      const user = await User.create(minimalUser);
      
      expect(user.publicKey).toBeNull();
      expect(user.did).toBeNull();
      expect(user.walletAddress).toBeNull();
      expect(user.description).toBeNull();
    });
  });

      describe('Contract Model', () => {
      let testUser, testDataset;

      beforeEach(async () => {
        testUser = await User.create({
          email: 'contract@example.com',
          name: 'Contract User',
          partyType: 'TDP'
        });

        testDataset = await Dataset.create({
          datasetId: 'DATASET-001',
          name: 'Test Dataset',
          description: 'Test dataset for contracts',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT',
          ownerId: testUser.id
        });
      });

    it('should create a contract with valid data', async () => {
      const contractData = {
        contractId: 'CONTRACT-001',
        status: 'PENDING_TDP_APPROVAL',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Standard terms and conditions apply',
        modelId: 'MODEL-001',
        tdpId: testUser.id,
        tdcId: testUser.id,
        ccrpId: testUser.id,
        datasetId: testDataset.id
      };

      const contract = await Contract.create(contractData);
      
              expect(contract.contractId).toBe(contractData.contractId);
                expect(parseFloat(contract.price)).toBe(contractData.price);
        expect(contract.duration).toBe(contractData.duration);
      expect(contract.tdpId).toBe(contractData.tdpId);
      expect(contract.tdcId).toBe(contractData.tdcId);
      expect(contract.ccrpId).toBe(contractData.ccrpId);
      expect(contract.id).toBeDefined();
      expect(contract.createdAt).toBeDefined();
      expect(contract.updatedAt).toBeDefined();
    });

    it('should validate status enum values', async () => {
              const invalidContract = {
          contractId: 'INVALID-001',
          title: 'Invalid Contract',
          description: 'Invalid contract description',
          status: 'INVALID_STATUS',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Standard terms',
          modelId: 'MODEL-001',
          tdpId: testUser.id,
          tdcId: testUser.id,
          ccrpId: testUser.id,
          datasetId: testDataset.id
        };

      await expect(Contract.create(invalidContract)).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
              const invalidContract = {
          contractId: 'INVALID-002',
          title: 'Invalid Contract',
          description: 'Invalid contract description',
          status: 'PENDING_TDP_APPROVAL',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Standard terms',
          modelId: 'MODEL-001',
          tdpId: 99999, // Non-existent user ID
          tdcId: testUser.id,
          ccrpId: testUser.id,
          datasetId: testDataset.id
        };

      await expect(Contract.create(invalidContract)).rejects.toThrow();
    });
  });

  describe('Dataset Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'dataset@example.com',
        name: 'Dataset User',
        partyType: 'TDP'
      });
    });

    it('should create a dataset with valid data', async () => {
      const datasetData = {
        datasetId: 'DATASET-002',
        name: 'Test Dataset',
        description: 'Test dataset description',
        category: 'Computer Vision',
        size: 1000,
        recordCount: 10000,
        price: 50.00,
        license: 'MIT',
        ownerId: testUser.id,
        metadata: { type: 'training', size: 1000 }
      };

      const dataset = await Dataset.create(datasetData);
      
      expect(dataset.name).toBe(datasetData.name);
      expect(dataset.description).toBe(datasetData.description);
      expect(dataset.ownerId).toBe(datasetData.ownerId);
      expect(dataset.metadata).toEqual(datasetData.metadata);
              expect(dataset.isActive).toBe(true);
      expect(dataset.id).toBeDefined();
      expect(dataset.createdAt).toBeDefined();
      expect(dataset.updatedAt).toBeDefined();
    });

    it('should validate status enum values', async () => {
              const invalidDataset = {
          datasetId: 'INVALID-001',
          name: 'Invalid Dataset',
          description: 'Invalid dataset description',
          category: 'INVALID_CATEGORY',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT',
          ownerId: testUser.id
        };

      await expect(Dataset.create(invalidDataset)).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
              const invalidDataset = {
          datasetId: 'INVALID-002',
          name: 'Invalid Dataset',
          description: 'Invalid dataset description',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT',
          ownerId: 99999 // Non-existent user ID
        };

      await expect(Dataset.create(invalidDataset)).rejects.toThrow();
    });
  });

  describe('Notification Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'notification@example.com',
        name: 'Notification User',
        partyType: 'TDP'
      });
    });

    it('should create a notification with valid data', async () => {
              const notificationData = {
          userId: testUser.id,
          type: 'CONTRACT_SIGNED',
          title: 'Contract Signed',
          message: 'Your contract has been signed',
          isRead: false
        };

      const notification = await Notification.create(notificationData);
      
      expect(notification.userId).toBe(notificationData.userId);
      expect(notification.type).toBe(notificationData.type);
      expect(notification.title).toBe(notificationData.title);
      expect(notification.message).toBe(notificationData.message);
              expect(notification.isRead).toBe(notificationData.isRead);
      expect(notification.id).toBeDefined();
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
    });

    it('should validate type enum values', async () => {
      const invalidNotification = {
        userId: testUser.id,
        type: 'INVALID_TYPE',
        title: 'Invalid Notification',
        message: 'Invalid notification message'
      };

      await expect(Notification.create(invalidNotification)).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
      const invalidNotification = {
        userId: 99999, // Non-existent user ID
        type: 'CONTRACT_SIGNED',
        title: 'Invalid Notification',
        message: 'Invalid notification message'
      };

      await expect(Notification.create(invalidNotification)).rejects.toThrow();
    });
  });

  describe('Model Relationships', () => {
    let testUser, testContract, testDataset;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'relationship@example.com',
        name: 'Relationship User',
        partyType: 'TDP'
      });

      testDataset = await Dataset.create({
        datasetId: 'RELATIONSHIP-001',
        name: 'Relationship Dataset',
        description: 'Test dataset for relationships',
        category: 'Computer Vision',
        size: 1000,
        recordCount: 10000,
        price: 50.00,
        license: 'MIT',
        ownerId: testUser.id
      });

      testContract = await Contract.create({
        contractId: 'RELATIONSHIP-001',
        status: 'PENDING_TDP_APPROVAL',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Standard terms',
        modelId: 'MODEL-001',
        tdpId: testUser.id,
        tdcId: testUser.id,
        ccrpId: testUser.id,
        datasetId: testDataset.id
      });
    });

    it('should establish user-contract relationships', async () => {
      const user = await User.findByPk(testUser.id, {
        include: [
          { model: Contract, as: 'tdpContracts' },
          { model: Contract, as: 'tdcContracts' },
          { model: Contract, as: 'ccrpContracts' }
        ]
      });

      expect(user).toBeDefined();
      expect(user.tdpContracts).toBeDefined();
      expect(user.tdcContracts).toBeDefined();
      expect(user.ccrpContracts).toBeDefined();
    });

    it('should establish user-dataset relationships', async () => {
      const user = await User.findByPk(testUser.id, {
        include: [{ model: Dataset, as: 'datasets' }]
      });

      expect(user).toBeDefined();
      expect(user.datasets).toBeDefined();
      expect(user.datasets.length).toBeGreaterThan(0);
    });

    it('should establish user-notification relationships', async () => {
      await Notification.create({
        userId: testUser.id,
        type: 'CONTRACT_SIGNED',
        title: 'Test Notification',
        message: 'Test notification message'
      });

      const user = await User.findByPk(testUser.id, {
        include: [{ model: Notification, as: 'notifications' }]
      });

      expect(user).toBeDefined();
      expect(user.notifications).toBeDefined();
      expect(user.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Database Transactions', () => {
    it('should handle successful transactions', async () => {
      const transaction = await sequelize.transaction();
      
      try {
        const user = await User.create({
          email: 'transaction@example.com',
          name: 'Transaction User',
          partyType: 'TDC'
        }, { transaction });

        const dataset = await Dataset.create({
          datasetId: 'TRANSACTION-001',
          name: 'Transaction Dataset',
          description: 'Dataset created in transaction',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT',
          ownerId: user.id
        }, { transaction });

        const contract = await Contract.create({
          contractId: 'TRANSACTION-001',
          title: 'Transaction Contract',
          description: 'Contract created in transaction',
          status: 'PENDING_TDP_APPROVAL',
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Standard terms',
          modelId: 'MODEL-001',
          tdpId: user.id,
          tdcId: user.id,
          ccrpId: user.id,
          datasetId: dataset.id
        }, { transaction });

        await transaction.commit();

        // Verify both records were created
        const savedUser = await User.findByPk(user.id);
        const savedContract = await Contract.findByPk(contract.id);
        
        expect(savedUser).toBeDefined();
        expect(savedContract).toBeDefined();
        
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    it('should handle transaction rollback on error', async () => {
      const transaction = await sequelize.transaction();
      
      try {
        // Create user successfully
        const user = await User.create({
          email: 'rollback@example.com',
          name: 'Rollback User',
          partyType: 'TDC'
        }, { transaction });

        // Try to create duplicate user (should fail)
        await User.create({
          email: 'rollback@example.com',
          name: 'Duplicate User',
          partyType: 'TDC'
        }, { transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        
        // Verify user was not created
        const savedUser = await User.findOne({ where: { email: 'rollback@example.com' } });
        expect(savedUser).toBeNull();
      }
    });
  });
}); 

describe('AIModel Model', () => {
  let AIModel, Contract;
  beforeAll(() => {
    AIModel = require('../models').AIModel;
    Contract = require('../models').Contract;
  });

  it('should create an AIModel with valid data', async () => {
    const modelData = {
      modelId: 'test-model-001',
      name: 'Test Model',
      description: 'A test AI model',
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
    const model = await AIModel.create(modelData);
    expect(model.modelId).toBe(modelData.modelId);
    expect(model.name).toBe(modelData.name);
    expect(model.isActive).toBe(true);
  });

  it('should enforce unique modelId', async () => {
    const modelData = {
      modelId: 'unique-model-001',
      name: 'Unique Model',
      description: 'Unique test model',
      type: 'cnn',
      architecture: 'cnn-arch',
      parameters: '2M',
      framework: 'TensorFlow',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy'],
      maxEpochs: 5,
      batchSize: 8,
      learningRate: 0.01,
      isActive: true
    };
    await AIModel.create(modelData);
    await expect(AIModel.create(modelData)).rejects.toThrow();
  });

  it('should require all mandatory fields', async () => {
    const modelData = {
      modelId: 'missing-fields',
      name: 'Missing Fields Model'
      // missing required fields
    };
    await expect(AIModel.create(modelData)).rejects.toThrow();
  });

  it('should relate contracts to AIModel', async () => {
    const model = await AIModel.create({
      modelId: 'rel-model-001',
      name: 'Rel Model',
      description: 'Relationship test',
      type: 'gan',
      architecture: 'gan-arch',
      parameters: '3M',
      framework: 'PyTorch',
      privacyTechnique: 'homomorphic-encryption',
      validationMetrics: ['fid-score'],
      maxEpochs: 20,
      batchSize: 32,
      learningRate: 0.002,
      isActive: true
    });
    const contract = await Contract.create({
      contractId: 'REL-CONTRACT-001',
      status: 'PENDING_TDP_APPROVAL',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      modelId: model.modelId
    });
    const found = await model.getContracts();
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].contractId).toBe('REL-CONTRACT-001');
  });
}); 