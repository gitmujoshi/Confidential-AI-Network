const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Create Contract UI workflow (wizard)', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';

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

  async function attachShot(page, testInfo, name) {
    try {
      const url = page.url?.() || '';
      if (!url || url === 'about:blank') return;
      await testInfo.attach(`Screenshot — ${name}.png`, {
        contentType: 'image/png',
        body: await page.screenshot({ fullPage: true }),
      });
    } catch (_) {}
  }

  test('TDC creates a contract end-to-end via UI wizard', async ({ page }, testInfo) => {
    test.setTimeout(4 * 60 * 1000);

    const runTag = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `tdc.ui.${runTag}@test.com`;
    console.log(`[ui-contract] runTag=${runTag}`);

    // Best-effort register user (if backend supports it).
    await test.step('TDC registers (best-effort)', async () => {
      console.log('[ui-contract] step: register');
      try {
        await axios.post(`${BACKEND_URL}/api/auth/register`, {
          name: `TDC UI User ${runTag}`,
          email,
          partyType: 'TDC',
        });
      } catch (_) {
        // ignore
      }
    });

    const { token, user } = await test.step('TDC authenticates', async () => {
      console.log('[ui-contract] step: login');
      return login(email).catch(async () => login('tdc.healthcare.2025-09-05t20-39-55@test.com'));
    });
    await seedAuth(page, { token, user });

    await test.step('Open Create Contract wizard', async () => {
      console.log('[ui-contract] step: open wizard');
      await page.goto('/contracts/create');
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page.getByRole('heading', { name: /create contract/i })).toBeVisible({ timeout: 120000 });
      await attachShot(page, testInfo, 'Wizard loaded');
    });

    await test.step('Select a contract template', async () => {
      console.log('[ui-contract] step: select template');
      // Pick the stable seeded template name if present.
      const templateCard =
        page.getByText('Standard Research License').first().locator('xpath=ancestor::div[contains(@class,"MuiCard-root")]').first();
      if (await templateCard.count()) {
        await templateCard.click();
      } else {
        // Fallback: click the first template card.
        await page.locator('.MuiCard-root').nth(1).click().catch(() => {});
      }
      await attachShot(page, testInfo, 'Template selected');

      await page.getByRole('button', { name: /^next$/i }).click();
    });

    await test.step('Fill contract details', async () => {
      console.log('[ui-contract] step: fill details');
      await expect(page.getByText(/contract details/i).first()).toBeVisible({ timeout: 120000 });

      await page.getByLabel('Duration (days)').fill('30');
      await page.getByLabel('Terms and Conditions').fill(`UI wizard E2E contract ${runTag}`);

      // Switch to Privacy tab (new UX).
      await page.getByRole('tab', { name: /^privacy$/i }).click();
      await expect(page.getByText(/privacy & accuracy/i).first()).toBeVisible({ timeout: 120000 });

      // Enable DP with epsilon/delta.
      const dpEnabled = page.getByRole('checkbox', { name: /differential privacy/i }).first();
      if (await dpEnabled.count()) await dpEnabled.check({ force: true }).catch(() => {});

      const eps = page.getByLabel(/epsilon/i).first();
      if (await eps.count()) await eps.fill('0.1');
      const del = page.getByLabel(/delta/i).first();
      if (await del.count()) await del.fill('0.00001');

      await attachShot(page, testInfo, 'Details + privacy filled');
    });

    await test.step('Select a dataset', async () => {
      console.log('[ui-contract] step: select dataset');
      // Switch to Datasets tab (new UX).
      await page.getByRole('tab', { name: /^datasets$/i }).click();
      await expect(page.getByText(/select datasets/i).first()).toBeVisible({ timeout: 120000 });

      // Prefer a known seeded dataset that is active; MNIST seed may not be marked active.
      const preferred =
        page
          .getByText('ImageNet-Enhanced')
          .first()
          .locator('xpath=ancestor::div[contains(@class,\"MuiCard-root\")]')
          .first();
      const fallbackMnist =
        page.getByText(/mnist/i).first().locator('xpath=ancestor::div[contains(@class,\"MuiCard-root\")]').first();

      if (await preferred.count()) {
        await preferred.click();
      } else if (await fallbackMnist.count()) {
        await fallbackMnist.click();
      } else {
        await page.locator('main .MuiCard-root').nth(2).click().catch(() => {});
      }
      await attachShot(page, testInfo, 'Dataset selected');

      await page.getByRole('button', { name: /^next$/i }).click();
    });

    await test.step('Select CCRP and environment basics', async () => {
      console.log('[ui-contract] step: select ccrp');
      await expect(
        page.getByRole('heading', { name: /configure environment/i }).first()
      ).toBeVisible({ timeout: 120000 });

      // Pick a CCRP provider card (first visible).
      const ccrpCards = page.locator('main').locator('.MuiCard-root').filter({ hasText: 'Supported Cloud Providers' });
      if (await ccrpCards.count()) {
        await ccrpCards.first().click();
      } else {
        // Fallback: click any CCRP name card in the grid.
        await page.locator('main .MuiCard-root').nth(2).click().catch(() => {});
      }
      await attachShot(page, testInfo, 'CCRP selected');

      await page.getByRole('button', { name: /^next$/i }).click();

      // Some builds have an intermediate "Create Contract" step with no content (step index gap).
      // If we didn't land on the Review step, click Next once more.
      const reviewHeading = page.getByRole('heading', { name: /review legal document/i }).first();
      const nextBtn = page.getByRole('button', { name: /^next$/i });
      if (!(await reviewHeading.isVisible().catch(() => false)) && (await nextBtn.count().catch(() => 0))) {
        await nextBtn.click();
      }
    });

    await test.step('Review and create contract', async () => {
      console.log('[ui-contract] step: review + create');
      await expect(
        page.getByRole('heading', { name: /review legal document/i }).first()
      ).toBeVisible({ timeout: 120000 });
      await attachShot(page, testInfo, 'Review step');

      // Generate preview (required before create).
      const previewBtn = page.getByRole('button', { name: /generate preview/i });
      await expect(previewBtn, 'Generate Preview button should be visible on review step').toBeVisible({
        timeout: 120000,
      });
      await previewBtn.click();
      // Toasts are best-effort signals; the real signal is the preview content below.
      await expect(page.getByText(/preview generated successfully/i))
        .toBeVisible({ timeout: 30000 })
        .catch(() => {});

      // Wait for either preview content or a visible preview-generation failure toast/message.
      const contractIdLine = page.getByText(/contract id/i).first();
      const previewFailed = page
        .getByText(/failed to generate preview/i)
        .or(page.getByText(/preview generation failed/i))
        .or(page.getByText(/failed to generate/i));
      await expect(contractIdLine.or(previewFailed)).toBeVisible({ timeout: 120000 });
      if (await previewFailed.isVisible().catch(() => false)) {
        await attachShot(page, testInfo, 'Preview failed');
        throw new Error('Preview generation failed in UI (toast/message visible).');
      }
      await attachShot(page, testInfo, 'Preview generated');

      const createBtn = page.getByRole('button', { name: /create.*contract/i }).last();
      await expect(createBtn).toBeVisible({ timeout: 120000 });
      await attachShot(page, testInfo, 'Ready to create');

      await createBtn.click();

      const errorAlert = page.getByText(/contract creation error/i);
      const creating = page.getByRole('button', { name: /creating.*contract/i }).first();

      // Best-effort: if the UI shows a loading state, wait for it to settle.
      if (await creating.count().catch(() => 0)) {
        await expect(creating).toBeHidden({ timeout: 120000 }).catch(() => {});
      }

      // Success path navigates to contract detail page. Failure shows an error alert.
      const navPromise = page
        .waitForURL(/\/contracts\/[^/]+$/, { timeout: 120000 })
        .then(() => 'navigated')
        .catch(() => null);
      const errPromise = errorAlert
        .waitFor({ state: 'visible', timeout: 120000 })
        .then(() => 'error')
        .catch(() => null);

      const outcome = await Promise.race([navPromise, errPromise]);
      if (outcome === 'error') {
        await attachShot(page, testInfo, 'Create failed');
        const msg = await page.locator('main').innerText().catch(() => '');
        throw new Error(`UI contract creation failed. Visible error alert. Page excerpt: ${msg.slice(0, 500)}`);
      }
      if (outcome !== 'navigated') {
        await attachShot(page, testInfo, 'Create did not resolve');
        throw new Error('Contract create did not navigate to /contracts/:id and did not show an error alert.');
      }

      await expect(page).toHaveURL(/\/contracts\/[^/]+$/);
      await expect(page.getByRole('heading', { name: /contract/i }).first()).toBeVisible({ timeout: 120000 });
      await attachShot(page, testInfo, 'Created (contract detail)');
    });
  });
});

