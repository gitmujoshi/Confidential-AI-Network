/**
 * Captures OCI product-tour screenshots (registration → prediction).
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
  { file: '01-registration.png', label: '1. Registration' },
  { file: '02-catalog.png', label: '2. Catalog' },
  { file: '03-contract.png', label: '3. Contract' },
  { file: '04-training.png', label: '4. Training' },
  { file: '05-provenance.png', label: '5. Provenance' },
  { file: '06-deploy-predict.png', label: '6. Deploy & predict' },
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

test.describe('OCI product tour screenshots', () => {
  test.describe.configure({ mode: 'serial' });

  test('capture registration → prediction tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/demo/oci-scaffolds');
    await expect(
      page.getByRole('heading', { name: /From registration to a live prediction/i })
    ).toBeVisible({ timeout: 60000 });

    for (const tab of TABS) {
      await page.getByRole('tab', { name: tab.label }).click();
      await expect(page.getByRole('tab', { name: tab.label })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await captureShot(page, tab.file);
    }

    for (const tab of TABS) {
      expect(fs.existsSync(path.join(SCREENSHOT_ROOT, tab.file))).toBeTruthy();
    }
  });
});
