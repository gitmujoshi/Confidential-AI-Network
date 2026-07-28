/**
 * Captures OCI Mock UI screenshots for the GitHub Pages product tour.
 *
 * Run (frontend only; no backend required):
 *   cd frontend && npm run test:e2e:oci-demo
 *
 * Output: docs/guides/oci-scaffold-demo/screenshots/
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCREENSHOT_ROOT = path.join(
  REPO_ROOT,
  'docs/guides/oci-scaffold-demo/screenshots'
);

const TABS = [
  { index: 0, file: '01-scaffolds.png', label: 'Scaffolds' },
  { index: 1, file: '02-onboarding-keys-vault.png', label: 'Onboarding · Keys & Vault' },
  { index: 2, file: '03-tsp-confidential-env.png', label: 'TSP confidential env' },
  { index: 3, file: '04-contract.png', label: 'Contract' },
  { index: 4, file: '05-training-logs.png', label: 'Training logs' },
  { index: 5, file: '06-provenance.png', label: 'Provenance' },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function settle(page, ms = 500) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

async function captureShot(page, fileName) {
  ensureDir(SCREENSHOT_ROOT);
  await settle(page);
  await page.screenshot({
    path: path.join(SCREENSHOT_ROOT, fileName),
    fullPage: true,
    animations: 'disabled',
  });
}

test.describe('OCI scaffold mock UI (product tour screenshots)', () => {
  test.describe.configure({ mode: 'serial' });

  test('capture all OCI mock tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/demo/oci-scaffolds');
    await expect(page.getByRole('heading', { name: /OCI scaffolds/i })).toBeVisible({
      timeout: 60000,
    });

    for (const tab of TABS) {
      await page.getByRole('tab', { name: tab.label }).click();
      await expect(page.getByRole('tab', { name: tab.label })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await captureShot(page, tab.file);
    }

    const written = TABS.map((t) => t.file);
    for (const file of written) {
      expect(fs.existsSync(path.join(SCREENSHOT_ROOT, file))).toBeTruthy();
    }
  });
});
