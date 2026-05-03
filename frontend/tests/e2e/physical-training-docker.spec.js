const { test, expect } = require('@playwright/test');
const { getBackendURL } = require('../../load-config');

const physicalEnabled = process.env.E2E_PHYSICAL_TRAINING === 'true';

/**
 * Opt-in E2E: runs real `docker` training via CANLocalCcrpExecutor when backend has
 * CAN_LOCAL_TRAINING_MODE=docker, Docker available, and image built (see backend/local-training).
 *
 * Run (from frontend/):
 *   E2E_PHYSICAL_TRAINING=true npm run test:e2e:physical
 */
test.describe('CAN JCS — physical Docker training (opt-in)', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  test('release runs container and TrainingJob reports executionMode local-docker', async ({
    request
  }) => {
    test.skip(!physicalEnabled, 'Set E2E_PHYSICAL_TRAINING=true to run physical Docker training');

    const backendURL = getBackendURL();
    const principalHeader = { 'X-CAN-Principal-Id': 'did:can:dp:e2e' };
    const contractId = '00000000-0000-0000-0000-000000000000';

    async function assertOk(res, label) {
      if (res.ok()) return;
      const status = res.status();
      const body = await res.text();
      throw new Error(`${label} failed: HTTP ${status} body=${body}`);
    }

    const envRes = await request.get(`${backendURL}/api/debug/env`);
    await assertOk(envRes, 'debug env');
    const envBody = await envRes.json();
    expect(
      envBody.training,
      'Restart backend so /api/debug/env includes training.* (see backend/routes/debug.js)'
    ).toBeTruthy();
    const mode = envBody.training.canLocalTrainingMode;
    expect(mode, 'Set CAN_LOCAL_TRAINING_MODE=docker on the backend for physical training').toBe('docker');

    const { jobId } = await test.step('Create CAN job', async () => {
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

    await test.step('Signal DEK + MEK released', async () => {
      const dekRes = await request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/key-released`, {
        headers: { ...principalHeader, 'Content-Type': 'application/json' },
        data: { keyType: 'DEK' }
      });
      await assertOk(dekRes, 'release DEK');
      const mekRes = await request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/key-released`, {
        headers: { 'X-CAN-Principal-Id': 'did:can:mo:e2e', 'Content-Type': 'application/json' },
        data: { keyType: 'MEK' }
      });
      await assertOk(mekRes, 'release MEK');
    });

    await test.step('Release job to scheduler', async () => {
      const releaseRes = await request.post(`${backendURL}/api/can/jcs/jobs/${jobId}/release`, {
        headers: { 'X-CAN-Principal-Id': 'did:can:ccrp:e2e', 'Content-Type': 'application/json' }
      });
      await assertOk(releaseRes, 'release job');
    });

    await test.step('Wait for Docker training and assert physical runner metadata', async () => {
      const deadline = Date.now() + 540_000;
      let lastBody = null;
      while (Date.now() < deadline) {
        const res = await request.get(`${backendURL}/api/can/jcs/jobs/${jobId}/training`, {
          headers: principalHeader
        });
        if (res.ok()) {
          lastBody = await res.json();
          const status = lastBody.data?.status;
          if (status === 'COMPLETED') break;
          if (status === 'FAILED') {
            throw new Error(
              `Training failed: ${lastBody.data?.errorMessage || JSON.stringify(lastBody.data?.metadata)}`
            );
          }
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      expect(lastBody?.data?.status).toBe('COMPLETED');
      expect(lastBody.data.metadata?.executionMode).toBe('local-docker');
      const uri = lastBody.data.metadata?.results?.artifactUri || '';
      expect(uri, `Expected file:// artifact from container, got ${uri}`).toMatch(/^file:/);
    });
  });
});
