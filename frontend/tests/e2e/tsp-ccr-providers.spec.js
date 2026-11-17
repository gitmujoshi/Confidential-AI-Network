const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');
const { fillKmsFields } = require('./helpers/contract-wizard');
const { ensurePartySigningReady } = require('./helpers/party-signing-e2e');
const { prepareFullPageCapture } = require('./helpers/full-page-shot');

/**
 * Local TSP CCR completion stays in can-contract-to-training-ui.spec.js.
 * This file checks the contract form for Local, Azure, and GCP, then starts
 * Azure and GCP training and expects a fail-closed result when no kubeconfig is set.
 */
test.describe('TSP CCR providers', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';
  const TDC_EMAIL = 'tdc.healthcare.2025-09-05t20-39-55@test.com';

  const CLOUD = {
    Azure: {
      email: 'tsp.azure.e2e@test.com',
      filter: /Azure/i,
      heading: 'Azure cluster',
      field: 'AKS cluster name',
      cluster: 'can-e2e-aks',
      mode: 'azure-ccr',
      kubeconfig: /AZURE_CCR_KUBECONFIG/i,
      account: {
        subscriptionId: '00000000-0000-4000-8000-0000000000a2',
        resourceGroup: 'can-e2e-training',
        clusterName: 'can-e2e-aks',
        namespace: 'contract-management',
        location: 'eastus',
        storageAccount: 'cane2edatasets',
        keyVaultUri: 'https://can-e2e-kv.vault.azure.net/',
      },
    },
    GCP: {
      email: 'tsp.gcp.e2e@test.com',
      filter: /GCP/i,
      heading: 'GCP cluster',
      field: 'GKE cluster name',
      cluster: 'can-e2e-gke',
      mode: 'gcp-ccr',
      kubeconfig: /GCP_CCR_KUBECONFIG/i,
      account: {
        projectId: 'can-e2e-gcp',
        location: 'us-central1',
        clusterName: 'can-e2e-gke',
        namespace: 'contract-management',
        bucket: 'can-e2e-datasets',
      },
    },
  };

  async function login(email) {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password: PASSWORD });
    if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
      throw new Error(`Login failed for ${email}`);
    }
    return { token: res.data.accessToken, user: res.data.user };
  }

  async function seedAuth(page, { token, user }) {
    await page.addInitScript(({ t, u }) => {
      localStorage.setItem('authToken', t);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { t: token, u: user });
  }

  async function clickNext(page) {
    await page.keyboard.press('Escape').catch(() => {});
    const next = page.getByRole('button', { name: /^next$/i }).last();
    await expect(next).toBeVisible();
    await next.click({ force: true });
  }

  async function reachEnvironmentStep(page) {
    await page.goto('/contracts/create');
    await expect(page.locator('h5', { hasText: 'Select Contract Template' })).toBeVisible();
    const selectTemplate = page.getByRole('button', { name: 'Select This Template' }).first();
    await expect(selectTemplate).toBeVisible();
    await selectTemplate.click();
    await expect(page.getByText(/Selected Template:/i)).toBeVisible();
    await clickNext(page);

    const detailsHeading = page.getByRole('heading', { name: 'Contract Details & Dataset Selection' });
    const advanced = await detailsHeading
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (!advanced) {
      await clickNext(page);
      await expect(detailsHeading).toBeVisible();
    }
    const aiModels = page.getByRole('combobox', { name: /AI Models/i });
    await aiModels.click();
    await page.getByRole('option', { name: /No AI Model \(Optional\)/i }).click();
    const datasetCard = page
      .locator('.MuiCard-root')
      .filter({ has: page.getByRole('heading', { name: 'E2E Sample Dataset', exact: true }) })
      .first();
    await expect(datasetCard).toBeVisible({ timeout: 20_000 });
    await datasetCard.click();
    await page.getByLabel('Price (USD)').fill('100');
    await page.getByLabel('Duration (days)').fill('30');
    await page.getByLabel('Terms and Conditions').fill(`CCR provider form ${Date.now()}`);
    await clickNext(page);
    await expect(page.getByRole('heading', { name: 'TSP Selection (Required)' })).toBeVisible();
  }

  async function filterProvider(page, optionRe) {
    const control = page.locator('.MuiFormControl-root').filter({ hasText: 'Cloud Provider' }).first();
    await control.scrollIntoViewIfNeeded();
    await control.getByRole('combobox').click({ force: true });
    await page.getByRole('option', { name: optionRe }).click({ force: true });
    await page.keyboard.press('Escape').catch(() => {});
    await expect(page.locator('.MuiModal-root')).toHaveCount(0, { timeout: 5_000 }).catch(() => {});
  }

  const TOUR_DIR = path.resolve(__dirname, '../../../docs/blogs/assets/ccr');

  async function saveTourShot(page, fileName) {
    fs.mkdirSync(TOUR_DIR, { recursive: true });
    await prepareFullPageCapture(page);
    await page.screenshot({
      path: path.join(TOUR_DIR, fileName),
      fullPage: true,
      animations: 'disabled',
    });
  }

  async function selectTsp(page, email) {
    const card = page.locator('[data-testid^="tsp-card-"]').filter({ hasText: email });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.click({ force: true });
    await expect(card).toHaveAttribute('data-selected', 'true');
  }

  test('Local TSP contract form does not ask for a cloud cluster', async ({ page }) => {
    test.setTimeout(3 * 60 * 1000);
    const { token, user } = await login(TDC_EMAIL);
    await seedAuth(page, { token, user });
    await reachEnvironmentStep(page);
    await filterProvider(page, /Local \(Docker\)/i);
    await selectTsp(page, 'ccrp.e2e@test.com');
    await expect(page.getByRole('heading', { name: 'Azure cluster' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'GCP cluster' })).toHaveCount(0);
    await saveTourShot(page, '01-local-tsp-environment.png');
  });

  test('Azure and GCP contract forms collect the TSP cluster', async ({ page }) => {
    test.setTimeout(3 * 60 * 1000);
    const { token, user } = await login(TDC_EMAIL);
    await seedAuth(page, { token, user });
    await reachEnvironmentStep(page);

    await filterProvider(page, CLOUD.Azure.filter);
    await selectTsp(page, CLOUD.Azure.email);
    await expect(page.getByRole('heading', { name: CLOUD.Azure.heading })).toBeVisible();
    await expect(page.getByLabel(CLOUD.Azure.field)).toBeVisible();
    await page.getByLabel('Subscription ID').fill(CLOUD.Azure.account.subscriptionId);
    await page.getByLabel(CLOUD.Azure.field).fill(CLOUD.Azure.cluster);
    await saveTourShot(page, '02-azure-cluster-contract.png');

    await filterProvider(page, CLOUD.GCP.filter);
    await selectTsp(page, CLOUD.GCP.email);
    await expect(page.getByRole('heading', { name: CLOUD.GCP.heading })).toBeVisible();
    await expect(page.getByLabel(CLOUD.GCP.field)).toBeVisible();
    await page.getByLabel('Project ID').fill(CLOUD.GCP.account.projectId);
    await page.getByLabel(CLOUD.GCP.field).fill(CLOUD.GCP.cluster);
    await saveTourShot(page, '03-gcp-cluster-contract.png');
    await fillKmsFields(page);
  });

  for (const provider of ['Azure', 'GCP']) {
    test(`${provider} TSP dashboard names the existing cluster`, async ({ page }) => {
      test.setTimeout(2 * 60 * 1000);
      const spec = CLOUD[provider];
      const { token, user } = await login(spec.email);
      await seedAuth(page, { token, user });
      await page.goto('/tsp/dashboard');
      await expect(page.getByRole('heading', { name: 'Cloud Provider' })).toBeVisible({ timeout: 30_000 });
      await page.getByTestId('edit-cloud-provider').click();
      await expect(page.getByLabel('Kubeconfig path')).toBeVisible();
      await expect(page.getByLabel(spec.field)).toHaveValue(spec.cluster);
      const fileName = provider === 'Azure' ? '04-azure-tsp-cluster.png' : '05-gcp-tsp-cluster.png';
      await saveTourShot(page, fileName);
      await page.getByRole('button', { name: 'Cancel' }).click();
    });
  }

  for (const provider of ['Azure', 'GCP']) {
    test(`${provider} TSP CCR start fails closed without a kubeconfig`, async ({ page }) => {
      test.setTimeout(3 * 60 * 1000);
      const spec = CLOUD[provider];
      const { token, user } = await login(TDC_EMAIL);
      const headers = { Authorization: `Bearer ${token}` };

      const datasets = await axios.get(`${BACKEND_URL}/api/datasets`, { headers });
      const list = datasets.data.datasets || datasets.data;
      const dataset = (Array.isArray(list) ? list : []).find(
        (row) => row.datasetId && row.owner?.email
      );
      expect(dataset, 'need a dataset with an owner email').toBeTruthy();

      const model = await axios.get(`${BACKEND_URL}/api/ai-models/e2e-model-tabular-logreg`);
      expect(model.data?.id, 'seeded tabular model id').toBeTruthy();

      const tsps = await axios.get(`${BACKEND_URL}/api/users/tsp`, { headers });
      const tsp = (Array.isArray(tsps.data) ? tsps.data : []).find((row) => row.email === spec.email);
      expect(tsp, `${spec.email} must be seeded`).toBeTruthy();

      const created = await axios.post(
        `${BACKEND_URL}/api/contracts/ricardian`,
        {
          datasetSelections: [{ datasetId: dataset.datasetId, individualPrice: 100 }],
          aiModelIds: [model.data.id],
          duration: 30,
          price: 100,
          termsAndConditions: `${provider} CCR fail-closed e2e ${Date.now()}`,
          tspId: tsp.id,
          tspCloudProvider: provider,
          environmentSpecs: { type: 'cloud', cloudAccounts: { [provider]: spec.account } },
          trainingParams: { maxEpochs: 1, batchSize: 8, learningRate: 0.001 },
        },
        { headers }
      );
      const contract = created.data.contract || created.data;
      const contractId = contract.contractId;
      expect(contractId).toBeTruthy();

      for (const signer of [
        { email: dataset.owner.email, partyType: 'TDP' },
        { email: spec.email, partyType: 'TSP' },
      ]) {
        const session = await login(signer.email);
        await ensurePartySigningReady({
          accessToken: session.token,
          partyType: signer.partyType,
        });
        const signed = await axios.post(
          `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/sign`,
          {
            signature: `0x${'ab'.repeat(64)}`,
            partyType: signer.partyType,
            timestamp: new Date().toISOString(),
          },
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        expect(signed.data.success).toBe(true);
      }

      await seedAuth(page, { token, user });
      await page.goto('/tdc/training');
      const card = page.locator('.MuiCard-root').filter({ hasText: contractId });
      await expect(card).toBeVisible({ timeout: 30_000 });

      const startResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/tdc/training/contracts/${contractId}/start`) &&
          response.request().method() === 'POST'
      );
      await card.getByRole('button', { name: 'Start training' }).click();
      const response = await startResponse;
      expect(response.status()).toBe(502);
      const body = await response.json();
      expect(body.error).toMatch(spec.kubeconfig);

      await expect(page.getByText(spec.kubeconfig)).toBeVisible({ timeout: 15_000 });
      await page.reload();
      const refreshed = page.locator('.MuiCard-root').filter({ hasText: contractId });
      await expect(refreshed.getByText('FAILED', { exact: true })).toBeVisible({ timeout: 20_000 });
      await refreshed.getByRole('button', { name: 'View details' }).click();
      await expect(page.getByText(spec.mode, { exact: true })).toBeVisible();
    });
  }
});
