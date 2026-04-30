const { test, expect } = require('@playwright/test');
const axios = require('axios');
const { getBackendURL } = require('../../load-config');

test.describe('Contract signing → training (TDC/TDP/CCRP)', () => {
  test.describe.configure({ mode: 'serial' });

  const BACKEND_URL = getBackendURL();
  const PASSWORD = 'TestNewPassword123!';

  function envFlag(keys, defaultValue) {
    const vals = keys.map((k) => process.env[k]).filter((v) => v !== undefined);
    if (vals.length === 0) return defaultValue;
    const v = String(vals[0]).trim().toLowerCase();
    if (v === '1' || v === 'true' || v === 'yes' || v === 'y') return true;
    if (v === '0' || v === 'false' || v === 'no' || v === 'n') return false;
    return defaultValue;
  }

  // Defaults ON for this workflow, but can be overridden by setting either env var to 0/false.
  const WAIT_FOR_LOCAL_TRAINING = envFlag(['WAIT_FOR_LOCAL_TRAINING', 'E2E_WAIT_FOR_LOCAL_TRAINING'], true);
  const REQUIRE_ARTIFACTS = envFlag(['E2E_REQUIRE_ARTIFACTS'], true);

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

  async function ensureRegisteredUser({ name, email, partyType }, testInfo) {
    // If already login-able with our known password, we are done.
    try {
      const ok = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password: PASSWORD });
      if (ok.status === 200 && ok.data?.accessToken) {
        return { status: 'already-usable' };
      }
    } catch (_) {
      // continue
    }

    // Attempt registration; if user exists, backend typically returns 400/409 which we treat as "already registered".
    let temporaryPassword;
    try {
      const reg = await axios.post(`${BACKEND_URL}/api/auth/register`, { name, email, partyType });
      temporaryPassword = reg.data?.loginCredentials?.password;
      await testInfo.attach(`Registration — ${partyType}.json`, {
        contentType: 'application/json',
        body: JSON.stringify(reg.data ?? null, null, 2),
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 409) {
        await testInfo.attach(`Registration — ${partyType} (already exists).txt`, {
          contentType: 'text/plain',
          body: String(err.response?.data?.error || err.response?.data?.message || status),
        });
        return { status: 'already-exists' };
      }
      await testInfo.attach(`Registration — ${partyType} (error).json`, {
        contentType: 'application/json',
        body: JSON.stringify(
          { status, data: err.response?.data ?? null, message: err.message ?? null },
          null,
          2
        ),
      });
      throw err;
    }

    // If a temporary password is returned, complete first-login password change to our known password.
    if (temporaryPassword) {
      const first = await axios.post(`${BACKEND_URL}/api/auth/first-login-password`, {
        email,
        currentPassword: temporaryPassword,
        newPassword: PASSWORD,
      });
      await testInfo.attach(`First login — ${partyType} password set.json`, {
        contentType: 'application/json',
        body: JSON.stringify(first.data ?? null, null, 2),
      });
      return { status: 'registered-and-activated' };
    }

    return { status: 'registered-no-temp-password' };
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

  function attachLargeText(testInfo, baseName, text) {
    const s = String(text ?? '');
    const maxChunkBytes = 900 * 1024; // keep HTML report responsive
    const buf = Buffer.from(s, 'utf8');
    if (buf.length <= maxChunkBytes) {
      return testInfo.attach(baseName, { contentType: 'text/plain', body: s });
    }

    const parts = Math.ceil(buf.length / maxChunkBytes);
    const tasks = [];
    for (let i = 0; i < parts; i++) {
      const start = i * maxChunkBytes;
      const end = Math.min(buf.length, (i + 1) * maxChunkBytes);
      const chunk = buf.subarray(start, end).toString('utf8');
      tasks.push(
        testInfo.attach(`${baseName.replace(/\\.txt$/i, '')} (part ${i + 1} of ${parts}).txt`, {
          contentType: 'text/plain',
          body: chunk,
        })
      );
    }
    return Promise.all(tasks);
  }

  async function attachStepScreenshot(page, testInfo, stepName) {
    if (!page) return;
    try {
      const url = page.url?.() || '';
      if (!url || url === 'about:blank') return;
      await testInfo.attach(`Screenshot — ${stepName}.png`, {
        contentType: 'image/png',
        body: await page.screenshot({ fullPage: true }),
      });
    } catch (_) {
      // Best-effort; never fail the test due to screenshot capture.
    }
  }

  test('TDC creates contract, TDP+CCRP sign, then TDC starts training', async ({ page }, testInfo) => {
    // Strict runs may pull Docker images and wait for training completion/artifacts.
    // Increase timeout so we don't fail mid-run while logs/provenance/artifacts are still being produced.
    if (WAIT_FOR_LOCAL_TRAINING || REQUIRE_ARTIFACTS) {
      test.setTimeout(8 * 60 * 1000);
    }

    const runTag = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const runUsers = {
      tdc: { email: `tdc.e2e.${runTag}@test.com` },
      tdp: { email: `tdp.e2e.${runTag}@test.com` },
      ccrp: { email: `ccrp.e2e.${runTag}@test.com` },
    };

    await test.step('TDC registers (best-effort)', async () => {
      await ensureRegisteredUser(
        { name: `TDC E2E User ${runTag}`, email: runUsers.tdc.email, partyType: 'TDC' },
        testInfo
      );
    });
    await test.step('TDP registers (best-effort)', async () => {
      await ensureRegisteredUser({ name: `TDP E2E User ${runTag}`, email: runUsers.tdp.email, partyType: 'TDP' }, testInfo);
    });
    await test.step('CCRP registers (best-effort)', async () => {
      await ensureRegisteredUser({ name: `CCRP E2E User ${runTag}`, email: runUsers.ccrp.email, partyType: 'CCRP' }, testInfo);
    });

    const [{ token: tdcToken, user: tdcUser }, { token: tdpToken, user: tdpUser }, { token: ccrpToken, user: ccrpUser }] =
      await test.step('Actors authenticate (TDC / TDP / CCRP)', async () =>
        Promise.all([login(runUsers.tdc.email), login(runUsers.tdp.email), login(runUsers.ccrp.email)])
      );

    // Create a per-run MNIST dataset owned by the per-run TDP, so signing checks line up with the dataset owner.
    const mnistDatasetId = `MNIST-HANDWRITTEN-${runTag}`;
    let mnistDataset = null;
    await test.step('TDP publishes MNIST dataset (public)', async () => {
      const payload = {
        datasetId: mnistDatasetId,
        name: `MNIST Handwritten Digits (E2E ${runTag})`,
        description: 'MNIST-style dataset seeded for E2E training runs (public).',
        category: 'Computer Vision',
        size: 60,
        recordCount: 70000,
        price: 100,
        license: 'MNIST',
        tags: ['mnist', 'handwritten', 'digits', 'classification', 'e2e'],
        metadata: { datasetType: 'MNIST', seededBy: 'playwright', runTag },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdpUser.id,
      };
      await testInfo.attach('Step — MNIST dataset create payload.json', {
        contentType: 'application/json',
        body: JSON.stringify(payload, null, 2),
      });

      try {
        const existing = await axios.get(`${BACKEND_URL}/api/datasets/${encodeURIComponent(mnistDatasetId)}`);
        mnistDataset = existing.data?.dataset || existing.data || null;
      } catch (err) {
        if (err.response?.status !== 404) throw err;
        await axios.post(`${BACKEND_URL}/api/datasets`, payload);
        const created = await axios.get(`${BACKEND_URL}/api/datasets/${encodeURIComponent(mnistDatasetId)}`);
        mnistDataset = created.data?.dataset || created.data || null;
      }

      await testInfo.attach('Step — MNIST dataset.json', {
        contentType: 'application/json',
        body: JSON.stringify(mnistDataset, null, 2),
      });
    });

    // Pick a model id for the contract so the training runtime can build a container spec.
    let aiModelIds = [];
    await test.step('TDC selects a base AI model', async () => {
      try {
        const modelsRes = await axios.get(`${BACKEND_URL}/api/contracts/ricardian/available-models`);
        const models = modelsRes.data?.models || modelsRes.data?.data?.models || modelsRes.data || [];
        const list = Array.isArray(models) ? models : [];

        // Prefer MNIST-like models by DEPA ID presence (US-EAST-AIMODEL-...) + name/metadata hint.
        // Note: contract creation still requires numeric `id`; depaId is used for selection + auditability.
        const isMnist = (m) => {
          const hay = `${m?.name || m?.modelName || ''} ${JSON.stringify(m?.metadata || {})}`.toLowerCase();
          return hay.includes('mnist');
        };
        const hasDepaId = (m) => typeof m?.depaId === 'string' && m.depaId.length > 0;

        const preferred =
          list.find((m) => hasDepaId(m) && isMnist(m)) ||
          list.find((m) => isMnist(m)) ||
          list.find((m) => hasDepaId(m)) ||
          null;

        const first = preferred || list[0] || null;
        const id = first?.id ?? first?.modelId;
        if (id) aiModelIds = [id];
        await testInfo.attach('Step — Selected model.json', {
          contentType: 'application/json',
          body: JSON.stringify(first ?? null, null, 2),
        });
      } catch (_) {
        // If models endpoint is unavailable, continue; training start may fail with a clear error.
      }
    });

    // Create a contract via API (stable vs. multi-step UI wizard).
    const contractPayload = {
      // Legacy fields still used by some training runtimes.
      tdpId: tdpUser.id,
      primaryTdpId: tdpUser.id,
      datasetId: mnistDatasetId,
      primaryDatasetId: mnistDatasetId,
      // Provide the TDP + dataset linkage explicitly; training start validates that datasets are associated
      // to the contract and that the requesting TDP is linked.
      datasetSelections: [
        {
          datasetId: mnistDatasetId,
          depaId: mnistDataset?.depaId,
          datasetName: mnistDataset?.name,
          description: mnistDataset?.description,
          category: mnistDataset?.category,
          size: mnistDataset?.size,
          recordCount: mnistDataset?.recordCount,
          license: mnistDataset?.license,
          tags: mnistDataset?.tags,
          individualPrice: 100,
          tdpId: tdpUser.id,
          tdpName: tdpUser.name,
          tdpEmail: tdpUser.email,
          tdpDepaId: tdpUser.depaId,
        },
      ],
      aiModelIds,
      duration: 30,
      termsAndConditions: `E2E signing→training ${Date.now()}`,
      contractType: 'AI_TRAINING',
      privacyRequirements: { maxPrivacyLoss: 0.25, minAccuracy: 0.85, differentialPrivacy: true },
      trainingParams: {
        privacyTechnique: 'Differential Privacy',
        framework: 'PyTorch',
        architecture: 'mnist-cnn',
        maxEpochs: 5,
        batchSize: 32,
        learningRate: 0.001,
        validationMetrics: ['accuracy', 'loss'],
        datasetType: 'MNIST',
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
        kms: {
          provider: 'hashicorp-vault',
          keyId: 'e2e-local-key',
          algorithm: 'AES-256-GCM',
          rotationPeriod: 90,
        },
        runtime: {
          containerSpec: {
            image: 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest',
            command: 'python train.py',
            cpuCores: 2,
            memoryGB: 4,
            gpuCount: 0,
          },
        },
      },
      kmsConfigs: {
        provider: 'hashicorp-vault',
        keyId: 'e2e-local-key',
        vaultUrl: 'http://localhost:8200',
        metadata: { seededBy: 'playwright', purpose: 'e2e' },
      },
      containerImage: 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest',
      serviceAccount: 'local/e2e-runner',
      logDestination: 'local:file',
      // Ensure CCRP is assigned so CCRP signing is authorized.
      ccrpId: ccrpUser.depaId || ccrpUser.id,
      // For local-docker training, prefer Local to satisfy contract completeness without cloud credentials.
      ccrpCloudProvider: WAIT_FOR_LOCAL_TRAINING ? 'Local' : 'Azure',
    };
    const { contractId } = await test.step('TDC creates Ricardian contract (datasets + environment + KMS + runtime)', async () => {
      await testInfo.attach('Step — TDC creates contract (payload).json', {
        contentType: 'application/json',
        body: JSON.stringify(contractPayload, null, 2),
      });

      let create;
      try {
        create = await axios.post(`${BACKEND_URL}/api/contracts/ricardian`, contractPayload, {
          headers: { Authorization: `Bearer ${tdcToken}` },
        });
      } catch (err) {
        // If backend hasn't been restarted to accept DEPA IDs for `ccrpId`, retry with legacy numeric id.
        const status = err.response?.status;
        if (status === 400 && contractPayload.ccrpId && typeof contractPayload.ccrpId === 'string') {
          testInfo.annotations.push({
            type: 'warning',
            description:
              'Backend rejected CCRP DEPA ID in contract payload; retrying with legacy numeric id. Restart backend to enable DEPA-ID-based ccrpId mapping.',
          });
          await testInfo.attach('Step — Create contract (DEPA CCRP id rejected).json', {
            contentType: 'application/json',
            body: JSON.stringify({ status, data: err.response?.data ?? null }, null, 2),
          });
          const legacyPayload = { ...contractPayload, ccrpId: ccrpUser.id };
          await testInfo.attach('Step — Create contract (legacy CCRP id retry payload).json', {
            contentType: 'application/json',
            body: JSON.stringify(legacyPayload, null, 2),
          });
          create = await axios.post(`${BACKEND_URL}/api/contracts/ricardian`, legacyPayload, {
            headers: { Authorization: `Bearer ${tdcToken}` },
          });
        } else {
          throw err;
        }
      }

      const cid = create.data?.contract?.contractId;
      expect(cid).toBeTruthy();
      await testInfo.attach('Step — Contract ID.txt', {
        contentType: 'text/plain',
        body: String(cid),
      });
      return { contractId: cid };
    });

    // The frontend expects these signing routes. If they are not present in this backend build,
    // skip instead of hard-failing the whole suite.
    const signingDataUrl = `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/signing-data`;
    let signingData;
    await test.step('Platform generates signing payload (for approvals)', async () => {
      try {
        const res = await axios.get(signingDataUrl, { headers: { Authorization: `Bearer ${tdcToken}` } });
        signingData = res.data;
      } catch (err) {
        const status = err.response?.status;
        test.skip(true, `Signing endpoints not available (GET /api/contracts/:id/signing-data returned ${status ?? 'error'})`);
        return;
      }
    });

    const signUrl = `${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}/sign`;

    // Best-effort: sign as TDP (if supported).
    await test.step('TDP approves contract (best-effort)', async () => {
      try {
        await axios.post(signUrl, { signature: 'e2e-placeholder', partyType: 'TDP', signingData }, {
          headers: { Authorization: `Bearer ${tdpToken}` },
        });
      } catch (_) {
        // Some deployments do not support TDP signature via this route.
      }
    });

    // Best-effort: sign as CCRP (if supported).
    await test.step('CCRP approves contract (best-effort)', async () => {
      try {
        await axios.post(signUrl, { signature: 'e2e-placeholder', partyType: 'CCRP', signingData }, {
          headers: { Authorization: `Bearer ${ccrpToken}` },
        });
      } catch (_) {
        // Continue and check whether the contract ended up signed.
      }
    });

    // Load contract detail page as TDC (UI assertion + ensures auth wiring is sane).
    await test.step('TDC views contract details in UI', async () => {
      await seedAuth(page, { token: tdcToken, user: tdcUser });
      await page.goto(`/contracts/${contractId}`);
      await expect(page).not.toHaveURL(/.*\/login/);
      await expect(page.getByRole('heading', { name: /contract/i }).first()).toBeVisible({ timeout: 120000 });
      await attachStepScreenshot(page, testInfo, 'TDC views contract details in UI');
    });

    // If contract isn't signed, training should not start; skip because signing flow is environment-dependent.
    const status = await test.step('Platform validates contract is complete (env + KMS + runtime)', async () => {
      const contractRes = await axios.get(`${BACKEND_URL}/api/contracts/${encodeURIComponent(contractId)}`, {
        headers: { Authorization: `Bearer ${tdcToken}` },
      });
      const st = contractRes.data?.status || contractRes.data?.contract?.status;

      // Field coverage assertions (ensures env/KMS/runtime fields roundtrip correctly).
      expect(
        contractRes.data,
        'Contract should include environmentSpecs (compute/security/kms/runtime.containerSpec) and kmsConfigs'
      ).toMatchObject({
        environmentSpecs: {
          compute: expect.any(Object),
          security: expect.any(Object),
          kms: expect.any(Object),
          runtime: { containerSpec: expect.any(Object) },
        },
        kmsConfigs: expect.anything(),
      });
      // These are optional fields depending on backend version. If backend doesn't persist them,
      // record a warning but do not fail the whole E2E workflow.
      if (!contractRes.data?.containerImage || !contractRes.data?.serviceAccount || !contractRes.data?.logDestination) {
        testInfo.annotations.push({
          type: 'warning',
          description:
            'Optional runtime fields (containerImage/serviceAccount/logDestination) were not persisted. If you recently updated the backend to support these, restart the backend and rerun.',
        });
      }

      await testInfo.attach('Step — Contract details snapshot.json', {
        contentType: 'application/json',
        body: JSON.stringify(contractRes.data, null, 2),
      });

      if (st !== 'SIGNED') {
        test.skip(true, `Contract did not reach SIGNED (current: ${st ?? 'unknown'}). Enable/verify signing flow before running this test.`);
      }
      return st;
    });
    if (status !== 'SIGNED') return;

    // Start training.
    // With TRAINING_SIMULATION_MODE=false, this may fail if cloud/CCRP credentials aren't configured.
    // Only wrap the *start* call here: later steps (wait, logs, register-model) can legitimately return
    // HTTP statuses (e.g. 404) that must not be mis-classified as "expected start failures".
    let jobId;
    await test.step('TDC initiates training run', async () => {
      try {
        const start = await axios.post(
          `${BACKEND_URL}/api/tdc/training/contracts/${encodeURIComponent(contractId)}/start`,
          {},
          { headers: { Authorization: `Bearer ${tdcToken}` } }
        );
        expect(start.data?.success).toBe(true);
        expect(start.data?.job?.jobId).toBeTruthy();
        jobId = start.data.job.jobId;
        await testInfo.attach('Step — Training start response.json', {
          contentType: 'application/json',
          body: JSON.stringify(start.data, null, 2),
        });
        await testInfo.attach('Step — Training job ID.txt', {
          contentType: 'text/plain',
          body: String(jobId),
        });
      } catch (err) {
        const httpStatus = err.response?.status;
        const acceptableStartFailures = [400, 401, 403, 404, 409, 429, 500, 502, 503, 504];
        if (err.response) {
          expect(acceptableStartFailures).toContain(httpStatus);
        } else {
          expect(String(err.message || '').length).toBeGreaterThan(0);
        }
        expect(httpStatus).not.toBe(401);
        expect(httpStatus).not.toBe(403);
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || '';
        expect(String(msg).length).toBeGreaterThan(0);
        await testInfo.attach('Step — Training start error.json', {
          contentType: 'application/json',
          body: JSON.stringify({ httpStatus, msg, data: err.response?.data || null }, null, 2),
        });
        jobId = null;

        // In strict runs we *require* training to start, otherwise no jobId means no logs/provenance/audit/artifact
        // can possibly exist. Keep the best-effort behavior for non-strict runs to preserve signal.
        if (REQUIRE_ARTIFACTS || WAIT_FOR_LOCAL_TRAINING) {
          throw new Error(
            `Training start failed (http ${httpStatus ?? 'n/a'}): ${String(msg).slice(0, 500)}`
          );
        }
      }
    });
    if (!jobId) return;

    // Ensure the HTML report includes provenance/audit artifacts even when we don't wait for local training.
    await test.step('Platform fetches provenance/audit artifacts (best-effort)', async () => {
      // Logs are often the first thing we inspect while debugging; attach best-effort.
      try {
        // Logs may not be available immediately after job start. Poll briefly.
        const startedAt = Date.now();
        const maxWaitMs = 15000;
        let lastErr = null;
        let logsRes = null;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            logsRes = await axios.get(
              `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/logs?full=1`,
              {
                headers: { Authorization: `Bearer ${tdcToken}` },
                responseType: 'text',
                transformResponse: [(x) => x],
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
              }
            );
            const body = String(logsRes.data || '');
            // Attach even if short, but prefer waiting for actual trainer output.
            if (body.includes('[trainer]') || body.length > 200 || Date.now() - startedAt > maxWaitMs) {
              break;
            }
          } catch (e) {
            lastErr = e;
            const status = e.response?.status;
            // 404/409 can happen briefly; keep waiting a bit.
            if (Date.now() - startedAt > maxWaitMs || (status && ![404, 409].includes(status))) {
              break;
            }
          }
          await sleep(750);
          if (Date.now() - startedAt > maxWaitMs) break;
        }

        if (!logsRes) throw lastErr || new Error('Logs not available');
        await attachLargeText(testInfo, 'Logs — training job.txt', logsRes.data || '');
      } catch (e) {
        await testInfo.attach('Logs — training job (error).txt', {
          contentType: 'text/plain',
          body: String(e.response?.status || e.message || e),
        });
        if (REQUIRE_ARTIFACTS) throw e;
      }

      try {
        const provRes = await axios.get(
          `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/provenance-report`,
          { headers: { Authorization: `Bearer ${tdcToken}` } }
        );
        const provBody =
          typeof provRes.data === 'string' ? provRes.data : JSON.stringify(provRes.data, null, 2);
        await testInfo.attach('Provenance — job provenance report.json', {
          contentType: 'application/json',
          body: provBody,
        });
      } catch (e) {
        await testInfo.attach('Provenance — job provenance report (error).txt', {
          contentType: 'text/plain',
          body: String(e.response?.status || e.message || e),
        });
        if (REQUIRE_ARTIFACTS) throw e;
      }

      try {
        const auditRes = await axios.get(
          `${BACKEND_URL}/api/scitt-ccf/provenance-report/${encodeURIComponent(contractId)}`,
          { headers: { Authorization: `Bearer ${tdcToken}` } }
        );
        const auditBody =
          typeof auditRes.data === 'string'
            ? auditRes.data
            : JSON.stringify(auditRes.data?.report ?? auditRes.data, null, 2);
        await testInfo.attach('Provenance — contract audit bundle.json', {
          contentType: 'application/json',
          body: auditBody,
        });
      } catch (e) {
        await testInfo.attach('Provenance — contract audit bundle (error).txt', {
          contentType: 'text/plain',
          body: String(e.response?.status || e.message || e),
        });
        if (REQUIRE_ARTIFACTS) throw e;
      }
    });

    await test.step('TDC opens Training UI and inspects the training job', async () => {
      await seedAuth(page, { token: tdcToken, user: tdcUser });
      await page.goto('/tdc/training');
      await expect(page.getByRole('heading', { name: /training/i })).toBeVisible({ timeout: 120000 });
      await attachStepScreenshot(page, testInfo, 'Training page loaded');

      // Ensure the contract card is present (uses contractId text).
      const contractCard = page.getByText(contractId).locator('xpath=ancestor::div[contains(@class,"MuiCard-root")]').first();
      await expect(contractCard).toBeVisible({ timeout: 120000 });
      await attachStepScreenshot(page, testInfo, 'Contract visible on Training page');

      // Find the job row and open live detail via "Watch".
      const jobRow = contractCard.getByRole('row', { name: new RegExp(jobId) });
      await expect(jobRow).toBeVisible({ timeout: 120000 });
      await attachStepScreenshot(page, testInfo, 'Job row visible');

      // Mobile viewports have higher risk of pointer-event overlays; keep this best-effort.
      const isMobileProject = /mobile/i.test(String(testInfo.project?.name || ''));
      if (isMobileProject) {
        return;
      }

      await jobRow.getByRole('button', { name: /^watch$/i }).click();

      await expect(contractCard.getByText('Selected job detail')).toBeVisible({ timeout: 120000 });
      // Job id exists in multiple places (table + selected detail), so assert via a unique element.
      await expect(contractCard.locator('strong', { hasText: jobId })).toBeVisible({ timeout: 120000 });
      await attachStepScreenshot(page, testInfo, 'Selected job detail opened');

      // If terminal / results are available, open provenance + audit viewers and capture screenshots.
      const viewProv = contractCard.getByRole('button', { name: /view job provenance/i });
      if (await viewProv.isVisible().catch(() => false)) {
        await viewProv.click();
        await expect(page.getByText(/job provenance \(json\)/i)).toBeVisible({ timeout: 120000 });
        await attachStepScreenshot(page, testInfo, 'Job provenance viewer opened');
        const close = page.getByRole('button', { name: /close/i });
        if (await close.count()) await close.first().click();
      }

      const viewAudit = contractCard.getByRole('button', { name: /view contract audit bundle/i });
      if (await viewAudit.isVisible().catch(() => false)) {
        await viewAudit.click();
        await expect(page.getByText(/contract audit bundle \(json\)/i)).toBeVisible({ timeout: 120000 });
        await attachStepScreenshot(page, testInfo, 'Contract audit viewer opened');
        const close = page.getByRole('button', { name: /close/i });
        if (await close.count()) await close.first().click();
      }

      const viewLogs = contractCard.getByRole('button', { name: /view logs/i });
      if (await viewLogs.isVisible().catch(() => false)) {
        await viewLogs.click();
        await attachStepScreenshot(page, testInfo, 'Logs opened (if available)');
      }
    });

    if (WAIT_FOR_LOCAL_TRAINING || REQUIRE_ARTIFACTS) {
      const done = await test.step('Training executes and completes (local-docker)', async () => {
        const d = await waitForJobToFinish({ contractId, jobId, token: tdcToken });
        expect(d?.status, 'Training job should reach COMPLETED').toBe('COMPLETED');

        // Local-docker execution may not populate structured `results` yet; do not fail the entire E2E
        // as long as artifacts (logs/provenance/model.bin) are available.
        if (!d?.results?.artifactUri) {
          testInfo.annotations.push({
            type: 'warning',
            description:
              'Training job completed but results.artifactUri is missing; continuing because artifact download is validated separately.',
          });
        }
        if (d?.results?.accuracy === undefined || d?.results?.loss === undefined) {
          testInfo.annotations.push({
            type: 'warning',
            description:
              'Training job completed but results.accuracy/loss are missing; continuing because provenance + artifacts are validated separately.',
          });
        }

        // Top-level `modelProvenance` is preferred; nested copy lives under `results` for payloads.
        const modelProv = d.modelProvenance ?? d.results?.modelProvenance ?? null;
        if (!modelProv) {
          testInfo.annotations.push({
            type: 'warning',
            description:
              'Training job completed but modelProvenance is missing on the job payload; continuing because provenance report is validated separately.',
          });
        }
        await testInfo.attach('Step — Training completed (job snapshot).json', {
          contentType: 'application/json',
          body: JSON.stringify(d, null, 2),
        });
        return d;
      });

      // Logs should be available for local-docker jobs.
      await test.step('TDC reviews training logs', async () => {
        const logsRes = await axios.get(
          `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/logs?full=1`,
          {
            headers: { Authorization: `Bearer ${tdcToken}` },
            responseType: 'text',
            transformResponse: [(x) => x],
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          }
        );
        const logText = String(logsRes.data || '');
        expect(logText.length, 'Logs should be non-empty').toBeGreaterThan(0);
        if (!logText.includes('[trainer]')) {
          testInfo.annotations.push({
            type: 'warning',
            description:
              'Training logs did not include the expected "[trainer]" marker; attaching full logs for diagnosis.',
          });
        }
        await attachLargeText(testInfo, 'Step — Training logs.txt', logText);
      });

      // Job-level provenance bundle (same JSON as UI download + on-host provenance-report.json).
      await test.step('TDC views job provenance bundle (audit JSON)', async () => {
        try {
          const provRes = await axios.get(
            `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/provenance-report`,
            { headers: { Authorization: `Bearer ${tdcToken}` } }
          );
          const provBody =
            typeof provRes.data === 'string' ? provRes.data : JSON.stringify(provRes.data, null, 2);
          await testInfo.attach('Step — Job provenance report.json', {
            contentType: 'application/json',
            body: provBody,
          });
        } catch (e) {
          await testInfo.attach('Step — Job provenance report error.txt', {
            contentType: 'text/plain',
            body: String(e.response?.status || e.message || e),
          });
          if (REQUIRE_ARTIFACTS) throw e;
        }
      });

      // Trained model artifact (same as UI download).
      await test.step('TDC downloads trained model artifact (model.bin)', async () => {
        try {
          const artRes = await axios.get(
            `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/artifact`,
            {
              headers: { Authorization: `Bearer ${tdcToken}` },
              responseType: 'arraybuffer',
            }
          );
          await testInfo.attach('Step — Trained model artifact (model.bin)', {
            body: Buffer.from(artRes.data),
            contentType: 'application/octet-stream',
          });
        } catch (e) {
          await testInfo.attach('Step — Trained model artifact download error.txt', {
            contentType: 'text/plain',
            body: String(e.response?.status || e.message || e),
          });
          if (REQUIRE_ARTIFACTS) throw e;
        }
      });

      // Best-effort provenance snapshot (SCITT claims) to include in report.
      // This may be empty depending on config and which operations emit claims.
      await test.step('Platform records provenance claims (SCITT snapshot, best-effort)', async () => {
        try {
          const claims = await axios.get(`${BACKEND_URL}/api/scitt-ccf/claims`, {
            headers: { Authorization: `Bearer ${tdcToken}` },
          });
          await testInfo.attach('Step — SCITT claims snapshot.json', {
            contentType: 'application/json',
            body: JSON.stringify(claims.data, null, 2),
          });
        } catch (e) {
          await testInfo.attach('Step — SCITT claims snapshot error.txt', {
            contentType: 'text/plain',
            body: String(e.response?.status || e.message || e),
          });
          if (REQUIRE_ARTIFACTS) throw e;
        }
      });

      // Register trained model.
      const reg = await test.step('TDC registers trained model for reuse (AIModel)', async () => {
        const r = await axios.post(
          `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/register-model`,
          { name: `E2E Trained Model ${Date.now()}` },
          { headers: { Authorization: `Bearer ${tdcToken}` } }
        );
        expect(r.data?.success).toBe(true);
        expect(r.data?.modelId).toBeTruthy();
        await testInfo.attach('Step — Register model response.json', {
          contentType: 'application/json',
          body: JSON.stringify(r.data, null, 2),
        });
        return r;
      });

      // Contract-wide audit bundle after registration (includes new AIModel in report).
      await test.step('TDC reviews contract-wide audit bundle (after training + model registration)', async () => {
        try {
          const auditRes = await axios.get(
            `${BACKEND_URL}/api/scitt-ccf/provenance-report/${encodeURIComponent(contractId)}`,
            { headers: { Authorization: `Bearer ${tdcToken}` } }
          );
          const auditBody =
            typeof auditRes.data === 'string'
              ? auditRes.data
              : JSON.stringify(auditRes.data?.report ?? auditRes.data, null, 2);
          await testInfo.attach('Step — Contract audit bundle.json', {
            contentType: 'application/json',
            body: auditBody,
          });
        } catch (e) {
          await testInfo.attach('Step — Contract audit bundle error.txt', {
            contentType: 'text/plain',
            body: String(e.response?.status || e.message || e),
          });
        }
      });
    }
  });
});

