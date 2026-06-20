const request = require('supertest');
const app = require('../../server');
const { Sequelize } = require('sequelize');
const SecretManager = require('../../services/secretManager');

// Mock the secret manager for E2E tests
jest.mock('../../services/secretManager');

describe('Cloud Credentials E2E Workflow Tests', () => {
  let adminToken;
  let ccrpToken;
  let testUserId;
  let testCredentialId;

  beforeAll(async () => {
    // Setup test database
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'contract_management_test',
      logging: false
    });

    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create test user
    const { User } = require('../../models');
    const testUser = await User.create({
      email: 'e2e-tsp@example.com',
      password_hash: 'hashed-password',
      party_type: 'TSP',
      iam_user_id: 'e2e-tsp-iam-id',
      iam_username: 'e2e-tsp'
    });
    testUserId = testUser.id;

    // Generate test tokens
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign(
      { id: 1, email: 'admin@example.com', partyType: 'AppAdmin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    ccrpToken = jwt.sign(
      { id: testUserId, email: 'e2e-tsp@example.com', partyType: 'TSP' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'contract_management_test',
      logging: false
    });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear test data
    const { TSPCloudCredentials } = require('../../models');
    await TSPCloudCredentials.destroy({ where: {} });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Complete Cloud Credentials Workflow', () => {
    test('should complete full Azure credentials workflow', async () => {
      // Step 1: Check initial state (no credentials)
      let response = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);

      // Step 2: Add Azure credentials
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({}),
        getCredentials: jest.fn().mockResolvedValue({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          subscriptionId: 'test-subscription-id',
          tenantId: 'test-tenant-id'
        }),
        deleteCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const azureCredentialData = {
        cloudProvider: 'AZURE',
        secretManager: 'VAULT',
        secretName: 'e2e-azure-credentials',
        defaultLocation: 'eastus',
        defaultVMSize: 'Standard_D2s_v3',
        defaultStorageSku: 'Standard_LRS',
        defaultDatabaseSku: 'Basic',
        enableEncryption: true,
        enableMonitoring: true,
        enableKeyVault: true,
        budgetLimit: 1000.00,
        alertThreshold: 0.8,
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          subscriptionId: 'test-subscription-id',
          tenantId: 'test-tenant-id'
        }
      };

      response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(azureCredentialData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('cloudProvider', 'AZURE');
      expect(response.body).toHaveProperty('secretName', 'e2e-azure-credentials');
      expect(response.body).toHaveProperty('validationStatus', 'PENDING');
      testCredentialId = response.body.id;

      // Step 3: Verify credentials were stored in secret manager
      expect(mockSecretManager.storeCredentials).toHaveBeenCalledWith(
        'e2e-azure-credentials',
        'VAULT',
        azureCredentialData.credentials,
        'AZURE'
      );

      // Step 4: List credentials (should now show the new credential)
      response = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('cloudProvider', 'AZURE');
      expect(response.body[0]).toHaveProperty('secretName', 'e2e-azure-credentials');

      // Step 5: Validate credentials
      response = await request(app)
        .post(`/api/tsp/cloud-credentials/${testCredentialId}/validate`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid');
      expect(mockSecretManager.getCredentials).toHaveBeenCalledWith(
        'e2e-azure-credentials',
        'VAULT'
      );

      // Step 6: Update credential
      const updateData = {
        defaultLocation: 'westus',
        defaultVMSize: 'Standard_D4s_v3',
        budgetLimit: 2000.00
      };

      response = await request(app)
        .put(`/api/tsp/cloud-credentials/${testCredentialId}`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('defaultLocation', 'westus');
      expect(response.body).toHaveProperty('defaultVMSize', 'Standard_D4s_v3');
      expect(response.body).toHaveProperty('budgetLimit', 2000.00);

      // Step 7: Test cloud provider operations
      response = await request(app)
        .get('/api/cloud-providers/AZURE/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      response = await request(app)
        .get('/api/cloud-providers/AZURE/instance-types')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Step 8: Test cost estimation
      const costRequirements = {
        vmSize: 'Standard_D2s_v3',
        storageSku: 'Standard_LRS',
        databaseSku: 'Basic',
        region: 'eastus',
        duration: 30
      };

      response = await request(app)
        .post('/api/cloud-providers/AZURE/estimate-costs')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ requirements: costRequirements });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('breakdown');

      // Step 9: Delete credential
      response = await request(app)
        .delete(`/api/tsp/cloud-credentials/${testCredentialId}`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(mockSecretManager.deleteCredentials).toHaveBeenCalledWith(
        'e2e-azure-credentials',
        'VAULT'
      );

      // Step 10: Verify credential is deleted
      response = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    test('should complete full AWS credentials workflow', async () => {
      // Step 1: Add AWS credentials
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({}),
        getCredentials: jest.fn().mockResolvedValue({
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          region: 'us-east-1'
        }),
        deleteCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const awsCredentialData = {
        cloudProvider: 'AWS',
        secretManager: 'AWS_SECRETS',
        secretName: 'e2e-aws-credentials',
        defaultLocation: 'us-east-1',
        defaultVMSize: 't3.medium',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          region: 'us-east-1'
        }
      };

      let response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(awsCredentialData);

      expect(response.status).toBe(201);
      const awsCredentialId = response.body.id;

      // Step 2: Validate AWS credentials
      response = await request(app)
        .post(`/api/tsp/cloud-credentials/${awsCredentialId}/validate`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);

      // Step 3: Test AWS provider operations
      response = await request(app)
        .get('/api/cloud-providers/AWS/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      response = await request(app)
        .get('/api/cloud-providers/AWS/instance-types')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Step 4: Test AWS cost estimation
      const costRequirements = {
        instanceType: 't3.medium',
        storageType: 'gp2',
        databaseType: 'rds',
        region: 'us-east-1',
        duration: 30
      };

      response = await request(app)
        .post('/api/cloud-providers/AWS/estimate-costs')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ requirements: costRequirements });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('breakdown');

      // Step 5: Clean up
      response = await request(app)
        .delete(`/api/tsp/cloud-credentials/${awsCredentialId}`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
    });

    test('should complete full GCP credentials workflow', async () => {
      // Step 1: Add GCP credentials
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({}),
        getCredentials: jest.fn().mockResolvedValue({
          projectId: 'test-project-id',
          serviceAccountKey: 'test-service-account-key'
        }),
        deleteCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const gcpCredentialData = {
        cloudProvider: 'GCP',
        secretManager: 'GCP_SECRETS',
        secretName: 'e2e-gcp-credentials',
        defaultLocation: 'us-central1',
        defaultVMSize: 'n1-standard-2',
        credentials: {
          projectId: 'test-project-id',
          serviceAccountKey: 'test-service-account-key'
        }
      };

      let response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(gcpCredentialData);

      expect(response.status).toBe(201);
      const gcpCredentialId = response.body.id;

      // Step 2: Validate GCP credentials
      response = await request(app)
        .post(`/api/tsp/cloud-credentials/${gcpCredentialId}/validate`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);

      // Step 3: Test GCP provider operations
      response = await request(app)
        .get('/api/cloud-providers/GCP/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      response = await request(app)
        .get('/api/cloud-providers/GCP/instance-types')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Step 4: Test GCP cost estimation
      const costRequirements = {
        instanceType: 'n1-standard-2',
        region: 'us-central1',
        duration: 30
      };

      response = await request(app)
        .post('/api/cloud-providers/GCP/estimate-costs')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ requirements: costRequirements });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('breakdown');

      // Step 5: Clean up
      response = await request(app)
        .delete(`/api/tsp/cloud-credentials/${gcpCredentialId}`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Multi-Cloud Credentials Management', () => {
    test('should manage multiple cloud providers simultaneously', async () => {
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({}),
        getCredentials: jest.fn().mockResolvedValue({}),
        deleteCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      // Add Azure credentials
      const azureCredential = {
        cloudProvider: 'AZURE',
        secretManager: 'VAULT',
        secretName: 'multi-azure-credentials',
        defaultLocation: 'eastus',
        defaultVMSize: 'Standard_D2s_v3',
        credentials: { clientId: 'azure-client', clientSecret: 'azure-secret' }
      };

      let response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(azureCredential);

      expect(response.status).toBe(201);
      const azureId = response.body.id;

      // Add AWS credentials
      const awsCredential = {
        cloudProvider: 'AWS',
        secretManager: 'AWS_SECRETS',
        secretName: 'multi-aws-credentials',
        defaultLocation: 'us-east-1',
        defaultVMSize: 't3.medium',
        credentials: { accessKeyId: 'aws-key', secretAccessKey: 'aws-secret' }
      };

      response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(awsCredential);

      expect(response.status).toBe(201);
      const awsId = response.body.id;

      // Add GCP credentials
      const gcpCredential = {
        cloudProvider: 'GCP',
        secretManager: 'GCP_SECRETS',
        secretName: 'multi-gcp-credentials',
        defaultLocation: 'us-central1',
        defaultVMSize: 'n1-standard-2',
        credentials: { projectId: 'gcp-project', serviceAccountKey: 'gcp-key' }
      };

      response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(gcpCredential);

      expect(response.status).toBe(201);
      const gcpId = response.body.id;

      // List all credentials
      response = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
      expect(response.body.some(c => c.cloudProvider === 'AZURE')).toBe(true);
      expect(response.body.some(c => c.cloudProvider === 'AWS')).toBe(true);
      expect(response.body.some(c => c.cloudProvider === 'GCP')).toBe(true);

      // Validate all credentials
      await Promise.all([
        request(app)
          .post(`/api/tsp/cloud-credentials/${azureId}/validate`)
          .set('Authorization', `Bearer ${ccrpToken}`),
        request(app)
          .post(`/api/tsp/cloud-credentials/${awsId}/validate`)
          .set('Authorization', `Bearer ${ccrpToken}`),
        request(app)
          .post(`/api/tsp/cloud-credentials/${gcpId}/validate`)
          .set('Authorization', `Bearer ${ccrpToken}`)
      ]);

      // Test all cloud provider operations
      const providers = ['AZURE', 'AWS', 'GCP'];
      for (const provider of providers) {
        // Test regions
        response = await request(app)
          .get(`/api/cloud-providers/${provider}/regions`)
          .set('Authorization', `Bearer ${ccrpToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        // Test instance types
        response = await request(app)
          .get(`/api/cloud-providers/${provider}/instance-types`)
          .set('Authorization', `Bearer ${ccrpToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      }

      // Clean up all credentials
      await Promise.all([
        request(app)
          .delete(`/api/tsp/cloud-credentials/${azureId}`)
          .set('Authorization', `Bearer ${ccrpToken}`),
        request(app)
          .delete(`/api/tsp/cloud-credentials/${awsId}`)
          .set('Authorization', `Bearer ${ccrpToken}`),
        request(app)
          .delete(`/api/tsp/cloud-credentials/${gcpId}`)
          .set('Authorization', `Bearer ${ccrpToken}`)
      ]);

      // Verify all credentials are deleted
      response = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid credential data', async () => {
      const invalidCredential = {
        cloudProvider: 'INVALID_PROVIDER',
        secretManager: 'INVALID_MANAGER',
        secretName: '',
        credentials: {}
      };

      const response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(invalidCredential);

      expect(response.status).toBe(400);
    });

    test('should handle secret manager errors', async () => {
      const mockSecretManager = {
        storeCredentials: jest.fn().mockRejectedValue(new Error('Storage failed'))
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const credentialData = {
        cloudProvider: 'AZURE',
        secretManager: 'VAULT',
        secretName: 'error-test-credentials',
        credentials: { clientId: 'test', clientSecret: 'test' }
      };

      const response = await request(app)
        .post('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(credentialData);

      expect(response.status).toBe(500);
    });

    test('should handle authentication errors', async () => {
      const response = await request(app)
        .get('/api/tsp/cloud-credentials');

      expect(response.status).toBe(401);
    });

    test('should handle authorization errors', async () => {
      const tdpToken = require('jsonwebtoken').sign(
        { id: 2, email: 'tdp@example.com', partyType: 'TDP' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${tdpToken}`);

      expect(response.status).toBe(403);
    });

    test('should handle non-existent credential operations', async () => {
      const response = await request(app)
        .get('/api/tsp/cloud-credentials/999999')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent credential operations', async () => {
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({}),
        getCredentials: jest.fn().mockResolvedValue({}),
        deleteCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      // Create multiple credentials concurrently
      const credentialPromises = Array.from({ length: 5 }, (_, i) => {
        const credentialData = {
          cloudProvider: 'AZURE',
          secretManager: 'VAULT',
          secretName: `concurrent-credential-${i}`,
          defaultLocation: 'eastus',
          defaultVMSize: 'Standard_D2s_v3',
          credentials: { clientId: `client-${i}`, clientSecret: `secret-${i}` }
        };

        return request(app)
          .post('/api/tsp/cloud-credentials')
          .set('Authorization', `Bearer ${ccrpToken}`)
          .send(credentialData);
      });

      const responses = await Promise.all(credentialPromises);

      // Verify all credentials were created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      // List all credentials
      const listResponse = await request(app)
        .get('/api/tsp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.length).toBe(5);

      // Clean up
      const deletePromises = responses.map(response => 
        request(app)
          .delete(`/api/tsp/cloud-credentials/${response.body.id}`)
          .set('Authorization', `Bearer ${ccrpToken}`)
      );

      await Promise.all(deletePromises);
    });
  });
}); 