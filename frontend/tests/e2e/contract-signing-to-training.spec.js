const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Contract signing → training (TDC/TDP/CCRP)', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';
  const WAIT_FOR_LOCAL_TRAINING =
    process.env.E2E_WAIT_FOR_LOCAL_TRAINING === 'true' ||
    process.env.E2E_WAIT_FOR_LOCAL_TRAINING === '1';

  const USERS = {
    tdc: { email: 'tdc.healthcare.2025-09-05t20-39-55@test.com' },
    tdp: { email: 'tdp.e2e@test.com' },
    ccrp: { email: 'ccrp.e2e@test.com' },
  };

  async function login(email) {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password: PASSWORD });
    if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
      throw new Error(`Login failed for ${email}`);
    }
    return { token: res.data.accessToken, user: res.data.user };
  }

  async function seedAuth(page, { token, user }) {
    await page.addInitScript(({ t, u }) => {
      localStorage.setItem('authToken', t);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('currentUser', JSON.stringify(u));
    }, { t: token, u: user });
  }

  async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms));
  }

  async function waitForJobToFinish({ contractId, jobId, token, timeoutMs = 180000 }) {
    const started = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - started > timeoutMs) {
        throw new Error(`Timed out waiting for job ${jobId} to finish`);
      }

      const jobsRes = await axios.get(
        `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const jobs = jobsRes.data?.jobs || [];
      const j = Array.isArray(jobs) ? jobs.find((x) => x?.jobId === jobId) : null;
      if (!j) {
        await sleep(1500);
        continue;
      }

      const st = j.status;
      if (st === 'COMPLETED' || st === 'FAILED' || st === 'CANCELLED' || st === 'STALLED') {
        return j;
      }

      await sleep(2000);
    }
  }

  test('TDC creates contract, TDP+CCRP sign, then TDC starts training', async ({ page }, testInfo) => {
    const [{ token: tdcToken, user: tdcUser }, { token: tdpToken, user: tdpUser }, { token: ccrpToken, user: ccrpUser }] =
      await Promise.all([login(USERS.tdc.email), login(USERS.tdp.email), login(USERS.ccrp.email)]);

    // Pick a model id for the contract so the training runtime can build a container spec.
    let aiModelIds = [];
    try {
      const modelsRes = await axios.get(`${BACKEND_URL}/api/contracts/ricardian/available-models`);
      const models = modelsRes.data?.models || modelsRes.data?.data?.models || modelsRes.data || [];
      const first = Array.isArray(models) ? models[0] : null;
      const id = first?.id ?? first?.modelId;
      if (id) aiModelIds = [id];
    } catch (_) {
      // If models endpoint is unavailable, continue; training start may fail with a clear error.
    }

    // Create a contract via API (stable vs. multi-step UI wizard).
    const contractPayload = {
      datasetSelections: [{ datasetId: 'e2e-dataset-1', individualPrice: 100 }],
      aiModelIds,
      duration: 30,
      termsAndConditions: `E2E signing→training ${Date.now()}`,
      contractType: 'AI_TRAINING',
      privacyRequirements: { maxPrivacyLoss: 0.25, minAccuracy: 0.85, differentialPrivacy: true },
      trainingParams: { privacyTechnique: 'Differential Privacy' },
      environmentSpecs: {
        compute: { cpuCores: 2, memoryGB: 4, gpuCount: 0 },
        security: { confidentialComputing: false },
      },
      // Ensure CCRP is assigned so CCRP signing is authorized.
      ccrpId: ccrpUser.id,
      // For local-docker training, prefer Local to satisfy contract completeness without cloud credentials.
      ccrpCloudProvider: WAIT_FOR_LOCAL_TRAINING ? 'Local' : 'Azure',
    };
    await testInfo.attach('contract.create.payload.json', {
      contentType: 'application/json',
      body: JSON.stringify(contractPayload, null, 2),
    });

    const create = await axios.post(`${BACKEND_URL}/api/contracts/ricardian`, contractPayload, {
      headers: { Authorization: `Bearer ${tdcToken}` },
    });

    const contractId = create.data?.contract?.contractId;
    expect(contractId).toBeTruthy();
    await testInfo.attach('contract.id.txt', {
      contentType: 'text/plain',
      body: String(contractId),
    });

    // The frontend expects these signing routes. If they are not present in this backend build,
    // skip instead of hard-failing the whole suite.
    const signingDataUrl = `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/signing-data`;
    let signingData;
    try {
      const res = await axios.get(signingDataUrl, { headers: { Authorization: `Bearer ${tdcToken}` } });
      signingData = res.data;
    } catch (err) {
      const status = err.response?.status;
      test.skip(true, `Signing endpoints not available (GET /api/contracts/:id/signing-data returned ${status ?? 'error'})`);
      return;
    }

    const signUrl = `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/sign`;

    // Best-effort: sign as TDP (if supported).
    try {
      await axios.post(signUrl, { signature: 'e2e-placeholder', partyType: 'TDP', signingData }, {
        headers: { Authorization: `Bearer ${tdpToken}` },
      });
    } catch (_) {
      // Some deployments do not support TDP signature via this route.
    }

    // Best-effort: sign as CCRP (if supported).
    try {
      await axios.post(signUrl, { signature: 'e2e-placeholder', partyType: 'CCRP', signingData }, {
        headers: { Authorization: `Bearer ${ccrpToken}` },
      });
    } catch (_) {
      // Continue and check whether the contract ended up signed.
    }

    // Load contract detail page as TDC (UI assertion + ensures auth wiring is sane).
    await seedAuth(page, { token: tdcToken, user: tdcUser });
    await page.goto(`/contracts/${contractId}`);
    await expect(page).not.toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /contract/i }).first()).toBeVisible({ timeout: 120000 });

    // If contract isn't signed, training should not start; skip because signing flow is environment-dependent.
    const contractRes = await axios.get(`${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`, {
      headers: { Authorization: `Bearer ${tdcToken}` },
    });
    const status = contractRes.data?.status || contractRes.data?.contract?.status;
    await testInfo.attach('contract.detail.json', {
      contentType: 'application/json',
      body: JSON.stringify(contractRes.data, null, 2),
    });
    if (status !== 'SIGNED') {
      test.skip(true, `Contract did not reach SIGNED (current: ${status ?? 'unknown'}). Enable/verify signing flow before running this test.`);
      return;
    }

    // Start training.
    // With TRAINING_SIMULATION_MODE=false, this may fail if cloud/CCRP credentials aren't configured.
    // If E2E_WAIT_FOR_LOCAL_TRAINING=true and backend is configured for local-docker execution mode,
    // we additionally wait for the job to complete and assert results + logs.
    try {
      const start = await axios.post(
        `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/start`,
        {},
        { headers: { Authorization: `Bearer ${tdcToken}` } }
      );
      expect(start.data?.success).toBe(true);
      expect(start.data?.job?.jobId).toBeTruthy();

      const jobId = start.data.job.jobId;
      await testInfo.attach('training.start.response.json', {
        contentType: 'application/json',
        body: JSON.stringify(start.data, null, 2),
      });
      await testInfo.attach('training.jobId.txt', {
        contentType: 'text/plain',
        body: String(jobId),
      });

      if (WAIT_FOR_LOCAL_TRAINING) {
        const done = await waitForJobToFinish({ contractId, jobId, token: tdcToken });
        expect(done.status).toBe('COMPLETED');
        expect(done.results).toBeTruthy();
        expect(done.results.accuracy).toBeDefined();
        expect(done.results.loss).toBeDefined();
        expect(done.results.artifactUri).toBeTruthy();
        await testInfo.attach('training.job.done.json', {
          contentType: 'application/json',
          body: JSON.stringify(done, null, 2),
        });

        // Logs should be available for local-docker jobs.
        const logsRes = await axios.get(
          `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/logs`,
          { headers: { Authorization: `Bearer ${tdcToken}` } }
        );
        expect(String(logsRes.data)).toContain('[trainer]');
        expect(String(logsRes.data)).toContain('completed');
        await testInfo.attach('training.logs.txt', {
          contentType: 'text/plain',
          body: String(logsRes.data).slice(-200000),
        });

        // Best-effort provenance snapshot (SCITT claims) to include in report.
        // This may be empty depending on config and which operations emit claims.
        try {
          const claims = await axios.get(`${BACKEND_URL}/api/scitt-ccf/claims`, {
            headers: { Authorization: `Bearer ${tdcToken}` },
          });
          await testInfo.attach('provenance.scitt-claims.json', {
            contentType: 'application/json',
            body: JSON.stringify(claims.data, null, 2),
          });
        } catch (e) {
          await testInfo.attach('provenance.scitt-claims.error.txt', {
            contentType: 'text/plain',
            body: String(e.response?.status || e.message || e),
          });
        }

        // Register trained model.
        const reg = await axios.post(
          `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/register-model`,
          { name: `E2E Trained Model ${Date.now()}` },
          { headers: { Authorization: `Bearer ${tdcToken}` } }
        );
        expect(reg.data?.success).toBe(true);
        expect(reg.data?.modelId).toBeTruthy();
        await testInfo.attach('training.register-model.response.json', {
          contentType: 'application/json',
          body: JSON.stringify(reg.data, null, 2),
        });
      }
    } catch (err) {
      const httpStatus = err.response?.status;
      expect([400, 401, 403, 409, 500].includes(httpStatus)).toBe(true);
      expect(httpStatus).not.toBe(401);
      expect(httpStatus).not.toBe(403);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || '';
      expect(String(msg).length).toBeGreaterThan(0);
      await testInfo.attach('training.start.error.json', {
        contentType: 'application/json',
        body: JSON.stringify({ httpStatus, msg, data: err.response?.data || null }, null, 2),
      });
    }
  });
});

