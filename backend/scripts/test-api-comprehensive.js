#!/usr/bin/env node

/**
 * ContractFlow Pro - Comprehensive API Test Runner
 * Tests all API endpoints systematically and provides detailed reporting
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:5001',
  apiBase: process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api` : 'http://localhost:5001/api',
  timeout: 30000,
  testUsers: {
    tdc: { email: 'tdc@test.com', password: 'TestPassword123!' },
    tdp: { email: 'tdp@test.com', password: 'TestPassword123!' },
    ccrp: { email: 'ccrp@test.com', password: 'TestPassword123!' },
    admin: { email: 'admin@test.com', password: 'TestPassword123!' }
  },
  outputDir: './test-results'
};

// Test results storage
let testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: null,
    endTime: null,
    duration: 0
  },
  tests: [],
  errors: [],
  performance: {
    averageResponseTime: 0,
    slowestEndpoint: null,
    fastestEndpoint: null
  }
};

// Test data storage
let testData = {
  tokens: {},
  users: {},
  contracts: {},
  datasets: {},
  environments: {}
};

/**
 * Test Utilities
 */
class TestUtils {
  static log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      info: '\x1b[36m',    // Cyan
      reset: '\x1b[0m'     // Reset
    };
    
    const color = colors[type] || colors.reset;
    console.log(`${color}${timestamp} - ${message}${colors.reset}`);
  }

  static async makeRequest(method, endpoint, data = null, headers = {}, timeout = CONFIG.timeout) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${CONFIG.apiBase}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        responseTime,
        headers: response.headers
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 0,
        responseTime,
        headers: error.response?.headers || {}
      };
    }
  }

  static assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  static async runTest(testName, testFunction, category = 'General') {
    const testStartTime = Date.now();
    testResults.summary.total++;
    
    const testResult = {
      name: testName,
      category,
      status: 'pending',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      error: null,
      responseTime: 0,
      details: {}
    };

    try {
      await testFunction();
      testResult.status = 'passed';
      testResults.summary.passed++;
      TestUtils.log(`✅ PASS: ${testName}`, 'success');
    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResults.summary.failed++;
      testResults.errors.push({ test: testName, error: error.message });
      TestUtils.log(`❌ FAIL: ${testName} - ${error.message}`, 'error');
    } finally {
      testResult.endTime = new Date().toISOString();
      testResult.duration = Date.now() - testStartTime;
      testResults.tests.push(testResult);
    }

    return testResult.status === 'passed';
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Authentication Tests
 */
class AuthenticationTests {
  static async testUserRegistration() {
    const userData = {
      name: `Test TDC User ${Date.now()}`,
      email: `tdc${Date.now()}@test.com`,
      password: 'TestPassword123!',
      partyType: 'TDC',
      organization: 'Test TDC Organization'
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
      termsAndConditions: 'Test terms and conditions for preview',
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
      termsAndConditions: 'Test terms and conditions for contract creation',
      contractType: 'AI_TRAINING',
      ccrpId: 1,
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
 * System Tests
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
 * Performance Tests
 */
class PerformanceTests {
  static async testResponseTimes() {
    const endpoints = [
      { method: 'GET', path: '/health', name: 'Health Check' },
      { method: 'GET', path: '/api/status', name: 'API Status' },
      { method: 'GET', path: '/datasets/public', name: 'Public Datasets' }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      const response = await TestUtils.makeRequest(endpoint.method, endpoint.path);
      results.push({
        endpoint: endpoint.name,
        path: endpoint.path,
        responseTime: response.responseTime,
        success: response.success
      });
    }

    // Calculate performance metrics
    const successfulResponses = results.filter(r => r.success);
    if (successfulResponses.length > 0) {
      const avgResponseTime = successfulResponses.reduce((sum, r) => sum + r.responseTime, 0) / successfulResponses.length;
      const slowest = successfulResponses.reduce((max, r) => r.responseTime > max.responseTime ? r : max);
      const fastest = successfulResponses.reduce((min, r) => r.responseTime < min.responseTime ? r : min);

      testResults.performance = {
        averageResponseTime: avgResponseTime,
        slowestEndpoint: slowest,
        fastestEndpoint: fastest
      };
    }

    return results;
  }
}

/**
 * Main Test Runner
 */
class ComprehensiveAPITestRunner {
  static async runAllTests() {
    TestUtils.log('🚀 Starting ContractFlow Pro Comprehensive API Test Suite', 'info');
    TestUtils.log(`📍 Testing API at: ${CONFIG.apiBase}`, 'info');
    
    testResults.summary.startTime = new Date().toISOString();
    const startTime = Date.now();

    try {
      // System Health Tests
      await TestUtils.runTest('Health Check', () => SystemTests.testHealthCheck(), 'System');
      await TestUtils.runTest('API Status', () => SystemTests.testAPIStatus(), 'System');
      
      // Authentication Tests
      await TestUtils.runTest('User Registration', () => AuthenticationTests.testUserRegistration(), 'Authentication');
      await TestUtils.runTest('User Login', () => AuthenticationTests.testUserLogin(), 'Authentication');
      await TestUtils.runTest('Profile Access', () => AuthenticationTests.testProfileAccess(), 'Authentication');
      await TestUtils.runTest('Invalid Token Rejection', () => AuthenticationTests.testInvalidToken(), 'Authentication');
      
      // Contract Tests
      await TestUtils.runTest('Contract Preview', () => ContractTests.testContractPreview(), 'Contracts');
      await TestUtils.runTest('Ricardian Contract Creation', () => ContractTests.testRicardianContractCreation(), 'Contracts');
      await TestUtils.runTest('Get Contract', () => ContractTests.testGetContract(), 'Contracts');
      await TestUtils.runTest('List Contracts', () => ContractTests.testListContracts(), 'Contracts');
      
      // Dataset Tests
      await TestUtils.runTest('Get Public Datasets', () => DatasetTests.testGetPublicDatasets(), 'Datasets');
      await TestUtils.runTest('Dataset Search', () => DatasetTests.testDatasetSearch(), 'Datasets');
      
      // Infrastructure Tests
      await TestUtils.runTest('Get Cloud Providers', () => InfrastructureTests.testGetCloudProviders(), 'Infrastructure');
      await TestUtils.runTest('Cost Estimation', () => InfrastructureTests.testCostEstimation(), 'Infrastructure');
      
      // Dashboard Tests
      await TestUtils.runTest('TDC Dashboard', () => DashboardTests.testTDCDashboard(), 'Dashboards');
      
      // Performance Tests
      await TestUtils.runTest('Response Time Analysis', () => PerformanceTests.testResponseTimes(), 'Performance');
      
    } catch (error) {
      TestUtils.log(`Critical error in test suite: ${error.message}`, 'error');
    }

    const endTime = Date.now();
    testResults.summary.endTime = new Date().toISOString();
    testResults.summary.duration = (endTime - startTime) / 1000;

    // Generate and save results
    await this.generateReport();
    this.printResults();
  }

  static async generateReport() {
    try {
      // Ensure output directory exists
      await fs.mkdir(CONFIG.outputDir, { recursive: true });
      
      // Generate JSON report
      const jsonReport = {
        ...testResults,
        config: {
          baseURL: CONFIG.baseURL,
          apiBase: CONFIG.apiBase,
          timestamp: new Date().toISOString()
        }
      };
      
      const jsonPath = path.join(CONFIG.outputDir, 'api-test-results.json');
      await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));
      
      // Generate HTML report
      const htmlReport = this.generateHTMLReport(jsonReport);
      const htmlPath = path.join(CONFIG.outputDir, 'api-test-results.html');
      await fs.writeFile(htmlPath, htmlReport);
      
      TestUtils.log(`📊 Reports generated: ${jsonPath}`, 'info');
      TestUtils.log(`📊 HTML report: ${htmlPath}`, 'info');
      
    } catch (error) {
      TestUtils.log(`Failed to generate report: ${error.message}`, 'error');
    }
  }

  static generateHTMLReport(data) {
    const passedCount = data.summary.passed;
    const failedCount = data.summary.failed;
    const totalCount = data.summary.total;
    const successRate = ((passedCount / totalCount) * 100).toFixed(1);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ContractFlow Pro API Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric { text-align: center; padding: 20px; border-radius: 5px; }
        .metric.passed { background: #d4edda; color: #155724; }
        .metric.failed { background: #f8d7da; color: #721c24; }
        .metric.total { background: #d1ecf1; color: #0c5460; }
        .metric.performance { background: #fff3cd; color: #856404; }
        .tests { margin: 20px 0; }
        .test { padding: 10px; margin: 5px 0; border-radius: 3px; }
        .test.passed { background: #d4edda; }
        .test.failed { background: #f8d7da; }
        .errors { background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 ContractFlow Pro API Test Results</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>API Base: ${data.config.apiBase}</p>
    </div>
    
    <div class="summary">
        <div class="metric total">
            <h3>Total Tests</h3>
            <h2>${totalCount}</h2>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <h2>${passedCount}</h2>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <h2>${failedCount}</h2>
        </div>
        <div class="metric performance">
            <h3>Success Rate</h3>
            <h2>${successRate}%</h2>
        </div>
    </div>
    
    <div class="tests">
        <h2>Test Results</h2>
        ${data.tests.map(test => `
            <div class="test ${test.status}">
                <strong>${test.name}</strong> (${test.category}) - 
                ${test.status.toUpperCase()} 
                ${test.duration > 0 ? `(${test.duration}ms)` : ''}
                ${test.error ? `<br><em>Error: ${test.error}</em>` : ''}
            </div>
        `).join('')}
    </div>
    
    ${data.errors.length > 0 ? `
        <div class="errors">
            <h2>Errors</h2>
            ${data.errors.map(error => `<p><strong>${error.test}:</strong> ${error.error}</p>`).join('')}
        </div>
    ` : ''}
    
    ${data.performance.averageResponseTime > 0 ? `
        <div class="performance">
            <h2>Performance Metrics</h2>
            <p>Average Response Time: ${data.performance.averageResponseTime.toFixed(2)}ms</p>
            <p>Slowest Endpoint: ${data.performance.slowestEndpoint?.endpoint} (${data.performance.slowestEndpoint?.responseTime}ms)</p>
            <p>Fastest Endpoint: ${data.performance.fastestEndpoint?.endpoint} (${data.performance.fastestEndpoint?.responseTime}ms)</p>
        </div>
    ` : ''}
</body>
</html>`;
  }

  static printResults() {
    console.log('\n' + '='.repeat(80));
    TestUtils.log('📊 Comprehensive API Test Suite Results', 'info');
    console.log('='.repeat(80));
    
    TestUtils.log(`Total Tests: ${testResults.summary.total}`, 'info');
    TestUtils.log(`Passed: ${testResults.summary.passed}`, 'success');
    TestUtils.log(`Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'error' : 'success');
    TestUtils.log(`Duration: ${testResults.summary.duration.toFixed(2)} seconds`, 'info');
    
    if (testResults.performance.averageResponseTime > 0) {
      TestUtils.log(`Average Response Time: ${testResults.performance.averageResponseTime.toFixed(2)}ms`, 'info');
      if (testResults.performance.slowestEndpoint) {
        TestUtils.log(`Slowest: ${testResults.performance.slowestEndpoint.endpoint} (${testResults.performance.slowestEndpoint.responseTime}ms)`, 'warning');
      }
    }
    
    if (testResults.summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(error => {
        TestUtils.log(`  - ${error.test}: ${error.error}`, 'error');
      });
    }
    
    const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
    TestUtils.log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
    
    if (testResults.summary.failed === 0) {
      TestUtils.log('🎉 All tests passed! API is working correctly.', 'success');
    } else {
      TestUtils.log('⚠️  Some tests failed. Please check the errors above and review the detailed report.', 'warning');
    }
    
    console.log('='.repeat(80));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  ComprehensiveAPITestRunner.runAllTests().catch(error => {
    TestUtils.log(`Test suite execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  ComprehensiveAPITestRunner,
  TestUtils,
  AuthenticationTests,
  ContractTests,
  DatasetTests,
  InfrastructureTests,
  DashboardTests,
  SystemTests,
  PerformanceTests
}; 