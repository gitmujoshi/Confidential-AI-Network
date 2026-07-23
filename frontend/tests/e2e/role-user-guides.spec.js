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
    await settle(page, 1000);
    await expect(page.getByRole('heading', { name: /Create Contract/i })).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'Create contract — Step 1: Select template',
      body: [
        'Open **Create contract** from the sidebar.',
        'The wizard has five steps. Start by choosing a Ricardian **contract template**.',
      ].join('\n'),
      ...(await captureShot(page, roleKey, '05-create-step-template.png')),
    });

    const selectTemplate = page.getByRole('button', { name: /Select This Template/i }).first();
    await expect(selectTemplate).toBeVisible({ timeout: 60000 });
    await selectTemplate.click();
    await page.getByRole('button', { name: /^Next$/i }).click();
    await expect(page.getByText(/Contract Details & Dataset Selection/i).first()).toBeVisible({ timeout: 30000 });
    steps.push({
      title: 'Create contract — Step 2: Details & datasets',
      body: [
        'Set price, duration, terms, and privacy/accuracy requirements.',
        'Select **1–3 datasets** from Training Data Providers.',
      ].join('\n'),
      ...(await captureShot(page, roleKey, '06-create-step-details.png')),
    });

    // Ensure required fields so Next can advance.
    const duration = page.getByLabel(/Duration/i).first();
    if (await duration.isVisible().catch(() => false)) {
      const v = await duration.inputValue().catch(() => '');
      if (!v) await duration.fill('90');
    }
    const terms = page.getByLabel(/Terms and Conditions/i).first();
    if (await terms.isVisible().catch(() => false)) {
      const v = await terms.inputValue().catch(() => '');
      if (!v) await terms.fill('E2E user-guide contract terms');
    }
    const e2eSample = page.getByRole('heading', { name: 'E2E Sample Dataset', exact: true }).first();
    const mnist = page.getByRole('heading', { name: /mnist/i }).first();
    if (await e2eSample.isVisible().catch(() => false)) {
      await e2eSample.click({ force: true });
    } else if (await mnist.isVisible().catch(() => false)) {
      await mnist.click({ force: true });
    } else {
      await page.locator('main .MuiCard-root').filter({ hasText: /Dataset|records|Tabular|Vision/i }).first().click({ force: true }).catch(() => {});
    }

    await page.getByRole('main').getByRole('button', { name: /^Next$/i }).click({ force: true });
    await expect(page.getByText(/Configure Environment & TSP/i).first()).toBeVisible({ timeout: 60000 });
    steps.push({
      title: 'Create contract — Step 3: Environment & TSP',
      body: [
        'Optionally filter and select a **TSP** (clean-room / compute provider).',
        'Configure environment and KMS settings for the training session.',
      ].join('\n'),
      ...(await captureShot(page, roleKey, '07-create-step-environment.png')),
    });

    const tspCard = page.locator('[data-testid^="tsp-card-"]').filter({ hasText: 'ccrp.e2e@test.com' });
    if (await tspCard.isVisible().catch(() => false)) {
      await tspCard.click({ force: true });
    }

    await page.getByRole('main').getByRole('button', { name: /^Next$/i }).click({ force: true });
    await expect(page.getByText(/Review Legal Document|Smart Contract/i).first()).toBeVisible({ timeout: 90000 });
    steps.push({
      title: 'Create contract — Step 4: Review legal & smart contract',
      body: 'Review the generated legal document preview and smart-contract binding before creating the contract.',
      ...(await captureShot(page, roleKey, '08-create-step-review.png')),
    });

    await page.getByRole('main').getByRole('button', { name: /^Next$/i }).click({ force: true });
    await expect(
      page.getByRole('main').getByRole('button', { name: /Create (SCITT CCF )?Contract/i })
    ).toBeVisible({ timeout: 30000 });
    steps.push({
      title: 'Create contract — Step 5: Submit',
      body: 'Confirm and click **Create Contract**. The contract enters **PENDING_TDP_APPROVAL** for dataset owners to sign.',
      ...(await captureShot(page, roleKey, '09-create-step-submit.png')),
    });

    await gotoAndWait(page, '/tdc/training', async (p) => {
      await waitForHeading(p, /Training/i);
    });
    steps.push({
      title: 'Training',
      body: '**Training** starts a job against a fully signed contract, monitors progress, and surfaces privacy metrics when differential privacy is enabled.',
      ...(await captureShot(page, roleKey, '10-training.png')),
    });

    await gotoAndWait(page, '/can/jobs', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'CAN jobs',
      body: '**CAN Jobs** tracks confidential job coordination (escrow, attestation signals, release) for clean-room runs.',
      ...(await captureShot(page, roleKey, '11-can-jobs.png')),
    });

    await gotoAndWait(page, '/notifications', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Notifications',
      body: '**Notifications** surfaces signature requests, training updates, and system alerts.',
      ...(await captureShot(page, roleKey, '12-notifications.png')),
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
      await expect(
        p.getByRole('main').getByText(/Contracts|My Contracts/i).first()
      ).toBeVisible({ timeout: 120000 });
    });
    steps.push({
      title: 'Contracts awaiting signature',
      body: [
        'Open **Contracts** to see agreements that use your datasets.',
        'Pending items show status **PENDING_TDP_APPROVAL**. Use the pen / **Sign Contract** action to open the detail page.',
      ].join('\n'),
      ...(await captureShot(page, roleKey, '05-contracts.png')),
    });

    // Open a pending contract detail so the Sign CTA is visible when available.
    const signFromList = page.getByTestId('tdp-sign-from-list').first();
    const viewDetails = page.getByRole('button', { name: /View Details/i }).first();
    if (await signFromList.isVisible().catch(() => false)) {
      await signFromList.click();
    } else if (await viewDetails.isVisible().catch(() => false)) {
      await viewDetails.click();
      const fullDetails = page.getByRole('button', { name: /View Full Details|Sign Contract as TDP/i }).first();
      if (await fullDetails.isVisible().catch(() => false)) {
        await fullDetails.click();
      }
    } else {
      // Table view: open first visibility icon / row action
      const eye = page.getByRole('button', { name: /View Details/i }).or(page.locator('[title="View Details"]')).first();
      if (await eye.isVisible().catch(() => false)) await eye.click();
      const signDlg = page.getByTestId('tdp-sign-from-dialog');
      if (await signDlg.isVisible().catch(() => false)) {
        await signDlg.click();
      } else {
        const full = page.getByRole('button', { name: /View Full Details/i });
        if (await full.isVisible().catch(() => false)) await full.click();
      }
    }

    await settle(page, 1000);
    const signBtn = page.getByTestId('tdp-sign-contract').or(page.getByRole('button', { name: /Sign Contract as TDP/i }));
    if (await signBtn.first().isVisible().catch(() => false)) {
      steps.push({
        title: 'Sign contract as TDP',
        body: [
          'On **Contract Details**, review terms, datasets, and DEPA IDs.',
          'Click **Sign Contract as TDP** to approve use of your data. Status moves to **PENDING_TSP_APPROVAL**.',
        ].join('\n'),
        ...(await captureShot(page, roleKey, '06-sign-contract.png')),
      });
    } else {
      steps.push({
        title: 'Contract detail (signing)',
        body: [
          'Open a contract in **PENDING_TDP_APPROVAL** to see **Sign Contract as TDP** in the Actions panel.',
          'If no pending contracts exist yet, ask a TDC to create one that references your dataset.',
        ].join('\n'),
        ...(await captureShot(page, roleKey, '06-sign-contract.png')),
      });
    }

    await gotoAndWait(page, '/notifications', async (p) => {
      await expect(p.getByRole('main')).toBeVisible();
    });
    steps.push({
      title: 'Notifications',
      body: 'Watch for signature requests and dataset access events here.',
      ...(await captureShot(page, roleKey, '07-notifications.png')),
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
