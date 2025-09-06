/**
 * Centralized Mock Registry for ContractFlow Pro Tests
 * 
 * This registry provides consistent, working mocks for all services
 * and ensures proper constructor behavior for Jest tests.
 */

const MockRegistry = {
  // Service instances cache
  instances: new Map(),
  
  // Mock implementations
  mocks: {
    // Database Models
    User: {
      create: jest.fn().mockImplementation((userData) => {
        const user = {
          id: Date.now(),
          ...userData,
          isActive: true,
          isRegistered: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        MockRegistry.instances.set(`user_${userData.email}`, user);
        return Promise.resolve(user);
      }),
      findOne: jest.fn().mockImplementation((query) => {
        if (query && query.where) {
          // Handle email-based queries
          if (query.where.email) {
            const email = query.where.email.toLowerCase();
            const user = MockRegistry.instances.get(`user_${email}`);
            return Promise.resolve(user || null);
          }
          
          // Handle ID and partyType queries (for dataset creation)
          if (query.where.id && query.where.partyType) {
            // Look for user in instances by ID
            for (const [key, user] of MockRegistry.instances.entries()) {
              if (key.startsWith('user_') && user.id === query.where.id && user.partyType === query.where.partyType) {
                return Promise.resolve(user);
              }
            }
            // If not found, return null
            return Promise.resolve(null);
          }
          
          // Handle ID-only queries
          if (query.where.id && !query.where.partyType) {
            // Look for user in instances by ID
            for (const [key, user] of MockRegistry.instances.entries()) {
              if (key.startsWith('user_') && user.id === query.where.id) {
                return Promise.resolve(user);
              }
            }
            // If not found, return null
            return Promise.resolve(null);
          }
        }
        return Promise.resolve(null);
      }),
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        partyType: 'TDP',
        isActive: true,
        isRegistered: true
      }),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    },

    Dataset: {
      create: jest.fn().mockImplementation((datasetData) => {
        const dataset = {
          id: Date.now(),
          ...datasetData,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        MockRegistry.instances.set(`dataset_${datasetData.datasetId}`, dataset);
        return Promise.resolve(dataset);
      }),
      findOne: jest.fn().mockImplementation((query) => {
        if (query && query.where) {
          // Handle datasetId-based queries
          if (query.where.datasetId) {
            const datasetId = query.where.datasetId;
            const dataset = MockRegistry.instances.get(`dataset_${datasetId}`);
            return Promise.resolve(dataset || null);
          }
          
          // Handle ID-based queries
          if (query.where.id) {
            const dataset = MockRegistry.instances.get(`dataset_id_${query.where.id}`);
            return Promise.resolve(dataset || null);
          }
        }
        return Promise.resolve(null);
      }),
      findByPk: jest.fn().mockImplementation((id) => {
        const dataset = MockRegistry.instances.get(`dataset_id_${id}`);
        return Promise.resolve(dataset || null);
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

    AIModel: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        modelId: 'test-model',
        name: 'Test Model',
        description: 'Test model for testing',
        type: 'cnn',
        architecture: 'test-arch',
        parameters: '1M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: ['accuracy'],
        maxEpochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        isActive: true
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        modelId: 'test-model',
        name: 'Test Model',
        description: 'Test model for testing',
        type: 'cnn',
        architecture: 'test-arch',
        parameters: '1M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: ['accuracy'],
        maxEpochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        isActive: true
      }),
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        modelId: 'test-model',
        name: 'Test Model',
        description: 'Test model for testing',
        type: 'cnn',
        architecture: 'test-arch',
        parameters: '1M',
        framework: 'TensorFlow',
        privacyTechnique: 'differential-privacy',
        validationMetrics: ['accuracy'],
        maxEpochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        isActive: true
      }),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    },

    Notification: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'CONTRACT_CREATED',
        title: 'Test Notification',
        message: 'Test notification message',
        isRead: false,
        createdAt: new Date()
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'CONTRACT_CREATED',
        title: 'Test Notification',
        message: 'Test notification message',
        isRead: false,
        createdAt: new Date()
      }),
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        type: 'CONTRACT_CREATED',
        title: 'Test Notification',
        message: 'Test notification message',
        isRead: false,
        createdAt: new Date()
      }),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    },

    AuditLog: {
      create: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        action: 'USER_REGISTERED',
        details: 'User registration test',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        timestamp: new Date()
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        action: 'USER_REGISTERED',
        details: 'User registration test',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        timestamp: new Date()
      }),
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        action: 'USER_REGISTERED',
        details: 'User registration test',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        timestamp: new Date()
      }),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1)
    }
  },

  // Service constructors
  serviceConstructors: {
    KeycloakService: class MockKeycloakService {
      constructor() {
        this.createUser = jest.fn().mockResolvedValue({
          keycloakUserId: 'mock-keycloak-user-id',
          temporaryPassword: 'mock-temp-password'
        });
        this.updateUser = jest.fn().mockResolvedValue({
          success: true,
          message: 'User updated successfully'
        });
        this.deleteUser = jest.fn().mockResolvedValue({
          success: true,
          message: 'User deleted successfully'
        });
        this.authenticateUser = jest.fn().mockResolvedValue({
          success: true,
          token: 'mock-access-token',
          userInfo: {
            sub: 'mock-user-id',
            email: 'test@example.com',
            name: 'Test User'
          }
        });
        this.validateToken = jest.fn().mockResolvedValue({
          valid: true,
          payload: {
            sub: 'mock-user-id',
            email: 'test@example.com',
            realm_access: { roles: ['TDP'] }
          }
        });
        this.assignRole = jest.fn().mockResolvedValue({
          success: true,
          message: 'Role assigned successfully'
        });
        this.getUserRoles = jest.fn().mockResolvedValue(['TDP', 'USER']);
        this.getAdminToken = jest.fn().mockResolvedValue('mock-admin-token');
      }
    },

    DIDService: class MockDIDService {
      constructor() {
        this.resolveDID = jest.fn().mockResolvedValue({
          id: 'did:web:github.com:testuser',
          verificationMethod: [{
            id: 'did:web:github.com:testuser#owner',
            type: 'JsonWebKey2020',
            publicKeyJwk: {
              kty: 'EC',
              crv: 'secp256k1',
              x: 'mock-x-coordinate',
              y: 'mock-y-coordinate'
            }
          }]
        });
        this.extractPublicKey = jest.fn().mockResolvedValue({
          kty: 'EC',
          crv: 'secp256k1',
          x: 'mock-x-coordinate',
          y: 'mock-y-coordinate'
        });
        this.validateDIDFormat = jest.fn().mockReturnValue(true);
        this.isDIDAvailable = jest.fn().mockResolvedValue({ available: true });
        this.verifyDIDOwnership = jest.fn().mockResolvedValue(true);
        this.createSystemDID = jest.fn().mockReturnValue('did:ethr:goerli:0x1234567890123456789012345678901234567890');
      }
    },

    BlockchainService: class MockBlockchainService {
      constructor() {
        // Properties
        this.provider = null;
        this.contract = null;
        this.contractAddress = '0xMOCK_CONTRACT_ADDRESS';
        this.mode = 'DATABASE_ONLY';
        
        // Methods
        this.initialize = jest.fn().mockResolvedValue(true);
        this.isConnected = jest.fn().mockResolvedValue(false);
        this.getMode = jest.fn().mockReturnValue({
          blockchainEnabled: false,
          blockchainAvailable: false,
          mode: 'DATABASE_ONLY'
        });
        this.getParty = jest.fn().mockResolvedValue(null);
        this.getContractEvents = jest.fn().mockResolvedValue(null);
        this.getPartyContracts = jest.fn().mockResolvedValue(null);
        this.createContract = jest.fn().mockResolvedValue({
          success: true,
          transactionHash: 'MOCK_TX_HASH',
          contractId: '1',
          message: 'Contract created successfully (mock)'
        });
        this.signContract = jest.fn().mockResolvedValue({
          success: true,
          transactionHash: 'MOCK_SIGN_TX_HASH',
          message: 'Contract signed successfully (mock)'
        });
        this.selectCCRP = jest.fn().mockResolvedValue({
          success: true,
          transactionHash: 'MOCK_CCRP_TX_HASH',
          message: 'CCRP selected successfully (mock)'
        });
        this.getContract = jest.fn().mockResolvedValue({
          contractId: '1',
          tdpAddress: '0x1234567890123456789012345678901234567890',
          tdcAddress: '0x2345678901234567890123456789012345678901',
          ccrpAddress: '0x3456789012345678901234567890123456789012',
          datasetId: 'test-dataset',
          modelId: 'test-model',
          price: '1000',
          duration: 30,
          termsAndConditions: 'Test terms',
          status: 'PENDING_TDP_APPROVAL',
          createdAt: new Date(),
          tdpSigned: false,
          ccrpSigned: false
        });
        this.healthCheck = jest.fn().mockResolvedValue({
          blockchainEnabled: false,
          blockchainAvailable: false,
          mode: 'DATABASE_ONLY',
          connected: false,
          contractAddress: null,
          timestamp: new Date().toISOString()
        });
        this.updateContract = jest.fn().mockResolvedValue({
          success: true,
          message: 'Contract updated successfully (mock)'
        });
      }
    },

    GlobalDEPAIdService: class MockGlobalDEPAIdService {
      constructor() {
        this.generateJurisdictionCompliantDEPAId = jest.fn().mockReturnValue('GLOBAL-DEPA-USER-001');
        this.generateGlobalUserDEPAId = jest.fn().mockReturnValue('GLOBAL-DEPA-USER-001');
        this.getEntityType = jest.fn().mockReturnValue('USER');
      }
    },

    DEPAIdService: class MockDEPAIdService {
      constructor() {
        this.generateUserDEPAId = jest.fn().mockReturnValue('DEPA-USER-001');
        this.generateDatasetDEPAId = jest.fn().mockReturnValue('DEPA-DATASET-001');
        this.generateContractDEPAId = jest.fn().mockReturnValue('DEPA-CONTRACT-001');
      }
    },

    ScittCcfService: class MockScittCcfService {
      constructor() {
        this.initialize = jest.fn().mockResolvedValue(true);
        this.isInitialized = true;
        this.testConnection = jest.fn().mockResolvedValue(true);
        this.detectTeeProvider = jest.fn().mockReturnValue({
          type: 'virtual',
          capabilities: ['encryption', 'isolation'],
          platform: 'virtual'
        });
        this.createContract = jest.fn().mockResolvedValue({
          success: true,
          source: 'SCITT_CCF',
          claimId: 'mock-claim-id',
          message: 'Contract created successfully (mock)'
        });
        this.submitClaim = jest.fn().mockResolvedValue({
          success: true,
          claimId: 'mock-claim-id',
          message: 'Claim submitted successfully (mock)'
        });
        this.getClaimStatus = jest.fn().mockResolvedValue({
          status: 'SUBMITTED',
          details: 'Claim is being processed'
        });
        this.verifyAttestation = jest.fn().mockResolvedValue({
          verified: true,
          details: 'Attestation verified successfully'
        });
      }
    },

    ContractRouterService: class MockContractRouterService {
      constructor() {
        this.initialize = jest.fn().mockResolvedValue(true);
        this.routeContract = jest.fn().mockResolvedValue({
          success: true,
          route: 'SCITT_CCF',
          message: 'Contract routed successfully'
        });
        this.getRouteStatus = jest.fn().mockResolvedValue({
          status: 'ACTIVE',
          details: 'Route is active and working'
        });
      }
    },

    SystemHealthMonitor: class MockSystemHealthMonitor {
      constructor() {
        this.initialize = jest.fn().mockResolvedValue(true);
        this.startMonitoring = jest.fn().mockResolvedValue(true);
        this.stopMonitoring = jest.fn().mockResolvedValue(true);
        this.isMonitoring = false;
        this.getHealthStatus = jest.fn().mockResolvedValue({
          overall: 'HEALTHY',
          services: {
            scitt: 'HEALTHY',
            ethereum: 'HEALTHY',
            database: 'HEALTHY'
          }
        });
      }
    }
  },

  // Database mock
  database: {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
      transaction: jest.fn().mockImplementation(() => ({
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      }))
    }
  },

  // Clear all instances
  clearInstances() {
    this.instances.clear();
  },

  // Reset all mocks
  resetMocks() {
    Object.values(this.mocks).forEach(mock => {
      if (mock.create && mock.create.mockClear) mock.create.mockClear();
      if (mock.findOne && mock.findOne.mockClear) mock.findOne.mockClear();
      if (mock.findByPk && mock.findByPk.mockClear) mock.findByPk.mockClear();
      if (mock.findAll && mock.findAll.mockClear) mock.findAll.mockClear();
      if (mock.update && mock.update.mockClear) mock.update.mockClear();
      if (mock.destroy && mock.destroy.mockClear) mock.destroy.mockClear();
    });
  }
};

module.exports = MockRegistry;
