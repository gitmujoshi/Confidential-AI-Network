const crypto = require('crypto');
const { requestKeyRelease } = require('../../services/keyReleaseClient');
const { evaluateReleasePolicy, reserveReleaseBudget } = require('../../services/keyReleasePolicy');
const { assertOutputGate, assertReleaseBarrier } = require('../../services/outputReleaseGate');
const { generateEphemeralRsaKeyPair, sealOutput, openWrappedKey } = require('../../services/canKeyDelivery');

describe('key release policy and output gate', () => {
  const local = { CAN_PRINCIPAL_KEY_MODE: 'mock', CAN_KEY_RELEASE_PROFILE: 'local' };

  test('a revoked contract blocks the mock release', async () => {
    await expect(requestKeyRelease(
      { keyType: 'DEK', contract: { status: 'REVOKED' } },
      local
    )).rejects.toMatchObject({ code: 'CONTRACT_NOT_VALID' });
  });

  test('an expired contract blocks the mock release', async () => {
    await expect(requestKeyRelease(
      { keyType: 'DEK', contract: { status: 'SIGNED', expires_at: '2020-01-01T00:00:00Z' } },
      local
    )).rejects.toMatchObject({ code: 'CONTRACT_EXPIRED' });
  });

  test('a replayed nonce and an unbound report are refused', () => {
    expect(() => evaluateReleasePolicy({
      profile: 'local',
      claims: { tee_type: 'mock', nonce_fresh: false, report_data_bound: true },
    })).toThrow(/nonce/);
    expect(() => evaluateReleasePolicy({
      profile: 'local',
      claims: { tee_type: 'mock', nonce_fresh: true, report_data_bound: false },
    })).toThrow(/not bound/);
  });

  test('production policy refuses a mock TEE and debug mode', () => {
    expect(() => evaluateReleasePolicy({
      profile: 'production',
      claims: { tee_type: 'mock', debug_enabled: false, nonce_fresh: true, report_data_bound: true },
    })).toThrow(/mock TEE/);
    expect(() => evaluateReleasePolicy({
      profile: 'production',
      claims: { tee_type: 'azure', debug_enabled: true, nonce_fresh: true, report_data_bound: true },
    })).toThrow(/debug/);
  });

  test('budget reservation is part of the release decision', async () => {
    expect(reserveReleaseBudget({ cap: 1, consumed: 0.4, cost: 0.5 }).consumed).toBeCloseTo(0.9);
    await expect(requestKeyRelease(
      { keyType: 'MEK', budget: { cap: 1, consumed: 0.8, cost: 0.5 } },
      local
    )).rejects.toMatchObject({ code: 'BUDGET_EXHAUSTED' });
    const released = await requestKeyRelease(
      { keyType: 'MEK', budget: { cap: 1, consumed: 0.2, cost: 0.3 } },
      local
    );
    expect(released.budget.reserved).toBe(true);
    expect(released.budget.consumed).toBeCloseTo(0.5);
    expect(released.keyStored).toBe(false);
  });

  test('cloud release modes fail closed without a configured endpoint and quote', async () => {
    await expect(requestKeyRelease(
      { keyType: 'DEK' },
      { CAN_PRINCIPAL_KEY_MODE: 'trustee', CAN_KEY_RELEASE_PROFILE: 'local' }
    )).rejects.toMatchObject({ code: 'TRUSTEE_UNCONFIGURED' });
    await expect(requestKeyRelease(
      { keyType: 'DEK' },
      { CAN_PRINCIPAL_KEY_MODE: 'confidential-space', CAN_KEY_RELEASE_PROFILE: 'local' }
    )).rejects.toMatchObject({ code: 'ATTESTATION_REQUIRED' });
    await expect(requestKeyRelease(
      { keyType: 'DEK' },
      { CAN_PRINCIPAL_KEY_MODE: 'nitro-enclave', CAN_KEY_RELEASE_PROFILE: 'local' }
    )).rejects.toMatchObject({ code: 'NITRO_ROOT_UNPINNED' });
    await expect(requestKeyRelease(
      { keyType: 'DEK' },
      { CAN_PRINCIPAL_KEY_MODE: 'attested-tls', CAN_KEY_RELEASE_PROFILE: 'local' }
    )).rejects.toMatchObject({ code: 'QUOTE_INCOMPLETE' });
  });

  test('the barrier waits for both owners', () => {
    expect(() => assertReleaseBarrier({ escrowState: 'DEK_RECEIVED', dekReleased: true, mekReleased: false }))
      .toThrow(/both required/);
    expect(() => assertReleaseBarrier({ escrowState: 'BOTH_READY' })).not.toThrow();
  });

  test('the output gate blocks an expired lease and accepts a sealed artifact', () => {
    expect(() => assertOutputGate({
      escrowState: 'BOTH_READY',
      escrowDeadline: new Date(Date.now() - 1000),
    })).toThrow(/lease expired/i);

    const { publicKeyPem, privateKeyPem } = generateEphemeralRsaKeyPair();
    const sealed = sealOutput(publicKeyPem, 'model-weights');
    expect(sealed.keyStored).toBe(false);
    expect(sealed.outputSha256).toBe(crypto.createHash('sha256').update('model-weights').digest('hex'));
    expect(openWrappedKey(privateKeyPem, sealed.sealedOutput).toString()).toBe('model-weights');
    expect(() => assertOutputGate({
      escrowState: 'BOTH_READY',
      escrowDeadline: new Date(Date.now() + 60_000),
    })).not.toThrow();
  });
});
