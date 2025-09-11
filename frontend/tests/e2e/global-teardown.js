// Load test data manager for cleanup
const { E2ETestDataManager } = require('./test-data-setup');

async function globalTeardown(config) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up consistent test data
    const testDataManager = new E2ETestDataManager();
    await testDataManager.cleanupTestData();
    
    console.log('✅ E2E test environment cleanup complete');
  } catch (error) {
    console.error('❌ E2E test environment cleanup failed:', error);
  }
}

module.exports = globalTeardown; 