const crypto = require('crypto');

function consentArtefactPayload({ offerId, purpose, fields, principalId, expiresAt }) {
  return JSON.stringify({
    expiresAt: new Date(expiresAt).toISOString(),
    fields: [...(fields || [])].map(String).sort(),
    offerId: String(offerId),
    principalId: String(principalId),
    purpose: String(purpose),
  });
}

function verifyConsentSignature({ payload, publicKey, signature }) {
  try {
    return crypto.verify(
      'sha256',
      Buffer.from(payload),
      publicKey,
      Buffer.from(String(signature || ''), 'base64')
    );
  } catch (error) {
    return false;
  }
}

function publicOffer(row) {
  const plain = row?.toJSON ? row.toJSON() : { ...row };
  return {
    offerId: plain.offerId,
    contractId: plain.contractId || null,
    purpose: plain.purpose,
    fields: plain.fields || [],
    status: plain.status,
    principalId: plain.principalId || null,
    consentedAt: plain.consentedAt || null,
    expiresAt: plain.expiresAt || null,
    releasedAt: plain.releasedAt || null,
    withdrawnAt: plain.withdrawnAt || null,
  };
}

function fail(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

class DepaConsentService {
  constructor(model) {
    if (!model) throw new Error('DepaConsentService requires an offer model');
    this.model = model;
  }

  async createOffer({ contractId, providerUserId, purpose, fields, personalData }) {
    if (!purpose || !String(purpose).trim()) throw fail(400, 'PURPOSE_REQUIRED', 'purpose is required');
    if (!Array.isArray(fields) || fields.length === 0) {
      throw fail(400, 'FIELDS_REQUIRED', 'fields must list the personal-data fields this offer can release');
    }
    if (!personalData || typeof personalData !== 'object' || Array.isArray(personalData)) {
      throw fail(400, 'PERSONAL_DATA_REQUIRED', 'personalData must be an object held until consent is valid');
    }
    const offer = await this.model.create({
      offerId: crypto.randomUUID(),
      contractId: contractId || null,
      providerUserId: providerUserId || null,
      purpose: String(purpose).trim(),
      fields: fields.map(String),
      personalData,
      status: 'open',
    });
    return publicOffer(offer);
  }

  async recordConsent(offerId, { principalId, publicKey, signature, expiresAt }) {
    const offer = await this.model.findByPk(offerId);
    if (!offer) throw fail(404, 'OFFER_NOT_FOUND', 'Offer not found');
    if (offer.status === 'withdrawn' || offer.withdrawnAt) {
      throw fail(403, 'CONSENT_WITHDRAWN', 'This offer was withdrawn');
    }
    if (offer.status === 'released') {
      throw fail(409, 'ALREADY_RELEASED', 'Personal data for this offer was already released');
    }
    if (!principalId || !publicKey || !signature || !expiresAt) {
      throw fail(400, 'ARTEFACT_INCOMPLETE', 'principalId, publicKey, signature, and expiresAt are required');
    }
    const expiry = new Date(expiresAt);
    if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
      throw fail(400, 'CONSENT_EXPIRED', 'expiresAt must be a future time');
    }
    const payload = consentArtefactPayload({
      offerId: offer.offerId,
      purpose: offer.purpose,
      fields: offer.fields,
      principalId,
      expiresAt: expiry,
    });
    if (!verifyConsentSignature({ payload, publicKey, signature })) {
      throw fail(400, 'CONSENT_INVALID', 'Consent signature does not match the offer');
    }
    await offer.update({
      status: 'consented',
      principalId: String(principalId),
      publicKey,
      signature,
      artefactPayload: payload,
      consentedAt: new Date(),
      expiresAt: expiry,
    });
    return publicOffer(offer);
  }

  async release(offerId) {
    const offer = await this.model.findByPk(offerId);
    if (!offer) throw fail(404, 'OFFER_NOT_FOUND', 'Offer not found');
    if (offer.withdrawnAt || offer.status === 'withdrawn') {
      throw fail(403, 'CONSENT_WITHDRAWN', 'Consent was withdrawn. Personal data stays closed.');
    }
    if (offer.status !== 'consented' && offer.status !== 'released') {
      throw fail(403, 'CONSENT_REQUIRED', 'Personal data stays closed until a valid consent artefact is recorded');
    }
    if (!offer.expiresAt || new Date(offer.expiresAt).getTime() <= Date.now()) {
      throw fail(403, 'CONSENT_EXPIRED', 'Consent has expired. Personal data stays closed.');
    }
    const payload = offer.artefactPayload;
    if (!payload || !verifyConsentSignature({
      payload,
      publicKey: offer.publicKey,
      signature: offer.signature,
    })) {
      throw fail(403, 'CONSENT_INVALID', 'Stored consent artefact no longer verifies. Personal data stays closed.');
    }
    const releasedAt = offer.releasedAt || new Date();
    if (offer.status !== 'released') {
      await offer.update({ status: 'released', releasedAt });
    }
    return {
      ...publicOffer(offer),
      status: 'released',
      releasedAt,
      personalData: offer.personalData,
    };
  }

  async withdraw(offerId) {
    const offer = await this.model.findByPk(offerId);
    if (!offer) throw fail(404, 'OFFER_NOT_FOUND', 'Offer not found');
    if (offer.status === 'released') {
      throw fail(409, 'ALREADY_RELEASED', 'Personal data was already released');
    }
    await offer.update({ status: 'withdrawn', withdrawnAt: new Date() });
    return publicOffer(offer);
  }
}

module.exports = {
  DepaConsentService,
  consentArtefactPayload,
  verifyConsentSignature,
  publicOffer,
};
