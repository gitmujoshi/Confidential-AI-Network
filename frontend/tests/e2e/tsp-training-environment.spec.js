const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('CCRP Training Environment', () => {
  test.describe.configure({ mode: 'serial' });

  async function seedCcrpAuth(page) {
    const backendURL = getBackendURL();
    const email = 'ccrp.e2e@test.com';
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
    await seedCcrpAuth(page);
    await page.goto('/ccrp/training-environment');
    await expect(page).not.toHaveURL(/.*\/login/);
  });

  test('should load training environment page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Training Environment Management/i })
    ).toBeVisible({ timeout: 60000 });
  });
});
