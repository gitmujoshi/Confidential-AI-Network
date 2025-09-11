/**
 * Global Teardown for Contract Signing Tests
 * 
 * Performs global cleanup tasks after running all tests.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const { sequelize } = require('../../models');

module.exports = async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  try {
    // Cleanup test data if setup was used
    if (global.testDataSetup) {
      await global.testDataSetup.cleanup();
      console.log('✅ Test data cleaned up');
    }
    
    // Close database connection
    await sequelize.close();
    console.log('✅ Database connection closed');
    
    console.log('✅ Global test teardown completed');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error.message);
    // Don't throw error to avoid masking test failures
  }
};
