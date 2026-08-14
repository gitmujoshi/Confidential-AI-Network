/**
 * E2E helpers for TDC local inference: register → deploy → predict.
 * Uses the fast tabular (logistic regression) track by default.
 * When the backend GMASE inference gate is on (default), Open-GMASE OPA must be reachable.
 */
const axios = require('axios');
const {
  BACKEND_URL,
  USERS,
  login,
  seedAuth,
  fetchTrainingEnv,
} = require('./nlp-dp-training');
const {
  TRAINABLE_TRACKS,
  createSignedAndOptionallyTrain,
  assertLocalTrainingReady,
} = require('./multi-model-training');

async function fetchDebugEnv() {
  const res = await axios.get(`${BACKEND_URL}/api/debug/env`, { timeout: 5000 });
  return res.data || {};
}

async function checkGmaseOpaHealth() {
  try {
    const res = await axios.get(`${BACKEND_URL}/api/debug/gmase-opa-health`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    return { ok: res.status === 200 && res.data?.ok === true, ...res.data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function listGmaseToolDecisions({ limit = 20 } = {}) {
  const res = await axios.get(`${BACKEND_URL}/api/debug/gmase-tool-decisions`, {
    params: { limit },
    timeout: 10000,
  });
  return res.data?.decisions || [];
}

async function getInferenceSkipReason() {
  const wait =
    process.env.E2E_WAIT_FOR_LOCAL_TRAINING === 'true' ||
    process.env.E2E_WAIT_FOR_LOCAL_TRAINING === '1';
  if (!wait) {
    return 'Set E2E_WAIT_FOR_LOCAL_TRAINING=true to run inference deploy/predict E2E';
  }
  try {
    const env = await fetchDebugEnv();
    const training = env.training || (await fetchTrainingEnv());
    const mode = training.trainingExecutionMode;
    const okMode = mode === 'local-docker' || mode === 'local-native';
    if (!okMode) {
      return `TRAINING_EXECUTION_MODE must be local-docker or local-native (current: ${mode})`;
    }
    if (training.trainingSimulationMode === 'true' || training.trainingSimulationMode === true) {
      return 'TRAINING_SIMULATION_MODE must be false for inference artifact E2E';
    }

    const gateOn = env.gmase?.inferenceGate !== false;
    if (gateOn) {
      const opa = await checkGmaseOpaHealth();
      if (!opa.ok) {
        return (
          'Open-GMASE OPA required for inference gate (GMASE_INFERENCE_GATE default on). ' +
          'Start with: cd open-gmase-core && docker compose up -d. ' +
          `Health: ${opa.error || opa.status || 'unreachable'}`
        );
      }
    }
  } catch (e) {
    return `Could not read /api/debug/env: ${e.message}`;
  }
  return null;
}

async function assertInferenceReady(test) {
  const reason = await getInferenceSkipReason();
  if (reason) {
    test.skip(true, reason);
    return false;
  }
  return true;
}

async function trainTabularForInference() {
  await assertLocalTrainingReady();
  const tabular = TRAINABLE_TRACKS.find((t) => t.id === 'tabular');
  if (!tabular) throw new Error('tabular trainable track missing');
  const run = await createSignedAndOptionallyTrain(tabular);
  if (!run.job || run.job.status !== 'COMPLETED') {
    throw new Error(`Expected COMPLETED tabular job, got ${run.job?.status}`);
  }
  return run;
}

async function registerModelFromJob({ tdcToken, jobId, name }) {
  const res = await axios.post(
    `${BACKEND_URL}/api/tdc/training/jobs/${encodeURIComponent(jobId)}/register-model`,
    { name: name || `E2E Inference Model ${Date.now()}` },
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  if (!res.data?.modelId) throw new Error(`register-model failed: ${JSON.stringify(res.data)}`);
  return res.data;
}

async function deployModel({ tdcToken, modelId }) {
  const res = await axios.post(
    `${BACKEND_URL}/api/tdc/inference/models/${encodeURIComponent(modelId)}/deploy`,
    {},
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  if (!res.data?.inference || res.data.inference.status !== 'DEPLOYED') {
    throw new Error(`deploy failed: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function predictModel({ tdcToken, modelId, input }) {
  const res = await axios.post(
    `${BACKEND_URL}/api/tdc/inference/models/${encodeURIComponent(modelId)}/predict`,
    { input },
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  if (!res.data?.success || !res.data?.result) {
    throw new Error(`predict failed: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function undeployModel({ tdcToken, modelId }) {
  const res = await axios.post(
    `${BACKEND_URL}/api/tdc/inference/models/${encodeURIComponent(modelId)}/undeploy`,
    {},
    { headers: { Authorization: `Bearer ${tdcToken}` } }
  );
  return res.data;
}

async function listDeployments({ tdcToken }) {
  const res = await axios.get(`${BACKEND_URL}/api/tdc/inference/deployments`, {
    headers: { Authorization: `Bearer ${tdcToken}` },
  });
  return res.data?.deployments || [];
}

/**
 * Full happy path used by API + UI specs:
 * train tabular → register → deploy → predict (iris setosa sample).
 */
async function createDeployedTabularInference() {
  const run = await trainTabularForInference();
  const { token: tdcToken, user: tdcUser } = await login(USERS.tdc.email);
  const registered = await registerModelFromJob({
    tdcToken,
    jobId: run.jobId,
    name: `E2E Tabular Inference ${Date.now()}`,
  });
  const deployed = await deployModel({ tdcToken, modelId: registered.modelId });
  const prediction = await predictModel({
    tdcToken,
    modelId: registered.modelId,
    input: { features: [5.1, 3.5, 1.4, 0.2] },
  });
  return {
    tdcToken,
    tdcUser,
    contractId: run.contractId,
    jobId: run.jobId,
    modelId: registered.modelId,
    deploy: deployed,
    prediction,
  };
}

module.exports = {
  BACKEND_URL,
  USERS,
  login,
  seedAuth,
  getInferenceSkipReason,
  assertInferenceReady,
  trainTabularForInference,
  registerModelFromJob,
  deployModel,
  predictModel,
  undeployModel,
  listDeployments,
  createDeployedTabularInference,
  checkGmaseOpaHealth,
  listGmaseToolDecisions,
  fetchDebugEnv,
};
