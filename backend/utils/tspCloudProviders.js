const VALID_TSP_CLOUD_PROVIDERS = ['Local', 'AWS', 'Azure', 'GCP', 'OCI'];

/**
 * TSPs (tech service providers) operate on exactly one cloud platform.
 * Stored as a one-element array for backward compatibility with existing JSON columns.
 */
function normalizeTspCloudProviders(cloudProviders) {
  if (cloudProviders === undefined || cloudProviders === null) {
    return { ok: true, value: [] };
  }

  if (!Array.isArray(cloudProviders)) {
    return {
      ok: false,
      error: 'cloudProviders must be an array',
    };
  }

  const invalidProviders = cloudProviders.filter((p) => !VALID_TSP_CLOUD_PROVIDERS.includes(p));
  if (invalidProviders.length > 0) {
    return {
      ok: false,
      error: `Invalid cloud providers: ${invalidProviders.join(', ')}. Valid providers: ${VALID_TSP_CLOUD_PROVIDERS.join(', ')}`,
    };
  }

  const unique = [...new Set(cloudProviders)];
  if (unique.length > 1) {
    return {
      ok: false,
      error: 'TSP must have one and only one cloud provider',
    };
  }

  return { ok: true, value: unique };
}

function primaryTspCloudProvider(cloudProviders) {
  if (!Array.isArray(cloudProviders) || cloudProviders.length === 0) {
    return null;
  }
  return cloudProviders[0];
}

module.exports = {
  VALID_TSP_CLOUD_PROVIDERS,
  normalizeTspCloudProviders,
  primaryTspCloudProvider,
};
