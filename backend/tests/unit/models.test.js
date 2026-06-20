const { User, Contract, Dataset, Notification, sequelize } = require('../../models');

describe('Database Models Test Suite', () => {
  let testUser, testDataset, testContract;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established for models test');
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
    console.log('✅ Database connection closed');
  });

  beforeEach(async () => {
    // Clear test data before each test
    await Contract.destroy({ where: {} });
    await Dataset.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create test user
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      partyType: 'TDP',
      walletAddress: '0x1234567890123456789012345678901234567890',
      publicKey: 'test-public-key'
    });

    // Create test dataset
    testDataset = await Dataset.create({
      datasetId: 'TEST-001',
      name: 'Test Dataset',
      description: 'Test dataset description',
      category: 'Computer Vision',
      size: 1000,
      recordCount: 10000,
      price: 50.00,
      license: 'MIT',
      ownerId: testUser.id
    });

    // Create test contract
    testContract = await Contract.create({
      contractId: 'TEST-001',
      title: 'Test Contract',
      description: 'Test contract description',
      status: 'PENDING_TDP',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Standard terms',
      tdcId: testUser.id,
      contractDatasets: [{
        datasetId: testDataset.id,
        tdpId: testUser.id,
        datasetName: testDataset.name,
        tdpName: testUser.name,
        individualPrice: 100.00,
        paymentStatus: 'PENDING'
      }],
      datasetCount: 1,
      tdpCount: 1
    });
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const user = await User.create({
        email: 'newuser@example.com',
        name: 'New User',
        partyType: 'TDP',
        walletAddress: '0xabcdef1234567890123456789012345678901234',
        publicKey: 'new-public-key'
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
      expect(user.name).toBe('New User');
      expect(user.partyType).toBe('TDP');
      expect(user.walletAddress).toBe('0xabcdef1234567890123456789012345678901234');
      expect(user.publicKey).toBe('new-public-key');
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      await User.create({
        email: 'duplicate@example.com',
        name: 'First User',
        partyType: 'TDP'
      });

      await expect(User.create({
        email: 'duplicate@example.com',
        name: 'Second User',
        partyType: 'TDC'
      })).rejects.toThrow();
    });

    it('should validate partyType enum values', async () => {
      const validPartyTypes = ['TDP', 'TDC', 'TSP'];

      for (const partyType of validPartyTypes) {
        const user = await User.create({
          email: `test-${partyType.toLowerCase()}@example.com`,
          name: `Test ${partyType} User`,
          partyType: partyType
        });

        expect(user.partyType).toBe(partyType);
      }
    });

    it('should validate email format', async () => {
      await expect(User.create({
        email: 'invalid-email',
        name: 'Invalid Email User',
        partyType: 'TDP'
      })).rejects.toThrow();
    });

    it('should allow optional fields to be null', async () => {
      const user = await User.create({
        email: 'optional@example.com',
        name: 'Optional User',
        partyType: 'TDP'
        // walletAddress and publicKey are optional
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('optional@example.com');
      expect(user.walletAddress).toBeNull();
      expect(user.publicKey).toBeNull();
    });
  });

  describe('Contract Model', () => {
    it('should create a contract with valid data', async () => {
      const contract = await Contract.create({
        contractId: 'NEW-CONTRACT-001',
        status: 'PENDING_TDP',
        price: 150.00,
        duration: 60,
        termsAndConditions: 'New terms',
        tdcId: testUser.id,
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: testUser.id,
          datasetName: testDataset.name,
          tdpName: testUser.name,
          individualPrice: 150.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      });

      expect(contract.id).toBeDefined();
      expect(contract.contractId).toBe('NEW-CONTRACT-001');
      expect(contract.status).toBe('PENDING_TDP');
      expect(parseFloat(contract.price)).toBe(150.00);
      expect(contract.duration).toBe(60);
      expect(contract.createdAt).toBeDefined();
      expect(contract.updatedAt).toBeDefined();
    });

    it('should validate status enum values', async () => {
      const validStatuses = [
        'PENDING_TDP',
        'PENDING_TSP',
        'SIGNED',
        'COMPLETED',
        'REJECTED'
      ];

      for (const status of validStatuses) {
        const contract = await Contract.create({
          contractId: `STATUS-TEST-${status}`,
          status: status,
          price: 100.00,
          duration: 30,
          termsAndConditions: 'Test terms',
          tdcId: testUser.id,
          contractDatasets: [{
            datasetId: testDataset.id,
            tdpId: testUser.id,
            datasetName: testDataset.name,
            tdpName: testUser.name,
            individualPrice: 100.00,
            paymentStatus: 'PENDING'
          }],
          datasetCount: 1,
          tdpCount: 1
        });

        expect(contract.status).toBe(status);
      }
    });

    it('should enforce foreign key constraints', async () => {
      await expect(Contract.create({
        contractId: 'FK-TEST-001',
        status: 'PENDING_TDP',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Test terms',
        tdcId: testUser.id,
        contractDatasets: [{
          datasetId: testDataset.id,
          tdpId: 99999, // Non-existent user ID
          datasetName: testDataset.name,
          tdpName: 'Non-existent TDP',
          individualPrice: 100.00,
          paymentStatus: 'PENDING'
        }],
        datasetCount: 1,
        tdpCount: 1
      })).rejects.toThrow();
    });
  });

  describe('Dataset Model', () => {
    it('should create a dataset with valid data', async () => {
      const dataset = await Dataset.create({
        datasetId: 'NEW-DATASET-001',
        name: 'New Dataset',
        description: 'New dataset description',
        category: 'Natural Language Processing',
        size: 2000,
        recordCount: 20000,
        price: 75.00,
        license: 'Apache 2.0',
        ownerId: testUser.id
      });

      expect(dataset.id).toBeDefined();
      expect(dataset.datasetId).toBe('NEW-DATASET-001');
      expect(dataset.name).toBe('New Dataset');
      expect(dataset.category).toBe('Natural Language Processing');
      expect(dataset.size).toBe(2000);
      expect(dataset.recordCount).toBe(20000);
      expect(parseFloat(dataset.price)).toBe(75.00);
      expect(dataset.license).toBe('Apache 2.0');
      expect(dataset.ownerId).toBe(testUser.id);
      expect(dataset.createdAt).toBeDefined();
      expect(dataset.updatedAt).toBeDefined();
    });

    it('should validate category enum values', async () => {
      const validCategories = [
        'Computer Vision',
        'Natural Language Processing',
        'Audio',
        'Tabular',
        'Multimodal'
      ];

      for (const category of validCategories) {
        const dataset = await Dataset.create({
          datasetId: `CATEGORY-DATASET-${category.replace(/\s+/g, '-')}`,
          name: `Category Dataset ${category}`,
          description: 'Category test dataset',
          category: category,
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT',
          ownerId: testUser.id
        });

        expect(dataset.category).toBe(category);
      }
    });

    it('should enforce foreign key constraints', async () => {
      await expect(Dataset.create({
        datasetId: 'FK-DATASET-001',
        name: 'FK Test Dataset',
        description: 'FK test dataset',
        category: 'Computer Vision',
        size: 1000,
        recordCount: 10000,
        price: 50.00,
        license: 'MIT',
        ownerId: 99999 // Non-existent user ID
      })).rejects.toThrow();
    });
  });

  describe('Notification Model', () => {
    it('should create a notification with valid data', async () => {
      const notification = await Notification.create({
        userId: testUser.id,
        type: 'CONTRACT_SIGNED',
        title: 'Test Notification',
        message: 'Test notification message'
      });

      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(testUser.id);
      expect(notification.type).toBe('CONTRACT_SIGNED');
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('Test notification message');
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
    });

    it('should validate type enum values', async () => {
      const validTypes = [
        'USER_REGISTERED',
        'CONTRACT_CREATED',
        'CONTRACT_SIGNED',
        'CONTRACT_COMPLETED',
        'CONTRACT_CANCELLED',
        'CCRP_SELECTED'
      ];

      for (const type of validTypes) {
        const notification = await Notification.create({
          userId: testUser.id,
          type: type,
          title: `Test ${type}`,
          message: `Test message for ${type}`
        });

        expect(notification.type).toBe(type);
      }
    });

    it('should enforce foreign key constraints', async () => {
      await expect(Notification.create({
        userId: 99999, // Non-existent user ID
        type: 'CONTRACT_SIGNED',
        title: 'Test Notification',
        message: 'Test notification message'
      })).rejects.toThrow();
    });
  });

  describe('Model Relationships', () => {
    it('should establish user-contract relationships', async () => {
      const userWithContracts = await User.findByPk(testUser.id, {
        include: [
          { model: Contract, as: 'tdpContracts' },
          { model: Contract, as: 'tdcContracts' }
        ]
      });

      expect(userWithContracts).toBeDefined();
      expect(userWithContracts.tdpContracts).toBeDefined();
      expect(userWithContracts.tdcContracts).toBeDefined();
    });

    it('should establish user-dataset relationships', async () => {
      const userWithDatasets = await User.findByPk(testUser.id, {
        include: [{ model: Dataset, as: 'datasets' }]
      });

      expect(userWithDatasets).toBeDefined();
      expect(userWithDatasets.datasets).toBeDefined();
      expect(userWithDatasets.datasets.length).toBeGreaterThan(0);
    });

    it('should establish user-notification relationships', async () => {
      await Notification.create({
        userId: testUser.id,
        type: 'CONTRACT_SIGNED',
        title: 'Test Notification',
        message: 'Test notification message'
      });

      const userWithNotifications = await User.findByPk(testUser.id, {
        include: [{ model: Notification, as: 'notifications' }]
      });

      expect(userWithNotifications).toBeDefined();
      expect(userWithNotifications.notifications).toBeDefined();
      expect(userWithNotifications.notifications.length).toBeGreaterThan(0);
    });
  });

  describe('Database Transactions', () => {
    it('should handle successful transactions', async () => {
      const transaction = await sequelize.transaction();

      try {
        const user = await User.create({
          email: 'transaction-test@example.com',
          name: 'Transaction Test User',
          partyType: 'TDP'
        }, { transaction });

        const dataset = await Dataset.create({
          datasetId: 'TRANSACTION-TEST-001',
          name: 'Transaction Test Dataset',
          description: 'Dataset for transaction testing',
          category: 'Computer Vision',
          size: 1000,
          recordCount: 10000,
          price: 50.00,
          license: 'MIT',
          ownerId: user.id
        }, { transaction });

        await transaction.commit();

        expect(user.id).toBeDefined();
        expect(dataset.id).toBeDefined();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });

    it('should handle transaction rollback on error', async () => {
      const transaction = await sequelize.transaction();

      try {
        await User.create({
          email: 'rollback-test@example.com',
          name: 'Rollback Test User',
          partyType: 'TDP'
        }, { transaction });

        // This should cause an error and trigger rollback
        await User.create({
          email: 'rollback-test@example.com', // Duplicate email
          name: 'Rollback Test User 2',
          partyType: 'TDP'
        }, { transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        expect(error).toBeDefined();
      }

      // Verify that no data was committed
      const user = await User.findOne({
        where: { email: 'rollback-test@example.com' }
      });
      expect(user).toBeNull();
    });
  });
}); 