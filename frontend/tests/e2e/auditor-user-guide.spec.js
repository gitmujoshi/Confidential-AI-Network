/**
 * Auditor-only screenshot tour (reuses an existing contract).
 * Faster than the full lifecycle guide when you only need steps 25–27.
 *
 * Run: npm run test:e2e:auditor-guide
 */
const { test, expect } = require('@playwright/test');
const axios = require('axios');
const {
  BACKEND_URL,
  PASSWORD,
  ensureAuditorUser,
  captureAuditorTourSteps,
} = require('./helpers/lifecycle-user-guide');
const {
  ROLE_META,
  captureShot,
  settle,
  buildMarkdown,
  writeGuideFile,
  writeIndex,
} = require('./helpers/role-user-guide');

test.describe('Auditor product-tour screenshots', () => {
  test.describe.configure({ mode: 'serial', timeout: 5 * 60 * 1000 });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Auditor guide captured on Desktop Chromium only');
  });

  test('Auditor workspace → Merkle tree → contract review', async ({ page }) => {
    const session = await ensureAuditorUser();
    const list = await axios.get(`${BACKEND_URL}/api/auditor/contracts`, {
      headers: { Authorization: `Bearer ${session.token}` },
      params: { limit: 20 },
    });
    const contracts = list.data?.contracts || [];
    expect(contracts.length).toBeGreaterThan(0);

    // The tour asserts the sealed caption. A training leaf can exist before the job
    // is COMPLETED, and that tree still shows "Unsealed root".
    let contractId = null;
    for (const c of contracts.slice(0, 20)) {
      try {
        const tree = await axios.get(
          `${BACKEND_URL}/api/auditor/contracts/${encodeURIComponent(c.contractId)}/audit-tree`,
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        if (tree.data?.auditTree?.merkle?.published) {
          contractId = c.contractId;
          break;
        }
      } catch (_) {
        /* try next */
      }
    }
    expect(contractId, 'need a contract whose audit root is already sealed').toBeTruthy();

    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'User Registration' })).toBeVisible({ timeout: 60000 });
    await settle(page, 400);
    await captureShot(page, 'Auditor', '00-register.png');

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel(/email address/i)).toBeVisible({ timeout: 30000 });
    const loginShot = await captureShot(page, 'Auditor', '01-login.png');

    const steps = [];
    await captureAuditorTourSteps(page, { contractId, steps });

    expect(steps.length).toBe(3);
    console.log(`✅ Auditor screenshots for contract ${contractId} (${steps.map((s) => s.fileName).join(', ')})`);
    console.log(`   Password used for session seed: ${session.password === PASSWORD ? 'sync-default' : 'custom'}`);

    const roleSteps = [
      {
        title: 'Sign in',
        body: [
          '1. Open **Login**.',
          '2. Enter the auditor email and password. The local demo user is `auditor@example.com`.',
          '3. Click **Sign In**. The first login can ask for a new password. The app then opens the auditor workspace.',
        ].join('\n'),
        ...loginShot,
      },
    ];

    await page.goto('/auditor/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Auditor workspace' })).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Loading auditor workspace…')).toBeHidden({ timeout: 90000 });
    roleSteps.push({
      title: 'Auditor workspace',
      body: [
        'The workspace lists every contract. Search by contract id, status, TDC name, or DEPA ID.',
        '**Audit tree** opens the Merkle review. **Contract** opens the Ricardian record. Both are read-only.',
      ].join('\n'),
      ...(await captureShot(page, 'Auditor', '02-workspace.png')),
    });

    await page.goto(`/auditor/contracts/${encodeURIComponent(contractId)}/audit-tree`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('heading', { name: 'Merkle audit tree' })).toBeVisible({ timeout: 90000 });
    await expect(page.getByText(/Published root/i).first()).toBeVisible({ timeout: 60000 });
    await page.locator('tbody tr').first().getByRole('button').first().click();
    await expect(page.getByText(/Inclusion proof/i).first()).toBeVisible({ timeout: 15000 });
    roleSteps.push({
      title: 'Published root and leaves',
      body: [
        `This tree is for \`${contractId}\`. **Published root** is the sealed root. The counts beside it are the training jobs, SCITT claims, and registered models.`,
        'Each row is one leaf: contract, training job, SCITT claim, or registered model. Expand a row to read the inclusion proof.',
      ].join('\n'),
      ...(await captureShot(page, 'Auditor', '03-audit-tree.png')),
    });

    const verifyBtn = page.getByRole('button', { name: /^Verify$/i }).first();
    await verifyBtn.click();
    const verifyResult = page.getByTestId('audit-verify-result');
    await expect(verifyResult.getByText(/Inclusion proof valid/i)).toBeVisible({ timeout: 30000 });
    await expect(verifyResult.getByText(/Current database record/i)).toBeVisible({ timeout: 30000 });
    roleSteps.push({
      title: 'Verify a leaf',
      body: [
        '**Verify** checks that leaf against the sealed root.',
        'The result shows the leaf hash, the calculated root, the published root, the check time, and whether the current database row still matches the sealed leaf. **Sealed leaf contents** is the payload that was hashed.',
      ].join('\n'),
      ...(await captureShot(page, 'Auditor', '04-verify.png')),
    });

    await page.getByRole('button', { name: /Open contract/i }).click();
    await expect(page.getByRole('heading', { name: /Contract Details/i }).first()).toBeVisible({
      timeout: 90000,
    });
    roleSteps.push({
      title: 'Contract review',
      body: [
        '**Open contract** shows the Ricardian contract the training used: parties, datasets, environment, and signatures.',
        '**Merkle audit tree** on this page returns to the tree. This login cannot sign the contract or start training.',
      ].join('\n'),
      ...(await captureShot(page, 'Auditor', '05-contract.png')),
    });

    const written = writeGuideFile(
      'Auditor',
      buildMarkdown({
        roleKey: 'Auditor',
        meta: ROLE_META.Auditor,
        email: session.email,
        steps: roleSteps,
      })
    );
    expect(roleSteps.length).toBe(5);
    writeIndex(['TDC', 'TDP', 'TSP', 'AppAdmin', 'Auditor']);
    console.log(`✅ Wrote ${written}`);
  });
});
