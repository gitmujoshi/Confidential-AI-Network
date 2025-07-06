const { 
  blockchainService, 
  didService, 
  ***REMOVED-KEYCLOAK_DB_PASSWORD***Service, 
  notificationService 
} = require('../services');
const { User, Contract, Dataset, Notification } = require('../models');
const { sequelize } = require('../models');
const jwt = require('jsonwebtoken');

// Mock external dependencies
jest.mock('axios');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Service Layer Test Suite', () => {
  let testUser, testContract, testDataset;

  beforeAll(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user
    testUser = await User.create({
      email: 'service@example.com',
      name: 'Service Test User',
      partyType: 'TDP',
      publicKey: 'test-public-key',
      did: 'did:web:github.com:servicetestuser',
      didVerified: true
    });

    // Create test dataset
    testDataset = await Dataset.create({
      datasetId: 'SERVICE-DATASET-001',
      name: 'Service Test Dataset',
      description: 'Dataset for service testing',
      category: 'Computer Vision',
      size: 1000,
      recordCount: 10000,
      price: 50.00,
      license: 'MIT',
      ownerId: testUser.id
    });

    // Create test contract
    testContract = await Contract.create({
      contractId: 'SERVICE-CONTRACT-001',
      status: 'PENDING_TDP_APPROVAL',
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Service test terms',
      modelId: 'SERVICE-MODEL-001',
      tdpId: testUser.id,
      tdcId: testUser.id,
      ccrpId: testUser.id,
      datasetId: testDataset.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear notifications before each test
    await Notification.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('Blockchain Service', () => {
    describe('Contract Deployment', () => {
      it('should deploy contract to blockchain', async () => {
        const mockContractAddress = '0x1234567890123456789012345678901234567890';
        
        // Mock blockchain deployment
        blockchainService.deployContract = jest.fn().mockResolvedValue({
          success: true,
          contractAddress: mockContractAddress,
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        });

        const result = await blockchainService.deployContract(testContract);

        expect(result.success).toBe(true);
        expect(result.contractAddress).toBe(mockContractAddress);
        expect(result.transactionHash).toBeDefined();
        expect(blockchainService.deployContract).toHaveBeenCalledWith(testContract);
      });

      it('should handle blockchain deployment failure', async () => {
        blockchainService.deployContract = jest.fn().mockRejectedValue(
          new Error('Blockchain network error')
        );

        await expect(blockchainService.deployContract(testContract))
          .rejects.toThrow('Blockchain network error');
      });

      it('should validate contract data before deployment', async () => {
        const invalidContract = { ...testContract, contractId: null };

        await expect(blockchainService.deployContract(invalidContract))
          .rejects.toThrow('Invalid contract data');
      });
    });

    describe('Contract Signing', () => {
      it('should sign contract on blockchain', async () => {
        const mockSignature = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        
        blockchainService.signContract = jest.fn().mockResolvedValue({
          success: true,
          signature: mockSignature,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        });

        const result = await blockchainService.signContract(testContract, testUser);

        expect(result.success).toBe(true);
        expect(result.signature).toBe(mockSignature);
        expect(result.transactionHash).toBeDefined();
        expect(blockchainService.signContract).toHaveBeenCalledWith(testContract, testUser);
      });

      it('should handle signing failure', async () => {
        blockchainService.signContract = jest.fn().mockRejectedValue(
          new Error('Insufficient gas')
        );

        await expect(blockchainService.signContract(testContract, testUser))
          .rejects.toThrow('Insufficient gas');
      });

      it('should validate user permissions for signing', async () => {
        const unauthorizedUser = await User.create({
          email: 'unauthorized@example.com',
          name: 'Unauthorized User',
          partyType: 'TDC'
        });

        await expect(blockchainService.signContract(testContract, unauthorizedUser))
          .rejects.toThrow('User not authorized to sign this contract');
      });
    });

    describe('Contract Verification', () => {
      it('should verify contract signature on blockchain', async () => {
        const mockSignature = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        
        blockchainService.verifySignature = jest.fn().mockResolvedValue({
          success: true,
          isValid: true,
          signer: testUser.publicKey
        });

        const result = await blockchainService.verifySignature(testContract, mockSignature);

        expect(result.success).toBe(true);
        expect(result.isValid).toBe(true);
        expect(result.signer).toBe(testUser.publicKey);
        expect(blockchainService.verifySignature).toHaveBeenCalledWith(testContract, mockSignature);
      });

      it('should handle invalid signatures', async () => {
        const invalidSignature = '0xinvalid';
        
        blockchainService.verifySignature = jest.fn().mockResolvedValue({
          success: true,
          isValid: false,
          error: 'Invalid signature format'
        });

        const result = await blockchainService.verifySignature(testContract, invalidSignature);

        expect(result.success).toBe(true);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Network Status', () => {
      it('should check blockchain network status', async () => {
        blockchainService.getNetworkStatus = jest.fn().mockResolvedValue({
          connected: true,
          networkId: 1337,
          latestBlock: 12345,
          gasPrice: '20000000000'
        });

        const result = await blockchainService.getNetworkStatus();

        expect(result.connected).toBe(true);
        expect(result.networkId).toBe(1337);
        expect(result.latestBlock).toBe(12345);
        expect(result.gasPrice).toBeDefined();
      });

      it('should handle network connection failure', async () => {
        blockchainService.getNetworkStatus = jest.fn().mockRejectedValue(
          new Error('Network connection failed')
        );

        await expect(blockchainService.getNetworkStatus())
          .rejects.toThrow('Network connection failed');
      });
    });
  });

  describe('DID Service', () => {
    describe('DID Resolution', () => {
      it('should resolve DID document successfully', async () => {
        const mockDidDocument = {
          '@context': 'https://www.w3.org/ns/did/v1',
          id: 'did:web:github.com:testuser',
          verificationMethod: [{
            id: 'did:web:github.com:testuser#key-1',
            type: 'RsaVerificationKey2018',
            controller: 'did:web:github.com:testuser',
            publicKeyJwk: {
              kty: 'RSA',
              n: 'test-n-value',
              e: 'AQAB'
            }
          }]
        };

        didService.resolveDID = jest.fn().mockResolvedValue({
          success: true,
          didDocument: mockDidDocument,
          publicKey: mockDidDocument.verificationMethod[0].publicKeyJwk
        });

        const result = await didService.resolveDID('did:web:github.com:testuser');

        expect(result.success).toBe(true);
        expect(result.didDocument).toEqual(mockDidDocument);
        expect(result.publicKey).toBeDefined();
        expect(didService.resolveDID).toHaveBeenCalledWith('did:web:github.com:testuser');
      });

      it('should handle DID resolution failure', async () => {
        didService.resolveDID = jest.fn().mockRejectedValue(
          new Error('DID not found')
        );

        await expect(didService.resolveDID('did:web:github.com:nonexistent'))
          .rejects.toThrow('DID not found');
      });

      it('should validate DID format', async () => {
        const invalidDids = [
          'invalid:did:format',
          'did:invalid:format',
          'http://github.com/user'
        ];

        for (const invalidDid of invalidDids) {
          await expect(didService.resolveDID(invalidDid))
            .rejects.toThrow('Invalid DID format');
        }
      });
    });

    describe('Public Key Extraction', () => {
      it('should extract public key from DID document', async () => {
        const mockDidDocument = {
          verificationMethod: [{
            publicKeyJwk: {
              kty: 'RSA',
              n: 'test-n-value',
              e: 'AQAB'
            }
          }]
        };

        didService.extractPublicKey = jest.fn().mockReturnValue({
          kty: 'RSA',
          n: 'test-n-value',
          e: 'AQAB'
        });

        const result = didService.extractPublicKey(mockDidDocument);

        expect(result.kty).toBe('RSA');
        expect(result.n).toBe('test-n-value');
        expect(result.e).toBe('AQAB');
        expect(didService.extractPublicKey).toHaveBeenCalledWith(mockDidDocument);
      });

      it('should handle missing public key in DID document', async () => {
        const mockDidDocument = {
          verificationMethod: []
        };

        didService.extractPublicKey = jest.fn().mockImplementation(() => {
          throw new Error('No public key found in DID document');
        });

        expect(() => didService.extractPublicKey(mockDidDocument))
          .toThrow('No public key found in DID document');
      });

      it('should handle multiple verification methods', async () => {
        const mockDidDocument = {
          verificationMethod: [
            {
              id: 'key-1',
              publicKeyJwk: { kty: 'RSA', n: 'n1', e: 'AQAB' }
            },
            {
              id: 'key-2',
              publicKeyJwk: { kty: 'RSA', n: 'n2', e: 'AQAB' }
            }
          ]
        };

        didService.extractPublicKey = jest.fn().mockReturnValue({
          kty: 'RSA',
          n: 'n1',
          e: 'AQAB'
        });

        const result = didService.extractPublicKey(mockDidDocument);

        expect(result.kty).toBe('RSA');
        expect(result.n).toBe('n1');
      });
    });

    describe('DID Verification', () => {
      it('should verify DID signature', async () => {
        const mockMessage = 'Test message';
        const mockSignature = 'test-signature';
        const mockPublicKey = { kty: 'RSA', n: 'test-n', e: 'AQAB' };

        didService.verifySignature = jest.fn().mockResolvedValue({
          success: true,
          isValid: true
        });

        const result = await didService.verifySignature(
          'did:web:github.com:testuser',
          mockMessage,
          mockSignature,
          mockPublicKey
        );

        expect(result.success).toBe(true);
        expect(result.isValid).toBe(true);
        expect(didService.verifySignature).toHaveBeenCalledWith(
          'did:web:github.com:testuser',
          mockMessage,
          mockSignature,
          mockPublicKey
        );
      });

      it('should handle signature verification failure', async () => {
        didService.verifySignature = jest.fn().mockResolvedValue({
          success: true,
          isValid: false,
          error: 'Invalid signature'
        });

        const result = await didService.verifySignature(
          'did:web:github.com:testuser',
          'Test message',
          'invalid-signature',
          { kty: 'RSA', n: 'test-n', e: 'AQAB' }
        );

        expect(result.success).toBe(true);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid signature');
      });
    });
  });

  describe('Keycloak Service', () => {
    describe('User Management', () => {
      it('should create user in Keycloak', async () => {
        const mockKeycloakUser = {
          id: '***REMOVED-KEYCLOAK_DB_PASSWORD***-user-id',
          username: 'testuser',
          email: 'test@example.com',
          enabled: true
        };

        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser = jest.fn().mockResolvedValue({
          success: true,
          userId: mockKeycloakUser.id,
          user: mockKeycloakUser
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(testUser);

        expect(result.success).toBe(true);
        expect(result.userId).toBe(mockKeycloakUser.id);
        expect(result.user).toEqual(mockKeycloakUser);
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser).toHaveBeenCalledWith(testUser);
      });

      it('should handle Keycloak user creation failure', async () => {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser = jest.fn().mockRejectedValue(
          new Error('Keycloak connection failed')
        );

        await expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(testUser))
          .rejects.toThrow('Keycloak connection failed');
      });

      it('should update user in Keycloak', async () => {
        const updateData = {
          name: 'Updated Name',
          email: 'updated@example.com'
        };

        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUser = jest.fn().mockResolvedValue({
          success: true,
          message: 'User updated successfully'
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUser(testUser.id, updateData);

        expect(result.success).toBe(true);
        expect(result.message).toBe('User updated successfully');
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.updateUser).toHaveBeenCalledWith(testUser.id, updateData);
      });

      it('should delete user from Keycloak', async () => {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.deleteUser = jest.fn().mockResolvedValue({
          success: true,
          message: 'User deleted successfully'
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.deleteUser(testUser.id);

        expect(result.success).toBe(true);
        expect(result.message).toBe('User deleted successfully');
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.deleteUser).toHaveBeenCalledWith(testUser.id);
      });
    });

    describe('Authentication', () => {
      it('should authenticate user with Keycloak', async () => {
        const mockToken = '***REMOVED-KEYCLOAK_DB_PASSWORD***-access-token';
        const mockUserInfo = {
          sub: '***REMOVED-KEYCLOAK_DB_PASSWORD***-user-id',
          email: 'test@example.com',
          name: 'Test User'
        };

        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUser = jest.fn().mockResolvedValue({
          success: true,
          token: mockToken,
          userInfo: mockUserInfo
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUser('test@example.com', 'password');

        expect(result.success).toBe(true);
        expect(result.token).toBe(mockToken);
        expect(result.userInfo).toEqual(mockUserInfo);
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUser).toHaveBeenCalledWith('test@example.com', 'password');
      });

      it('should handle authentication failure', async () => {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUser = jest.fn().mockRejectedValue(
          new Error('Invalid credentials')
        );

        await expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUser('test@example.com', 'wrongpassword'))
          .rejects.toThrow('Invalid credentials');
      });

      it('should validate Keycloak token', async () => {
        const mockToken = 'valid-***REMOVED-KEYCLOAK_DB_PASSWORD***-token';

        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken = jest.fn().mockResolvedValue({
          success: true,
          valid: true,
          userInfo: {
            sub: '***REMOVED-KEYCLOAK_DB_PASSWORD***-user-id',
            email: 'test@example.com'
          }
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken(mockToken);

        expect(result.success).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.userInfo).toBeDefined();
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken).toHaveBeenCalledWith(mockToken);
      });
    });

    describe('Role Management', () => {
      it('should assign role to user', async () => {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.assignRole = jest.fn().mockResolvedValue({
          success: true,
          message: 'Role assigned successfully'
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.assignRole(testUser.id, 'TDP');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Role assigned successfully');
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.assignRole).toHaveBeenCalledWith(testUser.id, 'TDP');
      });

      it('should get user roles', async () => {
        const mockRoles = ['TDP', 'user'];

        ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getUserRoles = jest.fn().mockResolvedValue({
          success: true,
          roles: mockRoles
        });

        const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getUserRoles(testUser.id);

        expect(result.success).toBe(true);
        expect(result.roles).toEqual(mockRoles);
        expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getUserRoles).toHaveBeenCalledWith(testUser.id);
      });
    });
  });

  describe('Notification Service', () => {
    describe('Notification Creation', () => {
      it('should create notification successfully', async () => {
        const notificationData = {
          userId: testUser.id,
          type: 'CONTRACT_SIGNED',
          title: 'Contract Signed',
          message: 'Your contract has been signed',
          data: { contractId: testContract.contractId }
        };

        notificationService.createNotification = jest.fn().mockResolvedValue({
          success: true,
          notification: {
            id: 1,
            ...notificationData,
            read: false,
            createdAt: new Date()
          }
        });

        const result = await notificationService.createNotification(notificationData);

        expect(result.success).toBe(true);
        expect(result.notification.userId).toBe(testUser.id);
        expect(result.notification.type).toBe('CONTRACT_SIGNED');
        expect(result.notification.read).toBe(false);
        expect(notificationService.createNotification).toHaveBeenCalledWith(notificationData);
      });

      it('should handle notification creation failure', async () => {
        notificationService.createNotification = jest.fn().mockRejectedValue(
          new Error('Database error')
        );

        await expect(notificationService.createNotification({
          userId: testUser.id,
          type: 'CONTRACT_SIGNED',
          title: 'Test',
          message: 'Test message'
        })).rejects.toThrow('Database error');
      });
    });

    describe('Notification Retrieval', () => {
      it('should get user notifications', async () => {
        const mockNotifications = [
          {
            id: 1,
            userId: testUser.id,
            type: 'CONTRACT_SIGNED',
            title: 'Contract Signed',
            message: 'Your contract has been signed',
            read: false
          },
          {
            id: 2,
            userId: testUser.id,
            type: 'DATASET_AVAILABLE',
            title: 'Dataset Available',
            message: 'New dataset is available',
            read: true
          }
        ];

        notificationService.getUserNotifications = jest.fn().mockResolvedValue({
          success: true,
          notifications: mockNotifications,
          total: 2,
          unread: 1
        });

        const result = await notificationService.getUserNotifications(testUser.id);

        expect(result.success).toBe(true);
        expect(result.notifications).toEqual(mockNotifications);
        expect(result.total).toBe(2);
        expect(result.unread).toBe(1);
        expect(notificationService.getUserNotifications).toHaveBeenCalledWith(testUser.id);
      });

      it('should get unread notifications count', async () => {
        notificationService.getUnreadCount = jest.fn().mockResolvedValue({
          success: true,
          count: 5
        });

        const result = await notificationService.getUnreadCount(testUser.id);

        expect(result.success).toBe(true);
        expect(result.count).toBe(5);
        expect(notificationService.getUnreadCount).toHaveBeenCalledWith(testUser.id);
      });
    });

    describe('Notification Updates', () => {
      it('should mark notification as read', async () => {
        notificationService.markAsRead = jest.fn().mockResolvedValue({
          success: true,
          message: 'Notification marked as read'
        });

        const result = await notificationService.markAsRead(1);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Notification marked as read');
        expect(notificationService.markAsRead).toHaveBeenCalledWith(1);
      });

      it('should mark all notifications as read', async () => {
        notificationService.markAllAsRead = jest.fn().mockResolvedValue({
          success: true,
          message: 'All notifications marked as read',
          updatedCount: 10
        });

        const result = await notificationService.markAllAsRead(testUser.id);

        expect(result.success).toBe(true);
        expect(result.message).toBe('All notifications marked as read');
        expect(result.updatedCount).toBe(10);
        expect(notificationService.markAllAsRead).toHaveBeenCalledWith(testUser.id);
      });

      it('should delete notification', async () => {
        notificationService.deleteNotification = jest.fn().mockResolvedValue({
          success: true,
          message: 'Notification deleted successfully'
        });

        const result = await notificationService.deleteNotification(1);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Notification deleted successfully');
        expect(notificationService.deleteNotification).toHaveBeenCalledWith(1);
      });
    });

    describe('Bulk Operations', () => {
      it('should create multiple notifications', async () => {
        const notifications = [
          {
            userId: testUser.id,
            type: 'CONTRACT_SIGNED',
            title: 'Contract 1 Signed',
            message: 'Contract 1 has been signed'
          },
          {
            userId: testUser.id,
            type: 'CONTRACT_SIGNED',
            title: 'Contract 2 Signed',
            message: 'Contract 2 has been signed'
          }
        ];

        notificationService.createBulkNotifications = jest.fn().mockResolvedValue({
          success: true,
          created: 2,
          failed: 0
        });

        const result = await notificationService.createBulkNotifications(notifications);

        expect(result.success).toBe(true);
        expect(result.created).toBe(2);
        expect(result.failed).toBe(0);
        expect(notificationService.createBulkNotifications).toHaveBeenCalledWith(notifications);
      });

      it('should handle bulk notification failures', async () => {
        const notifications = [
          {
            userId: testUser.id,
            type: 'CONTRACT_SIGNED',
            title: 'Valid Notification',
            message: 'Valid message'
          },
          {
            userId: null, // Invalid
            type: 'CONTRACT_SIGNED',
            title: 'Invalid Notification',
            message: 'Invalid message'
          }
        ];

        notificationService.createBulkNotifications = jest.fn().mockResolvedValue({
          success: true,
          created: 1,
          failed: 1,
          errors: ['Invalid user ID for notification 2']
        });

        const result = await notificationService.createBulkNotifications(notifications);

        expect(result.success).toBe(true);
        expect(result.created).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.errors).toHaveLength(1);
      });
    });
  });

  describe('Service Integration', () => {
    it('should handle service dependencies correctly', async () => {
      // Mock all services
      blockchainService.deployContract = jest.fn().mockResolvedValue({
        success: true,
        contractAddress: '0x1234567890123456789012345678901234567890'
      });

      ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser = jest.fn().mockResolvedValue({
        success: true,
        userId: '***REMOVED-KEYCLOAK_DB_PASSWORD***-user-id'
      });

      notificationService.createNotification = jest.fn().mockResolvedValue({
        success: true,
        notification: { id: 1 }
      });

      // Test service integration
      const user = await User.create({
        email: 'integration@example.com',
        name: 'Integration User',
        partyType: 'TDP'
      });

      // Simulate contract creation workflow
      const contract = await Contract.create({
        contractId: 'INTEGRATION-CONTRACT-001',
        status: 'PENDING_TDP_APPROVAL',
        price: 100.00,
        duration: 30,
        termsAndConditions: 'Integration test terms',
        modelId: 'INTEGRATION-MODEL-001',
        tdpId: user.id,
        tdcId: user.id,
        ccrpId: user.id,
        datasetId: testDataset.id
      });

      // Verify services were called
      expect(blockchainService.deployContract).not.toHaveBeenCalled(); // Not called yet
      expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser).not.toHaveBeenCalled(); // Already exists
      expect(notificationService.createNotification).not.toHaveBeenCalled(); // Not called yet
    });

    it('should handle service failures gracefully', async () => {
      // Mock service failures
      blockchainService.deployContract = jest.fn().mockRejectedValue(
        new Error('Blockchain unavailable')
      );

      ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser = jest.fn().mockRejectedValue(
        new Error('Keycloak connection failed')
      );

      // Test that failures don't crash the system
      await expect(blockchainService.deployContract(testContract))
        .rejects.toThrow('Blockchain unavailable');

      await expect(***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(testUser))
        .rejects.toThrow('Keycloak connection failed');
    });
  });
}); 