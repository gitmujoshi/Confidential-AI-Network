/**
 * E2E helpers for TDC local inference: register → deploy → predict.
 * Defaults (when enabled on the backend):
 *   - Open-GMASE OPA must be reachable
 *   - CompliancePulse ingest (localhost:3001) must be reachable
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

const DEFAULT_CP_URL = 'http://localhost:3001';

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

function resolveCompliancePulseBaseUrl(debugEnv) {
  const fromEnv = debugEnv?.gmase?.compliancePulseIngest?.url;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  return (process.env.COMPLIANCEPULSE_INGEST_URL || DEFAULT_CP_URL).replace(/\/$/, '');
}

async function checkCompliancePulseHealth(baseUrl = DEFAULT_CP_URL) {
  const url = String(baseUrl || DEFAULT_CP_URL).replace(/\/$/, '');
  try {
    const res = await axios.get(`${url}/health`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    return { ok: res.status === 200, status: res.status, baseUrl: url, body: res.data };
  } catch (e) {
    return { ok: false, error: e.message, baseUrl: url };
  }
}

async function listCompliancePulseIngestEvents({
  baseUrl = DEFAULT_CP_URL,
  limit = 50,
} = {}) {
  const url = String(baseUrl || DEFAULT_CP_URL).replace(/\/$/, '');
  const res = await axios.get(`${url}/api/v1/audit/trail`, {
    params: { limit, eventTypes: 'external_ingest' },
    timeout: 10000,
    validateStatus: () => true,
  });
  if (res.status >= 400) {
    throw new Error(`CompliancePulse audit trail failed: HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res.data?.events || [];
}

/**
 * Wait briefly for CAN's setImmediate forward, then find ingest events for a model.
 */
async function waitForCompliancePulseIngestForModel({
  baseUrl,
  modelId,
  minCount = 1,
  attempts = 10,
  delayMs = 250,
} = {}) {
  let last = [];
  for (let i = 0; i < attempts; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, delayMs));
    // eslint-disable-next-line no-await-in-loop
    const events = await listCompliancePulseIngestEvents({ baseUrl, limit: 80 });
    last = events.filter((e) => {
      const meta = e.metadata || {};
      return meta.model_id === modelId || meta.modelId === modelId;
    });
    if (last.length >= minCount) return last;
  }
  return last;
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

    const cpIngest = env.gmase?.compliancePulseIngest;
    const cpEnabled = cpIngest?.enabled !== false;
    if (cpEnabled) {
      const cpUrl = resolveCompliancePulseBaseUrl(env);
      const cp = await checkCompliancePulseHealth(cpUrl);
      if (!cp.ok) {
        return (
          'CompliancePulse ingest required by default (COMPLIANCEPULSE_INGEST_URL → ' +
          `${cpUrl}). Start CP backend, or set COMPLIANCEPULSE_INGEST_URL=false on CAN to skip. ` +
          `Health: ${cp.error || cp.status || 'unreachable'}`
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
  DEFAULT_CP_URL,
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
  checkCompliancePulseHealth,
  listCompliancePulseIngestEvents,
  waitForCompliancePulseIngestForModel,
  resolveCompliancePulseBaseUrl,
  listGmaseToolDecisions,
  fetchDebugEnv,
};
