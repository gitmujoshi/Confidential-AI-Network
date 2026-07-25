/**
 * Local inference deploy + predict for TDC-registered training artifacts.
 *
 * Deploy marks an AIModel as inference-ready and records the host artifact path.
 * Predict runs backend/local-training/infer.py via Docker (same image as training)
 * or host Python when INFERENCE_EXECUTION_MODE=host.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('../models');

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

function exampleInputForTask(taskType) {
  if (taskType === 'text') {
    return { text: 'Wall Street rallies as tech stocks climb on strong earnings.' };
  }
  if (taskType === 'vision') {
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
    const inferPy = path.join(repoRoot(), 'backend', 'local-training', 'infer.py');
    const python = process.env.LOCAL_INFERENCE_PYTHON || process.env.LOCAL_TRAINING_PYTHON || 'python3';
    const result = await runWithTimeout(() =>
      runCommand(python, [inferPy, '--artifact', artifactPath, '--task', taskType, '--input', inputJson])
    );
    return parseInferResult(result);
  }

  // Docker: mount artifact directory read-only + HF cache for transformer bases
  const outDir = path.dirname(artifactPath);
  const image = trainerImage();
  const dockerArgs = [
    'run',
    '--rm',
    '-v',
    `${outDir}:/model:ro`,
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

async function deployModel(modelId, userId) {
  const { model, meta } = await assertTdcOwnsModel(modelId, userId);
  const { jobMeta, artifactPath, outDir } = await resolveArtifactPath(meta);
  const taskType = resolveTaskType(model, jobMeta);

  const inference = {
    status: 'DEPLOYED',
    mode: inferenceMode(),
    taskType,
    artifactPath,
    artifactDir: outDir,
    exampleInput: exampleInputForTask(taskType),
    appPath: `/tdc/inference?modelId=${encodeURIComponent(model.modelId)}`,
    deployedAt: new Date().toISOString(),
    deployedBy: userId,
  };

  const nextMeta = { ...(model.metadata || {}), inference };
  await model.update({ metadata: nextMeta });

  return {
    modelId: model.modelId,
    name: model.name,
    inference,
  };
}

async function undeployModel(modelId, userId) {
  const { model } = await assertTdcOwnsModel(modelId, userId);
  const nextMeta = { ...(model.metadata || {}) };
  if (nextMeta.inference) {
    nextMeta.inference = {
      ...nextMeta.inference,
      status: 'UNDEPLOYED',
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
  const { model, meta } = await assertTdcOwnsModel(modelId, userId);
  const inference = meta.inference || {};
  if (inference.status !== 'DEPLOYED') {
    const err = new Error('Model is not deployed for inference. Deploy it first.');
    err.statusCode = 400;
    throw err;
  }

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
  };
}

module.exports = {
  deployModel,
  undeployModel,
  listDeployments,
  predict,
  exampleInputForTask,
  resolveTaskType,
};
