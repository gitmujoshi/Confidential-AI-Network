const { test, expect } = require('@playwright/test');
const {
  assertInferenceReady,
  createDeployedTabularInference,
  login,
  USERS,
  listDeployments,
  undeployModel,
  predictModel,
} = require('./helpers/inference-e2e');

/**
 * Opt-in API: register → deploy → predict for a local-docker tabular model.
 *
 * Prerequisites:
 *   TRAINING_EXECUTION_MODE=local-docker (or local-native)
 *   TRAINING_SIMULATION_MODE=false
 *   Docker image contractmanagement/local-trainer:latest includes infer.py
 *
 * Run (from frontend/):
 *   E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference
 */
test.describe('Inference deploy + predict — API smoke (opt-in)', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  test('train → register → deploy → predict → list → undeploy', async ({}, testInfo) => {
    if (!(await assertInferenceReady(test))) return;

    const result = await createDeployedTabularInference();
    expect(result.modelId).toBeTruthy();
    expect(result.deploy.inference.status).toBe('DEPLOYED');
    expect(result.deploy.inference.taskType).toBe('tabular');
    expect(result.prediction.result.success).toBe(true);
    expect(result.prediction.result.label).toBe('setosa');
    expect(Array.isArray(result.prediction.result.probabilities)).toBe(true);

    const deployments = await listDeployments({ tdcToken: result.tdcToken });
    expect(deployments.some((d) => d.modelId === result.modelId)).toBe(true);

    // Second predict still works while deployed
    const again = await predictModel({
      tdcToken: result.tdcToken,
      modelId: result.modelId,
      input: { features: [5.1, 3.5, 1.4, 0.2] },
    });
    expect(again.result.label).toBe('setosa');

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
