const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Training Parameters E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  async function authenticateViaApi(page) {
    const backendURL = getBackendURL();
    const email = 'tdc.healthcare.2025-09-05t20-39-55@test.com';
    const password = 'TestNewPassword123!';

    const loginResponse = await axios.post(`${backendURL}/api/auth/login`, { email, password });
    const { accessToken, user } = loginResponse.data || {};
    if (!accessToken || !user) throw new Error('API login did not return accessToken/user');

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { token: accessToken, u: user });
  }

  test.beforeEach(async ({ page }) => {
    await authenticateViaApi(page);
    // Go straight to contract creation page (this is where training params live)
    await page.goto('/contracts/create');
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  async function navigateToPrivacyAccuracyStep(page) {
    // Wait for datasets + template list (CreateRicardianContract loads datasets first)
    const templatesHeading = page.getByRole('heading', { name: /All Available Templates/i });
    await templatesHeading.waitFor({ state: 'visible', timeout: 60000 });

    if (await page.getByText(/All Available Templates \(0\)/i).count()) {
      test.skip(true, 'No contract templates — run Playwright global-setup / seed /api/contract-templates');
    }
    if (await page.getByRole('alert').filter({ hasText: /no templates match/i }).count()) {
      test.skip(true, 'No templates match filters — adjust UI filters or re-seed contract templates');
    }

    await page.keyboard.press('Escape').catch(() => {});

    const firstTemplateCard = page.locator('.MuiCard-root').filter({
      has: page.getByRole('heading', { level: 3 }),
    }).first();
    await expect(firstTemplateCard).toBeVisible({ timeout: 30000 });
    await firstTemplateCard.scrollIntoViewIfNeeded();
    await firstTemplateCard.click();
    await expect(page.getByText(/Selected Template:/i)).toBeVisible({ timeout: 15000 });

    // Privacy & Accuracy fields live on step 1 ("Contract Details & Dataset Selection"), not step 0
    const nextBtn = page.getByRole('button', { name: /^Next$/ });
    await expect(nextBtn).toBeEnabled({ timeout: 30000 });
    await nextBtn.scrollIntoViewIfNeeded();
    await nextBtn.click({ force: true });

    await expect(page.getByText('Privacy & Accuracy Requirements')).toBeVisible({ timeout: 60000 });
  }

  test('should show privacy & accuracy requirement fields', async ({ page }) => {
    await navigateToPrivacyAccuracyStep(page);
    await expect(page.getByText('Privacy & Accuracy Requirements')).toBeVisible();
    await expect(page.getByLabel(/maximum privacy loss/i)).toBeVisible();
    await expect(page.getByLabel(/minimum accuracy/i)).toBeVisible();

    const privacySection = page.getByRole('heading', { name: /privacy & accuracy requirements/i }).locator('..');
    const privacyTechniqueCombobox = privacySection.getByRole('combobox').first();
    await expect(privacyTechniqueCombobox).toBeVisible();
  });

  test('should allow editing maximum privacy loss (epsilon)', async ({ page }) => {
    await navigateToPrivacyAccuracyStep(page);
    const field = page.getByLabel(/maximum privacy loss/i);
    await field.fill('0.25');
    await expect(field).toHaveValue('0.25');
  });

  test('should allow editing minimum accuracy (%)', async ({ page }) => {
    await navigateToPrivacyAccuracyStep(page);
    const field = page.getByLabel(/minimum accuracy/i);
    await field.fill('90');
    await expect(field).toHaveValue('90');
  });
});