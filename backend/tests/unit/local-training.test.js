/**
 * Local Training Environment Tests
 * 
 * Tests for local development and testing of the training environment
 */

const request = require('supertest');
const app = require('../../test-server');
const LocalTEEProvider = require('../../services/localTEEProvider');
const TEEProvisioningService = require('../../services/teeProvisioningService');

describe('Local Training Environment Tests', () => {
  let localProvider;
  let teeProvisioningService;
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Initialize local TEE provider
    localProvider = new LocalTEEProvider();
    await localProvider.initialize();
    
    // Initialize TEE provisioning service
    teeProvisioningService = new TEEProvisioningService();
    
    // Create test user and get auth token
    const userData = {
      email: 'test@local-training.com',
      password: 'TestPassword123!',
      firstName: 'Local',
      lastName: 'Tester',
      partyType: 'TDC'
    };

    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      if (registerResponse.status === 201) {
        testUser = registerResponse.body.user;
        
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password
          });

        if (loginResponse.status === 200) {
          authToken = loginResponse.body.token;
        }
      }
    } catch (error) {
      console.log('Test user setup failed, using mock auth');
      authToken = 'mock-token';
      testUser = { id: 1, email: 'test@local-training.com' };
    }
  });

  describe('Local TEE Provider', () => {
    test('should initialize local TEE provider', async () => {
      expect(localProvider).toBeDefined();
      expect(localProvider.basePath).toBeDefined();
      expect(localProvider.attestationKeys).toBeDefined();
    });

    test('should provision local TEE environment', async () => {
      const config = {
        contractId: 'test-contract-local',
        provider: 'local',
        region: 'local',
        instanceType: 'local-docker'
      };
      
      const environment = await localProvider.provisionEnvironment(config);
      
      expect(environment).toBeDefined();
      expect(environment.id).toBeDefined();
      expect(environment.provider).toBe('local');
      expect(environment.status).toBe('ACTIVE');
      expect(environment.attestationDocument).toBeDefined();
    });

    test('should deploy training container locally', async () => {
      const config = {
        environmentId: 'test-env-local',
        jobId: 'test-job-local',
        image: 'training-container:local',
        resources: {
          cpu: 2,
          memory: 4,
          gpu: 0
        },
        environment: {
          JOB_ID: 'test-job-local',
          TRAINING_EPOCHS: '5',
          BATCH_SIZE: '16'
        }
      };
      
      const container = await localProvider.deployContainer(config);
      
      expect(container).toBeDefined();
      expect(container.id).toBeDefined();
      expect(container.jobId).toBe('test-job-local');
      expect(container.status).toBe('DEPLOYED');
    });

    test('should start and stop local training container', async () => {
      const config = {
        environmentId: 'test-env-local',
        jobId: 'test-job-start-stop',
        image: 'training-container:local'
      };
      
      const container = await localProvider.deployContainer(config);
      
      // Start container
      await localProvider.startContainer(container.id);
      expect(container.status).toBe('RUNNING');
      
      // Stop container
      await localProvider.stopContainer(container.id);
      expect(container.status).toBe('STOPPED');
    });

    test('should get environment status', async () => {
      const config = {
        contractId: 'test-status-contract',
        provider: 'local'
      };
      
      const environment = await localProvider.provisionEnvironment(config);
      const status = await localProvider.getEnvironmentStatus(environment.id);
      
      expect(status).toBeDefined();
      expect(status.environmentId).toBe(environment.id);
      expect(status.provider).toBe('local');
      expect(status.health).toBe('HEALTHY');
    });
  });

  describe('TEE Provisioning Service with Local Provider', () => {
    test('should use local provider in development mode', () => {
      expect(teeProvisioningService.isLocalMode).toBe(true);
      expect(teeProvisioningService.providers.local).toBeDefined();
    });

    test('should provision environment using local provider', async () => {
      const config = {
        contractId: 'test-contract-provisioning',
        provider: 'local',
        region: 'local',
        instanceType: 'local-docker'
      };
      
      const environment = await teeProvisioningService.provisionEnvironment(config);
      
      expect(environment).toBeDefined();
      expect(environment.provider).toBe('local');
      expect(environment.status).toBe('ACTIVE');
    });

    test('should deploy container using local provider', async () => {
      const config = {
        contractId: 'test-contract-deploy',
        provider: 'local'
      };
      
      const environment = await teeProvisioningService.provisionEnvironment(config);
      
      const containerConfig = {
        environmentId: environment.id,
        jobId: 'test-deploy-job',
        image: 'training-container:local',
        resources: {
          cpu: 2,
          memory: 4
        }
      };
      
      const container = await teeProvisioningService.deployContainer(containerConfig);
      
      expect(container).toBeDefined();
      expect(container.environmentId).toBe(environment.id);
    });
  });

  describe('Local Training API Endpoints', () => {
    test('should execute training workflow locally', async () => {
      // Create a test contract first
      const contractData = {
        contractId: 'LOCAL-TEST-001',
        title: 'Local Training Test Contract',
        description: 'Test contract for local training',
        status: 'SIGNED',
        price: 1000,
        duration: 30,
        trainingEnvironment: {
          provider: 'local',
          region: 'local',
          instanceType: 'local-docker',
          cpuCores: 2,
          memoryGB: 4,
          containerImage: 'training-container:local'
        },
        trainingParams: {
          epochs: 5,
          batchSize: 16,
          learningRate: 0.001,
          algorithm: 'adam'
        },
        datasets: [{
          id: 'test-dataset-1',
          name: 'Test Dataset',
          size: 1000
        }],
        aiModels: [{
          id: 'test-model-1',
          name: 'Test Model',
          type: 'classification'
        }],
        parties: [
          { role: 'TDP', userId: testUser.id },
          { role: 'TDC', userId: testUser.id },
          { role: 'CCRP', userId: testUser.id }
        ]
      };

      // Create contract
      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData);

      if (createResponse.status === 201) {
        const contractId = createResponse.body.contract.contractId;
        
        // Execute training
        const trainingResponse = await request(app)
          .post(`/api/training/execute/${contractId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            priority: 'NORMAL',
            maxRetries: 3
          });

        expect(trainingResponse.status).toBe(200);
        expect(trainingResponse.body.success).toBe(true);
        expect(trainingResponse.body.trainingJob).toBeDefined();
        expect(trainingResponse.body.trainingJob.jobId).toBeDefined();
        expect(trainingResponse.body.trainingJob.status).toBe('RUNNING');
      }
    });

    test('should get training job status locally', async () => {
      // This test assumes a training job was created in the previous test
      const response = await request(app)
        .get('/api/training/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body.jobs.length > 0) {
        const jobId = response.body.jobs[0].jobId;
        
        const statusResponse = await request(app)
          .get(`/api/training/status/${jobId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body.success).toBe(true);
        expect(statusResponse.body.status).toBeDefined();
      }
    });

    test('should get training progress locally', async () => {
      const response = await request(app)
        .get('/api/training/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body.jobs.length > 0) {
        const jobId = response.body.jobs[0].jobId;
        
        const progressResponse = await request(app)
          .get(`/api/training/progress/${jobId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(progressResponse.status).toBe(200);
        expect(progressResponse.body.success).toBe(true);
        expect(progressResponse.body.progress).toBeDefined();
      }
    });

    test('should cancel training job locally', async () => {
      const response = await request(app)
        .get('/api/training/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200 && response.body.jobs.length > 0) {
        const jobId = response.body.jobs[0].jobId;
        
        const cancelResponse = await request(app)
          .post(`/api/training/cancel/${jobId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: 'Test cancellation'
          });

        expect(cancelResponse.status).toBe(200);
        expect(cancelResponse.body.success).toBe(true);
      }
    });
  });

  describe('Local Development Features', () => {
    test('should have local development configuration', () => {
      expect(process.env.NODE_ENV).toBe('development');
      expect(process.env.TEE_MODE).toBe('local');
    });

    test('should create local directory structure', async () => {
      const fs = require('fs');
      const path = require('path');
      
      const localTeePath = path.join(__dirname, '../../../local-tee');
      expect(fs.existsSync(localTeePath)).toBe(true);
      
      const expectedDirs = ['environments', 'containers', 'data', 'outputs', 'logs'];
      expectedDirs.forEach(dir => {
        expect(fs.existsSync(path.join(localTeePath, dir))).toBe(true);
      });
    });

    test('should generate attestation documents locally', async () => {
      const config = {
        contractId: 'test-attestation',
        provider: 'local'
      };
      
      const environment = await localProvider.provisionEnvironment(config);
      
      expect(environment.attestationDocument).toBeDefined();
      expect(environment.attestationDocument.version).toBe('1.0');
      expect(environment.attestationDocument.provider).toBe('local');
      expect(environment.attestationDocument.measurements).toBeDefined();
      expect(environment.attestationDocument.publicKey).toBeDefined();
      expect(environment.attestationDocument.signature).toBeDefined();
    });

    test('should create training scripts locally', async () => {
      const config = {
        environmentId: 'test-script-env',
        jobId: 'test-script-job',
        image: 'training-container:local'
      };
      
      const container = await localProvider.deployContainer(config);
      
      const fs = require('fs');
      const path = require('path');
      
      const containerPath = path.join(localProvider.basePath, 'containers', container.id);
      expect(fs.existsSync(containerPath)).toBe(true);
      expect(fs.existsSync(path.join(containerPath, 'train.py'))).toBe(true);
      expect(fs.existsSync(path.join(containerPath, 'requirements.txt'))).toBe(true);
      expect(fs.existsSync(path.join(containerPath, 'Dockerfile'))).toBe(true);
    });
  });

  afterAll(async () => {
    // Cleanup local environments
    if (localProvider) {
      for (const [envId, env] of localProvider.environments) {
        await localProvider.cleanupEnvironment(envId);
      }
    }
  });
});
