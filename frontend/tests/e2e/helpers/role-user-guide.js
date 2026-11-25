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
  Auditor: {
    file: 'AUDITOR_USER_GUIDE.md',
    title: 'Auditor User Guide — Contract and Merkle review',
    shortName: 'Auditor',
    summary:
      'As an Auditor you review every Ricardian contract and the Merkle audit tree sealed for that contract. The workspace is read-only. You do not sign, train, deploy, or hold a data key or a model key.',
    regenerate: 'npm run test:e2e:auditor-guide',
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

const ROLE_REGISTRATION = {
  TDP: `## Register

1. Open **Register** (\`/register\`) from the login page.
2. Choose **Individual** or **Enterprise**. Enterprise adds **Organization**.
3. Enter **Full Name** and **Email**. The email becomes the Keycloak username.
4. Set **Role** to **Training Data Provider (TDP)**.
5. Leave **Use Existing DID** off unless you already have a \`did:web\` or \`did:ethr\`. The system assigns a DID and a DEPA ID (\`TDP-…\`).
6. **Public Key** and wallet connection are optional. They are not the party signing key.
7. Under **Party signing key**, keep **ECDSA-P256** unless you need RSA-2048 or RSA-4096. Registration creates that key. You use it later to sign a contract.
8. Click **Register**. Keycloak must be up. On success, choose **Go to Login Page**. The first login can ask you to set a password.
9. After login, publish a dataset. That is the next section.
`,
  TDC: `## Register

1. Open **Register** (\`/register\`) from the login page.
2. Choose **Individual** or **Enterprise**. Enterprise adds **Organization**.
3. Enter **Full Name** and **Email**. The email becomes the Keycloak username.
4. Set **Role** to **Training Data Consumer (TDC)**.
5. Leave **Use Existing DID** off unless you already have a \`did:web\` or \`did:ethr\`. The system assigns a DID and a DEPA ID (\`TDC-…\`).
6. **Public Key** and wallet connection are optional. They are not the party signing key.
7. Under **Party signing key**, keep **ECDSA-P256** unless you need RSA-2048 or RSA-4096. Registration creates that key. You need it before you create or sign a contract.
8. Click **Register**. Keycloak must be up. On success, choose **Go to Login Page**. The first login can ask you to set a password.
9. After login, browse datasets and create a contract. That is the next section.
`,
  TSP: `## Register

1. Open **Register** (\`/register\`) from the login page.
2. Choose **Individual** or **Enterprise**. Enterprise adds **Organization**.
3. Enter **Full Name** and **Email**. The email becomes the Keycloak username.
4. Set **Role** to **Tech Service Provider (TSP)**.
5. Leave **Use Existing DID** off unless you already have a \`did:web\` or \`did:ethr\`. The system assigns a DID and a DEPA ID (\`TSP-…\`).
6. **Public Key** and wallet connection are optional. They are not the party signing key.
7. Under **Party signing key**, keep **ECDSA-P256** unless you need RSA-2048 or RSA-4096. Registration creates that key. You use it to co-sign a contract.
8. Click **Register**. Keycloak must be up. On success, choose **Go to Login Page**. The first login can ask you to set a password.
9. After login, open the dashboard **Cloud Provider** card and save Local, Azure, or GCP before you host a job. That is the next section.
`,
  AppAdmin: `## Register

The public form at \`/register\` lists **TDP**, **TDC**, and **TSP** only. An operator creates an AppAdmin with \`POST /api/auth/register\` and \`partyType\` \`AppAdmin\`, then the user signs in through Keycloak.

1. The operator sends name, email, and \`partyType: AppAdmin\`. A party signing key is optional for this role.
2. Keycloak must be up. The email becomes the username.
3. Open **Login**, sign in, and set a password if this is the first login.
4. The admin dashboard, users, and contracts are the next section.
`,
  Auditor: `## Register

The public form at \`/register\` lists **TDP**, **TDC**, and **TSP** only. An operator creates an Auditor with \`POST /api/auth/register\` and \`partyType\` \`Auditor\`, then the user signs in through Keycloak.

1. The operator sends name, email, and \`partyType: Auditor\`. A party signing key is not required.
2. Keycloak must be up. The email becomes the username.
3. Open **Login**, sign in, and set a password if this is the first login.
4. The auditor workspace is the next section. The demo user is \`auditor@example.com\`.
`,
};

const ROLE_SETUP = {
  TDP: `## Signing and data keys

Your party signing key is created at registration (**ECDSA-P256** unless you choose RSA). Sign the contract with that key. A dataset row can record AES-256-GCM and an optional \`encryption_key_id\`. Platform encryption holds that key on the platform. A principal-held data key is not uploaded here. When a contract uses this dataset, the clean room asks your Key Broker for the data key. The catalog key id is not that broker. The model publisher is a separate call, and the tech service provider hosts the room. The join is [Datasets, models, and the clean room](../../USER_GUIDE.md#datasets-models-and-the-clean-room).
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

Signing, dataset encryption, and CAN key release are in [Before a new TSP or TDC starts](../../USER_GUIDE.md#before-a-new-tsp-or-tdc-starts) and the signing and release sections that follow it. The model you publish is the model-key owner the clean room asks. Each dataset owner is a separate data-key broker. The tech service provider hosts the room and does not hold either key. See [Datasets, models, and the clean room](../../USER_GUIDE.md#datasets-models-and-the-clean-room).
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

Your party signing key is created when you register. Contract KMS fields name a key. They do not release it. You host the clean-room session. Dataset owners and the model publisher release the data key and the model key through their own brokers. You do not hold those keys. The join is [Datasets, models, and the clean room](../../USER_GUIDE.md#datasets-models-and-the-clean-room).
`,
  Auditor: `## Review sequence

1. Sign in. The app opens \`/auditor/dashboard\`.
2. Search by contract id, status, TDC name, or DEPA ID. Each row has **Audit tree** and **Contract**.
3. Open **Audit tree**. The page loads \`GET /api/auditor/contracts/{id}/audit-tree\`.
4. Read the root card. **Published root** means the root is sealed in \`merkle_trees\` with \`tree_type = CONTRACT_AUDIT\`. **Unsealed root** means the tree is computed from the current rows and a completed training job is not on the contract yet.
5. Read the evidence counts: training jobs, SCITT claims, and registered models.
6. Open a leaf. The kinds are \`contract\`, \`training_job\`, \`scitt_claim\`, and \`ai_model\`. The contract leaf stores status, legal document hash, Ricardian signature, parties, datasets, environment, and training parameters. A training leaf stores job status, times, metrics, and artifact hashes. A SCITT leaf stores the claim type and claim data. A model leaf stores the registered model id, name, framework, and architecture.
7. Click **Verify**. That calls \`POST /api/auditor/verify-proof\` with \`{ contractId, nodeId }\`. The page shows the sealed leaf, the leaf hash, the calculated root, the published root, the check time, and whether the current database row still matches the sealed leaf.
8. Click **Open contract** and review the Ricardian record. **Merkle audit tree** on that page returns to the tree. There is no Sign or Start training control on this path.

The root is written once. Registration of a model seals it. Opening the tree after a training job is \`COMPLETED\` seals it when no root exists yet. A later edit to the contract or the job does not replace that root. **Verify** still succeeds when the leaf sits under the saved root. The line **Current database record** says **matches the sealed leaf** or **differs from the sealed leaf**.

**Rebuild tree** reloads the same sealed root. It does not publish a second root.

A PII tombstone is \`POST /api/auditor/provenance/{id}/tombstone\` with \`{ reason, redactedFields? }\`. The Merkle leaf stays. The same id returns the first record. This write stays in this database. It is not an external filing. The workspace has no tombstone button.

AppAdmin can call the same \`/api/auditor\` routes. The screenshots in this guide are the Auditor login.

The check covers the contract, the training jobs, the SCITT claims stored for the contract, and the registered models. It records the evidence that was saved. A simulated attestation report stays simulated in that evidence. Owner key bytes are not in the leaves. The release record stores the time and the receipt, and the API does not keep the key.
`,
};

function buildMarkdown({ roleKey, meta, email, steps }) {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const lines = [
    `# ${meta.title}`,
    '',
    `> Auto-generated by the Playwright E2E suite (\`${meta.regenerate || 'npm run test:e2e:user-guides'}\` in \`frontend/\`).`,
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
    roleKey === 'Auditor'
      ? '| Access | Read-only. No contract signature, and no data key or model key |'
      : '| Signing | Party signing key provisioned at **registration** (ECDSA-P256 default); used on contract **Sign** |',
    '',
    ROLE_REGISTRATION[roleKey].trimEnd(),
    '',
  ];
  const registerShot = path.join(SCREENSHOT_ROOT, roleKey.toLowerCase(), '00-register.png');
  if (fs.existsSync(registerShot)) {
    lines.push(`![Register as ${meta.shortName}](screenshots/${roleKey.toLowerCase()}/00-register.png)`, '');
  }
  lines.push(
    '## Happy path',
    '',
  );

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
    '- [Auditor role — API and seal rules](../../features/AUDITOR_ROLE.md)',
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
    'Each guide starts with that role\'s registration, then walks the primary screens. Screenshots are captured from a live local stack (Chromium desktop).',
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
    'Screenshots land in `screenshots/<role>/`. The TDC, TDP, TSP, and AppAdmin markdown files are overwritten on each run.',
    'The Auditor guide is written by `npm run test:e2e:auditor-guide`.',
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
