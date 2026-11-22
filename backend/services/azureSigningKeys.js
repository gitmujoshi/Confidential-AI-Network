/**
 * Contract signing keys held in Azure Key Vault.
 * The database stores the key id and the public key. The private key stays in the vault.
 */

const azure = require('./azureKeyVaultClient');

const AZURE_BACKENDS = new Set(['azure-keyvault', 'azure-mhsm']);

function signingBackend(env = process.env) {
  return String(env.SIGNING_KEY_BACKEND || 'database').trim().toLowerCase();
}

function usesAzureSigningBackend(env = process.env) {
  return AZURE_BACKENDS.has(signingBackend(env));
}

function keyUsesAzure(userKey, env = process.env) {
  const stored = String(userKey && userKey.metadata && userKey.metadata.backend || '').toLowerCase();
  if (AZURE_BACKENDS.has(stored)) return true;
  return usesAzureSigningBackend(env);
}

function assertSigningAlgorithm(algorithm) {
  const name = String(algorithm || '').toUpperCase().replace(/_/g, '-');
  if (name !== 'ECDSA-P256' && name !== 'ES256') {
    const err = new Error('Azure Key Vault signing supports ECDSA-P256 only');
    err.statusCode = 400;
    err.code = 'AZURE_SIGNING_ALGORITHM';
    throw err;
  }
}

function vaultKeyName(userId) {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `can-user-sign-${userId}-${suffix}`.replace(/[^0-9a-zA-Z-]/g, '').slice(0, 127);
}

async function createAzureSigningKey({ userId, algorithm, http } = {}) {
  assertSigningAlgorithm(algorithm);
  const keyId = vaultKeyName(userId);
  const creds = azure.resolveCredentials({});
  if (!creds.vaultUrl) {
    const err = new Error('SIGNING_KEY_VAULT_URL or AZURE_KEY_VAULT_URL is required for Azure signing keys');
    err.statusCode = 400;
    err.code = 'AZURE_KMS_VAULT';
    throw err;
  }
  const token = await azure.getAccessToken(creds, http);
  const created = await azure.createEcP256Key({ vaultUrl: creds.vaultUrl, keyId, token, http });
  const publicKey = azure.jwkToPem(created && created.key);
  return {
    keyId,
    algorithm,
    publicKey,
    privateKey: null,
    metadata: {
      backend: signingBackend(),
      vaultUrl: creds.vaultUrl,
      kid: created && created.key ? created.key.kid : null,
      kty: 'EC',
      crv: 'P-256',
      privateKeyStored: false,
      generatedAt: new Date().toISOString(),
      algorithm,
    },
  };
}

async function signWithAzureKey({ userKey, contractHash, http } = {}) {
  const vaultUrl = (userKey && userKey.metadata && userKey.metadata.vaultUrl) || undefined;
  const signed = await azure.signContractHash({
    vaultUrl,
    keyId: userKey.keyId,
    digestHex: contractHash,
    credentials: {},
    http,
  });
  return signed;
}

function verifyStoredSignature(publicKey, contractHash, signature) {
  let pem = publicKey;
  if (pem && typeof pem === 'object') pem = pem.pem || pem.publicKey;
  if (typeof pem === 'string' && pem.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(pem);
      pem = parsed.pem || parsed.publicKey || pem;
    } catch (error) {
      return false;
    }
  }
  return azure.verifyEs256(pem, contractHash, signature);
}

module.exports = {
  signingBackend,
  usesAzureSigningBackend,
  keyUsesAzure,
  assertSigningAlgorithm,
  createAzureSigningKey,
  signWithAzureKey,
  verifyStoredSignature,
};
