const fs = require('fs');
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

function isAppleSiliconMac() {
  return process.platform === 'darwin' && process.arch === 'arm64';
}

function mlxPythonPath() {
  return (
    process.env.LOCAL_MLX_PYTHON ||
    path.join(repoRoot(), 'backend', 'local-training', '.venv-mlx', 'bin', 'python')
  );
}

function mlxTrainerScript() {
  return (
    process.env.LOCAL_MLX_TRAINER_SCRIPT ||
    path.join(repoRoot(), 'backend', 'local-training', 'train_mlx.py')
  );
}

/**
 * Env for host MLX trainer (exported for tests).
 */
function buildMlxTrainerEnv({ jobId, contractId, maxEpochs, outDir, contractJsonPath }) {
  const env = {
    ...process.env,
    TRAINING_JOB_ID: jobId,
    CONTRACT_ID: contractId,
    MAX_EPOCHS: String(maxEpochs),
    OUTPUT_DIR: outDir,
    CONTRACT_JSON_PATH: contractJsonPath,
  };
  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) env.HF_TOKEN = hfToken;
  const hfHubUrl = process.env.HUGGINGFACE_HUB_URL;
  if (hfHubUrl) env.HF_ENDPOINT = hfHubUrl;
  return env;
}

async function updateJob(jobId, patch) {
  if (patch.metadata !== undefined && patch.metadata !== null && typeof patch.metadata === 'object') {
    const row = await db.TrainingJob.findOne({ where: { jobId } });
    const prevMeta =
      row && row.metadata && typeof row.metadata === 'object' ? { ...row.metadata } : {};
    patch = { ...patch, metadata: { ...prevMeta, ...patch.metadata } };
  }
  await db.TrainingJob.update(patch, { where: { jobId } });
}

/**
 * Run training natively on Apple Silicon via MLX (host Python venv).
 * See backend/local-training/scripts/setup-mlx-venv.sh
 */
async function runLocalMlxTraining({ jobId, contractId, containerSpec, trainingParams }) {
  const executionMode = 'local-mlx';
  const root = runsRoot();
  const runDir = path.join(root, jobId);
  const outDir = path.join(runDir, 'outputs');
  const inputsDir = path.join(runDir, 'inputs');
  const contractJsonPath = path.join(inputsDir, 'contract.json');
  const logFile = path.join(runDir, 'runner.log');
  const pythonBin = mlxPythonPath();
  const trainerScript = mlxTrainerScript();

  ensureDir(outDir);
  ensureDir(inputsDir);

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

  const maxEpochs = trainingParams?.maxEpochs ?? containerSpec?.maxEpochs ?? 5;
  const env = buildMlxTrainerEnv({
    jobId,
    contractId,
    maxEpochs,
    outDir,
    contractJsonPath,
  });

  const child = spawn(pythonBin, [trainerScript], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    cwd: path.dirname(trainerScript),
  });

  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  child.on('spawn', async () => {
    const metaPatch = {
      progress: 10,
      phases: [{ name: 'PROVISIONING', at: new Date().toISOString() }],
      executionMode,
      containerSpec,
      local: { runDir, outDir, inputsDir, contractJsonPath, logFile, pythonBin, trainerScript },
    };

    await updateJob(jobId, { status: 'PROVISIONING', metadata: metaPatch });
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
      const metricsPath = path.join(outDir, 'metrics.json');
      const metrics = safeReadJson(metricsPath) || {};

      let inputs = null;
      let trainingJobDepaId = null;
      try {
        const jrow = await db.TrainingJob.findOne({ where: { jobId } });
        const plain = jrow?.get ? jrow.get({ plain: true }) : jrow;
        inputs = plain?.metadata?.inputs || null;
        trainingJobDepaId = plain?.metadata?.depaId || null;
      } catch (_) {
        // ignore
      }

      const coreMetrics = {
        accuracy: metrics.accuracy,
        loss: metrics.loss,
        epochsCompleted: metrics.epochsCompleted,
        artifactUri: metrics.artifactUri || `file://${path.join(outDir, 'model_mlx.safetensors')}`,
      };
      const provBase = buildTrainingModelProvenance(inputs, coreMetrics);
      const modelProvenance =
        provBase && typeof provBase === 'object'
          ? { ...provBase, trainingJobDepaId }
          : trainingJobDepaId
            ? { trainingJobDepaId }
            : null;
      const results = { ...coreMetrics, modelProvenance };

      if (code === 0) {
        await updateJob(jobId, {
          status: 'COMPLETED',
          completedAt: new Date(),
          errorMessage: null,
          metadata: {
            executionMode,
            progress: 100,
            containerSpec,
            results,
            phases: [
              { name: 'PROVISIONING', at: new Date().toISOString() },
              { name: 'RUNNING', at: new Date().toISOString() },
              { name: 'COMPLETED', at: new Date().toISOString() },
            ],
            local: { outDir, inputsDir, contractJsonPath, logFile, pythonBin, trainerScript },
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
              executionMode,
              modelProvenance,
              artifactPath: path.join(outDir, 'model_mlx.safetensors'),
              metricsPath,
              timestamp: new Date().toISOString(),
              source: 'localMlxTrainingRunner',
            },
            status: 'SUBMITTED',
            stableDedupeKey: jobId,
          });
        } catch (_) {
          // ignore
        }
      } else {
        await updateJob(jobId, {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: `Local MLX training exited with code ${code}`,
          metadata: {
            executionMode,
            progress: 0,
            containerSpec,
            results,
            phases: [
              { name: 'PROVISIONING', at: new Date().toISOString() },
              { name: 'RUNNING', at: new Date().toISOString() },
              { name: 'FAILED', at: new Date().toISOString() },
            ],
            local: { outDir, inputsDir, contractJsonPath, logFile, pythonBin, trainerScript },
          },
        });
      }
    } finally {
      try {
        logStream.end();
      } catch (_) {
        // ignore
      }
    }
  });

  return { runDir, outDir, logFile, pythonBin };
}

module.exports = {
  runLocalMlxTraining,
  buildMlxTrainerEnv,
  isAppleSiliconMac,
  mlxPythonPath,
};
