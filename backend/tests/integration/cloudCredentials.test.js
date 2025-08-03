const request = require('supertest');
const app = require('../../server');
const { Sequelize } = require('sequelize');
const SecretManager = require('../../services/secretManager');
const CCRPCloudCredentials = require('../../models/CCRPCloudCredentials');

// Mock the secret manager
jest.mock('../../services/secretManager');

describe('Cloud Credentials API Integration Tests', () => {
  let adminToken;
  let ccrpToken;
  let testUserId;

  beforeAll(async () => {
    // Setup test database
    const sequelize = new Sequelize({
      dialect: '***REMOVED-DB_PASSWORD***',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'contract_management_test',
      logging: false
    });

    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    // Create test user
    const { User } = require('../../models');
    const testUser = await User.create({
      email: 'test-ccrp@example.com',
      password_hash: 'hashed-password',
      party_type: 'CCRP',
      iam_user_id: 'test-iam-id',
      iam_username: 'test-ccrp'
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
      { id: testUserId, email: 'test-ccrp@example.com', partyType: 'CCRP' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    const sequelize = new Sequelize({
      dialect: '***REMOVED-DB_PASSWORD***',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      username: process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'contract_management_test',
      logging: false
    });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear test data
    await CCRPCloudCredentials.destroy({ where: {} });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/ccrp/cloud-credentials', () => {
    test('should return empty list when no credentials exist', async () => {
      const response = await request(app)
        .get('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should return user credentials', async () => {
      // Create test credential
      await CCRPCloudCredentials.create({
        ccrpUserId: testUserId,
        cloudProvider: 'AZURE',
        secretName: 'test-azure-credentials',
        secretManager: 'VAULT',
        defaultLocation: 'eastus',
        defaultVMSize: 'Standard_D2s_v3',
        validationStatus: 'VALID'
      });

      const response = await request(app)
        .get('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('cloudProvider', 'AZURE');
      expect(response.body[0]).toHaveProperty('secretName', 'test-azure-credentials');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/ccrp/cloud-credentials');

      expect(response.status).toBe(401);
    });

    test('should require CCRP or AppAdmin role', async () => {
      const tdpToken = require('jsonwebtoken').sign(
        { id: 2, email: 'tdp@example.com', partyType: 'TDP' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${tdpToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/ccrp/cloud-credentials', () => {
    test('should create new Azure credential', async () => {
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const credentialData = {
        cloudProvider: 'AZURE',
        secretManager: 'VAULT',
        secretName: 'new-azure-credentials',
        defaultLocation: 'eastus',
        defaultVMSize: 'Standard_D2s_v3',
        credentials: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          subscriptionId: 'test-subscription-id',
          tenantId: 'test-tenant-id'
        }
      };

      const response = await request(app)
        .post('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(credentialData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('cloudProvider', 'AZURE');
      expect(response.body).toHaveProperty('secretName', 'new-azure-credentials');
      expect(mockSecretManager.storeCredentials).toHaveBeenCalledWith(
        'new-azure-credentials',
        'VAULT',
        credentialData.credentials,
        'AZURE'
      );
    });

    test('should create new AWS credential', async () => {
      const mockSecretManager = {
        storeCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const credentialData = {
        cloudProvider: 'AWS',
        secretManager: 'AWS_SECRETS',
        secretName: 'new-aws-credentials',
        defaultLocation: 'us-east-1',
        defaultVMSize: 't3.medium',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
          region: 'us-east-1'
        }
      };

      const response = await request(app)
        .post('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(credentialData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('cloudProvider', 'AWS');
      expect(response.body).toHaveProperty('secretName', 'new-aws-credentials');
    });

    test('should validate required fields', async () => {
      const credentialData = {
        cloudProvider: 'AZURE',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(credentialData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle secret manager errors', async () => {
      const mockSecretManager = {
        storeCredentials: jest.fn().mockRejectedValue(new Error('Storage failed'))
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const credentialData = {
        cloudProvider: 'AZURE',
        secretManager: 'VAULT',
        secretName: 'test-credentials',
        credentials: {}
      };

      const response = await request(app)
        .post('/api/ccrp/cloud-credentials')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(credentialData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/ccrp/cloud-credentials/:id', () => {
    test('should update existing credential', async () => {
      // Create test credential
      const credential = await CCRPCloudCredentials.create({
        ccrpUserId: testUserId,
        cloudProvider: 'AZURE',
        secretName: 'test-azure-credentials',
        secretManager: 'VAULT',
        defaultLocation: 'eastus',
        defaultVMSize: 'Standard_D2s_v3'
      });

      const updateData = {
        defaultLocation: 'westus',
        defaultVMSize: 'Standard_D4s_v3'
      };

      const response = await request(app)
        .put(`/api/ccrp/cloud-credentials/${credential.id}`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('defaultLocation', 'westus');
      expect(response.body).toHaveProperty('defaultVMSize', 'Standard_D4s_v3');
    });

    test('should not allow updating other user credentials', async () => {
      // Create credential for different user
      const otherCredential = await CCRPCloudCredentials.create({
        ccrpUserId: testUserId + 1,
        cloudProvider: 'AZURE',
        secretName: 'other-user-credentials',
        secretManager: 'VAULT'
      });

      const response = await request(app)
        .put(`/api/ccrp/cloud-credentials/${otherCredential.id}`)
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ defaultLocation: 'westus' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/ccrp/cloud-credentials/:id', () => {
    test('should delete credential', async () => {
      // Create test credential
      const credential = await CCRPCloudCredentials.create({
        ccrpUserId: testUserId,
        cloudProvider: 'AZURE',
        secretName: 'test-azure-credentials',
        secretManager: 'VAULT'
      });

      const mockSecretManager = {
        deleteCredentials: jest.fn().mockResolvedValue({})
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const response = await request(app)
        .delete(`/api/ccrp/cloud-credentials/${credential.id}`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(mockSecretManager.deleteCredentials).toHaveBeenCalledWith(
        'test-azure-credentials',
        'VAULT'
      );

      // Verify credential is deleted
      const deletedCredential = await CCRPCloudCredentials.findByPk(credential.id);
      expect(deletedCredential).toBeNull();
    });

    test('should not allow deleting other user credentials', async () => {
      // Create credential for different user
      const otherCredential = await CCRPCloudCredentials.create({
        ccrpUserId: testUserId + 1,
        cloudProvider: 'AZURE',
        secretName: 'other-user-credentials',
        secretManager: 'VAULT'
      });

      const response = await request(app)
        .delete(`/api/ccrp/cloud-credentials/${otherCredential.id}`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/ccrp/cloud-credentials/:id/validate', () => {
    test('should validate credential successfully', async () => {
      // Create test credential
      const credential = await CCRPCloudCredentials.create({
        ccrpUserId: testUserId,
        cloudProvider: 'AZURE',
        secretName: 'test-azure-credentials',
        secretManager: 'VAULT'
      });

      const mockSecretManager = {
        getCredentials: jest.fn().mockResolvedValue({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        })
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const response = await request(app)
        .post(`/api/ccrp/cloud-credentials/${credential.id}/validate`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid');
      expect(mockSecretManager.getCredentials).toHaveBeenCalledWith(
        'test-azure-credentials',
        'VAULT'
      );
    });

    test('should handle validation errors', async () => {
      // Create test credential
      const credential = await CCRPCloudCredentials.create({
        ccrpUserId: testUserId,
        cloudProvider: 'AZURE',
        secretName: 'test-azure-credentials',
        secretManager: 'VAULT'
      });

      const mockSecretManager = {
        getCredentials: jest.fn().mockRejectedValue(new Error('Validation failed'))
      };
      SecretManager.mockImplementation(() => mockSecretManager);

      const response = await request(app)
        .post(`/api/ccrp/cloud-credentials/${credential.id}/validate`)
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/secret-manager/available', () => {
    test('should return available secret managers', async () => {
      const response = await request(app)
        .get('/api/secret-manager/available')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('VAULT');
      expect(response.body).toHaveProperty('AWS_SECRETS');
      expect(response.body).toHaveProperty('AZURE_KEYVAULT');
      expect(response.body).toHaveProperty('GCP_SECRETS');
      expect(response.body).toHaveProperty('OCI_VAULT');
    });
  });

  describe('GET /api/cloud-providers/:provider/regions', () => {
    test('should return Azure regions', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/AZURE/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return AWS regions', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/AWS/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return GCP regions', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/GCP/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should handle invalid provider', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/INVALID/regions')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/cloud-providers/:provider/instance-types', () => {
    test('should return Azure VM sizes', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/AZURE/instance-types')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return AWS instance types', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/AWS/instance-types')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should return GCP instance types', async () => {
      const response = await request(app)
        .get('/api/cloud-providers/GCP/instance-types')
        .set('Authorization', `Bearer ${ccrpToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/cloud-providers/:provider/validate', () => {
    test('should validate Azure credentials', async () => {
      const credentials = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        subscriptionId: 'test-subscription-id',
        tenantId: 'test-tenant-id'
      };

      const response = await request(app)
        .post('/api/cloud-providers/AZURE/validate')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ credentials });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid');
    });

    test('should validate AWS credentials', async () => {
      const credentials = {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'us-east-1'
      };

      const response = await request(app)
        .post('/api/cloud-providers/AWS/validate')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ credentials });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid');
    });

    test('should handle invalid credentials', async () => {
      const credentials = {
        clientId: 'invalid-id',
        clientSecret: 'invalid-secret'
      };

      const response = await request(app)
        .post('/api/cloud-providers/AZURE/validate')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ credentials });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
    });
  });

  describe('POST /api/cloud-providers/:provider/estimate-costs', () => {
    test('should estimate Azure costs', async () => {
      const requirements = {
        vmSize: 'Standard_D2s_v3',
        storageSku: 'Standard_LRS',
        databaseSku: 'Basic',
        region: 'eastus',
        duration: 30
      };

      const response = await request(app)
        .post('/api/cloud-providers/AZURE/estimate-costs')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ requirements });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('breakdown');
    });

    test('should estimate AWS costs', async () => {
      const requirements = {
        instanceType: 't3.medium',
        storageType: 'gp2',
        databaseType: 'rds',
        region: 'us-east-1',
        duration: 30
      };

      const response = await request(app)
        .post('/api/cloud-providers/AWS/estimate-costs')
        .set('Authorization', `Bearer ${ccrpToken}`)
        .send({ requirements });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('breakdown');
    });
  });
}); 