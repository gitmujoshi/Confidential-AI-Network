/**
 * Release a principal DEK or MEK from Azure Key Vault into an attested runtime.
 * The API stores the release time and the blob hash. It does not decrypt the blob.
 */

const crypto = require('crypto');
const azure = require('./azureKeyVaultClient');
const { verifyAzureAttestationToken } = require('./azureAttestationService');

async function releasePrincipalKey({
  keyType,
  vaultUrl,
  keyId,
  attestationToken,
  credentials,
  http,
} = {}) {
  if (keyType !== 'DEK' && keyType !== 'MEK') {
    const err = new Error('keyType must be DEK or MEK');
    err.statusCode = 400;
    err.code = 'AZURE_SKR_KEY_TYPE';
    throw err;
  }
  const verified = await verifyAzureAttestationToken(attestationToken, { http });
  const creds = azure.resolveCredentials({ vaultUrl, credentials });
  const token = await azure.getAccessToken(creds, http);
  const encryptedRelease = await azure.releaseKey({
    vaultUrl: creds.vaultUrl,
    keyId,
    attestationToken,
    token,
    http,
  });
  return {
    keyType,
    keyId,
    vaultUrl: creds.vaultUrl,
    keyStored: false,
    reportFormat: 'AZURE_ATTESTATION',
    attestationType: verified.attestationType,
    issuer: verified.issuer,
    releaseBlobSha256: crypto.createHash('sha256').update(String(encryptedRelease)).digest('hex'),
    encryptedRelease,
  };
}

module.exports = {
  releasePrincipalKey,
};
