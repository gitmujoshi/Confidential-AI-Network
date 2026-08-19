/**
 * Shared helpers for party signing keys at registration and E2E backfill.
 * Keys are created during POST /api/auth/register for TDP/TDC/TSP.
 */
const axios = require('axios');
const { getBackendURL } = require('../../../load-config');

const DEFAULT_SIGNING_ALGORITHM = 'ECDSA-P256';
const SIGNING_ALGORITHMS = ['ECDSA-P256', 'RSA-2048', 'RSA-4096'];

function registrationSigningFields(algorithm = DEFAULT_SIGNING_ALGORITHM) {
  const algo = SIGNING_ALGORITHMS.includes(algorithm) ? algorithm : DEFAULT_SIGNING_ALGORITHM;
  return { signingAlgorithm: algo };
}

/**
 * Select a MUI Select option by its FormControl label text.
 */
async function selectMuiByLabel(page, labelText, optionName) {
  const control = page.locator('.MuiFormControl-root').filter({ hasText: labelText }).first();
  await control.getByRole('combobox').click();
  await page.getByRole('option', { name: optionName }).click();
}

/**
 * Choose the party signing algorithm on /register and scroll it into view for screenshots.
 */
async function chooseSigningAlgorithm(page, algorithm = DEFAULT_SIGNING_ALGORITHM) {
  const section = page.getByRole('heading', { name: /Party signing key/i });
  await expectVisible(page, section);
  await section.scrollIntoViewIfNeeded();

  const label = page.getByLabel('Signing algorithm');
  await expectVisible(page, label);
  await label.scrollIntoViewIfNeeded();

  const optionRe =
    algorithm === 'ECDSA-P256'
      ? /ECDSA-P256/i
      : algorithm === 'RSA-2048'
        ? /RSA-2048/i
        : /RSA-4096/i;
  await selectMuiByLabel(page, 'Signing algorithm', optionRe);
  return algorithm;
}

async function expectVisible(page, locator) {
  const { expect } = require('@playwright/test');
  await expect(locator).toBeVisible({ timeout: 15000 });
}

/**
 * Ensure the authenticated user has an active signing key (backfill for seeded users).
 */
async function ensureActiveSigningKey(accessToken, algorithm = DEFAULT_SIGNING_ALGORITHM) {
  const backendURL = getBackendURL();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const listed = await axios.get(`${backendURL}/api/signing/keys`, { headers });
  const keys = listed.data?.keys || [];
  if (Array.isArray(keys) && keys.some((k) => (k.keyStatus || k.status) === 'active')) {
    return { status: 'exists', keys };
  }

  const gen = await axios.post(
    `${backendURL}/api/signing/keys/generate`,
    { algorithm },
    { headers }
  );
  return { status: 'generated', result: gen.data };
}

/**
 * After login (or register+login), ensure party signing key exists for TDP/TDC/TSP.
 */
async function ensurePartySigningReady({ accessToken, partyType, algorithm = DEFAULT_SIGNING_ALGORITHM }) {
  const role = String(partyType || '').toUpperCase();
  const signingRoles = new Set(['TDP', 'TDC', 'TSP', 'CCRP']);
  if (!signingRoles.has(role)) {
    return { status: 'skipped', reason: `partyType ${partyType}` };
  }
  return ensureActiveSigningKey(accessToken, algorithm);
}

module.exports = {
  DEFAULT_SIGNING_ALGORITHM,
  SIGNING_ALGORITHMS,
  registrationSigningFields,
  selectMuiByLabel,
  chooseSigningAlgorithm,
  ensureActiveSigningKey,
  ensurePartySigningReady,
};
