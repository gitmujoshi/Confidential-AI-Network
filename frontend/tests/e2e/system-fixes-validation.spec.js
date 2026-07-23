const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');
const { openSideNavIfMobile, sidebarButton } = require('./nav-helpers');

test.describe('System Fixes Validation Tests', () => {
  test.describe.configure({ mode: 'serial' });

  const SEEDED_DATASET_ID = 'e2e-dataset-1';
  const BACKEND_URL = getBackendURL();

  async function authenticateAdminViaApi(page) {
    const backendURL = BACKEND_URL;
    const email = 'appadmin.e2e@test.com';
    const password = 'TestNewPassword123!';

    const loginResponse = await axios.post(`${backendURL}/api/auth/login`, { email, password });
    const { accessToken, user } = loginResponse.data || {};
    if (!accessToken || !user) throw new Error('API login did not return accessToken/user');

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { token: accessToken, u: user });

    return { accessToken, user };
  }

  test.beforeEach(async ({ page }) => {
    const { accessToken } = await authenticateAdminViaApi(page);
    page.__e2eAdminToken = accessToken;
    await page.goto('/admin/dashboard');
    await expect(page).not.toHaveURL(/.*\/login/);
    await openSideNavIfMobile(page);
  });

  test('should load admin dashboard without 500 errors', async ({ page }) => {
    await expect(sidebarButton(page, 'Dashboard')).toBeVisible();
    await expect(sidebarButton(page, 'Users')).toBeVisible();
    await expect(sidebarButton(page, 'Contracts')).toBeVisible();
    await expect(sidebarButton(page, 'Datasets')).toBeVisible();

    await expect(page.getByText(/Internal Server Error/i)).toHaveCount(0);
    await expect(page.getByText(/HTTP\s*500|status\s*code\s*:\s*500|Error\s*500/i)).toHaveCount(0);
  });

  test('should load datasets page and view details work', async ({ page }) => {
    await sidebarButton(page, 'Datasets').click();
    await expect(page).toHaveURL(/\/(admin\/)?datasets/);
    await expect(page.getByRole('main').getByRole('heading', { name: 'Datasets', exact: true })).toBeVisible();

    // With seeded data, we should always be able to open a dataset details view.
    await page.goto(`/admin/datasets/${SEEDED_DATASET_ID}`);
    await expect(page).toHaveURL(new RegExp(`/admin/datasets/${SEEDED_DATASET_ID.replace('-', '\\-')}$`));
    await expect(page.getByRole('heading', { name: 'E2E Sample Dataset', exact: true })).toBeVisible();
  });

  test('should support both card and table view modes for datasets', async ({ page }) => {
    await sidebarButton(page, 'Datasets').click();
    await expect(page).toHaveURL(/\/(admin\/)?datasets/);

    const gridToggle = page.getByLabel(/grid view/i);
    const tableToggle = page.getByLabel(/table view/i);

    await expect(gridToggle).toBeVisible();
    await expect(tableToggle).toBeVisible();

    await gridToggle.click({ force: true });
    await tableToggle.click({ force: true });
    await expect(page.getByRole('table')).toBeVisible();
    await gridToggle.click({ force: true });
  });

  test('should load contracts page without 500 errors', async ({ page }) => {
    await sidebarButton(page, 'Contracts').click();
    await expect(page).toHaveURL(/\/(admin\/)?contracts/);
    await expect(page.getByRole('heading', { name: /^(Contracts|My Contracts)$/ }).first()).toBeVisible({
      timeout: 60000,
    });

    await expect(page.getByText(/Internal Server Error/i)).toHaveCount(0);
    // Do not match /\b500\b/ — that false-positives on prices like $500.00 in the contracts table
    await expect(page.getByText(/HTTP\s*500|status\s*code\s*:\s*500|Error\s*500/i)).toHaveCount(0);
  });

  test('should load users page without 500 errors', async ({ page }) => {
    await sidebarButton(page, 'Users').click();
    await expect(page).toHaveURL(/\/(admin\/)?users/);
    await expect(page.getByRole('main').getByRole('heading', { name: 'Users', exact: true })).toBeVisible();

    await expect(page.getByText(/Internal Server Error/i)).toHaveCount(0);
    await expect(page.getByText(/HTTP\s*500|status\s*code\s*:\s*500|Error\s*500/i)).toHaveCount(0);
  });

  test('should display CCRP menu only for CCRP users', async ({ page }) => {
    // As admin, CCRP-specific menu items should NOT be visible
    await expect(page.getByRole('button', { name: /Environments/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Infrastructure/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Cloud Credentials/i })).toHaveCount(0);
    
    // But Users menu should be visible for admin
    await expect(sidebarButton(page, 'Users')).toBeVisible();
  });

  test('should validate DEPA ID format for datasets', async ({ page }) => {
    await sidebarButton(page, 'Datasets').click();
    await expect(page).toHaveURL(/\/(admin\/)?datasets/);

    const depa = page.getByText(/DATASET-[a-f0-9-]+/i);
    await expect(depa.first()).toBeVisible();
  });

  test('should handle first login flag correctly', async ({ page }) => {
    // Admin user should not be redirected to password change wizard
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    // Should not see first login wizard
    await expect(page.locator('text=Change Password')).not.toBeVisible();
    await expect(page.locator('text=First Login')).not.toBeVisible();
  });

  test('should display proper navigation menu for admin', async ({ page }) => {
    // Check that admin sees the correct menu items
    await expect(sidebarButton(page, 'Dashboard')).toBeVisible();
    await expect(sidebarButton(page, 'Datasets')).toBeVisible();
    await expect(sidebarButton(page, 'Contracts')).toBeVisible();
    await expect(sidebarButton(page, 'Users')).toBeVisible();
    await expect(sidebarButton(page, /Notifications/i, { exact: false })).toBeVisible();
    await expect(sidebarButton(page, /Enterprise DID/i, { exact: false })).toBeVisible();
    
    // CCRP-specific items should not be visible for admin
    await expect(page.getByRole('button', { name: /Environments/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Infrastructure/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Cloud Credentials/i })).toHaveCount(0);
  });

  test('should validate all API endpoints are working', async ({ page }) => {
    const token = page.__e2eAdminToken;
    expect(token).toBeTruthy();

    const headers = { Authorization: `Bearer ${token}` };

    const usersRes = await page.request.get(`${BACKEND_URL}/api/admin/users`, { headers });
    expect(usersRes.status()).toBe(200);

    const contractsRes = await page.request.get(`${BACKEND_URL}/api/admin/contracts`, { headers });
    expect(contractsRes.status()).toBe(200);

    const datasetsRes = await page.request.get(`${BACKEND_URL}/api/admin/datasets`, { headers });
    expect(datasetsRes.status()).toBe(200);

    const breachesRes = await page.request.get(`${BACKEND_URL}/api/admin/data-breaches`, { headers });
    expect(breachesRes.status()).toBe(200);

    const complianceRes = await page.request.get(`${BACKEND_URL}/api/admin/compliance`, { headers });
    expect(complianceRes.status()).toBe(200);
  });

  test('should validate dataset view details navigation', async ({ page }) => {
    // Deterministic navigation using seeded dataset ID.
    await page.goto(`/admin/datasets/${SEEDED_DATASET_ID}`);
    await expect(page).toHaveURL(new RegExp(`/admin/datasets/${SEEDED_DATASET_ID.replace('-', '\\-')}$`));
    await expect(page.getByRole('heading', { name: 'E2E Sample Dataset', exact: true })).toBeVisible();
  });
});
