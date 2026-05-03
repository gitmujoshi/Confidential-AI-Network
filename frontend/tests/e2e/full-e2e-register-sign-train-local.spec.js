const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Full E2E (register → login → contract sign → local training)', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(6 * 60 * 1000);

  const BACKEND_URL = getBackendURL();
  const NEW_PASSWORD = 'TestNewPassword123!';

  function uniqueEmail(prefix) {
    const ts = Date.now();
    return `pw-e2e-${prefix}-${ts}@example.com`;
  }

  async function registerUserViaUI(page, { name, email, partyType }) {
    return await test.step(`Register ${partyType} via UI`, async () => {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'User Registration', exact: true })).toBeVisible();

      await page.getByLabel('Full Name').fill(name);
      await page.getByLabel('Email').fill(email);

      // Party type selector is the 2nd combobox on the page (regression-tested in auth.spec.js)
      await page.getByRole('combobox').nth(1).click();
      await page.getByRole('option', { name: new RegExp(`\\(${partyType}\\)`, 'i') }).click();

      // Provide a deterministic public key for local testing.
      await page.getByLabel('Public Key').fill('0x' + 'b'.repeat(64));

      await page.getByRole('button', { name: /^Register$/ }).click();

      // Success alert contains the temporary credentials.
      const successAlert = page
        .getByRole('alert')
        .filter({ hasText: /Registration successful/i })
        .first();
      await expect(successAlert).toBeVisible({ timeout: 60_000 });

      const msg = (await successAlert.innerText()) || '';
      const match = msg.match(/Password:\s*([^\s]+)/i);
      if (!match) {
        throw new Error(`Registration did not expose temporary password. Success text was:\n${msg}`);
      }
      return { tempPassword: match[1] };
    });
  }

  async function loginViaUI(page, { email, password }) {
    await test.step(`Login via UI (${email})`, async () => {
      await page.goto('/login');
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await page.getByLabel(/email address/i).fill(email);
      await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 90_000 });
    });
  }

  async function completeFirstLoginPasswordViaAPI({ email, currentPassword, newPassword }) {
    await test.step(`Complete first-login password setup (API) for ${email}`, async () => {
      const res = await axios.post(`${BACKEND_URL}/api/auth/first-login-password`, {
        email,
        currentPassword,
        newPassword,
      });
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(`First-login password update failed for ${email}`);
      }
    });
  }

  async function logoutViaUI(page) {
    await test.step('Logout', async () => {
      await page.getByTitle('Logout').click({ force: true });
      await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    });
  }

  async function createDatasetViaUI(page, datasetName) {
    await test.step('Create dataset (TDP) via UI', async () => {
      await page.goto('/datasets/add');

      // Step 0: Basic Information (required: name, description, category)
      await expect(page.getByText(/Basic Information/i).first()).toBeVisible({ timeout: 60_000 });
      await page.getByLabel(/Dataset Name|Name/i).first().fill(datasetName);
      await page.getByLabel(/Description/i).first().fill('Playwright E2E dataset for full flow');
      await page.getByLabel(/License/i).first().fill('MIT');

      const categoryCombo = page.locator('text=Category').locator('xpath=following::div[@role=\"combobox\"][1]');
      await categoryCombo.scrollIntoViewIfNeeded();
      await categoryCombo.click();
      // Prefer a category that yields modality=tabular via backend inference.
      await page.getByRole('option', { name: /tabular/i }).click().catch(async () => {
        // Fallback: pick the first option in the dropdown if "tabular" isn't present.
        await page.getByRole('option').first().click();
      });

      await page.getByRole('button', { name: /next/i }).first().click();

      // Step 1: Data Details (required: size, format, source)
      await expect(page.getByText(/Data Details/i).first()).toBeVisible();
      await page.getByLabel(/Size/i).first().fill('10');
      await page.getByLabel(/Record Count/i).first().fill('100');
      await page.getByLabel(/Format/i).first().fill('csv');
      await page.getByLabel(/Source/i).first().fill('Playwright');
      await page.getByRole('button', { name: /next/i }).first().click();

      // Step 2: Privacy & Security (no strict required fields by default)
      await expect(page.getByText(/Privacy/i).first()).toBeVisible();
      // Privacy techniques is required (pick first available).
      const privacyTechniquesCombo = page
        .locator('text=Privacy Techniques')
        .locator('xpath=following::div[@role=\"combobox\"][1]');
      await privacyTechniquesCombo.scrollIntoViewIfNeeded();
      await privacyTechniquesCombo.click();
      await page.getByRole('option').first().click();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /next/i }).first().click();

      // Step 3: Security & Compliance (required: dataResidencyRegion, processingLocation)
      await expect(page.getByText(/Security/i).first()).toBeVisible();
      const dataResidencyCombo = page
        .locator('text=Data Residency Region')
        .locator('xpath=following::div[@role=\"combobox\"][1]');
      await dataResidencyCombo.scrollIntoViewIfNeeded();
      await dataResidencyCombo.click();
      await page.getByRole('option').first().click();

      const processingLocationCombo = page
        .locator('text=Processing Location')
        .locator('xpath=following::div[@role=\"combobox\"][1]');
      await processingLocationCombo.scrollIntoViewIfNeeded();
      await processingLocationCombo.click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: /next/i }).first().click();

      // Step 4: Quality & Compliance (no strict required fields by default)
      await expect(page.getByText(/Quality/i).first()).toBeVisible();
      await page.getByRole('button', { name: /next/i }).first().click();

      // Step 5: Training files (optional uploads — skip to Review)
      await expect(page.getByText(/Training files \(recommended\)/i)).toBeVisible({ timeout: 60_000 });
      await page.getByRole('button', { name: /next/i }).first().click();

      // Step 6: Review & Submit (avoid matching Stepper label "Review & Submit" while still on Training files)
      await expect(page.getByRole('heading', { name: 'Dataset Summary' })).toBeVisible({ timeout: 60_000 });
      await page.getByLabel(/Pricing/i).first().fill('1');
      const createDatasetBtn = page.getByRole('button', { name: /^Create Dataset$/ }).first();
      await expect(createDatasetBtn).toBeVisible();
      const postRespPromise = page.waitForResponse(
        (r) => r.url().includes('/api/datasets') && r.request().method() === 'POST',
        { timeout: 90_000 }
      );
      await createDatasetBtn.click();

      const postResp = await postRespPromise;
      if (!postResp.ok()) {
        const body = await postResp.text().catch(() => '');
        throw new Error(`Dataset create failed: HTTP ${postResp.status()} body=${body}`);
      }

      await expect(page).toHaveURL(/\/datasets$/, { timeout: 90_000 });
      await expect(page.getByText(datasetName, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    });
  }

  async function createContractViaUI(page, { datasetName }) {
    let contractId = null;

    async function clickNext() {
      const next = page.getByRole('button', { name: /next/i }).first();
      await expect(next).toBeVisible();
      await next.click();
    }

    await test.step('Create contract via UI wizard (select local CCRP)', async () => {
      await page.goto('/contracts/create');
      await expect(page.locator('body')).toContainText('Select Contract Template', { timeout: 30_000 });

      const firstTemplateHeading = page.locator('h3').first();
      await expect(firstTemplateHeading).toBeVisible();
      await firstTemplateHeading.click();
      await clickNext();

      await expect(page.getByRole('heading', { name: 'Contract Details & Dataset Selection' })).toBeVisible();
      // Wizard submits aiModelIds; empty/invalid selection triggers client validation.
      const aiModelsCombo = page.getByRole('combobox', { name: /AI Models/i });
      await expect(aiModelsCombo).toBeVisible();
      await aiModelsCombo.click();
      await page.getByRole('option').filter({ hasNotText: /No AI Model/i }).first().click();

      const datasetHeading = page.getByRole('heading', { name: datasetName, exact: true });
      await expect(datasetHeading).toBeVisible({ timeout: 20_000 });
      await datasetHeading.click();

      await page.getByLabel('Price (USD)').fill('100');
      await page.getByLabel('Duration (days)').fill('30');
      await page.getByLabel('Terms and Conditions').fill(`Full E2E CAN contract ${Date.now()}`);
      await clickNext();

      await expect(page.getByRole('heading', { name: 'Configure Environment & CCRP' })).toBeVisible();

      const cloudProvider = page.getByRole('combobox').nth(1);
      await cloudProvider.click();
      await page.getByRole('option', { name: /Local \(Docker\)/i }).click();

      // Prefer the CCRP registered in this flow (avoid clicking unrelated "CCRP" copy).
      await page.getByRole('heading', { name: /PW E2E CCRP User/i }).click();

      await page.getByLabel('Instance Type').fill('local');
      await page.getByLabel('CPU Requirements').fill('2');
      await page.getByLabel('Memory Requirements').fill('4');
      await page.getByLabel('Storage Requirements').fill('10');

      const kmsProvider = page.locator('text=KMS Provider').locator('xpath=following::div[@role="combobox"][1]');
      await kmsProvider.click();
      try {
        await page.getByRole('option', { name: /HashiCorp Vault/i }).click({ timeout: 2000 });
      } catch (_) {
        await page.getByRole('menuitem', { name: /HashiCorp Vault/i }).click();
      }
      await page.getByLabel('Key ID/ARN').fill('e2e-local-key');
      await page.getByLabel('Encryption Algorithm').fill('AES-256-GCM');
      await page.getByLabel('Key Rotation Period (days)').fill('90');
      await clickNext();

      await expect(page.getByRole('heading', { name: 'Review Legal Document & Smart Contract' })).toBeVisible();
      // Preview generation seems required before the Create button triggers the API call.
      await clickNext();
      await expect(page.locator('body')).toContainText('Create Contract', { timeout: 60_000 });

      const create = page.getByRole('button', { name: /Create SCITT CCF Contract/i }).first();
      await expect(create).toBeVisible();
      await create.click();

      // Either we navigate to the new contract, or we get an in-page error.
      const errorBox = page.getByText(/Contract Creation Error|Validation failed|Failed to create contract/i).first();
      await Promise.race([
        page.waitForURL(/\/contracts\/(?!create$).+/, { timeout: 120_000 }),
        errorBox.waitFor({ state: 'visible', timeout: 120_000 }),
      ]);

      // If we didn't navigate, surface the error to the test output.
      if (!/\/contracts\/(?!create$).+/.test(page.url())) {
        const msg = (await errorBox.innerText().catch(() => 'Contract creation failed (no message)')).trim();
        throw new Error(msg);
      }

      const url = page.url();
      const urlId = decodeURIComponent(url.split('/contracts/')[1]).split('?')[0];
      contractId = contractId || urlId;
      expect(contractId).toBeTruthy();

      // Canonicalize: some navigations may include numeric DB id; signing expects `contract.contractId`.
      try {
        const res = await axios.get(`${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`);
        if (res.status === 200 && res.data?.contractId) {
          contractId = res.data.contractId;
        }
      } catch (_) {
        // If the API lookup fails (e.g. numeric id in URL), extract the canonical id from the page.
        try {
          const bodyText = await page.locator('body').innerText();
          const m = bodyText.match(/RICARDIAN-[A-Za-z0-9-]+/);
          if (m && m[0]) contractId = m[0];
        } catch (_) {}
      }
    });

    return contractId;
  }

  async function signContractViaUI(page, { contractId, role }) {
    await test.step(`Sign contract as ${role}`, async () => {
      const base =
        role === 'TDP' ? '/tdp' :
        role === 'CCRP' ? '/ccrp' :
        '';
      await page.goto(`${base}/contracts/${encodeURIComponent(contractId)}`);
      await expect(page.getByText(/Contract Details/i).first()).toBeVisible({ timeout: 90_000 });

      if (role === 'TDP') {
        const primary = page.getByRole('button', { name: /Sign Contract as TDP/i }).first();
        const fallback = page.getByRole('button', { name: /^Sign$/ }).first();
        const btn = (await primary.isVisible().catch(() => false)) ? primary : fallback;
        await expect(btn).toBeVisible({ timeout: 90_000 });
        await btn.click();
        await expect(page.getByText(/signed/i).first()).toBeVisible({ timeout: 90_000 });
      } else if (role === 'CCRP') {
        const primary = page.getByRole('button', { name: /Sign Contract as CCRP/i }).first();
        const fallback = page.getByRole('button', { name: /^Sign$/ }).first();
        const btn = (await primary.isVisible().catch(() => false)) ? primary : fallback;
        await expect(btn).toBeVisible({ timeout: 90_000 });
        await btn.click();
        await expect(page.getByText(/signed/i).first()).toBeVisible({ timeout: 90_000 });
      } else {
        throw new Error(`Unsupported signing role: ${role}`);
      }
    });
  }

  async function runCanLocalTrainingViaUI(page, { contractId }) {
    let canJobId = null;
    let trainingResultsJson = null;

    await test.step('Create CAN job and run local training (UI)', async () => {
      await page.goto('/can/jobs');
      await expect(page.getByText('CAN Jobs (Local CCRP)')).toBeVisible({ timeout: 90_000 });
      await page.getByLabel('Contract ID').fill(contractId);
      await page.getByRole('button', { name: 'Create CAN Job' }).click();

      await expect(page.getByTestId('can-job-id')).not.toHaveText('(none)', { timeout: 60_000 });
      canJobId = (await page.getByTestId('can-job-id').innerText()).trim();

      await page.getByRole('button', { name: /Release DEK/i }).click();
      await page.getByRole('button', { name: /Release MEK/i }).click();
      await page.getByRole('button', { name: /Release Job/i }).click();
      await page.getByRole('button', { name: /Wait for Training/i }).click();

      await expect(page.getByTestId('can-training-status')).toHaveText('COMPLETED', { timeout: 90_000 });
      await expect(page.getByText('Training results')).toBeVisible();
      trainingResultsJson = await page.getByTestId('can-training-results-json').innerText();
    });

    return { canJobId, trainingResultsJson };
  }

  async function loginViaAPI({ email, password }) {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
    const token = res.data?.accessToken;
    const user = res.data?.user;
    if (!token || !user) {
      throw new Error(`API login failed for ${email}`);
    }
    return { token, user };
  }

  async function signContractViaAPI({ contractId, email, password, partyType }) {
    await test.step(`Sign contract via API as ${partyType}`, async () => {
      const { token, user } = await loginViaAPI({ email, password });
      // Confirm contract exists and get canonical contractId.
      let signingData;
      try {
        signingData = await axios.get(
          `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/signing-data`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        let publicGetStatus = 'n/a';
        try {
          const r = await axios.get(`${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`);
          publicGetStatus = String(r.status);
        } catch (e2) {
          publicGetStatus = String(e2?.response?.status || e2?.message || 'unknown');
        }
        const status = e?.response?.status;
        const body = e?.response?.data ? JSON.stringify(e.response.data) : '';
        throw new Error(`signing-data failed for contractId="${contractId}" status=${status} publicGet=${publicGetStatus} body=${body}`);
      }
      const canonicalContractId = signingData.data?.contractId || contractId;

      const signaturePayload = {
        signature: '0x' + 'c'.repeat(128),
        partyType,
        timestamp: new Date().toISOString(),
        walletAddress: user.walletAddress || null,
        did: user.did || null,
      };

      const res = await axios.post(
        `${BACKEND_URL}/api/contracts/${encodeURIComponent(canonicalContractId)}/sign`,
        signaturePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(`API sign failed for ${partyType}: HTTP ${res.status}`);
      }
    });
  }

  test('Full flow with new users and local training', async ({ page }, testInfo) => {
    const tdcEmail = uniqueEmail('tdc');
    const tdpEmail = uniqueEmail('tdp');
    const ccrpEmail = uniqueEmail('ccrp');

    let tdcTempPassword;
    let tdpTempPassword;
    let ccrpTempPassword;

    let contractId;
    let canJobId;
    let trainingResultsJson;
    let trainingJobId;

    // Register all roles (each registration yields a temp password in the UI success message).
    tdcTempPassword = (await registerUserViaUI(page, { name: 'PW E2E TDC User', email: tdcEmail, partyType: 'TDC' })).tempPassword;
    tdpTempPassword = (await registerUserViaUI(page, { name: 'PW E2E TDP User', email: tdpEmail, partyType: 'TDP' })).tempPassword;
    ccrpTempPassword = (await registerUserViaUI(page, { name: 'PW E2E CCRP User', email: ccrpEmail, partyType: 'CCRP' })).tempPassword;

    await testInfo.attach('registered-users.json', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({
        tdcEmail,
        tdcTempPassword,
        tdpEmail,
        tdpTempPassword,
        ccrpEmail,
        ccrpTempPassword,
      }, null, 2), 'utf8'),
    });

    // First login setup for each role (sets NEW_PASSWORD).
    await completeFirstLoginPasswordViaAPI({ email: tdcEmail, currentPassword: tdcTempPassword, newPassword: NEW_PASSWORD });
    await completeFirstLoginPasswordViaAPI({ email: tdpEmail, currentPassword: tdpTempPassword, newPassword: NEW_PASSWORD });
    await completeFirstLoginPasswordViaAPI({ email: ccrpEmail, currentPassword: ccrpTempPassword, newPassword: NEW_PASSWORD });

    await loginViaUI(page, { email: tdpEmail, password: NEW_PASSWORD });
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 90_000 });

    const datasetName = `PW E2E Dataset ${Date.now()}`;
    await createDatasetViaUI(page, datasetName);
    await logoutViaUI(page);

    // TDC creates contract selecting the dataset (and local CCRP).
    await loginViaUI(page, { email: tdcEmail, password: NEW_PASSWORD });
    contractId = await createContractViaUI(page, { datasetName });
    await logoutViaUI(page);

    // Signing: prefer UI, but the contract detail endpoint is currently unreliable for non-TDC roles.
    // Use API signing to keep the full E2E flow deterministic.
    await signContractViaAPI({ contractId, email: tdpEmail, password: NEW_PASSWORD, partyType: 'TDP' });
    await signContractViaAPI({ contractId, email: ccrpEmail, password: NEW_PASSWORD, partyType: 'CCRP' });

    // TDC runs CAN job + local training.
    await loginViaUI(page, { email: tdcEmail, password: NEW_PASSWORD });
    ({ canJobId, trainingResultsJson } = await runCanLocalTrainingViaUI(page, { contractId }));

    await test.step('Attach backend artifacts to report (best-effort)', async () => {
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

      // Use a fresh token for the report pulls (backend APIs).
      let token = null;
      try {
        const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email: tdcEmail, password: NEW_PASSWORD });
        token = res.data?.accessToken || null;
      } catch (_) {
        // ignore
      }

      const canHeaders = { 'X-CAN-Principal-Id': 'did:can:dp:e2e' };
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

      try {
        const att = await axios.get(`${BACKEND_URL}/api/can/jcs/jobs/${encodeURIComponent(canJobId)}/attestation`, { headers: canHeaders });
        await testInfo.attach('can-attestation.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(att.data, null, 2), 'utf8'),
        });
      } catch (_) {}

      try {
        const prov = await axios.get(`${BACKEND_URL}/api/can/provenance/jobs/${encodeURIComponent(canJobId)}/events`, { headers: canHeaders });
        await testInfo.attach('can-provenance-events.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(prov.data, null, 2), 'utf8'),
        });
      } catch (_) {}

      try {
        const tj = await axios.get(`${BACKEND_URL}/api/can/jcs/jobs/${encodeURIComponent(canJobId)}/training`, { headers: canHeaders });
        trainingJobId = tj.data?.data?.jobId || tj.data?.data?.job?.jobId || null;
        await testInfo.attach('can-training-job.json', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(tj.data, null, 2), 'utf8'),
        });
      } catch (_) {}

      if (trainingJobId && authHeaders) {
        try {
          const jobProv = await axios.get(
            `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(trainingJobId)}/provenance-report`,
            { headers: authHeaders }
          );
          await testInfo.attach('training-job-provenance-report.json', {
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(jobProv.data, null, 2), 'utf8'),
          });
        } catch (_) {}
      }

      if (authHeaders) {
        try {
          const audit = await axios.get(`${BACKEND_URL}/api/scitt-ccf/provenance-report/${encodeURIComponent(contractId)}`, {
            headers: authHeaders,
          });
          await testInfo.attach('contract-audit-bundle.json', {
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(audit.data, null, 2), 'utf8'),
          });
        } catch (_) {}
      }

      await testInfo.attach('final-page.png', {
        contentType: 'image/png',
        body: await page.screenshot({ fullPage: true }),
      });
    });
  });
});

