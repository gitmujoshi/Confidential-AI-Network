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
        artifactUri: metrics.artifactUri || `file://${path.join(outDir, 'model.bin')}`,
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

        // Provenance claim (best-effort).
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
            claimType: 'training_failed',
            claimData: {
              contractId,
              contractDepaId: modelProvenance?.contractDepaId ?? null,
              jobId,
              trainingJobDepaId,
              executionMode: 'local-docker',
              exitCode: code,
              modelProvenance,
              logFile,
              timestamp: new Date().toISOString(),
              source: 'localDockerTrainingRunner',
              note: 'Partial metrics (if any) are inside modelProvenance.trainingMetrics; TrainingJob row has full metadata.',
            },
            status: 'FAILED',
            stableDedupeKey: jobId,
          });
        } catch (_) {
          // ignore
        }
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

