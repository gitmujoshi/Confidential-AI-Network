/**
 * Ricardian Contract Tests
 * 
 * Tests for enhanced Ricardian contract functionality including:
 * - Training environment specifications
 * - Compliance requirements
 * - Multi-dataset support
 * - Privacy requirements
 */

const request = require('supertest');
const app = require('../../test-server');
const db = require('../../models');

describe('Ricardian Contract Enhanced Functionality', () => {
  let testTdcUser, testTdpUser, testCcrpUser, testDataset, testAiModel;
  let authToken;

  beforeAll(async () => {
    // Create test users
    testTdcUser = await db.User.create({
      name: 'Test TDC User',
      email: 'tdc@test.com',
      partyType: 'TDC',
      isRegistered: true,
      isActive: true
    });

    testTdpUser = await db.User.create({
      name: 'Test TDP User',
      email: 'tdp@test.com',
      partyType: 'TDP',
      isRegistered: true,
      isActive: true
    });

    testCcrpUser = await db.User.create({
      name: 'Test TSP User',
      email: 'test-tsp@example.com',
      partyType: 'TSP',
      isActive: true
    });

    // Create test dataset
    testDataset = await db.Dataset.create({
      datasetId: 'TEST-DATASET-001',
      name: 'Test Dataset',
      description: 'Test dataset for Ricardian contract testing',
      category: 'Tabular',
      size: 1000, // Size in MB
      recordCount: 10000,
      price: 100.00,
      license: 'MIT',
      ownerId: testTdpUser.id,
      isPublic: true,
      isActive: true
    });

    // Create test AI model
    testAiModel = await db.AIModel.create({
      modelId: 'test-model-001',
      name: 'Test AI Model',
      description: 'Test AI model for contract testing',
      type: 'transformer',
      architecture: 'bert-base',
      parameters: '110M',
      framework: 'PyTorch',
      privacyTechnique: 'differential-privacy',
      validationMetrics: {
        precision: 0.94,
        recall: 0.93,
        f1Score: 0.94
      },
      maxEpochs: 100,
      batchSize: 32,
      learningRate: 0.001,
      isActive: true
    });

    // Get auth token for TDC user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-tdc@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testAiModel) {
      await db.AIModel.destroy({ where: { id: testAiModel.id } });
    }
    if (testDataset) {
      await db.Dataset.destroy({ where: { id: testDataset.id } });
    }
    if (testTdcUser) {
      await db.User.destroy({ where: { id: testTdcUser.id } });
    }
    if (testTdpUser) {
      await db.User.destroy({ where: { id: testTdpUser.id } });
    }
  });

  describe('POST /api/contracts/ricardian', () => {
    it('should create Ricardian contract with comprehensive training environment specifications', async () => {
      const contractPayload = {
        datasetSelections: [
          {
            datasetId: 'TEST-DATASET-001',
            individualPrice: 1000
          }
        ],
        duration: 90,
        termsAndConditions: 'Test terms and conditions',
        tspId: testCcrpUser.id,
        aiModelIds: [testAiModel.id],
        privacyRequirements: {
          maxPrivacyLoss: 0.1,
          minAccuracy: 0.95,
          differentialPrivacy: {
            enabled: true,
            epsilon: 0.1,
            delta: 1e-5
          },
          federatedLearning: {
            enabled: true,
            aggregationMethod: 'secure-aggregation',
            communicationRounds: 100
          },
          secureMultiPartyComputation: {
            enabled: false,
            protocol: 'shamir-secret-sharing',
            threshold: 3
          }
        },
        trainingEnvironment: {
          ccrpPlatform: {
            provider: 'Test TSP Provider',
            platform: 'PRIVATE_CLOUD',
            infrastructure: {
              compute: {
                type: 'DEDICATED_SERVERS',
                specifications: {
                  cpu: '64 cores (AMD EPYC 7763)',
                  memory: '512 GB DDR4 ECC',
                  gpu: '8x NVIDIA A100 (80GB each)',
                  storage: '10 TB NVMe SSD',
                  network: '100 Gbps dedicated'
                },
                isolation: 'PHYSICAL_SEPARATION',
                location: 'ON_PREMISE_SECURE_FACILITY'
              },
              storage: {
                type: 'ENCRYPTED_STORAGE',
                encryption: 'AES-256-XTS',
                keyManagement: 'HSM_PROTECTED',
                backup: 'AIR_GAPPED_BACKUP',
                redundancy: '3X_REPLICATION'
              },
              network: {
                type: 'PRIVATE_NETWORK',
                isolation: 'VPN_ONLY_ACCESS',
                firewall: 'NEXT_GEN_FIREWALL',
                monitoring: '24X7_SURVEILLANCE',
                bandwidth: '100 Gbps dedicated'
              }
            },
            security: {
              authentication: {
                method: 'MULTI_FACTOR_AUTH',
                factors: ['SMART_CARD', 'BIOMETRIC', 'PIN'],
                sessionTimeout: '4 hours',
                maxAttempts: 3
              },
              authorization: {
                model: 'ROLE_BASED_ACCESS',
                roles: ['DATA_SCIENTIST', 'SYSTEM_ADMIN', 'AUDITOR'],
                principle: 'LEAST_PRIVILEGE'
              },
              monitoring: {
                logging: 'COMPREHENSIVE_AUDIT_LOG',
                alerting: 'REAL_TIME_ALERTS',
                analytics: 'BEHAVIOR_ANALYTICS',
                retention: '7 years'
              },
              compliance: {
                standards: ['ISO_27001', 'SOC_2', 'HIPAA', 'GDPR', 'DPDP_2023'],
                certifications: ['FEDRAMP', 'HITRUST'],
                audits: 'QUARTERLY_SECURITY_AUDITS'
              }
            }
          },
          trainingSpecifications: {
            modelType: 'DIAGNOSTIC_AI_MODEL',
            architecture: {
              type: 'DEEP_LEARNING',
              framework: 'TensorFlow 2.12',
              model: 'Transformer-based classifier',
              parameters: '500M parameters',
              inputSize: '512x512x3 (medical images)',
              outputClasses: 15
            },
            training: {
              algorithm: 'Federated Learning',
              privacyTechniques: [
                'DIFFERENTIAL_PRIVACY',
                'SECURE_MULTIPARTY_COMPUTATION',
                'HOMOMORPHIC_ENCRYPTION'
              ],
              hyperparameters: {
                learningRate: 0.001,
                batchSize: 32,
                epochs: 100,
                optimizer: 'Adam',
                lossFunction: 'Categorical Crossentropy'
              },
              validation: {
                method: '5_FOLD_CROSS_VALIDATION',
                metrics: ['Precision', 'Recall', 'F1-Score', 'AUC-ROC'],
                targetAccuracy: 0.95
              }
            },
            dataProcessing: {
              preprocessing: [
                'IMAGE_NORMALIZATION',
                'DATA_AUGMENTATION',
                'FEATURE_EXTRACTION'
              ],
              privacy: [
                'DATA_ANONYMIZATION',
                'K_ANONYMITY',
                'DIFFERENTIAL_PRIVACY'
              ],
              quality: [
                'DATA_VALIDATION',
                'OUTLIER_DETECTION',
                'MISSING_DATA_HANDLING'
              ]
            }
          },
          deployment: {
            environment: 'ISOLATED_CONTAINER',
            orchestration: 'Kubernetes',
            scaling: 'AUTO_SCALING',
            monitoring: 'PROMETHEUS_GRAFANA',
            backup: 'AUTOMATED_BACKUP'
          }
        },
        environmentSpecs: {
          infrastructure: {
            computeType: 'confidential-vm',
            memoryGB: 32,
            cpuCores: 8,
            gpuType: 'V100',
            gpuCount: 2
          },
          security: {
            attestationRequired: true,
            encryptionAtRest: true,
            encryptionInTransit: true,
            networkIsolation: true
          },
          kms: {
            provider: 'azure-key-vault',
            keyName: 'training-data-key',
            region: 'eastus'
          }
        },
        trainingParams: {
          maxPrivacyLoss: 0.1,
          minAccuracy: 0.85,
          differentialPrivacy: {
            enabled: true,
            epsilon: 0.1,
            delta: 1e-5
          },
          federatedLearning: {
            enabled: true,
            communicationRounds: 100
          },
          secureMultiPartyComputation: {
            enabled: false
          }
        }
      };
      const res = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractPayload);
      expect(res.statusCode).toBe(201);
      expect(res.body.contract).toBeDefined();
      expect(res.body.contract.environmentSpecs).toBeDefined();
      expect(res.body.contract.trainingParams).toBeDefined();
      // Check that the values match what was sent
      expect(res.body.contract.environmentSpecs.infrastructure.computeType).toBe('confidential-vm');
      expect(res.body.contract.trainingParams.maxPrivacyLoss).toBe(0.1);
    });

    it('should save default trainingParams and environmentSpecs if not provided', async () => {
      const contractPayload = {
        datasetSelections: [
          {
            datasetId: 'TEST-DATASET-001',
            individualPrice: 1000
          }
        ],
        duration: 30,
        termsAndConditions: 'Default test',
        tspId: testCcrpUser.id
      };
      const res = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractPayload);
      expect(res.statusCode).toBe(201);
      expect(res.body.contract).toBeDefined();
      expect(res.body.contract.trainingParams).toBeDefined();
      expect(res.body.contract.environmentSpecs).toBeDefined();
      // Should be an object (not null/undefined)
      expect(typeof res.body.contract.trainingParams).toBe('object');
      expect(typeof res.body.contract.environmentSpecs).toBe('object');
    });

    it('should validate required training environment fields', async () => {
      const contractPayload = {
        datasetSelections: [
          {
            datasetId: 'TEST-DATASET-001',
            individualPrice: 1000
          }
        ],
        duration: 90,
        termsAndConditions: 'Test terms',
        // Missing training environment specifications
      };

      const response = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractPayload);

      expect(response.status).toBe(201); // Should still succeed as training environment is optional
      expect(response.body.success).toBe(true);
    });

    it('should handle multiple datasets with different TDPs', async () => {
      // Create second TDP and dataset
      const testTdpUser2 = await db.User.create({
        name: 'Test TDP User 2',
        email: 'test-tdp2@example.com',
        partyType: 'TDP',
        isActive: true
      });

      const testDataset2 = await db.Dataset.create({
        datasetId: 'TEST-DATASET-002',
        name: 'Test Dataset 2',
        description: 'Second test dataset',
        category: 'Tabular',
        size: 2000, // Size in MB
        recordCount: 20000,
        price: 200.00,
        license: 'MIT',
        ownerId: testTdpUser.id,
        isPublic: true,
        isActive: true
      });

      const contractPayload = {
        datasetSelections: [
          {
            datasetId: 'TEST-DATASET-001',
            individualPrice: 1000
          },
          {
            datasetId: 'TEST-DATASET-002',
            individualPrice: 2000
          }
        ],
        duration: 90,
        termsAndConditions: 'Multi-dataset test',
        trainingEnvironment: {
          ccrpPlatform: {
            provider: 'Test TSP Provider'
          }
        }
      };

      const response = await request(app)
        .post('/api/contracts/ricardian')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractPayload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.contract.price).toBe(3000); // Total of both datasets

      // Clean up
      await db.Contract.destroy({ where: { id: response.body.contract.id } });
      await db.Dataset.destroy({ where: { id: testDataset2.id } });
      await db.User.destroy({ where: { id: testTdpUser2.id } });
    });
  });

  describe('GET /api/contracts/ricardian/available-models', () => {
    it('should return available AI models for contract creation', async () => {
      const response = await request(app)
        .get('/api/contracts/ricardian/available-models');

      expect(response.status).toBe(200);
      expect(response.body.models).toBeDefined();
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);

      // Verify model structure
      const model = response.body.models[0];
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.type).toBeDefined();
      expect(model.architecture).toBeDefined();
      expect(model.privacyTechnique).toBeDefined();
    });
  });

  describe('GET /api/contracts/types/supported', () => {
    it('should return supported contract types', async () => {
      const response = await request(app)
        .get('/api/contracts/types/supported');

      expect(response.status).toBe(200);
      expect(response.body.supportedTypes).toBeDefined();
      expect(Array.isArray(response.body.supportedTypes)).toBe(true);
      expect(response.body.supportedTypes.length).toBeGreaterThan(0);

      // Verify contract type structure
      const contractType = response.body.supportedTypes[0];
      expect(contractType.id).toBeDefined();
      expect(contractType.name).toBeDefined();
      expect(contractType.description).toBeDefined();
      expect(contractType.category).toBeDefined();
      expect(contractType.features).toBeDefined();
    });
  });
}); 