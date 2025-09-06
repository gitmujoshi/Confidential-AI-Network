#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

// Configuration
const CONFIG = {
  mainApp: {
    baseUrl: process.env.MAIN_APP_URL || 'http://localhost:5001',
    timeout: 10000
  },
  scittCcf: {
    baseUrl: process.env.SCITT_CCF_URL || 'http://localhost:9000',
    timeout: 10000
  },
  apiGateway: {
    baseUrl: process.env.GATEWAY_URL || 'http://localhost:8000',
    timeout: 10000
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`✅ ${timestamp} ${message}`.green);
      break;
    case 'error':
      console.log(`❌ ${timestamp} ${message}`.red);
      break;
    case 'warning':
      console.log(`⚠️  ${timestamp} ${message}`.yellow);
      break;
    case 'info':
    default:
      console.log(`ℹ️  ${timestamp} ${message}`);
      break;
  }
}

function recordTest(name, passed, details = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`FAIL: ${name}`, 'error');
  }
  
  testResults.details.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

// Health check tests
async function testHealthChecks() {
  log('🔍 Testing Health Checks...');
  
  try {
    // Test main app health
    const mainAppHealth = await axios.get(`${CONFIG.mainApp.baseUrl}/health`, {
      timeout: CONFIG.mainApp.timeout
    });
    recordTest('Main App Health Check', mainAppHealth.data.status === 'healthy', mainAppHealth.data);
    
    // Test SCITT CCF health
    const scittCcfHealth = await axios.get(`${CONFIG.scittCcf.baseUrl}/health`, {
      timeout: CONFIG.scittCcf.timeout
    });
    recordTest('SCITT CCF Health Check', scittCcfHealth.data.status === 'healthy', scittCcfHealth.data);
    
    // Test API Gateway health
    const gatewayHealth = await axios.get(`${CONFIG.apiGateway.baseUrl}/health`, {
      timeout: CONFIG.apiGateway.timeout
    });
    recordTest('API Gateway Health Check', gatewayHealth.data.status === 'healthy', gatewayHealth.data);
    
    // Test aggregated health
    const aggregatedHealth = await axios.get(`${CONFIG.apiGateway.baseUrl}/health/aggregated`, {
      timeout: CONFIG.apiGateway.timeout
    });
    recordTest('Aggregated Health Check', aggregatedHealth.data.status === 'healthy', aggregatedHealth.data);
    
  } catch (error) {
    recordTest('Health Checks', false, error.message);
  }
}

// SCITT CCF API tests
async function testScittCcfApi() {
  log('🔐 Testing SCITT CCF API...');
  
  try {
    // Test creating a claim
    const claimData = {
      contract_id: 'CONTRACT-TEST-123',
      data_hash: 'sha256:testhash123',
      claim_type: 'DATA_PROVENANCE',
      metadata: {
        data_source: 'test_dataset',
        data_version: '1.0.0'
      }
    };
    
    const createClaimResponse = await axios.post(`${CONFIG.scittCcf.baseUrl}/api/claims`, claimData, {
      timeout: CONFIG.scittCcf.timeout
    });
    
    recordTest('Create SCITT Claim', 
      createClaimResponse.data.success === true, 
      createClaimResponse.data
    );
    
    if (createClaimResponse.data.success && createClaimResponse.data.claim) {
      const claimId = createClaimResponse.data.claim.claim_id;
      
      // Test retrieving the claim
      const getClaimResponse = await axios.get(`${CONFIG.scittCcf.baseUrl}/api/claims/${claimId}`, {
        timeout: CONFIG.scittCcf.timeout
      });
      
      recordTest('Get SCITT Claim', 
        getClaimResponse.data.success === true, 
        getClaimResponse.data
      );
      
      // Test listing claims by contract
      const listClaimsResponse = await axios.get(`${CONFIG.scittCcf.baseUrl}/api/contracts/${claimData.contract_id}/claims`, {
        timeout: CONFIG.scittCcf.timeout
      });
      
      recordTest('List Contract Claims', 
        listClaimsResponse.data.success === true, 
        listClaimsResponse.data
      );
    }
    
  } catch (error) {
    recordTest('SCITT CCF API Tests', false, error.message);
  }
}

// API Gateway routing tests
async function testApiGatewayRouting() {
  log('🌐 Testing API Gateway Routing...');
  
  try {
    // Test main app routing through gateway
    const mainAppResponse = await axios.get(`${CONFIG.apiGateway.baseUrl}/api/health`, {
      timeout: CONFIG.apiGateway.timeout
    });
    recordTest('Gateway → Main App Routing', 
      mainAppResponse.status === 200, 
      mainAppResponse.data
    );
    
    // Test SCITT CCF routing through gateway
    const scittCcfResponse = await axios.get(`${CONFIG.apiGateway.baseUrl}/api/scitt/health`, {
      timeout: CONFIG.apiGateway.timeout
    });
    recordTest('Gateway → SCITT CCF Routing', 
      scittCcfResponse.status === 200, 
      scittCcfResponse.data
    );
    
  } catch (error) {
    recordTest('API Gateway Routing Tests', false, error.message);
  }
}

// Failure scenario tests
async function testFailureScenarios() {
  log('🚨 Testing Failure Scenarios...');
  
  try {
    // Test SCITT CCF service down scenario
    // This would require stopping the SCITT CCF service
    log('Note: To test SCITT CCF service down scenario, stop the SCITT CCF service first', 'warning');
    
    // Test invalid claim data
    try {
      const invalidClaimData = {
        contract_id: '', // Invalid empty contract ID
        data_hash: 'invalid-hash',
        claim_type: 'INVALID_TYPE'
      };
      
      await axios.post(`${CONFIG.scittCcf.baseUrl}/api/claims`, invalidClaimData, {
        timeout: CONFIG.scittCcf.timeout
      });
      
      recordTest('Invalid Claim Data Validation', false, 'Should have rejected invalid data');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        recordTest('Invalid Claim Data Validation', true, 'Correctly rejected invalid data');
      } else {
        recordTest('Invalid Claim Data Validation', false, error.message);
      }
    }
    
    // Test non-existent claim retrieval
    try {
      await axios.get(`${CONFIG.scittCcf.baseUrl}/api/claims/NONEXISTENT-CLAIM`, {
        timeout: CONFIG.scittCcf.timeout
      });
      
      recordTest('Non-existent Claim Handling', false, 'Should have returned 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        recordTest('Non-existent Claim Handling', true, 'Correctly returned 404');
      } else {
        recordTest('Non-existent Claim Handling', false, error.message);
      }
    }
    
  } catch (error) {
    recordTest('Failure Scenario Tests', false, error.message);
  }
}

// Performance tests
async function testPerformance() {
  log('⚡ Testing Performance...');
  
  try {
    const iterations = 10;
    const startTime = Date.now();
    
    // Test multiple health check requests
    const healthCheckPromises = [];
    for (let i = 0; i < iterations; i++) {
      healthCheckPromises.push(
        axios.get(`${CONFIG.scittCcf.baseUrl}/health`, {
          timeout: CONFIG.scittCcf.timeout
        })
      );
    }
    
    await Promise.all(healthCheckPromises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / iterations;
    
    recordTest('Performance - Multiple Health Checks', 
      avgTime < 1000, // Should complete in less than 1 second on average
      `Average response time: ${avgTime}ms for ${iterations} requests`
    );
    
  } catch (error) {
    recordTest('Performance Tests', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting SCITT CCF Integration Tests...');
  log(`Main App: ${CONFIG.mainApp.baseUrl}`);
  log(`SCITT CCF: ${CONFIG.scittCcf.baseUrl}`);
  log(`API Gateway: ${CONFIG.apiGateway.baseUrl}`);
  log('');
  
  try {
    await testHealthChecks();
    log('');
    
    await testScittCcfApi();
    log('');
    
    await testApiGatewayRouting();
    log('');
    
    await testFailureScenarios();
    log('');
    
    await testPerformance();
    log('');
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
  }
  
  // Print results summary
  printResults();
}

function printResults() {
  log('📊 Test Results Summary');
  log('='.repeat(50));
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`.green);
  log(`Failed: ${testResults.failed}`.red);
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    log('');
    log('❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  - ${test.name}: ${test.details || 'No details'}`);
      });
  }
  
  log('');
  if (testResults.failed === 0) {
    log('🎉 All tests passed! SCITT CCF integration is working correctly.', 'success');
  } else {
    log('⚠️  Some tests failed. Please review the details above.', 'warning');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealthChecks,
  testScittCcfApi,
  testApiGatewayRouting,
  testFailureScenarios,
  testPerformance
};
