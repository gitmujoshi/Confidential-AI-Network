/**
 * E2E UI smoke tests — each role lands on dashboard and core sections render.
 */
const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');
const { E2E_ROLE_USERS, PASSWORD } = require('./helpers/role-crud-api');

test.describe('Role CRUD UI smoke', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();

  async function seedAuth(page, email) {
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password: PASSWORD,
    });
    const { accessToken, user } = loginResponse.data || {};
    if (!accessToken || !user) {
      throw new Error(`API login failed for ${email}`);
    }

    await page.addInitScript(({ token, u }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { token: accessToken, u: user });

    return user;
  }

  async function waitForDashboard(page, loadingPattern, errorPattern, heading) {
    await page.getByText(loadingPattern).waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});
    const error = page.getByText(errorPattern);
    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Dashboard error: ${await error.textContent()}`);
    }
    await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 120000 });
  }

  test('TDP dashboard loads datasets and contracts sections', async ({ page }) => {
    const user = await seedAuth(page, E2E_ROLE_USERS.TDP.email);
    await page.goto('/tdp/dashboard');
    await expect(page).not.toHaveURL(/\/login/);

    await waitForDashboard(
      page,
      /Loading TDP dashboard/i,
      /Error loading TDP dashboard/i,
      /Welcome to Your TDP Dashboard/i
    );

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'My Datasets', exact: true })).toBeVisible();
    await expect(main.getByText('Total Contracts', { exact: true })).toBeVisible();
    expect(user.partyType).toMatch(/TDP/i);
  });

  test('TDC dashboard loads datasets and contracts', async ({ page }) => {
    await seedAuth(page, E2E_ROLE_USERS.TDC.email);
    await page.goto('/tdc/dashboard');
    await expect(page).not.toHaveURL(/\/login/);

    await waitForDashboard(
      page,
      /Loading TDC dashboard/i,
      /Error loading TDC dashboard/i,
      /Welcome to Your TDC Dashboard/i
    );

    const main = page.getByRole('main');
    await expect(main.getByText('Available Datasets', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('My Contracts', { exact: true }).first()).toBeVisible();
  });

  test('TSP dashboard loads (legacy /ccrp redirect tolerated)', async ({ page }) => {
    await seedAuth(page, E2E_ROLE_USERS.TSP.email);
    await page.goto('/tsp/dashboard');
    await expect(page).not.toHaveURL(/\/login/);

    const loading = page.getByText(/Loading (TSP|CCRP) dashboard/i);
    await loading.waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});

    const heading = page.getByRole('heading', {
      name: /Welcome to Your (TSP|CCRP) Dashboard/i,
    });
    await expect(heading).toBeVisible({ timeout: 120000 });
  });

  test('AppAdmin dashboard loads user and contract summaries', async ({ page }) => {
    await seedAuth(page, E2E_ROLE_USERS.AppAdmin.email);
    await page.goto('/admin/dashboard');
    await expect(page).not.toHaveURL(/\/login/);

    await page.getByText(/Loading admin dashboard/i).waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});

    await expect(
      page.getByRole('heading', { name: /System Administration Dashboard/i })
    ).toBeVisible({ timeout: 120000 });
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Contracts', { exact: true })).toBeVisible();
  });
});
