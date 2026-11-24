/**
 * Cloud key release.
 * Each backend calls its endpoint only after the attestation check.
 * A missing endpoint or a rejected quote returns no key.
 */

const crypto = require('crypto');
const { verifySevSnpQuote } = require('./sevSnpQuote');

function releaseError(message, code, statusCode = 409) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function blobFrom(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  return data.wrapped_key || data.encryptedRelease || data.ciphertext || null;
}

async function releaseTrusteeKey(request = {}, env = process.env) {
  const endpoint = String(request.endpoint || env.TRUSTEE_KBS_URL || '').replace(/\/+$/, '');
  if (!endpoint) {
    throw releaseError('TRUSTEE_KBS_URL is not set. Trustee was not called.', 'TRUSTEE_UNCONFIGURED', 503);
  }
  if (!request.attestation) {
    throw releaseError('Trustee release requires TEE evidence.', 'ATTESTATION_REQUIRED');
  }
  if (!request.keyId) {
    throw releaseError('Trustee release requires a key id.', 'KBS_KEY_TYPE', 400);
  }
  const http = request.http;
  if (!http) {
    throw releaseError('Trustee release has no HTTP client.', 'TRUSTEE_UNCONFIGURED', 503);
  }
  const auth = await http.post(`${endpoint}/kbs/v0/auth`, { tee_evidence: request.attestation });
  const token = auth.data && auth.data.token;
  if (!token) {
    throw releaseError('Trustee refused the attestation.', 'TRUSTEE_AUTH_REJECTED');
  }
  const resource = await http.get(`${endpoint}/kbs/v0/resource/${encodeURIComponent(request.keyId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const encryptedRelease = blobFrom(resource.data);
  if (!encryptedRelease) {
    throw releaseError('Trustee returned no wrapped key.', 'TRUSTEE_RELEASE_EMPTY');
  }
  return {
    backend: 'trustee',
    namespace: 'can-trustee',
    keyType: request.keyType,
    keyStored: false,
    reportFormat: 'TRUSTEE',
    teeType: 'trustee',
    encryptedRelease,
  };
}

function verifyRs256Jwt(token, jwks, expectedIssuer) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw releaseError('Confidential Space token is missing. A simulated report is not a guest quote.', 'ATTESTATION_REQUIRED');
  }
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const keys = (jwks && jwks.keys) || [];
  const jwk = keys.find((item) => item.kid === header.kid);
  if (!jwk || header.alg !== 'RS256') {
    throw releaseError('Confidential Space token signing key was not in the provider JWKS.', 'ATTESTATION_REQUIRED');
  }
  const pem = crypto.createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${parts[0]}.${parts[1]}`), pem, Buffer.from(parts[2], 'base64url'));
  if (!ok) {
    throw releaseError('Confidential Space token signature was rejected.', 'ATTESTATION_REQUIRED');
  }
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (expectedIssuer && claims.iss !== expectedIssuer) {
    throw releaseError('Confidential Space token issuer was rejected.', 'ATTESTATION_REQUIRED');
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp && nowSec > Number(claims.exp) + 60) {
    throw releaseError('Confidential Space token is expired.', 'ATTESTATION_REQUIRED');
  }
  if (claims.dbgstat && claims.dbgstat !== 'disabled') {
    throw releaseError('Confidential Space debug mode was refused.', 'DEBUG_REFUSED');
  }
  return claims;
}

async function releaseConfidentialSpaceKey(request = {}, env = process.env) {
  const token = request.attestationToken || request.attestation;
  if (!token || String(token).split('.').length !== 3) {
    throw releaseError('Confidential Space token is missing. A simulated report is not a guest quote.', 'ATTESTATION_REQUIRED');
  }
  const http = request.http;
  const issuer = request.issuer || env.GCP_CONFIDENTIAL_SPACE_ISSUER || 'https://confidentialcomputing.googleapis.com';
  if (!http) {
    throw releaseError('Confidential Space JWKS could not be read.', 'CONFIDENTIAL_SPACE_UNCONFIGURED', 503);
  }
  const discovery = await http.get(`${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`);
  const jwksUri = discovery.data && discovery.data.jwks_uri;
  if (!jwksUri) {
    throw releaseError('Confidential Space metadata had no jwks_uri.', 'CONFIDENTIAL_SPACE_UNCONFIGURED', 503);
  }
  const jwks = await http.get(jwksUri);
  const claims = verifyRs256Jwt(token, jwks.data, discovery.data.issuer || issuer);
  if (request.expectedNonce && claims.eat_nonce !== request.expectedNonce && claims.nonce !== request.expectedNonce) {
    throw releaseError('Confidential Space token nonce is not bound to this release.', 'REPORT_UNBOUND');
  }
  const keyUrl = request.keyUrl || env.GCP_KEY_RELEASE_URL;
  if (!keyUrl) {
    throw releaseError('GCP_KEY_RELEASE_URL is not set. Confidential Space was not asked for a key.', 'CONFIDENTIAL_SPACE_UNCONFIGURED', 503);
  }
  const released = await http.post(keyUrl, { attestation_token: token }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const encryptedRelease = blobFrom(released.data);
  if (!encryptedRelease) {
    throw releaseError('Confidential Space returned no wrapped key.', 'CONFIDENTIAL_SPACE_RELEASE_EMPTY');
  }
  return {
    backend: 'confidential-space',
    namespace: 'can-gcp',
    keyType: request.keyType,
    keyStored: false,
    reportFormat: 'CONFIDENTIAL_SPACE',
    teeType: 'confidential-space',
    issuer: claims.iss,
    encryptedRelease,
  };
}

function verifyNitroSignature({ document, signature, signingCertPem, rootPem }) {
  if (!rootPem) {
    throw releaseError('Set AWS_NITRO_ROOT_PEM before accepting a Nitro attestation.', 'NITRO_ROOT_UNPINNED', 503);
  }
  if (!document || !signature || !signingCertPem) {
    throw releaseError('Nitro release requires the attestation document, its signature, and the signing certificate.', 'ATTESTATION_REQUIRED');
  }
  let cert;
  let root;
  try {
    cert = new crypto.X509Certificate(signingCertPem);
    root = new crypto.X509Certificate(rootPem);
  } catch (error) {
    throw releaseError('Nitro certificate chain could not be parsed.', 'QUOTE_CHAIN');
  }
  let chained = false;
  try {
    chained = cert.verify(root.publicKey) || cert.fingerprint256 === root.fingerprint256;
  } catch (error) {
    chained = false;
  }
  if (!chained) {
    throw releaseError('Nitro signing certificate is not signed by the pinned AWS Nitro root.', 'QUOTE_CHAIN');
  }
  const ok = crypto.verify(
    'sha384',
    Buffer.from(document, 'base64'),
    cert.publicKey,
    Buffer.from(signature, 'base64')
  );
  if (!ok) {
    throw releaseError('Nitro attestation signature was rejected.', 'QUOTE_SIGNATURE');
  }
}

async function releaseNitroKey(request = {}, env = process.env) {
  const rootPem = request.rootPem || env.AWS_NITRO_ROOT_PEM;
  verifyNitroSignature({
    document: request.attestationDocument,
    signature: request.attestationSignature,
    signingCertPem: request.signingCertPem,
    rootPem,
  });
  const keyUrl = request.keyUrl || env.AWS_NITRO_KMS_URL;
  if (!keyUrl) {
    throw releaseError('AWS_NITRO_KMS_URL is not set. Nitro was not asked for a key.', 'NITRO_UNCONFIGURED', 503);
  }
  if (!request.http) {
    throw releaseError('Nitro release has no HTTP client.', 'NITRO_UNCONFIGURED', 503);
  }
  const released = await request.http.post(keyUrl, {
    keyId: request.keyId,
    attestationDocument: request.attestationDocument,
  });
  const encryptedRelease = blobFrom(released.data);
  if (!encryptedRelease) {
    throw releaseError('Nitro returned no wrapped key.', 'NITRO_RELEASE_EMPTY');
  }
  return {
    backend: 'nitro-enclave',
    namespace: 'can-aws',
    keyType: request.keyType,
    keyStored: false,
    reportFormat: 'NITRO',
    teeType: 'nitro-enclave',
    encryptedRelease,
  };
}

function releaseAttestedTls(request = {}) {
  const verified = verifySevSnpQuote(request.quote || request.attestation || {});
  if (!verified.ok) {
    throw releaseError(verified.error, verified.code || 'ATTESTATION_REQUIRED');
  }
  const wrapped = request.wrappedKey || request.encryptedRelease;
  if (!wrapped || !String(wrapped).startsWith('hpke1.')) {
    throw releaseError('Attested TLS release requires a key already sealed with HPKE to pk_ccr.', 'WRAP_REQUIRED', 400);
  }
  if (request.expectedReportData && verified.quote.reportData !== request.expectedReportData) {
    throw releaseError('SEV-SNP report data is not bound to pk_ccr.', 'REPORT_UNBOUND');
  }
  return {
    backend: 'attested-tls',
    namespace: 'can-sev',
    keyType: request.keyType,
    keyStored: false,
    reportFormat: 'SEV_SNP',
    teeType: 'sev-snp',
    verified: true,
    encryptedRelease: wrapped,
  };
}

module.exports = {
  releaseTrusteeKey,
  releaseConfidentialSpaceKey,
  releaseNitroKey,
  releaseAttestedTls,
};
