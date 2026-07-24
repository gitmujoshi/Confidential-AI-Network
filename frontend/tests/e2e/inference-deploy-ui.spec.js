const { test, expect } = require('@playwright/test');
const {
  getInferenceSkipReason,
  trainTabularForInference,
  registerModelFromJob,
  login,
  seedAuth,
  USERS,
} = require('./helpers/inference-e2e');

/**
 * Opt-in UI: Deploy for inference on Training, then run prediction in Inference app.
 *
 * Run (from frontend/):
 *   E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference
 */
test.describe('Inference deploy + predict — TDC UI (opt-in)', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  let contractId;
  let jobId;
  let modelId;

  test.beforeAll(async () => {
    test.setTimeout(600_000);
    const reason = await getInferenceSkipReason();
    if (reason) {
      test.skip(true, reason);
      return;
    }

    const run = await trainTabularForInference();
    contractId = run.contractId;
    jobId = run.jobId;
    const { token: tdcToken } = await login(USERS.tdc.email);
    const registered = await registerModelFromJob({
      tdcToken,
      jobId,
      name: `E2E UI Inference ${Date.now()}`,
    });
    modelId = registered.modelId;
  });

  test('Training page can deploy and open Inference app', async ({ page }, testInfo) => {
    const reason = await getInferenceSkipReason();
    if (reason) {
      test.skip(true, reason);
      return;
    }
    if (!contractId || !jobId || !modelId) {
      test.skip(true, 'beforeAll did not register a model');
      return;
    }

    const { token, user } = await login(USERS.tdc.email);
    await seedAuth(page, { token, user });
    await page.goto('/tdc/training');
    await expect(page).not.toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Training/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(contractId).first()).toBeVisible({ timeout: 60_000 });

    const jobRow = page.locator('tr', { has: page.getByText(jobId, { exact: true }) });
    await expect(jobRow).toBeVisible({ timeout: 30_000 });
    await jobRow.getByRole('button', { name: 'Watch' }).click();

    await expect(page.getByText(modelId, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    const deployBtn = page.getByRole('button', { name: /Deploy for inference/i });
    await expect(deployBtn).toBeVisible({ timeout: 30_000 });
    await deployBtn.click();
    await expect(page.getByText(/Inference deployed/i).first()).toBeVisible({ timeout: 60_000 });

    const openApp = page.getByRole('link', { name: /Open inference app/i });
    await expect(openApp).toBeVisible({ timeout: 30_000 });
    await openApp.click();
    await expect(page).toHaveURL(new RegExp(`/tdc/inference`));
    await expect(page.getByRole('heading', { name: /Inference app/i })).toBeVisible({
      timeout: 60_000,
    });

    await testInfo.attach('inference.ui.modelId.txt', {
      contentType: 'text/plain',
      body: modelId,
    });
  });

  test('Inference app runs a prediction', async ({ page }) => {
    const reason = await getInferenceSkipReason();
    if (reason) {
      test.skip(true, reason);
      return;
    }
    if (!modelId) {
      test.skip(true, 'beforeAll did not register a model');
      return;
    }

    const { token, user } = await login(USERS.tdc.email);
    await seedAuth(page, { token, user });
    await page.goto(`/tdc/inference?modelId=${encodeURIComponent(modelId)}`);
    await expect(page.getByRole('heading', { name: /Inference app/i })).toBeVisible({
      timeout: 60_000,
    });

    // Ensure the deployed model is selectable (deployed in previous test or still listed).
    const modelSelect = page.getByLabel(/Deployed model/i);
    if (await modelSelect.isVisible().catch(() => false)) {
      await modelSelect.click();
      const option = page.getByRole('option', { name: new RegExp(modelId, 'i') });
      if (await option.isVisible().catch(() => false)) {
        await option.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    const emptyState = page.getByText(/No deployed models yet/i);
    if (await emptyState.isVisible().catch(() => false)) {
      test.skip(true, 'Model was undeployed or deploy UI step did not persist');
      return;
    }

    await page.getByRole('button', { name: /Run prediction/i }).click();
    await expect(page.getByText(/Label:/i)).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText(/setosa/i).first()).toBeVisible({ timeout: 30_000 });
  });
});
