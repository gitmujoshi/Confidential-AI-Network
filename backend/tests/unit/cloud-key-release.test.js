const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { requestKeyRelease } = require('../../services/keyReleaseClient');
const { verifyOwnerEvidence } = require('../../services/ownerVerifier');

function rsaJwk() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  jwk.kid = 'k1';
  jwk.alg = 'RS256';
  return { privateKey, jwk };
}

function signJwt(privateKey, claims) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'k1' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url');
  return `${header}.${body}.${signature}`;
}

describe('cloud key release', () => {
  test('Trustee returns the wrapped key from the owner endpoint and stores nothing', async () => {
    const calls = [];
    const http = {
      async post(url, body) {
        calls.push(url);
        expect(body.tee_evidence).toBe('quote');
        return { data: { token: 'trustee-token' } };
      },
      async get(url, options) {
        calls.push(url);
        expect(options.headers.Authorization).toBe('Bearer trustee-token');
        return { data: { wrapped_key: 'wrapped-from-trustee' } };
      },
    };
    const released = await requestKeyRelease({
      keyType: 'DEK',
      endpoint: 'https://owner.example',
      keyId: 'dek-1',
      attestation: 'quote',
      http,
    }, { CAN_PRINCIPAL_KEY_MODE: 'trustee', CAN_KEY_RELEASE_PROFILE: 'local' });
    expect(released.keyStored).toBe(false);
    expect(released.encryptedRelease).toBe('wrapped-from-trustee');
    expect(released.namespace).toBe('can-trustee');
    expect(calls).toEqual([
      'https://owner.example/kbs/v0/auth',
      'https://owner.example/kbs/v0/resource/dek-1',
    ]);
  });

  test('Confidential Space rejects a debug token and returns a wrapped key for a verified token', async () => {
    const { privateKey, jwk } = rsaJwk();
    const issuer = 'https://confidentialcomputing.googleapis.com';
    const http = {
      async get(url) {
        if (url.endsWith('openid-configuration')) {
          return { data: { issuer, jwks_uri: `${issuer}/jwks` } };
        }
        return { data: { keys: [jwk] } };
      },
      async post(url, body) {
        expect(url).toBe('https://kms.example/release');
        expect(body.attestation_token).toBeTruthy();
        return { data: { ciphertext: 'gcp-wrapped' } };
      },
    };
    const debugToken = signJwt(privateKey, { iss: issuer, exp: Math.floor(Date.now() / 1000) + 60, dbgstat: 'enabled' });
    await expect(requestKeyRelease({
      keyType: 'DEK',
      attestationToken: debugToken,
      keyUrl: 'https://kms.example/release',
      http,
    }, { CAN_PRINCIPAL_KEY_MODE: 'confidential-space', CAN_KEY_RELEASE_PROFILE: 'production' }))
      .rejects.toMatchObject({ code: 'DEBUG_REFUSED' });

    const token = signJwt(privateKey, {
      iss: issuer,
      exp: Math.floor(Date.now() / 1000) + 60,
      dbgstat: 'disabled',
      eat_nonce: 'n1',
    });
    const released = await requestKeyRelease({
      keyType: 'MEK',
      attestationToken: token,
      expectedNonce: 'n1',
      keyUrl: 'https://kms.example/release',
      http,
    }, { CAN_PRINCIPAL_KEY_MODE: 'confidential-space', CAN_KEY_RELEASE_PROFILE: 'production' });
    expect(released.encryptedRelease).toBe('gcp-wrapped');
    expect(released.keyStored).toBe(false);
  });

  test('Nitro calls KMS only after the pinned root verifies the attestation', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nitro-'));
    execSync(`openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-384 -keyout ${dir}/key.pem -out ${dir}/cert.pem -days 1 -nodes -subj /CN=nitro-test`, { stdio: 'ignore' });
    const cert = fs.readFileSync(`${dir}/cert.pem`, 'utf8');
    const key = fs.readFileSync(`${dir}/key.pem`, 'utf8');
    const document = Buffer.from('nitro-attestation');
    const signature = crypto.sign('sha384', document, key).toString('base64');
    let called = false;
    const http = {
      async post() {
        called = true;
        return { data: { ciphertext: 'nitro-wrapped' } };
      },
    };
    await expect(requestKeyRelease({
      keyType: 'DEK',
      attestationDocument: document.toString('base64'),
      attestationSignature: signature,
      signingCertPem: cert,
      http,
    }, { CAN_PRINCIPAL_KEY_MODE: 'nitro-enclave', CAN_KEY_RELEASE_PROFILE: 'production' }))
      .rejects.toMatchObject({ code: 'NITRO_ROOT_UNPINNED' });
    expect(called).toBe(false);

    const released = await requestKeyRelease({
      keyType: 'DEK',
      attestationDocument: document.toString('base64'),
      attestationSignature: signature,
      signingCertPem: cert,
      rootPem: cert,
      keyUrl: 'https://kms.example/nitro',
      http,
    }, { CAN_PRINCIPAL_KEY_MODE: 'nitro-enclave', CAN_KEY_RELEASE_PROFILE: 'production' });
    expect(called).toBe(true);
    expect(released.encryptedRelease).toBe('nitro-wrapped');
    expect(released.keyStored).toBe(false);
  });
});

describe('owner verifier', () => {
  test('production refuses a mock bundle and an unsigned GPU measurement', async () => {
    await expect(verifyOwnerEvidence({
      profile: 'production',
      evidence: { format: 'SIMULATED', tee_type: 'mock' },
    })).rejects.toMatchObject({ code: 'MOCK_TEE_REFUSED' });
    await expect(verifyOwnerEvidence({
      profile: 'production',
      evidence: { format: 'GPU', gpu: { measurement: 'gpu-1' } },
      referenceValues: { gpuMeasurement: 'gpu-1' },
    })).rejects.toMatchObject({ code: 'GPU_ATTESTATION_REQUIRED' });
  });

  test('a signed GPU token must match the owner reference', async () => {
    const { privateKey, jwk } = rsaJwk();
    const token = signJwt(privateKey, { measurement: 'gpu-1', exp: Math.floor(Date.now() / 1000) + 60 });
    const http = { async get() { return { data: { keys: [jwk] } }; } };
    const verified = await verifyOwnerEvidence({
      profile: 'production',
      evidence: {
        format: 'GPU',
        tee_type: 'gpu',
        gpu: { token, measurement: 'gpu-1', jwksUrl: 'https://nras.example/jwks' },
      },
      referenceValues: { gpuMeasurement: 'gpu-1' },
      http,
    });
    expect(verified.verified).toBe(true);
    expect(verified.claims.gpu_verified).toBe(true);
    await expect(verifyOwnerEvidence({
      profile: 'production',
      evidence: {
        format: 'GPU',
        gpu: { token, measurement: 'other', jwksUrl: 'https://nras.example/jwks' },
      },
      referenceValues: { gpuMeasurement: 'gpu-1' },
      http,
    })).rejects.toMatchObject({ code: 'GPU_MEASUREMENT_MISMATCH' });
  });
});
