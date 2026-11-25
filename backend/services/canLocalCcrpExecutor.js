const path = require('path');
const db = require('../models');
const { runLocalDockerTraining } = require('../../training/localDockerTrainingRunner');
const { buildCanTrainingJobInputs } = require('../../training/contractTrainingInputsService');

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
  constructor({ jcs } = {}) {
    this.jcs = jcs;
  }

  async _deliverGuestKeys({ canJobId, trainingJobId, outDir, inputsDir, inputs }) {
    const { spawn } = require('child_process');
    const { buildGuestOwners, waitForGuestPublicKey, writeSealedRelease } = require('./guestRelease');
    const { dockerContainerNameForJob } = require('../../training/localDockerTrainingRunner');
    const stop = () => {
      spawn('docker', ['stop', '-t', '1', dockerContainerNameForJob(trainingJobId)], { stdio: 'ignore' });
    };
    try {
      const owners = buildGuestOwners(inputs, {
        keyDir: process.env.CAN_GUEST_KEY_DIR,
        datasetEndpoint: process.env.CAN_DATASET_KBS_URL,
        modelEndpoint: process.env.CAN_MODEL_KBS_URL,
      });
      if (!this.jcs || owners.length === 0) {
        const err = new Error('No owner broker has a key for this guest. Training was not started.');
        err.code = 'GUEST_KEY_MISSING';
        err.statusCode = 409;
        throw err;
      }
      const guestPublicKey = await waitForGuestPublicKey(outDir);
      const delivered = await this.jcs.releaseToGuest(canJobId, {
        guestPublicKey,
        owners,
        contract: inputs && inputs.contract,
      });
      writeSealedRelease(inputsDir, delivered.releases);
      delivered.releases.forEach((item) => {
        item.wrappedKey = null;
      });
    } catch (error) {
      stop();
      throw error;
    }
  }

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

      const guestDecrypt = String(process.env.CAN_GUEST_DECRYPT || '').toLowerCase() === 'true';
      const trainingParams = {
        ...(stagedInputs?.contract?.trainingParams || { maxEpochs }),
        guestDecrypt,
      };
      const started = await runLocalDockerTraining({
        jobId: trainingJobId,
        contractId: String(contractId),
        containerSpec: { image: process.env.LOCAL_TRAINING_IMAGE || undefined },
        trainingParams,
      });
      if (guestDecrypt) {
        await this._deliverGuestKeys({
          canJobId,
          trainingJobId,
          outDir: started.outDir,
          inputsDir: path.join(started.runDir, 'inputs'),
          inputs: stagedInputs,
        });
      }
      return started;
    }

    return simulateTraining({ trainingJobId, contractId });
  }
}

module.exports = {
  CANLocalCcrpExecutor
};

