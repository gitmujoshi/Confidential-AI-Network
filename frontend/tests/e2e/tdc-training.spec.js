const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('TDC Training', () => {
  test.describe.configure({ mode: 'serial' });

  async function seedTdcAuth(page) {
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

    return { accessToken, user, backendURL };
  }

  test.beforeEach(async ({ page }) => {
    await seedTdcAuth(page);
    await page.goto('/tdc/training');
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  test('should load TDC training page with title and requirements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Training & models/i })).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText(/TRAINING_EXECUTION_MODE/i)).toBeVisible();
    await expect(page.getByText(/environmentSpecs/i)).toBeVisible();
  });

  test('should expose training API for invalid contract (404)', async () => {
    const backendURL = getBackendURL();
    const email = 'tdc.healthcare.2025-09-05t20-39-55@test.com';
    const password = 'TestNewPassword123!';
    const { data: login } = await axios.post(`${backendURL}/api/auth/login`, { email, password });
    const token = login.accessToken;
    expect(token).toBeTruthy();

    try {
      await axios.get(`${backendURL}/api/tdc/training/contracts/nonexistent-contract-id/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(false).toBe(true);
    } catch (err) {
      expect(err.response?.status).toBe(404);
    }
  });
});
