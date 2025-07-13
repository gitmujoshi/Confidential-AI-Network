const request = require('supertest');
const { User, Contract, Dataset, Notification, AIModel } = require('../models');
const { sequelize } = require('../models');
const jwt = require('jsonwebtoken');

// Import app
const app = require('../test-server');

// Force mock mode for this test suite
process.env.TEST_MODE = 'mock';

describe('Mock Integration Test Suite', () => {
  let tdpUser, tdcUser, ccrpUser, tdpToken, tdcToken, ccrpToken, testDataset, testContract;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    console.log('🧪 Running in MOCK mode');
    
    // Create test users and tokens
    await createTestUsers();
    
    // Create test dataset
    await createTestDataset();
    
    // Create test AI model
    await createTestAIModel();
  });

  afterAll(async () => {
    // Clean up all test data
    await global.testUtils.cleanupAllTestData();
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear notifications before each test
    await Notification.destroy({ where: {} });
  });

  async function createTestUsers() {
    const tdpData = {
      email: 'mock-tdp@example.com',
      name: 'Mock TDP User',
      partyType: 'TDP',
      password: 'Password123'
    };

    const tdcData = {
      email: 'mock-tdc@example.com',
      name: 'Mock TDC User',
      partyType: 'TDC',
      password: 'Password123'
    };

    const ccrpData = {
      email: 'mock-ccrp@example.com',
      name: 'Mock CCRP User',
      partyType: 'CCRP',
      password: 'Password123'
    };

    // Register TDP
    const tdpResponse = await request(app)
      .post('/api/auth/register')
      .send(tdpData)
      .expect(201);

    tdpUser = tdpResponse.body.user;
    tdpToken = tdpResponse.body.token;

    // Register TDC
    const tdcResponse = await request(app)
      .post('/api/auth/register')
      .send(tdcData)
      .expect(201);

    tdcUser = tdcResponse.body.user;
    tdcToken = tdcResponse.body.token;

    // Register CCRP
    const ccrpResponse = await request(app)
      .post('/api/auth/register')
      .send(ccrpData)
      .expect(201);

    ccrpUser = ccrpResponse.body.user;
    ccrpToken = ccrpResponse.body.token;
  }

  async function createTestDataset() {
    const datasetData = {
      datasetId: 'MOCK-DATASET-001',
      name: 'Mock Integration Test Dataset',
      description: 'Dataset for mock integration testing',
      category: 'Computer Vision',
      size: 1500,
      recordCount: 15000,
      price: 75.00,
      license: 'MIT',
      metadata: { type: 'mock-integration-test' }
    };

    const datasetResponse = await request(app)
      .post('/api/datasets')
      .set('Authorization', `Bearer ${tdpToken}`)
      .send(datasetData)
      .expect(201);

    testDataset = datasetResponse.body;
  }

  async function createTestAIModel() {
    await AIModel.create({
      modelId: 'mock-model-001',
      name: 'Mock Integration Model',
      description: 'Mock integration test model',
      type: 'cnn',
      architecture: 'mock-cnn-arch',
      parameters: '2M',
      framework: 'TensorFlow',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy'],
      maxEpochs: 5,
      batchSize: 8,
      learningRate: 0.01,
      isActive: true
    });
  }

  describe('Mock Keycloak Integration', () => {
    it('should create mock Keycloak user', async () => {
      const userData = {
        email: 'mock-keycloak@example.com',
        name: 'Mock Keycloak User',
        partyType: 'TDP',
        walletAddress: null,
        publicKey: null,
        organization: 'Mock Organization',
        phoneNumber: '',
        website: '',
        location: ''
      };

      const result = await global.testUtils.createKeycloakUser(userData);
      expect(result.keycloakUserId).toBe('mock-keycloak-user-id');
      expect(result.temporaryPassword).toBe('mock-temp-password');
    });

    it('should mock Keycloak authentication', async () => {
      const KeycloakService = require('../services/keycloakService');
      const keycloakService = new KeycloakService();

      const authResult = await keycloakService.authenticateUser('test@example.com', 'password');
      expect(authResult.success).toBe(true);
      expect(authResult.token).toBe('mock-access-token');
      expect(authResult.userInfo.email).toBe('test@example.com');
    });

    it('should mock Keycloak token validation', async () => {
      const KeycloakService = require('../services/keycloakService');
      const keycloakService = new KeycloakService();

      const validationResult = await keycloakService.validateToken('mock-jwt-token');
      expect(validationResult.valid).toBe(true);
      expect(validationResult.payload.sub).toBe('mock-user-id');
      expect(validationResult.payload.email).toBe('test@example.com');
    });

    it('should mock Keycloak user deletion', async () => {
      const KeycloakService = require('../services/keycloakService');
      const keycloakService = new KeycloakService();

      const deleteResult = await keycloakService.deleteUser('mock-user-id');
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.message).toBe('User deleted successfully');
    });

    it('should mock Keycloak role assignment', async () => {
      const KeycloakService = require('../services/keycloakService');
      const keycloakService = new KeycloakService();

      const roleResult = await keycloakService.assignRole('mock-user-id', 'TDP');
      expect(roleResult.success).toBe(true);
      expect(roleResult.message).toBe('Role assigned successfully');
    });

    it('should mock Keycloak user roles retrieval', async () => {
      const KeycloakService = require('../services/keycloakService');
      const keycloakService = new KeycloakService();

      const roles = await keycloakService.getUserRoles('mock-user-id');
      expect(Array.isArray(roles)).toBe(true);
      expect(roles).toContain('TDP');
      expect(roles).toContain('USER');
    });
  });

  describe('Mock DID Service Integration', () => {
    it('should mock DID resolution', async () => {
      const DIDService = require('../services/didService');
      const didService = new DIDService();

      const didResult = await didService.resolveDID('did:web:github.com:testuser');
      expect(didResult.id).toBe('did:web:github.com:testuser');
      expect(didResult.verificationMethod).toBeDefined();
      expect(didResult.verificationMethod[0].type).toBe('JsonWebKey2020');
    });

    it('should mock public key extraction', async () => {
      const DIDService = require('../services/didService');
      const didService = new DIDService();

      const publicKey = await didService.extractPublicKey('did:web:github.com:testuser');
      expect(publicKey.kty).toBe('EC');
      expect(publicKey.crv).toBe('secp256k1');
      expect(publicKey.x).toBe('mock-x-coordinate');
      expect(publicKey.y).toBe('mock-y-coordinate');
    });
  });

  describe('Mock Blockchain Service Integration', () => {
    it('should mock blockchain contract deployment', async () => {
      const BlockchainService = require('../services/blockchainService');
      const blockchainService = new BlockchainService();

      const contractData = {
        contractId: 'MOCK-CONTRACT-001',
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        price: 100.00,
        duration: 30
      };

      const deployResult = await blockchainService.deployContract(contractData);
      expect(deployResult.success).toBe(true);
      expect(deployResult.contractAddress).toBeDefined();
    });

    it('should mock blockchain contract signing', async () => {
      const BlockchainService = require('../services/blockchainService');
      const blockchainService = new BlockchainService();

      const signData = {
        contractId: 'MOCK-CONTRACT-001',
        partyType: 'TDP',
        privateKey: 'mock-private-key'
      };

      const signResult = await blockchainService.signContract(signData);
      expect(signResult.success).toBe(true);
      expect(signResult.transactionHash).toBeDefined();
    });

    it('should mock blockchain signature verification', async () => {
      const BlockchainService = require('../services/blockchainService');
      const blockchainService = new BlockchainService();

      const verifyData = {
        contractId: 'MOCK-CONTRACT-001',
        signature: 'mock-signature',
        publicKey: 'mock-public-key'
      };

      const verifyResult = await blockchainService.verifySignature(verifyData);
      expect(verifyResult.valid).toBe(true);
    });
  });

  describe('Mock Email Service Integration', () => {
    it('should mock email sending', async () => {
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();

      const emailData = {
        to: 'test@example.com',
        subject: 'Mock Test Email',
        template: 'welcome',
        data: { name: 'Mock User' }
      };

      const emailResult = await emailService.sendEmail(emailData);
      expect(emailResult.success).toBe(true);
      expect(emailResult.messageId).toBeDefined();
    });

    it('should mock email verification', async () => {
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();

      const verificationData = {
        to: 'test@example.com',
        token: 'mock-verification-token'
      };

      const verificationResult = await emailService.sendVerificationEmail(verificationData);
      expect(verificationResult.success).toBe(true);
    });
  });

  describe('Mock Notification Service Integration', () => {
    it('should create mock notifications', async () => {
      const NotificationService = require('../services/notificationService');
      const notificationService = new NotificationService();

      const notificationData = {
        userId: tdpUser.id,
        type: 'CONTRACT_CREATED',
        title: 'Mock Contract Created',
        message: 'A mock contract has been created',
        metadata: { contractId: 'MOCK-CONTRACT-001' }
      };

      const notification = await notificationService.createNotification(notificationData);
      expect(notification.userId).toBe(tdpUser.id);
      expect(notification.type).toBe('CONTRACT_CREATED');
    });

    it('should retrieve mock user notifications', async () => {
      const NotificationService = require('../services/notificationService');
      const notificationService = new NotificationService();

      const notifications = await notificationService.getUserNotifications(tdpUser.id);
      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  describe('Mock Audit Service Integration', () => {
    it('should create mock audit logs', async () => {
      const AuditService = require('../services/auditService');
      const auditService = new AuditService();

      const auditData = {
        userId: tdpUser.id,
        action: 'CONTRACT_CREATED',
        resource: 'contract',
        resourceId: 'MOCK-CONTRACT-001',
        details: { price: 100.00, duration: 30 }
      };

      const auditLog = await auditService.logAction(auditData);
      expect(auditLog.userId).toBe(tdpUser.id);
      expect(auditLog.action).toBe('CONTRACT_CREATED');
    });

    it('should retrieve mock audit logs', async () => {
      const AuditService = require('../services/auditService');
      const auditService = new AuditService();

      const auditLogs = await auditService.getUserAuditLogs(tdpUser.id);
      expect(Array.isArray(auditLogs)).toBe(true);
    });
  });

  describe('Mock DPDP Service Integration', () => {
    it('should validate mock DPDP compliance', async () => {
      const DPDPService = require('../services/dpdpService');
      const dpdpService = new DPDPService();

      const complianceData = {
        dataType: 'PERSONAL_DATA',
        purpose: 'AI_TRAINING',
        consent: true,
        dataRetention: 30
      };

      const complianceResult = await dpdpService.validateCompliance(complianceData);
      expect(complianceResult.compliant).toBe(true);
      expect(complianceResult.violations).toHaveLength(0);
    });

    it('should generate mock DPDP reports', async () => {
      const DPDPService = require('../services/dpdpService');
      const dpdpService = new DPDPService();

      const reportData = {
        userId: tdpUser.id,
        period: '2024-01-01 to 2024-12-31',
        dataTypes: ['PERSONAL_DATA', 'SENSITIVE_DATA']
      };

      const report = await dpdpService.generateComplianceReport(reportData);
      expect(report.userId).toBe(tdpUser.id);
      expect(report.compliant).toBe(true);
    });
  });

  describe('Mock Ricardian Contract Service Integration', () => {
    it('should generate mock Ricardian contracts', async () => {
      const RicardianContractService = require('../services/ricardianContractService');
      const ricardianService = new RicardianContractService();

      const contractData = {
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        datasetId: testDataset.id,
        price: 100.00,
        duration: 30,
        terms: 'Mock contract terms'
      };

      const ricardianContract = await ricardianService.generateContract(contractData);
      expect(ricardianContract.contractId).toBeDefined();
      expect(ricardianContract.terms).toBeDefined();
    });

    it('should validate mock Ricardian contracts', async () => {
      const RicardianContractService = require('../services/ricardianContractService');
      const ricardianService = new RicardianContractService();

      const validationData = {
        contractId: 'MOCK-RICARDIAN-001',
        signature: 'mock-signature',
        publicKey: 'mock-public-key'
      };

      const validationResult = await ricardianService.validateContract(validationData);
      expect(validationResult.valid).toBe(true);
    });
  });

  describe('Mock Signing Service Integration', () => {
    it('should mock ES256 signing', async () => {
      const SigningService = require('../services/signingService');
      const signingService = new SigningService();

      const signingData = {
        payload: { contractId: 'MOCK-CONTRACT-001' },
        privateKey: 'mock-private-key'
      };

      const signature = await signingService.signPayload(signingData);
      expect(signature).toBeDefined();
      expect(signature).toMatch(/^[A-Za-z0-9+/=]+$/); // Base64 format
    });

    it('should mock ES256 verification', async () => {
      const SigningService = require('../services/signingService');
      const signingService = new SigningService();

      const verificationData = {
        payload: { contractId: 'MOCK-CONTRACT-001' },
        signature: 'mock-signature',
        publicKey: 'mock-public-key'
      };

      const isValid = await signingService.verifySignature(verificationData);
      expect(isValid).toBe(true);
    });
  });

  describe('Complete Mock Workflow', () => {
    it('should complete full mock contract lifecycle', async () => {
      // Step 1: Create contract
      const contractData = {
        contractId: 'MOCK-WORKFLOW-001',
        status: 'PENDING_TDP_APPROVAL',
        price: 200.00,
        duration: 60,
        termsAndConditions: 'Mock workflow terms',
        modelId: 'mock-model-001',
        tdpId: tdpUser.id,
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        datasetId: testDataset.id
      };

      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdpToken}`)
        .send(contractData)
        .expect(201);

      const contractId = createResponse.body.id;

      // Step 2: TDP signs (mocked blockchain)
      const tdpSignResponse = await request(app)
        .post(`/api/contracts/${contractId}/sign`)
        .set('Authorization', `Bearer ${tdpToken}`)
        .send({ partyType: 'TDP' })
        .expect(200);

      expect(tdpSignResponse.body.signed).toBe(true);

      // Step 3: CCRP signs (mocked blockchain)
      const ccrpSignResponse = await request(app)
        .post(`/api/contracts/${contractId}/sign`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ partyType: 'CCRP' })
        .expect(200);

      expect(ccrpSignResponse.body.signed).toBe(true);

      // Step 4: Verify contract is active
      const finalContract = await Contract.findByPk(contractId);
      expect(finalContract.status).toBe('ACTIVE');
      expect(finalContract.tdpSigned).toBe(true);
      expect(finalContract.ccrpSigned).toBe(true);

      // Step 5: Verify notifications were created
      const notifications = await Notification.findAll({
        where: { userId: tdpUser.id }
      });
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should handle mock service failures gracefully', async () => {
      // Mock a service failure
      const KeycloakService = require('../services/keycloakService');
      const keycloakService = new KeycloakService();
      
      // Override the mock to simulate failure
      keycloakService.createUser = jest.fn().mockRejectedValue(
        new Error('Mock Keycloak connection failed')
      );

      const userData = {
        email: 'failure-test@example.com',
        name: 'Failure Test User',
        partyType: 'TDP'
      };

      await expect(keycloakService.createUser(userData))
        .rejects.toThrow('Mock Keycloak connection failed');
    });
  });

  describe('Mock Performance Tests', () => {
    it('should handle mock bulk operations', async () => {
      const contracts = [];
      
      // Create multiple contracts
      for (let i = 1; i <= 5; i++) {
        const contractData = {
          contractId: `MOCK-BULK-${i.toString().padStart(3, '0')}`,
          status: 'PENDING_TDP_APPROVAL',
          price: 100.00 * i,
          duration: 30,
          termsAndConditions: `Mock bulk contract ${i} terms`,
          modelId: 'mock-model-001',
          tdpId: tdpUser.id,
          tdcId: tdcUser.id,
          ccrpId: ccrpUser.id,
          datasetId: testDataset.id
        };

        const contract = await Contract.create(contractData);
        contracts.push(contract);
      }

      expect(contracts.length).toBe(5);
      
      // Verify all contracts were created
      const allContracts = await Contract.findAll({
        where: { tdpId: tdpUser.id }
      });
      expect(allContracts.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle mock concurrent operations', async () => {
      const promises = [];
      
      // Simulate concurrent contract creations
      for (let i = 1; i <= 3; i++) {
        const contractData = {
          contractId: `MOCK-CONCURRENT-${i.toString().padStart(3, '0')}`,
          status: 'PENDING_TDP_APPROVAL',
          price: 100.00,
          duration: 30,
          termsAndConditions: `Mock concurrent contract ${i} terms`,
          modelId: 'mock-model-001',
          tdpId: tdpUser.id,
          tdcId: tdcUser.id,
          ccrpId: ccrpUser.id,
          datasetId: testDataset.id
        };

        promises.push(Contract.create(contractData));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
      
      results.forEach(contract => {
        expect(contract.contractId).toBeDefined();
        expect(contract.tdpId).toBe(tdpUser.id);
      });
    });
  });
}); 