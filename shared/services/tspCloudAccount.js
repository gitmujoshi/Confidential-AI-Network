/**
 * Cloud account for a non-local TSP.
 * Contract environmentSpecs.cloudAccounts[provider] wins, then User.cloudAccount.
 */

const REQUIRED = {
  Azure: ['subscriptionId', 'resourceGroup', 'clusterName'],
  GCP: ['projectId', 'location', 'clusterName'],
  OCI: ['cluster', 'namespace'],
  AWS: ['region', 'clusterName'],
};

const ACCOUNT_FIELDS = {
  Azure: [
    'subscriptionId',
    'resourceGroup',
    'clusterName',
    'namespace',
    'location',
    'storageAccount',
    'keyVaultUri',
    'kubeconfigPath',
  ],
  GCP: ['projectId', 'location', 'clusterName', 'namespace', 'bucket', 'kubeconfigPath'],
  AWS: ['accountId', 'region', 'clusterName', 'namespace', 'kubeconfigPath'],
};

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function accountFromSpecs(environmentSpecs, provider) {
  const specs = asObject(environmentSpecs) || {};
  const bag = asObject(specs.cloudAccounts) || {};
  const direct = asObject(bag[provider]);
  if (direct) return direct;

  const infra = asObject(specs.infrastructure) || {};
  const infraProvider = String(infra.cloudProvider || specs.cloudProvider || '').toLowerCase();
  if (infraProvider && infraProvider !== provider.toLowerCase()) return null;
  if (provider === 'OCI') {
    const cluster = infra.okeCluster || infra.cluster || infra.clusterName;
    const namespace = infra.trainingNamespace || infra.namespace;
    if (cluster || namespace) {
      return { ...infra, cluster, namespace };
    }
  }
  if (provider === 'Azure') {
    const subscriptionId = infra.subscriptionId;
    const resourceGroup = infra.resourceGroup;
    const clusterName = infra.clusterName || infra.aksCluster;
    if (subscriptionId || resourceGroup || clusterName) {
      return { ...infra, subscriptionId, resourceGroup, clusterName };
    }
  }
  if (provider === 'GCP') {
    const projectId = infra.projectId || infra.gcpProject;
    const location = infra.location || infra.region;
    const clusterName = infra.clusterName || infra.gkeCluster;
    const namespace = infra.namespace || infra.trainingNamespace;
    const bucket = infra.bucket || infra.gcsBucket;
    if (projectId || location || clusterName || namespace || bucket) {
      return { ...infra, projectId, location, clusterName, namespace, bucket };
    }
  }
  return null;
}

function withValue(target, key, value) {
  if (value == null || String(value).trim() === '') return;
  target[key] = value;
}

function mergeAccounts(...sources) {
  const out = {};
  for (const source of sources) {
    const obj = asObject(source);
    if (!obj) continue;
    for (const [key, value] of Object.entries(obj)) {
      withValue(out, key, value);
    }
  }
  return out;
}

function missingAccountFields(provider, account) {
  const keys = REQUIRED[provider] || [];
  return keys.filter((key) => !account || account[key] == null || String(account[key]).trim() === '');
}

function isCompleteAccount(provider, account) {
  return missingAccountFields(provider, account).length === 0;
}

function sanitizeProviderAccount(provider, input) {
  const keys = ACCOUNT_FIELDS[provider];
  if (!keys) return null;
  const src = asObject(input) || {};
  const out = {};
  for (const key of keys) {
    if (src[key] == null) continue;
    const value = String(src[key]).trim();
    if (!value) continue;
    if (value.length > 512) {
      const err = new Error(`${key} is too long`);
      err.statusCode = 400;
      throw err;
    }
    out[key] = value;
  }
  return out;
}

function azureColumns(contract) {
  if (!contract) return null;
  return {
    subscriptionId: contract.tspAzureSubscriptionId,
    location: contract.tspAzureLocation,
  };
}

async function resolveTspCloudAccount(db, contract, provider) {
  let fromUser = null;
  if (contract?.tspId && db?.User) {
    const user = await db.User.findByPk(contract.tspId);
    fromUser = asObject(asObject(user?.cloudAccount)?.[provider]);
  }
  const merged = mergeAccounts(
    fromUser,
    provider === 'Azure' ? azureColumns(contract) : null,
    accountFromSpecs(contract?.environmentSpecs, provider)
  );
  if (isCompleteAccount(provider, merged)) return merged;
  return null;
}

module.exports = {
  REQUIRED,
  ACCOUNT_FIELDS,
  sanitizeProviderAccount,
  accountFromSpecs,
  mergeAccounts,
  missingAccountFields,
  isCompleteAccount,
  resolveTspCloudAccount,
};
