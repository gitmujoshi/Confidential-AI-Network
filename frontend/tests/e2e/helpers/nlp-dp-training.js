const axios = require('axios');
const { getBackendURL } = require('../../load-config');

const BACKEND_URL = getBackendURL();
const PASSWORD = 'TestNewPassword123!';

const USERS = {
  tdc: { email: 'tdc.healthcare.2025-09-05t20-39-55@test.com' },
  tdp: { email: 'tdp.e2e@test.com' },
  ccrp: { email: 'ccrp.e2e@test.com' },
};

const NLP_DATASET_ID = 'e2e-nlp-ag-news';
const NLP_MODEL_ID = 'e2e-model-nlp-distilbert';

async function login(email) {
  const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password: PASSWORD });
  if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
    throw new Error(`Login failed for ${email}`);
  }
  return { token: res.data.accessToken, user: res.data.user };
}

async function seedAuth(page, { token, user }) {
  await page.addInitScript(({ t, u }) => {
    localStorage.setItem('authToken', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('currentUser', JSON.stringify(u));
  }, { t: token, u: user });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchTrainingEnv() {
  const res = await axios.get(`${BACKEND_URL}/api/debug/env`);
  return res.data?.training || {};
}

async function getNlpDpSkipReason() {
  const wait =
    process.env.E2E_WAIT_FOR_LOCAL_TRAINING === 'true' ||
    process.env.E2E_WAIT_FOR_LOCAL_TRAINING === '1';
  if (!wait) {
    return 'Set E2E_WAIT_FOR_LOCAL_TRAINING=true to run NLP DP training E2E';
  }
  try {
    const training = await fetchTrainingEnv();
    const mode = training.trainingExecutionMode;
    const okMode = mode === 'local-docker' || mode === 'local-native';
    if (!okMode) {
      return `TRAINING_EXECUTION_MODE must be local-docker or local-native (current: ${mode})`;
    }
    if (training.trainingSimulationMode === 'true' || training.trainingSimulationMode === true) {
      return 'TRAINING_SIMULATION_MODE must be false for Opacus DP-SGD E2E';
    }
  } catch (e) {
    return `Could not read /api/debug/env: ${e.message}`;
  }
  return null;
}

async function assertLocalDockerMode(test) {
  const reason = await getNlpDpSkipReason();
  if (reason) {
    test.skip(true, reason);
    return false;
  }
  return true;
}

async function resolveNumericModelId(token, modelId = NLP_MODEL_ID) {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/ai-models/${encodeURIComponent(modelId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const id = res.data?.id ?? res.data?.model?.id;
    if (id) return id;
  } catch (_) {
    // fall through to list
  }
  const list = await axios.get(`${BACKEND_URL}/api/ai-models`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const models = list.data?.models || list.data?.data || list.data || [];
  const row = Array.isArray(models)
    ? models.find((m) => m.modelId === modelId || m.model_id === modelId)
    : null;
  return row?.id ?? null;
}

function buildNlpDpContractPayload({ aiModelIds, ccrpUserId }) {
  return {
    datasetSelections: [{ datasetId: NLP_DATASET_ID, individualPrice: 100 }],
    aiModelIds,
    duration: 30,
    termsAndConditions: `E2E NLP DP training ${Date.now()}`,
    contractType: 'AI_TRAINING',
    privacyRequirements: { maxPrivacyLoss: 0.5, minAccuracy: 0.7, differentialPrivacy: true },
    trainingParams: {
      taskType: 'text',
      privacyTechnique: 'differential-privacy',
      differentialPrivacy: {
        enabled: true,
        epsilon: 0.5,
        delta: 1e-5,
        maxGradNorm: 1.0,
        mechanism: 'dp-sgd',
      },
      framework: 'PyTorch',
      architecture: 'sshleifer/tiny-distilbert-base-cased',
      maxEpochs: 1,
      fastDevRun: true,
      batchSize: 16,
      learningRate: 0.0002,
      validationMetrics: ['accuracy', 'loss'],
    },
    environmentSpecs: {
      compute: { cpuCores: 2, memoryGB: 4, gpuCount: 0 },
      security: {
        confidentialComputing: false,
        attestationRequired: false,
        encryptionAtRest: true,
        encryptionInTransit: true,
        networkIsolation: true,
      },
      kms: {
        provider: 'hashicorp-vault',
        keyId: 'e2e-nlp-dp-key',
        algorithm: 'AES-256-GCM',
        rotationPeriod: 90,
      },
      runtime: {
        containerSpec: {
          image: 'contractmanagement/local-trainer:latest',
          command: 'python train.py',
          cpuCores: 2,
          memoryGB: 4,
          gpuCount: 0,
        },
      },
    },
    kmsConfigs: {
      provider: 'hashicorp-vault',
      keyId: 'e2e-nlp-dp-key',
      vaultUrl: 'http://localhost:8200',
      metadata: { seededBy: 'playwright-nlp-dp' },
    },
    containerImage: 'contractmanagement/local-trainer:latest',
    serviceAccount: 'local/e2e-nlp-dp',
    logDestination: 'local:file',
    ccrpId: ccrpUserId,
    ccrpCloudProvider: 'Local',
  };
}

async function signContractAsParties({ contractId, tdpToken, ccrpToken, tdcToken }) {
  const signingDataUrl = `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/signing-data`;
  const signUrl = `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/sign`;

  const { data: signingData } = await axios.get(signingDataUrl, {
    headers: { Authorization: `Bearer ${tdcToken}` },
  });

  await axios
    .post(
      signUrl,
      { signature: 'e2e-nlp-dp-placeholder', partyType: 'TDP', signingData },
      { headers: { Authorization: `Bearer ${tdpToken}` } }
    )
    .catch(() => {});

  await axios.post(
    signUrl,
    { signature: 'e2e-nlp-dp-placeholder', partyType: 'CCRP', signingData },
    { headers: { Authorization: `Bearer ${ccrpToken}` } }
  );
}

async function waitForJobToFinish({ contractId, jobId, token, timeoutMs = 300000 }) {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for job ${jobId}`);
    }
    const jobsRes = await axios.get(
      `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/jobs`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const jobs = jobsRes.data?.jobs || [];
    const j = jobs.find((x) => x?.jobId === jobId);
    if (!j) {
      await sleep(2000);
      continue;
    }
    if (['COMPLETED', 'FAILED', 'CANCELLED', 'STALLED'].includes(j.status)) {
      return j;
    }
    await sleep(2500);
  }
}

async function createSignedNlpDpContractAndTrain() {
  const [{ token: tdcToken, user: tdcUser }, { token: tdpToken }, { token: ccrpToken, user: ccrpUser }] =
    await Promise.all([login(USERS.tdc.email), login(USERS.tdp.email), login(USERS.ccrp.email)]);

  const modelNumericId = await resolveNumericModelId(tdcToken, NLP_MODEL_ID);
  if (!modelNumericId) {
    throw new Error(
      `NLP model ${NLP_MODEL_ID} not found — run Playwright global-setup (seeds E2E NLP fixtures)`
    );
  }

  const create = await axios.post(
    `${BACKEND_URL}/api/contracts/ricardian`,
    buildNlpDpContractPayload({ aiModelIds: [modelNumericId], ccrpUserId: ccrpUser.id }),
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  const contractId = create.data?.contract?.contractId;
  if (!contractId) throw new Error('Contract creation did not return contractId');

  await signContractAsParties({ contractId, tdpToken, ccrpToken, tdcToken });

  const contractRes = await axios.get(`${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`, {
    headers: { Authorization: `Bearer ${tdcToken}` },
  });
  const status = contractRes.data?.status || contractRes.data?.contract?.status;
  if (status !== 'SIGNED') {
    throw new Error(`Contract not SIGNED after CCRP sign (status: ${status ?? 'unknown'})`);
  }

  const start = await axios.post(
    `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/start`,
    {},
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  const jobId = start.data?.job?.jobId;
  if (!jobId) throw new Error('Training start did not return jobId');

  const done = await waitForJobToFinish({ contractId, jobId, token: tdcToken });
  return { tdcToken, tdcUser, contractId, jobId, job: done };
}

function assertPrivacyMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') {
    throw new Error('Expected privacyMetrics on completed job results');
  }
  if (metrics.technique !== 'differential-privacy') {
    throw new Error(`Expected technique differential-privacy, got ${metrics.technique}`);
  }
  if (metrics.mechanism !== 'dp-sgd') {
    throw new Error(`Expected mechanism dp-sgd, got ${metrics.mechanism}`);
  }
  const eps = Number(metrics.epsilon);
  if (!Number.isFinite(eps) || eps <= 0) {
    throw new Error(`Expected positive spent epsilon, got ${metrics.epsilon}`);
  }
  const delta = Number(metrics.delta);
  if (!Number.isFinite(delta) || delta <= 0) {
    throw new Error(`Expected positive delta, got ${metrics.delta}`);
  }
}

module.exports = {
  BACKEND_URL,
  PASSWORD,
  USERS,
  NLP_DATASET_ID,
  NLP_MODEL_ID,
  login,
  seedAuth,
  getNlpDpSkipReason,
  assertLocalDockerMode,
  buildNlpDpContractPayload,
  createSignedNlpDpContractAndTrain,
  waitForJobToFinish,
  assertPrivacyMetrics,
};
