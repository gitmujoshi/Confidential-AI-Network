/**
 * Owner Key Broker Service SDK.
 * The CCR Key Orchestrator calls issueNonce and release on one client per owner.
 * The mock broker is for local and dev. An owner process serves the same two calls over HTTP.
 */

const crypto = require('crypto');
const { wrapKeyToPublicPem } = require('../services/canKeyDelivery');
const { seal } = require('../services/hpke');
const { evaluateReleasePolicy, reserveReleaseBudget } = require('../services/keyReleasePolicy');
const { assertKeyReleaseProfile } = require('../services/keyReleaseClient');
const { verifyOwnerEvidence } = require('../services/ownerVerifier');
const { KeyLeaseTable } = require('../services/keyLease');
const { signReceipt, verifyReceipt, appendReleaseReceipt } = require('../services/releaseReceipt');

const NONCE_TTL_MS = 2 * 60 * 1000;

function kbsError(message, code, statusCode = 409) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

function bindReportData({ nonce, pkCcr, contractHash, ownerId }) {
  return crypto.createHash('sha256')
    .update([nonce, pkCcr, contractHash || '', ownerId].join('|'))
    .digest('hex');
}

class MockOwnerKbs {
  constructor({ ownerId, keyType, profile = 'local', namespace = 'can-mock' } = {}) {
    if (keyType !== 'DEK' && keyType !== 'MEK') {
      throw kbsError('keyType must be DEK or MEK', 'KBS_KEY_TYPE', 400);
    }
    this.ownerId = ownerId;
    this.keyType = keyType;
    this.profile = profile;
    this.namespace = namespace;
    this.nonces = new Map();
    this.held = null;
    this.leases = new KeyLeaseTable({ ttlMs: 60 * 1000 });
    this.signer = crypto.generateKeyPairSync('ed25519');
  }

  wrapHeld(pkCcr) {
    if (!this.held) return null;
    const wrappedKey = String(pkCcr).startsWith('hpke1.')
      ? seal({ recipientPublicKey: pkCcr, plaintext: this.held })
      : wrapKeyToPublicPem(pkCcr, this.held);
    this.held.fill(0);
    this.held = null;
    return wrappedKey;
  }

  signedReceipt({ nonce, contractHash, lease }) {
    return signReceipt({
      ownerId: this.ownerId,
      keyType: this.keyType,
      namespace: this.namespace,
      nonce,
      contractHash: contractHash || null,
      leaseId: lease.leaseId,
      teeType: this.profile === 'production' ? 'owner' : 'mock',
      keyStored: false,
    }, this.signer.privateKey);
  }

  holdKey(keyBytes) {
    const body = Buffer.isBuffer(keyBytes) ? Buffer.from(keyBytes) : Buffer.from(String(keyBytes));
    if (this.held) this.held.fill(0);
    this.held = body;
  }

  async issueNonce() {
    const nonce = crypto.randomBytes(16).toString('hex');
    this.nonces.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS, used: false });
    return { ownerId: this.ownerId, nonce, expiresAt: new Date(Date.now() + NONCE_TTL_MS).toISOString() };
  }

  async release({ nonce, pkCcr, contract, evidence, budget, claims, evidenceChecked } = {}) {
    const pending = this.nonces.get(nonce);
    if (!pending || pending.used || pending.expiresAt <= Date.now()) {
      throw kbsError('Release nonce is missing, used, or expired.', 'NONCE_REPLAY');
    }
    pending.used = true;
    if (!pkCcr) {
      throw kbsError('pk_ccr is required.', 'KBS_PUBLIC_KEY', 400);
    }
    const contractHash = contract && (contract.hash || contract.contractHash);
    if (evidence && evidence.reportData) {
      const expected = bindReportData({
        nonce,
        pkCcr,
        contractHash,
        ownerId: this.ownerId,
      });
      if (evidence.reportData !== expected) {
        throw kbsError('Attestation report data is not bound to this owner release.', 'REPORT_UNBOUND');
      }
    } else if (this.profile === 'production' && !evidenceChecked) {
      throw kbsError('Production release requires bound attestation evidence.', 'REPORT_UNBOUND');
    }
    const reserved = reserveReleaseBudget(budget);
    const releaseClaims = {
      tee_type: 'mock',
      debug_enabled: false,
      nonce_fresh: true,
      report_data_bound: true,
      ...(claims || {}),
    };
    evaluateReleasePolicy({
      profile: this.profile,
      claims: releaseClaims,
      contract,
      budget: reserved,
    });
    const lease = this.leases.issue({ ownerId: this.ownerId, keyType: this.keyType });
    const wrappedKey = this.wrapHeld(pkCcr);
    const signed = this.signedReceipt({ nonce, contractHash, lease });
    return {
      ok: true,
      ownerId: this.ownerId,
      keyType: this.keyType,
      namespace: this.namespace,
      keyStored: false,
      wrappedKey,
      budget: reserved,
      lease,
      receipt: {
        ownerId: this.ownerId,
        keyType: this.keyType,
        namespace: this.namespace,
        nonce,
        contractHash: contractHash || null,
        leaseId: lease.leaseId,
        teeType: this.profile === 'production' ? 'owner' : 'mock',
        keyStored: false,
        signature: signed.signature,
        publicKey: signed.publicKey,
        body: signed.body,
      },
      signatureValid: verifyReceipt(signed),
    };
  }

  async renewLease({ leaseId } = {}) {
    return this.leases.renew({ leaseId, ownerId: this.ownerId });
  }
}

class ProductionOwnerKbs extends MockOwnerKbs {
  constructor({ provider, referenceValues, logReceipt, http, namespace = 'can-owner', ...rest } = {}) {
    super({ ...rest, profile: 'production', namespace });
    this.provider = provider;
    this.referenceValues = referenceValues || {};
    this.logReceipt = logReceipt || (async () => ({ logged: false, reason: 'SCITT_DISABLED' }));
    this.http = http;
    this.verify = rest.verify || verifyOwnerEvidence;
  }

  async release(request = {}) {
    const verification = await this.verify({
      profile: 'production',
      evidence: request.evidence,
      expectedReportData: request.expectedReportData,
      referenceValues: this.referenceValues,
      http: this.http,
    });
    if (!verification.verified) {
      throw kbsError('Production release requires a verified owner quote.', 'ATTESTATION_REQUIRED');
    }
    if (!this.provider || !this.provider.unwrap) {
      throw kbsError('Production KBS has no key provider.', 'MOCK_KMS_REFUSED', 503);
    }
    const provided = await this.provider.unwrap({ keyType: this.keyType });
    if (Buffer.isBuffer(provided)) {
      this.holdKey(provided);
      provided.fill(0);
    } else if (provided && provided.encryptedRelease) {
      const pending = this.nonces.get(request.nonce);
      if (!pending || pending.used || pending.expiresAt <= Date.now()) {
        throw kbsError('Release nonce is missing, used, or expired.', 'NONCE_REPLAY');
      }
      pending.used = true;
      const lease = this.leases.issue({ ownerId: this.ownerId, keyType: this.keyType });
      const receipt = this.signedReceipt({
        nonce: request.nonce,
        contractHash: request.contract && (request.contract.hash || request.contract.contractHash),
        lease,
      });
      const transparency = await this.logReceipt(receipt);
      return {
        ok: true,
        ownerId: this.ownerId,
        keyType: this.keyType,
        namespace: this.namespace,
        keyStored: false,
        wrappedKey: null,
        encryptedRelease: provided.encryptedRelease,
        lease,
        receipt,
        transparency,
        verification,
      };
    } else {
      throw kbsError('The key provider did not return a key.', 'KBS_UNAVAILABLE', 502);
    }
    const released = await super.release({
      ...request,
      evidenceChecked: true,
      claims: {
        tee_type: verification.teeType,
        debug_enabled: verification.debugEnabled,
        nonce_fresh: true,
        report_data_bound: true,
        ...(request.claims || {}),
      },
    });
    released.transparency = await this.logReceipt(released.receipt);
    released.verification = { verified: true, reportFormat: verification.reportFormat };
    return released;
  }
}

class HttpOwnerKbsClient {
  constructor({ endpoint, ownerId, keyType, http, timeoutMs = 10000 } = {}) {
    if (!endpoint) throw kbsError('Owner KBS endpoint is required.', 'KBS_ENDPOINT', 400);
    this.endpoint = String(endpoint).replace(/\/+$/, '');
    this.ownerId = ownerId;
    this.keyType = keyType;
    this.timeoutMs = timeoutMs;
    this.http = http || defaultHttp;
  }

  async issueNonce() {
    const data = await this._post('/nonce', { ownerId: this.ownerId, keyType: this.keyType });
    return data;
  }

  async renewLease({ leaseId } = {}) {
    return this._post('/lease', { ownerId: this.ownerId, keyType: this.keyType, leaseId });
  }

  async release(request) {
    const data = await this._post('/release', {
      ownerId: this.ownerId,
      keyType: this.keyType,
      ...request,
    });
    return data;
  }

  async _post(path, body) {
    try {
      const response = await this.http(`${this.endpoint}${path}`, body, this.timeoutMs);
      return response && response.data ? response.data : response;
    } catch (error) {
      const status = error.statusCode || error.response?.status;
      const code = error.code || error.response?.data?.code || 'KBS_UNAVAILABLE';
      const message = error.response?.data?.error || error.message || 'Owner KBS did not answer.';
      throw kbsError(message, code, status && status >= 400 ? status : 502);
    }
  }
}

async function defaultHttp(url, body, timeoutMs) {
  const axios = require('axios');
  return axios.post(url, body, { timeout: timeoutMs, validateStatus: (status) => status >= 200 && status < 300 });
}

function ownerKbsHandlers(kbs) {
  async function send(res, work) {
    try {
      const result = await work();
      res.status(200).json({ success: true, keyStored: false, ...result });
    } catch (error) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message,
        code: error.code || 'KBS_REFUSED',
      });
    }
  }
  return {
    nonce: (req, res) => send(res, () => kbs.issueNonce(req.body || {})),
    release: (req, res) => send(res, () => kbs.release(req.body || {})),
    lease: (req, res) => send(res, () => kbs.renewLease(req.body || {})),
  };
}

async function orchestrateRenew({ owners } = {}) {
  const renewed = await Promise.all((owners || []).map(async (owner) => {
    const client = clientForOwner(owner);
    try {
      const lease = await client.renewLease({ leaseId: owner.leaseId });
      return { ok: true, ownerId: owner.ownerId, lease };
    } catch (error) {
      return { ok: false, ownerId: owner.ownerId, code: error.code || 'LEASE_EXPIRED', error: error.message };
    }
  }));
  if (renewed.some((item) => item.ok === false)) {
    throw kbsError('One owner refused to renew the key lease. Output release was blocked.', 'LEASE_EXPIRED');
  }
  return { ok: true, keyStored: false, leases: renewed.map((item) => item.lease) };
}

function clientForOwner(owner, env = process.env) {
  if (owner.client) return owner.client;
  if (!owner.endpoint || owner.endpoint === 'mock') {
    const resolved = assertKeyReleaseProfile(env);
    if (resolved.profile === 'production') {
      throw kbsError('Production refuses the mock owner KBS.', 'MOCK_KMS_REFUSED', 503);
    }
    return new MockOwnerKbs({
      ownerId: owner.ownerId,
      keyType: owner.keyType,
      profile: 'local',
    });
  }
  return new HttpOwnerKbsClient({
    endpoint: owner.endpoint,
    ownerId: owner.ownerId,
    keyType: owner.keyType,
    http: owner.http,
  });
}

async function orchestrateRelease({ owners, pkCcr, contract, evidence, budget } = {}) {
  if (!Array.isArray(owners) || owners.length === 0) {
    throw kbsError('At least one owner KBS is required.', 'RELEASE_BARRIER');
  }
  const releases = await Promise.all(owners.map(async (owner) => {
    const client = clientForOwner(owner);
    try {
      const issued = await client.issueNonce();
      const released = await client.release({
        nonce: issued.nonce,
        pkCcr,
        contract,
        evidence: evidence || owner.evidence,
        budget: owner.budget || budget,
        claims: owner.claims,
      });
      return { ...released, ok: released.ok !== false, ownerId: owner.ownerId, keyType: owner.keyType };
    } catch (error) {
      return {
        ok: false,
        ownerId: owner.ownerId,
        keyType: owner.keyType,
        code: error.code || 'KBS_UNAVAILABLE',
        error: error.message,
      };
    }
  }));
  const refused = releases.filter((item) => item.ok === false);
  if (refused.length > 0) {
    releases.forEach((item) => {
      item.wrappedKey = null;
    });
    const err = kbsError(
      'One owner refused key release. No key was kept.',
      'RELEASE_BARRIER'
    );
    err.owners = refused.map((item) => ({
      ownerId: item.ownerId,
      keyType: item.keyType,
      code: item.code,
    }));
    throw err;
  }
  return {
    ok: true,
    keyStored: false,
    releases,
  };
}

module.exports = {
  MockOwnerKbs,
  ProductionOwnerKbs,
  HttpOwnerKbsClient,
  ownerKbsHandlers,
  clientForOwner,
  orchestrateRelease,
  orchestrateRenew,
  bindReportData,
  verifyReceipt,
};
