// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { getFrontendURL } = require('./load-config');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Serial execution avoids flaky logins and shared-backend races (default workers=1). */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* One worker by default: E2E hits one backend/Keycloak; parallel files caused 401s and order-dependent failures. Override: PW_WORKERS=4 */
  workers:
    process.env.PW_WORKERS !== undefined ? parseInt(process.env.PW_WORKERS, 10) || 1 : 1,
  // Put *all* per-test artifacts under test-results so they don't get "lost" between runs.
  // Keep the HTML report in a sibling folder to avoid Playwright's safety clash.
  outputDir: 'test-results/artifacts',
  preserveOutput: 'always',

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: getFrontendURL(),

    /* Always collect artifacts so HTML report always has attachments */
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Docs screenshot generators — run via dedicated npm scripts only
      testIgnore: ['**/oci-scaffold-demo.spec.js'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/role-user-guides.spec.js', '**/oci-scaffold-demo.spec.js'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/role-user-guides.spec.js', '**/oci-scaffold-demo.spec.js'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      // Dense multi-step wizards are flaky on narrow viewports (MUI menu/backdrop intercepts).
      testIgnore: [
        '**/can-contract-to-training-ui.spec.js',
        '**/create-contract-ui-workflow.spec.js',
        '**/full-e2e-register-sign-train-local.spec.js',
        '**/role-user-guides.spec.js',
        '**/oci-scaffold-demo.spec.js',
      ],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: [
        '**/can-contract-to-training-ui.spec.js',
        '**/create-contract-ui-workflow.spec.js',
        '**/full-e2e-register-sign-train-local.spec.js',
        '**/role-user-guides.spec.js',
        '**/oci-scaffold-demo.spec.js',
      ],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    url: getFrontendURL(),
    // Reuse when FRONTEND_URL already responds (local dev server or CI job that started the app).
    // If nothing is listening, Playwright still starts `npm run start` as usual.
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),
}); 