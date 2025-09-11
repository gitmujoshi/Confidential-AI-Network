/**
 * Global Setup for Contract Signing Tests
 * 
 * Performs global setup tasks before running all tests.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const { sequelize } = require('../../models');
const SigningTestDataSetup = require('./signing-test-data');

module.exports = async () => {
  console.log('🔧 Setting up global test environment...');
  
  try {
    // Initialize database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database models
    await sequelize.sync({ force: false });
    console.log('✅ Database models synchronized');
    
    // Initialize test data setup
    global.testDataSetup = new SigningTestDataSetup();
    console.log('✅ Test data setup initialized');
    
    // Check SCITT CCF service availability
    try {
      const scittCcfService = require('../../services/scittCcfService');
      await scittCcfService.initialize();
      console.log('✅ SCITT CCF service initialized');
    } catch (error) {
      console.log('⚠️  SCITT CCF service not available, using mocks');
    }
    
    console.log('✅ Global test setup completed');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error.message);
    throw error;
  }
};
