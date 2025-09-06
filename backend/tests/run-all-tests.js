#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  timeout: 60000, // 60 seconds
  verbose: true,
  coverage: true,
  watch: false,
  bail: false, // Don't stop on first failure
  maxWorkers: 4, // Limit concurrent test processes
  testSequencer: './test-sequencer.js'
};

// Test suites configuration
const testSuites = {
  mock: {
    name: 'Mock Tests',
    description: 'Fast unit tests with mocked external services',
    files: [
      'mock-integration.test.js',
      'models.test.js',
      'api.test.js',
      'core.test.js',
      'security.test.js',
      'performance.test.js'
    ],
    environment: {
      TEST_MODE: 'mock',
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-key',
      DATABASE_URL: '***REMOVED-DB_PASSWORD***ql://mukeshjoshi@localhost:5432/contract_management_test',
      BLOCKCHAIN_ENABLED: 'false',
      KEYCLOAK_ENABLED: 'false',
      SCITT_CCF_ENABLED: 'false'
    }
  },
  integration: {
    name: 'Integration Tests',
    description: 'Full integration tests with real external services',
    files: [
      'integration.test.js',
      'registration-integration.test.js',
      'blockchainService.test.js',
      'blockchainService.simple.test.js',
      'blockchainService.constructor.test.js',
      'simple-ai-model.test.js',
      'scitt-ccf-api.test.js',
      'scitt-ccf-integration.test.js'
    ],
    environment: {
      TEST_MODE: 'integration',
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-key',
      DATABASE_URL: '***REMOVED-DB_PASSWORD***ql://mukeshjoshi@localhost:5432/contract_management_test',
      BLOCKCHAIN_ENABLED: 'true',
      KEYCLOAK_ENABLED: 'true',
      KEYCLOAK_URL: 'http://localhost:8080',
      KEYCLOAK_REALM: 'contract-management',
      KEYCLOAK_ADMIN_USER: 'admin',
      KEYCLOAK_ADMIN_PASSWORD: 'admin',
      SCITT_CCF_ENABLED: 'true',
      CCF_NODE_URL: 'http://localhost:8000'
    },
    prerequisites: [
      'Keycloak server running on http://localhost:8080',
      'Blockchain node running on http://localhost:8545',
      'SCITT CCF node running on http://localhost:8000',
      'PostgreSQL database running'
    ]
  },
  scittCcf: {
    name: 'SCITT CCF Tests',
    description: 'SCITT CCF specific integration and API tests',
    files: [
      'scitt-ccf-api.test.js',
      'scitt-ccf-integration.test.js',
      'contract-state-machine.test.js',
      'multi-tdp-contracts.test.js'
    ],
    environment: {
      TEST_MODE: 'integration',
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-key',
      DATABASE_URL: '***REMOVED-DB_PASSWORD***ql://mukeshjoshi@localhost:5432/contract_management_test',
      BLOCKCHAIN_ENABLED: 'true',
      KEYCLOAK_ENABLED: 'true',
      SCITT_CCF_ENABLED: 'true',
      CCF_NODE_URL: 'http://localhost:8000',
      MIGRATION_MODE: 'HYBRID'
    },
    prerequisites: [
      'SCITT CCF node running on http://localhost:8000',
      'Keycloak server running on http://localhost:8080',
      'PostgreSQL database running'
    ]
  },
  all: {
    name: 'All Tests',
    description: 'Complete test suite including both mock and integration tests',
    files: [
      'mock-integration.test.js',
      'integration.test.js',
      'models.test.js',
      'api.test.js',
      'core.test.js',
      'security.test.js',
      'performance.test.js',
      'registration-integration.test.js',
      'blockchainService.test.js',
      'blockchainService.simple.test.js',
      'blockchainService.constructor.test.js',
      'simple-ai-model.test.js',
      'scitt-ccf-api.test.js',
      'scitt-ccf-integration.test.js',
      'contract-state-machine.test.js',
      'multi-tdp-contracts.test.js'
    ],
    environment: {
      TEST_MODE: 'auto', // Will automatically choose based on service availability
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-key',
      DATABASE_URL: '***REMOVED-DB_PASSWORD***ql://mukeshjoshi@localhost:5432/contract_management_test',
      BLOCKCHAIN_ENABLED: 'auto',
      KEYCLOAK_ENABLED: 'auto',
      SCITT_CCF_ENABLED: 'auto'
    }
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkPrerequisites(suite) {
  log(`Checking prerequisites for ${suite.name}...`);
  
  if (suite.prerequisites) {
    for (const prerequisite of suite.prerequisites) {
      log(`  - ${prerequisite}`);
    }
  }
  
  // Check if test database exists
  try {
    execSync('psql -d contract_management_test -c "SELECT 1;"', { stdio: 'ignore' });
    log('✅ Test database is accessible');
  } catch (error) {
    log('⚠️ Test database not accessible, attempting to create...', 'warning');
    try {
      execSync('createdb contract_management_test', { stdio: 'inherit' });
      log('✅ Test database created successfully');
    } catch (createError) {
      log('❌ Failed to create test database', 'error');
      return false;
    }
  }
  
  return true;
}

function setupEnvironment(suite) {
  log(`Setting up environment for ${suite.name}...`);
  
  // Set environment variables
  Object.entries(suite.environment).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  log('✅ Environment variables configured');
}

function runDatabaseMigrations() {
  log('Running database migrations...');
  try {
    execSync('npx sequelize-cli db:migrate --env test', { stdio: 'inherit' });
    log('✅ Database migrations completed');
  } catch (error) {
    log('⚠️ Migration failed, continuing with existing schema', 'warning');
  }
}

function buildJestArgs(suite, options = {}) {
  const args = [
    '--testTimeout=' + testConfig.timeout,
    '--verbose',
    '--detectOpenHandles',
    '--forceExit',
    '--maxWorkers=' + testConfig.maxWorkers
  ];

  if (testConfig.bail) {
    args.push('--bail');
  }

  if (testConfig.coverage) {
    args.push('--coverage');
    args.push('--coverageDirectory=./coverage');
    args.push('--coverageReporters=text,html,lcov');
    args.push('--coverageThreshold=' + JSON.stringify({
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    }));
  }

  if (options.watch) {
    args.push('--watch');
  }

  // Add test files
  suite.files.forEach(file => {
    args.push(`./tests/${file}`);
  });

  return args;
}

function runTestSuite(suite, options = {}) {
  log(`\n🚀 Starting ${suite.name}`);
  log(`📝 ${suite.description}`);
  
  if (!checkPrerequisites(suite)) {
    log('❌ Prerequisites not met, skipping test suite', 'error');
    return { success: false, error: 'Prerequisites not met' };
  }
  
  setupEnvironment(suite);
  runDatabaseMigrations();
  
  const jestArgs = buildJestArgs(suite, options);
  const command = `npx jest ${jestArgs.join(' ')}`;
  
  log(`📋 Running command: ${command}`);
  
  try {
    const startTime = Date.now();
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, ...suite.environment }
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`✅ ${suite.name} completed successfully in ${duration}s`, 'success');
    return { success: true, duration };
  } catch (error) {
    log(`❌ ${suite.name} failed`, 'error');
    return { success: false, error: error.message };
  }
}

function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
    },
    suites: results
  };
  
  // Save report to file
  const reportPath = './test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`📊 Test report saved to ${reportPath}`);
  
  // Print summary
  console.log('\n📋 Test Summary:');
  console.log(`  Total Suites: ${report.summary.total}`);
  console.log(`  Passed: ${report.summary.passed}`);
  console.log(`  Failed: ${report.summary.failed}`);
  console.log(`  Total Duration: ${report.summary.totalDuration.toFixed(2)}s`);
  
  if (report.summary.failed > 0) {
    console.log('\n❌ Failed Suites:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.suite.name}: ${result.error}`);
    });
  }
  
  return report;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const suiteName = args[0] || 'all';
  const options = {
    watch: args.includes('--watch'),
    coverage: !args.includes('--no-coverage')
  };
  
  console.log('🧪 Contract Management System - Test Runner');
  console.log('===========================================\n');
  
  if (!testSuites[suiteName]) {
    log(`❌ Unknown test suite: ${suiteName}`, 'error');
    console.log('\nAvailable test suites:');
    Object.keys(testSuites).forEach(name => {
      console.log(`  - ${name}: ${testSuites[name].description}`);
    });
    process.exit(1);
  }
  
  const suite = testSuites[suiteName];
  log(`🎯 Running ${suite.name}`);
  
  const results = [];
  
  if (suiteName === 'all') {
    // Run mock tests first
    log('\n🔄 Running mock tests...');
    const mockResult = runTestSuite(testSuites.mock, options);
    results.push({ suite: testSuites.mock, ...mockResult });
    
    // Then run integration tests
    log('\n🔄 Running integration tests...');
    const integrationResult = runTestSuite(testSuites.integration, options);
    results.push({ suite: testSuites.integration, ...integrationResult });
  } else {
    const result = runTestSuite(suite, options);
    results.push({ suite, ...result });
  }
  
  // Generate and display report
  const report = generateTestReport(results);
  
  // Exit with appropriate code
  if (report.summary.failed > 0) {
    log('❌ Some test suites failed', 'error');
    process.exit(1);
  } else {
    log('✅ All test suites passed', 'success');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('🛑 Test execution interrupted by user', 'warning');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('🛑 Test execution terminated', 'warning');
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`❌ Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  testSuites,
  testConfig,
  runTestSuite,
  generateTestReport
}; 