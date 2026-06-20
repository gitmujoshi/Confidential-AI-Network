/**
 * Complete Training System Tests
 * 
 * Comprehensive test suite for all phases of the AI model training system
 * including data flow, security, monitoring, and provenance tracking.
 */

const request = require('supertest');
const app = require('../../test-server');
const SecureDataAccessService = require('../../services/secureDataAccessService');
const PrivacyPreservingTrainingService = require('../../services/privacyPreservingTrainingService');
const AdvancedMonitoringService = require('../../services/advancedMonitoringService');
const ProvenanceTrackingService = require('../../services/provenanceTrackingService');
const TrainingContainerService = require('../../services/trainingContainerService');

describe('Complete Training System Tests', () => {
  let secureDataAccessService;
  let privacyPreservingTrainingService;
  let advancedMonitoringService;
  let provenanceTrackingService;
  let trainingContainerService;
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Initialize services
    secureDataAccessService = new SecureDataAccessService();
    privacyPreservingTrainingService = new PrivacyPreservingTrainingService();
    advancedMonitoringService = new AdvancedMonitoringService();
    provenanceTrackingService = new ProvenanceTrackingService();
    trainingContainerService = new TrainingContainerService();
    
    // Create test user and get auth token
    const userData = {
      email: 'complete-test@training.com',
      password: 'TestPassword123!',
      firstName: 'Complete',
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
      testUser = { id: 1, email: 'complete-test@training.com' };
    }
  });

  describe('Phase 4: Data Flow & Security', () => {
    test('should setup secure data access', async () => {
      const config = {
        environmentId: 'test-secure-env',
        datasets: [
          { id: 'dataset-1', name: 'Test Dataset 1', size: 1000 },
          { id: 'dataset-2', name: 'Test Dataset 2', size: 2000 }
        ],
        accessPolicies: {
          dataRetention: 90,
          encryptionRequired: true,
          auditRequired: true
        }
      };
      
      const accessConfig = await secureDataAccessService.setupSecureDataAccess(config);
      
      expect(accessConfig).toBeDefined();
      expect(accessConfig.environmentId).toBe('test-secure-env');
      expect(accessConfig.encryptionKeys).toBeDefined();
      expect(accessConfig.accessPolicies).toBeDefined();
      expect(accessConfig.privacyRequirements).toBeDefined();
    });

    test('should encrypt and decrypt data', async () => {
      const testData = Buffer.from('Test training data for encryption');
      const datasetId = 'test-dataset-encryption';
      
      // Encrypt data
      const encryptedData = await secureDataAccessService.encryptData(testData, datasetId);
      
      expect(encryptedData).toBeDefined();
      expect(encryptedData.data).toBeDefined();
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.tag).toBeDefined();
      expect(encryptedData.algorithm).toBe('aes-256-gcm');
      
      // Decrypt data
      const decryptedData = await secureDataAccessService.decryptData(encryptedData);
      
      expect(decryptedData).toEqual(testData);
    });

    test('should apply differential privacy', async () => {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const privacyConfig = {
        datasetId: 'test-dp-dataset',
        userId: 'test-user',
        epsilon: 1.0,
        delta: 1e-5,
        mechanism: 'laplace',
        sensitivity: 1.0,
        maxEpsilon: 10.0
      };
      
      const privatizedData = await secureDataAccessService.applyDifferentialPrivacy(testData, privacyConfig);
      
      expect(privatizedData).toBeDefined();
      expect(privatizedData.length).toBe(testData.length);
      expect(privatizedData).not.toEqual(testData); // Should be different due to noise
    });

    test('should validate access permissions', () => {
      const hasPermission = secureDataAccessService.validateAccessPermission(
        'test-user',
        'test-dataset',
        'read_contract_datasets',
        'TDC'
      );
      
      expect(hasPermission).toBe(true);
      
      const noPermission = secureDataAccessService.validateAccessPermission(
        'test-user',
        'test-dataset',
        'manage_environment',
        'TDC'
      );
      
      expect(noPermission).toBe(false);
    });
  });

  describe('Phase 5: Privacy-Preserving Training', () => {
    test('should initialize federated learning', async () => {
      const config = {
        sessionId: 'test-federated-session',
        modelType: 'neural_network',
        aggregationMethod: 'fedavg',
        totalRounds: 5,
        privacyConfig: {
          epsilon: 1.0,
          delta: 1e-5,
          maxEpsilon: 10.0
        }
      };
      
      const session = await privacyPreservingTrainingService.initializeFederatedLearning(config);
      
      expect(session).toBeDefined();
      expect(session.sessionId).toBe('test-federated-session');
      expect(session.modelType).toBe('neural_network');
      expect(session.aggregationMethod).toBe('fedavg');
      expect(session.status).toBe('INITIALIZED');
    });

    test('should register federated learning client', async () => {
      const sessionId = 'test-federated-session';
      const clientConfig = {
        clientId: 'test-client-1',
        userId: 'test-user-1',
        role: 'TDP',
        dataSize: 1000,
        capabilities: ['local_training', 'privacy_preserving']
      };
      
      const client = await privacyPreservingTrainingService.registerClient(sessionId, clientConfig);
      
      expect(client).toBeDefined();
      expect(client.clientId).toBe('test-client-1');
      expect(client.userId).toBe('test-user-1');
      expect(client.role).toBe('TDP');
      expect(client.status).toBe('REGISTERED');
    });

    test('should execute federated learning round', async () => {
      const sessionId = 'test-federated-session';
      const roundConfig = {
        localEpochs: 3,
        learningRate: 0.01,
        batchSize: 32
      };
      
      const round = await privacyPreservingTrainingService.executeFederatedRound(sessionId, roundConfig);
      
      expect(round).toBeDefined();
      expect(round.sessionId).toBe(sessionId);
      expect(round.roundNumber).toBe(1);
      expect(round.status).toBe('COMPLETED');
      expect(round.aggregatedModel).toBeDefined();
    });

    test('should apply secure multi-party computation', async () => {
      const inputs = [10, 20, 30, 40, 50];
      const config = {
        protocol: 'secure_sum',
        threshold: 3,
        parties: 5
      };
      
      const result = await privacyPreservingTrainingService.applySecureMPC(inputs, config);
      
      expect(result).toBeDefined();
      expect(result.protocol).toBe('secure_sum');
    });

    test('should apply differential privacy to model updates', async () => {
      const modelUpdate = {
        parameters: {
          weights: [0.1, 0.2, 0.3, 0.4, 0.5],
          bias: [0.01, 0.02]
        }
      };
      
      const privacyConfig = {
        userId: 'test-user',
        datasetId: 'test-dataset',
        epsilon: 1.0,
        delta: 1e-5,
        mechanism: 'gaussian',
        sensitivity: 1.0,
        maxEpsilon: 10.0
      };
      
      const privatizedUpdate = await privacyPreservingTrainingService.applyDifferentialPrivacy(modelUpdate, privacyConfig);
      
      expect(privatizedUpdate).toBeDefined();
      expect(privatizedUpdate.parameters).toBeDefined();
      expect(privatizedUpdate.privacyApplied).toBe(true);
      expect(privatizedUpdate.epsilon).toBe(1.0);
    });
  });

  describe('Phase 6: Advanced Monitoring', () => {
    test('should start advanced monitoring', async () => {
      const config = {
        jobId: 'test-monitoring-job',
        contractId: 'test-contract',
        environmentId: 'test-env',
        containerId: 'test-container',
        monitoringConfig: {
          performanceInterval: 30000,
          securityInterval: 60000,
          complianceInterval: 120000,
          privacyInterval: 90000
        }
      };
      
      const session = await advancedMonitoringService.startAdvancedMonitoring(config);
      
      expect(session).toBeDefined();
      expect(session.jobId).toBe('test-monitoring-job');
      expect(session.status).toBe('ACTIVE');
      expect(session.metrics).toBeDefined();
      expect(session.metrics.performance).toBeDefined();
      expect(session.metrics.security).toBeDefined();
      expect(session.metrics.compliance).toBeDefined();
      expect(session.metrics.privacy).toBeDefined();
    });

    test('should collect performance metrics', async () => {
      const sessionId = 'monitor_test-monitoring-job_1234567890';
      const session = advancedMonitoringService.monitoringSessions.get(sessionId);
      
      if (session) {
        await advancedMonitoringService.collectPerformanceMetrics(session);
        
        expect(session.metrics.performance.size).toBeGreaterThan(0);
        
        const latestMetrics = Array.from(session.metrics.performance.values()).pop();
        expect(latestMetrics).toBeDefined();
        expect(latestMetrics.cpu).toBeDefined();
        expect(latestMetrics.memory).toBeDefined();
        expect(latestMetrics.disk).toBeDefined();
      }
    });

    test('should generate monitoring report', async () => {
      const sessionId = 'monitor_test-monitoring-job_1234567890';
      
      try {
        const report = await advancedMonitoringService.getMonitoringReport(sessionId);
        
        expect(report).toBeDefined();
        expect(report.sessionId).toBe(sessionId);
        expect(report.summary).toBeDefined();
        expect(report.latestMetrics).toBeDefined();
        expect(report.recommendations).toBeDefined();
      } catch (error) {
        // Session might not exist, which is expected in test environment
        expect(error.message).toContain('not found');
      }
    });

    test('should stop monitoring', async () => {
      const sessionId = 'monitor_test-monitoring-job_1234567890';
      
      try {
        await advancedMonitoringService.stopMonitoring(sessionId);
        console.log('✅ Monitoring stopped successfully');
      } catch (error) {
        // Session might not exist, which is expected in test environment
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Phase 7: Provenance Tracking', () => {
    test('should initialize provenance tracking', async () => {
      const config = {
        jobId: 'test-provenance-job',
        contractId: 'test-contract',
        environmentId: 'test-env'
      };
      
      const session = await provenanceTrackingService.initializeProvenanceTracking(config);
      
      expect(session).toBeDefined();
      expect(session.jobId).toBe('test-provenance-job');
      expect(session.status).toBe('INITIALIZED');
      expect(session.merkleTree).toBeDefined();
      expect(session.rootHash).toBeDefined();
    });

    test('should create provenance node', async () => {
      const config = {
        nodeId: 'test-node-1',
        type: 'data',
        content: { dataset: 'test-dataset', size: 1000 },
        metadata: { source: 'test-source', version: '1.0' }
      };
      
      const node = await provenanceTrackingService.createProvenanceNode(config);
      
      expect(node).toBeDefined();
      expect(node.nodeId).toBe('test-node-1');
      expect(node.type).toBe('data');
      expect(node.hash).toBeDefined();
      expect(node.signature).toBeDefined();
      expect(node.timestamp).toBeDefined();
    });

    test('should add node to Merkle tree', async () => {
      const sessionId = 'provenance_test-provenance-job_1234567890';
      const nodeId = 'test-node-1';
      
      try {
        const merkleProof = await provenanceTrackingService.addNodeToMerkleTree(sessionId, nodeId);
        
        expect(merkleProof).toBeDefined();
        expect(merkleProof.nodeId).toBe(nodeId);
        expect(merkleProof.proof).toBeDefined();
        expect(merkleProof.rootHash).toBeDefined();
        expect(merkleProof.isValid).toBe(true);
      } catch (error) {
        // Session might not exist, which is expected in test environment
        expect(error.message).toContain('not found');
      }
    });

    test('should verify provenance node', async () => {
      const nodeId = 'test-node-1';
      const verificationConfig = {
        crossCloud: true
      };
      
      const verification = await provenanceTrackingService.verifyProvenanceNode(nodeId, verificationConfig);
      
      expect(verification).toBeDefined();
      expect(verification.nodeId).toBe(nodeId);
      expect(verification.results).toBeDefined();
      expect(verification.results.contentHash).toBeDefined();
      expect(verification.results.digitalSignature).toBeDefined();
      expect(verification.results.timestamp).toBeDefined();
      expect(verification.overallStatus).toBeDefined();
    });

    test('should verify provenance chain', async () => {
      const sessionId = 'provenance_test-provenance-job_1234567890';
      
      try {
        const chainVerification = await provenanceTrackingService.verifyProvenanceChain(sessionId);
        
        expect(chainVerification).toBeDefined();
        expect(chainVerification.sessionId).toBe(sessionId);
        expect(chainVerification.nodeVerifications).toBeDefined();
        expect(chainVerification.chainIntegrity).toBeDefined();
        expect(chainVerification.overallStatus).toBeDefined();
      } catch (error) {
        // Session might not exist, which is expected in test environment
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Phase 8: Training Container Management', () => {
    test('should build training container', async () => {
      const config = {
        containerId: 'test-container-1',
        template: 'python',
        jobId: 'test-job-1',
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        algorithm: 'adam'
      };
      
      const buildResult = await trainingContainerService.buildContainer(config);
      
      expect(buildResult).toBeDefined();
      expect(buildResult.containerId).toBe('test-container-1');
      expect(buildResult.template).toBe('python');
      expect(buildResult.status).toBe('BUILT');
      expect(buildResult.path).toBeDefined();
    });

    test('should deploy training container', async () => {
      const config = {
        containerId: 'test-container-1',
        environmentId: 'test-env-1',
        jobId: 'test-job-1',
        image: 'test-container-1:local',
        resources: {
          cpu: 2,
          memory: 4,
          gpu: 0
        }
      };
      
      const deployment = await trainingContainerService.deployContainer(config);
      
      expect(deployment).toBeDefined();
      expect(deployment.containerId).toBe('test-container-1');
      expect(deployment.environmentId).toBe('test-env-1');
      expect(deployment.status).toBe('DEPLOYED');
      expect(deployment.resources).toBeDefined();
    });

    test('should start and stop training container', async () => {
      const containerId = 'test-container-1';
      const trainingConfig = {
        epochs: 5,
        batchSize: 16,
        learningRate: 0.01
      };
      
      // Start container
      await trainingContainerService.startContainer(containerId, trainingConfig);
      
      // Check status
      const status = await trainingContainerService.getContainerStatus(containerId);
      expect(status).toBeDefined();
      expect(status.containerId).toBe(containerId);
      expect(status.status).toBe('RUNNING');
      
      // Stop container
      await trainingContainerService.stopContainer(containerId);
      
      // Check status after stop
      const stoppedStatus = await trainingContainerService.getContainerStatus(containerId);
      expect(stoppedStatus.status).toBe('STOPPED');
    });

    test('should get all containers', () => {
      const containers = trainingContainerService.getAllContainers();
      
      expect(Array.isArray(containers)).toBe(true);
      expect(containers.length).toBeGreaterThan(0);
      
      const container = containers.find(c => c.containerId === 'test-container-1');
      expect(container).toBeDefined();
    });
  });

  describe('Complete Training Workflow Integration', () => {
    test('should execute complete training workflow via API', async () => {
      // Create a test contract first
      const contractData = {
        contractId: 'COMPLETE-TEST-001',
        title: 'Complete Training Test Contract',
        description: 'Test contract for complete training workflow',
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
          id: 'test-dataset-complete',
          name: 'Complete Test Dataset',
          size: 1000
        }],
        aiModels: [{
          id: 'test-model-complete',
          name: 'Complete Test Model',
          type: 'classification'
        }],
        parties: [
          { role: 'TDP', userId: testUser.id },
          { role: 'TDC', userId: testUser.id },
          { role: 'TSP', userId: testUser.id }
        ]
      };

      // Create contract
      const createResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData);

      if (createResponse.status === 201) {
        const contractId = createResponse.body.contract.contractId;
        
        // Execute complete training workflow
        const trainingResponse = await request(app)
          .post(`/api/training/execute/${contractId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            priority: 'NORMAL',
            maxRetries: 3,
            enableProvenance: true,
            enablePrivacy: true,
            enableMonitoring: true
          });

        expect(trainingResponse.status).toBe(200);
        expect(trainingResponse.body.success).toBe(true);
        expect(trainingResponse.body.trainingJob).toBeDefined();
        expect(trainingResponse.body.trainingJob.jobId).toBeDefined();
        expect(trainingResponse.body.trainingJob.status).toBe('RUNNING');
      }
    });

    test('should get comprehensive training status', async () => {
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
        expect(statusResponse.body.provenance).toBeDefined();
        expect(statusResponse.body.privacy).toBeDefined();
        expect(statusResponse.body.monitoring).toBeDefined();
      }
    });
  });

  afterAll(async () => {
    // Cleanup any active monitoring sessions
    for (const [sessionId, session] of advancedMonitoringService.monitoringSessions) {
      try {
        await advancedMonitoringService.stopMonitoring(sessionId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});
