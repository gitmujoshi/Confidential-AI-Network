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
  writeGuide,
} = require('./helpers/lifecycle-user-guide');

test.describe('Auditor product-tour screenshots', () => {
  test.describe.configure({ mode: 'serial', timeout: 5 * 60 * 1000 });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Auditor guide captured on Desktop Chromium only');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Auditor workspace → Merkle tree → contract review', async ({ page }) => {
    const session = await ensureAuditorUser();
    const list = await axios.get(`${BACKEND_URL}/api/auditor/contracts`, {
      headers: { Authorization: `Bearer ${session.token}` },
      params: { limit: 20 },
    });
    const contracts = list.data?.contracts || [];
    expect(contracts.length).toBeGreaterThan(0);

    // Prefer a contract that has training evidence when available.
    let contractId = contracts[0].contractId;
    for (const c of contracts.slice(0, 10)) {
      try {
        const tree = await axios.get(
          `${BACKEND_URL}/api/auditor/contracts/${encodeURIComponent(c.contractId)}/audit-tree`,
          { headers: { Authorization: `Bearer ${session.token}` } }
        );
        const kinds = (tree.data?.auditTree?.merkle?.leaves || []).map((l) => l.kind);
        if (kinds.includes('training_job') || kinds.includes('scitt_claim')) {
          contractId = c.contractId;
          break;
        }
      } catch (_) {
        /* try next */
      }
    }

    const steps = [];
    await captureAuditorTourSteps(page, { contractId, steps });

    // Append-only note into a small sidecar so full lifecycle regenerates the long guide.
    // Also ensure screenshots exist for product-tour Pages sync.
    expect(steps.length).toBe(3);
    console.log(`✅ Auditor screenshots for contract ${contractId} (${steps.map((s) => s.fileName).join(', ')})`);
    console.log(`   Password used for session seed: ${session.password === PASSWORD ? 'sync-default' : 'custom'}`);
  });
});
