// Centralized Jest mocks for mock test mode
function setupMocks() {
  jest.mock('../services/didService', () => {
    return jest.fn().mockImplementation(() => ({
      resolveDID: jest.fn().mockResolvedValue({
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
      }),
      extractPublicKey: jest.fn().mockResolvedValue({
        kty: 'EC',
        crv: 'secp256k1',
        x: 'mock-x-coordinate',
        y: 'mock-y-coordinate'
      })
    }));
  });

  jest.mock('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service', () => {
    return jest.fn().mockImplementation(() => ({
      createUser: jest.fn().mockResolvedValue({
        ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: 'mock-***REMOVED-KEYCLOAK_DB_PASSWORD***-user-id',
        temporaryPassword: 'mock-temp-password'
      }),
      updateUser: jest.fn().mockResolvedValue({
        success: true,
        message: 'User updated successfully'
      }),
      deleteUser: jest.fn().mockResolvedValue({
        success: true,
        message: 'User deleted successfully'
      }),
      authenticateUser: jest.fn().mockResolvedValue({
        success: true,
        token: 'mock-access-token',
        userInfo: {
          sub: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      }),
      validateToken: jest.fn().mockResolvedValue({
        valid: true,
        payload: {
          sub: 'mock-user-id',
          email: 'test@example.com',
          realm_access: { roles: ['TDP'] }
        }
      }),
      assignRole: jest.fn().mockResolvedValue({
        success: true,
        message: 'Role assigned successfully'
      }),
      getUserRoles: jest.fn().mockResolvedValue(['TDP', 'USER'])
    }));
  });

  jest.mock('../services/blockchainService', () => {
    return jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
      isConnected: jest.fn().mockResolvedValue(false),
      getMode: jest.fn().mockReturnValue({
        blockchainEnabled: false,
        blockchainAvailable: false,
        mode: 'DATABASE_ONLY'
      }),
      createContract: jest.fn().mockResolvedValue({
        success: true,
        transactionHash: 'MOCK_TX_HASH',
        contractId: '1',
        message: 'Contract created successfully (mock)'
      }),
      signContract: jest.fn().mockResolvedValue({
        success: true,
        transactionHash: 'MOCK_SIGN_TX_HASH',
        message: 'Contract signed successfully (mock)'
      }),
      selectCCRP: jest.fn().mockResolvedValue({
        success: true,
        transactionHash: 'MOCK_CCRP_TX_HASH',
        message: 'CCRP selected successfully (mock)'
      }),
      getContract: jest.fn().mockResolvedValue({
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
      }),
      healthCheck: jest.fn().mockResolvedValue({
        blockchainEnabled: false,
        blockchainAvailable: false,
        mode: 'DATABASE_ONLY',
        connected: false,
        contractAddress: null,
        timestamp: new Date().toISOString()
      })
    }));
  });

  jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }));

  jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true)
  }));

  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ userId: 'mock-user-id', role: 'TDP' })
  }));
}

module.exports = { setupMocks }; 