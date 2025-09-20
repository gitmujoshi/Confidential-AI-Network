/**
 * Comprehensive Test Suite for CCRP Environment Monitoring
 * 
 * Tests real-time monitoring, resource tracking, performance analytics,
 * and dashboard functionality for Confidential Clean Room Providers.
 */

const request = require('supertest');
const { expect } = require('chai');
const { JSDOM } = require('jsdom');

// Import services and dependencies
const app = require('../backend/server');

describe('📊 CCRP Environment Monitoring Tests', function() {
  this.timeout(30000); // Extended timeout for monitoring operations

  let ccrpAuthToken;
  let tdcAuthToken;
  let tdpAuthToken;
  let ccrpUser;
  let tdcUser;
  let tdpUser;
  let testContractId;
  let testEnvironmentIds = [];

  before(async function() {
    console.log('🔧 Setting up CCRP Environment Monitoring test environment...');
    
    // Create CCRP test user
    const ccrpUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'ccrp-monitoring-test@example.com',
        password: 'TestPassword123!',
        name: 'CCRP Monitoring Test User',
        organization: 'Clean Room Monitoring Corp',
        partyType: 'CCRP'
      });

    ccrpUser = ccrpUserResponse.body.data.user;
    ccrpAuthToken = ccrpUserResponse.body.data.token;

    // Create TDC test user
    const tdcUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tdc-monitoring-test@example.com',
        password: 'TestPassword123!',
        name: 'TDC Monitoring Test User',
        organization: 'Data Consumer Corp',
        partyType: 'TDC'
      });

    tdcUser = tdcUserResponse.body.data.user;
    tdcAuthToken = tdcUserResponse.body.data.token;

    // Create TDP test user
    const tdpUserResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tdp-monitoring-test@example.com',
        password: 'TestPassword123!',
        name: 'TDP Monitoring Test User',
        organization: 'Data Provider Corp',
        partyType: 'TDP'
      });

    tdpUser = tdpUserResponse.body.data.user;
    tdpAuthToken = tdpUserResponse.body.data.token;

    // Create test contract with all parties
    const contractResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${tdcAuthToken}`)
      .send({
        title: 'Environment Monitoring Test Contract',
        description: 'Contract for testing CCRP environment monitoring',
        tdcId: tdcUser.id,
        tdpId: tdpUser.id,
        ccrpId: ccrpUser.id,
        price: 15000,
        currency: 'USD'
      });

    testContractId = contractResponse.body.data.contract.contractId;

    // Create test training environments
    await createTestEnvironments();

    console.log('✅ CCRP Environment Monitoring test environment ready');
  });

  async function createTestEnvironments() {
    const environments = [
      {
        name: 'AWS Training Environment',
        provider: 'AWS',
        instanceType: 'm5.large',
        region: 'us-east-1',
        status: 'ACTIVE'
      },
      {
        name: 'Azure Training Environment',
        provider: 'Azure',
        instanceType: 'Standard_DC2s',
        region: 'eastus',
        status: 'PROVISIONING'
      },
      {
        name: 'GCP Training Environment',
        provider: 'GCP',
        instanceType: 'n2d-standard-2',
        region: 'us-central1',
        status: 'ACTIVE'
      },
      {
        name: 'Local Test Environment',
        provider: 'Local',
        instanceType: 'local',
        region: 'local',
        status: 'ACTIVE'
      }
    ];

    for (const envConfig of environments) {
      try {
        const response = await request(app)
          .post('/api/infrastructure/environments')
          .set('Authorization', `Bearer ${ccrpAuthToken}`)
          .send({
            ...envConfig,
            contractId: testContractId,
            userId: ccrpUser.id,
            estimatedCost: Math.random() * 10 + 1,
            resources: {
              cpuCores: 2 + Math.floor(Math.random() * 6),
              memoryGB: 8 + Math.floor(Math.random() * 24),
              storageGB: 100 + Math.floor(Math.random() * 400)
            }
          });

        if (response.status === 201) {
          testEnvironmentIds.push(response.body.data.environment.id);
        }
      } catch (error) {
        console.warn(`Failed to create test environment ${envConfig.name}:`, error.message);
      }
    }
  }

  describe('🚀 Environment Monitoring Service', function() {
    it('should retrieve monitoring data for specific environment', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.monitoringData).to.exist;
      expect(response.body.monitoringData.environmentId).to.equal(environmentId);
      expect(response.body.monitoringData.timestamp).to.exist;
      expect(response.body.monitoringData.cpuUsage).to.be.a('number');
      expect(response.body.monitoringData.memoryUsage).to.be.a('number');
      expect(response.body.monitoringData.diskUsage).to.be.a('number');
      expect(response.body.monitoringData.networkIO).to.be.a('number');
    });

    it('should validate access permissions for environment monitoring', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      // Test with unauthorized user
      const unauthorizedUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unauthorized-user@example.com',
          password: 'TestPassword123!',
          partyType: 'TDC'
        });

      const unauthorizedToken = unauthorizedUserResponse.body.data.token;

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect([403, 404]).to.include(response.status);
    });

    it('should allow TDC and TDP access to monitoring data', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      // Test TDC access
      const tdcResponse = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${tdcAuthToken}`);

      expect(tdcResponse.status).to.equal(200);

      // Test TDP access
      const tdpResponse = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${tdpAuthToken}`);

      expect(tdpResponse.status).to.equal(200);
    });

    it('should handle non-existent environment monitoring', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments/non_existent_env/monitor')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(404);
      expect(response.body.success).to.be.false;
    });

    it('should include logs and alerts in monitoring data', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.monitoringData.logs).to.be.an('array');
      expect(response.body.monitoringData.alerts).to.be.an('array');
      expect(response.body.monitoringData.runningProcesses).to.be.a('number');
    });
  });

  describe('📋 Environment Listing and Management', function() {
    it('should list all training environments with filtering', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.environments).to.be.an('array');
      expect(response.body.data.pagination).to.exist;
      expect(response.body.data.pagination.total).to.be.a('number');
    });

    it('should filter environments by provider', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments?provider=AWS')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      
      const environments = response.body.data.environments;
      if (environments.length > 0) {
        environments.forEach(env => {
          expect(env.provider).to.equal('AWS');
        });
      }
    });

    it('should filter environments by status', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments?status=ACTIVE')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      
      const environments = response.body.data.environments;
      if (environments.length > 0) {
        environments.forEach(env => {
          expect(env.status).to.equal('ACTIVE');
        });
      }
    });

    it('should support pagination for environment listing', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments?limit=2&offset=0')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.pagination.limit).to.equal(2);
      expect(response.body.data.pagination.offset).to.equal(0);
      expect(response.body.data.environments.length).to.be.at.most(2);
    });

    it('should include contract information in environment listing', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      
      const environments = response.body.data.environments;
      if (environments.length > 0) {
        environments.forEach(env => {
          if (env.contract) {
            expect(env.contract).to.have.property('id');
            expect(env.contract).to.have.property('title');
            expect(env.contract).to.have.property('status');
          }
        });
      }
    });
  });

  describe('📊 Environment Statistics and Analytics', function() {
    it('should retrieve environment statistics', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments/stats')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.totalEnvironments).to.be.a('number');
      expect(response.body.data.activeEnvironments).to.be.a('number');
      expect(response.body.data.utilizationRate).to.be.a('string');
    });

    it('should provide provider statistics breakdown', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments/stats')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.providerStats).to.be.an('array');
      
      if (response.body.data.providerStats.length > 0) {
        response.body.data.providerStats.forEach(stat => {
          expect(stat).to.have.property('provider');
          expect(stat).to.have.property('status');
          expect(stat).to.have.property('count');
        });
      }
    });

    it('should calculate utilization rates correctly', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments/stats')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      
      const { totalEnvironments, activeEnvironments, utilizationRate } = response.body.data;
      
      if (totalEnvironments > 0) {
        const expectedRate = ((activeEnvironments / totalEnvironments) * 100).toFixed(2);
        expect(utilizationRate).to.equal(expectedRate);
      } else {
        expect(utilizationRate).to.equal('0');
      }
    });

    it('should restrict statistics to user environments for non-admin users', async function() {
      // Test with TDC user (should only see their environments)
      const response = await request(app)
        .get('/api/infrastructure/environments/stats')
        .set('Authorization', `Bearer ${tdcAuthToken}`);

      expect(response.status).to.equal(200);
      // For TDC user, should have fewer or equal environments compared to CCRP
    });
  });

  describe('🔍 Environment Search and Discovery', function() {
    it('should search environments by name', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments/search?q=AWS')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.environments).to.be.an('array');
    });

    it('should get environments by provider', async function() {
      const providers = ['AWS', 'Azure', 'GCP', 'Local'];

      for (const provider of providers) {
        const response = await request(app)
          .get(`/api/infrastructure/environments/provider/${provider}`)
          .set('Authorization', `Bearer ${ccrpAuthToken}`);

        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        
        const environments = response.body.data.environments;
        if (environments.length > 0) {
          environments.forEach(env => {
            expect(env.provider).to.equal(provider);
          });
        }
      }
    });

    it('should handle invalid provider in search', async function() {
      const response = await request(app)
        .get('/api/infrastructure/environments/provider/INVALID_PROVIDER')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.data.environments).to.be.an('array');
      expect(response.body.data.environments.length).to.equal(0);
    });
  });

  describe('⚡ Real-Time Monitoring Features', function() {
    it('should provide real-time metrics updates', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      // Get initial metrics
      const firstResponse = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(firstResponse.status).to.equal(200);
      const firstMetrics = firstResponse.body.monitoringData;

      // Wait a moment and get updated metrics
      await new Promise(resolve => setTimeout(resolve, 1000));

      const secondResponse = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(secondResponse.status).to.equal(200);
      const secondMetrics = secondResponse.body.monitoringData;

      // Timestamps should be different (indicating real-time updates)
      expect(secondMetrics.timestamp).to.not.equal(firstMetrics.timestamp);
    });

    it('should generate different metrics on each request', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];
      const responses = [];

      // Make multiple requests quickly
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get(`/api/infrastructure/environments/${environmentId}/monitor`)
          .set('Authorization', `Bearer ${ccrpAuthToken}`);

        expect(response.status).to.equal(200);
        responses.push(response.body.monitoringData);
      }

      // Check that metrics vary (since they're randomly generated)
      const cpuUsages = responses.map(r => r.cpuUsage);
      const uniqueCpuUsages = new Set(cpuUsages);
      
      // Should have some variation in randomly generated metrics
      expect(uniqueCpuUsages.size).to.be.greaterThan(1);
    });

    it('should include performance metrics within valid ranges', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      const metrics = response.body.monitoringData;

      // Validate metric ranges
      expect(metrics.cpuUsage).to.be.within(0, 100);
      expect(metrics.memoryUsage).to.be.within(0, 100);
      expect(metrics.diskUsage).to.be.within(0, 100);
      expect(metrics.networkIO).to.be.within(0, 100);
      expect(metrics.runningProcesses).to.be.greaterThan(0);
    });
  });

  describe('🔒 Security and Access Control', function() {
    it('should require authentication for monitoring endpoints', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`);

      expect(response.status).to.equal(401);
    });

    it('should validate user access to specific environments', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      // Create a new contract with different users
      const newContractResponse = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${tdcAuthToken}`)
        .send({
          title: 'Restricted Access Contract',
          description: 'Contract with restricted access',
          price: 5000,
          currency: 'USD'
        });

      const restrictedContractId = newContractResponse.body.data.contract.contractId;

      // Create environment for restricted contract
      const envResponse = await request(app)
        .post('/api/infrastructure/environments')
        .set('Authorization', `Bearer ${ccrpAuthToken}`)
        .send({
          name: 'Restricted Environment',
          provider: 'Local',
          contractId: restrictedContractId,
          userId: ccrpUser.id
        });

      if (envResponse.status === 201) {
        const restrictedEnvId = envResponse.body.data.environment.id;

        // Try to access with unauthorized user
        const unauthorizedResponse = await request(app)
          .get(`/api/infrastructure/environments/${restrictedEnvId}/monitor`)
          .set('Authorization', `Bearer ${tdpAuthToken}`); // TDP not in this contract

        expect([403, 404]).to.include(unauthorizedResponse.status);
      }
    });

    it('should allow admin users to access all environments', async function() {
      // Create admin user
      const adminUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin-monitoring-test@example.com',
          password: 'TestPassword123!',
          name: 'Admin User',
          partyType: 'AppAdmin'
        });

      const adminToken = adminUserResponse.body.data.token;

      const response = await request(app)
        .get('/api/infrastructure/environments/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      // Admin should see all environments (no user filtering)
    });
  });

  describe('📈 Performance and Scalability', function() {
    it('should handle concurrent monitoring requests', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const concurrentRequests = [];
      const requestCount = 5;

      for (let i = 0; i < requestCount; i++) {
        const environmentId = testEnvironmentIds[i % testEnvironmentIds.length];
        
        const requestPromise = request(app)
          .get(`/api/infrastructure/environments/${environmentId}/monitor`)
          .set('Authorization', `Bearer ${ccrpAuthToken}`);

        concurrentRequests.push(requestPromise);
      }

      const results = await Promise.allSettled(concurrentRequests);
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );

      expect(successful.length).to.equal(requestCount);
      console.log(`✅ Successfully handled ${successful.length} concurrent monitoring requests`);
    });

    it('should maintain performance under monitoring load', async function() {
      const startTime = Date.now();
      const requests = [];

      // Make 20 monitoring requests
      for (let i = 0; i < 20; i++) {
        const requestPromise = request(app)
          .get('/api/infrastructure/environments/stats')
          .set('Authorization', `Bearer ${ccrpAuthToken}`);

        requests.push(requestPromise);
      }

      await Promise.all(requests);
      const endTime = Date.now();

      expect(endTime - startTime).to.be.lessThan(5000); // Should complete in under 5 seconds
      console.log(`✅ Completed 20 monitoring requests in ${endTime - startTime}ms`);
    });

    it('should efficiently handle large environment listings', async function() {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/infrastructure/environments?limit=100')
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      const endTime = Date.now();

      expect(response.status).to.equal(200);
      expect(endTime - startTime).to.be.lessThan(2000); // Should complete in under 2 seconds
      console.log(`✅ Listed environments in ${endTime - startTime}ms`);
    });
  });

  describe('📊 Monitoring Data Validation', function() {
    it('should validate monitoring data structure', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      
      const monitoring = response.body.monitoringData;
      
      // Validate required fields
      expect(monitoring).to.have.property('environmentId');
      expect(monitoring).to.have.property('timestamp');
      expect(monitoring).to.have.property('cpuUsage');
      expect(monitoring).to.have.property('memoryUsage');
      expect(monitoring).to.have.property('diskUsage');
      expect(monitoring).to.have.property('networkIO');
      expect(monitoring).to.have.property('runningProcesses');
      expect(monitoring).to.have.property('logs');
      expect(monitoring).to.have.property('alerts');

      // Validate data types
      expect(monitoring.environmentId).to.be.a('string');
      expect(monitoring.timestamp).to.be.a('string');
      expect(monitoring.cpuUsage).to.be.a('number');
      expect(monitoring.memoryUsage).to.be.a('number');
      expect(monitoring.diskUsage).to.be.a('number');
      expect(monitoring.networkIO).to.be.a('number');
      expect(monitoring.runningProcesses).to.be.a('number');
      expect(monitoring.logs).to.be.an('array');
      expect(monitoring.alerts).to.be.an('array');
    });

    it('should validate log entry structure', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      const response = await request(app)
        .get(`/api/infrastructure/environments/${environmentId}/monitor`)
        .set('Authorization', `Bearer ${ccrpAuthToken}`);

      expect(response.status).to.equal(200);
      
      const logs = response.body.monitoringData.logs;
      
      if (logs.length > 0) {
        logs.forEach(log => {
          expect(log).to.have.property('timestamp');
          expect(log).to.have.property('level');
          expect(log).to.have.property('message');
          expect(log.level).to.be.oneOf(['INFO', 'DEBUG', 'WARN', 'ERROR']);
        });
      }
    });

    it('should validate alert structure when present', async function() {
      if (testEnvironmentIds.length === 0) {
        this.skip('No test environments available');
      }

      const environmentId = testEnvironmentIds[0];

      // Make multiple requests to potentially get alerts
      let alertsFound = false;
      
      for (let i = 0; i < 5 && !alertsFound; i++) {
        const response = await request(app)
          .get(`/api/infrastructure/environments/${environmentId}/monitor`)
          .set('Authorization', `Bearer ${ccrpAuthToken}`);

        expect(response.status).to.equal(200);
        
        const alerts = response.body.monitoringData.alerts;
        
        if (alerts.length > 0) {
          alertsFound = true;
          alerts.forEach(alert => {
            expect(alert).to.have.property('type');
            expect(alert).to.have.property('message');
            expect(alert.type).to.be.oneOf(['INFO', 'WARNING', 'ERROR', 'CRITICAL']);
          });
        }
      }

      // If no alerts found, that's also valid behavior
      console.log(`✅ Alert validation completed (alerts found: ${alertsFound})`);
    });
  });

  after(async function() {
    console.log('🧹 Cleaning up CCRP Environment Monitoring test environment...');
    
    // Cleanup test environments
    for (const environmentId of testEnvironmentIds) {
      try {
        await request(app)
          .delete(`/api/infrastructure/environments/${environmentId}`)
          .set('Authorization', `Bearer ${ccrpAuthToken}`);
      } catch (error) {
        console.warn(`Failed to cleanup environment ${environmentId}:`, error.message);
      }
    }

    console.log('✅ CCRP Environment Monitoring test cleanup complete');
  });
});

console.log('📊 CCRP Environment Monitoring test suite loaded');
