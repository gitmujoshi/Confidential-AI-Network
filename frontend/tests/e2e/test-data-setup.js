const axios = require('axios');
const { getBackendURL } = require('../../load-config');

async function ensureUser({ name, email, partyType, desiredPassword }) {
  const backendURL = getBackendURL();

  // If user already exists with desired password, we're done.
  try {
    const login = await axios.post(`${backendURL}/api/auth/login`, {
      email,
      password: desiredPassword,
    });

    if (login.status === 200 && login.data && login.data.accessToken) {
      return;
    }

    // If backend indicates first-login, attempt password change anyway.
    if (login.data && (login.data.requiresPasswordChange || login.data.isFirstLogin)) {
      // We don't have the temporary password in this branch, so fall through to registration.
    }
  } catch (_) {
    // Continue to registration attempt below.
  }

  // Try to register. If the user already exists, backend will reject and we accept that.
  let temporaryPassword;
  try {
    const reg = await axios.post(`${backendURL}/api/auth/register`, {
      name,
      email,
      partyType,
    });

    temporaryPassword = reg.data?.loginCredentials?.password;
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 409) {
      // User likely already exists; assume password is already set appropriately.
      return;
    }
    throw err;
  }

  // If we got a temporary password, complete first-login password change.
  if (temporaryPassword) {
    await axios.post(`${backendURL}/api/auth/first-login-password`, {
      email,
      currentPassword: temporaryPassword,
      newPassword: desiredPassword,
    });
  }
}

async function login({ email, password }) {
  const backendURL = getBackendURL();
  const res = await axios.post(`${backendURL}/api/auth/login`, { email, password });
  if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
    throw new Error('Login did not return accessToken/user');
  }
  return { accessToken: res.data.accessToken, user: res.data.user };
}

class E2ETestDataManager {
  async setupTestData() {
    // This user is hard-coded across Playwright specs as a known-good login.
    await ensureUser({
      name: 'TDC Healthcare E2E User',
      email: 'tdc.healthcare.2025-09-05t20-39-55@test.com',
      partyType: 'TDC',
      desiredPassword: 'TestNewPassword123!',
    });

    // TDP user for dataset ownership.
    await ensureUser({
      name: 'TDP E2E User',
      email: 'tdp.e2e@test.com',
      partyType: 'TDP',
      desiredPassword: 'TestNewPassword123!',
    });

    await ensureUser({
      name: 'CCRP E2E User',
      email: 'ccrp.e2e@test.com',
      partyType: 'CCRP',
      desiredPassword: 'TestNewPassword123!',
    });

    // AppAdmin user for admin-route smoke tests.
    await ensureUser({
      name: 'AppAdmin E2E User',
      email: 'appadmin.e2e@test.com',
      partyType: 'AppAdmin',
      desiredPassword: 'TestNewPassword123!',
    });

    const backendURL = getBackendURL();

    // Seed default contract templates (needed for /contracts/create wizard).
    // Requires authenticated AppAdmin.
    const { accessToken: adminToken } = await login({
      email: 'appadmin.e2e@test.com',
      password: 'TestNewPassword123!',
    });
    await axios.post(`${backendURL}/api/contract-templates/seed`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).catch((err) => {
      // If seeding fails due to duplicates/other idempotency, don't fail E2E setup.
      const status = err.response?.status;
      if (status === 409 || status === 400) return;
      throw err;
    });

    // Ensure at least one public dataset exists for contract creation.
    const { user: tdpUser } = await login({
      email: 'tdp.e2e@test.com',
      password: 'TestNewPassword123!',
    });

    const datasetId = 'e2e-dataset-1';
    let datasetExists = false;
    try {
      await axios.get(`${backendURL}/api/datasets/${datasetId}`);
      datasetExists = true;
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    if (!datasetExists) {
      await axios.post(`${backendURL}/api/datasets`, {
        datasetId,
        name: 'E2E Sample Dataset',
        description: 'Seeded dataset for Playwright E2E tests',
        category: 'Tabular',
        // Backend model stores `size` as an integer.
        size: 10,
        recordCount: 1000,
        price: 100,
        license: 'E2E-LICENSE',
        tags: ['e2e', 'seed'],
        metadata: { seededBy: 'playwright' },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdpUser.id,
      });
    }

    // Ensure at least one contract exists for the TDC so contract list/detail tests can run.
    const { user: tdcUser, accessToken: tdcToken } = await login({
      email: 'tdc.healthcare.2025-09-05t20-39-55@test.com',
      password: 'TestNewPassword123!',
    });

    let existingContractsTotal = 0;
    try {
      const list = await axios.get(`${backendURL}/api/contracts/user/${tdcUser.id}?limit=1&offset=0`);
      existingContractsTotal = list.data?.total ?? 0;
    } catch (_) {
      // If listing fails, still attempt creation below (it will error clearly if backend is unhealthy).
    }

    if (existingContractsTotal === 0) {
      await axios.post(`${backendURL}/api/contracts/ricardian`, {
        datasetSelections: [{ datasetId, individualPrice: 100 }],
        duration: 30,
        termsAndConditions: 'E2E seeded contract terms.',
        contractType: 'AI_TRAINING',
        privacyRequirements: {
          maxPrivacyLoss: 0.25,
          minAccuracy: 0.85,
          differentialPrivacy: true,
        },
        trainingParams: {
          privacyTechnique: 'Differential Privacy',
        },
      }, {
        headers: { Authorization: `Bearer ${tdcToken}` },
      });
    }
  }

  async cleanupTestData() {
    // Intentionally a no-op.
    // Deleting users/data requires privileged endpoints and can be disruptive to local dev.
  }
}

module.exports = {
  E2ETestDataManager,
  getBackendURL,
};

