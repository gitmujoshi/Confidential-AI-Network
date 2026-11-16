/**
 * Pure helpers for TDC training (testable without DB).
 */

function slugModelId(jobId) {
  const s = String(jobId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return `trained-${s}`.slice(0, 120);
}

function mapFramework(fw) {
  if (!fw) return 'Other';
  const f = String(fw).toLowerCase();
  if (f.includes('torch') || f === 'pytorch') return 'PyTorch';
  if (f.includes('tensor')) return 'TensorFlow';
  if (f.includes('jax')) return 'JAX';
  return 'Other';
}

function mapModelType(architecture) {
  if (!architecture) return 'other';
  const a = String(architecture).toLowerCase();
  if (a.includes('bert') || a.includes('transformer') || a.includes('gpt')) return 'transformer';
  if (a.includes('cnn') || a.includes('resnet') || a.includes('conv')) return 'cnn';
  if (a.includes('rnn') || a.includes('lstm') || a.includes('gru')) return 'rnn';
  if (a.includes('gan')) return 'gan';
  return 'other';
}

function extractDpConfigForTrainer(trainingParams) {
  const tp = trainingParams && typeof trainingParams === 'object' ? trainingParams : {};
  const dp = tp.differentialPrivacy && typeof tp.differentialPrivacy === 'object'
    ? tp.differentialPrivacy
    : {};
  let enabled = Boolean(dp.enabled);
  if (!enabled) {
    const pt = String(tp.privacyTechnique || '').toLowerCase();
    if (pt.includes('differential') || pt === 'dp' || pt === 'differential-privacy') {
      enabled = true;
    }
  }
  const epsilon = Number(dp.epsilon);
  const delta = Number(dp.delta);
  const maxGradNorm = Number(dp.maxGradNorm ?? dp.clipNorm ?? 1.0);
  return {
    enabled,
    epsilon: Number.isFinite(epsilon) && epsilon > 0 ? epsilon : 1.0,
    delta: Number.isFinite(delta) && delta > 0 ? delta : 1e-5,
    maxGradNorm: Number.isFinite(maxGradNorm) && maxGradNorm > 0 ? maxGradNorm : 1.0,
    mechanism: dp.mechanism || 'dp-sgd',
    targetEpsilon: Number.isFinite(epsilon) && epsilon > 0 ? epsilon : 1.0,
  };
}

function mapPrivacyTechnique(tp) {
  if (
    tp &&
    typeof tp.differentialPrivacy === 'object' &&
    tp.differentialPrivacy !== null &&
    tp.differentialPrivacy.enabled
  ) {
    return 'differential-privacy';
  }
  const t = tp?.privacyTechnique || tp?.differentialPrivacy;
  if (!t) return 'none';
  const s = String(t).toLowerCase();
  if (s.includes('federated')) return 'federated-learning';
  if (s.includes('differential') || s.includes('dp')) return 'differential-privacy';
  if (s.includes('homomorphic')) return 'homomorphic-encryption';
  if (s.includes('mpc') || s.includes('multi-party')) return 'secure-multi-party-computation';
  if (s.includes('zero')) return 'zero-knowledge-proofs';
  return 'none';
}

function isSimulationMode() {
  const v = process.env.TRAINING_SIMULATION_MODE;
  // Default to real execution unless explicitly enabled.
  if (v === undefined || v === '') return false;
  return v === 'true' || v === '1';
}

function buildContainerSpec(contract) {
  const tp = contract.trainingParams || {};
  const env = contract.environmentSpecs || {};
  const compute = env.compute || {};
  return {
    image:
      tp.containerImage ||
      contract.containerImage ||
      'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest',
    cpuCores: tp.cpuCores ?? compute.cpuCores ?? compute.vcpus ?? 2,
    memoryGB: tp.memoryGB ?? compute.memoryGB ?? 4,
    gpuCount: tp.gpuCount ?? compute.gpuCount ?? 0,
    gpuType: tp.gpuType ?? compute.gpuType ?? null,
    command: tp.command || 'python train.py',
    framework: tp.framework || null,
    architecture: tp.architecture || null,
    maxEpochs: tp.maxEpochs ?? null,
    batchSize: tp.batchSize ?? null,
    learningRate: tp.learningRate ?? null,
    datasetRefs: Array.isArray(contract.contractDatasets) ? contract.contractDatasets : [],
    modelRefs: Array.isArray(contract.aiModelIds) ? contract.aiModelIds : [],
    logDestination: contract.logDestination || null,
    cloudProvider: contract.tspCloudProvider || null,
  };
}

/**
 * Metrics from a completed (or in-progress) training run, for provenance / UI.
 * Omits nested `modelProvenance` if present on `trainingResults`.
 */
function pickTrainingRunMetrics(trainingResults) {
  if (!trainingResults || typeof trainingResults !== 'object') return null;
  const { modelProvenance: _nested, ...rest } = trainingResults;
  const pick = {};
  const keys = [
    'accuracy',
    'loss',
    'epochsCompleted',
    'artifactUri',
    'privacyMetrics',
    'hyperparameters',
  ];
  for (const k of keys) {
    if (rest[k] !== undefined && rest[k] !== null) {
      pick[k] = rest[k];
    }
  }
  return Object.keys(pick).length > 0 ? pick : null;
}

/**
 * Compact, UI/API-friendly provenance for a training job or registered model.
 * `inputs` is the object from expandContractTrainingInputs (metadata.inputs).
 * `trainingResults` is optional (e.g. metadata.results): loss, accuracy, epochs, etc.
 */
function buildTrainingModelProvenance(inputs, trainingResults) {
  const trainingMetrics = pickTrainingRunMetrics(trainingResults);

  if (!inputs || typeof inputs !== 'object') {
    if (!trainingMetrics) return null;
    return { trainingMetrics };
  }

  const contract = inputs.contract || {};
  const selections = Array.isArray(inputs.datasetSelections) ? inputs.datasetSelections : [];
  const datasets = Array.isArray(inputs.datasets) ? inputs.datasets : [];
  const models = Array.isArray(inputs.models) ? inputs.models : [];

  const selectionById = new Map(
    selections.map((s) => [s && s.datasetId, s]).filter(([k]) => k !== undefined && k !== null)
  );

  const datasetsUsed = datasets.map((d) => {
    const plain = d && typeof d.get === 'function' ? d.get({ plain: true }) : d;
    if (!plain || !plain.datasetId) return null;
    const sel = selectionById.get(plain.datasetId) || {};
    return {
      datasetId: plain.datasetId,
      datasetDepaId: plain.depaId || null,
      name: plain.name,
      category: plain.category,
      recordCount: plain.recordCount,
      size: plain.size,
      license: plain.license,
      individualPrice: sel.individualPrice ?? sel.price ?? undefined,
      tdpId: sel.tdpId,
    };
  }).filter(Boolean);

  const baseModels = models.map((m) => {
    const plain = m && typeof m.get === 'function' ? m.get({ plain: true }) : m;
    if (!plain) return null;
    return {
      modelId: plain.modelId,
      modelDepaId: plain.metadata?.depaId || null,
      dbModelId: plain.id ?? null,
      name: plain.name,
      type: plain.type,
      framework: plain.framework,
      architecture: plain.architecture,
      privacyTechnique: plain.privacyTechnique,
    };
  }).filter(Boolean);

  const kms = contract.kmsConfigs;
  const kmsEnabled = Array.isArray(kms)
    ? kms.length > 0
    : kms && typeof kms === 'object' && Object.keys(kms).length > 0;

  const out = {
    contractId: contract.contractId || null,
    contractDepaId: contract.contractDepaId || null,
    contractStatus: contract.status || null,
    tdcId: contract.tdcId ?? null,
    tdcDepaId: contract.tdcDepaId || null,
    tspId: contract.tspId ?? null,
    ccrpDepaId: contract.ccrpDepaId || null,
    tspCloudProvider: contract.tspCloudProvider || null,
    environmentSpecs: contract.environmentSpecs || null,
    trainingParams: contract.trainingParams || null,
    kmsEnabled,
    datasetsUsed,
    datasetCount: datasetsUsed.length,
    baseModels,
    baseModelCount: baseModels.length,
    aiModelIdRefs: Array.isArray(inputs.aiModelIds) ? inputs.aiModelIds : [],
  };
  if (trainingMetrics) {
    out.trainingMetrics = trainingMetrics;
  }
  return out;
}

module.exports = {
  slugModelId,
  mapFramework,
  mapModelType,
  extractDpConfigForTrainer,
  mapPrivacyTechnique,
  isSimulationMode,
  buildContainerSpec,
  buildTrainingModelProvenance,
  pickTrainingRunMetrics,
};
