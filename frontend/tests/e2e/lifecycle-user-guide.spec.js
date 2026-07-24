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
const { NLP_MODEL_ID, buildNlpDpContractPayload } = require('./helpers/nlp-dp-training');

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
    const datasetName = `Lifecycle AG News NLP ${ts}`;
    const orgs = {
      TDC: 'Lifecycle Health AI Consortium',
      TDP: 'Lifecycle Data Bank Corp',
      TSP: 'Lifecycle Clean Room Compute',
    };

    async function selectMui(labelText, optionName) {
      const control = page.locator('.MuiFormControl-root').filter({ hasText: labelText }).first();
      await control.getByRole('combobox').click();
      await page.getByRole('option', { name: optionName }).click();
    }

    async function registerEnterpriseViaUI({ name, email, partyType, organization }) {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: 'User Registration', exact: true })).toBeVisible();

      // User Type → Enterprise (exposes Organization and enterprise DID path).
      await selectMui('User Type', /^Enterprise$/i);

      await page.getByLabel('Full Name').fill(name);
      await page.getByLabel('Email').fill(email);

      await selectMui('Role', new RegExp(`\\(${partyType}\\)`, 'i'));

      const orgField = page.getByLabel('Organization');
      await expect(orgField).toBeVisible({ timeout: 10000 });
      await orgField.fill(organization);

      await page.getByLabel('Public Key').fill('0x' + 'b'.repeat(64));
      await settle(page, 400);
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

    // --- 1–3 Onboard participants (Enterprise registration) ---
    await registerEnterpriseViaUI({
      name: 'Lifecycle TDC Admin',
      email: tdcEmail,
      partyType: 'TDC',
      organization: orgs.TDC,
    });
    steps.push({
      title: 'Enterprise onboard TDC',
      body: [
        'Open **User Registration** and set **User Type** to **Enterprise**.',
        'Choose role **TDC (Training Data Consumer)**, enter the organization name, public key, and register.',
      ].join('\n'),
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
      body: 'After first-login password setup, the enterprise TDC lands on their dashboard and can browse datasets / create contracts.',
      ...(await captureShot(page, '02-onboard-tdc-dashboard.png')),
    });
    await logoutViaUI(page);

    await registerEnterpriseViaUI({
      name: 'Lifecycle TDP Admin',
      email: tdpEmail,
      partyType: 'TDP',
      organization: orgs.TDP,
    });
    steps.push({
      title: 'Enterprise onboard TDP',
      body: [
        'Register an enterprise **TDP (Training Data Provider)** with organization details.',
        'This party publishes datasets and signs contracts that use them.',
      ].join('\n'),
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
    // NLP + Hugging Face ag_news reference so local-docker training uses a well-known text task.
    const { token: tdpToken, user: tdpUser } = await loginViaAPI({ email: tdpEmail });
    const datasetId = `LIFECYCLE-NLP-${ts}`;
    await axios.post(
      `${BACKEND_URL}/api/datasets`,
      {
        datasetId,
        name: datasetName,
        description: 'Lifecycle NLP dataset with Hugging Face ag_news reference for DP-SGD training',
        category: 'Natural Language Processing',
        size: 120,
        recordCount: 120000,
        price: 100,
        license: 'MIT',
        tags: ['lifecycle', 'e2e', 'nlp', 'ag_news', 'differential-privacy'],
        metadata: {
          seededBy: 'lifecycle-guide',
          modality: 'text',
          hfDatasetId: 'ag_news',
          huggingface: {
            repoType: 'dataset',
            repoId: 'ag_news',
            splitTrain: 'train',
            splitTest: 'test',
            sovereignty: 'hub-reference',
          },
        },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdpUser.id,
      },
      { headers: { Authorization: `Bearer ${tdpToken}` } }
    );
    await page.goto('/datasets');
    await expect(page.getByText(datasetName, { exact: false }).first()).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TDP publishes an NLP dataset',
      body: [
        'The TDP publishes a **text / NLP** catalog dataset backed by the well-known Hugging Face **`ag_news`** reference.',
        'TDCs select this dataset when creating a privacy-preserving training contract.',
      ].join('\n'),
      ...(await captureShot(page, '05-tdp-dataset-published.png')),
    });
    await logoutViaUI(page);

    await registerEnterpriseViaUI({
      name: 'Lifecycle TSP Admin',
      email: tspEmail,
      partyType: 'TSP',
      organization: orgs.TSP,
    });
    steps.push({
      title: 'Enterprise onboard TSP / CCRP',
      body: [
        'Register an enterprise **TSP** (Tech Service Provider; also called CCRP in older docs).',
        'This party hosts the training environment and co-signs the contract.',
      ].join('\n'),
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
      body: 'Configure the enterprise TSP with a **Local** provider so contracts can run with `TRAINING_EXECUTION_MODE=local-docker` in this environment.',
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
      const distilbert = page.getByRole('option', { name: /Tiny DistilBERT|DistilBERT|NLP DP/i });
      if (await distilbert.isVisible().catch(() => false)) await distilbert.click();
      else await page.getByRole('option').first().click();
    }

    const datasetTitle = page.getByRole('heading', { name: datasetName, exact: true });
    await expect(datasetTitle).toBeVisible({ timeout: 60000 });
    await datasetTitle.click();
    const duration = page.getByLabel(/Duration/i).first();
    if (await duration.isVisible().catch(() => false)) await duration.fill('30');
    const terms = page.getByLabel(/Terms and Conditions/i).first();
    if (await terms.isVisible().catch(() => false)) {
      await terms.fill(
        'Lifecycle NLP DP contract: PyTorch Tiny DistilBERT with DP-SGD (epsilon 0.5, delta 1e-5).'
      );
    }
    const price = page.getByLabel(/Price/i).first();
    if (await price.isVisible().catch(() => false)) await price.fill('100');

    steps.push({
      title: 'TDC creates contract — NLP model & dataset',
      body: [
        'The TDC selects the TDP **AG News** NLP dataset and the catalog model **Tiny DistilBERT (NLP DP)**.',
        'Contract terms reference **PyTorch** training with **differential privacy (DP-SGD)**.',
      ].join('\n'),
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
        list.find(
          (m) =>
            m.modelId === NLP_MODEL_ID ||
            /distilbert|nlp dp/i.test(`${m.modelId || ''} ${m.name || ''}`)
        )) ||
      null;
    if (!model?.id) {
      throw new Error(
        `NLP DistilBERT model ${NLP_MODEL_ID} not found — run Playwright global-setup catalog seed`
      );
    }

    // Well-known PyTorch + Tiny DistilBERT + DP-SGD parameters (same shape as NLP DP E2E).
    const payload = buildNlpDpContractPayload({
      aiModelIds: [model.id],
      ccrpUserId: tspUser.id,
    });
    payload.datasetSelections = [{ datasetId, individualPrice: 100 }];
    payload.termsAndConditions = `Lifecycle NLP DP contract ${ts}: PyTorch Tiny DistilBERT, DP-SGD ε=0.5 δ=1e-5`;
    payload.kmsConfigs = {
      ...payload.kmsConfigs,
      keyId: 'lifecycle-nlp-dp-key',
      metadata: { seededBy: 'lifecycle-guide-nlp-dp' },
    };
    if (payload.environmentSpecs?.kms) {
      payload.environmentSpecs.kms.keyId = 'lifecycle-nlp-dp-key';
    }

    const create = await axios.post(`${BACKEND_URL}/api/contracts/ricardian`, payload, {
      headers: { Authorization: `Bearer ${tdcTokenCreate}` },
    });
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
    await expect(page.getByText(/differential privacy|privacy metrics|epsilon|DP/i).first()).toBeVisible({
      timeout: 30000,
    }).catch(() => {});
    steps.push({
      title: 'Training completed (PyTorch + DP-SGD)',
      body: [
        'When the local trainer finishes, the job status is **COMPLETED**.',
        'For this tour the run uses **PyTorch** / **Tiny DistilBERT** with **differential privacy (DP-SGD)** metrics when available.',
      ].join('\n'),
      ...(await captureShot(page, '17-tdc-training-completed.png')),
    });

    await page.getByRole('button', { name: /View job provenance/i }).click();
    await expect(page.getByText(/Job provenance \(JSON\)/i)).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'TDC views provenance report',
      body: '**View job provenance** opens the host/API provenance bundle (datasets, model architecture, privacy metrics, artifacts).',
      ...(await captureShot(page, '18-tdc-provenance.png')),
    });
    await page.getByRole('button', { name: /^Close$/i }).click();
    await expect(page.getByText(/Job provenance \(JSON\)/i)).toBeHidden({ timeout: 30000 });

    await page.getByRole('button', { name: /^View logs$/i }).click();
    await expect(page.getByText(/^Job logs$/i)).toBeVisible({ timeout: 60000 });
    await page.getByText(/^Job logs$/i).scrollIntoViewIfNeeded().catch(() => {});
    steps.push({
      title: 'TDC views training run logs',
      body: '**View logs** shows trainer/runner output (framework, architecture, DP flags) captured for the local-docker job.',
      ...(await captureShot(page, '19-tdc-training-logs.png')),
    });

    const out = writeGuide(steps);
    console.log(`✅ Lifecycle guide written: ${out}`);
  });
});
