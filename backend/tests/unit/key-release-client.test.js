const {
  assertKeyReleaseProfile,
  keyReleaseBackend,
  requestKeyRelease,
} = require('../../services/keyReleaseClient');

describe('key release client', () => {
  test('local signals and mock stay on the mock namespace', () => {
    expect(keyReleaseBackend({ CAN_PRINCIPAL_KEY_MODE: 'signals' })).toBe('mock');
    expect(keyReleaseBackend({})).toBe('mock');
    const resolved = assertKeyReleaseProfile({ CAN_PRINCIPAL_KEY_MODE: 'mock' });
    expect(resolved.profile).toBe('local');
    expect(resolved.namespace).toBe('can-mock');
  });

  test('production profile refuses the mock KMS', () => {
    expect(() => assertKeyReleaseProfile({
      CAN_KEY_RELEASE_PROFILE: 'production',
      CAN_PRINCIPAL_KEY_MODE: 'signals',
    })).toThrow(/refuses the mock KMS/);
    try {
      assertKeyReleaseProfile({
        CAN_KEY_RELEASE_PROFILE: 'production',
        CAN_PRINCIPAL_KEY_MODE: 'mock',
      });
    } catch (err) {
      expect(err.code).toBe('MOCK_KMS_REFUSED');
    }
  });

  test('production profile allows azure-skr', () => {
    const resolved = assertKeyReleaseProfile({
      CAN_KEY_RELEASE_PROFILE: 'production',
      CAN_PRINCIPAL_KEY_MODE: 'azure-skr',
    });
    expect(resolved.backend).toBe('azure-skr');
    expect(resolved.namespace).toBe('can-azure');
  });

  test('mock release does not call Key Vault and keeps no key bytes', async () => {
    const released = await requestKeyRelease(
      { backend: 'mock', keyType: 'DEK' },
      { CAN_PRINCIPAL_KEY_MODE: 'signals', CAN_KEY_RELEASE_PROFILE: 'local' }
    );
    expect(released.keyStored).toBe(false);
    expect(released.encryptedRelease).toBeNull();
    expect(released.namespace).toBe('can-mock');
    expect(released.teeType).toBe('mock');
  });

  test('mock cannot release an Azure vault key', async () => {
    await expect(requestKeyRelease(
      { keyType: 'DEK', keyId: 'https://prod.vault.azure.net/keys/dek' },
      { CAN_PRINCIPAL_KEY_MODE: 'mock' }
    )).rejects.toMatchObject({ code: 'KEY_NAMESPACE' });
  });

  test('azure-skr cannot release a can-mock key', async () => {
    await expect(requestKeyRelease(
      { backend: 'azure-skr', keyType: 'MEK', keyId: 'can-mock/mek' },
      { CAN_PRINCIPAL_KEY_MODE: 'azure-skr', CAN_KEY_RELEASE_PROFILE: 'production' }
    )).rejects.toMatchObject({ code: 'KEY_NAMESPACE' });
  });

  test('the azure route stays closed while the mode is mock', async () => {
    await expect(requestKeyRelease(
      { backend: 'azure-skr', keyType: 'DEK', keyId: 'dek', vaultUrl: 'https://prod.vault.azure.net' },
      { CAN_PRINCIPAL_KEY_MODE: 'signals' }
    )).rejects.toMatchObject({ code: 'AZURE_SKR_DISABLED' });
  });
});
