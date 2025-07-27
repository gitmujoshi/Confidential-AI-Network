#!/usr/bin/env node

/**
 * Run All Tests
 * 
 * Executes all test suites including the new confidential computing tests
 */

const { execSync } = require('child_process');

console.log('🧪 Running all test suites...');

try {
  // Run integration tests
  console.log('\n📋 Running integration tests...');
  execSync('npm test tests/integration.test.js', { stdio: 'inherit' });
  
  // Run confidential computing tests
  console.log('\n🛡️ Running confidential computing tests...');
  execSync('npm test tests/confidential-computing.test.js', { stdio: 'inherit' });
  
  // Run frontend confidential computing tests
  console.log('\n🎨 Running frontend confidential computing tests...');
  execSync('npm test tests/frontend-confidential-computing.test.js', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
} 