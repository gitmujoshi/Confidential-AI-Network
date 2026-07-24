/**
 * Multi-model screenshot guide:
 * create + sign a contract per catalog type; train tabular / text+DP / vision.
 *
 * Run: npm run test:e2e:multi-model-guide
 */
const { test, expect } = require('@playwright/test');
const {
  ALL_TRACKS,
  TRAINABLE_TRACKS,
  assertLocalTrainingReady,
  createSignedAndOptionallyTrain,
} = require('./helpers/multi-model-training');
const {
  captureShot,
  settle,
  loginTdcUi,
  writeGuide,
} = require('./helpers/multi-model-user-guide');

test.describe('Multi-model user guide (screenshot tour)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Multi-model guide captured on Desktop Chromium only');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Contract + train each catalog model type', async ({ page }) => {
    test.setTimeout(25 * 60 * 1000);
    await assertLocalTrainingReady();

    const steps = [];
    const results = [];

    steps.push({
      title: 'Overview — one contract per model type',
      body: [
        'The platform catalog supports five AI model **types**: `transformer`, `cnn`, `rnn`, `gan`, and `other`.',
        'This tour creates a **SIGNED** Ricardian contract for each type. Local-docker training runs for **tabular**, **text + DP-SGD**, and **vision**.',
        '`rnn` and `gan` are signed for catalog coverage; dedicated trainers for those architectures are not wired yet.',
      ].join('\n'),
    });

    await loginTdcUi(page);
    await page.goto('/tdc/training');
    await expect(page.getByRole('heading', { name: /Training/i })).toBeVisible({ timeout: 120000 });
    steps.push({
      title: 'TDC Training home (before multi-model runs)',
      body: 'Start from **Training**. Each track below adds a signed contract and (where supported) a completed local job.',
      ...(await captureShot(page, '00-tdc-training-home.png')),
    });

    for (const track of ALL_TRACKS) {
      const run = await createSignedAndOptionallyTrain(track);
      const status = track.trains ? run.job?.status || 'UNKNOWN' : 'SIGNED (no train)';
      results.push({
        title: track.title,
        contractId: run.contractId,
        jobId: run.jobId,
        status,
      });

      await page.goto(`/tdc/contracts/${encodeURIComponent(run.contractId)}`);
      await expect(page.getByText(/SIGNED/i).first()).toBeVisible({ timeout: 120000 });
      steps.push({
        title: `${track.title} — signed contract`,
        body: [
          `Catalog type **\`${track.catalogType}\`**, framework **${track.framework}**, architecture **\`${track.architecture}\`**.`,
          `Contract \`${run.contractId}\` is **SIGNED** (TDP + TSP).`,
          track.trains
            ? 'Local training is started next for this modality.'
            : 'Catalog-only track: no dedicated local trainer path yet (signing coverage only).',
        ].join('\n'),
        ...(await captureShot(page, `${track.id}-01-signed-contract.png`)),
      });

      if (!track.trains) continue;

      await page.goto('/tdc/training');
      await expect(page.getByText(run.contractId, { exact: false }).first()).toBeVisible({
        timeout: 120000,
      });
      const contractCard = page.locator('.MuiCard-root').filter({ hasText: run.contractId }).first();
      await expect(contractCard).toBeVisible({ timeout: 60000 });
      const details = contractCard.getByRole('button', { name: /View details/i }).first();
      if (await details.isVisible().catch(() => false)) {
        await details.click();
        await settle(page, 800);
      }
      await expect(page.getByText(/COMPLETED/i).first()).toBeVisible({ timeout: 60000 });

      if (track.id === 'text-dp') {
        await expect(
          page.getByText(/differential privacy|privacy metrics|epsilon|DP/i).first()
        )
          .toBeVisible({ timeout: 15000 })
          .catch(() => {});
      }

      steps.push({
        title: `${track.title} — training completed`,
        body: [
          `Job \`${run.jobId}\` finished with status **COMPLETED**.`,
          track.id === 'text-dp'
            ? 'Text track includes **Opacus DP-SGD** privacy metrics when the trainer reports them.'
            : `Modality: **${track.id}** (\`taskType\` in contract trainingParams).`,
        ].join('\n'),
        ...(await captureShot(page, `${track.id}-02-training-completed.png`)),
      });
    }

    // Highlight trainable summary on training page
    await page.goto('/tdc/training');
    await settle(page, 600);
    steps.push({
      title: 'Training list after multi-model runs',
      body: [
        `Completed trainable tracks: ${TRAINABLE_TRACKS.map((t) => t.id).join(', ')}.`,
        'Use **View logs** / **View job provenance** on any completed card for run details.',
      ].join('\n'),
      ...(await captureShot(page, '99-tdc-training-after-all.png')),
    });

    const out = writeGuide({ steps, results });
    // eslint-disable-next-line no-console
    console.log(`✅ Multi-model guide written: ${out}`);
  });
});
