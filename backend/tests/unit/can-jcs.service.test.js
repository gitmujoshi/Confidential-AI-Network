/**
 * Unit tests for CAN JCS service (DB mocked).
 */

jest.mock('../../models', () => {
  const jobs = new Map();
  const ccrSessions = new Map();
  const events = [];
  const attestations = [];
  const provEvents = [];

  function clonePlain(x) {
    if (!x) return x;
    const out = {};
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === 'function') continue;
      out[k] = v;
    }
    return out; // preserve Dates for service logic
  }

  function mkInstance(obj) {
    return {
      ...obj,
      async update(patch) {
        Object.assign(this, patch);
        // persist into store where applicable
        if (this.jobId && this.escrowState && jobs.has(this.jobId)) jobs.set(this.jobId, clonePlain(this));
        if (this.id && ccrSessions.has(this.id)) ccrSessions.set(this.id, clonePlain(this));
        return this;
      },
      toJSON() {
        return clonePlain(this);
      }
    };
  }

  return {
    CANCcrSession: {
      async create(data) {
        const id = data.id || `ccr-${ccrSessions.size + 1}`;
        const rec = mkInstance({
          id,
          contractId: data.contractId,
          state: data.state || 'REQUESTED',
          dekReceived: false,
          mekReceived: false
        });
        ccrSessions.set(id, clonePlain(rec));
        return rec;
      },
      async findByPk(id) {
        const rec = ccrSessions.get(id);
        return rec ? mkInstance(clonePlain(rec)) : null;
      },
      async update(patch, { where }) {
        const rec = ccrSessions.get(where.id);
        if (!rec) return [0];
        Object.assign(rec, patch);
        ccrSessions.set(where.id, rec);
        return [1];
      }
    },
    CANJcsJob: {
      async create(data) {
        const jobId = data.jobId || `job-${jobs.size + 1}`;
        const rec = mkInstance({
          jobId,
          contractId: data.contractId,
          ccrSessionId: data.ccrSessionId,
          escrowState: data.escrowState,
          escrowDeadline: data.escrowDeadline,
          createdAt: data.createdAt,
          dekReceivedAt: null,
          mekReceivedAt: null,
          resolvedAt: null
        });
        jobs.set(jobId, clonePlain(rec));
        return rec;
      },
      async findByPk(jobId) {
        const rec = jobs.get(jobId);
        return rec ? mkInstance(clonePlain(rec)) : null;
      }
    },
    CANJcsEvent: {
      async findOne({ where, order }) {
        const jobId = where.jobId;
        const jobEvents = events.filter(e => e.jobId === jobId);
        if (jobEvents.length === 0) return null;
        // only used for DESC seq
        const max = jobEvents.reduce((a, b) => (a.seq > b.seq ? a : b));
        return mkInstance(clonePlain(max));
      },
      async create(data) {
        const rec = mkInstance({
          jobId: data.jobId,
          seq: data.seq,
          eventType: data.eventType,
          payload: data.payload
        });
        events.push(clonePlain(rec));
        return rec;
      },
      async findAll({ where, order, limit }) {
        const jobId = where.jobId;
        const gt = where.seq?.['$gt'];
        const filtered = events
          .filter(e => e.jobId === jobId)
          .filter(e => (gt ? e.seq > gt : true))
          .sort((a, b) => a.seq - b.seq)
          .slice(0, limit || 100);
        return filtered.map(e => mkInstance(clonePlain(e)));
      }
    },
    CANJcsAttestation: {
      async findOne({ where }) {
        const rec = attestations.find(a => a.jobId === where.jobId);
        return rec ? mkInstance(clonePlain(rec)) : null;
      },
      async create(data) {
        const rec = mkInstance({
          ...data,
          attestationReport: data.attestationReport
        });
        attestations.push(clonePlain(rec));
        return rec;
      }
    },
    CANProvenanceEvent: {
      async findOne({ where, order }) {
        const jobId = where.jobId;
        const jobProv = provEvents.filter(e => e.jobId === jobId);
        if (jobProv.length === 0) return null;
        const max = jobProv.reduce((a, b) => (a.seq > b.seq ? a : b));
        return mkInstance(clonePlain(max));
      },
      async create(data) {
        const rec = mkInstance({ ...data });
        provEvents.push(clonePlain(rec));
        return rec;
      },
      __getAll() {
        return provEvents.map(e => ({ ...e }));
      }
    }
    ,
    TrainingJob: {
      async findOne() {
        return null;
      },
      async create(data) {
        return mkInstance({ ...data, status: 'PENDING', metadata: data.metadata || {} });
      }
    }
  };
});

jest.mock('sequelize', () => {
  // minimal Op needed by service methods
  return { Op: { gt: '$gt', notIn: '$notIn', lt: '$lt' } };
});

describe('CANJcsService', () => {
  beforeEach(() => {
    process.env.CAN_WEBHOOK_URLS = '';
  });

  const { CANJcsService } = require('../../services/canJcsService');
  const { wrapKeyToPublicPem } = require('../../services/canKeyDelivery');
  const { MockOwnerKbs } = require('../../sdk/owner-kbs');
  const crypto = require('crypto');
  const db = require('../../models');

  function wrappedRelease(attestation, keyType, principalId) {
    const secret = crypto.randomBytes(32);
    const wrappedKey = wrapKeyToPublicPem(attestation.tlsPublicKey, secret);
    secret.fill(0);
    return {
      keyType,
      principalId,
      attestedPublicKey: attestation.tlsPublicKey,
      wrappedKey,
    };
  }

  test('creates job, emits events, writes provenance hash chain', async () => {
    const svc = new CANJcsService({ escrowTimeoutMs: 10_000 });
    const result = await svc.createJob({ contractId: '00000000-0000-0000-0000-000000000000' });

    expect(result.job).toBeTruthy();
    expect(result.ccrSession).toBeTruthy();
    expect(result.attestation).toBeTruthy();

    const jobId = result.job.jobId;
    expect(result.attestation.reportFormat).toBe('SIMULATED');
    expect(result.attestation.tlsPublicKey).toContain('BEGIN PUBLIC KEY');

    await expect(
      svc.markKeyReleased(jobId, { keyType: 'DEK', principalId: 'did:can:dp:test' })
    ).rejects.toThrow(/wrappedKey/);

    const afterDek = await svc.markKeyReleased(
      jobId,
      wrappedRelease(result.attestation, 'DEK', 'did:can:dp:test')
    );
    expect(afterDek.job.escrowState).toBe('DEK_RECEIVED');
    expect(afterDek.job.dekReceivedAt).toBeTruthy();

    const afterMek = await svc.markKeyReleased(
      jobId,
      wrappedRelease(result.attestation, 'MEK', 'did:can:mo:test')
    );
    expect(afterMek.job.escrowState).toBe('BOTH_READY');

    await expect(svc.recordSealedOutput(jobId, {
      sealedOutput: '',
      outputSha256: 'a'.repeat(64),
    })).rejects.toThrow(/sha256|Sealed output/);
    const sealed = await svc.recordSealedOutput(jobId, {
      sealedOutput: 'Y2lwaGVydGV4dA==',
      outputSha256: 'ab'.repeat(32),
    });
    expect(sealed.keyStored).toBe(false);
    expect(sealed.outputSha256).toHaveLength(64);

    const released = await svc.releaseToScheduler(jobId);
    expect(released.job.escrowState).toBe('RELEASED');
    expect(released.ccrSession.state).toBe('RUNNING');

    const prov = db.CANProvenanceEvent.__getAll().filter(e => e.jobId === jobId);
    expect(prov.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < prov.length; i += 1) {
      expect(prov[i].prevHash).toBe(prov[i - 1].hash);
    }
  });

  test('the orchestrator asks both owner brokers and reaches BOTH_READY', async () => {
    const svc = new CANJcsService({ escrowTimeoutMs: 10_000 });
    const created = await svc.createJob({ contractId: '00000000-0000-0000-0000-000000000010' });
    const data = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    const model = new MockOwnerKbs({ ownerId: 'did:can:tdc', keyType: 'MEK' });
    data.holdKey(crypto.randomBytes(32));
    model.holdKey(crypto.randomBytes(32));
    const outcome = await svc.orchestrateOwners(created.job.jobId, {
      contract: { status: 'SIGNED', hash: 'c-live' },
      owners: [
        { ownerId: 'did:can:tdp', keyType: 'DEK', client: data },
        { ownerId: 'did:can:tdc', keyType: 'MEK', client: model },
      ],
    });
    expect(outcome.keyStored).toBe(false);
    expect(outcome.releases.every((item) => item.wrappedKey == null)).toBe(true);
    const job = await svc.getJob(created.job.jobId);
    expect(job.job.escrowState).toBe('BOTH_READY');
    expect(outcome.releases.every((item) => item.receipt && item.receipt.signature)).toBe(true);
    svc.ownerLeaseUntil.set(created.job.jobId, Date.now() - 1000);
    await expect(svc.recordSealedOutput(created.job.jobId, {
      sealedOutput: 'Y2lwaGVydGV4dA==',
      outputSha256: 'ab'.repeat(32),
    })).rejects.toMatchObject({ code: 'LEASE_EXPIRED' });
  });

  test('seals owner keys to the guest public key and does not open them', async () => {
    const { generateHpkeKeyPair, open } = require('../../services/hpke');
    const svc = new CANJcsService({ escrowTimeoutMs: 10_000 });
    const created = await svc.createJob({ contractId: '00000000-0000-0000-0000-000000000011' });
    const guest = generateHpkeKeyPair();
    const dek = crypto.randomBytes(32);
    const mek = crypto.randomBytes(32);
    const data = new MockOwnerKbs({ ownerId: 'did:can:tdp', keyType: 'DEK' });
    const model = new MockOwnerKbs({ ownerId: 'did:can:tdc', keyType: 'MEK' });
    data.holdKey(dek);
    model.holdKey(mek);
    const outcome = await svc.releaseToGuest(created.job.jobId, {
      guestPublicKey: guest.publicKey,
      contract: { status: 'SIGNED', hash: 'c-guest' },
      owners: [
        { ownerId: 'did:can:tdp', keyType: 'DEK', client: data },
        { ownerId: 'did:can:tdc', keyType: 'MEK', client: model },
      ],
    });
    expect(outcome.keyStored).toBe(false);
    expect(outcome.guestHeld).toBe(true);
    expect(outcome.reportFormat).toBe('SIMULATED');
    const openedDek = open({
      recipientPrivateKey: guest.privateKey,
      encapsulated: outcome.releases.find((item) => item.keyType === 'DEK').wrappedKey,
    });
    const openedMek = open({
      recipientPrivateKey: guest.privateKey,
      encapsulated: outcome.releases.find((item) => item.keyType === 'MEK').wrappedKey,
    });
    expect(openedDek.equals(dek)).toBe(true);
    expect(openedMek.equals(mek)).toBe(true);
    const job = await svc.getJob(created.job.jobId);
    expect(job.job.escrowState).toBe('BOTH_READY');
    openedDek.fill(0);
    openedMek.fill(0);
  });
});

