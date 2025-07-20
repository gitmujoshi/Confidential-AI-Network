async function globalTeardown(config) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up test data from backend if needed
    // This could include deleting test users, datasets, etc.
    console.log('✅ E2E test environment cleanup complete');
  } catch (error) {
    console.error('❌ E2E test environment cleanup failed:', error);
  }
}

module.exports = globalTeardown; 