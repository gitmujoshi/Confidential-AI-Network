#!/usr/bin/env node

/**
 * ContractFlow Pro - Complete API Testing Suite
 * Tests all endpoints, authentication, and functionality
 * Now includes SCITT CCF integration testing
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Test data
let testData = {
  tokens: {},
  users: {},
  contracts: {},
  datasets: {},
  environments: {},
  scittCcf: {} // Add SCITT CCF test data
};

/**
 * Test Utilities
 */
class TestUtils {
  static log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    switch (type) {
      case 'success':
        console.log(`✅ ${timestamp} - ${message}`.green);
        break;
      case 'error':
        console.log(`❌ ${timestamp} - ${message}`.red);
        break;
      case 'warning':
        console.log(`⚠️  ${timestamp} - ${message}`.yellow);
        break;
      case 'info':
        console.log(`ℹ️  ${timestamp} - ${message}`.blue);
        break;
      default:
        console.log(`${timestamp} - ${message}`);
    }
  }

  static async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  static assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  static async runTest(testName, testFunction) {
    testResults.total++;
    try {
      await testFunction();
      testResults.passed++;
      TestUtils.log(`PASS: ${testName}`, 'success');
      return true;
    } catch (error) {
      testResults.failed++;
      testResults.errors.push({ test: testName, error: error.message });
      TestUtils.log(`FAIL: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }
}

/**
 * Authentication Tests
 */
class AuthenticationTests {
  static async testUserRegistration() {
    const userData = {
      name: `Test User ${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: 'TestPassword123!',
      partyType: 'TDC',
      organization: 'Test Organization'
    };

    const response = await TestUtils.makeRequest('POST', '/auth/register', userData);
    TestUtils.assert(response.success, 'User registration failed');
    TestUtils.assert(response.data.success, 'Registration response indicates failure');
    
    testData.users.tdc = response.data.user;
    return response.data;
  }

  static async testUserLogin() {
    const loginData = {
      email: testData.users.tdc.email,
      password: 'TestPassword123!'
    };

    const response = await TestUtils.makeRequest('POST', '/auth/login', loginData);
    TestUtils.assert(response.success, 'User login failed');
    TestUtils.assert(response.data.success, 'Login response indicates failure');
    TestUtils.assert(response.data.token, 'No token received');
    
    testData.tokens.tdc = response.data.token;
    return response.data;
  }

  static async testProfileAccess() {
    const response = await TestUtils.makeRequest('GET', '/auth/profile', null, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'Profile access failed');
    TestUtils.assert(response.data.id, 'Profile data incomplete');
    return response.data;
  }

  static async testInvalidToken() {
    const response = await TestUtils.makeRequest('GET', '/auth/profile', null, {
      'Authorization': 'Bearer invalid_token'
    });
    
    TestUtils.assert(!response.success, 'Invalid token should fail');
    TestUtils.assert(response.status === 401, 'Should return 401 for invalid token');
    return response;
  }
}

/**
 * Contract Management Tests
 */
class ContractTests {
  static async testContractPreview() {
    const contractData = {
      datasetSelections: [
        {
          datasetId: 'DS-001',
          individualPrice: 1000
        }
      ],
      duration: 30,
      termsAndConditions: 'Test terms and conditions',
      contractType: 'AI_TRAINING'
    };

    const response = await TestUtils.makeRequest('POST', '/contracts/ricardian/multi-tdp-preview-test', contractData);
    TestUtils.assert(response.success, 'Contract preview failed');
    TestUtils.assert(response.data.legalDocument, 'No legal document generated');
    return response.data;
  }

  static async testRicardianContractCreation() {
    const contractData = {
      datasetSelections: [
        {
          datasetId: 'DS-001',
          individualPrice: 1000
        }
      ],
      duration: 30,
      termsAndConditions: 'Test terms and conditions',
      contractType: 'AI_TRAINING',
      tspId: 1,
      privacyRequirements: {
        maxPrivacyLoss: 0.1,
        minAccuracy: 0.85,
        differentialPrivacy: true
      },
      trainingEnvironment: {
        computeType: 'confidential-vm',
        memoryGB: 32,
        cpuCores: 8
      }
    };

    const response = await TestUtils.makeRequest('POST', '/contracts/ricardian', contractData, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'Contract creation failed');
    TestUtils.assert(response.data.success, 'Contract creation response indicates failure');
    TestUtils.assert(response.data.contract, 'No contract data returned');
    
    testData.contracts.ricardian = response.data.contract;
    return response.data;
  }

  static async testGetContract() {
    const contractId = testData.contracts.ricardian.id;
    const response = await TestUtils.makeRequest('GET', `/contracts/${contractId}`, null, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'Get contract failed');
    TestUtils.assert(response.data.id === contractId, 'Contract ID mismatch');
    return response.data;
  }

  static async testListContracts() {
    const response = await TestUtils.makeRequest('GET', '/contracts', null, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'List contracts failed');
    TestUtils.assert(Array.isArray(response.data.contracts), 'Contracts should be an array');
    return response.data;
  }
}

/**
 * Dataset Management Tests
 */
class DatasetTests {
  static async testGetPublicDatasets() {
    const response = await TestUtils.makeRequest('GET', '/datasets/public');
    TestUtils.assert(response.success, 'Get public datasets failed');
    TestUtils.assert(Array.isArray(response.data.datasets), 'Datasets should be an array');
    return response.data;
  }

  static async testDatasetSearch() {
    const response = await TestUtils.makeRequest('GET', '/datasets/search?q=customer&category=CUSTOMER_DATA');
    TestUtils.assert(response.success, 'Dataset search failed');
    TestUtils.assert(response.data.datasets, 'Search results should exist');
    return response.data;
  }
}

/**
 * Infrastructure Tests
 */
class InfrastructureTests {
  static async testGetCloudProviders() {
    const response = await TestUtils.makeRequest('GET', '/infrastructure/cloud-providers', null, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'Get cloud providers failed');
    TestUtils.assert(Array.isArray(response.data.providers), 'Providers should be an array');
    return response.data;
  }

  static async testCostEstimation() {
    const estimationData = {
      cloudProvider: 'AZURE',
      region: 'eastus',
      duration: 30,
      resources: {
        compute: {
          vmSize: 'Standard_D2s_v3',
          vmCount: 2
        },
        storage: {
          type: 'Premium_LRS',
          sizeGB: 100
        }
      }
    };

    const response = await TestUtils.makeRequest('POST', '/infrastructure/cost-estimation', estimationData, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'Cost estimation failed');
    TestUtils.assert(response.data.estimation, 'No estimation data returned');
    return response.data;
  }
}

/**
 * SCITT CCF Integration Tests
 */
class ScittCcfTests {
  static async testScittCcfHealth() {
    const response = await TestUtils.makeRequest('GET', '/scitt-ccf/health');
    TestUtils.assert(response.success, 'SCITT CCF health check failed');
    TestUtils.assert(response.data.status === 'healthy', 'SCITT CCF should be healthy');
    TestUtils.assert(response.data.scittCcf, 'SCITT CCF health data missing');
    return response.data;
  }

  static async testScittCcfMetrics() {
    const response = await TestUtils.makeRequest('GET', '/scitt-ccf/metrics');
    TestUtils.assert(response.success, 'SCITT CCF metrics failed');
    TestUtils.assert(response.data.totalClaims !== undefined, 'Total claims should be available');
    TestUtils.assert(response.data.activeContracts !== undefined, 'Active contracts should be available');
    return response.data;
  }

  static async testScittCcfContractCreation() {
    const contractData = {
      name: 'SCITT CCF Test Contract',
      description: 'Test contract for SCITT CCF integration',
      tdpId: testData.users.tdp?.id || 1,
      tdcId: testData.users.tdc?.id || 2,
      datasetId: testData.datasets.public?.[0]?.id || 1,
      price: 1000,
      duration: 30,
      terms: 'Test terms and conditions for SCITT CCF'
    };

    const response = await TestUtils.makeRequest('POST', '/scitt-ccf/contracts', contractData, {
      'Authorization': `Bearer ${testData.tokens.tdc || testData.tokens.admin}`
    });
    
    TestUtils.assert(response.success, 'SCITT CCF contract creation failed');
    TestUtils.assert(response.data.success, 'SCITT CCF contract response indicates failure');
    TestUtils.assert(response.data.source === 'SCITT_CCF', 'Contract should be created in SCITT CCF');
    
    testData.scittCcf.contract = response.data;
    return response.data;
  }

  static async testScittCcfContractStatus() {
    if (!testData.scittCcf.contract?.claimId) {
      throw new Error('No SCITT CCF contract available for status test');
    }

    const claimId = testData.scittCcf.contract.claimId;
    const response = await TestUtils.makeRequest('GET', `/scitt-ccf/contracts/${claimId}/status`);
    
    TestUtils.assert(response.success, 'SCITT CCF contract status failed');
    TestUtils.assert(response.data.claimId === claimId, 'Claim ID mismatch');
    TestUtils.assert(response.data.status, 'Status should be available');
    return response.data;
  }

  static async testScittCcfConfiguration() {
    const response = await TestUtils.makeRequest('GET', '/scitt-ccf/configuration');
    TestUtils.assert(response.success, 'SCITT CCF configuration failed');
    TestUtils.assert(response.data.migrationMode, 'Migration mode should be available');
    TestUtils.assert(['ETHEREUM_ONLY', 'SCITT_CCF_ONLY', 'HYBRID'].includes(response.data.migrationMode), 
      'Invalid migration mode');
    return response.data;
  }
}

/**
 * Dashboard Tests
 */
class DashboardTests {
  static async testTDCDashboard() {
    const userId = testData.users.tdc.id;
    const response = await TestUtils.makeRequest('GET', `/tdc/dashboard/${userId}`, null, {
      'Authorization': `Bearer ${testData.tokens.tdc}`
    });
    
    TestUtils.assert(response.success, 'TDC dashboard failed');
    TestUtils.assert(response.data.user, 'User data missing');
    return response.data;
  }
}

/**
 * Health and System Tests
 */
class SystemTests {
  static async testHealthCheck() {
    const response = await TestUtils.makeRequest('GET', '/health');
    TestUtils.assert(response.success, 'Health check failed');
    TestUtils.assert(response.data.status === 'healthy', 'System should be healthy');
    return response.data;
  }

  static async testAPIStatus() {
    const response = await TestUtils.makeRequest('GET', '/api/status');
    TestUtils.assert(response.success, 'API status check failed');
    return response.data;
  }
}

/**
 * Main Test Runner
 */
class APITestSuite {
  static async runAllTests() {
    TestUtils.log('🚀 Starting ContractFlow Pro API Test Suite', 'info');
    TestUtils.log(`📍 Testing API at: ${API_BASE}`, 'info');
    
    const startTime = Date.now();

    try {
      // System Health Tests
      await TestUtils.runTest('Health Check', () => SystemTests.testHealthCheck());
      
      // Authentication Tests
      await TestUtils.runTest('User Registration', () => AuthenticationTests.testUserRegistration());
      await TestUtils.runTest('User Login', () => AuthenticationTests.testUserLogin());
      await TestUtils.runTest('Profile Access', () => AuthenticationTests.testProfileAccess());
      await TestUtils.runTest('Invalid Token Rejection', () => AuthenticationTests.testInvalidToken());
      
      // Contract Tests
      await TestUtils.runTest('Contract Preview', () => ContractTests.testContractPreview());
      await TestUtils.runTest('Ricardian Contract Creation', () => ContractTests.testRicardianContractCreation());
      await TestUtils.runTest('Get Contract', () => ContractTests.testGetContract());
      await TestUtils.runTest('List Contracts', () => ContractTests.testListContracts());
      
      // Dataset Tests
      await TestUtils.runTest('Get Public Datasets', () => DatasetTests.testGetPublicDatasets());
      await TestUtils.runTest('Dataset Search', () => DatasetTests.testDatasetSearch());
      
      // Infrastructure Tests
      await TestUtils.runTest('Get Cloud Providers', () => InfrastructureTests.testGetCloudProviders());
      await TestUtils.runTest('Cost Estimation', () => InfrastructureTests.testCostEstimation());
      
      // SCITT CCF Tests
      await TestUtils.runTest('SCITT CCF Health Check', () => ScittCcfTests.testScittCcfHealth());
      await TestUtils.runTest('SCITT CCF Metrics', () => ScittCcfTests.testScittCcfMetrics());
      await TestUtils.runTest('SCITT CCF Contract Creation', () => ScittCcfTests.testScittCcfContractCreation());
      await TestUtils.runTest('SCITT CCF Contract Status', () => ScittCcfTests.testScittCcfContractStatus());
      await TestUtils.runTest('SCITT CCF Configuration', () => ScittCcfTests.testScittCcfConfiguration());
      
      // Dashboard Tests
      await TestUtils.runTest('TDC Dashboard', () => DashboardTests.testTDCDashboard());
      
    } catch (error) {
      TestUtils.log(`Critical error in test suite: ${error.message}`, 'error');
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Print Results
    this.printResults(duration);
  }

  static printResults(duration) {
    console.log('\n' + '='.repeat(60));
    TestUtils.log('📊 API Test Suite Results', 'info');
    console.log('='.repeat(60));
    
    TestUtils.log(`Total Tests: ${testResults.total}`, 'info');
    TestUtils.log(`Passed: ${testResults.passed}`, 'success');
    TestUtils.log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    TestUtils.log(`Duration: ${duration.toFixed(2)} seconds`, 'info');
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(error => {
        TestUtils.log(`  - ${error.test}: ${error.error}`, 'error');
      });
    }
    
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    TestUtils.log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
    
    if (testResults.failed === 0) {
      TestUtils.log('🎉 All tests passed! API is working correctly.', 'success');
    } else {
      TestUtils.log('⚠️  Some tests failed. Please check the errors above.', 'warning');
    }
    
    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  APITestSuite.runAllTests().catch(error => {
    TestUtils.log(`Test suite execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  APITestSuite,
  TestUtils,
  AuthenticationTests,
  ContractTests,
  DatasetTests,
  InfrastructureTests,
  DashboardTests,
  SystemTests,
  ScittCcfTests
}; 