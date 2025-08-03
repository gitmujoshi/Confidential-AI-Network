const SecretManager = require('../services/secretManager');
const { Sequelize } = require('sequelize');

// Mock the cloud provider services
jest.mock('../services/providers/azureProvider');
jest.mock('../services/providers/awsProvider');
jest.mock('../services/providers/gcpProvider');
jest.mock('../services/providers/ociProvider');

describe('SecretManager', () => {
  let secretManager;

  beforeEach(() => {
    secretManager = new SecretManager();
  });

  describe('constructor', () => {
    test('should initialize with all secret manager providers', () => {
      expect(secretManager.providers).toBeDefined();
      expect(secretManager.providers.VAULT).toBeDefined();
      expect(secretManager.providers.AWS_SECRETS).toBeDefined();
      expect(secretManager.providers.AZURE_KEYVAULT).toBeDefined();
      expect(secretManager.providers.GCP_SECRETS).toBeDefined();
      expect(secretManager.providers.OCI_VAULT).toBeDefined();
    });

    test('should get available secret managers', () => {
      const available = secretManager.getAvailableSecretManagers();
      expect(available).toHaveProperty('VAULT');
      expect(available).toHaveProperty('AWS_SECRETS');
      expect(available).toHaveProperty('AZURE_KEYVAULT');
      expect(available).toHaveProperty('GCP_SECRETS');
      expect(available).toHaveProperty('OCI_VAULT');
    });
  });

  describe('storeCredentials', () => {
    test('should store credentials in Vault', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        subscriptionId: 'test-subscription-id',
        tenantId: 'test-tenant-id'
      };

      const mockVaultProvider = {
        write: jest.fn().mockResolvedValue({})
      };
      secretManager.providers.VAULT = mockVaultProvider;

      await secretManager.storeCredentials('test-secret', 'VAULT', credentials, 'AZURE');

      expect(mockVaultProvider.write).toHaveBeenCalledWith(
        'secret/data/test-secret',
        expect.objectContaining({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          cloudProvider: 'AZURE',
          storedAt: expect.any(String)
        })
      );
    });

    test('should store credentials in AWS Secrets Manager', async () => {
      const credentials = {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1'
      };

      const mockAWSProvider = {
        putSecretValue: jest.fn().mockResolvedValue({})
      };
      secretManager.providers.AWS_SECRETS = mockAWSProvider;

      await secretManager.storeCredentials('test-aws-secret', 'AWS_SECRETS', credentials, 'AWS');

      expect(mockAWSProvider.putSecretValue).toHaveBeenCalledWith({
        SecretId: 'test-aws-secret',
        SecretString: expect.stringContaining('test-access-key')
      });
    });

    test('should handle storage errors', async () => {
      const mockVaultProvider = {
        write: jest.fn().mockRejectedValue(new Error('Storage failed'))
      };
      secretManager.providers.VAULT = mockVaultProvider;

      await expect(
        secretManager.storeCredentials('test-secret', 'VAULT', {}, 'AZURE')
      ).rejects.toThrow('Storage failed');
    });
  });

  describe('getCredentials', () => {
    test('should retrieve credentials from Vault', async () => {
      const mockCredentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        subscriptionId: 'test-subscription-id',
        tenantId: 'test-tenant-id'
      };

      const mockVaultProvider = {
        read: jest.fn().mockResolvedValue({
          data: {
            data: mockCredentials
          }
        })
      };
      secretManager.providers.VAULT = mockVaultProvider;

      const result = await secretManager.getCredentials('test-secret', 'VAULT');

      expect(mockVaultProvider.read).toHaveBeenCalledWith('secret/data/test-secret');
      expect(result).toEqual(mockCredentials);
    });

    test('should retrieve credentials from AWS Secrets Manager', async () => {
      const mockCredentials = {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1'
      };

      const mockAWSProvider = {
        getSecretValue: jest.fn().mockResolvedValue({
          SecretString: JSON.stringify(mockCredentials)
        })
      };
      secretManager.providers.AWS_SECRETS = mockAWSProvider;

      const result = await secretManager.getCredentials('test-aws-secret', 'AWS_SECRETS');

      expect(mockAWSProvider.getSecretValue).toHaveBeenCalledWith({
        SecretId: 'test-aws-secret'
      });
      expect(result).toEqual(mockCredentials);
    });

    test('should handle retrieval errors', async () => {
      const mockVaultProvider = {
        read: jest.fn().mockRejectedValue(new Error('Retrieval failed'))
      };
      secretManager.providers.VAULT = mockVaultProvider;

      await expect(
        secretManager.getCredentials('test-secret', 'VAULT')
      ).rejects.toThrow('Retrieval failed');
    });
  });

  describe('validateCredentials', () => {
    test('should validate credentials successfully', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };

      const mockVaultProvider = {
        read: jest.fn().mockResolvedValue({
          data: { data: credentials }
        })
      };
      secretManager.providers.VAULT = mockVaultProvider;

      const result = await secretManager.validateCredentials('test-secret', 'VAULT', 'AZURE');

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
    });

    test('should handle validation errors', async () => {
      const mockVaultProvider = {
        read: jest.fn().mockRejectedValue(new Error('Validation failed'))
      };
      secretManager.providers.VAULT = mockVaultProvider;

      await expect(
        secretManager.validateCredentials('test-secret', 'VAULT', 'AZURE')
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('deleteCredentials', () => {
    test('should delete credentials from Vault', async () => {
      const mockVaultProvider = {
        delete: jest.fn().mockResolvedValue({})
      };
      secretManager.providers.VAULT = mockVaultProvider;

      await secretManager.deleteCredentials('test-secret', 'VAULT');

      expect(mockVaultProvider.delete).toHaveBeenCalledWith('secret/data/test-secret');
    });

    test('should delete credentials from AWS Secrets Manager', async () => {
      const mockAWSProvider = {
        deleteSecret: jest.fn().mockResolvedValue({})
      };
      secretManager.providers.AWS_SECRETS = mockAWSProvider;

      await secretManager.deleteCredentials('test-aws-secret', 'AWS_SECRETS');

      expect(mockAWSProvider.deleteSecret).toHaveBeenCalledWith({
        SecretId: 'test-aws-secret'
      });
    });

    test('should handle deletion errors', async () => {
      const mockVaultProvider = {
        delete: jest.fn().mockRejectedValue(new Error('Deletion failed'))
      };
      secretManager.providers.VAULT = mockVaultProvider;

      await expect(
        secretManager.deleteCredentials('test-secret', 'VAULT')
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('getRecommendedSecretManager', () => {
    test('should return Vault as default recommendation', () => {
      const recommendation = secretManager.getRecommendedSecretManager();
      expect(recommendation).toBe('VAULT');
    });
  });

  describe('createProvider methods', () => {
    test('should create Vault provider', () => {
      const provider = secretManager.createVaultProvider();
      expect(provider).toBeDefined();
    });

    test('should create AWS provider', () => {
      const provider = secretManager.createAWSProvider();
      expect(provider).toBeDefined();
    });

    test('should create Azure provider', () => {
      const provider = secretManager.createAzureProvider();
      expect(provider).toBeDefined();
    });

    test('should create GCP provider', () => {
      const provider = secretManager.createGCPProvider();
      expect(provider).toBeDefined();
    });

    test('should create OCI provider', () => {
      const provider = secretManager.createOCIProvider();
      expect(provider).toBeDefined();
    });
  });
}); 