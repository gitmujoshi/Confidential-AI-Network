// Centralized Jest mocks for mock test mode
const MockRegistry = require('./registry');

function setupMocks() {
  // Mock database models using registry
  jest.mock('../../models', () => {
    return {
      User: MockRegistry.mocks.User,
      Dataset: MockRegistry.mocks.Dataset,
      Contract: MockRegistry.mocks.Contract,
      AIModel: MockRegistry.mocks.AIModel,
      Notification: MockRegistry.mocks.Notification,
      AuditLog: MockRegistry.mocks.AuditLog,
      sequelize: MockRegistry.database.sequelize
    };
  });

  // Mock services using registry constructors
  jest.mock('../../services/didService', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.DIDService());
  });
  jest.mock('../../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.KeycloakService());
  });
  jest.mock('../../services/blockchainService', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.BlockchainService());
  });
  jest.mock('../../services/globalDEPAIdService', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.GlobalDEPAIdService());
  });
  jest.mock('../../services/depaIdService', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.DEPAIdService());
  });
  jest.mock('../../services/scittCcfService', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.ScittCcfService());
  });
  jest.mock('../../services/contractRouterService', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.ContractRouterService());
  });
  jest.mock('../../services/systemHealthMonitor', () => {
    return jest.fn().mockImplementation(() => new MockRegistry.serviceConstructors.SystemHealthMonitor());
  });

  // Mock additional services that might be used
  jest.mock('../../services/emailService', () => {
    return jest.fn().mockImplementation(() => ({
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
      sendVerificationEmail: jest.fn().mockResolvedValue({ success: true })
    }));
  });

  jest.mock('../../services/notificationService', () => {
    return jest.fn().mockImplementation(() => ({
      createNotification: jest.fn().mockResolvedValue({ success: true }),
      getUserNotifications: jest.fn().mockResolvedValue([])
    }));
  });

  jest.mock('../../services/auditService', () => {
    return jest.fn().mockImplementation(() => ({
      logAction: jest.fn().mockResolvedValue({ success: true }),
      getAuditLogs: jest.fn().mockResolvedValue([])
    }));
  });

  jest.mock('../../services/dpdpService', () => {
    return jest.fn().mockImplementation(() => ({
      validateCompliance: jest.fn().mockResolvedValue({ compliant: true }),
      generateReport: jest.fn().mockResolvedValue({ report: 'mock-report' })
    }));
  });

  jest.mock('../../services/ricardianContractService', () => {
    return jest.fn().mockImplementation(() => ({
      generateContract: jest.fn().mockResolvedValue({ contract: 'mock-contract' }),
      validateContract: jest.fn().mockResolvedValue({ valid: true })
    }));
  });

  jest.mock('../../services/signingService', () => {
    return jest.fn().mockImplementation(() => ({
      signES256: jest.fn().mockResolvedValue({ signature: 'mock-signature' }),
      verifyES256: jest.fn().mockResolvedValue({ verified: true })
    }));
  });

  // Mock external dependencies
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