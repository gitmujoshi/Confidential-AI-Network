/**
 * Multi-model contract + local training helpers.
 * Covers catalog types that local-docker can actually train (tabular / text / vision),
 * plus catalog-only RNN & GAN fixtures for create/sign coverage.
 */
const axios = require('axios');
const {
  BACKEND_URL,
  PASSWORD,
  USERS,
  NLP_DATASET_ID,
  NLP_MODEL_ID,
  login,
  resolveNumericModelId,
  signContractAsParties,
  waitForJobToFinish,
  fetchTrainingEnv,
} = require('./nlp-dp-training');

const TABULAR_DATASET_ID = 'e2e-dataset-1';
const TABULAR_MODEL_ID = 'e2e-model-tabular-logreg';
const VISION_DATASET_ID = 'e2e-vision-cifar';
const VISION_MODEL_ID = 'MODEL-E2E-001';
const RNN_MODEL_ID = 'e2e-model-rnn-lstm';
const GAN_MODEL_ID = 'e2e-model-gan-demo';

const LOCAL_ENV = {
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
    keyId: 'e2e-multi-model-key',
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
};

function basePayload({ datasetId, aiModelIds, ccrpUserId, terms, privacyRequirements, trainingParams }) {
  return {
    datasetSelections: [{ datasetId, individualPrice: 100 }],
    aiModelIds,
    duration: 30,
    termsAndConditions: terms,
    contractType: 'AI_TRAINING',
    privacyRequirements,
    trainingParams,
    environmentSpecs: LOCAL_ENV,
    kmsConfigs: {
      provider: 'hashicorp-vault',
      keyId: 'e2e-multi-model-key',
      vaultUrl: 'http://localhost:8200',
      metadata: { seededBy: 'playwright-multi-model' },
    },
    containerImage: 'contractmanagement/local-trainer:latest',
    serviceAccount: 'local/e2e-multi-model',
    logDestination: 'local:file',
    ccrpId: ccrpUserId,
    ccrpCloudProvider: 'Local',
  };
}

/** Trainable tracks exercised end-to-end by the multi-model guide. */
const TRAINABLE_TRACKS = [
  {
    id: 'tabular',
    title: 'Tabular — Logistic Regression',
    catalogType: 'other',
    framework: 'Other',
    architecture: 'logistic-regression',
    modelId: TABULAR_MODEL_ID,
    datasetId: TABULAR_DATASET_ID,
    trains: true,
    buildPayload({ aiModelIds, ccrpUserId }) {
      return basePayload({
        datasetId: TABULAR_DATASET_ID,
        aiModelIds,
        ccrpUserId,
        terms: `E2E multi-model tabular logreg ${Date.now()}`,
        privacyRequirements: { maxPrivacyLoss: 0.5, minAccuracy: 0.7, differentialPrivacy: false },
        trainingParams: {
          taskType: 'tabular',
          framework: 'Other',
          architecture: 'logistic-regression',
          maxEpochs: 1,
          fastDevRun: true,
          batchSize: 32,
          learningRate: 0.001,
          validationMetrics: ['accuracy', 'loss'],
        },
      });
    },
  },
  {
    id: 'text-dp',
    title: 'Text — Tiny DistilBERT + DP-SGD',
    catalogType: 'transformer',
    framework: 'PyTorch',
    architecture: 'sshleifer/tiny-distilbert-base-cased',
    modelId: NLP_MODEL_ID,
    datasetId: NLP_DATASET_ID,
    trains: true,
    buildPayload({ aiModelIds, ccrpUserId }) {
      return basePayload({
        datasetId: NLP_DATASET_ID,
        aiModelIds,
        ccrpUserId,
        terms: `E2E multi-model NLP DP ${Date.now()}`,
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
      });
    },
  },
  {
    id: 'vision',
    title: 'Vision — CNN / TinyCNN (fastDev)',
    catalogType: 'cnn',
    framework: 'TensorFlow',
    architecture: 'ResNet-50',
    modelId: VISION_MODEL_ID,
    datasetId: VISION_DATASET_ID,
    trains: true,
    buildPayload({ aiModelIds, ccrpUserId }) {
      return basePayload({
        datasetId: VISION_DATASET_ID,
        aiModelIds,
        ccrpUserId,
        terms: `E2E multi-model vision CNN ${Date.now()}`,
        privacyRequirements: { maxPrivacyLoss: 0.5, minAccuracy: 0.7, differentialPrivacy: false },
        trainingParams: {
          taskType: 'vision',
          framework: 'PyTorch',
          architecture: 'tinycnn',
          maxEpochs: 1,
          fastDevRun: true,
          batchSize: 32,
          learningRate: 0.001,
          validationMetrics: ['accuracy', 'loss'],
        },
      });
    },
  },
];

/** Catalog-only types (create + sign; no dedicated local trainer path yet). */
const CATALOG_ONLY_TRACKS = [
  {
    id: 'rnn',
    title: 'RNN — LSTM (catalog)',
    catalogType: 'rnn',
    framework: 'PyTorch',
    architecture: 'lstm',
    modelId: RNN_MODEL_ID,
    datasetId: TABULAR_DATASET_ID,
    trains: false,
    buildPayload({ aiModelIds, ccrpUserId }) {
      return basePayload({
        datasetId: TABULAR_DATASET_ID,
        aiModelIds,
        ccrpUserId,
        terms: `E2E multi-model RNN catalog ${Date.now()}`,
        privacyRequirements: { maxPrivacyLoss: 0.5, minAccuracy: 0.7, differentialPrivacy: false },
        trainingParams: {
          taskType: 'tabular',
          framework: 'PyTorch',
          architecture: 'lstm',
          maxEpochs: 1,
          batchSize: 32,
          learningRate: 0.001,
          validationMetrics: ['accuracy', 'loss'],
        },
      });
    },
  },
  {
    id: 'gan',
    title: 'GAN — catalog demo',
    catalogType: 'gan',
    framework: 'PyTorch',
    architecture: 'dcgan',
    modelId: GAN_MODEL_ID,
    datasetId: TABULAR_DATASET_ID,
    trains: false,
    buildPayload({ aiModelIds, ccrpUserId }) {
      return basePayload({
        datasetId: TABULAR_DATASET_ID,
        aiModelIds,
        ccrpUserId,
        terms: `E2E multi-model GAN catalog ${Date.now()}`,
        privacyRequirements: { maxPrivacyLoss: 0.5, minAccuracy: 0.7, differentialPrivacy: false },
        trainingParams: {
          taskType: 'tabular',
          framework: 'PyTorch',
          architecture: 'dcgan',
          maxEpochs: 1,
          batchSize: 32,
          learningRate: 0.0002,
          validationMetrics: ['accuracy', 'loss'],
        },
      });
    },
  },
];

const ALL_TRACKS = [...TRAINABLE_TRACKS, ...CATALOG_ONLY_TRACKS];

async function assertLocalTrainingReady() {
  const axios = require('axios');
  const envRes = await axios.get(`${BACKEND_URL}/api/debug/env`, { timeout: 5000 });
  const env = envRes.data || {};
  const training = env.training || (await fetchTrainingEnv());
  const mode = training.trainingExecutionMode;
  if (mode !== 'local-docker' && mode !== 'local-native') {
    throw new Error(
      `Multi-model guide needs TRAINING_EXECUTION_MODE=local-docker (or local-native); current: ${mode}`
    );
  }
  if (training.trainingSimulationMode === true || training.trainingSimulationMode === 'true') {
    throw new Error('Multi-model guide needs TRAINING_SIMULATION_MODE=false');
  }
  if (env.gmase?.trainingGate !== false) {
    const opa = await axios.get(`${BACKEND_URL}/api/debug/gmase-opa-health`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    if (opa.status !== 200 || opa.data?.ok !== true) {
      throw new Error(
        'Open-GMASE OPA required for training gate (GMASE_TRAINING_GATE default on). ' +
          'Start with: cd open-gmase-core && docker compose up -d'
      );
    }
  }
  if (env.gmase?.compliancePulseIngest?.enabled !== false) {
    const cpUrl = (
      env.gmase?.compliancePulseIngest?.url ||
      process.env.COMPLIANCEPULSE_INGEST_URL ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
    const cp = await axios.get(`${cpUrl}/health`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    if (cp.status !== 200) {
      throw new Error(
        `CompliancePulse ingest required by default (${cpUrl}). ` +
          'Start CP backend, or set COMPLIANCEPULSE_INGEST_URL=false on CAN to skip.'
      );
    }
  }
}

async function createSignedContractForTrack(track) {
  const [{ token: tdcToken, user: tdcUser }, { token: tdpToken }, { token: ccrpToken, user: ccrpUser }] =
    await Promise.all([login(USERS.tdc.email), login(USERS.tdp.email), login(USERS.ccrp.email)]);

  const modelNumericId = await resolveNumericModelId(tdcToken, track.modelId);
  if (!modelNumericId) {
    throw new Error(
      `Model ${track.modelId} not found — run Playwright global-setup (seeds multi-model fixtures)`
    );
  }

  const payload = track.buildPayload({
    aiModelIds: [modelNumericId],
    ccrpUserId: ccrpUser.id,
  });

  const create = await axios.post(`${BACKEND_URL}/api/contracts/ricardian`, payload, {
    headers: { Authorization: `Bearer ${tdcToken}` },
  });
  const contractId = create.data?.contract?.contractId;
  if (!contractId) throw new Error(`Contract create failed for track ${track.id}`);

  await signContractAsParties({ contractId, tdpToken, ccrpToken, tdcToken });

  const contractRes = await axios.get(`${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`, {
    headers: { Authorization: `Bearer ${tdcToken}` },
  });
  const status = contractRes.data?.status || contractRes.data?.contract?.status;
  if (status !== 'SIGNED') {
    throw new Error(`Track ${track.id}: expected SIGNED, got ${status}`);
  }

  return { tdcToken, tdcUser, contractId, track };
}

async function trainSignedContract({ tdcToken, contractId, timeoutMs = 300000 }) {
  const start = await axios.post(
    `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/start`,
    {},
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  const jobId = start.data?.job?.jobId;
  if (!jobId) throw new Error(`Training start failed for ${contractId}`);
  const job = await waitForJobToFinish({ contractId, jobId, token: tdcToken, timeoutMs });
  return { jobId, job };
}

async function createSignedAndOptionallyTrain(track) {
  const signed = await createSignedContractForTrack(track);
  if (!track.trains) {
    return { ...signed, jobId: null, job: null };
  }
  const trained = await trainSignedContract({
    tdcToken: signed.tdcToken,
    contractId: signed.contractId,
    timeoutMs: track.id === 'vision' ? 600000 : 300000,
  });
  if (!trained.job || trained.job.status !== 'COMPLETED') {
    throw new Error(
      `Track ${track.id} training status=${trained.job?.status || 'unknown'} for ${signed.contractId}`
    );
  }
  return { ...signed, ...trained };
}

module.exports = {
  BACKEND_URL,
  PASSWORD,
  USERS,
  TABULAR_DATASET_ID,
  TABULAR_MODEL_ID,
  VISION_DATASET_ID,
  VISION_MODEL_ID,
  RNN_MODEL_ID,
  GAN_MODEL_ID,
  TRAINABLE_TRACKS,
  CATALOG_ONLY_TRACKS,
  ALL_TRACKS,
  login,
  assertLocalTrainingReady,
  createSignedContractForTrack,
  trainSignedContract,
  createSignedAndOptionallyTrain,
};
