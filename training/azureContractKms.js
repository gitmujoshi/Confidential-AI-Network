/**
 * Resolve contract kmsConfigs before an Azure training job is submitted.
 * An Azure Key Vault provider is contacted. A failed lookup does not submit the job.
 */

const azure = require('../backend/services/azureKeyVaultClient');

const AZURE_PROVIDERS = new Set(['azure', 'azure-key-vault', 'azure-keyvault', 'azure-mhsm']);

function contractKms(contract) {
  const kms = contract && (contract.kmsConfigs || (contract.environmentSpecs && contract.environmentSpecs.kms));
  if (!kms || typeof kms !== 'object') return null;
  return kms;
}

function providerOf(kms) {
  return String((kms && (kms.provider || kms.secretManager)) || '').trim().toLowerCase();
}

function isAzureKms(kms) {
  return AZURE_PROVIDERS.has(providerOf(kms));
}

async function prepareAzureContractKms(contract, { env = process.env, keyVault = azure } = {}) {
  const kms = contractKms(contract);
  const enforce = String(env.CONTRACT_KMS_ENFORCE || '').toLowerCase() === 'true';
  const provider = providerOf(kms);
  if (!kms && !enforce) return { required: false };
  if (kms && !isAzureKms(kms) && !enforce) return { required: false };
  if (!kms || !kms.vaultUrl || !kms.keyId) {
    return {
      required: true,
      ok: false,
      error: 'Azure training requires kmsConfigs.vaultUrl and kmsConfigs.keyId. The job was not submitted.',
    };
  }
  if (!isAzureKms(kms)) {
    return {
      required: true,
      ok: false,
      error: `Contract KMS provider ${provider || '(empty)'} is not Azure Key Vault. The job was not submitted.`,
    };
  }
  const allowed = String(env.CONTRACT_KMS_ALLOWED_PROVIDERS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(provider)) {
    return {
      required: true,
      ok: false,
      error: `Contract KMS provider ${provider} is not in CONTRACT_KMS_ALLOWED_PROVIDERS. The job was not submitted.`,
    };
  }
  try {
    const result = await keyVault.testConnection(
      {
        vaultUrl: kms.vaultUrl,
        keyId: kms.keyId,
        credentials: kms.credentials || {},
      }
    );
    return {
      required: true,
      ok: true,
      vaultUrl: kms.vaultUrl,
      keyId: kms.keyId,
      kty: result.kty || null,
    };
  } catch (error) {
    return {
      required: true,
      ok: false,
      error: `Azure Key Vault did not return key ${kms.keyId}. ${error.message} The job was not submitted.`,
    };
  }
}

module.exports = {
  prepareAzureContractKms,
  isAzureKms,
};
