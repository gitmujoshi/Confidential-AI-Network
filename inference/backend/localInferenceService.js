/**
 * Local inference deploy + predict for TDC-registered training artifacts.
 *
 * Deploy marks an AIModel as inference-ready and records the host artifact path.
 * Predict runs inference/backend/infer.py via Docker (same image as training)
 * or host Python when INFERENCE_EXECUTION_MODE=host.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('../../backend/models');
const { authorizeCanSideEffect, isInferenceGateEnabled } = require('../../shared/services/gmaseSideEffectGate');
const { isCompleteAccount, missingAccountFields } = require('../../shared/services/tspCloudAccount');
const { provisionInferenceCcr, teardownInferenceCcr } = require('./inferenceCcrRunner');

const DEPLOY_TARGETS = {
  Local: 'local',
  Azure: 'azure-ccr',
  GCP: 'gcp-ccr',
  AWS: 'aws-ccr',
};

function canonicalDeployTarget(value) {
  const raw = String(value == null || value === '' ? 'Local' : value).trim().toLowerCase();
  if (raw === 'local') return 'Local';
  if (raw === 'azure') return 'Azure';
  if (raw === 'gcp' || raw === 'google') return 'GCP';
  if (raw === 'aws') return 'AWS';
  return null;
}

function isLocalDeployment(inference) {
  return !inference?.provider || inference.provider === 'Local';
}

/** Authorize inference side-effect via shared Open-GMASE gate. */
async function authorizeInferenceTool({ toolName, userId, contract, model, inferenceMeta, parameters }) {
  return authorizeCanSideEffect({
    toolName,
    userId,
    contract,
    enabled: isInferenceGateEnabled(),
    slice: 'can-inference-gate',
    parameters: parameters || {},
    metadata: {
      model_id: model?.modelId || null,
      inference_status: inferenceMeta?.status || null,
      task_type: inferenceMeta?.taskType || null,
    },
  });
}

function repoRoot() {
  return path.resolve(__dirname, '../..');
}

function trainerImage() {
  return process.env.LOCAL_TRAINING_IMAGE || 'contractmanagement/local-trainer:latest';
}

function inferenceMode() {
  return String(process.env.INFERENCE_EXECUTION_MODE || 'docker').toLowerCase();
}

/** Host HF cache so DistilBERT-quality cold starts do not re-download every container. */
function hostHfCacheDir() {
  const preferred =
    process.env.HF_HOME ||
    process.env.HUGGINGFACE_HUB_CACHE ||
    path.join(os.homedir(), '.cache', 'huggingface');
  try {
    fs.mkdirSync(preferred, { recursive: true });
  } catch (_) {
    // best-effort
  }
  return preferred;
}

function appendHfCacheDockerArgs(args) {
  const hostCache = hostHfCacheDir();
  args.push('-e', 'HF_HOME=/hf-cache', '-e', 'TRANSFORMERS_CACHE=/hf-cache', '-v', `${hostCache}:/hf-cache`);
}

function resolveTaskType(model, jobMeta = {}) {
  const results = model.metadata?.trainingResults || jobMeta.results || {};
  const fromResults = results.taskType || results.task;
  if (fromResults) return String(fromResults).toLowerCase();
  const arch = String(model.architecture || '').toLowerCase();
  if (arch.includes('bert') || arch.includes('distil') || arch.includes('gpt')) return 'text';
  if (arch.includes('resnet') || arch.includes('cnn') || arch.includes('mnist')) return 'vision';
  if (arch.includes('logistic') || model.type === 'other') return 'tabular';
  if (model.type === 'transformer') return 'text';
  if (model.type === 'cnn') return 'vision';
  return 'tabular';
}

function visionDemoSample() {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require('../../backend/local-training/samples/cifarDemoSample');
  } catch (_) {
    return null;
  }
}

function exampleInputForTask(taskType) {
  if (taskType === 'text') {
    return { text: 'Wall Street rallies as tech stocks climb on strong earnings.' };
  }
  if (taskType === 'vision') {
    const sample = visionDemoSample();
    if (sample?.imageBase64) {
      return {
        imageBase64: sample.imageBase64,
        classHint: sample.classHint || 'airplane',
      };
    }
    return { demo: true };
  }
  // Iris sample (setosa-ish)
  return { features: [5.1, 3.5, 1.4, 0.2] };
}

async function assertTdcOwnsModel(modelId, userId) {
  const model = await db.AIModel.findOne({ where: { modelId } });
  if (!model) {
    const err = new Error('Model not found');
    err.statusCode = 404;
    throw err;
  }
  const meta = model.metadata || {};
  if (meta.source !== 'tdc_training_job' || !meta.contractId) {
    const err = new Error('Only models registered from a TDC training job can be deployed for inference');
    err.statusCode = 400;
    throw err;
  }
  const contract = await db.Contract.findOne({ where: { contractId: meta.contractId } });
  if (!contract || contract.tdcId !== userId) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }
  return { model, contract, meta };
}

async function resolveArtifactPath(meta) {
  const jobId = meta.trainingJobId;
  if (!jobId) {
    const err = new Error('Model metadata missing trainingJobId');
    err.statusCode = 400;
    throw err;
  }
  const job = await db.TrainingJob.findOne({ where: { jobId } });
  if (!job) {
    const err = new Error('Training job not found for this model');
    err.statusCode = 404;
    throw err;
  }
  const jobMeta = job.metadata || {};
  const outDir = jobMeta.local?.outDir || path.join(repoRoot(), 'backend', 'local-training', 'runs', jobId, 'outputs');
  const artifactPath = path.join(outDir, 'model.bin');
  if (!fs.existsSync(artifactPath)) {
    const err = new Error(
      `Artifact not found at ${artifactPath}. Re-run local training or keep the run directory.`
    );
    err.statusCode = 404;
    throw err;
  }
  return { job, jobMeta, artifactPath, outDir };
}

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd || repoRoot(),
      env: { ...process.env, ...(opts.env || {}) },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function runInfer({ artifactPath, taskType, input }) {
  const inputJson = JSON.stringify(input || {});
  const mode = inferenceMode();
  const timeoutMs = Number(process.env.INFERENCE_TIMEOUT_MS || 600000);

  const runWithTimeout = async (fn) => {
    let timer;
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Inference timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  if (mode === 'host') {
    const inferPy = path.join(repoRoot(), 'inference', 'backend', 'infer.py');
    const python = process.env.LOCAL_INFERENCE_PYTHON || process.env.LOCAL_TRAINING_PYTHON || 'python3';
    const result = await runWithTimeout(() =>
      runCommand(python, [inferPy, '--artifact', artifactPath, '--task', taskType, '--input', inputJson])
    );
    return parseInferResult(result);
  }

  // Docker: mount artifact directory read-only + host infer.py (so label maps ship without rebuild)
  const outDir = path.dirname(artifactPath);
  const inferPy = path.join(repoRoot(), 'inference', 'backend', 'infer.py');
  const image = trainerImage();
  const dockerArgs = [
    'run',
    '--rm',
    '-v',
    `${outDir}:/model:ro`,
    '-v',
    `${inferPy}:/app/infer.py:ro`,
  ];
  appendHfCacheDockerArgs(dockerArgs);
  dockerArgs.push(
    image,
    'python',
    '/app/infer.py',
    '--artifact',
    '/model/model.bin',
    '--task',
    taskType,
    '--input',
    inputJson
  );
  const result = await runWithTimeout(() => runCommand('docker', dockerArgs));
  return parseInferResult(result);
}

function parseInferResult({ code, stdout, stderr }) {
  const lines = String(stdout || '')
    .trim()
    .split('\n')
    .filter(Boolean);
  const last = lines[lines.length - 1] || '';
  let parsed = null;
  try {
    parsed = JSON.parse(last);
  } catch (_) {
    // try stderr JSON
    try {
      parsed = JSON.parse(String(stderr || '').trim().split('\n').pop());
    } catch (__) {
      parsed = null;
    }
  }
  if (code !== 0 || !parsed || parsed.success === false) {
    const err = new Error(
      (parsed && parsed.error) || stderr?.trim() || stdout?.trim() || `Inference failed (exit ${code})`
    );
    err.statusCode = 500;
    err.details = { code, stdout, stderr, parsed };
    throw err;
  }
  return parsed;
}

async function loadTdcDeployAccount(userId, provider) {
  const user = await db.User.findByPk(userId);
  const account = user?.cloudAccount?.[provider] || null;
  if (!isCompleteAccount(provider, account)) {
    const missing = missingAccountFields(provider, account);
    const err = new Error(
      `Save the ${provider} cluster on the Inference page before deploying. Missing: ${missing.join(', ')}.`
    );
    err.statusCode = 400;
    throw err;
  }
  return account;
}

async function deployModel(modelId, userId, options = {}) {
  const target = canonicalDeployTarget(options.target);
  if (!target) {
    const err = new Error('Deploy target must be Local, Azure, GCP, or AWS.');
    err.statusCode = 400;
    throw err;
  }

  const { model, contract, meta } = await assertTdcOwnsModel(modelId, userId);
  const { jobMeta, artifactPath, outDir } = await resolveArtifactPath(meta);
  const taskType = resolveTaskType(model, jobMeta);

  const governance = await authorizeInferenceTool({
    toolName: 'deploy_inference',
    userId,
    contract,
    model,
    inferenceMeta: { status: 'PENDING_DEPLOY', taskType },
    parameters: { model_id: modelId, task_type: taskType, deploy_target: target },
  });

  const base = {
    taskType,
    artifactPath,
    artifactDir: outDir,
    exampleInput: exampleInputForTask(taskType),
    appPath: `/tdc/inference?modelId=${encodeURIComponent(model.modelId)}`,
    deployedAt: new Date().toISOString(),
    deployedBy: userId,
    contractProvider: contract.tspCloudProvider || null,
  };

  let inference;
  if (target === 'Local') {
    const mode = inferenceMode();
    inference = {
      ...base,
      status: 'DEPLOYED',
      provider: 'Local',
      executionMode: mode === 'host' ? 'local-host' : 'local-docker',
      mode,
      submitted: false,
    };
  } else {
    const account = await loadTdcDeployAccount(userId, target);
    const placed = await provisionInferenceCcr({
      provider: target,
      modelId: model.modelId,
      contractId: contract.contractId,
      taskType,
      account,
    });
    if (!placed.submitted) {
      const err = new Error(placed.error);
      err.statusCode = 502;
      throw err;
    }
    inference = {
      ...base,
      status: 'DEPLOYED',
      provider: target,
      executionMode: DEPLOY_TARGETS[target],
      mode: DEPLOY_TARGETS[target],
      submitted: true,
      cluster: placed.cluster,
      spec: placed.spec,
      account,
      attestation: placed.attestation,
    };
  }

  const nextMeta = { ...(model.metadata || {}), inference };
  await model.update({ metadata: nextMeta });

  return {
    modelId: model.modelId,
    name: model.name,
    inference,
    governance,
  };
}

async function undeployModel(modelId, userId) {
  const { model } = await assertTdcOwnsModel(modelId, userId);
  const nextMeta = { ...(model.metadata || {}) };
  if (nextMeta.inference) {
    if (!isLocalDeployment(nextMeta.inference)) {
      await teardownInferenceCcr(nextMeta.inference);
    }
    nextMeta.inference = {
      ...nextMeta.inference,
      status: 'UNDEPLOYED',
      submitted: false,
      undeployedAt: new Date().toISOString(),
    };
  }
  await model.update({ metadata: nextMeta });
  return { modelId: model.modelId, inference: nextMeta.inference || null };
}

async function listDeployments(userId) {
  const models = await db.AIModel.findAll({
    where: { isActive: true },
    order: [['updatedAt', 'DESC']],
  });
  const owned = [];
  for (const model of models) {
    const meta = model.metadata || {};
    if (meta.source !== 'tdc_training_job' || !meta.contractId) continue;
    if (!meta.inference || meta.inference.status !== 'DEPLOYED') continue;
    try {
      const contract = await db.Contract.findOne({ where: { contractId: meta.contractId } });
      if (!contract || contract.tdcId !== userId) continue;
      owned.push({
        modelId: model.modelId,
        name: model.name,
        type: model.type,
        architecture: model.architecture,
        framework: model.framework,
        contractId: meta.contractId,
        trainingJobId: meta.trainingJobId,
        inference: meta.inference,
      });
    } catch (_) {
      // skip
    }
  }
  return owned;
}

async function predict(modelId, userId, input) {
  const { model, contract, meta } = await assertTdcOwnsModel(modelId, userId);
  const inference = meta.inference || {};
  if (inference.status !== 'DEPLOYED') {
    const err = new Error('Model is not deployed for inference. Deploy it first.');
    err.statusCode = 400;
    throw err;
  }
  if (!isLocalDeployment(inference)) {
    const err = new Error(
      `This model is deployed on the TDC ${inference.provider} cluster. Run prediction is available for a Local deployment. The score is not copied back from the cluster.`
    );
    err.statusCode = 409;
    throw err;
  }

  const governance = await authorizeInferenceTool({
    toolName: 'run_inference',
    userId,
    contract,
    model,
    inferenceMeta: inference,
    parameters: {
      model_id: modelId,
      task_type: inference.taskType || null,
      has_input: Boolean(input && typeof input === 'object'),
    },
  });

  let artifactPath = inference.artifactPath;
  if (!artifactPath || !fs.existsSync(artifactPath)) {
    const resolved = await resolveArtifactPath(meta);
    artifactPath = resolved.artifactPath;
  }

  const taskType = inference.taskType || resolveTaskType(model);
  const started = Date.now();
  const result = await runInfer({
    artifactPath,
    taskType,
    input: input && typeof input === 'object' ? input : exampleInputForTask(taskType),
  });
  return {
    modelId,
    taskType,
    latencyMs: Date.now() - started,
    input,
    result,
    governance,
  };
}

module.exports = {
  DEPLOY_TARGETS,
  canonicalDeployTarget,
  isLocalDeployment,
  deployModel,
  undeployModel,
  listDeployments,
  predict,
  exampleInputForTask,
  resolveTaskType,
  isInferenceGateEnabled,
};
