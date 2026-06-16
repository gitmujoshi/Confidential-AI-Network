const { getBackendURL } = require('../../load-config');
const { E2ETestDataManager } = require('./test-data-setup');
const axios = require('axios');

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment with centralized config...');

  const backendURL = getBackendURL();

  try {
    console.log(`📝 Checking backend status at ${backendURL}...`);
    
    const healthResponse = await axios.get(`${backendURL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Backend is running and healthy');
    }

    // Set up consistent test data for E2E tests BEFORE verifying login.
    // This prevents confusing "User not found" messages on fresh databases.
    console.log('📊 Setting up consistent E2E test data...');
    const testDataManager = new E2ETestDataManager();
    await testDataManager.setupTestData();
    
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

    const templatesList = await axios.get(`${backendURL}/api/contract-templates`);
    const templateCount =
      templatesList.data?.count ??
      (Array.isArray(templatesList.data?.data) ? templatesList.data.data.length : 0);
    if (templateCount === 0) {
      console.warn(
        '⚠️ No contract templates after seed — training-parameters and /contracts/create tests need templates.'
      );
    } else {
      console.log(`✅ Contract templates available for E2E: ${templateCount}`);
    }

    try {
      const debugRes = await axios.get(`${backendURL}/api/debug/env`);
      const canMode = debugRes.data?.training?.canLocalTrainingMode || 'simulate';
      if (canMode !== 'docker') {
        console.warn(
          `⚠️ CAN_LOCAL_TRAINING_MODE=${canMode} — set CAN_LOCAL_TRAINING_MODE=docker in config.env and restart backend for physical training in full E2E`
        );
      } else {
        console.log('✅ CAN local training mode: docker');
      }
    } catch (_) {
      // debug route optional
    }

    console.log('✅ E2E test environment setup complete with centralized config and test data');
  } catch (error) {
    const msg = error.response?.data || error.message;
    console.error('❌ E2E setup failed:', msg);
    const code = error.code || error.cause?.code;
    if (code === 'ECONNREFUSED' || code === 'EAI_AGAIN') {
      console.error(
        `Cannot reach the API at ${backendURL}. Start the backend (see project README) and ensure config.env BACKEND_URL / BACKEND_PORT match the running server.`
      );
    }
    throw error;
  }
}

module.exports = globalSetup; 