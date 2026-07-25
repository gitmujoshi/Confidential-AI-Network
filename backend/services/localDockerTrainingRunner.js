const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const db = require('../models');
const { writeLocalScittClaim } = require('./provenanceClaimWriter');
const { buildTrainingModelProvenance } = require('./tdcTrainingHelpers');
const { buildJobTrainingProvenanceBundle } = require('./provenanceAuditReportService');

function repoRoot() {
  return path.resolve(__dirname, '..', '..');
}

function runsRoot() {
  return path.join(repoRoot(), 'backend', 'local-training', 'runs');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/** Persist Hugging Face downloads on the host across ephemeral trainer containers. */
function appendHfCacheDockerArgs(args) {
  const hostCache =
    process.env.HF_HOME ||
    process.env.HUGGINGFACE_HUB_CACHE ||
    path.join(os.homedir(), '.cache', 'huggingface');
  try {
    fs.mkdirSync(hostCache, { recursive: true });
  } catch (_) {
    // best-effort
  }
  args.push('-e', 'HF_HOME=/hf-cache', '-e', 'TRANSFORMERS_CACHE=/hf-cache', '-v', `${hostCache}:/hf-cache`);
}

/**
 * Build docker CLI args for the local trainer container (exported for tests).
 */
function buildDockerRunArgs({ jobId, contractId, maxEpochs, image, outDir, inputsDir, trainingParams }) {
  const args = [
    'run',
    '--rm',
    '--name',
    `cm-train-${jobId}`.slice(0, 128),
    '-e',
    `TRAINING_JOB_ID=${jobId}`,
    '-e',
    `CONTRACT_ID=${contractId}`,
    '-e',
    `MAX_EPOCHS=${String(maxEpochs)}`,
    '-e',
    'CONTRACT_JSON_PATH=/inputs/contract.json',
  ];

  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) {
    args.push('-e', `HF_TOKEN=${hfToken}`);
  }
  const hfHubUrl = process.env.HUGGINGFACE_HUB_URL;
  if (hfHubUrl) {
    args.push('-e', `HF_ENDPOINT=${hfHubUrl}`);
  }

  const dp = trainingParams?.differentialPrivacy;
  const dpEnabled =
    dp === true ||
    (dp && typeof dp === 'object' && Boolean(dp.enabled)) ||
    String(trainingParams?.privacyTechnique || '').toLowerCase().includes('differential');
  if (dpEnabled) {
    const dpEpsilon = dp && typeof dp === 'object' ? dp.epsilon : undefined;
    const dpDelta = dp && typeof dp === 'object' ? dp.delta : undefined;
    const dpMechanism = dp && typeof dp === 'object' ? dp.mechanism : undefined;
    const dpClipNorm = dp && typeof dp === 'object' ? dp.clipNorm : undefined;
    args.push('-e', 'DP_ENABLED=1');
    if (dpEpsilon !== undefined && dpEpsilon !== null) args.push('-e', `DP_EPSILON=${String(dpEpsilon)}`);
    if (dpDelta !== undefined && dpDelta !== null) args.push('-e', `DP_DELTA=${String(dpDelta)}`);
    if (dpMechanism) args.push('-e', `DP_MECHANISM=${String(dpMechanism)}`);
    if (dpClipNorm !== undefined && dpClipNorm !== null) args.push('-e', `DP_CLIP_NORM=${String(dpClipNorm)}`);
  } else {
    args.push('-e', 'DP_ENABLED=0');
  }

  appendHfCacheDockerArgs(args);
  args.push('-v', `${outDir}:/outputs`, '-v', `${inputsDir}:/inputs:ro`, image);
  return args;
}

async function updateJob(jobId, patch) {
  // Shallow-merge metadata so we do not drop fields set at job creation (e.g. `inputs`)
  // or by earlier runner updates (`phases`, `local`, etc.).
  if (patch.metadata !== undefined && patch.metadata !== null && typeof patch.metadata === 'object') {
    const row = await db.TrainingJob.findOne({ where: { jobId } });
    const prevMeta =
      row && row.metadata && typeof row.metadata === 'object' ? { ...row.metadata } : {};
    patch = { ...patch, metadata: { ...prevMeta, ...patch.metadata } };
  }
  await db.TrainingJob.update(patch, { where: { jobId } });
}

function localPathsForJob(jobId, meta = {}) {
  const local = meta.local || {};
  const runDir = local.runDir || path.join(runsRoot(), jobId);
  const outDir = local.outDir || path.join(runDir, 'outputs');
  const inputsDir = local.inputsDir || path.join(runDir, 'inputs');
  const contractJsonPath = local.contractJsonPath || path.join(inputsDir, 'contract.json');
  const logFile = local.logFile || path.join(runDir, 'runner.log');
  const image = local.image || process.env.LOCAL_TRAINING_IMAGE || 'contractmanagement/local-trainer:latest';
  return { runDir, outDir, inputsDir, contractJsonPath, logFile, image };
}

/**
 * Finalize a local-docker job from on-disk metrics when the docker close handler was lost
 * (e.g. nodemon/backend restart while the container finished successfully).
 * Returns true if the job row was updated.
 */
async function finalizeLocalDockerJobFromDisk(jobId, { exitCode = 0 } = {}) {
  const job = await db.TrainingJob.findOne({ where: { jobId } });
  if (!job) return false;
  const plain = job.get ? job.get({ plain: true }) : job;
  if (!['PENDING', 'PROVISIONING', 'RUNNING'].includes(plain.status)) {
    return false;
  }
  const meta = plain.metadata || {};
  if (meta.executionMode && meta.executionMode !== 'local-docker') {
    return false;
  }

  const { outDir, inputsDir, contractJsonPath, logFile, image } = localPathsForJob(jobId, meta);
  const metricsPath = path.join(outDir, 'metrics.json');
  const metrics = safeReadJson(metricsPath);
  if (!metrics && exitCode === 0) {
    return false;
  }

  const containerSpec = meta.containerSpec || null;
  const inputs = meta.inputs || null;
  const trainingJobDepaId = meta.depaId || null;
  const contractId = plain.contractId;
  const coreMetrics = {
    accuracy: metrics?.accuracy,
    loss: metrics?.loss,
    epochsCompleted: metrics?.epochsCompleted,
    artifactUri: metrics?.artifactUri || `file://${path.join(outDir, 'model.bin')}`,
  };
  const provBase = buildTrainingModelProvenance(inputs, coreMetrics);
  const modelProvenance =
    provBase && typeof provBase === 'object'
      ? { ...provBase, trainingJobDepaId }
      : trainingJobDepaId
        ? { trainingJobDepaId }
        : null;
  const results = {
    ...coreMetrics,
    modelProvenance,
  };
  if (metrics?.privacyMetrics && typeof metrics.privacyMetrics === 'object') {
    results.privacyMetrics = metrics.privacyMetrics;
    results.privacyEnhancedTraining = Boolean(metrics.privacyEnhancedTraining);
  }

  const localMeta = { outDir, inputsDir, contractJsonPath, logFile, image };
  const code = exitCode;

  if (code === 0) {
    await updateJob(jobId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      errorMessage: null,
      metadata: {
        executionMode: 'local-docker',
        progress: 100,
        containerSpec,
        results,
        phases: [
          { name: 'PROVISIONING', at: new Date().toISOString() },
          { name: 'RUNNING', at: new Date().toISOString() },
          { name: 'COMPLETED', at: new Date().toISOString() },
        ],
        local: localMeta,
      },
    });

    try {
      const bundle = await buildJobTrainingProvenanceBundle(jobId);
      fs.writeFileSync(
        path.join(outDir, 'provenance-report.json'),
        JSON.stringify(bundle, null, 2),
        'utf8'
      );
    } catch (e) {
      console.warn('⚠️ Failed to write provenance-report.json:', e.message);
    }

    try {
      await writeLocalScittClaim({
        contractId,
        claimType: 'training_completed',
        claimData: {
          contractId,
          contractDepaId: modelProvenance?.contractDepaId ?? null,
          jobId,
          trainingJobDepaId,
          executionMode: 'local-docker',
          modelProvenance,
          artifactPath: path.join(outDir, 'model.bin'),
          metricsPath,
          timestamp: new Date().toISOString(),
          source: 'localDockerTrainingRunner',
          note:
            'Raw metrics and artifact download are on TrainingJob.metadata.results; no duplicate results blob here.',
        },
        status: 'SUBMITTED',
        stableDedupeKey: jobId,
      });
    } catch (_) {
      // ignore
    }
    return true;
  }

  await updateJob(jobId, {
    status: 'FAILED',
    failedAt: new Date(),
    errorMessage: `Local docker training exited with code ${code}`,
    metadata: {
      executionMode: 'local-docker',
      progress: 0,
      containerSpec,
      results,
      phases: [
        { name: 'PROVISIONING', at: new Date().toISOString() },
        { name: 'RUNNING', at: new Date().toISOString() },
        { name: 'FAILED', at: new Date().toISOString() },
      ],
      local: localMeta,
    },
  });
  return true;
}

/**
 * If a RUNNING/PROVISIONING local-docker job already has metrics on disk, mark it complete.
 * Safe to call from job list/get (idempotent).
 */
async function reconcileLocalDockerJobIfNeeded(jobOrPlain) {
  const plain = jobOrPlain?.get ? jobOrPlain.get({ plain: true }) : jobOrPlain;
  if (!plain?.jobId) return false;
  if (!['PENDING', 'PROVISIONING', 'RUNNING'].includes(plain.status)) return false;
  const meta = plain.metadata || {};
  if (meta.executionMode && meta.executionMode !== 'local-docker') return false;
  const { outDir } = localPathsForJob(plain.jobId, meta);
  if (!fs.existsSync(path.join(outDir, 'metrics.json'))) return false;
  return finalizeLocalDockerJobFromDisk(plain.jobId, { exitCode: 0 });
}

/**
 * Launch a local Docker container to execute training.
 *
 * Requirements:
 * - Docker available on the backend host.
 * - Local image built (see backend/local-training/Dockerfile).
 *
 * The container writes metrics to /outputs/metrics.json (mounted).
 */
async function runLocalDockerTraining({ jobId, contractId, containerSpec, trainingParams }) {
  const root = runsRoot();
  const runDir = path.join(root, jobId);
  const outDir = path.join(runDir, 'outputs');
  const inputsDir = path.join(runDir, 'inputs');
  const contractJsonPath = path.join(inputsDir, 'contract.json');
  const logFile = path.join(runDir, 'runner.log');

  ensureDir(outDir);
  ensureDir(inputsDir);

  // Persist contract-driven inputs (specs, dataset/model details) if present on the job.
  // This is what makes the run "extracted from the signed contract".
  try {
    const job = await db.TrainingJob.findOne({ where: { jobId } });
    const plain = job?.get ? job.get({ plain: true }) : job;
    const inputs = plain?.metadata?.inputs;
    if (inputs) {
      fs.writeFileSync(contractJsonPath, JSON.stringify(inputs, null, 2));
    }
  } catch (_) {
    // ignore
  }

  const image =
    process.env.LOCAL_TRAINING_IMAGE ||
    // Local-docker runner expects the repo's training image (writes /outputs/metrics.json + model.bin).
    // Using arbitrary containerSpec images (e.g. generic AzureML base images) will not produce artifacts.
    'contractmanagement/local-trainer:latest';

  // Derive maxEpochs for the placeholder trainer; fall back to 5.
  const maxEpochs = trainingParams?.maxEpochs ?? containerSpec?.maxEpochs ?? 5;

  const dpEnabled =
    trainingParams?.differentialPrivacy?.enabled === true ||
    trainingParams?.differentialPrivacy === true ||
    String(trainingParams?.privacyTechnique || '').toLowerCase().includes('differential');
  if (dpEnabled) {
    console.log(
      `🔐 Local-docker NLP training with differential privacy (target ε=${trainingParams?.differentialPrivacy?.epsilon ?? 'default'})`
    );
  }

  const args = buildDockerRunArgs({
    jobId,
    contractId,
    maxEpochs,
    image,
    outDir,
    inputsDir,
    trainingParams,
  });

  const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  child.on('spawn', async () => {
    const metaPatch = {
      progress: 10,
      phases: [{ name: 'PROVISIONING', at: new Date().toISOString() }],
      executionMode: 'local-docker',
      containerSpec,
      local: { runDir, outDir, inputsDir, contractJsonPath, logFile, image },
    };

    await updateJob(jobId, {
      status: 'PROVISIONING',
      metadata: metaPatch,
    });

    await updateJob(jobId, {
      status: 'RUNNING',
      startedAt: new Date(),
      metadata: {
        ...metaPatch,
        progress: 40,
        phases: [
          ...(metaPatch.phases || []),
          { name: 'RUNNING', at: new Date().toISOString() },
        ],
      },
    });
  });

  child.on('close', async (code) => {
    try {
      await finalizeLocalDockerJobFromDisk(jobId, { exitCode: code == null ? 1 : code });
    } catch (e) {
      console.error(`❌ Failed to finalize local-docker job ${jobId}:`, e.message);
    } finally {
      try {
        logStream.end();
      } catch (_) {
        // ignore
      }
    }
  });

  child.on('error', async (err) => {
    console.error(`❌ docker spawn failed for ${jobId}:`, err.message);
    try {
      await updateJob(jobId, {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: `Local docker spawn failed: ${err.message}`,
        metadata: {
          executionMode: 'local-docker',
          progress: 0,
          local: { runDir, outDir, inputsDir, contractJsonPath, logFile, image },
        },
      });
    } catch (_) {
      // ignore
    }
  });

  return { runDir, outDir, logFile, image };
}

module.exports = {
  runLocalDockerTraining,
  buildDockerRunArgs,
  finalizeLocalDockerJobFromDisk,
  reconcileLocalDockerJobIfNeeded,
};

