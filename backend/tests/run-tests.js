#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Comprehensive Test Suite for Contract Management System\n');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = '***REMOVED-DB_PASSWORD***ql://mukeshjoshi@localhost:5432/contract_management_test';

// Test configuration
const testConfig = {
  timeout: 30000,
  verbose: true,
  coverage: true,
  watch: false
};

// Test files to run
const testFiles = [
  'comprehensive.test.js',
  'blockchainService.test.js',
  'didService.test.js',
  '***REMOVED-KEYCLOAK_DB_PASSWORD***Service.test.js'
];

async function runTests() {
  try {
    console.log('📋 Test Configuration:');
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   Database: ${process.env.DATABASE_URL}`);
    console.log(`   Timeout: ${testConfig.timeout}ms`);
    console.log(`   Coverage: ${testConfig.coverage ? 'Enabled' : 'Disabled'}\n`);

    // Create test database if it doesn't exist
    console.log('🗄️  Setting up test database...');
    try {
      execSync('createdb contract_management_test', { stdio: 'inherit' });
      console.log('✅ Test database created/verified\n');
    } catch (error) {
      console.log('ℹ️  Test database already exists or creation failed\n');
    }

    // Run database migrations
    console.log('🔄 Running database migrations...');
    try {
      execSync('npx sequelize-cli db:migrate --env test', { stdio: 'inherit' });
      console.log('✅ Database migrations completed\n');
    } catch (error) {
      console.log('⚠️  Migration failed, continuing with existing schema\n');
    }

    // Run comprehensive test suite
    console.log('🚀 Starting comprehensive test suite...\n');
    
    const jestArgs = [
      '--testTimeout=' + testConfig.timeout,
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (testConfig.coverage) {
      jestArgs.push('--coverage');
      jestArgs.push('--coverageDirectory=./coverage');
      jestArgs.push('--coverageReporters=text,html,lcov');
    }

    if (testConfig.watch) {
      jestArgs.push('--watch');
    }

    jestArgs.push(...testFiles);

    const command = `npx jest ${jestArgs.join(' ')}`;
    console.log(`Executing: ${command}\n`);

    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    console.log('\n🎉 All tests completed successfully!');

    if (testConfig.coverage) {
      console.log('\n📊 Coverage report generated in ./coverage/');
      console.log('   Open ./coverage/lcov-report/index.html to view detailed coverage');
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(0);
});

// Run tests
runTests().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
}); 