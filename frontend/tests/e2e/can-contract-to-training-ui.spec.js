const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('CAN local flow via UI (create contract → training)', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';
  const TDC_EMAIL = 'tdc.healthcare.2025-09-05t20-39-55@test.com';

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
    const next = page.getByRole('button', { name: /next/i }).first();
    await expect(next).toBeVisible();
    await next.click();
  }

  test('Create contract in wizard UI, then run CAN job in UI', async ({ page }, testInfo) => {
    const { token, user } = await login(TDC_EMAIL);
    await seedAuth(page, { token, user });

    let contractId;
    let canJobId;
    let trainingResultsJson;
    let trainingJobId;

    await test.step('Open contract creation wizard', async () => {
      await page.goto('/contracts/create');
      await expect(page.locator('h5', { hasText: 'Select Contract Template' })).toBeVisible();
    });

    await test.step('Select a contract template', async () => {
      const firstTemplateHeading = page.locator('h3').first();
      await expect(firstTemplateHeading).toBeVisible();
      await firstTemplateHeading.click();
      await clickNext(page);
    });

    await test.step('Select E2E dataset and enter basic contract details', async () => {
      await expect(page.getByRole('heading', { name: 'Contract Details & Dataset Selection' })).toBeVisible();
      const aiModelsCombo = page.getByRole('combobox', { name: /AI Models/i });
      await expect(aiModelsCombo).toBeVisible();
      await aiModelsCombo.click();
      // E2E Test Model 1 is vision (ResNet); selecting it filters out Tabular datasets like the seeded
      // "E2E Sample Dataset". Prefer no model so modality filtering is off (see CreateRicardianContract
      // compatibleDatasets), then pick the seeded dataset card by accessible name.
      await page.getByRole('option', { name: /No AI Model \(Optional\)/i }).click();

      const datasetCard = page
        .locator('.MuiCard-root')
        .filter({ has: page.getByRole('heading', { name: 'E2E Sample Dataset', exact: true }) })
        .first();
      await expect(datasetCard).toBeVisible({ timeout: 20_000 });
      await datasetCard.click();

      // Contract details fields (labels are stable).
      await page.getByLabel('Price (USD)').fill('100');
      await page.getByLabel('Duration (days)').fill('30');
      await page.getByLabel('Terms and Conditions').fill(`E2E CAN UI contract ${Date.now()}`);

      await clickNext(page);
    });

    await test.step('Configure environment, select Local CCRP, and fill KMS fields', async () => {
      await expect(page.getByRole('heading', { name: 'Configure Environment & CCRP' })).toBeVisible();

      // Pick local CCRP using the cloud provider filter and CCRP card.
      const cloudProvider = page.getByRole('combobox').nth(1);
      await cloudProvider.click();
      await page.getByRole('option', { name: /Local \(Docker\)/i }).click();

      await page.getByText('CCRP E2E User').click();

      // Environment/KMS fields (wizard can validate these; fill to avoid blocking).
      await page.getByLabel('Instance Type').fill('local');
      await page.getByLabel('CPU Requirements').fill('2');
      await page.getByLabel('Memory Requirements').fill('4');
      await page.getByLabel('Storage Requirements').fill('10');

      // KMS section fields.
      const kmsProvider = page
        .locator('text=KMS Provider')
        .locator('xpath=following::div[@role="combobox"][1]');
      await kmsProvider.click();
      try {
        await page.getByRole('option', { name: /HashiCorp Vault/i }).click({ timeout: 2000 });
      } catch (_) {
        await page.getByRole('menuitem', { name: /HashiCorp Vault/i }).click();
      }
      await page.getByLabel('Key ID/ARN').fill('e2e-local-key');
      await page.getByLabel('Encryption Algorithm').fill('AES-256-GCM');
      await page.getByLabel('Key Rotation Period (days)').fill('90');

      await clickNext(page);
    });

    await test.step('Review and create contract', async () => {
      await expect(page.getByRole('heading', { name: 'Review Legal Document & Smart Contract' })).toBeVisible();
      await clickNext(page);

      const create = page.getByRole('button', { name: /create contract/i });
      await expect(create).toBeVisible();
      await create.click();

      // Wizard navigates to contract detail.
      await page.waitForURL(/\/contracts\/.+/);
      const url = page.url();
      contractId = decodeURIComponent(url.split('/contracts/')[1]);
      expect(contractId).toBeTruthy();
    });

    await test.step('Open CAN Jobs UI and create job for new contract', async () => {
      await page.goto('/can/jobs');
      await expect(page.getByText('CAN Jobs (Local CCRP)')).toBeVisible();
      await page.getByLabel('Contract ID').fill(contractId);
      await page.getByRole('button', { name: 'Create CAN Job' }).click();

      // Job id chip should appear.
      await expect(page.getByText(/^Job ID:/)).toBeVisible();
      await expect(page.getByTestId('can-job-id')).not.toHaveText('(none)');
      canJobId = (await page.getByTestId('can-job-id').innerText()).trim();
    });

    await test.step('Release keys, release job, and wait for training completion', async () => {
      await page.getByRole('button', { name: /Release DEK/i }).click();
      await page.getByRole('button', { name: /Release MEK/i }).click();
      await page.getByRole('button', { name: /Release Job/i }).click();
      await page.getByRole('button', { name: /Wait for Training/i }).click();

      await expect(page.getByTestId('can-training-status')).toHaveText('COMPLETED', { timeout: 45_000 });

      // Capture results JSON from UI (for report attachments).
      await expect(page.getByText('Training results')).toBeVisible();
      trainingResultsJson = await page.getByTestId('can-training-results-json').innerText();
    });

    await test.step('Attach artifacts to the HTML report', async () => {
      await testInfo.attach('ids.json', {
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify({ contractId, canJobId }, null, 2), 'utf8'),
      });
      if (trainingResultsJson) {
        await testInfo.attach('training-results.json', {
          contentType: 'application/json',
          body: Buffer.from(trainingResultsJson, 'utf8'),
        });
      }

      // Pull additional operational attachments (best-effort; do not fail test if unavailable).
      const canHeaders = { 'X-CAN-Principal-Id': 'did:can:dp:ui' };
      const authHeaders = { Authorization: `Bearer ${token}` };

      try {
        const att = await axios.get(`${BACKEND_URL}/api/can/jcs/jobs/${encodeURIComponent(canJobId)}/attestation`, {
          headers: canHeaders,
        });
        await testInfo.attach('can-attestation.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(att.data, null, 2), 'utf8'),
        });
      } catch (_) {
        // ignore
      }

      try {
        const prov = await axios.get(`${BACKEND_URL}/api/can/provenance/jobs/${encodeURIComponent(canJobId)}/events`, {
          headers: canHeaders,
        });
        await testInfo.attach('can-provenance-events.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(prov.data, null, 2), 'utf8'),
        });
      } catch (_) {
        // ignore
      }

      try {
        const tj = await axios.get(`${BACKEND_URL}/api/can/jcs/jobs/${encodeURIComponent(canJobId)}/training`, {
          headers: canHeaders,
        });
        trainingJobId = tj.data?.data?.jobId || tj.data?.data?.job?.jobId || null;
        await testInfo.attach('can-training-job.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(tj.data, null, 2), 'utf8'),
        });
      } catch (_) {
        // ignore
      }

      if (trainingJobId) {
        try {
          const jobProv = await axios.get(
            `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(trainingJobId)}/provenance-report`,
            { headers: authHeaders }
          );
          await testInfo.attach('training-job-provenance-report.json', {
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(jobProv.data, null, 2), 'utf8'),
          });
        } catch (_) {
          // ignore
        }
      }

      try {
        const audit = await axios.get(`${BACKEND_URL}/api/scitt-ccf/provenance-report/${encodeURIComponent(contractId)}`, {
          headers: authHeaders,
        });
        await testInfo.attach('contract-audit-bundle.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(audit.data, null, 2), 'utf8'),
        });
      } catch (_) {
        // ignore
      }

      await testInfo.attach('final-page.png', {
        contentType: 'image/png',
        body: await page.screenshot({ fullPage: true }),
      });
    });
  });
});

