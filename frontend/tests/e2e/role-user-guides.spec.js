/**
 * Captures desktop Chromium screenshots and writes role user guides under
 * docs/guides/role-user-guides/.
 *
 * Run: npm run test:e2e:user-guides
 */
const { test, expect } = require('@playwright/test');
const {
  ROLE_META,
  PASSWORD,
  E2E_ROLE_USERS,
  seedAuth,
  captureShot,
  gotoAndWait,
  waitForHeading,
  waitDashboard,
  buildMarkdown,
  writeGuideFile,
  writeIndex,
  settle,
} = require('./helpers/role-user-guide');

test.describe('Role user guides (screenshot tours)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Guides are captured on Desktop Chromium only');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  const generatedRoles = [];

  async function captureLogin(page, roleKey) {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /contract management/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    const shot = await captureShot(page, roleKey, '01-login.png', { fullPage: true });
    return {
      title: 'Sign in',
      body: [
        '1. Open the app and go to **Login**.',
        '2. Enter your email and password.',
        '3. Click **Sign In**. On first login you may be asked to set a new password.',
      ].join('\n'),
      ...shot,
    };
  }

  async function uiLogin(page, email) {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(email);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(tdc\/|tdp\/|tsp\/|admin\/)?dashboard/, { timeout: 60000 });
  }

  test('TDC user guide', async ({ page }) => {
    const roleKey = 'TDC';
    const email = E2E_ROLE_USERS.TDC.email;
    const steps = [];

    steps.push(await captureLogin(page, roleKey));
    await uiLogin(page, email);

    await waitDashboard(page, 'TDC', /Welcome to Your TDC Dashboard/i);
    steps.push({
      title: 'Dashboard',
      body: 'After login you land on the **TDC dashboard**: available datasets, your contracts, and quick status.',
      ...(await captureShot(page, roleKey, '02-dashboard.png')),
    });

    await gotoAndWait(page, '/datasets', async (p) => {
      await waitForHeading(p, /Datasets|Browse|Catalog|My Datasets/i);
    });
    steps.push({
      title: 'Browse datasets',
      body: 'Use **Datasets** to explore the catalog. Open a dataset for modality, size, and access details before contracting.',
      ...(await captureShot(page, roleKey, '03-datasets.png')),
    });

    await gotoAndWait(page, '/contracts', async (p) => {
      await waitForHeading(p, /Contracts/i);
    });
    steps.push({
      title: 'Contracts list',
      body: '**Contracts** shows drafts, pending signatures, and active agreements you participate in.',
      ...(await captureShot(page, roleKey, '04-contracts.png')),
    });

    await page.goto('/contracts/create');
    await settle(page, 800);
    steps.push({
      title: 'Create a contract',
      body: [
        'From the sidebar **Create contract** (or Contracts → create):',
        '1. Choose a Ricardian template.',
        '2. Select dataset(s) and TSP / clean-room provider.',
        '3. Set privacy / accuracy requirements.',
        '4. Review and submit for multi-party signing.',
      ].join('\n'),
      ...(await captureShot(page, roleKey, '05-create-contract.png')),
    });

    await gotoAndWait(page, '/tdc/training', async (p) => {
      await waitForHeading(p, /Training/i);
    });
    steps.push({
      title: 'Training',
      body: '**Training** starts a job against a fully signed contract, monitors progress, and surfaces privacy metrics when differential privacy is enabled.',
      ...(await captureShot(page, roleKey, '06-training.png')),
    });

    await gotoAndWait(page, '/can/jobs', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'CAN jobs',
      body: '**CAN Jobs** tracks confidential job coordination (escrow, attestation signals, release) for clean-room runs.',
      ...(await captureShot(page, roleKey, '07-can-jobs.png')),
    });

    await gotoAndWait(page, '/notifications', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Notifications',
      body: '**Notifications** surfaces signature requests, training updates, and system alerts.',
      ...(await captureShot(page, roleKey, '08-notifications.png')),
    });

    writeGuideFile(roleKey, buildMarkdown({ roleKey, meta: ROLE_META[roleKey], email, steps }));
    generatedRoles.push(roleKey);
  });

  test('TDP user guide', async ({ page }) => {
    const roleKey = 'TDP';
    const email = E2E_ROLE_USERS.TDP.email;
    const steps = [];

    steps.push(await captureLogin(page, roleKey));
    await uiLogin(page, email);

    await waitDashboard(page, 'TDP', /Welcome to Your TDP Dashboard/i);
    steps.push({
      title: 'Dashboard',
      body: 'The **TDP dashboard** summarizes your datasets, contract activity, and outstanding actions.',
      ...(await captureShot(page, roleKey, '02-dashboard.png')),
    });

    await gotoAndWait(page, '/datasets', async (p) => {
      await waitForHeading(p, /Datasets|My Datasets/i);
    });
    steps.push({
      title: 'My datasets',
      body: '**Datasets** lists assets you own. Review metadata, visibility, and DEPA identifiers before sharing.',
      ...(await captureShot(page, roleKey, '03-datasets.png')),
    });

    await page.goto('/datasets/add');
    await settle(page, 800);
    steps.push({
      title: 'Publish a dataset',
      body: [
        'Use **Add dataset** / upload to publish:',
        '1. Provide name, modality, and description.',
        '2. Attach files or catalog references.',
        '3. Set access / licensing and publish.',
      ].join('\n'),
      ...(await captureShot(page, roleKey, '04-add-dataset.png')),
    });

    await gotoAndWait(page, '/contracts', async (p) => {
      await waitForHeading(p, /Contracts/i);
    });
    steps.push({
      title: 'Contracts',
      body: 'Review incoming contracts, verify terms for your data, and **sign** when you approve use in a clean room.',
      ...(await captureShot(page, roleKey, '05-contracts.png')),
    });

    await gotoAndWait(page, '/notifications', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Notifications',
      body: 'Watch for signature requests and dataset access events here.',
      ...(await captureShot(page, roleKey, '06-notifications.png')),
    });

    writeGuideFile(roleKey, buildMarkdown({ roleKey, meta: ROLE_META[roleKey], email, steps }));
    generatedRoles.push(roleKey);
  });

  test('TSP user guide', async ({ page }) => {
    const roleKey = 'TSP';
    const email = E2E_ROLE_USERS.TSP.email;
    const steps = [];

    steps.push(await captureLogin(page, roleKey));
    await uiLogin(page, email);

    await page
      .getByText(/Loading (TSP|CCRP) dashboard/i)
      .waitFor({ state: 'hidden', timeout: 120000 })
      .catch(() => {});
    await waitForHeading(page, /Welcome to Your (TSP|CCRP) Dashboard/i);
    steps.push({
      title: 'Dashboard',
      body: 'The **TSP dashboard** (labeled CCRP in some older screens) shows environment health and contracts that need your signature or capacity.',
      ...(await captureShot(page, roleKey, '02-dashboard.png')),
    });

    await gotoAndWait(page, '/contracts', async (p) => {
      await waitForHeading(p, /Contracts/i);
    });
    steps.push({
      title: 'Contracts',
      body: 'Confirm clean-room requirements (TEE / residency / policies), then sign when you can host the job.',
      ...(await captureShot(page, roleKey, '03-contracts.png')),
    });

    await gotoAndWait(page, '/tsp/cloud-credentials', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Cloud credentials',
      body: 'Register **cloud credentials** (or Local provider for demos) so contracts can target your offering.',
      ...(await captureShot(page, roleKey, '04-cloud-credentials.png')),
    });

    await gotoAndWait(page, '/tsp/infrastructure', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Infrastructure',
      body: '**Infrastructure** / provisioning views cover capacity and environment setup for training runs.',
      ...(await captureShot(page, roleKey, '05-infrastructure.png')),
    });

    await gotoAndWait(page, '/tsp/training-environment', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Training environment',
      body: 'Monitor or configure the **training environment** used for local Docker or cloud CCR sessions.',
      ...(await captureShot(page, roleKey, '06-training-environment.png')),
    });

    await gotoAndWait(page, '/notifications', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Notifications',
      body: 'Signature requests and provisioning alerts appear under **Notifications**.',
      ...(await captureShot(page, roleKey, '07-notifications.png')),
    });

    writeGuideFile(roleKey, buildMarkdown({ roleKey, meta: ROLE_META[roleKey], email, steps }));
    generatedRoles.push(roleKey);
  });

  test('AppAdmin user guide', async ({ page }) => {
    const roleKey = 'AppAdmin';
    const email = E2E_ROLE_USERS.AppAdmin.email;
    const steps = [];

    steps.push(await captureLogin(page, roleKey));
    await uiLogin(page, email);

    await page
      .getByText(/Loading admin dashboard/i)
      .waitFor({ state: 'hidden', timeout: 120000 })
      .catch(() => {});
    await waitForHeading(page, /System Administration Dashboard/i);
    steps.push({
      title: 'Admin dashboard',
      body: 'The **admin dashboard** summarizes users, contracts, and overall platform activity.',
      ...(await captureShot(page, roleKey, '02-dashboard.png')),
    });

    await gotoAndWait(page, '/admin/users', async (p) => {
      await waitForHeading(p, /Users/i);
    });
    steps.push({
      title: 'Users',
      body: '**Users** lets you review party types, activation, and onboarding status. Prefer Keycloak-backed flows over direct DB edits.',
      ...(await captureShot(page, roleKey, '03-users.png')),
    });

    await gotoAndWait(page, '/contracts', async (p) => {
      await waitForHeading(p, /Contracts/i);
    });
    steps.push({
      title: 'Contracts overview',
      body: 'Admins can inspect contracts across parties for support and compliance follow-up.',
      ...(await captureShot(page, roleKey, '04-contracts.png')),
    });

    await gotoAndWait(page, '/datasets', async (p) => {
      await waitForHeading(p, /Datasets/i);
    });
    steps.push({
      title: 'Datasets overview',
      body: 'Browse the global **dataset** catalog to verify publishing and visibility.',
      ...(await captureShot(page, roleKey, '05-datasets.png')),
    });

    await gotoAndWait(page, '/notifications', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Notifications',
      body: 'Operational alerts and system notices appear here.',
      ...(await captureShot(page, roleKey, '06-notifications.png')),
    });

    writeGuideFile(roleKey, buildMarkdown({ roleKey, meta: ROLE_META[roleKey], email, steps }));
    generatedRoles.push(roleKey);
  });

  test('Write role guides index', async () => {
    // Ensure index lists all roles even if a prior file run partially completed.
    const roles = ['TDC', 'TDP', 'TSP', 'AppAdmin'];
    writeIndex(roles);
    expect(roles.length).toBe(4);
  });
});
