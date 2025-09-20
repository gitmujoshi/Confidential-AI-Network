/**
 * Comprehensive Test Suite for Multi-Cloud TEE Provisioning
 * 
 * Tests AWS Nitro, Azure SGX, GCP Confidential VMs, and OCI TEE provisioning
 * with attestation verification, cost optimization, and cross-provider features.
 */

const request = require('supertest');
const { expect } = require('chai');
const crypto = require('crypto');

// Import services and dependencies
const TEEProvisioningService = require('../backend/services/teeProvisioningService');
const { AWSProvider, AzureProvider, GCPProvider, OCIProvider } = require('../backend/services/multiCloudTEEProviders');
const app = require('../backend/server');

describe('🌐 Multi-Cloud TEE Provisioning Tests', function() {
  this.timeout(60000); // Extended timeout for provisioning operations

  let teeProvisioningService;
  let authToken;
  let testUser;
  let testContractId;

  before(async function() {
    console.log('🔧 Setting up Multi-Cloud TEE test environment...');
    
    // Initialize TEE provisioning service
    teeProvisioningService = new TEEProvisioningService();
    
    // Create test user and get auth token (CCRP role for TEE provisioning)
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tee-test@example.com',
        password: 'TestPassword123!',
        name: 'TEE Test User',
        organization: 'TEE Test Organization',
        partyType: 'CCRP'
      });

    testUser = userResponse.body.data.user;
    authToken = userResponse.body.data.token;

    // Create test contract
    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Multi-Cloud TEE Test Contract',
        description: 'Contract for testing multi-cloud TEE provisioning',
        price: 5000,
        currency: 'USD'
      });

    testContractId = contractResponse.body.data.contract.contractId;

    console.log('✅ Multi-Cloud TEE test environment ready');
  });

  describe('🚀 TEE Provisioning Service Initialization', function() {
    it('should initialize TEE provisioning service successfully', function() {
      expect(teeProvisioningService).to.be.an('object');
      expect(teeProvisioningService.providers).to.be.an('object');
      expect(teeProvisioningService.activeEnvironments).to.be.instanceOf(Map);
    });

    it('should have all cloud providers initialized', function() {
      expect(teeProvisioningService.providers.aws).to.be.instanceOf(AWSProvider);
      expect(teeProvisioningService.providers.azure).to.be.instanceOf(AzureProvider);
      expect(teeProvisioningService.providers.gcp).to.be.instanceOf(GCPProvider);
      expect(teeProvisioningService.providers.oci).to.be.instanceOf(OCIProvider);
      expect(teeProvisioningService.providers.local).to.exist;
    });

    it('should detect local mode correctly', function() {
      expect(teeProvisioningService.isLocalMode).to.be.a('boolean');
    });
  });

  describe('🔍 Provider Capabilities and Features', function() {
    it('should get available providers and capabilities', function() {
      const providers = teeProvisioningService.getAvailableProviders();

      expect(providers).to.be.an('object');
      expect(Object.keys(providers)).to.include.members(['aws', 'azure', 'gcp', 'oci', 'local']);

      // Check AWS provider capabilities
      expect(providers.aws.name).to.equal('AWS');
      expect(providers.aws.supportedRegions).to.be.an('array');
      expect(providers.aws.supportedInstanceTypes).to.be.an('array');
      expect(providers.aws.supportedRegions).to.include.members(['us-east-1', 'us-west-2', 'eu-west-1']);

      // Check Azure provider capabilities
      expect(providers.azure.name).to.equal('Azure');
      expect(providers.azure.supportedRegions).to.include.members(['eastus', 'westus2', 'westeurope']);
      expect(providers.azure.supportedInstanceTypes).to.include.members(['Standard_DC2s', 'Standard_DC4s']);
    });

    it('should validate provider-specific features', function() {
      const awsProvider = teeProvisioningService.providers.aws;
      const azureProvider = teeProvisioningService.providers.azure;

      // AWS Nitro features
      expect(awsProvider.nitroFeatures.memoryEncryption).to.be.true;
      expect(awsProvider.nitroFeatures.cpuAttestation).to.be.true;

      // Azure SGX features
      expect(azureProvider.sgxFeatures.enclaveSize).to.equal('128MB');
      expect(azureProvider.sgxFeatures.remoteAttestation).to.be.true;
    });
  });

  describe('💰 Cost Estimation', function() {
    it('should calculate AWS cost estimation', async function() {
      const config = {
        provider: 'aws',
        instanceType: 'm5.large',
        region: 'us-east-1',
        storageGB: 100
      };

      const costEstimation = await teeProvisioningService.getCostEstimation(config);

      expect(costEstimation).to.be.an('object');
      expect(costEstimation.provider).to.equal('aws');
      expect(costEstimation.hourlyCost).to.be.a('number');
      expect(costEstimation.dailyCost).to.be.a('number');
      expect(costEstimation.monthlyCost).to.be.a('number');
      expect(costEstimation.currency).to.equal('USD');
    });

    it('should calculate Azure cost estimation', async function() {
      const config = {
        provider: 'azure',
        instanceType: 'Standard_DC2s',
        region: 'eastus',
        storageGB: 200
      };

      const costEstimation = await teeProvisioningService.getCostEstimation(config);

      expect(costEstimation.provider).to.equal('azure');
      expect(costEstimation.hourlyCost).to.be.greaterThan(0);
    });

    it('should compare costs across providers', async function() {
      const baseConfig = {
        cpuCores: 2,
        memoryGB: 8,
        storageGB: 100
      };

      const awsCost = await teeProvisioningService.getCostEstimation({
        ...baseConfig,
        provider: 'aws',
        instanceType: 'm5.large'
      });

      const azureCost = await teeProvisioningService.getCostEstimation({
        ...baseConfig,
        provider: 'azure',
        instanceType: 'Standard_DC2s'
      });

      const gcpCost = await teeProvisioningService.getCostEstimation({
        ...baseConfig,
        provider: 'gcp',
        instanceType: 'n2d-standard-2'
      });

      expect(awsCost.hourlyCost).to.be.a('number');
      expect(azureCost.hourlyCost).to.be.a('number');
      expect(gcpCost.hourlyCost).to.be.a('number');

      console.log(`AWS: $${awsCost.hourlyCost}/hr, Azure: $${azureCost.hourlyCost}/hr, GCP: $${gcpCost.hourlyCost}/hr`);
    });
  });

  describe('🏗️ AWS Nitro Enclaves Provisioning', function() {
    let awsEnvironmentId;

    it('should provision AWS Nitro Enclave successfully', async function() {
      const config = {
        provider: 'aws',
        contractId: testContractId,
        region: 'us-east-1',
        instanceType: 'm5.large',
        userId: testUser.id
      };

      const environment = await teeProvisioningService.provisionEnvironment(config);

      expect(environment).to.be.an('object');
      expect(environment.provider).to.equal('AWS');
      expect(environment.type).to.equal('nitro-enclave');
      expect(environment.status).to.equal('PROVISIONING');
      expect(environment.awsConfig).to.exist;
      expect(environment.teeFeatures.attestationDocument).to.exist;
      expect(environment.teeFeatures.pcrs).to.exist;

      awsEnvironmentId = environment.id;
    });

    it('should complete AWS provisioning asynchronously', function(done) {
      this.timeout(10000);

      setTimeout(async () => {
        try {
          const environment = await teeProvisioningService.getEnvironmentById(awsEnvironmentId);
          expect(environment.status).to.equal('ACTIVE');
          expect(environment.security.attestationVerified).to.be.true;
          done();
        } catch (error) {
          done(error);
        }
      }, 6000); // AWS takes ~5 seconds to provision in simulation
    });

    it('should verify AWS Nitro attestation', async function() {
      const attestationResult = await teeProvisioningService.providers.aws.verifyAttestation(awsEnvironmentId);

      expect(attestationResult).to.be.an('object');
      expect(attestationResult.verified).to.be.true;
      expect(attestationResult.attestationLevel).to.equal('HARDWARE');
      expect(attestationResult.teeProvider).to.equal('AWS_NITRO');
    });

    it('should terminate AWS environment', async function() {
      const terminationResult = await teeProvisioningService.terminateEnvironment(awsEnvironmentId);

      expect(terminationResult.success).to.be.true;
      expect(terminationResult.terminationInitiated).to.be.true;
    });
  });

  describe('🔒 Azure SGX VMs Provisioning', function() {
    let azureEnvironmentId;

    it('should provision Azure SGX VM successfully', async function() {
      const config = {
        provider: 'azure',
        contractId: testContractId,
        region: 'eastus',
        instanceType: 'Standard_DC2s',
        userId: testUser.id
      };

      const environment = await teeProvisioningService.provisionEnvironment(config);

      expect(environment).to.be.an('object');
      expect(environment.provider).to.equal('Azure');
      expect(environment.type).to.equal('sgx-enclave');
      expect(environment.azureConfig).to.exist;
      expect(environment.teeFeatures.enclaveQuote).to.exist;
      expect(environment.teeFeatures.mrenclave).to.exist;

      azureEnvironmentId = environment.id;
    });

    it('should generate SGX quote correctly', async function() {
      const azureProvider = teeProvisioningService.providers.azure;
      const quote = await azureProvider.generateSGXQuote(azureEnvironmentId);

      expect(quote).to.be.an('object');
      expect(quote.version).to.equal(3);
      expect(quote.signType).to.equal(1);
      expect(quote.quote).to.be.a('string');
      expect(quote.quote).to.have.length(864); // SGX quote is 432 bytes = 864 hex chars
    });

    it('should verify Azure SGX attestation', async function() {
      const attestationResult = await teeProvisioningService.providers.azure.verifyAttestation(azureEnvironmentId);

      expect(attestationResult.verified).to.be.true;
      expect(attestationResult.teeProvider).to.equal('AZURE_SGX');
    });
  });

  describe('☁️ GCP Confidential VMs Provisioning', function() {
    let gcpEnvironmentId;

    it('should provision GCP Confidential VM successfully', async function() {
      const config = {
        provider: 'gcp',
        contractId: testContractId,
        region: 'us-central1',
        instanceType: 'n2d-standard-2',
        userId: testUser.id
      };

      const environment = await teeProvisioningService.provisionEnvironment(config);

      expect(environment).to.be.an('object');
      expect(environment.provider).to.equal('GCP');
      expect(environment.type).to.equal('confidential-vm');
      expect(environment.gcpConfig).to.exist;
      expect(environment.teeFeatures.attestationReport).to.exist;
      expect(environment.teeFeatures.sevSnpEnabled).to.be.true;

      gcpEnvironmentId = environment.id;
    });

    it('should generate GCP attestation report', async function() {
      const gcpProvider = teeProvisioningService.providers.gcp;
      const report = await gcpProvider.generateAttestationReport(gcpEnvironmentId);

      expect(report).to.be.an('object');
      expect(report.reportData).to.be.a('string');
      expect(report.signature).to.be.a('string');
      expect(report.certificates).to.be.an('array');
      expect(report.tcbLevel).to.equal(1);
    });
  });

  describe('🏛️ Oracle Cloud Infrastructure Provisioning', function() {
    let ociEnvironmentId;

    it('should provision OCI Confidential instance successfully', async function() {
      const config = {
        provider: 'oci',
        contractId: testContractId,
        region: 'us-ashburn-1',
        instanceType: 'VM.Standard.E4.Flex',
        userId: testUser.id
      };

      const environment = await teeProvisioningService.provisionEnvironment(config);

      expect(environment).to.be.an('object');
      expect(environment.provider).to.equal('OCI');
      expect(environment.type).to.equal('confidential-instance');
      expect(environment.ociConfig).to.exist;
      expect(environment.teeFeatures.dedicatedHost).to.be.true;

      ociEnvironmentId = environment.id;
    });

    it('should generate OCI attestation certificate', async function() {
      const ociProvider = teeProvisioningService.providers.oci;
      const certificate = await ociProvider.generateAttestationCertificate(ociEnvironmentId);

      expect(certificate).to.be.an('object');
      expect(certificate.certificate).to.include('BEGIN CERTIFICATE');
      expect(certificate.issuer).to.equal('Oracle Cloud Infrastructure CA');
      expect(certificate.platformId).to.equal(ociEnvironmentId);
    });
  });

  describe('📊 Environment Management', function() {
    let testEnvironments = [];

    before(async function() {
      // Create multiple test environments for management tests
      const providers = ['aws', 'azure', 'gcp'];
      
      for (const provider of providers) {
        const config = {
          provider,
          contractId: testContractId,
          userId: testUser.id
        };

        const environment = await teeProvisioningService.provisionEnvironment(config);
        testEnvironments.push(environment);
      }
    });

    it('should get all user environments', async function() {
      const environments = await teeProvisioningService.getUserEnvironments(testUser.id);

      expect(environments).to.be.an('array');
      expect(environments.length).to.be.greaterThan(0);
      
      environments.forEach(env => {
        expect(env.provisionedBy).to.equal(testUser.id);
        expect(env.monitoring).to.exist;
        expect(env.security.score).to.be.a('number');
      });
    });

    it('should filter environments by provider', async function() {
      const allEnvironments = await teeProvisioningService.getUserEnvironments(testUser.id);
      const awsEnvironments = allEnvironments.filter(env => env.providerName === 'aws');
      const azureEnvironments = allEnvironments.filter(env => env.providerName === 'azure');

      expect(awsEnvironments.length).to.be.greaterThan(0);
      expect(azureEnvironments.length).to.be.greaterThan(0);
    });

    it('should get environment by ID', async function() {
      const environment = testEnvironments[0];
      const retrievedEnv = await teeProvisioningService.getEnvironmentById(environment.id);

      expect(retrievedEnv).to.exist;
      expect(retrievedEnv.id).to.equal(environment.id);
      expect(retrievedEnv.providerName).to.exist;
    });

    it('should handle non-existent environment', async function() {
      const retrievedEnv = await teeProvisioningService.getEnvironmentById('non_existent_env');
      expect(retrievedEnv).to.be.null;
    });

    after(async function() {
      // Clean up test environments
      for (const environment of testEnvironments) {
        try {
          await teeProvisioningService.terminateEnvironment(environment.id);
        } catch (error) {
          console.warn(`Failed to terminate environment ${environment.id}:`, error.message);
        }
      }
    });
  });

  describe('⚡ Performance and Scalability', function() {
    it('should handle concurrent provisioning requests', async function() {
      this.timeout(30000);

      const concurrentRequests = [];
      const requestCount = 5;

      for (let i = 0; i < requestCount; i++) {
        const config = {
          provider: 'local', // Use local provider for speed
          contractId: testContractId,
          userId: testUser.id,
          metadata: { concurrentTest: true, index: i }
        };

        concurrentRequests.push(teeProvisioningService.provisionEnvironment(config));
      }

      const results = await Promise.allSettled(concurrentRequests);
      const successful = results.filter(result => result.status === 'fulfilled');

      expect(successful.length).to.equal(requestCount);
      console.log(`✅ Successfully handled ${successful.length} concurrent provisioning requests`);
    });

    it('should maintain performance under load', async function() {
      const startTime = Date.now();
      
      // Simulate high load operations
      const operations = [];
      for (let i = 0; i < 20; i++) {
        operations.push(teeProvisioningService.getAvailableProviders());
      }

      await Promise.all(operations);
      const endTime = Date.now();

      expect(endTime - startTime).to.be.lessThan(1000); // Should complete in under 1 second
      console.log(`✅ Completed 20 provider queries in ${endTime - startTime}ms`);
    });
  });

  describe('🔒 Security and Validation', function() {
    it('should validate provider support', async function() {
      try {
        await teeProvisioningService.provisionEnvironment({
          provider: 'unsupported_provider',
          contractId: testContractId,
          userId: testUser.id
        });
        expect.fail('Should have thrown error for unsupported provider');
      } catch (error) {
        expect(error.message).to.include('Unsupported cloud provider');
      }
    });

    it('should validate region support per provider', async function() {
      try {
        await teeProvisioningService.provisionEnvironment({
          provider: 'aws',
          region: 'unsupported-region',
          contractId: testContractId,
          userId: testUser.id
        });
        expect.fail('Should have thrown error for unsupported region');
      } catch (error) {
        expect(error.message).to.include('Unsupported AWS region');
      }
    });

    it('should validate instance type support', async function() {
      try {
        await teeProvisioningService.provisionEnvironment({
          provider: 'azure',
          instanceType: 'Unsupported_Instance',
          contractId: testContractId,
          userId: testUser.id
        });
        expect.fail('Should have thrown error for unsupported instance type');
      } catch (error) {
        expect(error.message).to.include('Unsupported Azure instance type');
      }
    });
  });
});

describe('🌐 Multi-Cloud TEE API Endpoints Tests', function() {
  this.timeout(30000);

  let authToken;
  let testUser;
  let testContractId;

  before(async function() {
    // Setup test user with CCRP role for API tests
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tee-api-test@example.com',
        password: 'TestPassword123!',
        name: 'TEE API Test User',
        organization: 'TEE API Test Organization',
        partyType: 'CCRP'
      });

    testUser = userResponse.body.data.user;
    authToken = userResponse.body.data.token;

    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'TEE API Test Contract',
        description: 'Contract for testing TEE API endpoints',
        price: 3000,
        currency: 'USD'
      });

    testContractId = contractResponse.body.data.contract.contractId;
  });

  describe('GET /api/multi-cloud-tee/providers', function() {
    it('should get available TEE providers via API', async function() {
      const response = await request(app)
        .get('/api/multi-cloud-tee/providers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.providers).to.be.an('object');
      expect(response.body.data.totalProviders).to.be.a('number');
      expect(response.body.data.localModeEnabled).to.be.a('boolean');
    });

    it('should require CCRP role for providers endpoint', async function() {
      // Create TDC user to test role restriction
      const tdcUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'tdc-test@example.com',
          password: 'TestPassword123!',
          partyType: 'TDC'
        });

      const tdcToken = tdcUserResponse.body.data.token;

      const response = await request(app)
        .get('/api/multi-cloud-tee/providers')
        .set('Authorization', `Bearer ${tdcToken}`);

      expect(response.status).to.equal(403);
    });
  });

  describe('POST /api/multi-cloud-tee/provision', function() {
    let environmentId;

    it('should provision TEE environment via API', async function() {
      const response = await request(app)
        .post('/api/multi-cloud-tee/provision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'local',
          contractId: testContractId,
          region: 'us-east-1',
          instanceType: 'm5.large',
          resources: {
            cpuCores: 2,
            memoryGB: 8,
            storageGB: 100
          },
          security: {
            attestationRequired: true,
            networkIsolation: true
          }
        });

      expect(response.status).to.equal(201);
      expect(response.body.success).to.be.true;
      expect(response.body.data.environmentId).to.be.a('string');
      expect(response.body.data.provider).to.exist;
      expect(response.body.data.status).to.equal('PROVISIONING');
      expect(response.body.data.provenanceSessionId).to.exist;

      environmentId = response.body.data.environmentId;
    });

    it('should validate required fields for provisioning', async function() {
      const response = await request(app)
        .post('/api/multi-cloud-tee/provision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'aws'
          // Missing contractId
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
    });

    it('should reject invalid provider', async function() {
      const response = await request(app)
        .post('/api/multi-cloud-tee/provision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'invalid_provider',
          contractId: testContractId
        });

      expect(response.status).to.equal(400);
      expect(response.body.success).to.be.false;
    });
  });

  describe('POST /api/multi-cloud-tee/cost-estimate', function() {
    it('should calculate cost estimation via API', async function() {
      const response = await request(app)
        .post('/api/multi-cloud-tee/cost-estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'aws',
          instanceType: 'm5.large',
          region: 'us-east-1',
          resources: {
            cpuCores: 2,
            memoryGB: 8,
            storageGB: 100
          }
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.provider).to.equal('aws');
      expect(response.body.data.hourlyCost).to.be.a('number');
      expect(response.body.data.dailyCost).to.be.a('number');
      expect(response.body.data.monthlyCost).to.be.a('number');
      expect(response.body.data.currency).to.equal('USD');
    });

    it('should validate provider for cost estimation', async function() {
      const response = await request(app)
        .post('/api/multi-cloud-tee/cost-estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'invalid_provider'
        });

      expect(response.status).to.equal(400);
    });
  });

  describe('GET /api/multi-cloud-tee/environments', function() {
    it('should list user environments via API', async function() {
      const response = await request(app)
        .get('/api/multi-cloud-tee/environments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.environments).to.be.an('array');
      expect(response.body.data.pagination).to.exist;
    });

    it('should support filtering by provider', async function() {
      const response = await request(app)
        .get('/api/multi-cloud-tee/environments?provider=aws')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      
      const environments = response.body.data.environments;
      environments.forEach(env => {
        expect(env.provider).to.equal('aws');
      });
    });

    it('should support pagination', async function() {
      const response = await request(app)
        .get('/api/multi-cloud-tee/environments?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.pagination.limit).to.equal(5);
      expect(response.body.data.pagination.offset).to.equal(0);
    });
  });

  describe('GET /api/multi-cloud-tee/environments/:environmentId', function() {
    let testEnvironmentId;

    before(async function() {
      // Create test environment for retrieval tests
      const provisionResponse = await request(app)
        .post('/api/multi-cloud-tee/provision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'local',
          contractId: testContractId
        });

      testEnvironmentId = provisionResponse.body.data.environmentId;
    });

    it('should get environment status via API', async function() {
      const response = await request(app)
        .get(`/api/multi-cloud-tee/environments/${testEnvironmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.id).to.equal(testEnvironmentId);
    });

    it('should handle non-existent environment', async function() {
      const response = await request(app)
        .get('/api/multi-cloud-tee/environments/non_existent_env')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('POST /api/multi-cloud-tee/environments/:environmentId/verify-attestation', function() {
    let testEnvironmentId;

    before(async function() {
      // Create and wait for environment to be active
      const provisionResponse = await request(app)
        .post('/api/multi-cloud-tee/provision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'local',
          contractId: testContractId
        });

      testEnvironmentId = provisionResponse.body.data.environmentId;

      // Wait for environment to be active
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it('should verify TEE attestation via API', async function() {
      const response = await request(app)
        .post(`/api/multi-cloud-tee/environments/${testEnvironmentId}/verify-attestation`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.attestation.verified).to.be.a('boolean');
      expect(response.body.data.attestation.attestationLevel).to.exist;
    });
  });

  describe('DELETE /api/multi-cloud-tee/environments/:environmentId', function() {
    let testEnvironmentId;

    before(async function() {
      // Create environment for termination test
      const provisionResponse = await request(app)
        .post('/api/multi-cloud-tee/provision')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'local',
          contractId: testContractId
        });

      testEnvironmentId = provisionResponse.body.data.environmentId;
    });

    it('should terminate TEE environment via API', async function() {
      const response = await request(app)
        .delete(`/api/multi-cloud-tee/environments/${testEnvironmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'API test termination'
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.environmentId).to.equal(testEnvironmentId);
      expect(response.body.data.terminationResult).to.exist;
      expect(response.body.data.provenanceSessionId).to.exist;
    });
  });

  describe('GET /api/multi-cloud-tee/stats', function() {
    it('should get multi-cloud TEE statistics via API', async function() {
      const response = await request(app)
        .get('/api/multi-cloud-tee/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.totalEnvironments).to.be.a('number');
      expect(response.body.data.byProvider).to.be.an('object');
      expect(response.body.data.byStatus).to.be.an('object');
      expect(response.body.data.totalCost).to.be.a('number');
      expect(response.body.data.availableProviders).to.be.a('number');
    });
  });
});

console.log('🌐 Multi-Cloud TEE Provisioning test suite loaded');
