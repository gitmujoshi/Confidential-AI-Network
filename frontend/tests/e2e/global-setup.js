// Load centralized configuration
require('dotenv').config({ path: '../../../config.env' });

const { E2ETestDataManager } = require('./test-data-setup');
const axios = require('axios');

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment with centralized config...');
  
  try {
    // Check if backend is running using centralized config
    const backendURL = `http://localhost:${process.env.BACKEND_PORT || 5001}`;
    console.log(`📝 Checking backend status at ${backendURL}...`);
    
    const healthResponse = await axios.get(`${backendURL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Backend is running and healthy');
    }
    
    // Check if we have working test users by trying a login
    const testUserEmail = 'tdc.healthcare.2025-09-05t20-39-55@test.com';
    const testUserPassword = 'TestNewPassword123!';
    
    console.log(`📝 Verifying test user access: ${testUserEmail}...`);
    const loginResponse = await axios.post(`${backendURL}/api/auth/login`, {
      email: testUserEmail,
      password: testUserPassword
    });
    
    if (loginResponse.status === 200 && loginResponse.data.accessToken) {
      console.log('✅ Test user authentication verified');
    }
    
    // Set up consistent test data for E2E tests
    console.log('📊 Setting up consistent E2E test data...');
    const testDataManager = new E2ETestDataManager();
    await testDataManager.setupTestData();
    
    console.log('✅ E2E test environment setup complete with centralized config and test data');
  } catch (error) {
    console.error('❌ E2E setup failed:', error.response?.data || error.message);
    console.log('⚠️ Continuing with tests - some tests may fail due to missing test data');
  }
}

module.exports = globalSetup; 