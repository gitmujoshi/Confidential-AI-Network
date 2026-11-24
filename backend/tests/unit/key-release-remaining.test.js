const crypto = require('crypto');
const { requestKeyRelease } = require('../../services/keyReleaseClient');
const { verifyOwnerEvidence } = require('../../services/ownerVerifier');
const { appendReleaseReceipt, verifyReceipt } = require('../../services/releaseReceipt');
const { generateHpkeKeyPair, open } = require('../../services/hpke');
const { MockOwnerKbs, ProductionOwnerKbs, orchestrateRenew } = require('../../sdk/owner-kbs');

function local(mode) {
  return { CAN_PRINCIPAL_KEY_MODE: mode, CAN_KEY_RELEASE_PROFILE: 'local' };
}

function signJwt(privateKey, claims, kid = 'k1') {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid })).toString('base64url');
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url');
  return `${header}.${body}.${signature}`;
}

describe('cloud key release', () => {
  test('Trustee returns the wrapped key only after the broker accepts the evidence', async () => {
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
        return { data: { wrapped_key: 'trustee-wrapped' } };
      },
    };
    const released = await requestKeyRelease({
      keyType: 'DEK',
      endpoint: 'https://trustee.example',
      keyId: 'dek-1',
      attestation: 'quote',
      http,
    }, local('trustee'));
    expect(released.keyStored).toBe(false);
    expect(released.encryptedRelease).toBe('trustee-wrapped');
    expect(released.reportFormat).toBe('TRUSTEE');
    expect(calls).toEqual([
      'https://trustee.example/kbs/v0/auth',
      'https://trustee.example/kbs/v0/resource/dek-1',
    ]);
  });

  test('Confidential Space verifies the token and returns the ciphertext', async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = publicKey.export({ format: 'jwk' });
    jwk.kid = 'k1';
    const token = signJwt(privateKey, {
      iss: 'https://confidentialcomputing.googleapis.com',
      exp: Math.floor(Date.now() / 1000) + 600,
      dbgstat: 'disabled',
      eat_nonce: 'n1',
    });
    const http = {
      async get(url) {
        if (url.endsWith('/.well-known/openid-configuration')) {
          return {
            data: {
              issuer: 'https://confidentialcomputing.googleapis.com',
              jwks_uri: 'https://confidentialcomputing.googleapis.com/jwks',
            },
          };
        }
        return { data: { keys: [jwk] } };
      },
      async post(url, body) {
        expect(url).toBe('https://kms.example/release');
        expect(body.attestation_token).toBe(token);
        return { data: { ciphertext: 'gcp-wrapped' } };
      },
    };
    const released = await requestKeyRelease({
      keyType: 'MEK',
      attestationToken: token,
      expectedNonce: 'n1',
      keyUrl: 'https://kms.example/release',
      http,
    }, local('confidential-space'));
    expect(released.encryptedRelease).toBe('gcp-wrapped');
    expect(released.keyStored).toBe(false);
    expect(released.reportFormat).toBe('CONFIDENTIAL_SPACE');
  });

  test('Confidential Space refuses a debug token', async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = publicKey.export({ format: 'jwk' });
    jwk.kid = 'k1';
    const token = signJwt(privateKey, {
      iss: 'https://confidentialcomputing.googleapis.com',
      exp: Math.floor(Date.now() / 1000) + 600,
      dbgstat: 'enabled',
    });
    const http = {
      async get(url) {
        if (url.endsWith('/.well-known/openid-configuration')) {
          return {
            data: {
              issuer: 'https://confidentialcomputing.googleapis.com',
              jwks_uri: 'https://confidentialcomputing.googleapis.com/jwks',
            },
          };
        }
        return { data: { keys: [jwk] } };
      },
      async post() {
        throw new Error('key endpoint must not be called');
      },
    };
    await expect(requestKeyRelease({
      keyType: 'DEK',
      attestationToken: token,
      keyUrl: 'https://kms.example/release',
      http,
    }, local('confidential-space'))).rejects.toMatchObject({ code: 'DEBUG_REFUSED' });
  });
});

describe('owner verifier and production broker', () => {
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

  test('a signed GPU token that matches the reference is verified', async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = publicKey.export({ format: 'jwk' });
    jwk.kid = 'gpu';
    const token = signJwt(privateKey, {
      iss: 'https://nras.example',
      exp: Math.floor(Date.now() / 1000) + 600,
      measurement: 'gpu-1',
    }, 'gpu');
    const result = await verifyOwnerEvidence({
      profile: 'production',
      evidence: {
        format: 'GPU',
        gpu: { token, measurement: 'gpu-1', jwks: { keys: [jwk] }, issuer: 'https://nras.example' },
      },
      referenceValues: { gpuMeasurement: 'gpu-1' },
    });
    expect(result.verified).toBe(true);
    expect(result.claims.gpu_verified).toBe(true);
  });

  test('the production broker seals with HPKE after a verified quote', async () => {
    const room = generateHpkeKeyPair();
    const broker = new ProductionOwnerKbs({
      ownerId: 'did:can:tdp',
      keyType: 'DEK',
      provider: {
        async unwrap() {
          return Buffer.from('dataset-dek');
        },
      },
      verify: async () => ({
        verified: true,
        teeType: 'sev-snp',
        reportFormat: 'SEV_SNP',
        claims: { tee_type: 'sev-snp', debug_enabled: false, nonce_fresh: true, report_data_bound: true },
      }),
      logReceipt: async () => ({ logged: false, reason: 'SCITT_DISABLED' }),
    });
    const issued = await broker.issueNonce();
    const released = await broker.release({
      nonce: issued.nonce,
      pkCcr: room.publicKey,
      contract: { status: 'SIGNED', hash: 'c1' },
      evidence: { format: 'SEV_SNP' },
    });
    expect(released.keyStored).toBe(false);
    expect(released.signatureValid).toBe(true);
    expect(released.transparency.logged).toBe(false);
    expect(open({ recipientPrivateKey: room.privateKey, encapsulated: released.wrappedKey }).toString()).toBe('dataset-dek');
    const renewed = await broker.renewLease({ leaseId: released.lease.leaseId });
    expect(Date.parse(renewed.expiresAt)).toBeGreaterThan(Date.now());
  });

  test('an expired lease is not renewed and blocks the other owner', async () => {
    const data = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    const model = new MockOwnerKbs({ ownerId: 'did:can:tdc', keyType: 'MEK' });
    const room = generateHpkeKeyPair();
    data.holdKey(Buffer.from('dek'));
    const dataNonce = await data.issueNonce();
    const released = await data.release({
      nonce: dataNonce.nonce,
      pkCcr: room.publicKey,
      contract: { status: 'SIGNED' },
    });
    expect(verifyReceipt(released.receipt)).toBe(true);
    data.leases.leases.get(released.lease.leaseId).expiresAt = Date.now() - 1;
    await expect(orchestrateRenew({
      owners: [
        { ownerId: 'did:can:tdp', keyType: 'DEK', client: data, leaseId: released.lease.leaseId },
        { ownerId: 'did:can:tdc', keyType: 'MEK', client: model, leaseId: 'missing' },
      ],
    })).rejects.toMatchObject({ code: 'LEASE_EXPIRED' });
  });

  test('a disabled transparency log does not invent a claim id', async () => {
    const signed = {
      body: '{}',
      signature: 'sig',
      publicKey: 'pk',
    };
    await expect(appendReleaseReceipt(signed, { isEnabled: false })).resolves.toEqual({
      logged: false,
      keyStored: false,
    });
    await expect(appendReleaseReceipt(signed, {
      isEnabled: true,
      async submitClaim() {
        return {};
      },
    })).rejects.toMatchObject({ code: 'TRANSPARENCY_LOG_FAILED' });
    await expect(appendReleaseReceipt(signed, {
      isEnabled: true,
      async submitClaim() {
        return { claimId: 'claim-1' };
      },
    })).resolves.toMatchObject({ logged: true, claimId: 'claim-1' });
  });
});
