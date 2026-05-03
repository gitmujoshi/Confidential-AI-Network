const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const { CANProvenanceService } = require('./canProvenanceService');
const { CANWebhookDispatcher } = require('./canWebhookDispatcher');
const { CANLocalCcrpExecutor } = require('./canLocalCcrpExecutor');

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
    this.provenance = new CANProvenanceService();
    this.webhooks = new CANWebhookDispatcher();
    this.localExecutor = new CANLocalCcrpExecutor();
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

  async markKeyReleased(jobId, { keyType, principalId }) {
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');

    await this._expireIfNeeded(job);
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

    await this._appendEvent(jobId, 'KEY_RELEASED', {
      keyType,
      principalId,
      escrowState: nextState
    });

    if (nextState === ESCROW_STATES.BOTH_READY) {
      await this._appendEvent(jobId, 'ESCROW_BOTH_READY', {
        escrowDeadline: freshJob.escrowDeadline.toISOString()
      });
    }

    return this.getJob(jobId);
  }

  async releaseToScheduler(jobId) {
    const job = await db.CANJcsJob.findByPk(jobId);
    if (!job) throw new Error('Job not found');

    await this._expireIfNeeded(job);
    const fresh = await db.CANJcsJob.findByPk(jobId);

    if (fresh.escrowState !== ESCROW_STATES.BOTH_READY) {
      throw new Error(`Job not ready (state=${fresh.escrowState})`);
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

    // Simulated attestation: produce a deterministic-ish blob, plus a public key placeholder.
    // Later phases replace this with real attestation + ephemeral TLS key generated in TEE.
    const generatedAt = now();
    const expiresAt = new Date(generatedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

    const tlsPublicKeyPem = `-----BEGIN PUBLIC KEY-----\n${crypto.randomBytes(48).toString('base64')}\n-----END PUBLIC KEY-----`;
    const report = Buffer.from(JSON.stringify({
      format: 'SIMULATED',
      ccrSessionId: job.ccrSessionId,
      measurement: crypto.randomBytes(32).toString('hex'),
      reportData: crypto.createHash('sha256').update(tlsPublicKeyPem).digest('hex')
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

    await this._appendEvent(jobInstance.jobId, 'ESCROW_EXPIRED', {
      escrowDeadline: jobInstance.escrowDeadline.toISOString()
    });
  }
}

module.exports = {
  CANJcsService,
  ESCROW_STATES
};

