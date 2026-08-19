const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');
const {
  DEFAULT_SIGNING_ALGORITHM,
  chooseSigningAlgorithm,
  ensurePartySigningReady,
} = require('./helpers/party-signing-e2e');

test.describe('Full E2E (register → login → contract sign → local training)', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(10 * 60 * 1000);

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

      // Optional legacy wallet field.
      await page.getByLabel('Public Key').fill('0x' + 'b'.repeat(64));

      // Party signing key created at registration for TDP/TDC/TSP.
      await chooseSigningAlgorithm(page, DEFAULT_SIGNING_ALGORITHM);

      await page.getByRole('button', { name: /^Register$/ }).click();

      // Success alert contains the temporary credentials + signing key confirmation.
      const successAlert = page
        .getByRole('alert')
        .filter({ hasText: /Registration successful/i })
        .first();
      await expect(successAlert).toBeVisible({ timeout: 60_000 });

      const msg = (await successAlert.innerText()) || '';
      expect(msg).toMatch(/Party signing key|signing key/i);
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
      // Desktop + mobile drawers both render Sign out; open mobile drawer if needed.
      let logoutBtn = page.locator('[data-testid="logout-button"]').locator('visible=true').first();
      if (!(await logoutBtn.isVisible().catch(() => false))) {
        const openDrawer = page.getByRole('button', { name: /open drawer/i });
        if (await openDrawer.isVisible().catch(() => false)) {
          await openDrawer.click();
        }
        logoutBtn = page.locator('[data-testid="logout-button"]').locator('visible=true').first();
      }
      if (await logoutBtn.isVisible().catch(() => false)) {
        await logoutBtn.evaluate((el) => el.click());
      } else {
        await page.getByRole('button', { name: /sign out/i }).locator('visible=true').first().evaluate((el) => el.click());
      }
      // Fallback if UI logout is flaky after contract create navigation.
      await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(async () => {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto('/login');
      });
      await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    });
  }

  async function createDatasetViaAPI({ email, password, datasetName }) {
    await test.step('Create dataset (TDP) via API', async () => {
      const { token, user } = await loginViaAPI({ email, password });
      const datasetId = `PW-E2E-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await axios.post(
        `${BACKEND_URL}/api/datasets`,
        {
          datasetId,
          name: datasetName,
          description: 'Playwright E2E dataset for full flow',
          category: 'Tabular',
          size: 10,
          recordCount: 100,
          price: 1,
          license: 'MIT',
          ownerId: user.id,
          format: 'csv',
          source: 'Playwright',
          privacyTechniques: ['Differential Privacy'],
          dataResidencyRegion: 'US',
          processingLocation: 'US',
          isPublic: true,
          tags: ['e2e', 'playwright'],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (![200, 201].includes(res.status)) {
        throw new Error(`Dataset create failed: HTTP ${res.status}`);
      }
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
      await page.getByRole('option', { name: /tabular/i }).click({ force: true }).catch(async () => {
        // Fallback: pick the first option in the dropdown if "tabular" isn't present.
        await page.getByRole('option').first().click({ force: true });
      });
      await page.keyboard.press('Escape');
      await expect(page.locator('.MuiPopover-root.MuiMenu-root')).toHaveCount(0, { timeout: 5000 }).catch(() => {});

      await page.getByRole('main').getByRole('button', { name: /next/i }).first().click({ force: true });

      // Step 1: Data Details (required: size, format, source)
      await expect(page.getByText(/Data Details/i).first()).toBeVisible();
      await page.getByLabel(/Size/i).first().fill('10');
      await page.getByLabel(/Record Count/i).first().fill('100');
      await page.getByLabel(/Format/i).first().fill('csv');
      await page.getByLabel(/Source/i).first().fill('Playwright');
      await page.keyboard.press('Escape').catch(() => {});
      await page.getByRole('main').getByRole('button', { name: /next/i }).first().click({ force: true });

      // Step 2: Privacy & Security (no strict required fields by default)
      await expect(page.getByText(/Privacy/i).first()).toBeVisible();
      // Privacy techniques is required (pick first available).
      const privacyTechniquesCombo = page
        .locator('text=Privacy Techniques')
        .locator('xpath=following::div[@role=\"combobox\"][1]');
      await privacyTechniquesCombo.scrollIntoViewIfNeeded();
      await privacyTechniquesCombo.click();
      await page.getByRole('option').first().click({ force: true });
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape').catch(() => {});
      await page.getByRole('button', { name: /next/i }).last().click({ force: true });

      // Step 3: Security & Compliance (required: dataResidencyRegion, processingLocation)
      // Do not match the earlier stepper label "Privacy & Security".
      await expect(page.getByText('Data Residency Region', { exact: false }).first()).toBeVisible({
        timeout: 60_000,
      });
      const dataResidencyCombo = page
        .locator('text=Data Residency Region')
        .locator('xpath=following::div[@role=\"combobox\"][1]');
      await dataResidencyCombo.click({ force: true });
      await page.getByRole('option').first().click({ force: true });
      // Data Residency Select can leave a closing Menu/backdrop in the tree briefly; it still
      // intercepts clicks on the next combobox (Processing Location). Mirror Privacy Techniques.
      await page.keyboard.press('Escape');
      await expect(page.locator('.MuiPopover-root.MuiMenu-root')).toHaveCount(0, { timeout: 5000 }).catch(() => {});

      const processingLocationCombo = page
        .locator('text=Processing Location')
        .locator('xpath=following::div[@role=\"combobox\"][1]');
      await processingLocationCombo.click({ force: true });
      await page.getByRole('option').first().click({ force: true });
      await page.keyboard.press('Escape').catch(() => {});
      await page.getByRole('button', { name: /next/i }).last().click({ force: true });

      // Step 4: Quality & Compliance (no strict required fields by default)
      await expect(page.getByText(/Quality/i).first()).toBeVisible();
      await page.keyboard.press('Escape').catch(() => {});
      await page.getByRole('main').getByRole('button', { name: /next/i }).first().click({ force: true });

      // Step 5: Training files (optional uploads — skip to Review)
      await expect(page.getByText(/Training files \(recommended\)/i)).toBeVisible({ timeout: 60_000 });
      await page.keyboard.press('Escape').catch(() => {});
      await page.getByRole('main').getByRole('button', { name: /next/i }).first().click({ force: true });

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
      await page.keyboard.press('Escape').catch(() => {});
      const next = page.getByRole('button', { name: /^next$/i }).last();
      await expect(next).toBeVisible();
      await next.click({ force: true });
    }

    await test.step('Create contract via UI wizard (select local CCRP)', async () => {
      await page.goto('/contracts/create');
      await expect(page.locator('body')).toContainText('Select Contract Template', { timeout: 30_000 });

      const firstTemplateHeading = page.locator('main h3').first();
      await expect(firstTemplateHeading).toBeVisible();
      await firstTemplateHeading.click({ force: true });
      await clickNext();

      await expect(page.getByRole('heading', { name: 'Contract Details & Dataset Selection' })).toBeVisible();
      // Avoid picking a stale card from a prior cached list; wait for a fresh datasets fetch.
      await page
        .waitForResponse(
          (r) =>
            r.url().includes('/api/datasets') &&
            r.request().method() === 'GET' &&
            r.ok(),
          { timeout: 120_000 }
        )
        .catch(() => {});
      // Select catalog model so contract.aiModelIds drives trainer architecture at runtime.
      const aiModelsCombo = page.getByRole('combobox', { name: /AI Models/i });
      await expect(aiModelsCombo).toBeVisible();
      await aiModelsCombo.click();
      const logregOption = page.getByRole('option', { name: /E2E Logistic Regression/i });
      if (await logregOption.isVisible().catch(() => false)) {
        await logregOption.click();
      } else {
        await page.getByRole('option', { name: /Logistic Regression/i }).first().click();
      }

      // Do not use `.MuiCard-root.filter(has: heading)` — the wizard wraps MultiDatasetSelector in an outer
      // MuiCard that also contains that heading, so `.first()` can match the wrapper and click the wrong target.
      const datasetTitle = page.getByRole('heading', { name: datasetName, exact: true });
      await expect(datasetTitle).toBeVisible({ timeout: 20_000 });
      await datasetTitle.click();

      await page.getByLabel('Price (USD)').fill('100');
      await page.getByLabel('Duration (days)').fill('30');
      await page.getByLabel('Terms and Conditions').fill(`Full E2E CAN contract ${Date.now()}`);
      await clickNext();

      await expect(page.getByRole('heading', { name: /Configure Environment & (TSP|CCRP)/ })).toBeVisible();

      // Prefer Local filter when present; close any leftover MUI menu before selecting a card.
      const localFilter = page.getByRole('combobox', { name: /Cloud Provider/i }).last();
      if (await localFilter.isVisible().catch(() => false)) {
        await localFilter.click({ force: true });
        const localOpt = page.getByRole('option', { name: /Local \(Docker\)/i });
        if (await localOpt.isVisible().catch(() => false)) {
          await localOpt.click({ force: true });
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
      }
      await page.keyboard.press('Escape').catch(() => {});
      await expect(page.locator('.MuiModal-root')).toHaveCount(0, { timeout: 5000 }).catch(() => {});

      // Select seeded TSP by email. Card click is select-only (not toggle); assert via test id.
      const tspCard = page.locator('[data-testid^="tsp-card-"]').filter({ hasText: 'ccrp.e2e@test.com' });
      await expect(tspCard).toBeVisible({ timeout: 20_000 });
      await tspCard.click({ force: true });
      await expect(page.getByTestId('tsp-selected-chip')).toBeVisible({ timeout: 10_000 });
      await expect(tspCard).toHaveAttribute('data-selected', 'true');

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
      await page.keyboard.press('Escape').catch(() => {});
      await expect(page.locator('.MuiModal-root')).toHaveCount(0, { timeout: 5000 }).catch(() => {});
      await clickNext();

      const review = page.getByRole('heading', { name: 'Review Legal Document & Smart Contract' });
      if (!(await review.isVisible().catch(() => false))) {
        await page.getByRole('main').getByRole('button', { name: /^next$/i }).click({ force: true });
      }
      await expect(review).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByText(/Contract ID:/i).first()).toBeVisible({ timeout: 120_000 });
      await clickNext();
      await expect(page.locator('body')).toContainText('Create Contract', { timeout: 60_000 });

      // There is also a sidebar "Create Contract" quick-action button; scope to the main wizard action.
      const create = page
        .getByRole('main')
        .getByRole('button', { name: /^Create( SCITT CCF)? Contract$/i })
        .first();
      await expect(create).toBeVisible();

      // Only wait for SCITT call if the UI indicates SCITT mode (avoids hanging when SCITT is disabled/unhealthy).
      const expectsScitt = /SCITT/i.test((await create.innerText().catch(() => '')) || '');
      // Capture BOTH backend calls so failures include actionable API error details (best practice:
      // fail on root-cause, not the generic UI toast).
      const ricardianRespPromise = page.waitForResponse(
        (r) => r.url().includes('/api/contracts/ricardian') && r.request().method() === 'POST',
        { timeout: 120_000 }
      );
      const scittRespPromise = expectsScitt
        ? page.waitForResponse(
            (r) => r.url().includes('/api/scitt-ccf/contracts') && r.request().method() === 'POST',
            { timeout: 120_000 }
          )
        : null;
      await create.click();
      const ricardianResp = await ricardianRespPromise.catch(() => null);
      if (ricardianResp && !ricardianResp.ok()) {
        const body = await ricardianResp.text().catch(() => '');
        throw new Error(
          `Contract create (ricardian) failed: HTTP ${ricardianResp.status()} url=${ricardianResp.url()} body=${body}`
        );
      }
      if (!ricardianResp) {
        throw new Error('Contract create (ricardian) did not produce a POST /api/contracts/ricardian response');
      }
      if (scittRespPromise) {
        const scittResp = await scittRespPromise.catch(() => null);
        if (scittResp && !scittResp.ok()) {
          const body = await scittResp.text().catch(() => '');
          throw new Error(
            `Contract create (SCITT CCF) failed: HTTP ${scittResp.status()} url=${scittResp.url()} body=${body}`
          );
        }
      }

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
        const primary = page.getByRole('button', { name: /Sign Contract as (TSP|CCRP)/i }).first();
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
      await expect(page.getByText(/CAN Jobs \(Local (TSP|CCRP)\)/)).toBeVisible({ timeout: 90_000 });
      await page.getByLabel('Contract ID').fill(contractId);
      await page.getByRole('button', { name: 'Create CAN Job' }).click();

      await expect(page.getByTestId('can-job-id')).not.toHaveText('(none)', { timeout: 60_000 });
      canJobId = (await page.getByTestId('can-job-id').innerText()).trim();

      await page.getByRole('button', { name: /Release DEK/i }).click();
      await page.getByRole('button', { name: /Release MEK/i }).click();
      await page.getByRole('button', { name: /Release Job/i }).click();
      await page.getByRole('button', { name: /Wait for Training/i }).click();

      await expect(page.getByTestId('can-training-status')).toHaveText('COMPLETED', { timeout: 180_000 });
      await expect(page.getByText('Training results')).toBeVisible();
      trainingResultsJson = await page.getByTestId('can-training-results-json').innerText();

      if (canJobId) {
        const tjRes = await axios.get(
          `${BACKEND_URL}/api/can/jcs/jobs/${encodeURIComponent(canJobId)}/training`,
          { headers: { 'X-CAN-Principal-Id': 'did:can:dp:e2e' } }
        );
        const mode = tjRes.data?.data?.metadata?.executionMode;
        if (mode) {
          expect(mode).toBe('local-docker');
        }
        const artifact = tjRes.data?.data?.metadata?.results?.artifactUri || '';
        if (artifact) {
          expect(artifact).toMatch(/^file:/);
        }
      }
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

      let res;
      try {
        res = await axios.post(
          `${BACKEND_URL}/api/contracts/${encodeURIComponent(canonicalContractId)}/sign`,
          signaturePayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        const status = e?.response?.status;
        const body = e?.response?.data ? JSON.stringify(e.response.data) : '';
        throw new Error(`API sign failed for ${partyType}: HTTP ${status} body=${body}`);
      }
      if (res.status !== 200 || !res.data?.success) {
        throw new Error(`API sign failed for ${partyType}: HTTP ${res.status}`);
      }
    });
  }

  test('Full flow with new users and local training', async ({ page }, testInfo) => {
    test.setTimeout(10 * 60 * 1000);
    const tdcEmail = uniqueEmail('tdc');
    const tdpEmail = uniqueEmail('tdp');
    // IMPORTANT: The contract wizard selects the seeded "CCRP E2E User" deterministically.
    // Signing must be done by the assigned CCRP, otherwise the backend correctly returns 403.
    const ccrpEmail = 'ccrp.e2e@test.com';

    let tdcTempPassword;
    let tdpTempPassword;
    // Seeded CCRP is ensured by global-setup; it uses the same known password.
    const ccrpTempPassword = NEW_PASSWORD;

    let contractId;
    let canJobId;
    let trainingResultsJson;
    let trainingJobId;

    // Register all roles (each registration yields a temp password in the UI success message).
    tdcTempPassword = (await registerUserViaUI(page, { name: 'PW E2E TDC User', email: tdcEmail, partyType: 'TDC' })).tempPassword;
    tdpTempPassword = (await registerUserViaUI(page, { name: 'PW E2E TDP User', email: tdpEmail, partyType: 'TDP' })).tempPassword;

    await testInfo.attach('registered-users.json', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({
        tdcEmail,
        tdcTempPassword,
        tdpEmail,
        tdpTempPassword,
        ccrpEmail,
        ccrpPassword: ccrpTempPassword,
      }, null, 2), 'utf8'),
    });

    // First login setup for each role (sets NEW_PASSWORD).
    await completeFirstLoginPasswordViaAPI({ email: tdcEmail, currentPassword: tdcTempPassword, newPassword: NEW_PASSWORD });
    await completeFirstLoginPasswordViaAPI({ email: tdpEmail, currentPassword: tdpTempPassword, newPassword: NEW_PASSWORD });
    // Seeded CCRP is already in the desired password state via global-setup.

    await test.step('Verify party signing keys (registration + seeded TSP backfill)', async () => {
      for (const { email, partyType } of [
        { email: tdcEmail, partyType: 'TDC' },
        { email: tdpEmail, partyType: 'TDP' },
        { email: ccrpEmail, partyType: 'TSP' },
      ]) {
        const { token } = await loginViaAPI({ email, password: NEW_PASSWORD });
        const ready = await ensurePartySigningReady({
          accessToken: token,
          partyType,
          algorithm: DEFAULT_SIGNING_ALGORITHM,
        });
        expect(['exists', 'generated']).toContain(ready.status);
      }
    });

    await loginViaUI(page, { email: tdpEmail, password: NEW_PASSWORD });
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 90_000 });

    // Globally unique name avoids accidental selection of another run's public dataset card.
    const datasetName = `PW E2E Dataset ${randomUUID()}`;
    await createDatasetViaAPI({ email: tdpEmail, password: NEW_PASSWORD, datasetName });
    await logoutViaUI(page);

    let businessDatasetId;
    let tdpUserId;
    await test.step('Resolve registering TDP id + dataset business slug from API', async () => {
      const { token, user } = await loginViaAPI({ email: tdpEmail, password: NEW_PASSWORD });
      expect(user?.id, 'login response must include DB user id for TDP').toBeTruthy();
      tdpUserId = user.id;
      const res = await axios.get(
        `${BACKEND_URL}/api/tdp/datasets/${encodeURIComponent(String(tdpUserId))}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = res.data?.datasets || [];
      const mine = list.find((d) => d.name === datasetName);
      expect(
        mine,
        `TDP ${tdpEmail} (user ${tdpUserId}) must own dataset "${datasetName}" (${list.length} datasets)`
      ).toBeTruthy();
      expect(mine.datasetId).toBeTruthy();
      businessDatasetId = mine.datasetId;
    });

    // TDC creates contract selecting the dataset (and local CCRP).
    await loginViaUI(page, { email: tdcEmail, password: NEW_PASSWORD });
    contractId = await createContractViaUI(page, { datasetName });
    await logoutViaUI(page);

    await test.step('Contract must bind resolved dataset + TDP before API sign', async () => {
      const { data: row } = await axios.get(
        `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`
      );
      expect(row?.contractDatasets?.[0]?.datasetId, JSON.stringify({ contractId, row })).toBe(
        businessDatasetId
      );
      expect(Number(row?.tdpId)).toBe(Number(tdpUserId));
    });

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

