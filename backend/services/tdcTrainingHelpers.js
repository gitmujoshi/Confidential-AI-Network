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

function mapPrivacyTechnique(tp) {
  if (tp && typeof tp.differentialPrivacy === 'object' && tp.differentialPrivacy !== null) {
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
    cloudProvider: contract.ccrpCloudProvider || null,
  };
}

module.exports = {
  slugModelId,
  mapFramework,
  mapModelType,
  mapPrivacyTechnique,
  isSimulationMode,
  buildContainerSpec,
};
