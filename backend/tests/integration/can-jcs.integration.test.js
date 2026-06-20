/**
 * CAN JCS integration test (real routes + real DB, no mocks).
 */

const app = require('../test-server');
const db = require('../../models');

describe('CAN JCS (integration)', () => {
  let skip = false;

  beforeAll(async () => {
    // If the integration DB isn't migrated for CAN yet, skip (keeps CI/dev runnable).
    await db.sequelize.authenticate();

    const [rows] = await db.sequelize.query(
      "SELECT to_regclass('public.can_jcs_jobs') as can_jcs_jobs, to_regclass('public.can_ccr_sessions') as can_ccr_sessions;"
    );

    const tables = rows?.[0] || {};
    if (!tables.can_jcs_jobs || !tables.can_ccr_sessions) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Skipping CAN JCS integration test: CAN tables not present in DB (run migrations).');
      skip = true;
    }
  });

  afterAll(async () => {
    // cleanup of created rows is handled in-test using jobId
  });

  test('job lifecycle writes DB events + provenance hash chain', async () => {
    if (skip) return;

    const principal = 'did:can:dp:integration';
    const contractId = `INTEGRATION-CONTRACT-${Date.now()}`;

    // The helper doesn’t set custom headers, so we perform raw supertest here.
    const request = require('supertest');
    const created = await request(app)
      .post('/api/can/jcs/jobs')
      .set('X-CAN-Principal-Id', principal)
      .set('Content-Type', 'application/json')
      .send({ contractId });

    if (created.status !== 201) {
      throw new Error(`Expected 201, got ${created.status}: ${JSON.stringify(created.body)}`);
    }
    expect(created.body?.success).toBe(true);
    const jobId = created.body.data.job.jobId;
    const ccrSessionId = created.body.data.ccrSession.id;
    expect(jobId).toBeTruthy();

    const att = await request(app)
      .get(`/api/can/jcs/jobs/${jobId}/attestation`)
      .set('X-CAN-Principal-Id', principal);
    expect(att.status).toBe(200);
    expect(att.body.data.platformSignature).toBeTruthy();

    const dek = await request(app)
      .post(`/api/can/jcs/jobs/${jobId}/key-released`)
      .set('X-CAN-Principal-Id', principal)
      .set('Content-Type', 'application/json')
      .send({ keyType: 'DEK' });
    expect(dek.status).toBe(200);

    const mek = await request(app)
      .post(`/api/can/jcs/jobs/${jobId}/key-released`)
      .set('X-CAN-Principal-Id', 'did:can:mo:integration')
      .set('Content-Type', 'application/json')
      .send({ keyType: 'MEK' });
    expect(mek.status).toBe(200);

    const rel = await request(app)
      .post(`/api/can/jcs/jobs/${jobId}/release`)
      .set('X-CAN-Principal-Id', 'did:can:tsp:integration');
    expect(rel.status).toBe(200);
    expect(rel.body.data.job.escrowState).toBe('RELEASED');

    // Wait for simulated local training to complete and assert TrainingJob exists
    const deadline = Date.now() + 15_000;
    let training = null;
    while (Date.now() < deadline) {
      // Refresh job to get trainingJobId
      const jobRow = await db.CANJcsJob.findByPk(jobId);
      if (jobRow?.trainingJobId) {
        training = await db.TrainingJob.findOne({ where: { jobId: jobRow.trainingJobId } });
        if (training?.status === 'COMPLETED') break;
        if (training?.status === 'FAILED') throw new Error(`Training failed: ${training.errorMessage || 'unknown'}`);
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    expect(training).toBeTruthy();
    expect(training.status).toBe('COMPLETED');

    // DB assertion: provenance chain exists for this job
    const prov = await db.CANProvenanceEvent.findAll({
      where: { jobId },
      order: [['seq', 'ASC']]
    });
    expect(prov.length).toBeGreaterThan(0);
    for (let i = 1; i < prov.length; i += 1) {
      expect(prov[i].prevHash).toBe(prov[i - 1].hash);
    }

    // Cleanup
    await db.CANProvenanceEvent.destroy({ where: { jobId } });
    await db.CANJcsEvent.destroy({ where: { jobId } });
    await db.CANJcsAttestation.destroy({ where: { jobId } });
    await db.CANJcsJob.destroy({ where: { jobId } });
    await db.CANCcrSession.destroy({ where: { id: ccrSessionId } });
    if (training?.jobId) {
      await db.TrainingJob.destroy({ where: { jobId: training.jobId } });
    }
  });
});

