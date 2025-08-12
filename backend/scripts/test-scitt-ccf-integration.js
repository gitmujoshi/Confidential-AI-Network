#!/usr/bin/env node

/**
 * SCITT CCF Integration Test Script
 * 
 * This script tests the SCITT CCF integration by:
 * 1. Testing service initialization
 * 2. Testing contract creation
 * 3. Testing contract signing
 * 4. Testing health monitoring
 * 5. Testing performance metrics
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

require('dotenv').config({ path: '.env.scitt-ccf' });

const ScittCcfService = require('../services/scittCcfService');
const ContractRouterService = require('../services/contractRouterService');
const SystemHealthMonitor = require('../services/systemHealthMonitor');

class ScittCcfIntegrationTest {
  constructor() {
    this.scittCcfService = new ScittCcfService();
    this.contractRouterService = new ContractRouterService();
    this.healthMonitor = new SystemHealthMonitor();
    this.testResults = [];
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting SCITT CCF Integration Tests...\n');

    try {
      // Test 1: Service Initialization
      await this.testServiceInitialization();

      // Test 2: Health Monitoring
      await this.testHealthMonitoring();

      // Test 3: Contract Operations
      await this.testContractOperations();

      // Test 4: Performance Testing
      await this.testPerformance();

      // Test 5: Error Handling
      await this.testErrorHandling();

      // Test 6: Migration Mode Testing
      await this.testMigrationModes();

      // Print test results
      this.printTestResults();

    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test service initialization
   */
  async testServiceInitialization() {
    console.log('📋 Test 1: Service Initialization');
    
    try {
      // Test SCITT CCF service initialization
      await this.scittCcfService.initialize();
      this.addTestResult('SCITT CCF Service Initialization', true, 'Service initialized successfully');

      // Test contract router service initialization
      await this.contractRouterService.initialize();
      this.addTestResult('Contract Router Service Initialization', true, 'Service initialized successfully');

      // Test health monitor initialization
      await this.healthMonitor.startMonitoring();
      this.addTestResult('Health Monitor Initialization', true, 'Health monitoring started successfully');

      console.log('✅ Service initialization tests passed\n');

    } catch (error) {
      this.addTestResult('Service Initialization', false, error.message);
      console.log('❌ Service initialization tests failed\n');
      throw error;
    }
  }

  /**
   * Test health monitoring
   */
  async testHealthMonitoring() {
    console.log('📋 Test 2: Health Monitoring');
    
    try {
      // Wait for health checks to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get system health
      const systemHealth = await this.contractRouterService.getSystemHealth();
      this.addTestResult('System Health Check', true, `Overall health: ${systemHealth.overall}`);

      // Get detailed metrics
      const detailedMetrics = await this.contractRouterService.getDetailedMetrics();
      this.addTestResult('Detailed Metrics', true, 'Metrics retrieved successfully');

      // Test health monitor status
      const healthStatus = this.healthMonitor.getSystemHealth();
      this.addTestResult('Health Monitor Status', true, `Monitoring active: ${healthStatus.monitoringActive}`);

      console.log('✅ Health monitoring tests passed\n');

    } catch (error) {
      this.addTestResult('Health Monitoring', false, error.message);
      console.log('❌ Health monitoring tests failed\n');
      throw error;
    }
  }

  /**
   * Test contract operations
   */
  async testContractOperations() {
    console.log('📋 Test 3: Contract Operations');
    
    try {
      // Test contract creation
      const contractData = {
        contractId: 'TEST-CONTRACT-001',
        tdcAddress: '0x1234567890123456789012345678901234567890',
        tdpAddress: '0x0987654321098765432109876543210987654321',
        ccrpAddress: '0x1111111111111111111111111111111111111111',
        datasetId: 'DS-TEST-001',
        price: 1000,
        duration: 30,
        termsAndConditions: 'Test contract terms and conditions'
      };

      const createResult = await this.contractRouterService.createContract(contractData);
      this.addTestResult('Contract Creation', true, `Contract created with source: ${createResult.source}`);

      // Test contract status retrieval
      const statusResult = await this.contractRouterService.getContractStatus(contractData.contractId);
      this.addTestResult('Contract Status Retrieval', true, `Status: ${statusResult.status}`);

      // Test contract signing
      const signResult = await this.contractRouterService.signContract(
        contractData.contractId,
        contractData.tdpAddress,
        'TDP'
      );
      this.addTestResult('Contract Signing', true, `Contract signed successfully`);

      console.log('✅ Contract operations tests passed\n');

    } catch (error) {
      this.addTestResult('Contract Operations', false, error.message);
      console.log('❌ Contract operations tests failed\n');
      throw error;
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log('📋 Test 4: Performance Testing');
    
    try {
      // Test SCITT CCF performance metrics
      const scittMetrics = await this.scittCcfService.getPerformanceMetrics();
      this.addTestResult('SCITT CCF Performance', true, `Latency: ${scittMetrics.latency}ms`);

      // Test routing logic
      const routingTest = await this.contractRouterService.testRoutingLogic();
      this.addTestResult('Routing Logic', true, `Success rate: ${routingTest.successCount}/${routingTest.totalCount}`);

      // Test health monitor performance
      const healthMetrics = await this.healthMonitor.getDetailedMetrics();
      this.addTestResult('Health Monitor Performance', true, 'Performance metrics retrieved');

      console.log('✅ Performance tests passed\n');

    } catch (error) {
      this.addTestResult('Performance Testing', false, error.message);
      console.log('❌ Performance tests failed\n');
      throw error;
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('📋 Test 5: Error Handling');
    
    try {
      // Test invalid contract data
      try {
        await this.contractRouterService.createContract(null);
        this.addTestResult('Invalid Data Handling', false, 'Should have thrown error');
      } catch (error) {
        this.addTestResult('Invalid Data Handling', true, 'Error handled correctly');
      }

      // Test non-existent contract
      try {
        await this.contractRouterService.getContractStatus('NON-EXISTENT-CONTRACT');
        this.addTestResult('Non-existent Contract Handling', true, 'Handled gracefully');
      } catch (error) {
        this.addTestResult('Non-existent Contract Handling', false, 'Unexpected error');
      }

      // Test service configuration
      const config = this.contractRouterService.getConfiguration();
      this.addTestResult('Service Configuration', true, `Migration mode: ${config.migrationMode}`);

      console.log('✅ Error handling tests passed\n');

    } catch (error) {
      this.addTestResult('Error Handling', false, error.message);
      console.log('❌ Error handling tests failed\n');
      throw error;
    }
  }

  /**
   * Test migration modes
   */
  async testMigrationModes() {
    console.log('📋 Test 6: Migration Mode Testing');
    
    try {
      // Test switching to SCITT CCF only mode
      const scittOnlyResult = await this.contractRouterService.switchMigrationMode('SCITT_CCF_ONLY');
      this.addTestResult('Switch to SCITT CCF Only', true, scittOnlyResult.message);

      // Test switching to Ethereum only mode
      const ethereumOnlyResult = await this.contractRouterService.switchMigrationMode('ETHEREUM_ONLY');
      this.addTestResult('Switch to Ethereum Only', true, ethereumOnlyResult.message);

      // Test switching back to hybrid mode
      const hybridResult = await this.contractRouterService.switchMigrationMode('HYBRID');
      this.addTestResult('Switch to Hybrid Mode', true, hybridResult.message);

      console.log('✅ Migration mode tests passed\n');

    } catch (error) {
      this.addTestResult('Migration Mode Testing', false, error.message);
      console.log('❌ Migration mode tests failed\n');
      throw error;
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, message) {
    this.testResults.push({
      testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print test results
   */
  printTestResults() {
    console.log('📊 Test Results Summary');
    console.log('========================\n');

    const passedTests = this.testResults.filter(result => result.passed);
    const failedTests = this.testResults.filter(result => !result.passed);

    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`📊 Total: ${this.testResults.length}\n`);

    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.testName}: ${test.message}`);
      });
      console.log('');
    }

    console.log('✅ Passed Tests:');
    passedTests.forEach(test => {
      console.log(`   - ${test.testName}: ${test.message}`);
    });

    console.log('\n🎯 Test Summary:');
    if (failedTests.length === 0) {
      console.log('🎉 All tests passed! SCITT CCF integration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the failed tests above.');
    }
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    try {
      console.log('\n🧹 Cleaning up test data...');
      
      // Cleanup test data from SCITT CCF service
      await this.scittCcfService.cleanupTestData();
      
      // Stop health monitoring
      await this.healthMonitor.shutdown();
      
      // Shutdown contract router service
      await this.contractRouterService.shutdown();
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Main execution
async function main() {
  const testRunner = new ScittCcfIntegrationTest();
  
  try {
    await testRunner.runAllTests();
  } finally {
    await testRunner.cleanup();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = ScittCcfIntegrationTest;
