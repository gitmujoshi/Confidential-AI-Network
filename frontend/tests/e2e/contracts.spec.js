const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Contract Management E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  const SEEDED_DATASET_ID = 'e2e-dataset-1';

  async function authenticateViaApi(page) {
    const backendURL = getBackendURL();
    const email = 'tdc.healthcare.2025-09-05t20-39-55@test.com';
    const password = 'TestNewPassword123!';

    const loginResponse = await axios.post(`${backendURL}/api/auth/login`, { email, password });
    const { accessToken, user } = loginResponse.data || {};
    if (!accessToken || !user) throw new Error('API login did not return accessToken/user');

    // Seed auth into browser storage before navigation.
    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { token: accessToken, u: user });

    return { accessToken, user, backendURL };
  }

  test.beforeEach(async ({ page }) => {
    await authenticateViaApi(page);
    await page.goto('/contracts');
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  test('should navigate to contracts page', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page).toHaveURL(/.*\/contracts/);
    // TDC → "Contracts", TDP → "My Contracts"; avoid strict-mode issues if multiple headings match
    await expect(page.getByRole('heading', { name: /^(Contracts|My Contracts)$/ }).first()).toBeVisible({
      timeout: 60000,
    });
  });

  test('should create a new contract', async ({ page }) => {
    await page.goto('/contracts');
    
    // Click create contract button
    const createBtn = page.getByRole('main').getByRole('button', { name: 'Create Contract', exact: true });
    await createBtn.scrollIntoViewIfNeeded();
    await createBtn.click({ force: true });
    
    // Should be on contract creation page
    await expect(page).toHaveURL(/.*\/contracts\/create/);
    await expect(page.getByRole('heading', { name: /create contract/i })).toBeVisible();
  });

  test('should view contract details', async ({ page }) => {
    const { accessToken, user, backendURL } = await authenticateViaApi(page);

    // Create a contract via API to make the test independent of flaky contract-list endpoints.
    // Ensure seeded dataset exists (create if needed).
    try {
      await axios.get(`${backendURL}/api/datasets/${SEEDED_DATASET_ID}`);
    } catch (err) {
      if (err.response?.status !== 404) throw err;

      // Create dataset as the seeded TDP.
      const tdpLogin = await axios.post(`${backendURL}/api/auth/login`, {
        email: 'tdp.e2e@test.com',
        password: 'TestNewPassword123!',
      });
      const tdpUserId = tdpLogin.data?.user?.id;
      expect(tdpUserId).toBeTruthy();

      await axios.post(`${backendURL}/api/datasets`, {
        datasetId: SEEDED_DATASET_ID,
        name: 'E2E Sample Dataset',
        description: 'Seeded dataset for Playwright E2E tests',
        category: 'Tabular',
        size: 10,
        recordCount: 1000,
        price: 100,
        license: 'E2E-LICENSE',
        tags: ['e2e', 'seed'],
        metadata: { seededBy: 'playwright' },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdpUserId,
      });
    }

    const create = await axios.post(`${backendURL}/api/contracts/ricardian`, {
      datasetSelections: [{ datasetId: SEEDED_DATASET_ID, individualPrice: 100 }],
      duration: 30,
      termsAndConditions: `E2E contract terms ${Date.now()}`,
      contractType: 'AI_TRAINING',
      privacyRequirements: { maxPrivacyLoss: 0.25, minAccuracy: 0.85, differentialPrivacy: true },
      trainingParams: { privacyTechnique: 'Differential Privacy' },
    }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const contractId = create.data?.contract?.contractId;
    expect(contractId).toBeTruthy();

    // Navigate directly to contract detail route to avoid flaky list rendering.
    await page.goto(`/contracts/${contractId}`);
    await expect(page).toHaveURL(new RegExp(`/contracts/${contractId}$`));

    // Assert we landed on a detail view (heading varies across roles/pages).
    await expect(
      page.getByRole('heading', { name: /contract/i }).first()
    ).toBeVisible();
  });

  // The edit/sign/delete flows vary significantly by contract status and require seeded contracts.
  // They should be covered by dedicated workflow tests that set up contracts explicitly.
}); 