/**
 * Verify a Microsoft Azure Attestation JWT.
 * A simulated CAN report is not accepted as a guest quote.
 */

const crypto = require('crypto');
const axios = require('axios');

function trimSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

function attestationError(message) {
  const err = new Error(message);
  err.statusCode = 409;
  err.code = 'ATTESTATION_REQUIRED';
  return err;
}

async function verifyAzureAttestationToken(token, { attestationUrl, http = axios } = {}) {
  const url = trimSlash(attestationUrl || process.env.AZURE_ATTESTATION_URL);
  if (!url) {
    throw attestationError('AZURE_ATTESTATION_URL is not set. Guest attestation was not accepted.');
  }
  const raw = String(token || '').trim();
  if (raw.split('.').length !== 3) {
    throw attestationError('Azure Attestation token is missing. A simulated report is not a guest quote.');
  }
  let discovery;
  let jwks;
  try {
    discovery = await http.get(`${url}/.well-known/openid-configuration`, { timeout: 15000 });
    const jwksUri = discovery.data && discovery.data.jwks_uri;
    if (!jwksUri) throw new Error('openid-configuration had no jwks_uri');
    jwks = await http.get(jwksUri, { timeout: 15000 });
  } catch (error) {
    const err = new Error(`Azure Attestation metadata could not be read: ${error.message}`);
    err.statusCode = 502;
    err.code = 'AZURE_ATTESTATION_METADATA';
    throw err;
  }
  const header = JSON.parse(Buffer.from(raw.split('.')[0], 'base64url').toString('utf8'));
  const keys = (jwks.data && jwks.data.keys) || [];
  const jwk = keys.find((item) => item.kid === header.kid);
  if (!jwk) {
    throw attestationError('Azure Attestation token signing key was not in the provider JWKS.');
  }
  if (header.alg !== 'RS256') {
    throw attestationError('Azure Attestation token must use RS256.');
  }
  const pem = crypto.createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
  const parts = raw.split('.');
  const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
  let signatureOk = false;
  try {
    signatureOk = crypto.verify('RSA-SHA256', signed, pem, Buffer.from(parts[2], 'base64url'));
  } catch (error) {
    signatureOk = false;
  }
  if (!signatureOk) {
    throw attestationError('Azure Attestation token signature was rejected.');
  }
  let claims;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (error) {
    throw attestationError('Azure Attestation token payload is not JSON.');
  }
  if (claims.iss !== discovery.data.issuer) {
    throw attestationError('Azure Attestation token issuer does not match the provider.');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp && nowSec > Number(claims.exp) + 60) {
    throw attestationError('Azure Attestation token is expired.');
  }
  return {
    claims,
    issuer: discovery.data.issuer,
    attestationType: claims['x-ms-isolation-tee'] || claims['x-ms-attestation-type'] || null,
  };
}

module.exports = {
  verifyAzureAttestationToken,
};
