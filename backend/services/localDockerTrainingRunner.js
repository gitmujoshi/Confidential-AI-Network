const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const db = require('../models');

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

async function updateJob(jobId, patch) {
  await db.TrainingJob.update(patch, { where: { jobId } });
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
    containerSpec?.image ||
    'contractmanagement/local-trainer:latest';

  // Derive maxEpochs for the placeholder trainer; fall back to 5.
  const maxEpochs = trainingParams?.maxEpochs ?? containerSpec?.maxEpochs ?? 5;

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
    '-v',
    `${outDir}:/outputs`,
    '-v',
    `${inputsDir}:/inputs:ro`,
    image,
  ];

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
      const metricsPath = path.join(outDir, 'metrics.json');
      const metrics = safeReadJson(metricsPath) || {};

      const results = {
        accuracy: metrics.accuracy,
        loss: metrics.loss,
        epochsCompleted: metrics.epochsCompleted,
        artifactUri: metrics.artifactUri || `file://${path.join(outDir, 'model.bin')}`,
      };

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
            local: { outDir, inputsDir, contractJsonPath, logFile, image },
          },
        });
      } else {
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
            local: { outDir, inputsDir, contractJsonPath, logFile, image },
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

  return { runDir, outDir, logFile, image };
}

module.exports = {
  runLocalDockerTraining,
};

