const { test, expect } = require('@playwright/test');
const { getBackendURL } = require('../../load-config');

test.describe('CAN JCS API (MVP)', () => {
  test('create job -> attestation -> key release -> release -> provenance', async ({ request }) => {
    const backendURL = getBackendURL();
    const principalHeader = { 'X-CAN-Principal-Id': 'did:can:dp:e2e' };
    const contractId = '00000000-0000-0000-0000-000000000000';

    async function assertOk(res, label) {
      if (res.ok()) return;
      const status = res.status();
      const body = await res.text();
      throw new Error(`${label} failed: HTTP ${status} body=${body}`);
    }

    const { jobId } = await test.step('Create CAN job (escrow OPEN + CCR session + attestation)', async () => {
      const createRes = await request.post(`${backendURL}/api/can/jcs/jobs`, {
        headers: { ...principalHeader, 'Content-Type': 'application/json' },
        data: { contractId }
      });
      await assertOk(createRes, 'create job');
      const created = await createRes.json();
      const createdJobId = created.data.job.jobId;
      expect(createdJobId).toBeTruthy();
      return { jobId: createdJobId };
    });

    await test.step('Fetch attestation bundle (signed)', async () => {
      const attRes = await request.get(`${backendURL}/api/can/jcs/jobs/${jobId}/attestation`, {
        headers: principalHeader
      });
      await assertOk(attRes, 'get attestation');
      const att = await attRes.json();
      expect(att.data.keyDeliveryEndpoint).toContain('/api/can/ccr/');
      expect(att.data.platformSignature).toBeTruthy();
    });

    await test.step('Signal DEK released (Data Provider)', async () => {
      const dekRes = await request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/key-released`, {
        headers: { ...principalHeader, 'Content-Type': 'application/json' },
        data: { keyType: 'DEK' }
      });
      await assertOk(dekRes, 'release DEK');
    });

    await test.step('Signal MEK released (Model Owner)', async () => {
      const mekRes = await request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/key-released`, {
        headers: { 'X-CAN-Principal-Id': 'did:can:mo:e2e', 'Content-Type': 'application/json' },
        data: { keyType: 'MEK' }
      });
      await assertOk(mekRes, 'release MEK');
    });

    await test.step('Release job to scheduler (CCRP ACK) → job RELEASED', async () => {
      const releaseRes = await request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/release`, {
        headers: { 'X-CAN-Principal-Id': 'did:can:ccrp:e2e' }
      });
      await assertOk(releaseRes, 'release job');
      const released = await releaseRes.json();
      expect(released.data.job.escrowState).toBe('RELEASED');
    });

    await test.step('Wait for local CCRP training to complete', async () => {
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        const res = await request.get(`${backendURL}/api/can/jcs/jobs/${jobId}/training`, {
          headers: principalHeader
        });
        if (res.ok()) {
          const tj = await res.json();
          const status = tj.data?.status;
          if (status === 'COMPLETED') return;
          if (status === 'FAILED') throw new Error(`Training failed: ${tj.data?.errorMessage || 'unknown'}`);
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      throw new Error('Training did not complete within timeout');
    });

    await test.step('Fetch job provenance stream and verify hash-chain integrity', async () => {
      const provRes = await request.get(`${backendURL}/api/can/provenance/jobs/${jobId}/events`, {
        headers: principalHeader
      });
      await assertOk(provRes, 'get provenance');
      const prov = await provRes.json();
      expect(Array.isArray(prov.data)).toBe(true);
      expect(prov.data.length).toBeGreaterThan(0);

      // hash-chain sanity: each prevHash matches previous hash
      for (let i = 1; i < prov.data.length; i += 1) {
        expect(prov.data[i].prevHash).toBe(prov.data[i - 1].hash);
      }
    });
  });
});

