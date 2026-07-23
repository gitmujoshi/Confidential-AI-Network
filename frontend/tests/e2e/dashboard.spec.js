const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Dashboard Tests', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';

  async function seedAuth(page, { email }) {
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password: PASSWORD });
    const { accessToken, user } = loginResponse.data || {};
    if (!accessToken || !user) throw new Error('API login did not return accessToken/user');

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { token: accessToken, u: user });
  }

  async function waitForDashboardReady(page, { partyType, welcomeHeading }) {
    const loading = page.getByText(new RegExp(`Loading ${partyType} dashboard\\.\\.\\.`, 'i'));
    await loading.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});

    const error = page.getByText(new RegExp(`Error loading ${partyType} dashboard`, 'i'));
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Dashboard failed to load: ${await error.textContent()}`);
    }

    await expect(page.getByRole('heading', { name: welcomeHeading })).toBeVisible({ timeout: 120000 });
  }

  test('should display TDC dashboard correctly', async ({ page }) => {
    await seedAuth(page, { email: 'tdc.healthcare.2025-09-05t20-39-55@test.com' });
    await page.goto('/tdc/dashboard');
    await expect(page).not.toHaveURL(/.*\/login/);

    await waitForDashboardReady(page, { partyType: 'TDC', welcomeHeading: /Welcome to Your TDC Dashboard/i });
    const main = page.getByRole('main');
    await expect(main.getByText('Available Datasets', { exact: true }).first()).toBeVisible({ timeout: 120000 });
    await expect(main.getByText('My Contracts', { exact: true }).first()).toBeVisible({ timeout: 120000 });
  });

  test('should display TDP dashboard correctly', async ({ page }) => {
    await seedAuth(page, { email: 'tdp.e2e@test.com' });
    await page.goto('/tdp/dashboard');
    await expect(page).not.toHaveURL(/.*\/login/);

    await waitForDashboardReady(page, { partyType: 'TDP', welcomeHeading: /Welcome to Your TDP Dashboard/i });
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'My Datasets', exact: true })).toBeVisible({ timeout: 120000 });
    await expect(main.getByText('Total Contracts', { exact: true })).toBeVisible({ timeout: 120000 });
  });

  test('should display CCRP/TSP dashboard correctly', async ({ page }) => {
    await seedAuth(page, { email: 'ccrp.e2e@test.com' });
    await page.goto('/tsp/dashboard');
    await expect(page).not.toHaveURL(/.*\/login/);

    await waitForDashboardReady(page, { partyType: 'TSP', welcomeHeading: /Welcome to Your (TSP|CCRP) Dashboard/i });
  });

  test('should display Admin dashboard correctly', async ({ page }) => {
    await seedAuth(page, { email: 'appadmin.e2e@test.com' });
    await page.goto('/admin/dashboard');
    await expect(page).not.toHaveURL(/.*\/login/);

    const loading = page.getByText(/Loading admin dashboard/i);
    await loading.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});

    const error = page.getByText(/Error loading admin dashboard/i);
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Admin dashboard failed to load: ${await error.textContent()}`);
    }

    await expect(page.getByRole('heading', { name: /System Administration Dashboard/i })).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible({ timeout: 120000 });
  });

  test('should display SCITT CCF dashboard correctly', async ({ page }) => {
    await seedAuth(page, { email: 'appadmin.e2e@test.com' });
    await page.goto('/admin/scitt-ccf');
    await expect(page).not.toHaveURL(/.*\/login/);

    await expect(page.getByRole('heading', { name: 'SCITT CCF Dashboard', exact: true })).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('System Health', { exact: true })).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('Migration Mode', { exact: true })).toBeVisible({ timeout: 120000 });
  });

  test('should display SCITT CCF metrics correctly', async ({ page }) => {
    await seedAuth(page, { email: 'appadmin.e2e@test.com' });
    await page.goto('/admin/scitt-ccf');

    await expect(page.getByText('Performance Metrics', { exact: true })).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('Migration Status', { exact: true })).toBeVisible({ timeout: 120000 });
  });

  test('should handle SCITT CCF configuration changes', async ({ page }) => {
    await seedAuth(page, { email: 'appadmin.e2e@test.com' });
    await page.goto('/admin/scitt-ccf');

    await expect(page.getByText('Configuration', { exact: true })).toBeVisible({ timeout: 120000 });
    await expect(page.getByRole('button', { name: 'Edit Config', exact: true })).toBeVisible({ timeout: 120000 });
    await expect(page.getByRole('button', { name: 'Change Mode', exact: true })).toBeVisible({ timeout: 120000 });
  });
});
