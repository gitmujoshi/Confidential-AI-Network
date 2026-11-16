/**
 * Abort in-flight TDC training jobs (local-docker / native / mlx / simulation).
 * Marks CANCELLED first so runner close handlers do not overwrite with FAILED.
 */

const { spawn } = require('child_process');
const { Op } = require('sequelize');
const db = require('../backend/models');
const { getTrainingProcess, unregisterTrainingProcess } = require('./trainingProcessRegistry');

function dockerContainerNameForJob(jobId) {
  return `cm-train-${String(jobId)}`.slice(0, 128);
}

const ACTIVE_JOB_STATUSES = ['PENDING', 'PROVISIONING', 'RUNNING', 'STALLED'];

function isActiveTrainingStatus(status) {
  return ACTIVE_JOB_STATUSES.includes(status);
}

function stopDockerContainer(jobId) {
  return new Promise((resolve) => {
    const name = dockerContainerNameForJob(jobId);
    const child = spawn('docker', ['stop', '-t', '5', name], { stdio: 'ignore' });
    const done = () => resolve();
    child.on('close', done);
    child.on('error', done);
  });
}

function killPid(pid) {
  if (!pid) return;
  try {
    process.kill(Number(pid), 'SIGTERM');
  } catch (_) {
    // already gone
  }
}

async function abortTrainingJob(job, reason = 'Contract ended') {
  const row = job?.get ? job : null;
  const plain = row?.get ? row.get({ plain: true }) : job;
  if (!plain?.jobId) return { aborted: false };
  if (!isActiveTrainingStatus(plain.status)) {
    return { jobId: plain.jobId, status: plain.status, aborted: false };
  }

  const model = row || (await db.TrainingJob.findOne({ where: { jobId: plain.jobId } }));
  if (!model) return { jobId: plain.jobId, aborted: false };

  const meta = model.metadata && typeof model.metadata === 'object' ? { ...model.metadata } : {};
  meta.phases = [...(meta.phases || []), { name: 'CANCELLED', at: new Date().toISOString() }];
  meta.abortReason = reason;

  await model.update({
    status: 'CANCELLED',
    cancelledAt: new Date(),
    cancellationReason: reason,
    metadata: meta,
  });

  const handle = getTrainingProcess(plain.jobId);
  const mode = meta.executionMode || handle?.kind;

  if (mode === 'local-docker' || handle?.kind === 'docker') {
    await stopDockerContainer(plain.jobId);
  }

  if (mode === 'azure-ccr') {
    const { teardownAzureCcr } = require('./azureCcrRunner');
    await teardownAzureCcr(model);
  }

  if (mode === 'oci-oke-job') {
    const { teardownOciCcr } = require('./ociCcrRunner');
    await teardownOciCcr(model);
  }

  if (mode === 'gcp-ccr') {
    const { teardownGcpCcr } = require('./gcpCcrRunner');
    await teardownGcpCcr(model);
  }

  if (handle?.child && typeof handle.child.kill === 'function') {
    try {
      handle.child.kill('SIGTERM');
    } catch (_) {
      // ignore
    }
  } else if (meta.local?.pid) {
    killPid(meta.local.pid);
  }

  unregisterTrainingProcess(plain.jobId);

  return { jobId: plain.jobId, status: 'CANCELLED', aborted: true };
}

async function abortActiveJobsForContract(contractId, reason = 'Contract ended') {
  const jobs = await db.TrainingJob.findAll({
    where: {
      contractId,
      status: { [Op.in]: ACTIVE_JOB_STATUSES },
    },
  });
  const results = [];
  for (const job of jobs) {
    results.push(await abortTrainingJob(job, reason));
  }
  return results;
}

module.exports = {
  ACTIVE_JOB_STATUSES,
  isActiveTrainingStatus,
  abortTrainingJob,
  abortActiveJobsForContract,
};
