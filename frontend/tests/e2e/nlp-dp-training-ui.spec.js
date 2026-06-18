const { test, expect } = require('@playwright/test');
const {
  getNlpDpSkipReason,
  createSignedNlpDpContractAndTrain,
  seedAuth,
  USERS,
  login,
} = require('./helpers/nlp-dp-training');

/**
 * Opt-in UI: Privacy metrics panel on /tdc/training after NLP DP local-docker run.
 *
 * Run (from frontend/):
 *   E2E_WAIT_FOR_LOCAL_TRAINING=true npm run test:e2e:chromium -- tests/e2e/nlp-dp-training-ui.spec.js
 */
test.describe('NLP + differential privacy — TDC training UI (opt-in)', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  let contractId;
  let jobId;

  test.beforeAll(async () => {
    const reason = await getNlpDpSkipReason();
    if (reason) {
      test.skip(true, reason);
      return;
    }

    const result = await createSignedNlpDpContractAndTrain();
    contractId = result.contractId;
    jobId = result.jobId;
    if (result.job.status !== 'COMPLETED') {
      throw new Error(`Expected COMPLETED job, got ${result.job.status}`);
    }
  });

  test('shows Privacy metrics panel with spent ε after Watch', async ({ page }, testInfo) => {
    const reason = await getNlpDpSkipReason();
    if (reason) {
      test.skip(true, reason);
      return;
    }
    if (!contractId || !jobId) {
      test.skip(true, 'beforeAll did not produce a completed NLP DP job');
      return;
    }

    const { token, user } = await login(USERS.tdc.email);
    await seedAuth(page, { token, user });
    await page.goto('/tdc/training');
    await expect(page).not.toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Training & models/i })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByText(contractId).first()).toBeVisible({ timeout: 60_000 });

    const jobRow = page.locator('tr', { has: page.getByText(jobId, { exact: true }) });
    await expect(jobRow).toBeVisible({ timeout: 30_000 });
    await jobRow.getByRole('button', { name: 'Watch' }).click();

    await expect(page.getByRole('heading', { name: 'Privacy metrics' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Spent ε')).toBeVisible();
    await expect(page.getByText('Target ε (contract)')).toBeVisible();
    await expect(page.getByText('δ', { exact: true })).toBeVisible();
    await expect(page.getByText('dp-sgd')).toBeVisible();
    await expect(page.getByText('differential-privacy')).toBeVisible();

    await testInfo.attach('nlp-dp.ui.contractId.txt', {
      contentType: 'text/plain',
      body: contractId,
    });
  });
});
