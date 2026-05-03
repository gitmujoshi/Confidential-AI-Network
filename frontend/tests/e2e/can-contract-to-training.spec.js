const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('CAN E2E: create contract → CAN job → local training', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';

  async function login(email) {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password: PASSWORD });
    if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
      throw new Error(`Login failed for ${email}`);
    }
    return { token: res.data.accessToken, user: res.data.user };
  }

  test('TDC creates contract (Local CCRP) then CAN runs locally', async ({ request }, testInfo) => {
    const USERS = {
      tdc: { email: 'tdc.healthcare.2025-09-05t20-39-55@test.com' },
      ccrp: { email: 'ccrp.e2e@test.com' },
    };

    const [{ token: tdcToken }, { user: ccrpUser }] = await Promise.all([
      login(USERS.tdc.email),
      login(USERS.ccrp.email),
    ]);

    // Pick a model id if available (best-effort).
    let aiModelIds = [];
    try {
      const modelsRes = await axios.get(`${BACKEND_URL}/api/contracts/ricardian/available-models`);
      const models = modelsRes.data?.models || modelsRes.data?.data?.models || modelsRes.data || [];
      const first = Array.isArray(models) ? models[0] : null;
      const id = first?.id ?? first?.modelId;
      if (id) aiModelIds = [id];
    } catch (_) {
      // ok
    }

    const contractPayload = {
      datasetSelections: [{ datasetId: 'e2e-dataset-1', individualPrice: 100 }],
      aiModelIds,
      duration: 30,
      termsAndConditions: `CAN E2E contract ${Date.now()}`,
      contractType: 'AI_TRAINING',
      privacyRequirements: { maxPrivacyLoss: 0.25, minAccuracy: 0.85, differentialPrivacy: true },
      trainingParams: {
        privacyTechnique: 'Differential Privacy',
        framework: 'PyTorch',
        architecture: 'bert-base',
        maxEpochs: 3,
        batchSize: 8,
        learningRate: 0.001,
        validationMetrics: ['accuracy', 'loss'],
      },
      environmentSpecs: {
        compute: { cpuCores: 2, memoryGB: 4, gpuCount: 0 },
        security: {
          confidentialComputing: false,
          attestationRequired: true,
          encryptionAtRest: true,
          encryptionInTransit: true,
          networkIsolation: true,
        },
      },
      kmsConfigs: {
        provider: 'hashicorp-vault',
        keyId: 'e2e-local-key',
        vaultUrl: 'http://localhost:8200',
        metadata: { seededBy: 'playwright', purpose: 'can-e2e' },
      },
      containerImage: 'contractmanagement/local-trainer:latest',
      serviceAccount: 'local/e2e-runner',
      logDestination: 'local:file',
      ccrpId: ccrpUser.id,
      ccrpCloudProvider: 'Local',
    };

    const create = await axios.post(`${BACKEND_URL}/api/contracts/ricardian`, contractPayload, {
      headers: { Authorization: `Bearer ${tdcToken}` },
    });

    const contractId = create.data?.contract?.contractId;
    expect(contractId).toBeTruthy();
    await testInfo.attach('contract.id.txt', { contentType: 'text/plain', body: String(contractId) });

    const principalHeader = { 'X-CAN-Principal-Id': 'did:can:dp:e2e' };

    async function assertOk(res, label) {
      if (res.ok()) return;
      const status = res.status();
      const body = await res.text();
      throw new Error(`${label} failed: HTTP ${status} body=${body}`);
    }

    const { jobId } = await test.step('Create CAN job for the new contract', async () => {
      const createRes = await request.post(`${BACKEND_URL}/api/can/jcs/jobs`, {
        headers: { ...principalHeader, 'Content-Type': 'application/json' },
        data: { contractId, ccrProvider: 'local' },
      });
      await assertOk(createRes, 'create CAN job');
      const created = await createRes.json();
      const createdJobId = created.data.job.jobId;
      expect(createdJobId).toBeTruthy();
      return { jobId: createdJobId };
    });

    await test.step('Release DEK + MEK and start local training', async () => {
      const dekRes = await request.post(`${BACKEND_URL}/api/can/jcs/jobs/${jobId}/key-released`, {
        headers: { ...principalHeader, 'Content-Type': 'application/json' },
        data: { keyType: 'DEK' },
      });
      await assertOk(dekRes, 'release DEK');

      const mekRes = await request.post(`${BACKEND_URL}/api/can/jcs/jobs/${jobId}/key-released`, {
        headers: { 'X-CAN-Principal-Id': 'did:can:mo:e2e', 'Content-Type': 'application/json' },
        data: { keyType: 'MEK' },
      });
      await assertOk(mekRes, 'release MEK');

      const releaseRes = await request.post(`${BACKEND_URL}/api/can/jcs/jobs/${jobId}/release`, {
        headers: { 'X-CAN-Principal-Id': 'did:can:ccrp:e2e' },
      });
      await assertOk(releaseRes, 'release job');
    });

    await test.step('Wait for local CCRP training to complete', async () => {
      const deadline = Date.now() + 20_000;
      let last = null;
      while (Date.now() < deadline) {
        const res = await request.get(`${BACKEND_URL}/api/can/jcs/jobs/${jobId}/training`, {
          headers: principalHeader,
        });
        if (res.ok()) {
          last = await res.json();
          const status = last.data?.status;
          if (status === 'COMPLETED') return;
          if (status === 'FAILED') throw new Error(`Training failed: ${last.data?.errorMessage || 'unknown'}`);
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      throw new Error(`Training did not complete within timeout. Last=${JSON.stringify(last)}`);
    });

    await test.step('Verify CAN provenance hash-chain exists for job', async () => {
      const provRes = await request.get(`${BACKEND_URL}/api/can/provenance/jobs/${jobId}/events`, {
        headers: principalHeader,
      });
      await assertOk(provRes, 'get provenance');
      const prov = await provRes.json();
      expect(Array.isArray(prov.data)).toBe(true);
      expect(prov.data.length).toBeGreaterThan(0);
      for (let i = 1; i < prov.data.length; i += 1) {
        expect(prov.data[i].prevHash).toBe(prov.data[i - 1].hash);
      }
    });
  });
});

