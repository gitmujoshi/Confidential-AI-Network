const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const { CANProvenanceService } = require('./canProvenanceService');
const { CANWebhookDispatcher } = require('./canWebhookDispatcher');
const { CANLocalCcrpExecutor } = require('./canLocalCcrpExecutor');
const {
  generateEphemeralRsaKeyPair,
  normalizePem,
  openWrappedKey,
} = require('./canKeyDelivery');
const { generateHpkeKeyPair, open: openHpke } = require('./hpke');
const { assertOutputGate, assertReleaseBarrier } = require('./outputReleaseGate');

const ephemeralPrivateKeys = new Map();

const ESCROW_STATES = {
  OPEN: 'OPEN',
  DEK_RECEIVED: 'DEK_RECEIVED',
  MEK_RECEIVED: 'MEK_RECEIVED',
  BOTH_READY: 'BOTH_READY',
  RELEASED: 'RELEASED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

function now() {
  return new Date();
}

function computeNextEscrowState(currentState, { dekSignal, mekSignal }) {
  // Once terminal, don't change.
  if ([ESCROW_STATES.RELEASED, ESCROW_STATES.EXPIRED, ESCROW_STATES.CANCELLED].includes(currentState)) {
    return currentState;
  }

  const hasDEK = dekSignal === true;
  const hasMEK = mekSignal === true;

  if (hasDEK && hasMEK) return ESCROW_STATES.BOTH_READY;
  if (hasDEK) return ESCROW_STATES.DEK_RECEIVED;
  if (hasMEK) return ESCROW_STATES.MEK_RECEIVED;
  return ESCROW_STATES.OPEN;
}

class CANJcsService {
  constructor({ escrowTimeoutMs = 10 * 60 * 1000 } = {}) {
    this.escrowTimeoutMs = escrowTimeoutMs;
    this.ownerLeaseUntil = new Map();
    this.provenance = new CANProvenanceService();
    this.webhooks = new CANWebhookDispatcher();
    this.localExecutor = new CANLocalCcrpExecutor({ jcs: this });
  }

  async createJob({ contractId, ccrProvider = 'local' }) {
    const createdAt = now();
    const escrowDeadline = new Date(createdAt.getTime() + this.escrowTimeoutMs);

    const ccrSession = await db.CANCcrSession.create({
      contractId,
      state: 'REQUESTED'
    });

    const job = await db.CANJcsJob.create({
      contractId,
      ccrSessionId: ccrSession.id,
      escrowState: ESCROW_STATES.OPEN,
      escrowDeadline,
      createdAt,
      ccrProvider
    });

    await this._appendEvent(job.jobId, 'JOB_CREATED', {
      contractId,
      ccrSessionId: ccrSession.id,
      escrowDeadline: escrowDeadline.toISOString()
    });

    // For MVP: immediately create a simulated attestation bundle.
    await this._ensureAttestation(job.jobId);

    return this.getJob(job.jobId);
  }

  async getJob(jobId) {
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');

    await this._expireIfNeeded(job);

    const reloaded = await db.CANJcsJob.findByPk(jobId);
    const attestation = await db.CANJcsAttestation.findOne({ where: { jobId } });
    const ccrSession = reloaded.ccrSessionId
      ? await db.CANCcrSession.findByPk(reloaded.ccrSessionId)
      : null;

    return {
      job: reloaded,
      ccrSession,
      attestation
    };
  }

  async listEvents(jobId, { afterSeq = 0, limit = 100 } = {}) {
    const events = await db.CANJcsEvent.findAll({
      where: {
        jobId,
        seq: { [Op.gt]: afterSeq }
      },
      order: [['seq', 'ASC']],
      limit
    });
    return events;
  }

  async markKeyReleased(jobId, { keyType, principalId, attestedPublicKey, wrappedKey }) {
    const { assertKeyReleaseProfile } = require('./keyReleaseClient');
    const resolved = assertKeyReleaseProfile();
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');

    await this._acceptWrappedKey(job, { attestedPublicKey, wrappedKey });
    return this._recordKeySignal(jobId, {
      keyType,
      principalId,
      release: {
        keyStored: false,
        namespace: resolved.namespace,
        teeType: resolved.backend === 'mock' ? 'mock' : resolved.backend,
        reportFormat: resolved.backend === 'mock' ? 'SIMULATED' : undefined,
      },
    });
  }

  async recordAzureKeyRelease(jobId, { keyType, principalId, release }) {
    const { keyReleaseBackend } = require('./keyReleaseClient');
    if (keyReleaseBackend() !== 'azure-skr') {
      const err = new Error('CAN_PRINCIPAL_KEY_MODE is not azure-skr. Key Vault release was not recorded.');
      err.statusCode = 409;
      err.code = 'AZURE_SKR_DISABLED';
      throw err;
    }
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    return this._recordKeySignal(jobId, {
      keyType,
      principalId,
      release: {
        keyStored: false,
        reportFormat: release && release.reportFormat,
        attestationType: release && release.attestationType,
        releaseBlobSha256: release && release.releaseBlobSha256,
      },
    });
  }

  async _recordKeySignal(jobId, { keyType, principalId, release }) {
    await this._expireIfNeeded(await db.CANJcsJob.findByPk(jobId));
    const freshJob = await db.CANJcsJob.findByPk(jobId);

    if ([ESCROW_STATES.EXPIRED, ESCROW_STATES.CANCELLED].includes(freshJob.escrowState)) {
      throw new Error(`Escrow is terminal (${freshJob.escrowState})`);
    }

    if (now() > freshJob.escrowDeadline) {
      // Re-check after expire attempt
      await this._expireIfNeeded(freshJob);
      const expiredJob = await db.CANJcsJob.findByPk(jobId);
      throw new Error(`Escrow is terminal (${expiredJob.escrowState})`);
    }

    const isDEK = keyType === 'DEK';
    const isMEK = keyType === 'MEK';
    if (!isDEK && !isMEK) throw new Error('Invalid keyType (expected DEK or MEK)');

    const updates = {};
    if (isDEK && !freshJob.dekReceivedAt) updates.dekReceivedAt = now();
    if (isMEK && !freshJob.mekReceivedAt) updates.mekReceivedAt = now();

    // Calculate next state from “signals”
    const nextState = computeNextEscrowState(freshJob.escrowState, {
      dekSignal: Boolean(isDEK || freshJob.dekReceivedAt),
      mekSignal: Boolean(isMEK || freshJob.mekReceivedAt)
    });

    updates.escrowState = nextState;
    await freshJob.update(updates);

    if (freshJob.ccrSessionId) {
      const ccr = await db.CANCcrSession.findByPk(freshJob.ccrSessionId);
      if (ccr) {
        if (isDEK) await ccr.update({ dekReceived: true });
        if (isMEK) await ccr.update({ mekReceived: true });
        if (nextState === ESCROW_STATES.BOTH_READY) await ccr.update({ state: 'READY' });
      }
    }

    const releasePayload = {
      keyType,
      principalId,
      escrowState: nextState,
      keyStored: false,
    };
    if (release && release.reportFormat) releasePayload.reportFormat = release.reportFormat;
    if (release && release.attestationType) releasePayload.attestationType = release.attestationType;
    if (release && release.releaseBlobSha256) releasePayload.releaseBlobSha256 = release.releaseBlobSha256;
    if (release && release.namespace) releasePayload.namespace = release.namespace;
    if (release && release.teeType) releasePayload.teeType = release.teeType;
    await this._appendEvent(jobId, 'KEY_RELEASED', releasePayload);

    if (nextState === ESCROW_STATES.BOTH_READY && freshJob.ccrSessionId) {
      ephemeralPrivateKeys.delete(freshJob.ccrSessionId);
    }

    if (nextState === ESCROW_STATES.BOTH_READY) {
      await this._appendEvent(jobId, 'ESCROW_BOTH_READY', {
        escrowDeadline: freshJob.escrowDeadline.toISOString()
      });
    }

    return this.getJob(jobId);
  }

  async orchestrateOwners(jobId, { owners, contract, evidence, budget } = {}) {
    const { orchestrateRelease } = require('../sdk/owner-kbs');
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    const attestation = await db.CANJcsAttestation.findOne({ where: { jobId } });
    if (!attestation || !attestation.tlsPublicKey) {
      const err = new Error('Clean-room attestation is not available. Key release was refused.');
      err.statusCode = 409;
      err.code = 'ATTESTATION_REQUIRED';
      throw err;
    }
    const material = ephemeralPrivateKeys.get(job.ccrSessionId);
    const pkCcr = material && material.hpkePublic ? material.hpkePublic : attestation.tlsPublicKey;
    const outcome = await orchestrateRelease({
      owners,
      pkCcr,
      contract,
      evidence,
      budget,
    });
    const { appendReleaseReceipt } = require('./releaseReceipt');
    let scitt = { isEnabled: false };
    try {
      scitt = require('./scittCcfService');
    } catch (error) {
      scitt = { isEnabled: false };
    }
    if (scitt.isEnabled) {
      for (const release of outcome.releases) {
        if (!release.receipt || !release.receipt.signature) continue;
        release.transparency = await appendReleaseReceipt(release.receipt, scitt);
      }
    }
    const wrapped = outcome.releases.filter((item) => item.wrappedKey);
    if (wrapped.length === outcome.releases.length) {
      for (const release of outcome.releases) {
        await this.markKeyReleased(jobId, {
          keyType: release.keyType,
          principalId: release.ownerId,
          attestedPublicKey: attestation.tlsPublicKey,
          wrappedKey: release.wrappedKey,
        });
        release.wrappedKey = null;
      }
    } else {
      outcome.releases.forEach((item) => {
        item.wrappedKey = null;
      });
    }
    const expiries = outcome.releases
      .map((item) => item.lease && Date.parse(item.lease.expiresAt))
      .filter((value) => Number.isFinite(value));
    if (expiries.length > 0) this.ownerLeaseUntil.set(jobId, Math.min(...expiries));
    await this._appendEvent(jobId, 'KBS_ORCHESTRATED', {
      keyStored: false,
      owners: outcome.releases.map((item) => ({
        ownerId: item.ownerId,
        keyType: item.keyType,
        namespace: item.namespace,
        leaseId: item.lease && item.lease.leaseId,
        receiptSigned: Boolean(item.receipt && item.receipt.signature),
        keyStored: false,
      })),
    });
    return { ok: true, keyStored: false, releases: outcome.releases };
  }

  /**
   * Seal owner keys to a public key generated inside the training guest.
   * The API drops its copy of sk_ccr and does not open the wrapped keys.
   * reportFormat stays SIMULATED. This guest is the local container, not a hardware TEE.
   */
  async releaseToGuest(jobId, { guestPublicKey, owners, contract, evidence, budget } = {}) {
    const { orchestrateRelease } = require('../sdk/owner-kbs');
    if (!String(guestPublicKey || '').startsWith('hpke1.')) {
      const err = new Error('The guest public key must be an hpke1 X25519 key.');
      err.statusCode = 400;
      err.code = 'GUEST_PUBLIC_KEY';
      throw err;
    }
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    const material = ephemeralPrivateKeys.get(job.ccrSessionId);
    if (material && material.hpkePrivate) {
      material.hpkePrivate.fill(0);
    }
    ephemeralPrivateKeys.set(job.ccrSessionId, {
      rsa: material && material.rsa,
      hpkePrivate: null,
      hpkePublic: guestPublicKey,
    });
    const attestation = await db.CANJcsAttestation.findOne({ where: { jobId } });
    if (attestation && attestation.attestationReport) {
      let report = {};
      try {
        const raw = Buffer.isBuffer(attestation.attestationReport)
          ? attestation.attestationReport
          : Buffer.from(attestation.attestationReport);
        report = JSON.parse(raw.toString('utf8'));
      } catch (error) {
        report = {};
      }
      report.hpkePublicKey = guestPublicKey;
      report.guestHeld = true;
      report.format = 'SIMULATED';
      await attestation.update({
        attestationReport: Buffer.from(JSON.stringify(report)),
        reportFormat: 'SIMULATED',
      });
    }
    const outcome = await orchestrateRelease({
      owners,
      pkCcr: guestPublicKey,
      contract,
      evidence,
      budget,
    });
    if (outcome.releases.some((item) => !item.wrappedKey)) {
      outcome.releases.forEach((item) => {
        item.wrappedKey = null;
      });
      const err = new Error('An owner broker did not seal a key to the guest. Training was not started.');
      err.statusCode = 409;
      err.code = 'GUEST_KEY_MISSING';
      throw err;
    }
    const delivered = [];
    for (const release of outcome.releases) {
      delivered.push({
        ownerId: release.ownerId,
        keyType: release.keyType,
        wrappedKey: release.wrappedKey,
      });
      await this._recordKeySignal(jobId, {
        keyType: release.keyType,
        principalId: release.ownerId,
        release: {
          keyStored: false,
          namespace: release.namespace,
          teeType: 'guest-local',
          reportFormat: 'SIMULATED',
        },
      });
      release.wrappedKey = null;
    }
    return {
      ok: true,
      keyStored: false,
      guestHeld: true,
      reportFormat: 'SIMULATED',
      releases: delivered,
    };
  }

  async renewOwnerLeases(jobId, { owners } = {}) {
    const { orchestrateRenew } = require('../sdk/owner-kbs');
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    const renewed = await orchestrateRenew({ owners });
    const expiries = renewed.leases
      .map((lease) => Date.parse(lease.expiresAt))
      .filter((value) => Number.isFinite(value));
    if (expiries.length > 0) this.ownerLeaseUntil.set(jobId, Math.min(...expiries));
    await this._appendEvent(jobId, 'KBS_LEASE_RENEWED', { keyStored: false, leases: renewed.leases });
    return renewed;
  }

  async recordSealedOutput(jobId, { sealedOutput, outputSha256 } = {}) {
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    await this._expireIfNeeded(job);
    const fresh = await db.CANJcsJob.findByPk(jobId);
    const ownerLease = this.ownerLeaseUntil.get(jobId);
    assertOutputGate({
      escrowState: fresh.escrowState,
      escrowDeadline: fresh.escrowDeadline,
      ownerLeaseDeadline: ownerLease ? new Date(ownerLease) : null,
    });
    const sealed = String(sealedOutput || '');
    const hash = String(outputSha256 || '');
    if (!sealed || !/^[a-f0-9]{64}$/i.test(hash)) {
      const err = new Error('Sealed output and its sha256 are required. Plaintext was not accepted.');
      err.statusCode = 400;
      err.code = 'OUTPUT_SEAL_REQUIRED';
      throw err;
    }
    await this._appendEvent(jobId, 'OUTPUT_SEALED', {
      outputSha256: hash,
      sealedBytes: sealed.length,
      keyStored: false,
    });
    return { keyStored: false, outputSha256: hash };
  }

  async releaseToScheduler(jobId) {
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');

    await this._expireIfNeeded(job);
    const fresh = await db.CANJcsJob.findByPk(jobId);

    assertReleaseBarrier({
      escrowState: fresh.escrowState,
      dekReleased: Boolean(fresh.dekReceivedAt),
      mekReleased: Boolean(fresh.mekReceivedAt),
    });
    if (fresh.escrowState !== ESCROW_STATES.BOTH_READY) {
      const err = new Error(`Job not ready (state=${fresh.escrowState})`);
      err.code = 'RELEASE_BARRIER';
      err.statusCode = 409;
      throw err;
    }

    const trainingJobId = fresh.trainingJobId || String(fresh.jobId); // reuse CAN job id by default
    await fresh.update({
      escrowState: ESCROW_STATES.RELEASED,
      resolvedAt: now(),
      trainingJobId
    });

    if (fresh.ccrSessionId) {
      const ccr = await db.CANCcrSession.findByPk(fresh.ccrSessionId);
      if (ccr) await ccr.update({ state: 'RUNNING', startedAt: now() });
    }

    await this._appendEvent(jobId, 'JOB_RELEASED', {});

    // If CCR provider is local, run locally (async / best-effort)
    if ((fresh.ccrProvider || 'local') === 'local') {
      // Emit start event immediately; completion will be emitted by the async worker.
      await this._appendEvent(jobId, 'TRAINING_STARTED', { trainingJobId });

      // Fire-and-forget execution
      this.localExecutor
        .run({ canJobId: jobId, contractId: fresh.contractId, trainingJobId })
        .then(async () => {
          const jobRow = await db.TrainingJob.findOne({ where: { jobId: trainingJobId } });
          const status = jobRow?.status;
          if (status === 'COMPLETED') {
            await this._appendEvent(jobId, 'TRAINING_COMPLETED', {
              trainingJobId,
              results: jobRow?.metadata?.results || null
            });
          } else if (status === 'FAILED') {
            await this._appendEvent(jobId, 'TRAINING_FAILED', {
              trainingJobId,
              errorMessage: jobRow?.errorMessage || null
            });
          }

          if (fresh.ccrSessionId) {
            await db.CANCcrSession.update(
              { state: 'DESTROYED', destroyedAt: now() },
              { where: { id: fresh.ccrSessionId } }
            );
          }
        })
        .catch(async (e) => {
          await this._appendEvent(jobId, 'TRAINING_FAILED', {
            trainingJobId,
            errorMessage: e.message
          });
        });
    }
    return this.getJob(jobId);
  }

  async getAttestation(jobId) {
    await this._ensureAttestation(jobId);
    return db.CANJcsAttestation.findOne({ where: { jobId } });
  }

  async _ensureAttestation(jobId) {
    const existing = await db.CANJcsAttestation.findOne({ where: { jobId } });
    if (existing) return existing;

    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');
    if (!job.ccrSessionId) throw new Error('Job missing ccrSessionId');

    // Simulated report bound to a real ephemeral RSA public key.
    // The private key stays in this process and is dropped after both keys are accepted.
    // reportFormat stays SIMULATED until a verified SEV-SNP guest report is stored.
    const generatedAt = now();
    const expiresAt = new Date(generatedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
    const { publicKeyPem, privateKeyPem } = generateEphemeralRsaKeyPair();
    const hpke = generateHpkeKeyPair();
    ephemeralPrivateKeys.set(job.ccrSessionId, {
      rsa: privateKeyPem,
      hpkePrivate: hpke.privateKey,
      hpkePublic: hpke.publicKey,
    });
    const tlsPublicKeyPem = publicKeyPem;
    const report = Buffer.from(JSON.stringify({
      format: 'SIMULATED',
      ccrSessionId: job.ccrSessionId,
      measurement: crypto.randomBytes(32).toString('hex'),
      reportData: crypto.createHash('sha256').update(tlsPublicKeyPem).digest('hex'),
      hpkePublicKey: hpke.publicKey
    }));

    const attestationBundle = {
      ccrSessionId: job.ccrSessionId,
      jobId: job.jobId,
      reportFormat: 'SIMULATED',
      attestationReport: report,
      tlsPublicKey: tlsPublicKeyPem,
      enclaveMeasurements: {
        mrtD: crypto.randomBytes(32).toString('hex'),
        rtmr: [crypto.randomBytes(32).toString('hex')]
      },
      keyDeliveryEndpoint: `/api/can/ccr/${job.ccrSessionId}/keys`,
      platformSignature: this._signBundle({
        jobId: job.jobId,
        ccrSessionId: job.ccrSessionId,
        tlsPublicKey: tlsPublicKeyPem,
        reportHash: crypto.createHash('sha256').update(report).digest('hex')
      }),
      generatedAt,
      expiresAt
    };

    await db.CANJcsAttestation.create(attestationBundle);
    await db.CANCcrSession.update(
      { state: 'ATTESTING', attestationRef: crypto.createHash('sha256').update(report).digest('hex') },
      { where: { id: job.ccrSessionId } }
    );

    await this._appendEvent(jobId, 'ATTESTATION_READY', {
      ccrSessionId: job.ccrSessionId,
      keyDeliveryEndpoint: attestationBundle.keyDeliveryEndpoint,
      expiresAt: expiresAt.toISOString()
    });

    return attestationBundle;
  }

  _signBundle(payload) {
    // MVP signature: HMAC over JSON using a local secret.
    // Later phases: ECDSA-P256 signing key in KMS and publish public key in DID doc.
    const secret = process.env.CAN_PLATFORM_SIGNING_SECRET || 'dev-can-signing-secret';
    const body = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  async _appendEvent(jobId, eventType, payload) {
    const last = await db.CANJcsEvent.findOne({
      where: { jobId },
      order: [['seq', 'DESC']]
    });
    const nextSeq = last ? last.seq + 1 : 1;

    await db.CANJcsEvent.create({
      jobId,
      seq: nextSeq,
      eventType,
      payload
    });

    // Append to tamper-evident provenance stream (DB-backed)
    await this.provenance.appendJobEvent({
      jobId,
      seq: nextSeq,
      eventType,
      payload
    });

    // Best-effort webhook notifications (MVP)
    const webhookEventTypes = new Set([
      'JOB_CREATED',
      'ATTESTATION_READY',
      'KEY_RELEASED',
      'ESCROW_BOTH_READY',
      'JOB_RELEASED',
      'ESCROW_EXPIRED'
    ]);
    if (webhookEventTypes.has(eventType)) {
      await this.webhooks.dispatch({
        jobId,
        seq: nextSeq,
        eventType,
        payload
      });
    }
  }

  async _expireIfNeeded(jobInstance) {
    if (!jobInstance) return;
    if (jobInstance.resolvedAt) return;

    const terminalStates = [ESCROW_STATES.RELEASED, ESCROW_STATES.EXPIRED, ESCROW_STATES.CANCELLED];
    if (terminalStates.includes(jobInstance.escrowState)) return;

    if (now() <= jobInstance.escrowDeadline) return;

    await jobInstance.update({ escrowState: ESCROW_STATES.EXPIRED, resolvedAt: now() });

    if (jobInstance.ccrSessionId) {
      await db.CANCcrSession.update(
        { state: 'DESTROYED', destroyedAt: now() },
        { where: { id: jobInstance.ccrSessionId } }
      );
    }

    if (jobInstance.ccrSessionId) ephemeralPrivateKeys.delete(jobInstance.ccrSessionId);

    await this._appendEvent(jobInstance.jobId, 'ESCROW_EXPIRED', {
      escrowDeadline: jobInstance.escrowDeadline.toISOString()
    });
  }

  async _acceptWrappedKey(job, { attestedPublicKey, wrappedKey }) {
    if (!wrappedKey) {
      const err = new Error('wrappedKey is required. Encrypt the key to the attested public key.');
      err.statusCode = 400;
      err.code = 'WRAP_REQUIRED';
      throw err;
    }
    const attestation = await db.CANJcsAttestation.findOne({ where: { jobId: job.jobId } });
    if (!attestation || !attestation.tlsPublicKey) {
      const err = new Error('Clean-room attestation is not available. Key release was refused.');
      err.statusCode = 409;
      err.code = 'ATTESTATION_REQUIRED';
      throw err;
    }
    const expectedSig = this._signBundle(this._attestationSignPayload(attestation));
    if (expectedSig !== attestation.platformSignature) {
      const err = new Error('Attestation signature does not match the clean-room public key.');
      err.statusCode = 400;
      err.code = 'ATTESTATION_SIGNATURE';
      throw err;
    }
    if (normalizePem(attestedPublicKey) !== normalizePem(attestation.tlsPublicKey)) {
      const err = new Error('attestedPublicKey does not match the clean-room attestation.');
      err.statusCode = 400;
      err.code = 'ATTESTATION_MISMATCH';
      throw err;
    }
    const material = ephemeralPrivateKeys.get(job.ccrSessionId);
    const privateKeyPem = typeof material === 'string' ? material : material && material.rsa;
    if (!privateKeyPem) {
      const err = new Error('Clean-room ephemeral key is not available. Release was refused.');
      err.statusCode = 409;
      err.code = 'CCR_KEY_UNAVAILABLE';
      throw err;
    }
    const plaintext = String(wrappedKey).startsWith('hpke1.')
      ? openHpke({ recipientPrivateKey: material.hpkePrivate, encapsulated: wrappedKey })
      : openWrappedKey(privateKeyPem, wrappedKey);
    plaintext.fill(0);
  }

  _attestationSignPayload(attestation) {
    const report = Buffer.isBuffer(attestation.attestationReport)
      ? attestation.attestationReport
      : Buffer.from(attestation.attestationReport);
    return {
      jobId: attestation.jobId,
      ccrSessionId: attestation.ccrSessionId,
      tlsPublicKey: attestation.tlsPublicKey,
      reportHash: crypto.createHash('sha256').update(report).digest('hex'),
    };
  }
}

module.exports = {
  CANJcsService,
  ESCROW_STATES
};

