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
        if (this.jobId && jobs.has(this.jobId)) jobs.set(this.jobId, clonePlain(this));
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
        const id = data.id || '00000000-0000-0000-0000-000000000001';
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
        const jobId = data.jobId || '00000000-0000-0000-0000-000000000010';
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
  const db = require('../../models');

  test('creates job, emits events, writes provenance hash chain', async () => {
    const svc = new CANJcsService({ escrowTimeoutMs: 10_000 });
    const result = await svc.createJob({ contractId: '00000000-0000-0000-0000-000000000000' });

    expect(result.job).toBeTruthy();
    expect(result.ccrSession).toBeTruthy();
    expect(result.attestation).toBeTruthy();

    // Release keys and start
    const jobId = result.job.jobId;
    const afterDek = await svc.markKeyReleased(jobId, { keyType: 'DEK', principalId: 'did:can:dp:test' });
    expect(afterDek.job.escrowState).toBe('DEK_RECEIVED');

    const afterMek = await svc.markKeyReleased(jobId, { keyType: 'MEK', principalId: 'did:can:mo:test' });
    expect(afterMek.job.escrowState).toBe('BOTH_READY');

    const released = await svc.releaseToScheduler(jobId);
    expect(released.job.escrowState).toBe('RELEASED');
    expect(released.ccrSession.state).toBe('RUNNING');

    // Provenance chain exists and links
    const prov = db.CANProvenanceEvent.__getAll().filter(e => e.jobId === jobId);
    expect(prov.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < prov.length; i += 1) {
      expect(prov[i].prevHash).toBe(prov[i - 1].hash);
    }
  });
});

