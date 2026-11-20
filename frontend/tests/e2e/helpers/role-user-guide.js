const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');
const { E2E_ROLE_USERS, PASSWORD } = require('./role-crud-api');

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const GUIDE_ROOT = path.join(REPO_ROOT, 'docs/guides/role-user-guides');
const SCREENSHOT_ROOT = path.join(GUIDE_ROOT, 'screenshots');

const ROLE_META = {
  TDC: {
    file: 'TDC_USER_GUIDE.md',
    title: 'TDC User Guide — Training Data Consumer',
    shortName: 'TDC',
    summary:
      'As a Training Data Consumer you browse datasets, create Ricardian contracts, wait for TDP+TSP signatures, and start training. A Local TSP runs on this machine. An Azure or GCP TSP submits to that TSP’s existing cluster. Your **party signing key** is created at registration (algorithm choice on `/register`).',
  },
  TDP: {
    file: 'TDP_USER_GUIDE.md',
    title: 'TDP User Guide — Training Data Provider',
    shortName: 'TDP',
    summary:
      'As a Training Data Provider you publish datasets, review incoming contracts, and **sign** with the party signing key created at registration.',
  },
  TSP: {
    file: 'TSP_USER_GUIDE.md',
    title: 'TSP / CCRP User Guide — Tech Service Provider',
    shortName: 'TSP',
    summary:
      'As a Tech Service Provider (also called CCRP in older docs) you host confidential training on a Local machine or on your existing Azure or GCP cluster. Save the cluster and kubeconfig path on the dashboard **Cloud Provider** card, and **co-sign** contracts with the party signing key from registration.',
  },
  AppAdmin: {
    file: 'APPADMIN_USER_GUIDE.md',
    title: 'AppAdmin User Guide — Platform Administrator',
    shortName: 'AppAdmin',
    summary:
      'As AppAdmin you manage users, monitor system health from the admin dashboard, and oversee contracts and datasets across the network.',
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function shotDir(roleKey) {
  const dir = path.join(SCREENSHOT_ROOT, roleKey.toLowerCase());
  ensureDir(dir);
  return dir;
}

async function settle(page, ms = 400) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

async function seedAuth(page, roleKey) {
  const axios = require('axios');
  const { getBackendURL } = require('../../../load-config');
  const { ensurePartySigningReady, DEFAULT_SIGNING_ALGORITHM } = require('./party-signing-e2e');
  const { email } = E2E_ROLE_USERS[roleKey];
  const loginResponse = await axios.post(`${getBackendURL()}/api/auth/login`, {
    email,
    password: PASSWORD,
  });
  const { accessToken, user } = loginResponse.data || {};
  if (!accessToken || !user) {
    throw new Error(`API login failed for ${roleKey} (${email})`);
  }

  await ensurePartySigningReady({
    accessToken,
    partyType: user.partyType || roleKey,
    algorithm: DEFAULT_SIGNING_ALGORITHM,
  }).catch((e) => {
    console.warn(`Role guide signing key (${roleKey}):`, e.response?.data || e.message);
  });

  await page.addInitScript(
    ({ token, u }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    },
    { token: accessToken, u: user }
  );

  return { email, user };
}

async function captureShot(page, roleKey, fileName, options = {}) {
  const fullPage = options.fullPage !== false;
  const outPath = path.join(shotDir(roleKey), fileName);
  await settle(page, options.settleMs ?? 500);
  await page.screenshot({
    path: outPath,
    fullPage,
    animations: 'disabled',
  });
  return {
    fileName,
    relPath: `screenshots/${roleKey.toLowerCase()}/${fileName}`,
  };
}

async function gotoAndWait(page, url, waitFn) {
  await page.goto(url);
  await expect(page).not.toHaveURL(/\/login/);
  if (waitFn) {
    await waitFn(page);
  }
  await settle(page);
}

async function waitForHeading(page, name, timeout = 120000) {
  await expect(page.getByRole('heading', { name })).toBeVisible({ timeout });
}

async function waitDashboard(page, partyLabel, welcome) {
  await page
    .getByText(new RegExp(`Loading ${partyLabel} dashboard`, 'i'))
    .waitFor({ state: 'hidden', timeout: 120000 })
    .catch(() => {});
  await waitForHeading(page, welcome);
}

const ROLE_SETUP = {
  TDP: `## Signing and data keys

Your party signing key is created at registration (**ECDSA-P256** unless you choose RSA). Sign the contract with that key. A dataset row can record AES-256-GCM and an optional \`encryption_key_id\`. Platform encryption holds that key on the platform. A principal-held data key is not uploaded here. CAN release wraps that key to the clean-room attestation and stores only the release time, documented in the [user guide](../../USER_GUIDE.md#key-release-policy).
`,
  TDC: `## Before you train or deploy

The screenshots above are the local demo. A new TDC still sets privacy on the contract and, for a cloud score, a cluster you already run.

### Privacy-preserving training

On the contract details step, set the privacy technique to **Differential Privacy**. That turns on Opacus DP-SGD for a **text** job (AG News and DistilBERT). You can also send \`trainingParams.differentialPrivacy.enabled: true\` with:

| Field | Meaning | If you leave it blank |
|---|---|---|
| \`epsilon\` | Privacy budget | \`1.0\` |
| \`delta\` | Failure probability | \`1e-5\` |
| \`maxGradNorm\` | Per-sample clip | \`1.0\` |

A completed job shows \`results.privacyMetrics\` (ε, δ, mechanism). The lifecycle screenshot tour uses the quality DistilBERT profile with differential privacy **off** so the topic labels stay meaningful. The fast NLP path keeps DP on (\`ε=0.5\`).

### Inference on a cluster you run

Training still uses the TSP named on the contract. Deploy is your choice.

1. Open **Inference** and save **Azure**, **GCP**, or **AWS**: cluster name, the account identifiers, namespace, and the kubeconfig path on this API host.
2. Azure needs a subscription, resource group, and AKS name. GCP needs a project, location, and GKE name. AWS needs a region and EKS name.
3. The pool label is \`can.azure/pool=confidential\`, \`can.gcp/pool=confidential\`, or \`can.aws/pool=confidential\`, with a matching toleration. The Job uses service account \`training-job\`. The image is \`INFERENCE_CCR_IMAGE\`, or the local trainer image when that is unset.
4. Register the model on **Training**, choose that **Deploy target**, and deploy. A missing kubeconfig returns **502** and leaves the model undeployed. No cluster is created.
5. **Local** is the only target that scores in the Inference app (\`infer.py\`). A cloud deployment does not mount \`model.bin\`, does not copy the score back, and records attestation as **simulated**. **Run prediction** on a cloud deployment returns **409**.

Full operator variables are in [TDC training runtime](../../training/TDC_TRAINING_RUNTIME.md).

Signing, dataset encryption, and CAN key release are in [Before a new TSP or TDC starts](../../USER_GUIDE.md#before-a-new-tsp-or-tdc-starts) and the signing and release sections that follow it.
`,
  TSP: `## Before you host a job

The screenshots above show where to type the cluster. CAN does not create a subscription, project, or cluster. You point it at one you already run.

### Local machine

Set \`TRAINING_EXECUTION_MODE\` to \`local-docker\`, \`local-native\`, or \`local-mlx\`. \`TRAINING_SIMULATION_MODE\` stays \`false\` when you want a real run. Build the trainer image from the repo root:

\`\`\`bash
docker build -t contractmanagement/local-trainer:latest \\
  -f backend/local-training/Dockerfile \\
  --build-context inference=inference/backend \\
  backend/local-training
\`\`\`

### Azure, GCP, or OCI

1. Use an existing AKS, GKE, or OKE cluster. On the dashboard **Cloud Provider** card, save the cluster name and the kubeconfig path. That path is a file on the API host. \`AZURE_CCR_KUBECONFIG\` or \`GCP_CCR_KUBECONFIG\` fills the path when the card leaves it blank.
2. Label the pool \`can.azure/pool=confidential\` or \`can.gcp/pool=confidential\`, and allow the toleration \`can.azure/confidential\` or \`can.gcp/confidential\`.
3. Create service account \`training-job\` in the namespace you save (default \`contract-management\`). OCI uses \`training-job-sa\` when the contract does not name one.
4. A missing kubeconfig fails the job. No cluster is created. Attestation stays **simulated** until a guest report is accepted. Store the AMD ARK at \`SEV_SNP_ARK_PEM\`, then a TDC, TSP, or AppAdmin posts the report, VCEK, and ASK to \`POST /api/tdc/training/jobs/{jobId}/sev-snp-quote\`.
5. AWS training is not started. A TDC can still deploy inference to an existing EKS cluster from the Inference page.

Full operator variables are in [TDC training runtime](../../training/TDC_TRAINING_RUNTIME.md).

Your party signing key is created when you register. Contract KMS fields name a key. They do not release it. CAN key release wraps the DEK and MEK to the clean-room attestation, with a 10-minute escrow, described in the [user guide](../../USER_GUIDE.md#key-release-policy).
`,
};

function buildMarkdown({ roleKey, meta, email, steps }) {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const lines = [
    `# ${meta.title}`,
    '',
    `> Auto-generated by the Playwright E2E suite (\`npm run test:e2e:user-guides\` in \`frontend/\`).`,
    `> Screenshots refreshed: **${generatedAt}**. Prefer regenerating over hand-editing images.`,
    '',
    meta.summary,
    '',
    '## Who this is for',
    '',
    `| | |`,
    `|---|---|`,
    `| Role | **${meta.shortName}** |`,
    `| Demo user | \`${email}\` |`,
    `| Password | \`TestNewPassword123!\` (local E2E seed only) |`,
    `| Signing | Party signing key provisioned at **registration** (ECDSA-P256 default); used on contract **Sign** |`,
    '',
    '## Happy path',
    '',
  ];

  steps.forEach((step, index) => {
    lines.push(`### ${index + 1}. ${step.title}`, '');
    if (step.body) {
      lines.push(step.body, '');
    }
    if (step.relPath) {
      lines.push(`![${step.title}](${step.relPath})`, '');
    }
  });

  if (ROLE_SETUP[roleKey]) {
    lines.push(ROLE_SETUP[roleKey].trimEnd(), '');
  }

  lines.push(
    '## Related docs',
    '',
    '- [Participant onboarding & E2E lifecycle](../PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md)',
    '- [Contract signing user guide](../../features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md)',
    '- [Top-level user guide](../../USER_GUIDE.md)',
    '- [Role user guides index](README.md)',
    ''
  );

  return lines.join('\n');
}

function writeGuideFile(roleKey, markdown) {
  ensureDir(GUIDE_ROOT);
  const meta = ROLE_META[roleKey];
  const out = path.join(GUIDE_ROOT, meta.file);
  fs.writeFileSync(out, markdown, 'utf8');
  return out;
}

function writeIndex(generatedRoles) {
  ensureDir(GUIDE_ROOT);
  const generatedAt = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Role user guides (screenshot tours)',
    '',
    `Auto-generated on **${generatedAt}** by \`npm run test:e2e:user-guides\`.`,
    '',
    'Each guide walks through the primary screens for one party type, with screenshots captured from a live local stack (Chromium desktop).',
    '',
    '| Role | Guide |',
    '|------|-------|',
  ];

  for (const roleKey of generatedRoles) {
    const meta = ROLE_META[roleKey];
    lines.push(`| ${meta.shortName} | [${meta.title}](${meta.file}) |`);
  }

  lines.push(
    '',
    '## Regenerate',
    '',
    '```bash',
    '# From repo root: stack must be up (backend :5001, frontend :3000, Keycloak)',
    'cd frontend',
    'npm run test:e2e:user-guides',
    '```',
    '',
    'Screenshots land in `screenshots/<role>/`. Markdown files in this folder are overwritten on each run.',
    '',
    '← [Guides index](../README.md)',
    ''
  );

  const out = path.join(GUIDE_ROOT, 'README.md');
  fs.writeFileSync(out, lines.join('\n'), 'utf8');
  return out;
}

/**
 * Create a contract signed by TDP + TSP and run local-docker training to completion.
 * Used by the TDC screenshot guide so the docs show a real SIGNED + trained example.
 */
async function prepareSignedContractWithLocalTraining() {
  const {
    createSignedNlpDpContractAndTrain,
    fetchTrainingEnv,
  } = require('./nlp-dp-training');

  const training = await fetchTrainingEnv();
  const mode = training.trainingExecutionMode;
  if (mode !== 'local-docker' && mode !== 'local-native') {
    throw new Error(
      `TDC guide needs TRAINING_EXECUTION_MODE=local-docker (or local-native); current: ${mode}`
    );
  }
  if (training.trainingSimulationMode === true || training.trainingSimulationMode === 'true') {
    throw new Error('TDC guide needs TRAINING_SIMULATION_MODE=false for real local execution');
  }

  const result = await createSignedNlpDpContractAndTrain();
  if (!result?.job || result.job.status !== 'COMPLETED') {
    throw new Error(
      `Local training did not complete (status: ${result?.job?.status || 'unknown'}) for ${result?.contractId}`
    );
  }
  return result;
}

module.exports = {
  ROLE_META,
  GUIDE_ROOT,
  SCREENSHOT_ROOT,
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
  prepareSignedContractWithLocalTraining,
};
