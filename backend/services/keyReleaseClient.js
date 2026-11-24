/**
 * One key-release interface.
 * `signals` and `mock` are the local KMS: record the release, store no key bytes.
 * `azure-skr` calls Key Vault and returns the encrypted blob.
 * CAN_KEY_RELEASE_PROFILE=production refuses the mock.
 */

const { releasePrincipalKey } = require('./azureKeyRelease');
const {
  releaseTrusteeKey,
  releaseConfidentialSpaceKey,
  releaseNitroKey,
  releaseAttestedTls,
} = require('./cloudKeyRelease');
const { evaluateReleasePolicy, reserveReleaseBudget } = require('./keyReleasePolicy');

const MOCK_MODES = new Set(['signals', 'mock']);

function principalKeyMode(env = process.env) {
  return String(env.CAN_PRINCIPAL_KEY_MODE || 'signals').trim().toLowerCase();
}

function keyReleaseBackend(env = process.env) {
  const mode = principalKeyMode(env);
  if (MOCK_MODES.has(mode)) return 'mock';
  return mode;
}

function keyNamespace(backend) {
  if (backend === 'mock') return 'can-mock';
  if (backend === 'azure-skr') return 'can-azure';
  return `can-${backend}`;
}

function keyReleaseProfile(env = process.env) {
  const explicit = String(env.CAN_KEY_RELEASE_PROFILE || '').trim().toLowerCase();
  if (explicit === 'production') return 'production';
  if (explicit === 'local' || explicit === 'development' || explicit === 'dev') return 'local';
  return 'local';
}

function assertKeyReleaseProfile(env = process.env) {
  const profile = keyReleaseProfile(env);
  const backend = keyReleaseBackend(env);
  if (profile === 'production' && backend === 'mock') {
    const err = new Error(
      'Production key-release profile refuses the mock KMS. Set CAN_PRINCIPAL_KEY_MODE=azure-skr, or CAN_KEY_RELEASE_PROFILE=local for development.'
    );
    err.code = 'MOCK_KMS_REFUSED';
    err.statusCode = 503;
    throw err;
  }
  return {
    profile,
    backend,
    mode: principalKeyMode(env),
    namespace: keyNamespace(backend),
  };
}

function assertKeyNamespace(backend, keyId) {
  const id = String(keyId || '');
  if (!id) return;
  if (backend === 'mock' && /vault\.azure\.net/i.test(id)) {
    const err = new Error('Mock KMS cannot release an Azure Key Vault key. Set CAN_PRINCIPAL_KEY_MODE=azure-skr.');
    err.code = 'KEY_NAMESPACE';
    err.statusCode = 409;
    throw err;
  }
  if (backend === 'azure-skr' && (id.startsWith('can-mock/') || id.startsWith('can-mock:'))) {
    const err = new Error('Azure key release cannot use a can-mock key.');
    err.code = 'KEY_NAMESPACE';
    err.statusCode = 409;
    throw err;
  }
}

function defaultClaims(backend) {
  if (backend === 'mock') {
    return { tee_type: 'mock', debug_enabled: false, nonce_fresh: true, report_data_bound: true };
  }
  return { tee_type: backend, debug_enabled: false, nonce_fresh: true, report_data_bound: true };
}

function mockKeyRelease({ keyType, budget } = {}) {
  return {
    backend: 'mock',
    namespace: 'can-mock',
    keyType,
    keyStored: false,
    reportFormat: 'SIMULATED',
    teeType: 'mock',
    encryptedRelease: null,
    budget,
  };
}

async function requestKeyRelease(request = {}, env = process.env) {
  const resolved = assertKeyReleaseProfile(env);
  const wanted = request.backend || resolved.backend;
  if (wanted !== resolved.backend) {
    const err = new Error(
      wanted === 'azure-skr'
        ? 'CAN_PRINCIPAL_KEY_MODE is not azure-skr. Key Vault release was not called.'
        : `Key release backend is ${resolved.backend}.`
    );
    err.code = wanted === 'azure-skr' ? 'AZURE_SKR_DISABLED' : 'KEY_RELEASE_BACKEND';
    err.statusCode = 409;
    throw err;
  }
  assertKeyNamespace(resolved.backend, request.keyId || request.vaultUrl);
  const budget = reserveReleaseBudget(request.budget);
  const claims = { ...defaultClaims(resolved.backend), ...(request.claims || {}) };
  evaluateReleasePolicy({
    profile: resolved.profile,
    claims,
    contract: request.contract,
    budget,
  });

  if (resolved.backend === 'mock') {
    return mockKeyRelease({ ...request, budget });
  }
  if (resolved.backend === 'azure-skr') {
    const released = await releasePrincipalKey(request);
    return {
      ...released,
      backend: 'azure-skr',
      namespace: 'can-azure',
      teeType: 'azure',
    };
  }
  if (resolved.backend === 'trustee') return releaseTrusteeKey(request, env);
  if (resolved.backend === 'confidential-space') return releaseConfidentialSpaceKey(request, env);
  if (resolved.backend === 'nitro-enclave') return releaseNitroKey(request, env);
  if (resolved.backend === 'attested-tls') return releaseAttestedTls(request, env);
  const err = new Error(`Key release backend ${resolved.backend} is not implemented. Local mode uses mock.`);
  err.code = 'KEY_RELEASE_BACKEND';
  err.statusCode = 501;
  throw err;
}

module.exports = {
  principalKeyMode,
  keyReleaseBackend,
  keyReleaseProfile,
  keyNamespace,
  assertKeyReleaseProfile,
  assertKeyNamespace,
  mockKeyRelease,
  requestKeyRelease,
};
