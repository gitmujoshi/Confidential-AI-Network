const { test, expect } = require('@playwright/test');
const {
  assertInferenceReady,
  createDeployedTabularInference,
  login,
  USERS,
  listDeployments,
  undeployModel,
  predictModel,
  listGmaseToolDecisions,
  fetchDebugEnv,
  resolveCompliancePulseBaseUrl,
  waitForCompliancePulseIngestForModel,
} = require('./helpers/inference-e2e');

/**
 * Opt-in API: register → deploy → predict for a local-docker tabular model.
 * Defaults: Open-GMASE OPA gate + CompliancePulse ingest assertions.
 *
 * Prerequisites:
 *   TRAINING_EXECUTION_MODE=local-docker (or local-native)
 *   TRAINING_SIMULATION_MODE=false
 *   Docker image contractmanagement/local-trainer:latest includes infer.py
 *   Open-GMASE OPA on :8181 when inference gate is on
 *     (cd open-gmase-core && docker compose up -d)
 *   CompliancePulse on :3001 when ingest is on (default)
 *     (cd compliancepulse-ai/backend && npm run dev)
 *   Or set COMPLIANCEPULSE_INGEST_URL=false on CAN to skip CP checks
 *
 * Run (from frontend/):
 *   E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference
 */
test.describe('Inference deploy + predict — API smoke (opt-in)', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  test('train → register → deploy → predict → list → undeploy (+ GMASE + CP ingest)', async ({}, testInfo) => {
    if (!(await assertInferenceReady(test))) return;

    const debugEnv = await fetchDebugEnv();
    const gateOn = debugEnv.gmase?.inferenceGate !== false;
    const cpIngestOn = debugEnv.gmase?.compliancePulseIngest?.enabled !== false;

    // Default posture: ingest is enabled and points at localhost:3001 unless overridden.
    if (cpIngestOn) {
      expect(debugEnv.gmase?.compliancePulseIngest?.enabled).toBe(true);
      expect(resolveCompliancePulseBaseUrl(debugEnv)).toBeTruthy();
    }

    const result = await createDeployedTabularInference();
    expect(result.modelId).toBeTruthy();
    expect(result.deploy.inference.status).toBe('DEPLOYED');
    expect(result.deploy.inference.taskType).toBe('tabular');
    expect(result.prediction.result.success).toBe(true);
    expect(result.prediction.result.label).toBe('setosa');
    expect(Array.isArray(result.prediction.result.probabilities)).toBe(true);

    if (gateOn) {
      expect(result.deploy.governance?.allow).toBe(true);
      expect(result.deploy.governance?.skipped).not.toBe(true);
      expect(result.prediction.governance?.allow).toBe(true);
      expect(result.prediction.governance?.skipped).not.toBe(true);

      const decisions = await listGmaseToolDecisions({ limit: 40 });
      const forModel = decisions.filter((row) => row.model_id === result.modelId);
      expect(forModel.length).toBeGreaterThanOrEqual(2);
      const tools = forModel.map((row) => row.tool_name);
      expect(tools).toEqual(expect.arrayContaining(['deploy_inference', 'run_inference']));
      expect(forModel.every((row) => row.allow === true)).toBe(true);

      await testInfo.attach('inference.api.gmase-decisions.json', {
        contentType: 'application/json',
        body: JSON.stringify(forModel, null, 2),
      });
    }

    if (cpIngestOn) {
      const cpUrl = resolveCompliancePulseBaseUrl(debugEnv);
      // deploy + predict should each forward at least one ingest event
      const ingested = await waitForCompliancePulseIngestForModel({
        baseUrl: cpUrl,
        modelId: result.modelId,
        minCount: 2,
      });
      expect(ingested.length).toBeGreaterThanOrEqual(2);
      const actions = ingested.map((e) => e.action);
      expect(actions.some((a) => String(a).includes('deploy_inference'))).toBe(true);
      expect(actions.some((a) => String(a).includes('run_inference'))).toBe(true);
      expect(ingested.every((e) => e.result === 'success' || e.result === 'denied')).toBe(true);

      await testInfo.attach('inference.api.cp-ingest.json', {
        contentType: 'application/json',
        body: JSON.stringify(ingested, null, 2),
      });
    }

    const deployments = await listDeployments({ tdcToken: result.tdcToken });
    expect(deployments.some((d) => d.modelId === result.modelId)).toBe(true);

    const again = await predictModel({
      tdcToken: result.tdcToken,
      modelId: result.modelId,
      input: { features: [5.1, 3.5, 1.4, 0.2] },
    });
    expect(again.result.label).toBe('setosa');
    if (gateOn) {
      expect(again.governance?.allow).toBe(true);
    }

    await undeployModel({ tdcToken: result.tdcToken, modelId: result.modelId });
    const after = await listDeployments({ tdcToken: result.tdcToken });
    expect(after.some((d) => d.modelId === result.modelId)).toBe(false);

    await testInfo.attach('inference.api.modelId.txt', {
      contentType: 'text/plain',
      body: result.modelId,
    });
    await testInfo.attach('inference.api.prediction.json', {
      contentType: 'application/json',
      body: JSON.stringify(result.prediction, null, 2),
    });
  });

  test('predict fails when model is not deployed', async ({}, testInfo) => {
    if (!(await assertInferenceReady(test))) return;

    const { trainTabularForInference, registerModelFromJob } = require('./helpers/inference-e2e');
    const run = await trainTabularForInference();
    const { token: tdcToken } = await login(USERS.tdc.email);
    const registered = await registerModelFromJob({
      tdcToken,
      jobId: run.jobId,
      name: `E2E Undeployed Infer ${Date.now()}`,
    });

    let status = null;
    let body = null;
    try {
      await predictModel({
        tdcToken,
        modelId: registered.modelId,
        input: { features: [5.1, 3.5, 1.4, 0.2] },
      });
    } catch (e) {
      status = e.response?.status;
      body = e.response?.data;
    }
    expect(status).toBe(400);
    expect(String(body?.error || '')).toMatch(/not deployed/i);

    await testInfo.attach('inference.api.not-deployed.json', {
      contentType: 'application/json',
      body: JSON.stringify({ status, body }, null, 2),
    });
  });
});
