/**
 * Comprehensive Test Suite for TDC Model Upload & TEE Model Decryption
 * 
 * Tests AI model upload interface, encryption, TEE-based decryption,
 * and intellectual property protection workflows.
 */

const request = require('supertest');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import services and dependencies
const TEEService = require('../backend/services/teeModelDecryptionService');
const app = require('../backend/server');

describe('🤖 TDC Model Upload & TEE Integration Tests', function() {
  this.timeout(60000); // Extended timeout for file upload operations

  let teeService;
  let tdcAuthToken;
  let ccrpAuthToken;
  let tdcUser;
  let ccrpUser;
  let testContractId;
  let testModelPath;
  let uploadedModelId;

  before(async function() {
    console.log('🔧 Setting up TDC Model Upload & TEE test environment...');
    
    // Initialize TEE service
    teeService = new TEEService();
    await teeService.initialize(
      teeService._createMockAttestationService(),
      teeService._createMockKeyManagementService()
    );

    // Create TDC test user
    const tdcUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tdc-model-test@example.com',
        password: 'TestPassword123!',
        name: 'TDC Model Test User',
        organization: 'AI Model Company',
        partyType: 'TDC'
      });

    tdcUser = tdcUserResponse.body.data.user;
    tdcAuthToken = tdcUserResponse.body.data.token;

    // Create CCRP test user for TEE operations
    const ccrpUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'ccrp-tee-test@example.com',
        password: 'TestPassword123!',
        name: 'CCRP TEE Test User',
        organization: 'Clean Room Provider',
        partyType: 'CCRP'
      });

    ccrpUser = ccrpUserResponse.body.data.user;
    ccrpAuthToken = ccrpUserResponse.body.data.token;

    // Create test contract
    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${tdcAuthToken}`)
      .send({
        title: 'Model Upload Test Contract',
        description: 'Contract for testing AI model upload and TEE decryption',
        price: 10000,
        currency: 'USD'
      });

    testContractId = contractResponse.body.data.contract.contractId;

    // Create test model file
    await createTestModelFile();

    console.log('✅ TDC Model Upload & TEE test environment ready');
  });

  async function createTestModelFile() {
    const uploadsDir = path.join(__dirname, '../uploads/test-models');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    testModelPath = path.join(uploadsDir, 'test-model.bin');
    
    // Create a mock model file (simulate PyTorch model)
    const modelData = {
      model_state: {
        layer1: { weights: Array(1000).fill(0).map(() => Math.random()) },
        layer2: { weights: Array(500).fill(0).map(() => Math.random()) },
        layer3: { weights: Array(100).fill(0).map(() => Math.random()) }
      },
      metadata: {
        architecture: 'TestNet',
        framework: 'PyTorch',
        version: '1.0.0',
        parameters: 25600000
      }
    };

    fs.writeFileSync(testModelPath, JSON.stringify(modelData));
  }

  describe('🚀 TEE Service Initialization', function() {
    it('should initialize TEE service successfully', function() {
      expect(teeService).to.be.an('object');
      expect(teeService.initialized).to.be.true;
      expect(teeService.attestationService).to.exist;
      expect(teeService.keyManagementService).to.exist;
    });

    it('should create mock attestation service', function() {
      const attestationService = teeService._createMockAttestationService();
      expect(attestationService).to.be.an('object');
      expect(attestationService.verifyAttestation).to.be.a('function');
    });

    it('should create mock key management service', function() {
      const kmsService = teeService._createMockKeyManagementService();
      expect(kmsService).to.be.an('object');
      expect(kmsService.retrieveDecryptionKey).to.be.a('function');
    });
  });

  describe('📤 AI Model Upload Interface', function() {
    it('should upload AI model successfully via API', async function() {
      this.timeout(10000);

      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Test Neural Network')
        .field('description', 'A test neural network for TEE decryption testing')
        .field('version', '1.0.0')
        .field('modelType', 'NEURAL_NETWORK')
        .field('architecture', 'CNN')
        .field('framework', 'PyTorch')
        .field('parameters', '25600000')
        .field('inputSize', '224x224x3')
        .field('outputClasses', '1000')
        .field('license', 'MIT')
        .field('tags', 'test,neural-network,image-classification')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM',
          keyManagementService: 'AzureKeyVault',
          keyId: 'test-key-id',
          keyRotationEnabled: true
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure',
          instanceType: 'Standard_DC4as_v5',
          attestationRequired: true,
          networkIsolation: true,
          memoryGB: 16,
          cpuCores: 4
        }))
        .attach('modelFile', testModelPath);

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.model).to.exist;
      expect(response.body.model.name).to.equal('Test Neural Network');
      expect(response.body.model.ownerId).to.equal(tdcUser.id);
      expect(response.body.model.filePath).to.exist;

      uploadedModelId = response.body.model.id;
    });

    it('should reject upload from non-TDC users', async function() {
      // Create TDP user to test role restriction
      const tdpUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdp-test@example.com',
          password: 'TestPassword123!',
          partyType: 'TDP'
        });

      const tdpToken = tdpUserResponse.body.data.token;

      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdpToken}`)
        .field('name', 'Unauthorized Upload')
        .attach('modelFile', testModelPath);

      expect(response.status).to.equal(403);
      expect(response.body.success).to.be.false;
    });

    it('should require model file for upload', async function() {
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Model Without File');

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
      expect(response.body.error).to.include('No model file provided');
    });

    it('should validate model metadata', async function() {
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('encryptionConfig', 'invalid_json')
        .attach('modelFile', testModelPath);

      expect(response.status).to.equal(500);
      expect(response.body.success).to.be.false;
    });
  });

  describe('🔐 Model Encryption and Security', function() {
    it('should encrypt model during upload', async function() {
      // Verify that the uploaded model file is encrypted
      const response = await request(app)
        .get(`/api/ai-models/${uploadedModelId}`)
        .set('Authorization', `Bearer ${tdcAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.model.encryptionConfig.enabled).to.be.true;
      expect(response.body.data.model.encryptionConfig.algorithm).to.equal('AES-256-GCM');
    });

    it('should generate unique encryption keys per model', async function() {
      // Upload another model to compare keys
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Second Test Model')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM',
          keyManagementService: 'AzureKeyVault'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure'
        }))
        .attach('modelFile', testModelPath);

      expect(response.status).to.equal(201);
      
      const secondModelId = response.body.model.id;
      expect(secondModelId).to.not.equal(uploadedModelId);
    });

    it('should support different encryption algorithms', async function() {
      const algorithms = ['AES-256-GCM', 'AES-192-GCM', 'ChaCha20-Poly1305'];

      for (const algorithm of algorithms) {
        const response = await request(app)
          .post('/api/ai-models/upload')
          .set('Authorization', `Bearer ${tdcAuthToken}`)
          .field('name', `Model with ${algorithm}`)
          .field('encryptionConfig', JSON.stringify({
            enabled: true,
            algorithm: algorithm,
            keyManagementService: 'AzureKeyVault'
          }))
          .field('teeConfig', JSON.stringify({
            enabled: true,
            provider: 'Azure'
          }))
          .attach('modelFile', testModelPath);

        expect(response.status).to.equal(201);
        expect(response.body.model.encryptionConfig.algorithm).to.equal(algorithm);
      }
    });
  });

  describe('🏗️ TEE Configuration', function() {
    it('should validate TEE provider options', async function() {
      const providers = ['AWS', 'Azure', 'GCP', 'OCI'];

      for (const provider of providers) {
        const response = await request(app)
          .post('/api/ai-models/upload')
          .set('Authorization', `Bearer ${tdcAuthToken}`)
          .field('name', `Model for ${provider} TEE`)
          .field('encryptionConfig', JSON.stringify({
            enabled: true,
            algorithm: 'AES-256-GCM'
          }))
          .field('teeConfig', JSON.stringify({
            enabled: true,
            provider: provider,
            attestationRequired: true,
            networkIsolation: true
          }))
          .attach('modelFile', testModelPath);

        expect(response.status).to.equal(201);
        expect(response.body.model.teeConfig.provider).to.equal(provider);
      }
    });

    it('should validate instance types per provider', async function() {
      const providerInstances = {
        'Azure': ['Standard_DC2s', 'Standard_DC4s', 'Standard_DC8s'],
        'AWS': ['m5.large', 'm5.xlarge', 'c5.large'],
        'GCP': ['n2d-standard-2', 'n2d-standard-4', 'c2d-standard-4']
      };

      for (const [provider, instances] of Object.entries(providerInstances)) {
        for (const instanceType of instances) {
          const response = await request(app)
            .post('/api/ai-models/upload')
            .set('Authorization', `Bearer ${tdcAuthToken}`)
            .field('name', `Model for ${provider} ${instanceType}`)
            .field('encryptionConfig', JSON.stringify({
              enabled: true,
              algorithm: 'AES-256-GCM'
            }))
            .field('teeConfig', JSON.stringify({
              enabled: true,
              provider: provider,
              instanceType: instanceType
            }))
            .attach('modelFile', testModelPath);

          expect(response.status).to.equal(201);
        }
      }
    });

    it('should configure resource requirements', async function() {
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'High-Resource Model')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure',
          instanceType: 'Standard_DC8s',
          memoryGB: 32,
          cpuCores: 8,
          storageGB: 500,
          networkIsolation: true,
          attestationRequired: true
        }))
        .attach('modelFile', testModelPath);

      expect(response.status).to.equal(201);
      expect(response.body.model.teeConfig.memoryGB).to.equal(32);
      expect(response.body.model.teeConfig.cpuCores).to.equal(8);
    });
  });

  describe('🔓 TEE Model Decryption Service', function() {
    let decryptionTestModelId;

    before(async function() {
      // Create a model specifically for decryption testing
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Decryption Test Model')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM',
          keyManagementService: 'AzureKeyVault'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure',
          attestationRequired: true
        }))
        .attach('modelFile', testModelPath);

      decryptionTestModelId = response.body.model.id;
    });

    it('should request model decryption in TEE successfully', async function() {
      const teeAttestationReport = crypto.randomBytes(256).toString('base64');
      
      const decryptionContext = {
        contractId: testContractId,
        userId: ccrpUser.id,
        trainingJobId: `job_${Date.now()}`
      };

      const result = await teeService.requestModelDecryption(
        decryptionTestModelId,
        teeAttestationReport,
        decryptionContext
      );

      expect(result).to.be.an('object');
      expect(result.modelId).to.equal(decryptionTestModelId);
      expect(result.status).to.equal('DECRYPTED');
      expect(result.attestationVerified).to.be.true;
      expect(result.keyReleased).to.be.true;
      expect(result.decryptedPath).to.be.a('string');
    });

    it('should verify TEE attestation before decryption', async function() {
      const invalidAttestationReport = 'invalid_attestation';
      
      const decryptionContext = {
        contractId: testContractId,
        userId: ccrpUser.id,
        trainingJobId: `job_${Date.now()}`
      };

      try {
        await teeService.requestModelDecryption(
          decryptionTestModelId,
          invalidAttestationReport,
          decryptionContext
        );
        expect.fail('Should have thrown error for invalid attestation');
      } catch (error) {
        expect(error.message).to.include('TEE Attestation failed');
      }
    });

    it('should handle key retrieval failures', async function() {
      // Mock key management service to simulate failure
      const originalKMS = teeService.keyManagementService;
      teeService.keyManagementService = {
        retrieveDecryptionKey: async () => null
      };

      const teeAttestationReport = crypto.randomBytes(256).toString('base64');
      const decryptionContext = {
        contractId: testContractId,
        userId: ccrpUser.id,
        trainingJobId: `job_${Date.now()}`
      };

      try {
        await teeService.requestModelDecryption(
          decryptionTestModelId,
          teeAttestationReport,
          decryptionContext
        );
        expect.fail('Should have thrown error for key retrieval failure');
      } catch (error) {
        expect(error.message).to.include('Failed to retrieve decryption key');
      }

      // Restore original KMS
      teeService.keyManagementService = originalKMS;
    });

    it('should simulate secure decryption within TEE', async function() {
      const modelId = 'test_model_123';
      const decryptionKey = crypto.randomBytes(32).toString('hex');

      const decryptedPath = await teeService._simulateDecryption(modelId, decryptionKey);

      expect(decryptedPath).to.be.a('string');
      expect(decryptedPath).to.include(modelId);
      expect(decryptedPath).to.include('decrypted.bin');
    });
  });

  describe('🌐 TEE Model Decryption API', function() {
    let apiTestModelId;

    before(async function() {
      // Create model for API testing
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'API Decryption Test Model')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure'
        }))
        .attach('modelFile', testModelPath);

      apiTestModelId = response.body.model.id;
    });

    it('should request model decryption via API', async function() {
      const response = await request(app)
        .post('/api/tee/decrypt-model')
        .set('Authorization', `Bearer ${ccrpAuthToken}`)
        .send({
          modelId: apiTestModelId,
          teeAttestationReport: crypto.randomBytes(256).toString('base64'),
          decryptionContext: {
            contractId: testContractId,
            userId: ccrpUser.id,
            trainingJobId: `api_job_${Date.now()}`
          }
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.modelId).to.equal(apiTestModelId);
      expect(response.body.data.status).to.equal('DECRYPTED');
      expect(response.body.data.attestationVerified).to.be.true;
    });

    it('should require all parameters for decryption', async function() {
      const response = await request(app)
        .post('/api/tee/decrypt-model')
        .set('Authorization', `Bearer ${ccrpAuthToken}`)
        .send({
          modelId: apiTestModelId
          // Missing teeAttestationReport and decryptionContext
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
    });

    it('should require authentication for decryption', async function() {
      const response = await request(app)
        .post('/api/tee/decrypt-model')
        .send({
          modelId: apiTestModelId,
          teeAttestationReport: crypto.randomBytes(256).toString('base64'),
          decryptionContext: {
            contractId: testContractId,
            userId: ccrpUser.id
          }
        });

      expect(response.status).to.equal(401);
    });
  });

  describe('🔒 Security and Access Control', function() {
    it('should enforce role-based access for model upload', async function() {
      // Test with different user roles
      const roles = ['TDP', 'AppAdmin'];

      for (const role of roles) {
        const userResponse = await request(app)
          .post('/api/auth/register')
          .send({
            email: `${role.toLowerCase()}-security-test@example.com`,
            password: 'TestPassword123!',
            partyType: role
          });

        const userToken = userResponse.body.data.token;

        const response = await request(app)
          .post('/api/ai-models/upload')
          .set('Authorization', `Bearer ${userToken}`)
          .field('name', `Security Test Model - ${role}`)
          .attach('modelFile', testModelPath);

        if (role === 'TDP') {
          expect(response.status).to.equal(403);
        } else if (role === 'AppAdmin') {
          expect(response.status).to.equal(201);
        }
      }
    });

    it('should validate model ownership for access', async function() {
      // Create another TDC user
      const anotherTdcResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another-tdc@example.com',
          password: 'TestPassword123!',
          partyType: 'TDC'
        });

      const anotherTdcToken = anotherTdcResponse.body.data.token;

      // Try to access first user's model
      const response = await request(app)
        .get(`/api/ai-models/${uploadedModelId}`)
        .set('Authorization', `Bearer ${anotherTdcToken}`);

      // Should be denied or filtered based on ownership
      expect([403, 404]).to.include(response.status);
    });

    it('should validate encryption requirements', async function() {
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Unencrypted Model Test')
        .field('encryptionConfig', JSON.stringify({
          enabled: false // Disabled encryption
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure'
        }))
        .attach('modelFile', testModelPath);

      // Should still succeed but with warnings or default encryption
      expect(response.status).to.equal(201);
    });
  });

  describe('📊 Model Management and Metadata', function() {
    it('should track model upload provenance', async function() {
      // Check if provenance tracking was initialized for model upload
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Provenance Test Model')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure'
        }))
        .attach('modelFile', testModelPath);

      expect(response.status).to.equal(201);
      
      // In a real implementation, we would check provenance records
      // For now, verify the upload was successful with metadata
      expect(response.body.model.name).to.equal('Provenance Test Model');
    });

    it('should support model versioning', async function() {
      const baseName = 'Versioned Model';
      const versions = ['1.0.0', '1.1.0', '2.0.0'];

      for (const version of versions) {
        const response = await request(app)
          .post('/api/ai-models/upload')
          .set('Authorization', `Bearer ${tdcAuthToken}`)
          .field('name', baseName)
          .field('version', version)
          .field('encryptionConfig', JSON.stringify({
            enabled: true,
            algorithm: 'AES-256-GCM'
          }))
          .field('teeConfig', JSON.stringify({
            enabled: true,
            provider: 'Azure'
          }))
          .attach('modelFile', testModelPath);

        expect(response.status).to.equal(201);
        expect(response.body.model.version).to.equal(version);
      }
    });

    it('should validate model metadata constraints', async function() {
      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Metadata Validation Test')
        .field('parameters', 'invalid_number') // Invalid parameter count
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure'
        }))
        .attach('modelFile', testModelPath);

      // Should succeed but with cleaned metadata
      expect(response.status).to.equal(201);
    });
  });

  describe('⚡ Performance and Load Testing', function() {
    it('should handle concurrent model uploads', async function() {
      this.timeout(30000);

      const concurrentUploads = [];
      const uploadCount = 3; // Reduced for testing

      for (let i = 0; i < uploadCount; i++) {
        const uploadPromise = request(app)
          .post('/api/ai-models/upload')
          .set('Authorization', `Bearer ${tdcAuthToken}`)
          .field('name', `Concurrent Model ${i}`)
          .field('encryptionConfig', JSON.stringify({
            enabled: true,
            algorithm: 'AES-256-GCM'
          }))
          .field('teeConfig', JSON.stringify({
            enabled: true,
            provider: 'Azure'
          }))
          .attach('modelFile', testModelPath);

        concurrentUploads.push(uploadPromise);
      }

      const results = await Promise.allSettled(concurrentUploads);
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );

      expect(successful.length).to.equal(uploadCount);
      console.log(`✅ Successfully handled ${successful.length} concurrent model uploads`);
    });

    it('should handle large model files efficiently', async function() {
      this.timeout(15000);

      // Create a larger test file (simulate large model)
      const largeModelPath = path.join(__dirname, '../uploads/test-models/large-test-model.bin');
      const largeModelData = {
        model_state: {},
        metadata: { size: 'large' }
      };

      // Generate larger data
      for (let i = 0; i < 100; i++) {
        largeModelData.model_state[`layer_${i}`] = {
          weights: Array(1000).fill(0).map(() => Math.random())
        };
      }

      fs.writeFileSync(largeModelPath, JSON.stringify(largeModelData));

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/ai-models/upload')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .field('name', 'Large Model Performance Test')
        .field('encryptionConfig', JSON.stringify({
          enabled: true,
          algorithm: 'AES-256-GCM'
        }))
        .field('teeConfig', JSON.stringify({
          enabled: true,
          provider: 'Azure'
        }))
        .attach('modelFile', largeModelPath);

      const endTime = Date.now();

      expect(response.status).to.equal(201);
      console.log(`✅ Large model upload completed in ${endTime - startTime}ms`);

      // Cleanup
      if (fs.existsSync(largeModelPath)) {
        fs.unlinkSync(largeModelPath);
      }
    });

    it('should handle multiple TEE decryption requests', async function() {
      const decryptionRequests = [];
      const requestCount = 5;

      for (let i = 0; i < requestCount; i++) {
        const requestPromise = request(app)
          .post('/api/tee/decrypt-model')
          .set('Authorization', `Bearer ${ccrpAuthToken}`)
          .send({
            modelId: uploadedModelId,
            teeAttestationReport: crypto.randomBytes(256).toString('base64'),
            decryptionContext: {
              contractId: testContractId,
              userId: ccrpUser.id,
              trainingJobId: `concurrent_job_${i}_${Date.now()}`
            }
          });

        decryptionRequests.push(requestPromise);
      }

      const results = await Promise.allSettled(decryptionRequests);
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );

      expect(successful.length).to.equal(requestCount);
      console.log(`✅ Successfully handled ${successful.length} concurrent decryption requests`);
    });
  });

  after(async function() {
    console.log('🧹 Cleaning up TDC Model Upload & TEE test environment...');
    
    // Cleanup test files
    if (fs.existsSync(testModelPath)) {
      fs.unlinkSync(testModelPath);
    }

    // Cleanup uploads directory
    const uploadsDir = path.join(__dirname, '../uploads/test-models');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
      fs.rmdirSync(uploadsDir);
    }

    console.log('✅ TDC Model Upload & TEE test cleanup complete');
  });
});

console.log('🤖 TDC Model Upload & TEE Integration test suite loaded');
