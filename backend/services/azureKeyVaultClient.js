/**
 * Azure Key Vault REST client.
 * Calls Entra and Key Vault. A missing credential or a failed response is an error.
 * Secure key release returns the encrypted blob and does not decrypt it.
 */

const crypto = require('crypto');
const axios = require('axios');

const API_VERSION = '7.4';

function trimSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

function describeHttpError(error) {
  const status = error.response && error.response.status;
  const body = error.response && error.response.data && error.response.data.error;
  const code = body && (body.code || body);
  const message = (body && body.message) || error.message;
  if (status) {
    return `Azure request failed (${status}${code ? ` ${code}` : ''}): ${message}`;
  }
  return message;
}

function resolveCredentials(input = {}) {
  const credentials = input.credentials && typeof input.credentials === 'object' ? input.credentials : {};
  const useManagedIdentity = String(
    input.useManagedIdentity ?? credentials.useManagedIdentity ?? process.env.AZURE_USE_MANAGED_IDENTITY
  ) === 'true';
  return {
    tenantId: credentials.tenantId || input.tenantId || process.env.AZURE_TENANT_ID || process.env.ENTRA_TENANT_ID || '',
    clientId: credentials.clientId || input.clientId || process.env.AZURE_CLIENT_ID || '',
    clientSecret: credentials.clientSecret || input.clientSecret || process.env.AZURE_CLIENT_SECRET || '',
    vaultUrl: trimSlash(
      input.vaultUrl || credentials.vaultUrl || process.env.SIGNING_KEY_VAULT_URL || process.env.AZURE_KEY_VAULT_URL || ''
    ),
    useManagedIdentity,
  };
}

async function getAccessToken(creds, http = axios) {
  try {
    if (creds.useManagedIdentity) {
      const client = creds.clientId ? `&client_id=${encodeURIComponent(creds.clientId)}` : '';
      const response = await http.get(
        `http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=${encodeURIComponent('https://vault.azure.net/')}${client}`,
        { headers: { Metadata: 'true' }, timeout: 10000 }
      );
      if (!response.data || !response.data.access_token) {
        throw new Error('Managed identity token response had no access_token');
      }
      return response.data.access_token;
    }
    if (!creds.tenantId || !creds.clientId || !creds.clientSecret) {
      const err = new Error(
        'Azure Key Vault credentials are missing. Set tenantId, clientId, and clientSecret, or AZURE_USE_MANAGED_IDENTITY=true.'
      );
      err.statusCode = 400;
      err.code = 'AZURE_KMS_CREDENTIALS';
      throw err;
    }
    const response = await http.post(
      `https://login.microsoftonline.com/${encodeURIComponent(creds.tenantId)}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        scope: 'https://vault.azure.net/.default',
        grant_type: 'client_credentials',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );
    if (!response.data || !response.data.access_token) {
      throw new Error('Entra token response had no access_token');
    }
    return response.data.access_token;
  } catch (error) {
    if (error.code === 'AZURE_KMS_CREDENTIALS') throw error;
    const err = new Error(describeHttpError(error));
    err.statusCode = error.response && error.response.status ? 502 : error.statusCode || 502;
    err.code = 'AZURE_KMS_TOKEN';
    throw err;
  }
}

async function getKey({ vaultUrl, keyId, token, http = axios }) {
  if (!vaultUrl) {
    const err = new Error('Vault URL is required for Azure Key Vault');
    err.statusCode = 400;
    err.code = 'AZURE_KMS_VAULT';
    throw err;
  }
  if (!keyId) {
    const err = new Error('Key id is required for Azure Key Vault');
    err.statusCode = 400;
    err.code = 'AZURE_KMS_KEY';
    throw err;
  }
  try {
    const response = await http.get(
      `${trimSlash(vaultUrl)}/keys/${encodeURIComponent(keyId)}?api-version=${API_VERSION}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );
    return response.data;
  } catch (error) {
    const err = new Error(describeHttpError(error));
    err.statusCode = 502;
    err.code = 'AZURE_KMS_GET_KEY';
    throw err;
  }
}

function jwkToPem(jwk) {
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
    throw new Error('Azure Key Vault key is not an EC P-256 public key');
  }
  return crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, format: 'jwk' })
    .export({ type: 'spki', format: 'pem' });
}

function verifyEs256(publicKeyPem, digestHex, signatureB64) {
  const digest = Buffer.from(String(digestHex || ''), 'hex');
  if (digest.length !== 32) return false;
  try {
    return crypto.verify(
      null,
      digest,
      { key: publicKeyPem, dsaEncoding: 'ieee-p1363' },
      Buffer.from(String(signatureB64 || ''), 'base64')
    );
  } catch (error) {
    return false;
  }
}

async function signDigest({ vaultUrl, keyId, digestHex, token, http = axios }) {
  try {
    const response = await http.post(
      `${trimSlash(vaultUrl)}/keys/${encodeURIComponent(keyId)}/sign?api-version=${API_VERSION}`,
      { alg: 'ES256', value: Buffer.from(digestHex, 'hex').toString('base64') },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    if (!response.data || !response.data.value) {
      throw new Error('Key Vault sign response had no signature');
    }
    return response.data.value;
  } catch (error) {
    if (error.message === 'Key Vault sign response had no signature') throw error;
    const err = new Error(describeHttpError(error));
    err.statusCode = 502;
    err.code = 'AZURE_KMS_SIGN';
    throw err;
  }
}

async function createEcP256Key({ vaultUrl, keyId, token, http = axios }) {
  try {
    const response = await http.post(
      `${trimSlash(vaultUrl)}/keys/${encodeURIComponent(keyId)}/create?api-version=${API_VERSION}`,
      { kty: 'EC', crv: 'P-256', key_ops: ['sign', 'verify'] },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return response.data;
  } catch (error) {
    const err = new Error(describeHttpError(error));
    err.statusCode = 502;
    err.code = 'AZURE_KMS_CREATE';
    throw err;
  }
}

async function releaseKey({ vaultUrl, keyId, attestationToken, token, http = axios }) {
  try {
    const response = await http.post(
      `${trimSlash(vaultUrl)}/keys/${encodeURIComponent(keyId)}/release?api-version=${API_VERSION}`,
      { target: attestationToken },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 20000 }
    );
    if (!response.data || !response.data.value) {
      throw new Error('Key Vault release response had no encrypted blob');
    }
    return response.data.value;
  } catch (error) {
    if (error.message === 'Key Vault release response had no encrypted blob') throw error;
    const err = new Error(describeHttpError(error));
    err.statusCode = 502;
    err.code = 'AZURE_KMS_RELEASE';
    throw err;
  }
}

async function testConnection(config = {}, http = axios) {
  const creds = resolveCredentials(config);
  const token = await getAccessToken(creds, http);
  const key = await getKey({ vaultUrl: creds.vaultUrl, keyId: config.keyId, token, http });
  return {
    provider: 'azure',
    vaultUrl: creds.vaultUrl,
    keyId: config.keyId,
    kty: key && key.key ? key.key.kty : null,
    kid: key && key.key ? key.key.kid : null,
    status: 'connected',
    message: 'Azure Key Vault returned the key',
  };
}

async function signContractHash({ vaultUrl, keyId, digestHex, credentials, http = axios }) {
  const creds = resolveCredentials({ vaultUrl, credentials, keyId });
  const token = await getAccessToken(creds, http);
  const key = await getKey({ vaultUrl: creds.vaultUrl, keyId, token, http });
  const publicKeyPem = jwkToPem(key && key.key);
  const signature = await signDigest({
    vaultUrl: creds.vaultUrl,
    keyId,
    digestHex,
    token,
    http,
  });
  if (!verifyEs256(publicKeyPem, digestHex, signature)) {
    const err = new Error('Key Vault signature failed local verification');
    err.statusCode = 502;
    err.code = 'AZURE_KMS_VERIFY';
    throw err;
  }
  return {
    signature,
    publicKeyPem,
    keyId,
    vaultUrl: creds.vaultUrl,
    kid: key.key.kid || null,
  };
}

module.exports = {
  resolveCredentials,
  getAccessToken,
  getKey,
  jwkToPem,
  verifyEs256,
  signDigest,
  createEcP256Key,
  releaseKey,
  testConnection,
  signContractHash,
};
