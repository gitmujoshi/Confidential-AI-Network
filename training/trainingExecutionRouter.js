/**
 * Pick the training runner from the contract TSP, not from the host env.
 * Local may use TRAINING_EXECUTION_MODE only to choose docker / native / mlx.
 * A cloud TSP never inherits a local mode.
 */

const LOCAL_MODES = new Set(['local-docker', 'local-native', 'local-mlx']);

function canonicalProvider(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'local') return 'Local';
  if (raw === 'azure') return 'Azure';
  if (raw === 'oci') return 'OCI';
  if (raw === 'gcp' || raw === 'google') return 'GCP';
  if (raw === 'aws') return 'AWS';
  return null;
}

function resolveTrainingExecution(contract, env = process.env) {
  const provider = canonicalProvider(contract?.tspCloudProvider);
  if (!provider) {
    return {
      ok: false,
      statusCode: 400,
      error: `Unsupported tspCloudProvider: ${contract?.tspCloudProvider || '(empty)'}`,
    };
  }

  if (provider === 'Local') {
    const requested = String(env.TRAINING_EXECUTION_MODE || '').trim();
    if (LOCAL_MODES.has(requested)) {
      return { ok: true, provider, executionMode: requested };
    }
    if (!requested && env.NODE_ENV && env.NODE_ENV !== 'production') {
      return { ok: true, provider, executionMode: 'local-docker' };
    }
    if (!requested) {
      return { ok: true, provider, executionMode: '' };
    }
    return { ok: true, provider, executionMode: 'local-docker' };
  }

  if (provider === 'Azure') {
    return { ok: true, provider, executionMode: 'azure-ccr' };
  }
  if (provider === 'OCI') {
    return { ok: true, provider, executionMode: 'oci-oke-job' };
  }
  if (provider === 'GCP') {
    return { ok: true, provider, executionMode: 'gcp-ccr' };
  }

  return {
    ok: false,
    statusCode: 501,
    provider,
    error: `${provider} CCR is not available. Training was not started.`,
  };
}

module.exports = {
  LOCAL_MODES,
  canonicalProvider,
  resolveTrainingExecution,
};
