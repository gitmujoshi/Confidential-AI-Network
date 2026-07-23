const { getBackendURL } = require('../../load-config');
const { E2ETestDataManager } = require('./test-data-setup');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const STATIC_USERS_PATH = path.join(
  __dirname,
  '../../../fixtures/test-data/static-e2e-users.json'
);

async function verifyStaticUsers(backendURL) {
  const fixture = JSON.parse(fs.readFileSync(STATIC_USERS_PATH, 'utf8'));
  const password = fixture.password || 'TestNewPassword123!';
  const failures = [];

  console.log('🔐 Verifying static E2E users (created only during env setup)...');
  for (const u of fixture.users || []) {
    try {
      const loginResponse = await axios.post(`${backendURL}/api/auth/login`, {
        email: u.email,
        password,
      });
      if (!(loginResponse.status === 200 && loginResponse.data.accessToken)) {
        failures.push(u.email);
      } else {
        console.log(`   ✓ ${u.email}`);
      }
    } catch (_) {
      failures.push(u.email);
    }
  }

  if (failures.length) {
    throw new Error(
      `Static E2E users missing or cannot log in: ${failures.join(', ')}. ` +
        `Run env setup seed first: npm run seed:e2e-users`
    );
  }
  console.log('✅ Static E2E user authentication verified');
}

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment with centralized config...');

  const backendURL = getBackendURL();

  try {
    console.log(`📝 Checking backend status at ${backendURL}...`);

    const healthResponse = await axios.get(`${backendURL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Backend is running and healthy');
    }

    // Users are NOT created here — only verified. Seed via: npm run seed:e2e-users
    await verifyStaticUsers(backendURL);

    console.log('📊 Ensuring E2E catalog fixtures (templates / models / datasets)...');
    const testDataManager = new E2ETestDataManager();
    await testDataManager.setupCatalogFixtures();

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
