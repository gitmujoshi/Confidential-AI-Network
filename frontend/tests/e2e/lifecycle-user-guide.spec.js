/**
 * End-to-end lifecycle screenshot guide:
 * onboard (TDC/TDP/TSP) → dataset → create contract → notify/sign → train → provenance/logs
 *
 * Run: npm run test:e2e:lifecycle-guide
 */
const { test, expect } = require('@playwright/test');
const axios = require('axios');
const {
  PASSWORD,
  BACKEND_URL,
  captureShot,
  settle,
  loginViaUI,
  logoutViaUI,
  completeFirstLoginPasswordViaAPI,
  ensureTspLocalProvider,
  loginViaAPI,
  writeGuide,
} = require('./helpers/lifecycle-user-guide');

test.describe('Lifecycle user guide (screenshot tour)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Lifecycle guide captured on Desktop Chromium only');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Onboard → create → sign → train → provenance/logs', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);
    const steps = [];
    const ts = Date.now();
    const tdcEmail = `lifecycle.tdc.${ts}@test.com`;
    const tdpEmail = `lifecycle.tdp.${ts}@test.com`;
    const tspEmail = `lifecycle.tsp.${ts}@test.com`;
    const datasetName = `Lifecycle Dataset ${ts}`;

    async function registerViaUI({ name, email, partyType }) {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'User Registration', exact: true })).toBeVisible();
      await page.getByLabel('Full Name').fill(name);
      await page.getByLabel('Email').fill(email);
      await page.getByRole('combobox').nth(1).click();
      await page.getByRole('option', { name: new RegExp(`\\(${partyType}\\)`, 'i') }).click();
      await page.getByLabel('Public Key').fill('0x' + 'b'.repeat(64));
      await settle(page, 300);
      return page;
    }

    async function submitRegistration() {
      await page.getByRole('button', { name: /^Register$/ }).click();
      const successAlert = page
        .getByRole('alert')
        .filter({ hasText: /Registration successful/i })
        .first();
      await expect(successAlert).toBeVisible({ timeout: 60_000 });
      const msg = (await successAlert.innerText()) || '';
      const match = msg.match(/Password:\s*([^\s]+)/i);
      if (!match) throw new Error(`No temp password in registration alert:\n${msg}`);
      return match[1];
    }

    // --- 1–3 Onboard participants ---
    await registerViaUI({ name: 'Lifecycle TDC', email: tdcEmail, partyType: 'TDC' });
    steps.push({
      title: 'Onboard TDC (register)',
      body: 'Each participant starts at **User Registration**. Select party type **TDC (Training Data Consumer)**, then register.',
      ...(await captureShot(page, '01-onboard-tdc-register.png')),
    });
    const tdcTemp = await submitRegistration();
    await completeFirstLoginPasswordViaAPI({ email: tdcEmail, currentPassword: tdcTemp });
    await loginViaUI(page, { email: tdcEmail });
    await expect(page.getByRole('heading', { name: /Welcome to Your TDC Dashboard/i })).toBeVisible({
      timeout: 120000,
    });
    steps.push({
      title: 'TDC first login dashboard',
      body: 'After first-login password setup, the TDC lands on their dashboard and can browse datasets / create contracts.',
      ...(await captureShot(page, '02-onboard-tdc-dashboard.png')),
    });
    await logoutViaUI(page);

    await registerViaUI({ name: 'Lifecycle TDP', email: tdpEmail, partyType: 'TDP' });
    steps.push({
      title: 'Onboard TDP (register)',
      body: 'Register a **TDP (Training Data Provider)** who will publish datasets and sign contracts that use them.',
      ...(await captureShot(page, '03-onboard-tdp-register.png')),
    });
    const tdpTemp = await submitRegistration();
    await completeFirstLoginPasswordViaAPI({ email: tdpEmail, currentPassword: tdpTemp });
    await loginViaUI(page, { email: tdpEmail });
    await expect(page.getByRole('heading', { name: /Welcome to Your TDP Dashboard/i })).toBeVisible({
      timeout: 120000,
    });
    steps.push({
      title: 'TDP first login dashboard',
      body: 'The TDP dashboard is the home for datasets and incoming signature requests.',
      ...(await captureShot(page, '04-onboard-tdp-dashboard.png')),
    });

    // Publish dataset (UI wizard — abbreviated but real create).
    await page.goto('/datasets/add');
    await expect(page.getByText(/Dataset|Add|Publish/i).first()).toBeVisible({ timeout: 60000 });
    // Wizard steps vary; fill essentials similar to full-e2e helper when possible.
    const nameField = page.getByLabel(/^Dataset Name$|^Name$/i).first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill(datasetName);
    } else {
      // Multi-step add dataset wizard
      await page.getByRole('button', { name: /next/i }).last().click({ force: true }).catch(() => {});
    }

    // Prefer API dataset create for reliability, then show list in UI.
    const { token: tdpToken, user: tdpUser } = await loginViaAPI({ email: tdpEmail });
    const datasetId = `LIFECYCLE-${ts}`;
    await axios.post(
      `${BACKEND_URL}/api/datasets`,
      {
        datasetId,
        name: datasetName,
        description: 'Lifecycle guide dataset',
        category: 'Tabular',
        size: 10,
        recordCount: 100,
        price: 50,
        license: 'MIT',
        tags: ['lifecycle', 'e2e'],
        metadata: { seededBy: 'lifecycle-guide', modality: 'tabular' },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdpUser.id,
      },
      { headers: { Authorization: `Bearer ${tdpToken}` } }
    );
    await page.goto('/datasets');
    await expect(page.getByText(datasetName, { exact: false }).first()).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TDP publishes a dataset',
      body: 'The TDP publishes a catalog dataset. TDCs can select it when creating a Ricardian contract.',
      ...(await captureShot(page, '05-tdp-dataset-published.png')),
    });
    await logoutViaUI(page);

    await registerViaUI({ name: 'Lifecycle TSP', email: tspEmail, partyType: 'TSP' });
    steps.push({
      title: 'Onboard TSP / CCRP (register)',
      body: 'Register a **TSP** (Tech Service Provider; also called CCRP in older docs) who hosts the training environment and co-signs the contract.',
      ...(await captureShot(page, '06-onboard-tsp-register.png')),
    });
    const tspTemp = await submitRegistration();
    await completeFirstLoginPasswordViaAPI({ email: tspEmail, currentPassword: tspTemp });
    await ensureTspLocalProvider(tspEmail);
    await loginViaUI(page, { email: tspEmail });
    await page.goto('/tsp/cloud-credentials');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TSP Local cloud readiness',
      body: 'Configure the TSP with a **Local** provider so contracts can run with `TRAINING_EXECUTION_MODE=local-docker` in this environment.',
      ...(await captureShot(page, '07-onboard-tsp-local.png')),
    });
    await logoutViaUI(page);

    // --- 4 TDC creates contract ---
    await loginViaUI(page, { email: tdcEmail });
    await page.goto('/contracts/create');
    await expect(page.getByText(/Select Contract Template|Create Contract/i).first()).toBeVisible({
      timeout: 60000,
    });
    await page.getByRole('button', { name: /Select This Template/i }).first().click();
    await page.getByRole('button', { name: /^Next$/i }).click();
    await expect(page.getByText(/Contract Details & Dataset Selection/i).first()).toBeVisible({
      timeout: 60000,
    });

    const aiModelsCombo = page.getByRole('combobox', { name: /AI Models/i });
    if (await aiModelsCombo.isVisible().catch(() => false)) {
      await aiModelsCombo.click();
      const logreg = page.getByRole('option', { name: /E2E Logistic Regression/i });
      if (await logreg.isVisible().catch(() => false)) await logreg.click();
      else await page.getByRole('option').first().click();
    }

    const datasetTitle = page.getByRole('heading', { name: datasetName, exact: true });
    await expect(datasetTitle).toBeVisible({ timeout: 60000 });
    await datasetTitle.click();
    const duration = page.getByLabel(/Duration/i).first();
    if (await duration.isVisible().catch(() => false)) await duration.fill('30');
    const terms = page.getByLabel(/Terms and Conditions/i).first();
    if (await terms.isVisible().catch(() => false)) await terms.fill('Lifecycle guide contract terms');
    const price = page.getByLabel(/Price/i).first();
    if (await price.isVisible().catch(() => false)) await price.fill('100');

    steps.push({
      title: 'TDC creates contract — details & dataset',
      body: 'The TDC selects the TDP dataset, AI model, price, duration, and terms.',
      ...(await captureShot(page, '08-tdc-create-details.png')),
    });

    await page.getByRole('main').getByRole('button', { name: /^Next$/i }).click({ force: true });
    await expect(page.getByText(/Configure Environment & TSP|Configure Environment & CCRP/i).first()).toBeVisible({
      timeout: 90000,
    });
    const tspCard = page.locator('[data-testid^="tsp-card-"]').filter({ hasText: tspEmail });
    await expect(tspCard).toBeVisible({ timeout: 60000 });
    await tspCard.click({ force: true });
    steps.push({
      title: 'TDC creates contract — select TSP',
      body: 'Select the onboarded **TSP** (Local) and environment/KMS settings for the training session.',
      ...(await captureShot(page, '09-tdc-create-tsp.png')),
    });

    // Capture the environment/TSP step, then create via API so signing/training stay deterministic.
    steps.push({
      title: 'TDC creates contract — submit path',
      body: [
        'Complete environment/KMS settings and submit the wizard.',
        'The contract enters **PENDING_TDP_APPROVAL** and notifies the TDP (then TSP after TDP signs).',
      ].join('\n'),
      ...(await captureShot(page, '10-tdc-create-submit.png')),
    });

    const { token: tdcTokenCreate } = await loginViaAPI({ email: tdcEmail });
    const { user: tspUser } = await loginViaAPI({ email: tspEmail });
    const models = await axios.get(`${BACKEND_URL}/api/ai-models`, {
      headers: { Authorization: `Bearer ${tdcTokenCreate}` },
    });
    const list = models.data?.models || models.data?.data || models.data || [];
    const model =
      (Array.isArray(list) &&
        list.find((m) => m.modelId === 'e2e-model-tabular-logreg' || /logistic/i.test(m.name || ''))) ||
      null;
    if (!model?.id) throw new Error('E2E logistic regression model not found for lifecycle contract');

    const create = await axios.post(
      `${BACKEND_URL}/api/contracts/ricardian`,
      {
        datasetSelections: [{ datasetId, individualPrice: 100 }],
        aiModelIds: [model.id],
        duration: 30,
        termsAndConditions: `Lifecycle guide contract ${ts}`,
        contractType: 'AI_TRAINING',
        privacyRequirements: { maxPrivacyLoss: 0.5, minAccuracy: 0.7, differentialPrivacy: false },
        trainingParams: {
          taskType: 'tabular',
          framework: 'Other',
          architecture: 'logistic-regression',
          maxEpochs: 1,
          batchSize: 32,
          learningRate: 0.001,
          validationMetrics: ['accuracy', 'loss'],
        },
        environmentSpecs: {
          compute: { cpuCores: 2, memoryGB: 4, gpuCount: 0 },
          security: {
            confidentialComputing: false,
            attestationRequired: false,
            encryptionAtRest: true,
            encryptionInTransit: true,
            networkIsolation: true,
          },
          kms: {
            provider: 'hashicorp-vault',
            keyId: 'lifecycle-local-key',
            algorithm: 'AES-256-GCM',
            rotationPeriod: 90,
          },
          runtime: {
            containerSpec: {
              image: 'contractmanagement/local-trainer:latest',
              command: 'python train.py',
              cpuCores: 2,
              memoryGB: 4,
              gpuCount: 0,
            },
          },
        },
        kmsConfigs: {
          provider: 'hashicorp-vault',
          keyId: 'lifecycle-local-key',
          vaultUrl: 'http://localhost:8200',
        },
        containerImage: 'contractmanagement/local-trainer:latest',
        ccrpId: tspUser.id,
        ccrpCloudProvider: 'Local',
      },
      { headers: { Authorization: `Bearer ${tdcTokenCreate}` } }
    );
    const contractId = create.data?.contract?.contractId;
    expect(contractId).toBeTruthy();
    await logoutViaUI(page);

    // --- 5 TDP notified + sign ---
    await loginViaUI(page, { email: tdpEmail });
    await page.goto('/notifications');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TDP gets notified',
      body: 'The TDP sees signature / contract notifications for agreements that reference their datasets.',
      ...(await captureShot(page, '11-tdp-notifications.png')),
    });

    await page.goto(`/tdp/contracts/${encodeURIComponent(contractId)}`);
    await expect(page.getByText(/Contract Details|SIGNED|PENDING/i).first()).toBeVisible({ timeout: 90000 });
    const tdpSign = page
      .getByTestId('tdp-sign-contract')
      .or(page.getByRole('button', { name: /Sign Contract as TDP/i }))
      .first();
    await expect(tdpSign).toBeVisible({ timeout: 90000 });
    steps.push({
      title: 'TDP reviews and signs',
      body: 'On **Contract Details**, the TDP reviews terms and clicks **Sign Contract as TDP**. Status advances to **PENDING_TSP_APPROVAL**.',
      ...(await captureShot(page, '12-tdp-sign.png')),
    });
    await tdpSign.click();
    await expect(page.getByText(/PENDING_TSP|SIGNED|signed/i).first()).toBeVisible({ timeout: 90000 });
    await logoutViaUI(page);

    // --- 6 TSP notified + sign ---
    await loginViaUI(page, { email: tspEmail });
    await page.goto('/notifications');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TSP / CCRP gets notified',
      body: 'The TSP is notified when a contract is waiting for clean-room provider signature.',
      ...(await captureShot(page, '13-tsp-notifications.png')),
    });

    await page.goto(`/tsp/contracts/${encodeURIComponent(contractId)}`);
    await expect(page.getByText(/Contract Details|PENDING_TSP|SIGNED/i).first()).toBeVisible({
      timeout: 90000,
    });
    const tspSign = page.getByRole('button', { name: /Sign Contract as (TSP|CCRP)/i }).first();
    const tspSignAlt = page.getByRole('button', { name: /^Sign$/ }).first();
    const tspBtn = (await tspSign.isVisible().catch(() => false)) ? tspSign : tspSignAlt;
    await expect(tspBtn).toBeVisible({ timeout: 90000 });
    steps.push({
      title: 'TSP / CCRP reviews and signs',
      body: 'The TSP reviews environment commitments and signs. When TDP and TSP have both signed, status becomes **SIGNED**.',
      ...(await captureShot(page, '14-tsp-sign.png')),
    });
    await tspBtn.click();
    await expect(page.getByText(/SIGNED/i).first()).toBeVisible({ timeout: 90000 });
    await logoutViaUI(page);

    // --- 7 TDC signed + train + provenance + logs ---
    await loginViaUI(page, { email: tdcEmail });
    await page.goto(`/tdc/contracts/${encodeURIComponent(contractId)}`);
    await expect(page.getByText(/SIGNED/i).first()).toBeVisible({ timeout: 120000 });
    steps.push({
      title: 'TDC views the signed contract',
      body: 'The TDC opens the contract and confirms **SIGNED** (TDP + TSP signatures complete).',
      ...(await captureShot(page, '15-tdc-signed-contract.png')),
    });

    await page.goto('/tdc/training');
    await expect(page.getByRole('heading', { name: /Training/i })).toBeVisible({ timeout: 120000 });
    await expect(page.getByText(contractId, { exact: false }).first()).toBeVisible({ timeout: 120000 });
    const contractCard = page.locator('.MuiCard-root').filter({ hasText: contractId }).first();
    await expect(contractCard).toBeVisible();
    steps.push({
      title: 'TDC starts training',
      body: 'On **Training**, the TDC starts a job for the signed contract (`TRAINING_EXECUTION_MODE=local-docker` in local env).',
      ...(await captureShot(page, '16-tdc-training-ready.png')),
    });

    const { token: tdcToken } = await loginViaAPI({ email: tdcEmail });
    const start = await axios.post(
      `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/start`,
      {},
      { headers: { Authorization: `Bearer ${tdcToken}` } }
    );
    const jobId = start.data?.job?.jobId;
    expect(jobId).toBeTruthy();

    // Wait for completion (includes disk reconcile if needed).
    const deadline = Date.now() + 8 * 60 * 1000;
    let jobStatus = 'RUNNING';
    while (Date.now() < deadline) {
      const jobsRes = await axios.get(
        `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/jobs`,
        { headers: { Authorization: `Bearer ${tdcToken}` } }
      );
      const job = (jobsRes.data?.jobs || []).find((j) => j.jobId === jobId);
      jobStatus = job?.status || jobStatus;
      if (['COMPLETED', 'FAILED', 'CANCELLED', 'STALLED'].includes(jobStatus)) break;
      await page.waitForTimeout(2500);
    }
    expect(jobStatus).toBe('COMPLETED');

    await page.reload();
    await expect(page.getByText(contractId, { exact: false }).first()).toBeVisible({ timeout: 60000 });
    const card = page.locator('.MuiCard-root').filter({ hasText: contractId }).first();
    await card.getByRole('button', { name: /View details/i }).first().click();
    await settle(page, 800);
    await expect(page.getByText(/COMPLETED/i).first()).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'Training completed',
      body: 'When the local trainer finishes, the job status is **COMPLETED** with metrics and artifact actions.',
      ...(await captureShot(page, '17-tdc-training-completed.png')),
    });

    await page.getByRole('button', { name: /View job provenance/i }).click();
    await expect(page.getByText(/Job provenance \(JSON\)/i)).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TDC views provenance report',
      body: '**View job provenance** opens the host/API provenance bundle for the completed run (inputs, metrics, artifacts).',
      ...(await captureShot(page, '18-tdc-provenance.png')),
    });
    await page.getByRole('button', { name: /^Close$/i }).click();
    await expect(page.getByText(/Job provenance \(JSON\)/i)).toBeHidden({ timeout: 30000 });

    await page.getByRole('button', { name: /^View logs$/i }).click();
    await expect(page.getByText(/^Job logs$/i)).toBeVisible({ timeout: 60000 });
    await page.getByText(/^Job logs$/i).scrollIntoViewIfNeeded().catch(() => {});
    steps.push({
      title: 'TDC views training run logs',
      body: '**View logs** shows trainer/runner output captured for the local-docker job.',
      ...(await captureShot(page, '19-tdc-training-logs.png')),
    });

    const out = writeGuide(steps);
    console.log(`✅ Lifecycle guide written: ${out}`);
  });
});
