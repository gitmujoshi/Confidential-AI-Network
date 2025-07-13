const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Multi-TDP Contract Tests...\n');

try {
  // Run the multi-TDP tests
  const testCommand = 'npx jest tests/multi-tdp-contracts.test.js --verbose --detectOpenHandles';
  
  console.log('📋 Test Command:', testCommand);
  console.log('⏳ Starting tests...\n');
  
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: path.join(__dirname)
  });
  
  console.log('\n✅ Multi-TDP tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Multi-TDP tests failed:', error.message);
  process.exit(1);
} 