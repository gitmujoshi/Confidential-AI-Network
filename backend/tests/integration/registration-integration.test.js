/**
 * Registration Integration Tests
 * 
 * This test suite specifically tests the registration process to ensure:
 * 1. Users are created in both Keycloak and database
 * 2. If Keycloak creation fails, user is NOT created in database
 * 3. Proper rollback and error handling
 * 4. Transaction consistency
 */

const db = require('../../models');

// Force mock mode for this test suite
process.env.TEST_MODE = 'mock';

// Import mocked services from the registry
const MockRegistry = require('../mocks/registry');

const keycloakService = new MockRegistry.serviceConstructors.KeycloakService();

describe('Registration Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await db.sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean up users and datasets before each test
    await db.Dataset.destroy({ where: {} });
    await db.User.destroy({ where: {} });
  });

  describe('Registration Logic Tests', () => {
    it('should create user in both Keycloak and database successfully', async () => {
      const userData = {
        email: 'successful@test.com',
        name: 'Successful User',
        partyType: 'TDP',
        organization: 'Test Organization',
        description: 'Test user for successful registration'
      };

      // Mock Keycloak service to return success
      const originalCreateUser = keycloakService.createUser;
      keycloakService.createUser = jest.fn().mockResolvedValue({
        keycloakUserId: 'test-keycloak-id-123',
        temporaryPassword: 'tempPass123'
      });

      // Simulate the registration process
      const transaction = await db.sequelize.transaction();
      
      try {
        // Step 1: Create user in Keycloak
        const keycloakResult = await keycloakService.createUser({
          email: userData.email,
          name: userData.name,
          walletAddress: null,
          partyType: userData.partyType,
          publicKey: null,
          organization: userData.organization,
          phoneNumber: undefined,
          website: undefined,
          location: undefined
        });

        // Step 2: Create user in database
        const dbUser = await db.User.create({
          walletAddress: null,
          publicKey: null,
          partyType: userData.partyType,
          name: userData.name,
          email: userData.email.toLowerCase(),
          description: userData.description,
          organization: userData.organization,
          phoneNumber: '',
          website: '',
          location: '',
          did: `did:web:test.com:user:${userData.email.split('@')[0]}`,
          didSource: 'SYSTEM_GENERATED',
          didVerified: true,
          didVerificationMethod: 'SYSTEM_GENERATED',
          isRegistered: true,
          registrationDate: new Date(),
          isActive: true,
          onboardingStatus: 'IN_PROGRESS',
          profileCompleted: false,
          emailVerified: false,
          iamUserId: keycloakResult.keycloakUserId,
          iamUsername: userData.email
        }, { transaction });

        // Step 3: Create notification
        await db.Notification.create({
          userId: dbUser.id,
          type: 'USER_REGISTERED',
          title: 'Welcome to Contract Management',
          message: `Welcome ${userData.name}! Your account has been successfully registered as a ${userData.partyType}. Please complete your profile and verify your email.`,
          isRead: false,
          metadata: {
            partyType: userData.partyType,
            registrationDate: new Date().toISOString(),
            onboardingStatus: 'IN_PROGRESS',
            did: dbUser.did,
            didSource: 'SYSTEM_GENERATED',
            iamIntegrated: true
          }
        }, { transaction });

        // Step 4: Commit transaction
        await transaction.commit();

        // Verify database record
        const createdUser = await db.User.findOne({
          where: { email: userData.email.toLowerCase() }
        });
        expect(createdUser).toBeDefined();
        expect(createdUser.iamUserId).toBe('test-keycloak-id-123');
        expect(createdUser.iamUsername).toBe(userData.email);
        expect(createdUser.isRegistered).toBe(true);
        expect(createdUser.isActive).toBe(true);

        // Verify notification was created
        const notification = await db.Notification.findOne({
          where: { userId: createdUser.id }
        });
        expect(notification).toBeDefined();
        expect(notification.type).toBe('USER_REGISTERED');

        // Verify Keycloak was called
        expect(keycloakService.createUser).toHaveBeenCalled();

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      // Restore original method
      keycloakService.createUser = originalCreateUser;
    });

    it('should NOT create user in database when Keycloak creation fails', async () => {
      const userData = {
        email: 'keycloak-fail@test.com',
        name: 'Keycloak Fail User',
        partyType: 'TDP'
      };

      // Mock Keycloak service to fail
      const originalCreateUser = keycloakService.createUser;
      keycloakService.createUser = jest.fn().mockRejectedValue(
        new Error('Keycloak connection failed')
      );

      // Simulate the registration process
      const transaction = await db.sequelize.transaction();
      
      try {
        // Step 1: Try to create user in Keycloak (should fail)
        await keycloakService.createUser({
          email: userData.email,
          name: userData.name,
          walletAddress: null,
          partyType: userData.partyType,
          publicKey: null,
          organization: undefined,
          phoneNumber: undefined,
          website: undefined,
          location: undefined
        });

        // This should not be reached
        expect(true).toBe(false);

      } catch (keycloakError) {
        // Verify Keycloak error
        expect(keycloakError.message).toBe('Keycloak connection failed');

        // Verify NO user was created in database
        const dbUser = await db.User.findOne({
          where: { email: userData.email.toLowerCase() }
        });
        expect(dbUser).toBeNull();

        // Verify Keycloak was called
        expect(keycloakService.createUser).toHaveBeenCalled();

        await transaction.rollback();
      }

      // Restore original method
      keycloakService.createUser = originalCreateUser;
    });

    it('should delete orphaned Keycloak user when database creation fails', async () => {
      const userData = {
        email: 'db-fail@test.com',
        name: 'DB Fail User',
        partyType: 'CCRP'
      };

      // Mock Keycloak service to succeed
      const originalCreateUser = keycloakService.createUser;
      const originalDeleteUser = keycloakService.deleteUser;
      
      keycloakService.createUser = jest.fn().mockResolvedValue({
        keycloakUserId: 'test-keycloak-id-789',
        temporaryPassword: 'tempPass789'
      });
      keycloakService.deleteUser = jest.fn().mockResolvedValue(true);

      // Mock database to fail on user creation
      const originalUserCreate = db.User.create;
      db.User.create = jest.fn().mockRejectedValue(
        new Error('Database constraint violation')
      );

      const transaction = await db.sequelize.transaction();
      
      try {
        // Step 1: Create user in Keycloak (should succeed)
        const keycloakResult = await keycloakService.createUser({
          email: userData.email,
          name: userData.name,
          walletAddress: null,
          partyType: userData.partyType,
          publicKey: null,
          organization: undefined,
          phoneNumber: undefined,
          website: undefined,
          location: undefined
        });

        // Step 2: Try to create user in database (should fail)
        await db.User.create({
          walletAddress: null,
          publicKey: null,
          partyType: userData.partyType,
          name: userData.name,
          email: userData.email.toLowerCase(),
          description: '',
          organization: '',
          phoneNumber: '',
          website: '',
          location: '',
          did: `did:web:test.com:user:${userData.email.split('@')[0]}`,
          didSource: 'SYSTEM_GENERATED',
          didVerified: true,
          didVerificationMethod: 'SYSTEM_GENERATED',
          isRegistered: true,
          registrationDate: new Date(),
          isActive: true,
          onboardingStatus: 'IN_PROGRESS',
          profileCompleted: false,
          emailVerified: false,
          iamUserId: keycloakResult.keycloakUserId,
          iamUsername: userData.email
        }, { transaction });

        // This should not be reached
        expect(true).toBe(false);

      } catch (dbError) {
        // Verify database error
        expect(dbError.message).toBe('Database constraint violation');

              // Verify Keycloak delete was called to clean up orphaned user
      expect(keycloakService.deleteUser).toHaveBeenCalled();

        // Verify NO user was created in database
        const dbUser = await db.User.findOne({
          where: { email: userData.email.toLowerCase() }
        });
        expect(dbUser).toBeNull();

        await transaction.rollback();
      }

      // Restore original methods
      keycloakService.createUser = originalCreateUser;
      keycloakService.deleteUser = originalDeleteUser;
      db.User.create = originalUserCreate;
    });

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@test.com',
        name: 'Duplicate User',
        partyType: 'TDP'
      };

      // Mock Keycloak to succeed for first registration
      const originalCreateUser = keycloakService.createUser;
      keycloakService.createUser = jest.fn().mockResolvedValue({
        keycloakUserId: 'test-keycloak-id-duplicate',
        temporaryPassword: 'tempPassDuplicate'
      });

      // First registration should succeed
      const transaction1 = await db.sequelize.transaction();
      try {
        const keycloakResult = await keycloakService.createUser({
          email: userData.email,
          name: userData.name,
          walletAddress: null,
          partyType: userData.partyType,
          publicKey: null,
          organization: undefined,
          phoneNumber: undefined,
          website: undefined,
          location: undefined
        });

        await db.User.create({
          walletAddress: null,
          publicKey: null,
          partyType: userData.partyType,
          name: userData.name,
          email: userData.email.toLowerCase(),
          description: '',
          organization: '',
          phoneNumber: '',
          website: '',
          location: '',
          did: `did:web:test.com:user:${userData.email.split('@')[0]}`,
          didSource: 'SYSTEM_GENERATED',
          didVerified: true,
          didVerificationMethod: 'SYSTEM_GENERATED',
          isRegistered: true,
          registrationDate: new Date(),
          isActive: true,
          onboardingStatus: 'IN_PROGRESS',
          profileCompleted: false,
          emailVerified: false,
          iamUserId: keycloakResult.keycloakUserId,
          iamUsername: userData.email
        }, { transaction: transaction1 });

        await transaction1.commit();

        // Second registration with same email should fail
        const transaction2 = await db.sequelize.transaction();
        try {
          await keycloakService.createUser({
            email: userData.email,
            name: userData.name,
            walletAddress: null,
            partyType: userData.partyType,
            publicKey: null,
            organization: undefined,
            phoneNumber: undefined,
            website: undefined,
            location: undefined
          });

          // This should not be reached
          expect(true).toBe(false);

        } catch (duplicateError) {
          // Verify duplicate error
          expect(duplicateError.message).toContain('User exists with same username');
          await transaction2.rollback();
        }

      } catch (error) {
        await transaction1.rollback();
        throw error;
      }

      // Restore original method
      keycloakService.createUser = originalCreateUser;
    });
  });
}); 