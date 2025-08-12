/**
 * Differential Privacy API Testing Script
 * Tests all DP endpoints and functionality
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class DifferentialPrivacyAPITester {
  constructor() {
    this.baseURL = 'http://localhost:5001/api';
    this.authToken = null;
    this.testContractId = `test-contract-${Date.now()}`;
    this.testResults = [];
  }

  /**
   * Initialize the tester
   */
  async initialize() {
    console.log('🚀 Initializing Differential Privacy API Tester...');
    
    try {
      // Test connection
      const healthResponse = await axios.get(`${this.baseURL.replace('/api', '')}/health`);
      console.log('✅ Backend is running');
      
      // Get available mechanisms
      const mechanismsResponse = await axios.get(`${this.baseURL}/dp/mechanisms`);
      console.log('✅ DP mechanisms endpoint accessible');
      
      // Get available query types
      const queryTypesResponse = await axios.get(`${this.baseURL}/dp/query-types`);
      console.log('✅ DP query types endpoint accessible');
      
      console.log('🎯 Tester initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize tester:', error.message);
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('\n🧪 Running Differential Privacy API Tests...\n');
    
    const tests = [
      { name: 'Test DP Mechanisms Endpoint', test: () => this.testMechanismsEndpoint() },
      { name: 'Test DP Query Types Endpoint', test: () => this.testQueryTypesEndpoint() },
      { name: 'Test DP Test Endpoint', test: () => this.testDPTestEndpoint() },
      { name: 'Test DP Apply Endpoint', test: () => this.testDPApplyEndpoint() },
      { name: 'Test DP Budget Endpoint', test: () => this.testDPBudgetEndpoint() },
      { name: 'Test DP History Endpoint', test: () => this.testDPHistoryEndpoint() },
      { name: 'Test DP Analytics Endpoint', test: () => this.testDPAnalyticsEndpoint() },
      { name: 'Test DP Budget Reset Endpoint', test: () => this.testDPBudgetResetEndpoint() },
      { name: 'Test Error Handling', test: () => this.testErrorHandling() },
      { name: 'Test Performance', test: () => this.testPerformance() }
    ];
    
    for (const test of tests) {
      try {
        console.log(`\n📋 Running: ${test.name}`);
        await test.test();
        console.log(`✅ ${test.name} - PASSED`);
        this.testResults.push({ name: test.name, status: 'PASSED' });
      } catch (error) {
        console.error(`❌ ${test.name} - FAILED:`, error.message);
        this.testResults.push({ name: test.name, status: 'FAILED', error: error.message });
      }
    }
    
    this.printTestSummary();
  }

  /**
   * Test DP Mechanisms Endpoint
   */
  async testMechanismsEndpoint() {
    const response = await axios.get(`${this.baseURL}/dp/mechanisms`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeDefined();
    expect(Array.isArray(response.data.data)).toBe(true);
    
    const mechanisms = response.data.data;
    expect(mechanisms.length).toBeGreaterThan(0);
    
    // Check for required mechanisms
    const mechanismNames = mechanisms.map(m => m.name);
    expect(mechanismNames).toContain('laplace');
    expect(mechanismNames).toContain('gaussian');
    
    // Check mechanism structure
    const laplace = mechanisms.find(m => m.name === 'laplace');
    expect(laplace.description).toBeDefined();
    expect(laplace.bestFor).toBeDefined();
    expect(laplace.parameters).toBeDefined();
  }

  /**
   * Test DP Query Types Endpoint
   */
  async testQueryTypesEndpoint() {
    const response = await axios.get(`${this.baseURL}/dp/query-types`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeDefined();
    expect(Array.isArray(response.data.data)).toBe(true);
    
    const queryTypes = response.data.data;
    expect(queryTypes.length).toBeGreaterThan(0);
    
    // Check for required query types
    const queryTypeNames = queryTypes.map(q => q.name);
    expect(queryTypeNames).toContain('COUNT');
    expect(queryTypeNames).toContain('AVERAGE');
    expect(queryTypeNames).toContain('GRADIENT');
    
    // Check query type structure
    const countQuery = queryTypes.find(q => q.name === 'COUNT');
    expect(countQuery.description).toBeDefined();
    expect(countQuery.sensitivity).toBeDefined();
    expect(countQuery.mechanism).toBeDefined();
  }

  /**
   * Test DP Test Endpoint
   */
  async testDPTestEndpoint() {
    const testData = [1, 2, 3, 4, 5];
    const testQuery = { type: 'AVERAGE' };
    const testPrivacyParams = {
      epsilon: 0.1,
      delta: 1e-5,
      mechanism: 'laplace'
    };
    
    const response = await axios.post(`${this.baseURL}/dp/test`, {
      data: testData,
      query: testQuery,
      privacyParams: testPrivacyParams
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toBeDefined();
    expect(response.data.data).toBeDefined();
    
    const result = response.data.data;
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.privacyMetrics).toBeDefined();
    expect(result.metadata).toBeDefined();
    
    // Check test info
    expect(result.testInfo).toBeDefined();
    expect(result.testInfo.contractId).toMatch(/^test-contract-\d+$/);
    expect(result.testInfo.note).toContain('test operation');
  }

  /**
   * Test DP Apply Endpoint
   */
  async testDPApplyEndpoint() {
    const testData = [10, 20, 30, 40, 50];
    const testQuery = { type: 'SUM' };
    const testPrivacyParams = {
      contractId: this.testContractId,
      epsilon: 0.2,
      delta: 1e-6,
      mechanism: 'laplace'
    };
    
    const response = await axios.post(`${this.baseURL}/dp/apply`, {
      data: testData,
      query: testQuery,
      privacyParams: testPrivacyParams
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toBeDefined();
    expect(response.data.data).toBeDefined();
    
    const result = response.data.data;
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.privacyMetrics).toBeDefined();
    expect(result.metadata).toBeDefined();
    
    // Check privacy metrics
    const metrics = result.privacyMetrics;
    expect(metrics.epsilon).toBe(0.2);
    expect(metrics.delta).toBe(1e-6);
    expect(metrics.mechanism).toBe('laplace');
    expect(metrics.sensitivity).toBeGreaterThan(0);
    expect(metrics.noiseAdded).toBeDefined();
    expect(metrics.privacyBudget).toBeDefined();
  }

  /**
   * Test DP Budget Endpoint
   */
  async testDPBudgetEndpoint() {
    // First create a budget by applying DP
    await this.createTestBudget();
    
    const response = await axios.get(`${this.baseURL}/dp/budget/${this.testContractId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeDefined();
    
    const budgetData = response.data.data;
    expect(budgetData.budget).toBeDefined();
    expect(budgetData.utilization).toBeDefined();
    
    // Check budget structure
    const budget = budgetData.budget;
    expect(budget.epsilon).toBeDefined();
    expect(budget.delta).toBeDefined();
    expect(budget.epsilon.consumed).toBeGreaterThan(0);
    expect(budget.epsilon.remaining).toBeGreaterThan(0);
  }

  /**
   * Test DP History Endpoint
   */
  async testDPHistoryEndpoint() {
    const response = await axios.get(`${this.baseURL}/dp/history/${this.testContractId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeDefined();
    expect(response.data.pagination).toBeDefined();
    
    const data = response.data.data;
    expect(Array.isArray(data.rows)).toBe(true);
    expect(data.count).toBeGreaterThan(0);
    
    // Check pagination
    const pagination = response.data.pagination;
    expect(pagination.limit).toBe(50);
    expect(pagination.offset).toBe(0);
    expect(pagination.total).toBeGreaterThan(0);
  }

  /**
   * Test DP Analytics Endpoint
   */
  async testDPAnalyticsEndpoint() {
    const response = await axios.get(`${this.baseURL}/dp/analytics/${this.testContractId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeDefined();
    
    const analytics = response.data.data;
    expect(analytics.budget).toBeDefined();
    expect(analytics.operations).toBeDefined();
    expect(analytics.performance).toBeDefined();
    
    // Check operations summary
    const operations = analytics.operations;
    expect(operations.total).toBeGreaterThan(0);
    expect(operations.successRate).toBeGreaterThanOrEqual(0);
    expect(operations.successRate).toBeLessThanOrEqual(100);
    
    // Check performance metrics
    const performance = analytics.performance;
    expect(performance.avgEpsilon).toBeGreaterThan(0);
    expect(performance.avgDelta).toBeGreaterThan(0);
    expect(performance.avgSensitivity).toBeGreaterThan(0);
  }

  /**
   * Test DP Budget Reset Endpoint
   */
  async testDPBudgetResetEndpoint() {
    const resetData = {
      reason: 'Testing budget reset functionality'
    };
    
    const response = await axios.post(`${this.baseURL}/dp/budget/${this.testContractId}/reset`, resetData);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.message).toBeDefined();
    expect(response.data.data).toBeDefined();
    
    const result = response.data.data;
    expect(result.budget).toBeDefined();
    
    // Verify budget was reset
    const budgetResponse = await axios.get(`${this.baseURL}/dp/budget/${this.testContractId}`);
    const budget = budgetResponse.data.data.budget;
    
    // After reset, consumed should be 0 and remaining should equal initial
    expect(budget.epsilon.consumed).toBe(0);
    expect(budget.delta.consumed).toBe(0);
  }

  /**
   * Test Error Handling
   */
  async testErrorHandling() {
    // Test missing data
    try {
      await axios.post(`${this.baseURL}/dp/apply`, {
        query: { type: 'AVERAGE' },
        privacyParams: {
          contractId: this.testContractId,
          epsilon: 0.1,
          delta: 1e-5,
          mechanism: 'laplace'
        }
      });
      throw new Error('Should have failed with missing data');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Data is required');
    }
    
    // Test missing query type
    try {
      await axios.post(`${this.baseURL}/dp/apply`, {
        data: [1, 2, 3],
        privacyParams: {
          contractId: this.testContractId,
          epsilon: 0.1,
          delta: 1e-5,
          mechanism: 'laplace'
        }
      });
      throw new Error('Should have failed with missing query type');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Query type is required');
    }
    
    // Test missing contract ID
    try {
      await axios.post(`${this.baseURL}/dp/apply`, {
        data: [1, 2, 3],
        query: { type: 'AVERAGE' },
        privacyParams: {
          epsilon: 0.1,
          delta: 1e-5,
          mechanism: 'laplace'
        }
      });
      throw new Error('Should have failed with missing contract ID');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Privacy parameters with contract ID are required');
    }
    
    // Test invalid epsilon
    try {
      await axios.post(`${this.baseURL}/dp/apply`, {
        data: [1, 2, 3],
        query: { type: 'AVERAGE' },
        privacyParams: {
          contractId: this.testContractId,
          epsilon: 0,
          delta: 1e-5,
          mechanism: 'laplace'
        }
      });
      throw new Error('Should have failed with invalid epsilon');
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('Epsilon must be positive');
    }
  }

  /**
   * Test Performance
   */
  async testPerformance() {
    const largeData = Array.from({ length: 1000 }, (_, i) => Math.random() * 100);
    const testQuery = { type: 'AVERAGE' };
    const testPrivacyParams = {
      contractId: this.testContractId,
      epsilon: 0.1,
      delta: 1e-5,
      mechanism: 'laplace'
    };
    
    const startTime = Date.now();
    
    const response = await axios.post(`${this.baseURL}/dp/apply`, {
      data: largeData,
      query: testQuery,
      privacyParams: testPrivacyParams
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    console.log(`⏱️ Large dataset (1000 elements) processed in ${executionTime}ms`);
  }

  /**
   * Create a test budget by applying DP
   */
  async createTestBudget() {
    const testData = [1, 2, 3];
    const testQuery = { type: 'COUNT' };
    const testPrivacyParams = {
      contractId: this.testContractId,
      epsilon: 0.1,
      delta: 1e-5,
      mechanism: 'laplace'
    };
    
    await axios.post(`${this.baseURL}/dp/apply`, {
      data: testData,
      query: testQuery,
      privacyParams: testPrivacyParams
    });
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\n🎯 Differential Privacy API Testing Complete!');
  }
}

// Simple assertion function
function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
    toBeDefined: () => {
      if (value === undefined || value === null) {
        throw new Error(`Expected ${value} to be defined`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected) => {
      if (value < expected) {
        throw new Error(`Expected ${value} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan: (expected) => {
      if (value >= expected) {
        throw new Error(`Expected ${value} to be less than ${expected}`);
      }
    },
    toBeLessThanOrEqual: (expected) => {
      if (value > expected) {
        throw new Error(`Expected ${value} to be less than or equal to ${expected}`);
      }
    },
    toContain: (expected) => {
      if (!value.includes(expected)) {
        throw new Error(`Expected ${value} to contain ${expected}`);
      }
    },
    toMatch: (expected) => {
      if (!expected.test(value)) {
        throw new Error(`Expected ${value} to match ${expected}`);
      }
    },
    toHaveLength: (expected) => {
      if (value.length !== expected) {
        throw new Error(`Expected ${value} to have length ${expected}, but got ${value.length}`);
      }
    },
    toHaveProperty: (property) => {
      if (!(property in value)) {
        throw new Error(`Expected ${value} to have property ${property}`);
      }
    }
  };
}

// Main execution
async function main() {
  const tester = new DifferentialPrivacyAPITester();
  
  const initialized = await tester.initialize();
  if (!initialized) {
    console.error('❌ Failed to initialize tester. Exiting.');
    process.exit(1);
  }
  
  await tester.runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = DifferentialPrivacyAPITester; 