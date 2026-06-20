const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Comprehensive Test Suite for Multi-Cloud Secret Management\n');

// Test categories
const testCategories = [
  {
    name: 'Secret Manager Unit Tests',
    command: 'npm test -- secretManager.test.js',
    description: 'Testing SecretManager service functionality'
  },
  {
    name: 'Cloud Provider Unit Tests',
    command: 'npm test -- cloudProviders.test.js',
    description: 'Testing Azure, AWS, GCP, and OCI provider services'
  },
  {
    name: 'Cloud Credentials API Integration Tests',
    command: 'npm test -- integration/cloudCredentials.test.js',
    description: 'Testing API endpoints for cloud credentials management'
  },
  {
    name: 'End-to-End Workflow Tests',
    command: 'npm test -- e2e/cloudCredentialsWorkflow.test.js',
    description: 'Testing complete cloud credentials workflows'
  },
  {
    name: 'Database Model Tests',
    command: 'npm test -- models/TSPCloudCredentials.test.js',
    description: 'Testing TSPCloudCredentials database model'
  },
  {
    name: 'Frontend Component Tests',
    command: 'cd ../frontend && npm test -- TSPCloudCredentials.test.js',
    description: 'Testing TSP Cloud Credentials React component'
  },
  {
    name: 'Multi-Cloud Integration Test',
    command: 'node test-multi-cloud-integration.js',
    description: 'Testing complete multi-cloud integration'
  }
];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: testCategories.length,
  details: []
};

async function runTestCategory(category) {
  console.log(`\n📋 ${category.name}`);
  console.log(`   ${category.description}`);
  console.log('   Running...');

  try {
    const startTime = Date.now();
    execSync(category.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`   ✅ PASSED (${duration}s)`);
    testResults.passed++;
    testResults.details.push({
      name: category.name,
      status: 'PASSED',
      duration: duration
    });

  } catch (error) {
    console.log(`   ❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.details.push({
      name: category.name,
      status: 'FAILED',
      error: error.message
    });
  }
}

async function runAllTests() {
  console.log('🚀 Starting Multi-Cloud Secret Management Test Suite\n');

  for (const category of testCategories) {
    await runTestCategory(category);
  }

  // Print summary
  console.log('\n📊 Test Suite Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
  }

  console.log('\n📋 Test Details:');
  testResults.details.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    const duration = test.duration ? ` (${test.duration}s)` : '';
    console.log(`   ${status} ${test.name}${duration}`);
  });

  // Exit with appropriate code
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Multi-Cloud Secret Management is working correctly.');
    process.exit(0);
  }
}

// Run the test suite
runAllTests().catch(error => {
  console.error('💥 Test suite execution failed:', error);
  process.exit(1);
}); 