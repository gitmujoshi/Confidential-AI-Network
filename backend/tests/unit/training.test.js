/**
 * Training Services Unit Tests
 * 
 * Tests for the training orchestration and monitoring services
 */

const request = require('supertest');
const app = require('../../test-server');

describe('Training Services Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user and get auth token
    const userData = {
      email: 'test@training.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
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
      testUser = { id: 1, email: 'test@training.com' };
    }
  });

  describe('Training API Endpoints', () => {
    test('should have training health endpoint', async () => {
      const response = await request(app)
        .get('/api/training/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.health).toBeDefined();
      expect(response.body.health.status).toBe('healthy');
    });

    test('should get training jobs list', async () => {
      const response = await request(app)
        .get('/api/training/jobs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.jobs)).toBe(true);
    });

    test('should get monitoring statistics', async () => {
      const response = await request(app)
        .get('/api/training/monitoring/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.totalActiveMonitors).toBeDefined();
    });
  });

  describe('Training Orchestration Service', () => {
    test('should create training orchestration service', () => {
      const TrainingOrchestrationService = require('../../services/trainingOrchestrationService');
      const service = new TrainingOrchestrationService();
      
      expect(service).toBeDefined();
      expect(service.contractService).toBeDefined();
      expect(service.teeProvisioningService).toBeDefined();
      expect(service.attestationService).toBeDefined();
      expect(service.monitoringService).toBeDefined();
    });

    test('should estimate training duration', () => {
      const TrainingOrchestrationService = require('../../services/trainingOrchestrationService');
      const service = new TrainingOrchestrationService();
      
      const contract = {
        datasets: [{ id: 'dataset1' }, { id: 'dataset2' }],
        aiModels: [{ id: 'model1' }],
        trainingParams: { epochs: 20 }
      };
      
      const duration = service.estimateTrainingDuration(contract);
      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });

    test('should calculate resource requirements', () => {
      const TrainingOrchestrationService = require('../../services/trainingOrchestrationService');
      const service = new TrainingOrchestrationService();
      
      const contract = {
        trainingEnvironment: {
          cpuCores: 4,
          memoryGB: 8,
          gpuCount: 1,
          storageGB: 100
        }
      };
      
      const requirements = service.calculateResourceRequirements(contract);
      expect(requirements).toBeDefined();
      expect(requirements.cpu).toBe(4);
      expect(requirements.memory).toBe(8);
      expect(requirements.gpu).toBe(1);
      expect(requirements.storage).toBe(100);
    });
  });

  describe('TEE Provisioning Service', () => {
    test('should create TEE provisioning service', () => {
      const TEEProvisioningService = require('../../services/teeProvisioningService');
      const service = new TEEProvisioningService();
      
      expect(service).toBeDefined();
      expect(service.providers).toBeDefined();
      expect(service.providers.aws).toBeDefined();
      expect(service.providers.azure).toBeDefined();
      expect(service.providers.gcp).toBeDefined();
      expect(service.providers.oci).toBeDefined();
    });

    test('should provision AWS environment', async () => {
      const TEEProvisioningService = require('../../services/teeProvisioningService');
      const service = new TEEProvisioningService();
      
      const config = {
        contractId: 'test-contract',
        provider: 'aws',
        region: 'us-east-1',
        instanceType: 't3.medium'
      };
      
      const environment = await service.provisionEnvironment(config);
      
      expect(environment).toBeDefined();
      expect(environment.id).toBeDefined();
      expect(environment.provider).toBe('aws');
      expect(environment.region).toBe('us-east-1');
    });

    test('should provision Azure environment', async () => {
      const TEEProvisioningService = require('../../services/teeProvisioningService');
      const service = new TEEProvisioningService();
      
      const config = {
        contractId: 'test-contract',
        provider: 'azure',
        region: 'eastus',
        instanceType: 'Standard_D2s_v3'
      };
      
      const environment = await service.provisionEnvironment(config);
      
      expect(environment).toBeDefined();
      expect(environment.id).toBeDefined();
      expect(environment.provider).toBe('azure');
      expect(environment.region).toBe('eastus');
    });
  });

  describe('Attestation Service', () => {
    test('should create attestation service', () => {
      const AttestationService = require('../../services/attestationService');
      const service = new AttestationService();
      
      expect(service).toBeDefined();
      expect(service.verifiers).toBeDefined();
      expect(service.verifiers.aws).toBeDefined();
      expect(service.verifiers.azure).toBeDefined();
      expect(service.verifiers.gcp).toBeDefined();
      expect(service.verifiers.oci).toBeDefined();
    });

    test('should verify AWS attestation', async () => {
      const AttestationService = require('../../services/attestationService');
      const service = new AttestationService();
      
      const attestationDocument = {
        version: '1.0',
        timestamp: Date.now(),
        enclaveId: 'test-enclave',
        measurements: {
          pcr0: 'mock_pcr0_hash',
          pcr1: 'mock_pcr1_hash',
          pcr2: 'mock_pcr2_hash'
        },
        publicKey: 'mock_public_key',
        signature: 'mock_signature'
      };
      
      const result = await service.verifyTEEAttestation('test-env', attestationDocument);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('aws');
      expect(result.type).toBe('nitro_enclave');
    });

    test('should verify Azure attestation', async () => {
      const AttestationService = require('../../services/attestationService');
      const service = new AttestationService();
      
      const attestationDocument = {
        version: '1.0',
        timestamp: Date.now(),
        enclaveId: 'test-sgx-enclave',
        measurements: {
          mrenclave: 'mock_mrenclave_hash',
          mrsigner: 'mock_mrsigner_hash',
          isvprodid: 'mock_isvprodid',
          isvsvn: 'mock_isvsvn'
        },
        publicKey: 'mock_public_key',
        signature: 'mock_signature'
      };
      
      const result = await service.verifyTEEAttestation('test-env', attestationDocument);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('azure');
      expect(result.type).toBe('sgx_enclave');
    });
  });

  describe('Training Monitoring Service', () => {
    test('should create monitoring service', () => {
      const TrainingMonitoringService = require('../../services/trainingMonitoringService');
      const service = new TrainingMonitoringService();
      
      expect(service).toBeDefined();
      expect(service.activeMonitors).toBeDefined();
      expect(service.alertThresholds).toBeDefined();
    });

    test('should start monitoring', async () => {
      const TrainingMonitoringService = require('../../services/trainingMonitoringService');
      const service = new TrainingMonitoringService();
      
      const trainingJob = {
        jobId: 'test-job-123',
        contractId: 'test-contract',
        environmentId: 'test-env',
        containerId: 'test-container'
      };
      
      await service.startMonitoring(trainingJob);
      
      expect(service.activeMonitors.has('test-job-123')).toBe(true);
    });

    test('should get monitoring statistics', () => {
      const TrainingMonitoringService = require('../../services/trainingMonitoringService');
      const service = new TrainingMonitoringService();
      
      const stats = service.getMonitoringStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalActiveMonitors).toBeDefined();
      expect(stats.totalAlerts).toBeDefined();
      expect(stats.alertsByType).toBeDefined();
    });
  });

  describe('Training Models', () => {
    test('should create TrainingJob model', () => {
      const TrainingJob = require('../../models/TrainingJob');
      expect(TrainingJob).toBeDefined();
    });

    test('should create TrainingProgress model', () => {
      const TrainingProgress = require('../../models/TrainingProgress');
      expect(TrainingProgress).toBeDefined();
    });
  });
});
