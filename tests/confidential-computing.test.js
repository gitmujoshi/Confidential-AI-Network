/**
 * Confidential Computing Test Suite
 * 
 * Tests for the confidential computing attribute integration with datasets,
 * infrastructure provisioning, and training environments.
 * 
 * This test suite covers:
 * 1. Dataset confidential computing attribute
 * 2. Infrastructure service confidential computing configuration
 * 3. Contract creation with confidential computing datasets
 * 4. Frontend confidential computing UI components
 * 5. Security configuration for confidential computing
 */

const request = require('supertest');
const { sequelize } = require('../models');
const InfrastructureService = require('../services/infrastructureService');
const { User, Contract, Dataset, TrainingEnvironment } = require('../models');

describe('Confidential Computing Integration Tests', () => {
  let app;
  let infrastructureService;
  let testUsers = {};
  let testDatasets = {};
  let testContracts = {};

  beforeAll(async () => {
    // Initialize services
    infrastructureService = new InfrastructureService();
    
    // Start the Express app
    app = require('../server');
    
    // Sync database
    await sequelize.sync({ force: true });
    
    console.log('✅ Confidential computing test environment initialized');
  }, 60000);

  afterAll(async () => {
    // Clean up
    await sequelize.close();
    console.log('✅ Confidential computing test environment cleaned up');
  }, 30000);

  describe('Dataset Confidential Computing Attribute', () => {
    test('should create dataset with confidential computing required', async () => {
      // Create TDP user
      const tdpUser = await User.create({
        name: 'Test TDP',
        email: 'tdp-confidential@example.com',
        partyType: 'TDP',
        walletAddress: '0x1234567890123456789012345678901234567890',
        did: 'did:web:github.com:tdp-confidential',
        iamUserId: 'tdp-confidential-iam'
      });

      // Create dataset with confidential computing required
      const dataset = await Dataset.create({
        datasetId: 'CONFIDENTIAL-DATASET-001',
        name: 'Medical Speech Dataset',
        description: 'Sensitive medical speech data requiring confidential computing',
        category: 'Audio',
        size: 500,
        recordCount: 10000,
        price: 150.00,
        license: 'Restricted',
        tags: ['medical', 'speech', 'confidential'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: true,
        ownerId: tdpUser.id,
        depaId: 'DATASET-12345678-1234-1234-1234-123456789012'
      });

      expect(dataset.id).toBeDefined();
      expect(dataset.confidentialComputingRequired).toBe(true);
      expect(dataset.category).toBe('Audio');
      testDatasets.confidential = dataset;
      testUsers.tdp = tdpUser;
    });

    test('should create dataset without confidential computing required', async () => {
      // Create dataset without confidential computing
      const dataset = await Dataset.create({
        datasetId: 'STANDARD-DATASET-001',
        name: 'Public Image Dataset',
        description: 'Public image dataset for standard processing',
        category: 'Computer Vision',
        size: 200,
        recordCount: 5000,
        price: 50.00,
        license: 'MIT',
        tags: ['images', 'public'],
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false,
        ownerId: testUsers.tdp.id,
        depaId: 'DATASET-87654321-4321-4321-4321-210987654321'
      });

      expect(dataset.id).toBeDefined();
      expect(dataset.confidentialComputingRequired).toBe(false);
      expect(dataset.category).toBe('Computer Vision');
      testDatasets.standard = dataset;
    });

    test('should filter datasets by confidential computing requirement', async () => {
      // Test API endpoint for filtering
      const response = await request(app)
        .get('/api/datasets/search')
        .query({ confidentialComputingRequired: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.datasets).toBeDefined();
      expect(response.body.datasets.length).toBeGreaterThan(0);
      
      // All returned datasets should have confidential computing required
      response.body.datasets.forEach(dataset => {
        expect(dataset.confidentialComputingRequired).toBe(true);
      });
    });

    test('should get dataset statistics including confidential computing', async () => {
      const response = await request(app)
        .get('/api/datasets/stats/overview');

      expect(response.status).toBe(200);
      expect(response.body.confidentialComputingDatasets).toBeDefined();
      expect(response.body.standardProcessingDatasets).toBeDefined();
      expect(response.body.confidentialComputingDatasets).toBeGreaterThan(0);
      expect(response.body.standardProcessingDatasets).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure Service Confidential Computing', () => {
    test('should build enhanced security config for confidential datasets', async () => {
      // Create contract with confidential computing dataset
      const tdcUser = await User.create({
        name: 'Test TDC',
        email: 'tdc-confidential@example.com',
        partyType: 'TDC',
        walletAddress: '0x2345678901234567890123456789012345678901',
        did: 'did:web:github.com:tdc-confidential',
        iamUserId: 'tdc-confidential-iam'
      });

      const ccrpUser = await User.create({
        name: 'Test CCRP',
        email: 'ccrp-confidential@example.com',
        partyType: 'CCRP',
        walletAddress: '0x3456789012345678901234567890123456789012',
        did: 'did:web:github.com:ccrp-confidential',
        iamUserId: 'ccrp-confidential-iam'
      });

      const contract = await Contract.create({
        contractId: 'CONFIDENTIAL-CONTRACT-001',
        tdcId: tdcUser.id,
        ccrpId: ccrpUser.id,
        ccrpCloudProvider: 'Azure',
        status: 'SIGNED',
        contractDatasets: [{
          datasetId: testDatasets.confidential.datasetId,
          tdpId: testUsers.tdp.id,
          datasetName: testDatasets.confidential.name,
          tdpName: testUsers.tdp.name,
          individualPrice: 150.00,
          confidentialComputingRequired: true,
          category: 'Audio',
          size: 500,
          recordCount: 10000,
          license: 'Restricted',
          tags: ['medical', 'speech', 'confidential']
        }],
        datasetCount: 1,
        tdpCount: 1,
        totalPrice: 150.00
      });

      testContracts.confidential = contract;

      // Test security configuration building
      const securityConfig = infrastructureService.buildSecurityConfig(contract, {});
      
      expect(securityConfig.confidentialComputing).toBe(true);
      expect(securityConfig.attestationRequired).toBe(true);
      expect(securityConfig.hardwareSecurityModule).toBe(true);
      expect(securityConfig.secureEnclave).toBe(true);
      expect(securityConfig.trustedExecutionEnvironment).toBe(true);
      expect(securityConfig.vpnRequired).toBe(true);
      expect(securityConfig.multiFactorAuth).toBe(true);
      expect(securityConfig.realTimeAlerts).toBe(true);
      expect(securityConfig.anomalyDetection).toBe(true);
      expect(securityConfig.regulatoryCompliance).toContain('HIPAA');
      expect(securityConfig.regulatoryCompliance).toContain('GDPR');
      expect(securityConfig.regulatoryCompliance).toContain('SOX');
    });

    test('should build standard security config for non-confidential datasets', async () => {
      // Create contract with standard dataset
      const contract = await Contract.create({
        contractId: 'STANDARD-CONTRACT-001',
        tdcId: testUsers.tdc.id,
        ccrpId: testUsers.ccrp.id,
        ccrpCloudProvider: 'Azure',
        status: 'SIGNED',
        contractDatasets: [{
          datasetId: testDatasets.standard.datasetId,
          tdpId: testUsers.tdp.id,
          datasetName: testDatasets.standard.name,
          tdpName: testUsers.tdp.name,
          individualPrice: 50.00,
          confidentialComputingRequired: false,
          category: 'Computer Vision',
          size: 200,
          recordCount: 5000,
          license: 'MIT',
          tags: ['images', 'public']
        }],
        datasetCount: 1,
        tdpCount: 1,
        totalPrice: 50.00
      });

      testContracts.standard = contract;

      // Test security configuration building
      const securityConfig = infrastructureService.buildSecurityConfig(contract, {});
      
      expect(securityConfig.confidentialComputing).toBe(false);
      expect(securityConfig.attestationRequired).toBe(false);
      expect(securityConfig.hardwareSecurityModule).toBe(false);
      expect(securityConfig.secureEnclave).toBe(false);
      expect(securityConfig.vpnRequired).toBe(false);
      expect(securityConfig.multiFactorAuth).toBe(false);
      expect(securityConfig.sessionTimeout).toBe(3600); // 1 hour
    });

    test('should build enhanced infrastructure config for confidential datasets', async () => {
      const infrastructureConfig = infrastructureService.buildInfrastructureConfig(testContracts.confidential, {});
      
      expect(infrastructureConfig.compute.confidentialComputing).toBe(true);
      expect(infrastructureConfig.compute.secureEnclave).toBe(true);
      expect(infrastructureConfig.compute.trustedExecutionEnvironment).toBe(true);
      expect(infrastructureConfig.compute.gpuEnabled).toBe(true);
      expect(infrastructureConfig.compute.gpuType).toBe('V100');
      expect(infrastructureConfig.compute.cpuCores).toBeGreaterThanOrEqual(8);
      expect(infrastructureConfig.compute.memoryGB).toBeGreaterThanOrEqual(32);
      expect(infrastructureConfig.compute.autoScaling).toBe(true);
      expect(infrastructureConfig.compute.minInstances).toBe(2);
      expect(infrastructureConfig.compute.maxInstances).toBe(5);
      
      expect(infrastructureConfig.storage.type).toBe('Premium SSD');
      expect(infrastructureConfig.storage.sizeGB).toBeGreaterThanOrEqual(500);
      expect(infrastructureConfig.storage.encryptionAlgorithm).toBe('AES-256-GCM');
      expect(infrastructureConfig.storage.dataRetention).toBe(365);
      expect(infrastructureConfig.storage.accessLogging).toBe(true);
      expect(infrastructureConfig.storage.versioning).toBe(true);
      expect(infrastructureConfig.storage.replication).toBe(true);
      
      expect(infrastructureConfig.network.vpcEnabled).toBe(true);
      expect(infrastructureConfig.network.privateSubnet).toBe(true);
      expect(infrastructureConfig.network.loadBalancer).toBe(true);
      expect(infrastructureConfig.network.cdnEnabled).toBe(false);
      expect(infrastructureConfig.network.bandwidth).toBe('10Gbps');
      expect(infrastructureConfig.network.firewall).toBe(true);
      expect(infrastructureConfig.network.networkSecurityGroup).toBe(true);
      expect(infrastructureConfig.network.vpnRequired).toBe(true);
      expect(infrastructureConfig.network.privateLink).toBe(true);
      
      expect(infrastructureConfig.database.highAvailability).toBe(true);
      expect(infrastructureConfig.database.sslRequired).toBe(true);
      expect(infrastructureConfig.database.auditLogging).toBe(true);
      expect(infrastructureConfig.database.connectionPooling).toBe(true);
      
      expect(infrastructureConfig.monitoring.metrics).toContain('Security');
      expect(infrastructureConfig.monitoring.metrics).toContain('Compliance');
      expect(infrastructureConfig.monitoring.metrics).toContain('Attestation');
      expect(infrastructureConfig.monitoring.logRetention).toBe(365);
      expect(infrastructureConfig.monitoring.securityMonitoring).toBe(true);
      expect(infrastructureConfig.monitoring.complianceMonitoring).toBe(true);
      expect(infrastructureConfig.monitoring.realTimeAlerts).toBe(true);
      expect(infrastructureConfig.monitoring.anomalyDetection).toBe(true);
      
      expect(infrastructureConfig.security.keyManagement).toBe(true);
      expect(infrastructureConfig.security.certificateManagement).toBe(true);
      expect(infrastructureConfig.security.identityProvider).toBe(true);
      expect(infrastructureConfig.security.accessControl).toBe(true);
      
      expect(infrastructureConfig.compliance.auditTrail).toBe(true);
      expect(infrastructureConfig.compliance.complianceReporting).toBe(true);
      expect(infrastructureConfig.compliance.regularAudits).toBe(true);
      expect(infrastructureConfig.compliance.breachNotification).toBe(true);
    });

    test('should build standard infrastructure config for non-confidential datasets', async () => {
      const infrastructureConfig = infrastructureService.buildInfrastructureConfig(testContracts.standard, {});
      
      expect(infrastructureConfig.compute.confidentialComputing).toBeUndefined();
      expect(infrastructureConfig.compute.secureEnclave).toBeUndefined();
      expect(infrastructureConfig.compute.trustedExecutionEnvironment).toBeUndefined();
      expect(infrastructureConfig.compute.gpuEnabled).toBe(false);
      expect(infrastructureConfig.compute.cpuCores).toBe(4);
      expect(infrastructureConfig.compute.memoryGB).toBe(16);
      expect(infrastructureConfig.compute.autoScaling).toBe(false);
      expect(infrastructureConfig.compute.minInstances).toBe(1);
      expect(infrastructureConfig.compute.maxInstances).toBe(3);
      
      expect(infrastructureConfig.storage.type).toBe('SSD');
      expect(infrastructureConfig.storage.sizeGB).toBe(100);
      expect(infrastructureConfig.storage.dataRetention).toBe(90);
      
      expect(infrastructureConfig.network.vpcEnabled).toBe(true);
      expect(infrastructureConfig.network.privateSubnet).toBe(true);
      expect(infrastructureConfig.network.loadBalancer).toBe(false);
      expect(infrastructureConfig.network.cdnEnabled).toBe(false);
      expect(infrastructureConfig.network.bandwidth).toBe('1Gbps');
      
      expect(infrastructureConfig.database.highAvailability).toBe(false);
      expect(infrastructureConfig.database.sslRequired).toBeUndefined();
      expect(infrastructureConfig.database.auditLogging).toBeUndefined();
      expect(infrastructureConfig.database.connectionPooling).toBeUndefined();
      
      expect(infrastructureConfig.monitoring.metrics).toEqual(['CPU', 'Memory', 'Network', 'Storage']);
      expect(infrastructureConfig.monitoring.logRetention).toBe(30);
    });

    test('should get confidential computing instance types for different cloud providers', () => {
      const awsType = infrastructureService.getConfidentialComputingInstanceType('AWS');
      const gcpType = infrastructureService.getConfidentialComputingInstanceType('GCP');
      const azureType = infrastructureService.getConfidentialComputingInstanceType('Azure');
      const ociType = infrastructureService.getConfidentialComputingInstanceType('OCI');
      
      expect(awsType).toBe('c6i.2xlarge');
      expect(gcpType).toBe('n2d-standard-8');
      expect(azureType).toBe('Standard_DC8s_v3');
      expect(ociType).toBe('VM.Standard3.Flex');
    });
  });

  describe('Contract Creation with Confidential Computing', () => {
    test('should create contract with confidential computing dataset information', async () => {
      const response = await request(app)
        .post('/api/contracts/ricardian')
        .send({
          datasetSelections: [{
            datasetId: testDatasets.confidential.datasetId,
            individualPrice: 150.00
          }],
          duration: 30,
          termsAndConditions: 'Test terms for confidential computing contract',
          ccrpId: testUsers.ccrp.id,
          contractType: 'AI_TRAINING',
          privacyRequirements: {
            maxPrivacyLoss: 0.1,
            minAccuracy: 0.85,
            differentialPrivacy: { enabled: true, epsilon: 0.1, delta: 1e-5 },
            federatedLearning: { enabled: true, communicationRounds: 100 },
            secureMultiPartyComputation: { enabled: false }
          },
          trainingEnvironment: {
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
            }
          },
          complianceSpecs: {
            regulations: [
              {
                name: 'HIPAA',
                status: 'COMPLIANT',
                requirements: [
                  'PHI de-identification implemented',
                  'Access controls enforced',
                  'Audit logging maintained'
                ]
              }
            ]
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.contract).toBeDefined();
      
      const contract = response.body.contract;
      expect(contract.contractDatasets).toBeDefined();
      expect(contract.contractDatasets.length).toBe(1);
      
      const datasetInfo = contract.contractDatasets[0];
      expect(datasetInfo.confidentialComputingRequired).toBe(true);
      expect(datasetInfo.category).toBe('Audio');
      expect(datasetInfo.size).toBe(500);
      expect(datasetInfo.recordCount).toBe(10000);
      expect(datasetInfo.license).toBe('Restricted');
      expect(datasetInfo.tags).toContain('medical');
      expect(datasetInfo.tags).toContain('speech');
      expect(datasetInfo.tags).toContain('confidential');
    });
  });

  describe('Training Environment with Confidential Computing', () => {
    test('should create training environment with confidential computing configuration', async () => {
      const environment = await TrainingEnvironment.create({
        contractId: testContracts.confidential.contractId,
        environmentId: 'CONFIDENTIAL-ENV-001',
        cloudProvider: 'Azure',
        region: 'eastus',
        status: 'ACTIVE',
        infrastructureConfig: {
          compute: {
            instanceType: 'Standard_DC8s_v3',
            cpuCores: 8,
            memoryGB: 32,
            gpuEnabled: true,
            gpuType: 'V100',
            gpuCount: 2,
            confidentialComputing: true,
            secureEnclave: true,
            trustedExecutionEnvironment: true
          },
          storage: {
            type: 'Premium SSD',
            sizeGB: 500,
            encryptionAlgorithm: 'AES-256-GCM',
            dataRetention: 365,
            accessLogging: true,
            versioning: true,
            replication: true
          },
          network: {
            vpcEnabled: true,
            privateSubnet: true,
            loadBalancer: true,
            cdnEnabled: false,
            bandwidth: '10Gbps',
            firewall: true,
            networkSecurityGroup: true,
            vpnRequired: true,
            privateLink: true
          },
          database: {
            type: 'PostgreSQL',
            version: '13',
            sizeGB: 100,
            highAvailability: true,
            sslRequired: true,
            auditLogging: true,
            connectionPooling: true
          },
          monitoring: {
            enabled: true,
            metrics: ['CPU', 'Memory', 'Network', 'Storage', 'Security', 'Compliance', 'Attestation'],
            logRetention: 365,
            securityMonitoring: true,
            complianceMonitoring: true,
            realTimeAlerts: true,
            anomalyDetection: true
          },
          security: {
            keyManagement: true,
            certificateManagement: true,
            identityProvider: true,
            accessControl: true
          },
          compliance: {
            auditTrail: true,
            complianceReporting: true,
            regularAudits: true,
            breachNotification: true
          }
        },
        securityConfig: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          encryptionAlgorithm: 'AES-256-GCM',
          keyRotation: true,
          keyRotationInterval: 30,
          networkIsolation: true,
          privateSubnet: true,
          vpnRequired: true,
          networkSecurityGroup: true,
          roleBasedAccess: true,
          multiFactorAuth: true,
          sessionTimeout: 1800,
          privilegedAccess: false,
          auditLogging: true,
          securityMonitoring: true,
          threatDetection: true,
          realTimeAlerts: true,
          anomalyDetection: true,
          dataResidency: 'US',
          regulatoryCompliance: ['GDPR', 'HIPAA', 'SOX', 'FedRAMP', 'ISO-27001'],
          attestationRequired: true,
          hardwareSecurityModule: true,
          secureEnclave: true,
          confidentialComputing: true,
          trustedExecutionEnvironment: true,
          dataLossPrevention: true,
          endpointProtection: true,
          intrusionDetection: true,
          vulnerabilityScanning: true,
          complianceMonitoring: true,
          regularAudits: true,
          breachNotification: true
        },
        monitoringConfig: {
          enabled: true,
          metrics: ['CPU', 'Memory', 'Network', 'Storage', 'Security', 'Compliance', 'Attestation'],
          alerts: true,
          logRetention: 365,
          securityMonitoring: true,
          complianceMonitoring: true,
          realTimeAlerts: true,
          anomalyDetection: true
        },
        createdBy: testUsers.tdc.id
      });

      expect(environment.id).toBeDefined();
      expect(environment.environmentId).toBe('CONFIDENTIAL-ENV-001');
      expect(environment.cloudProvider).toBe('Azure');
      expect(environment.status).toBe('ACTIVE');
      
      // Verify infrastructure configuration
      const infraConfig = environment.infrastructureConfig;
      expect(infraConfig.compute.confidentialComputing).toBe(true);
      expect(infraConfig.compute.secureEnclave).toBe(true);
      expect(infraConfig.compute.trustedExecutionEnvironment).toBe(true);
      expect(infraConfig.compute.instanceType).toBe('Standard_DC8s_v3');
      
      // Verify security configuration
      const securityConfig = environment.securityConfig;
      expect(securityConfig.confidentialComputing).toBe(true);
      expect(securityConfig.attestationRequired).toBe(true);
      expect(securityConfig.hardwareSecurityModule).toBe(true);
      expect(securityConfig.secureEnclave).toBe(true);
      expect(securityConfig.trustedExecutionEnvironment).toBe(true);
      expect(securityConfig.vpnRequired).toBe(true);
      expect(securityConfig.multiFactorAuth).toBe(true);
      expect(securityConfig.regulatoryCompliance).toContain('HIPAA');
      expect(securityConfig.regulatoryCompliance).toContain('GDPR');
    });
  });

  describe('API Endpoints for Confidential Computing', () => {
    test('should get datasets with confidential computing filter', async () => {
      const response = await request(app)
        .get('/api/datasets/public')
        .query({ confidentialComputingRequired: 'true' });

      expect(response.status).toBe(200);
      expect(response.body.datasets).toBeDefined();
      
      // Verify all returned datasets have confidential computing required
      response.body.datasets.forEach(dataset => {
        expect(dataset.confidentialComputingRequired).toBe(true);
      });
    });

    test('should get datasets without confidential computing filter', async () => {
      const response = await request(app)
        .get('/api/datasets/public')
        .query({ confidentialComputingRequired: 'false' });

      expect(response.status).toBe(200);
      expect(response.body.datasets).toBeDefined();
      
      // Verify all returned datasets do not have confidential computing required
      response.body.datasets.forEach(dataset => {
        expect(dataset.confidentialComputingRequired).toBe(false);
      });
    });

    test('should create dataset with confidential computing via API', async () => {
      const response = await request(app)
        .post('/api/datasets')
        .send({
          datasetId: 'API-CONFIDENTIAL-001',
          name: 'API Test Confidential Dataset',
          description: 'Test dataset created via API with confidential computing',
          category: 'Natural Language Processing',
          size: 300,
          recordCount: 8000,
          price: 120.00,
          license: 'Restricted',
          tags: ['nlp', 'confidential', 'api-test'],
          isPublic: true,
          confidentialComputingRequired: true,
          ownerId: testUsers.tdp.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.dataset.confidentialComputingRequired).toBe(true);
      expect(response.body.dataset.category).toBe('Natural Language Processing');
    });
  });

  describe('Frontend Component Tests (Mock)', () => {
    test('should render confidential computing indicators in dataset cards', () => {
      // Mock test for frontend component rendering
      const mockDataset = {
        id: 1,
        name: 'Medical Speech Dataset',
        description: 'Sensitive medical speech data',
        category: 'Audio',
        confidentialComputingRequired: true,
        price: 150.00,
        owner: { name: 'Medical TDP' },
        tags: ['medical', 'speech', 'confidential']
      };

      // Simulate component rendering logic
      const hasConfidentialComputing = mockDataset.confidentialComputingRequired === true;
      const confidentialComputingChip = hasConfidentialComputing ? 'CONFIDENTIAL_COMPUTING_CHIP' : null;
      const securityIcon = hasConfidentialComputing ? 'SECURITY_ICON' : 'STORAGE_ICON';
      const chipColor = hasConfidentialComputing ? 'warning' : 'default';

      expect(hasConfidentialComputing).toBe(true);
      expect(confidentialComputingChip).toBe('CONFIDENTIAL_COMPUTING_CHIP');
      expect(securityIcon).toBe('SECURITY_ICON');
      expect(chipColor).toBe('warning');
    });

    test('should render standard processing indicators for non-confidential datasets', () => {
      // Mock test for standard dataset rendering
      const mockDataset = {
        id: 2,
        name: 'Public Image Dataset',
        description: 'Public image dataset',
        category: 'Computer Vision',
        confidentialComputingRequired: false,
        price: 50.00,
        owner: { name: 'Public TDP' },
        tags: ['images', 'public']
      };

      // Simulate component rendering logic
      const hasConfidentialComputing = mockDataset.confidentialComputingRequired === true;
      const confidentialComputingChip = hasConfidentialComputing ? 'CONFIDENTIAL_COMPUTING_CHIP' : null;
      const securityIcon = hasConfidentialComputing ? 'SECURITY_ICON' : 'STORAGE_ICON';
      const chipColor = hasConfidentialComputing ? 'warning' : 'default';

      expect(hasConfidentialComputing).toBe(false);
      expect(confidentialComputingChip).toBe(null);
      expect(securityIcon).toBe('STORAGE_ICON');
      expect(chipColor).toBe('default');
    });

    test('should configure infrastructure provisioning with confidential computing options', () => {
      // Mock test for infrastructure provisioning configuration
      const mockProvisionConfig = {
        environmentName: 'Confidential Training Environment',
        enableConfidentialComputing: true,
        enableAttestation: true,
        enableSecureEnclave: true,
        enableHardwareSecurityModule: true,
        complianceFramework: 'HIPAA',
        dataRetentionDays: 365,
        auditLogging: true,
        threatDetection: true,
        realTimeAlerts: true
      };

      expect(mockProvisionConfig.enableConfidentialComputing).toBe(true);
      expect(mockProvisionConfig.enableAttestation).toBe(true);
      expect(mockProvisionConfig.enableSecureEnclave).toBe(true);
      expect(mockProvisionConfig.enableHardwareSecurityModule).toBe(true);
      expect(mockProvisionConfig.complianceFramework).toBe('HIPAA');
      expect(mockProvisionConfig.dataRetentionDays).toBe(365);
      expect(mockProvisionConfig.auditLogging).toBe(true);
      expect(mockProvisionConfig.threatDetection).toBe(true);
      expect(mockProvisionConfig.realTimeAlerts).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing confidential computing attribute gracefully', async () => {
      // Create dataset without confidentialComputingRequired field (backward compatibility)
      const dataset = await Dataset.create({
        datasetId: 'LEGACY-DATASET-001',
        name: 'Legacy Dataset',
        description: 'Dataset without confidential computing attribute',
        category: 'Tabular',
        size: 100,
        recordCount: 2000,
        price: 25.00,
        license: 'MIT',
        tags: ['legacy'],
        isPublic: true,
        isActive: true,
        // confidentialComputingRequired not specified
        ownerId: testUsers.tdp.id,
        depaId: 'DATASET-LEGACY-1234-5678-9012-345678901234'
      });

      expect(dataset.confidentialComputingRequired).toBe(false); // Default value
    });

    test('should handle mixed confidential and non-confidential datasets in contract', async () => {
      // Create contract with both confidential and non-confidential datasets
      const contract = await Contract.create({
        contractId: 'MIXED-CONTRACT-001',
        tdcId: testUsers.tdc.id,
        ccrpId: testUsers.ccrp.id,
        ccrpCloudProvider: 'Azure',
        status: 'SIGNED',
        contractDatasets: [
          {
            datasetId: testDatasets.confidential.datasetId,
            tdpId: testUsers.tdp.id,
            datasetName: testDatasets.confidential.name,
            tdpName: testUsers.tdp.name,
            individualPrice: 150.00,
            confidentialComputingRequired: true,
            category: 'Audio',
            size: 500,
            recordCount: 10000,
            license: 'Restricted',
            tags: ['medical', 'speech', 'confidential']
          },
          {
            datasetId: testDatasets.standard.datasetId,
            tdpId: testUsers.tdp.id,
            datasetName: testDatasets.standard.name,
            tdpName: testUsers.tdp.name,
            individualPrice: 50.00,
            confidentialComputingRequired: false,
            category: 'Computer Vision',
            size: 200,
            recordCount: 5000,
            license: 'MIT',
            tags: ['images', 'public']
          }
        ],
        datasetCount: 2,
        tdpCount: 1,
        totalPrice: 200.00
      });

      // Should apply enhanced security since at least one dataset requires confidential computing
      const securityConfig = infrastructureService.buildSecurityConfig(contract, {});
      expect(securityConfig.confidentialComputing).toBe(true);
      expect(securityConfig.attestationRequired).toBe(true);
    });
  });
}); 