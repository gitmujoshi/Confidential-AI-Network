const crypto = require('crypto');
const azure = require('../../services/azureKeyVaultClient');
const { prepareAzureContractKms } = require('../../../training/azureContractKms');
const { provisionAzureCcr, quoteManifest } = require('../../../training/azureCcrRunner');
const { mintGuestQuoteToken, verifyGuestQuoteToken } = require('../../../training/guestQuoteToken');
const { verifyAzureAttestationToken } = require('../../services/azureAttestationService');
const { releasePrincipalKey } = require('../../services/azureKeyRelease');
const { usesAzureSigningBackend } = require('../../services/azureSigningKeys');
const cloudKmsService = require('../../services/cloudKmsService');

function ecMaterial() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const digest = crypto.randomBytes(32);
  const signature = crypto.sign(null, digest, { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return { jwk, digest, signature: signature.toString('base64') };
}

describe('Azure Key Vault client', () => {
  it('fails closed when credentials are missing', async () => {
    const http = { post: jest.fn(), get: jest.fn() };
    await expect(azure.testConnection({
      vaultUrl: 'https://can.vault.azure.net',
      keyId: 'kek',
      credentials: {},
    }, http)).rejects.toThrow(/credentials are missing/);
    expect(http.post).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('treats a connection as successful only after Key Vault returns the key', async () => {
    const http = {
      post: jest.fn(async () => ({ data: { access_token: 'token' } })),
      get: jest.fn(async () => ({ data: { key: { kty: 'EC', kid: 'https://can.vault.azure.net/keys/kek/v1' } } })),
    };
    const result = await azure.testConnection({
      vaultUrl: 'https://can.vault.azure.net',
      keyId: 'kek',
      credentials: { tenantId: 'tenant', clientId: 'client', clientSecret: 'secret' },
    }, http);
    expect(result.status).toBe('connected');
    expect(result.kty).toBe('EC');
    expect(http.get).toHaveBeenCalledWith(
      'https://can.vault.azure.net/keys/kek?api-version=7.4',
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
  });

  it('rejects a Key Vault signature that does not match the public key', async () => {
    const { jwk, digest } = ecMaterial();
    const http = {
      post: jest.fn(async (url) => {
        if (String(url).includes('oauth2')) return { data: { access_token: 'token' } };
        return { data: { value: Buffer.from('not-a-signature').toString('base64') } };
      }),
      get: jest.fn(async () => ({ data: { key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, kid: 'kid' } } })),
    };
    await expect(azure.signContractHash({
      vaultUrl: 'https://can.vault.azure.net',
      keyId: 'sign-key',
      digestHex: digest.toString('hex'),
      credentials: { tenantId: 'tenant', clientId: 'client', clientSecret: 'secret' },
      http,
    })).rejects.toThrow(/failed local verification/);
  });

  it('returns a signature only after local ES256 verification', async () => {
    const { jwk, digest, signature } = ecMaterial();
    const http = {
      post: jest.fn(async (url) => {
        if (String(url).includes('oauth2')) return { data: { access_token: 'token' } };
        return { data: { value: signature } };
      }),
      get: jest.fn(async () => ({ data: { key: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, kid: 'kid' } } })),
    };
    const signed = await azure.signContractHash({
      vaultUrl: 'https://can.vault.azure.net',
      keyId: 'sign-key',
      digestHex: digest.toString('hex'),
      credentials: { tenantId: 'tenant', clientId: 'client', clientSecret: 'secret' },
      http,
    });
    expect(signed.signature).toBe(signature);
    expect(azure.verifyEs256(signed.publicKeyPem, digest.toString('hex'), signature)).toBe(true);
  });

  it('does not report a connected vault from the service wrapper without a key lookup', async () => {
    await expect(cloudKmsService.testConnection('azure', {
      credentials: {},
      keyId: 'kek',
      vaultUrl: 'https://can.vault.azure.net',
    })).rejects.toThrow(/Missing Azure credentials|credentials are missing/);
  });
});

describe('Azure contract KMS gate', () => {
  const account = { subscriptionId: 'sub', resourceGroup: 'rg', clusterName: 'aks' };

  it('leaves a contract without Azure KMS on the kubeconfig gate', async () => {
    delete process.env.AZURE_CCR_KUBECONFIG;
    delete process.env.CONTRACT_KMS_ENFORCE;
    const result = await provisionAzureCcr({
      jobId: 'job-1',
      contract: { contractId: 'contract-1' },
      account,
      containerSpec: { image: 'trainer:latest' },
    });
    expect(result.submitted).toBe(false);
    expect(result.error).toMatch(/kubeconfig/i);
    expect(result.attestation.mode).toBe('simulated');
  });

  it('does not submit when the Azure key id is missing', async () => {
    const prepared = await prepareAzureContractKms({
      kmsConfigs: { provider: 'azure-key-vault', vaultUrl: 'https://can.vault.azure.net' },
    });
    expect(prepared.ok).toBe(false);
    const result = await provisionAzureCcr({
      jobId: 'job-kms',
      contract: { contractId: 'contract-1', kmsConfigs: { provider: 'azure-key-vault', keyId: 'kek' } },
      account,
      containerSpec: { image: 'trainer:latest' },
    });
    expect(result.submitted).toBe(false);
    expect(result.error).toMatch(/vaultUrl/);
  });

  it('puts the vault key id on the job and still refuses to submit without a kubeconfig', async () => {
    delete process.env.AZURE_CCR_KUBECONFIG;
    const keyVault = { testConnection: async () => ({ kty: 'oct', status: 'connected' }) };
    const result = await provisionAzureCcr({
      jobId: 'job-kms-ok',
      contract: {
        contractId: 'contract-1',
        kmsConfigs: {
          provider: 'azure-key-vault',
          vaultUrl: 'https://can.vault.azure.net',
          keyId: 'contract-kek',
          credentials: { clientSecret: 'must-not-leak' },
        },
      },
      account,
      containerSpec: { image: 'trainer:latest' },
      keyVault,
    });
    expect(result.submitted).toBe(false);
    expect(result.error).toMatch(/kubeconfig/i);
    const env = result.spec.spec.template.spec.containers[0].env;
    expect(env.find((item) => item.name === 'AZURE_KEK_KEY_ID').value).toBe('contract-kek');
    expect(env.find((item) => item.name === 'AZURE_KEY_VAULT_URI').value).toBe('https://can.vault.azure.net');
    expect(JSON.stringify(result.spec)).not.toContain('must-not-leak');
  });
});

describe('Azure attested key release', () => {
  function attestationHttp(jwk) {
    return {
      get: jest.fn(async (url) => {
        if (String(url).includes('openid-configuration')) {
          return { data: { issuer: 'https://attest.example/attest', jwks_uri: 'https://attest.example/keys' } };
        }
        return { data: { keys: [jwk] } };
      }),
      post: jest.fn(async (url) => {
        if (String(url).includes('oauth2')) return { data: { access_token: 'token' } };
        if (String(url).includes('/release')) return { data: { value: 'tee-encrypted-blob' } };
        throw new Error(`unexpected post ${url}`);
      }),
    };
  }

  it('rejects a missing attestation token', async () => {
    process.env.AZURE_ATTESTATION_URL = 'https://attest.example/attest';
    await expect(verifyAzureAttestationToken('', {})).rejects.toThrow(/simulated report is not a guest quote/);
    delete process.env.AZURE_ATTESTATION_URL;
  });

  it('releases an encrypted blob only after the attestation token verifies', async () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = publicKey.export({ format: 'jwk' });
    jwk.kid = 'maa-test';
    jwk.alg = 'RS256';
    jwk.use = 'sig';
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'maa-test', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'https://attest.example/attest',
      exp: Math.floor(Date.now() / 1000) + 300,
      'x-ms-attestation-type': 'sevsnp',
    })).toString('base64url');
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
    const token = `${header}.${payload}.${signature}`;
    process.env.AZURE_ATTESTATION_URL = 'https://attest.example/attest';
    const http = attestationHttp(jwk);
    const released = await releasePrincipalKey({
      keyType: 'DEK',
      vaultUrl: 'https://can.vault.azure.net',
      keyId: 'data-dek',
      attestationToken: token,
      credentials: { tenantId: 'tenant', clientId: 'client', clientSecret: 'secret' },
      http,
    });
    expect(released.keyStored).toBe(false);
    expect(released.reportFormat).toBe('AZURE_ATTESTATION');
    expect(released.attestationType).toBe('sevsnp');
    expect(released.encryptedRelease).toBe('tee-encrypted-blob');
    expect(released.releaseBlobSha256).toHaveLength(64);
    expect(released.plaintext).toBeUndefined();
    delete process.env.AZURE_ATTESTATION_URL;
  });
});

describe('guest quote token', () => {
  it('accepts a token only for the job it was minted for', () => {
    const token = mintGuestQuoteToken('job-1');
    expect(verifyGuestQuoteToken(token).jobId).toBe('job-1');
    expect(verifyGuestQuoteToken(token.slice(0, -2))).toBeNull();
    expect(verifyGuestQuoteToken('not-a-token')).toBeNull();
  });

  it('puts the token only on the applied manifest', () => {
    const spec = {
      metadata: { name: 'cm-train-job-1', namespace: 'contract-management' },
      spec: { template: { spec: { containers: [{ env: [] }] } } },
    };
    const manifest = quoteManifest(spec, { token: 'signed-token', apiUrl: 'https://api.example' });
    const applied = manifest.items[1];
    expect(applied.spec.template.spec.containers[0].env.find((item) => item.name === 'CAN_GUEST_QUOTE_TOKEN').value).toBe('signed-token');
    expect(manifest.items[0].data['azure_guest_quote.py']).toMatch(/No quote was created/);
    expect(JSON.stringify(spec)).not.toContain('signed-token');
  });
});

describe('Azure signing backend switch', () => {
  const previous = process.env.SIGNING_KEY_BACKEND;

  afterEach(() => {
    if (previous === undefined) delete process.env.SIGNING_KEY_BACKEND;
    else process.env.SIGNING_KEY_BACKEND = previous;
  });

  it('keeps database signing unless the backend is set to Key Vault', () => {
    delete process.env.SIGNING_KEY_BACKEND;
    expect(usesAzureSigningBackend()).toBe(false);
    process.env.SIGNING_KEY_BACKEND = 'azure-keyvault';
    expect(usesAzureSigningBackend()).toBe(true);
    process.env.SIGNING_KEY_BACKEND = 'azure-mhsm';
    expect(usesAzureSigningBackend()).toBe(true);
  });
});
