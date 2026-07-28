// @ts-check
/**
 * Lightweight Playwright config for OCI mock UI screenshots.
 * No backend / Keycloak / globalSetup — only the public /demo/oci-scaffolds page.
 */
const { defineConfig, devices } = require('@playwright/test');
const { getFrontendURL } = require('./load-config');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/oci-scaffold-demo.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  outputDir: 'test-results/artifacts-oci-demo',
  reporter: [['list']],
  use: {
    baseURL: getFrontendURL(),
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: getFrontendURL(),
    reuseExistingServer: true,
    timeout: 180 * 1000,
  },
});
