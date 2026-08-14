const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const {
  getInferenceSkipReason,
  trainTabularForInference,
  registerModelFromJob,
  login,
  seedAuth,
  USERS,
  listGmaseToolDecisions,
  fetchDebugEnv,
} = require('./helpers/inference-e2e');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const GMASE_SHOT_ROOT = path.join(REPO_ROOT, 'docs/guides/gmase-integration/screenshots');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function captureGmaseShot(page, fileName) {
  ensureDir(GMASE_SHOT_ROOT);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
  const outPath = path.join(GMASE_SHOT_ROOT, fileName);
  await page.screenshot({ path: outPath, fullPage: true, animations: 'disabled' });
  return outPath;
}

/**
 * Opt-in UI: Deploy for inference on Training, then run prediction in Inference app.
 * Captures Open-GMASE governance screenshots for the blog / runbook.
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
    await captureGmaseShot(page, '01-tdc-deploy-inference.png');

    const openApp = page.getByRole('link', { name: /Open inference app/i });
    await expect(openApp).toBeVisible({ timeout: 30_000 });
    await openApp.click();
    await expect(page).toHaveURL(new RegExp(`/tdc/inference`));
    await expect(page.getByRole('heading', { name: /Inference app/i })).toBeVisible({
      timeout: 60_000,
    });
    await captureGmaseShot(page, '02-tdc-inference-app.png');

    await testInfo.attach('inference.ui.modelId.txt', {
      contentType: 'text/plain',
      body: modelId,
    });
  });

  test('Inference app runs a prediction with Open-GMASE gate', async ({ page }, testInfo) => {
    const reason = await getInferenceSkipReason();
    if (reason) {
      test.skip(true, reason);
      return;
    }
    if (!modelId) {
      test.skip(true, 'beforeAll did not register a model');
      return;
    }

    const debugEnv = await fetchDebugEnv();
    const gateOn = debugEnv.gmase?.inferenceGate !== false;

    const { token, user } = await login(USERS.tdc.email);
    await seedAuth(page, { token, user });
    await page.goto(`/tdc/inference?modelId=${encodeURIComponent(modelId)}`);
    await expect(page.getByRole('heading', { name: /Inference app/i })).toBeVisible({
      timeout: 60_000,
    });

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

    if (gateOn) {
      await expect(page.getByTestId('gmase-governance')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('gmase-governance').getByText(/ALLOW/i)).toBeVisible();
      await expect(page.getByTestId('gmase-governance').getByText(/Open-GMASE policy gate/i)).toBeVisible();
    }

    await captureGmaseShot(page, '03-tdc-inference-predict-gmase.png');

    if (gateOn) {
      const decisions = await listGmaseToolDecisions({ limit: 40 });
      const forModel = decisions.filter((row) => row.model_id === modelId);
      expect(forModel.some((d) => d.tool_name === 'run_inference' && d.allow === true)).toBe(true);
      await testInfo.attach('inference.ui.gmase-decisions.json', {
        contentType: 'application/json',
        body: JSON.stringify(forModel, null, 2),
      });
    }
  });
});
