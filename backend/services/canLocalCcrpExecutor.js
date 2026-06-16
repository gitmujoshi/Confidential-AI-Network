const db = require('../models');
const { runLocalDockerTraining } = require('./localDockerTrainingRunner');
const { buildCanTrainingJobInputs } = require('./contractTrainingInputsService');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureTrainingJob({ trainingJobId, contractId, canJobId, ccrProvider, inputs }) {
  const existing = await db.TrainingJob.findOne({ where: { jobId: trainingJobId } });
  const mergedMeta = {
    source: 'CAN',
    canJobId,
    ccrProvider,
    ...(inputs ? { inputs } : {}),
  };

  if (existing) {
    const meta = { ...(existing.metadata || {}), ...mergedMeta };
    if (inputs) meta.inputs = inputs;
    await existing.update({ metadata: meta });
    return existing.reload();
  }

  return db.TrainingJob.create({
    jobId: trainingJobId,
    contractId: String(contractId),
    status: 'PENDING',
    metadata: mergedMeta,
  });
}

async function simulateTraining({ trainingJobId, contractId }) {
  // Minimal simulation that behaves similarly to the runner’s DB updates.
  const job = await db.TrainingJob.findOne({ where: { jobId: trainingJobId } });
  if (!job) return;

  await job.update({
    status: 'PROVISIONING',
    metadata: { ...(job.metadata || {}), progress: 15, phases: [{ name: 'PROVISIONING', at: new Date().toISOString() }] }
  });
  await sleep(300);

  await job.update({
    status: 'RUNNING',
    startedAt: new Date(),
    metadata: {
      ...(job.metadata || {}),
      progress: 55,
      phases: [
        ...(job.metadata?.phases || []),
        { name: 'RUNNING', at: new Date().toISOString() }
      ]
    }
  });
  await sleep(500);

  await job.update({
    status: 'COMPLETED',
    completedAt: new Date(),
    metadata: {
      ...(job.metadata || {}),
      progress: 100,
      results: {
        accuracy: 0.93,
        loss: 0.04,
        epochsCompleted: 3,
        artifactUri: `simulated://can/${trainingJobId}/model.bin`
      },
      phases: [
        ...(job.metadata?.phases || []),
        { name: 'COMPLETED', at: new Date().toISOString() }
      ]
    }
  });
}

class CANLocalCcrpExecutor {
  async run({ canJobId, contractId, trainingJobId }) {
    const mode = (process.env.CAN_LOCAL_TRAINING_MODE || 'simulate').toLowerCase();
    const inputs = await buildCanTrainingJobInputs(String(contractId));
    if (!inputs.datasets?.length && !inputs.models?.length) {
      console.warn(
        `[CANLocalCcrpExecutor] No catalog datasets/models resolved for contractId=${contractId}; trainer falls back to built-in defaults`
      );
    }

    await ensureTrainingJob({
      trainingJobId,
      contractId,
      canJobId,
      ccrProvider: 'local',
      inputs,
    });

    const rawEpochs = inputs?.contract?.trainingParams?.maxEpochs;
    const maxEpochs = Math.min(20, Math.max(1, Number(rawEpochs) || 3));

    if (mode === 'docker') {
      const { stageDatasetsForLocalJob } = require('./datasetArtifactStaging');
      let stagedInputs = inputs;
      try {
        stagedInputs = await stageDatasetsForLocalJob(trainingJobId, inputs);
      } catch (stageErr) {
        console.warn(
          `[CANLocalCcrpExecutor] Dataset staging skipped for ${trainingJobId}:`,
          stageErr.message
        );
      }
      await ensureTrainingJob({
        trainingJobId,
        contractId,
        canJobId,
        ccrProvider: 'local',
        inputs: stagedInputs,
      });

      return runLocalDockerTraining({
        jobId: trainingJobId,
        contractId: String(contractId),
        containerSpec: { image: process.env.LOCAL_TRAINING_IMAGE || undefined },
        trainingParams: stagedInputs?.contract?.trainingParams || { maxEpochs },
      });
    }

    return simulateTraining({ trainingJobId, contractId });
  }
}

module.exports = {
  CANLocalCcrpExecutor
};

