const { test, expect } = require('@playwright/test');
const {
  DEFAULT_SIGNING_ALGORITHM,
  chooseSigningAlgorithm,
} = require('./helpers/party-signing-e2e');

test.describe('Authentication E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  async function waitForTdcDashboard(page) {
    const loading = page.getByText(/Loading TDC dashboard/i);
    await loading.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});

    const error = page.getByText(/Error loading TDC dashboard/i);
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`TDC dashboard failed to load: ${await error.textContent()}`);
    }

    await expect(page.getByRole('heading', { name: /Welcome to Your TDC Dashboard/i })).toBeVisible({ timeout: 120000 });
  }

  test.beforeEach(async ({ page }) => {
    // Navigate directly to login (landing page is not the login form)
    await page.goto('/login');
  });

  test('should display login form on initial load', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Contract Management', exact: true })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.getByLabel(/email address/i).fill('invalid@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/login failed/i)).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.getByLabel(/email address/i).fill('tdc.healthcare.2025-09-05t20-39-55@test.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('TestNewPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Login redirects to the unified dashboard route
    await expect(page).toHaveURL(/\/dashboard$/);
    await waitForTdcDashboard(page);
  });

  test('should show registration form when clicking register', async ({ page }) => {
    await page.goto('/register');

    await expect(page).toHaveURL(/.*\/register/);
    await expect(page.getByRole('heading', { name: 'User Registration', exact: true })).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('combobox').nth(1)).toBeVisible();
    await expect(page.getByLabel('Public Key')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Party signing key/i })).toBeVisible();
    await expect(page.getByLabel('Signing algorithm')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Register$/ })).toBeVisible();
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.goto('/register');

    const email = `pw-e2e-${Date.now()}@example.com`;
    await page.getByLabel('Full Name').fill('Playwright E2E User');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: /Training Data Consumer \(TDC\)/i }).click();
    await page.getByLabel('Public Key').fill('0x' + 'a'.repeat(64));
    await chooseSigningAlgorithm(page, DEFAULT_SIGNING_ALGORITHM);

    await page.getByRole('button', { name: /^Register$/ }).click();

    await expect(page.getByText(/registration successful/i)).toBeVisible();
    await expect(page.getByText(/Party signing key \(ECDSA-P256\) created/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.getByLabel(/email address/i).fill('tdc.healthcare.2025-09-05t20-39-55@test.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('TestNewPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await waitForTdcDashboard(page);

    // Mobile viewports hide the permanent drawer — open it before Sign out.
    let logoutBtn = page.locator('[data-testid="logout-button"]').locator('visible=true').first();
    if (!(await logoutBtn.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: /open drawer/i }).click();
      logoutBtn = page.locator('[data-testid="logout-button"]').locator('visible=true').first();
      await expect(logoutBtn).toBeVisible();
    }
    // Mobile Chrome can leave a sibling box intercepting pointer events after drawer open.
    await logoutBtn.evaluate((el) => el.click());

    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /contract management/i })).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.getByRole('button', { name: /forgot your password\?/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);

    await expect(page.getByRole('heading', { name: 'Forgot Password', exact: true })).toBeVisible();
    await page.getByLabel('Email Address').fill('tdc.healthcare.2025-09-05t20-39-55@test.com');
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText(/development mode/i).first()).toBeVisible();
    await expect(page.getByText('Reset Token:', { exact: true })).toBeVisible();
  });

  test('should login as TDC and load correct dashboard (regression)', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.getByLabel(/email address/i).fill('tdc.healthcare.2025-09-05t20-39-55@test.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('TestNewPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await waitForTdcDashboard(page);

    // AppBar hides the display name below the `lg` breakpoint; identity still must be present in the DOM.
    await expect(page.locator('body')).toContainText(/TDC Healthcare E2E User/i);
    await expect(page.getByRole('heading', { name: /Welcome to Your TDC Dashboard/i })).toBeVisible();

    await expect(page.locator('body')).not.toContainText('uitdc@example.com');
    await expect(page.locator('body')).not.toContainText('tdc1-416d70a2@example.com');
  });
});
