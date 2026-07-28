const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../../load-config');

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const GUIDE_ROOT = path.join(REPO_ROOT, 'docs/guides/lifecycle-user-guide');
const SCREENSHOT_ROOT = path.join(GUIDE_ROOT, 'screenshots');
const PASSWORD = 'TestNewPassword123!';
const BACKEND_URL = getBackendURL();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function settle(page, ms = 400) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

async function captureShot(page, fileName, options = {}) {
  ensureDir(SCREENSHOT_ROOT);
  const fullPage = options.fullPage !== false;
  const outPath = path.join(SCREENSHOT_ROOT, fileName);
  await settle(page, options.settleMs ?? 500);
  await page.screenshot({
    path: outPath,
    fullPage,
    animations: 'disabled',
  });
  return {
    fileName,
    relPath: `screenshots/${fileName}`,
  };
}

async function loginViaAPI({ email, password = PASSWORD }) {
  const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
  const token = res.data?.accessToken;
  const user = res.data?.user;
  if (!token || !user) throw new Error(`API login failed for ${email}`);
  return { token, user };
}

async function completeFirstLoginPasswordViaAPI({ email, currentPassword, newPassword = PASSWORD }) {
  const res = await axios.post(`${BACKEND_URL}/api/auth/first-login-password`, {
    email,
    currentPassword,
    newPassword,
  });
  if (res.status !== 200 || !res.data?.success) {
    throw new Error(`First-login password update failed for ${email}`);
  }
}

async function ensureTspLocalProvider(_email) {
  const { token: adminToken } = await loginViaAPI({ email: 'appadmin.e2e@test.com' });
  let rows = [];
  try {
    const res = await axios.get(`${BACKEND_URL}/api/users/tsp`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    rows = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    const res = await axios.get(`${BACKEND_URL}/api/users/ccrp`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    rows = Array.isArray(res.data) ? res.data : [];
  }

  // Only two Local TSPs in the environment — static E2E + jurisdiction local.
  // OCI TSPs (tsp.oci.e2e@test.com, etc.) must stay on OCI — never force Local onto them.
  const KEEP_LOCAL = new Set(['ccrp.e2e@test.com', 'tsp.local@jurisdiction-test.com']);
  const KEEP_OCI = new Set(['tsp.oci.e2e@test.com', 'tsp.yotta@in-fintech-test.com']);

  for (const row of rows) {
    const rowEmail = String(row.email || '').toLowerCase();
    const existing = Array.isArray(row.cloudProviders) ? row.cloudProviders.map(String) : [];
    const hasLocal = existing.map((p) => p.toLowerCase()).includes('local');
    const shouldKeepLocal = KEEP_LOCAL.has(rowEmail);
    const shouldKeepOci = KEEP_OCI.has(rowEmail);

    if (shouldKeepOci) {
      if (JSON.stringify(existing) === JSON.stringify(['OCI'])) continue;
      await axios.put(
        `${BACKEND_URL}/api/users/${row.id}`,
        {
          cloudProviders: ['OCI'],
          description:
            row.description ||
            'OCI infrastructure provider: confidential-vm on OKE, OCI Vault, Object Storage, SPIFFE/WIF. Not Local Docker.',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      continue;
    }

    if (shouldKeepLocal) {
      if (JSON.stringify(existing) === JSON.stringify(['Local'])) continue;
      await axios.put(
        `${BACKEND_URL}/api/users/${row.id}`,
        {
          cloudProviders: ['Local'],
          description: row.description || 'Static Local Docker TSP',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      continue;
    }

    if (!hasLocal) continue;
    const next = existing.filter((p) => p.toLowerCase() !== 'local');
    try {
      await axios.put(
        `${BACKEND_URL}/api/users/${row.id}`,
        { cloudProviders: next },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch (_) {
      /* best-effort trim */
    }
  }
}

async function logoutViaUI(page) {
  let logoutBtn = page.locator('[data-testid="logout-button"]').locator('visible=true').first();
  if (!(await logoutBtn.isVisible().catch(() => false))) {
    const openDrawer = page.getByRole('button', { name: /open drawer/i });
    if (await openDrawer.isVisible().catch(() => false)) {
      await openDrawer.click();
    }
    logoutBtn = page.locator('[data-testid="logout-button"]').locator('visible=true').first();
  }
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.evaluate((el) => el.click());
  } else {
    await page
      .getByRole('button', { name: /sign out/i })
      .locator('visible=true')
      .first()
      .evaluate((el) => el.click())
      .catch(async () => {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto('/login');
      });
  }
  await page.waitForURL(/\/login/, { timeout: 15_000 }).catch(async () => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
  });
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
}

async function loginViaUI(page, { email, password = PASSWORD }) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.getByLabel(/email address/i)).toBeVisible({ timeout: 60000 });
  await page.getByLabel(/email address/i).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 90_000 });
}

/** Seed browser auth from API tokens (resilient after long waits / FE restarts). */
async function seedSession(page, { email, password = PASSWORD }) {
  const { token, user } = await loginViaAPI({ email, password });
  await page.addInitScript(
    ({ t, u }) => {
      localStorage.setItem('authToken', t);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    },
    { t: token, u: user }
  );
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(
    ({ t, u }) => {
      localStorage.setItem('authToken', t);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    },
    { t: token, u: user }
  );
  return { token, user };
}

function buildMarkdown({ steps, generatedAt }) {
  const lines = [
    '# End-to-End Lifecycle Guide — Onboard → Sign → Train → Inference',
    '',
    `> Auto-generated by Playwright (\`npm run test:e2e:lifecycle-guide\` in \`frontend/\`).`,
    `> Screenshots refreshed: **${generatedAt}**. Prefer regenerating over hand-editing images.`,
    '',
    'This guide walks through the full multi-party happy path in the local stack:',
    '',
    '1. **Enterprise-register** **TDC**, **TDP**, and **TSP/CCRP** (User Type = Enterprise + organization)',
    '2. TDP publishes an NLP dataset (Hugging Face `ag_news` reference)',
    '3. TDC creates a Ricardian contract with **PyTorch** / **DistilBERT** (quality demo profile for meaningful AG News labels)',
    '4. TDP and TSP are notified, review, and sign',
    '5. TDC views the **SIGNED** contract, runs local-docker training, and inspects **logs** + **provenance**',
    '6. TDC **registers** the trained model, **deploys** it for local inference, and runs a **prediction** in the Inference app',
    '',
    '## Demo credentials',
    '',
    '| Role | Notes |',
    '|---|---|',
    '| TDC / TDP / TSP | Fresh **enterprise** users registered during the guide run (emails + orgs in screenshots) |',
    '| Registration mode | **User Type = Enterprise** (organization field required in the UI tour) |',
    '| Password after first login | `TestNewPassword123!` |',
    '| Local compute | TSP is configured with **Local** cloud provider for `TRAINING_EXECUTION_MODE=local-docker` |',
    '',
    '## Training configuration used in this tour',
    '',
    '| Field | Value |',
    '|---|---|',
    '| Task / modality | Text classification (`taskType: text`) — AG News topics |',
    '| Demo profile | **quality** (meaningful labels; use `LIFECYCLE_DEMO_QUALITY=false` for tiny/fast E2E) |',
    '| Model | `E2E DistilBERT Quality` (`e2e-model-nlp-distilbert-quality`) |',
    '| Architecture | `distilbert-base-uncased` |',
    '| Framework | PyTorch |',
    '| Privacy | Optional on quality path (DP-SGD remains on fast NLP E2E: tiny DistilBERT, `ε=0.5`) |',
    '| Hyperparameters | `maxEpochs=2`, `batchSize=16`, `learningRate=5e-5`, `fastDevRun=false`, `trainSubsetSize=2000` |',
    '| Dataset | Lifecycle TDP NLP catalog row with Hugging Face `ag_news` reference |',
    '| After train | Register → Deploy → Predict (local `infer.py` / Inference app) |',
    '| Expected demo prediction | Headline about Wall Street → **Business** |',
    '',
    '## Happy path',
    '',
  ];

  steps.forEach((step, index) => {
    lines.push(`### ${index + 1}. ${step.title}`, '');
    if (step.body) lines.push(step.body, '');
    if (step.relPath) lines.push(`![${step.title}](${step.relPath})`, '');
  });

  lines.push(
    '## Related docs',
    '',
    '- [Participant onboarding & E2E lifecycle (canonical text)](../PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md)',
    '- [Multi-model contracts guide](../multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md)',
    '- [TDC training + inference runtime](../../training/TDC_TRAINING_RUNTIME.md)',
    '- [Per-role screenshot guides](../role-user-guides/README.md)',
    '- [Contract signing user guide](../../features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md)',
    '- [Top-level user guide](../../USER_GUIDE.md)',
    '',
    '## Regenerate',
    '',
    '```bash',
    '# Stack must be up: backend :5001, frontend :3000, Keycloak, Docker trainer image (with infer.py)',
    'cd frontend',
    'BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide',
    '',
    '# Fast path (tiny DistilBERT + fastDevRun) instead of quality demo:',
    '# LIFECYCLE_DEMO_QUALITY=false BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide',
    '```',
    '',
    'Optional cleanup afterward (keeps seed users/catalog): `npm run cleanup:e2e-data` from repo root.',
    ''
  );

  return lines.join('\n');
}

function writeGuide(steps) {
  ensureDir(GUIDE_ROOT);
  const generatedAt = new Date().toISOString().slice(0, 10);
  const md = buildMarkdown({ steps, generatedAt });
  const out = path.join(GUIDE_ROOT, 'LIFECYCLE_USER_GUIDE.md');
  fs.writeFileSync(out, md, 'utf8');
  return out;
}

module.exports = {
  GUIDE_ROOT,
  SCREENSHOT_ROOT,
  PASSWORD,
  BACKEND_URL,
  captureShot,
  settle,
  loginViaAPI,
  loginViaUI,
  seedSession,
  logoutViaUI,
  completeFirstLoginPasswordViaAPI,
  ensureTspLocalProvider,
  writeGuide,
};
