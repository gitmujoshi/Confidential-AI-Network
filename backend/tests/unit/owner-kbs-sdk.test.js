const {
  MockOwnerKbs,
  ProductionOwnerKbs,
  HttpOwnerKbsClient,
  ownerKbsHandlers,
  orchestrateRelease,
  orchestrateRenew,
  bindReportData,
  verifyReceipt,
} = require('../../sdk/owner-kbs');
const { generateHpkeKeyPair, open } = require('../../services/hpke');
const { generateEphemeralRsaKeyPair, openWrappedKey } = require('../../services/canKeyDelivery');

describe('owner KBS SDK', () => {
  test('a mock broker wraps one key to pk_ccr and refuses a second nonce use', async () => {
    const { publicKeyPem, privateKeyPem } = generateEphemeralRsaKeyPair();
    const kbs = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    kbs.holdKey(Buffer.from('dataset-dek'));
    const issued = await kbs.issueNonce();
    const released = await kbs.release({
      nonce: issued.nonce,
      pkCcr: publicKeyPem,
      contract: { status: 'SIGNED', hash: 'abc' },
    });
    expect(released.keyStored).toBe(false);
    expect(released.namespace).toBe('can-mock');
    expect(openWrappedKey(privateKeyPem, released.wrappedKey).toString()).toBe('dataset-dek');
    await expect(kbs.release({
      nonce: issued.nonce,
      pkCcr: publicKeyPem,
      contract: { status: 'SIGNED' },
    })).rejects.toMatchObject({ code: 'NONCE_REPLAY' });
  });

  test('bound evidence must match the nonce, key, contract, and owner', async () => {
    const kbs = new MockOwnerKbs({ ownerId: 'did:can:tdc', keyType: 'MEK' });
    const issued = await kbs.issueNonce();
    const pkCcr = 'pk';
    await expect(kbs.release({
      nonce: issued.nonce,
      pkCcr,
      contract: { hash: 'contract' },
      evidence: { reportData: 'not-the-binding' },
    })).rejects.toMatchObject({ code: 'REPORT_UNBOUND' });
    const again = await kbs.issueNonce();
    const reportData = bindReportData({
      nonce: again.nonce,
      pkCcr,
      contractHash: 'contract',
      ownerId: 'did:can:tdc',
    });
    const released = await kbs.release({
      nonce: again.nonce,
      pkCcr,
      contract: { status: 'SIGNED', hash: 'contract' },
      evidence: { reportData },
    });
    expect(released.receipt.ownerId).toBe('did:can:tdc');
    expect(released.wrappedKey).toBeNull();
  });

  test('the orchestrator drops every release when one owner refuses', async () => {
    const data = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    data.holdKey(Buffer.from('dek'));
    const model = new MockOwnerKbs({ ownerId: 'did:can:tdc', keyType: 'MEK' });
    await expect(orchestrateRelease({
      pkCcr: 'pk',
      contract: { status: 'REVOKED' },
      owners: [
        { ownerId: 'did:can:tdp', keyType: 'DEK', client: data },
        { ownerId: 'did:can:tdc', keyType: 'MEK', client: model },
      ],
    })).rejects.toMatchObject({ code: 'RELEASE_BARRIER' });
  });

  test('the orchestrator calls both brokers and keeps the wrapped keys', async () => {
    const { publicKeyPem, privateKeyPem } = generateEphemeralRsaKeyPair();
    const data = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    const model = new MockOwnerKbs({ ownerId: 'did:can:tdc', keyType: 'MEK' });
    data.holdKey(Buffer.from('dek'));
    model.holdKey(Buffer.from('mek'));
    const outcome = await orchestrateRelease({
      pkCcr: publicKeyPem,
      contract: { status: 'SIGNED', hash: 'c1' },
      owners: [
        { ownerId: 'did:can:tdp', keyType: 'DEK', client: data },
        { ownerId: 'did:can:tdc', keyType: 'MEK', client: model },
      ],
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.keyStored).toBe(false);
    const dek = outcome.releases.find((item) => item.keyType === 'DEK');
    const mek = outcome.releases.find((item) => item.keyType === 'MEK');
    expect(openWrappedKey(privateKeyPem, dek.wrappedKey).toString()).toBe('dek');
    expect(openWrappedKey(privateKeyPem, mek.wrappedKey).toString()).toBe('mek');
  });

  test('the HTTP client posts nonce and release to the owner endpoint', async () => {
    const calls = [];
    const http = async (url, body) => {
      calls.push({ url, body });
      if (url.endsWith('/nonce')) return { data: { nonce: 'n1', ownerId: body.ownerId } };
      return { data: { ok: true, ownerId: body.ownerId, keyType: body.keyType, wrappedKey: null, keyStored: false, receipt: { ownerId: body.ownerId } } };
    };
    const client = new HttpOwnerKbsClient({
      endpoint: 'https://owner.example/kbs',
      ownerId: 'did:can:tdp',
      keyType: 'DEK',
      http,
    });
    const issued = await client.issueNonce();
    const released = await client.release({ nonce: issued.nonce, pkCcr: 'pk' });
    expect(calls.map((call) => call.url)).toEqual([
      'https://owner.example/kbs/nonce',
      'https://owner.example/kbs/release',
    ]);
    expect(released.ok).toBe(true);
    expect(released.keyStored).toBe(false);
  });

  test('an unreachable owner KBS fails closed', async () => {
    const http = async () => {
      const err = new Error('connect ECONNREFUSED');
      err.code = 'ECONNREFUSED';
      throw err;
    };
    const client = new HttpOwnerKbsClient({
      endpoint: 'https://owner.example/kbs',
      ownerId: 'did:can:tdp',
      keyType: 'DEK',
      http,
    });
    await expect(client.issueNonce()).rejects.toMatchObject({ code: 'ECONNREFUSED', statusCode: 502 });
  });

  test('HTTP handlers return the broker result and a refusal code', async () => {
    const kbs = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    const handlers = ownerKbsHandlers(kbs);
    const nonceRes = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    await handlers.nonce({ body: {} }, nonceRes);
    expect(nonceRes.statusCode).toBe(200);
    expect(nonceRes.body.nonce).toHaveLength(32);
    const releaseRes = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    await handlers.release({ body: { nonce: 'missing', pkCcr: 'pk' } }, releaseRes);
    expect(releaseRes.statusCode).toBe(409);
    expect(releaseRes.body.code).toBe('NONCE_REPLAY');
  });

  test('a lease renews while it is valid and blocks output after it expires', async () => {
    const kbs = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    const issued = await kbs.issueNonce();
    const released = await kbs.release({
      nonce: issued.nonce,
      pkCcr: generateEphemeralRsaKeyPair().publicKeyPem,
      contract: { status: 'SIGNED' },
    });
    expect(verifyReceipt(released.receipt)).toBe(true);
    const renewed = await kbs.renewLease({ leaseId: released.lease.leaseId });
    expect(Date.parse(renewed.expiresAt)).toBeGreaterThan(Date.now());
    kbs.leases.now = () => Date.now() + 120000;
    await expect(kbs.renewLease({ leaseId: released.lease.leaseId })).rejects.toMatchObject({ code: 'LEASE_EXPIRED' });
    await expect(orchestrateRenew({
      owners: [{ ownerId: 'did:can:tdp', keyType: 'DEK', client: kbs, leaseId: released.lease.leaseId }],
    })).rejects.toMatchObject({ code: 'LEASE_EXPIRED' });
  });
});

describe('production owner KBS', () => {
  test('refuses a mock quote', async () => {
    const kbs = new ProductionOwnerKbs({
      ownerId: 'did:can:tdp',
      keyType: 'DEK',
      provider: { async unwrap() { return Buffer.from('dek'); } },
    });
    const issued = await kbs.issueNonce();
    await expect(kbs.release({
      nonce: issued.nonce,
      pkCcr: 'hpke1.aaaa',
      evidence: { format: 'SIMULATED', tee_type: 'mock' },
    })).rejects.toMatchObject({ code: 'MOCK_TEE_REFUSED' });
  });

  test('seals with HPKE after the owner verifier accepts the quote', async () => {
    const recipient = generateHpkeKeyPair();
    const logs = [];
    const kbs = new ProductionOwnerKbs({
      ownerId: 'did:can:tdp',
      keyType: 'DEK',
      provider: { async unwrap() { return Buffer.from('owner-dek'); } },
      verify: async () => ({ verified: true, teeType: 'sev-snp', reportFormat: 'SEV_SNP', debugEnabled: false }),
      logReceipt: async (receipt) => {
        logs.push(receipt);
        return { logged: true, claimId: 'claim-1' };
      },
    });
    const issued = await kbs.issueNonce();
    const released = await kbs.release({
      nonce: issued.nonce,
      pkCcr: recipient.publicKey,
      contract: { status: 'SIGNED', hash: 'c1' },
      evidence: { format: 'SEV_SNP' },
    });
    expect(released.keyStored).toBe(false);
    expect(released.transparency).toEqual({ logged: true, claimId: 'claim-1' });
    expect(verifyReceipt(released.receipt)).toBe(true);
    expect(open({ recipientPrivateKey: recipient.privateKey, encapsulated: released.wrappedKey }).toString()).toBe('owner-dek');
    expect(logs[0].keyStored).toBe(false);
  });
});
