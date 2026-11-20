const crypto = require('crypto');
const {
  DepaConsentService,
  consentArtefactPayload,
} = require('../../services/depaConsentService');

function memoryModel() {
  const rows = new Map();
  return {
    async create(data) {
      const row = {
        ...data,
        async update(patch) {
          Object.assign(this, patch);
          return this;
        },
        toJSON() {
          return { ...this, update: undefined, toJSON: undefined };
        },
      };
      rows.set(data.offerId, row);
      return row;
    },
    async findByPk(id) {
      return rows.get(id) || null;
    },
  };
}

function signPayload(payload, privateKey) {
  return crypto.sign('sha256', Buffer.from(payload), privateKey).toString('base64');
}

describe('DEPA consent artefact', () => {
  test('keeps personal data closed until a signed artefact is valid', async () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
    const svc = new DepaConsentService(memoryModel());
    const offer = await svc.createOffer({
      purpose: 'COVID risk scoring',
      fields: ['age', 'region'],
      personalData: { age: 42, region: 'IN-KA' },
      providerUserId: 7,
    });
    expect(offer.personalData).toBeUndefined();
    expect(offer.status).toBe('open');

    await expect(svc.release(offer.offerId)).rejects.toMatchObject({ code: 'CONSENT_REQUIRED' });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const payload = consentArtefactPayload({
      offerId: offer.offerId,
      purpose: offer.purpose,
      fields: offer.fields,
      principalId: 'did:example:principal',
      expiresAt,
    });
    const consented = await svc.recordConsent(offer.offerId, {
      principalId: 'did:example:principal',
      publicKey: publicPem,
      signature: signPayload(payload, privateKey),
      expiresAt,
    });
    expect(consented.status).toBe('consented');

    const released = await svc.release(offer.offerId);
    expect(released.personalData).toEqual({ age: 42, region: 'IN-KA' });
    expect(released.status).toBe('released');
  });

  test('rejects a signature that does not match the offer', async () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const svc = new DepaConsentService(memoryModel());
    const offer = await svc.createOffer({
      purpose: 'demo',
      fields: ['email'],
      personalData: { email: 'a@example.com' },
    });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await expect(svc.recordConsent(offer.offerId, {
      principalId: 'did:example:principal',
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
      signature: signPayload('different-payload', privateKey),
      expiresAt,
    })).rejects.toMatchObject({ code: 'CONSENT_INVALID' });
  });
});
