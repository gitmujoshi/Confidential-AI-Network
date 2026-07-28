/**
 * OKE Job training runner — OCI design path
 *
 * TRAINING_EXECUTION_MODE=oci | oci-oke-job
 *
 * Design: submit a Kubernetes batch/v1 Job in namespace cms-training using the
 * template from deployment/oci/helm/training (ConfigMap when enable_training=true).
 * Inputs/outputs use Object Storage buckets (enable_object_storage), not local disk.
 *
 * Live Job submission requires in-cluster kubeconfig on a real OKE apply.
 * When TRAINING_SIMULATION_MODE=true, completes the job locally for design demos.
 */

const db = require('../models');
const { writeLocalScittClaim } = require('./provenanceClaimWriter');
const { buildTrainingModelProvenance } = require('./tdcTrainingHelpers');
const { buildJobTrainingProvenanceBundle } = require('./provenanceAuditReportService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOkeJobTraining(opts) {
  const { jobId, contractId, containerSpec, trainingParams, inputs } = opts;
  const simulation =
    String(process.env.TRAINING_SIMULATION_MODE || '').toLowerCase() === 'true' ||
    process.env.TRAINING_SIMULATION_MODE === '1';

  const namespace = process.env.OCI_TRAINING_NAMESPACE || 'cms-training';
  const trainerImage =
    process.env.LOCAL_TRAINING_IMAGE ||
    process.env.OCI_TRAINER_IMAGE ||
    'iad.ocir.io/NAMESPACE/local-trainer:latest';

  const job = await db.TrainingJob.findOne({ where: { jobId } });
  if (!job) {
    throw new Error(`Training job not found: ${jobId}`);
  }

  await job.update({
    status: 'RUNNING',
    metadata: {
      ...(job.metadata || {}),
      executionMode: 'oci-oke-job',
      oke: { namespace, trainerImage },
      phases: [
        ...((job.metadata && job.metadata.phases) || []),
        { name: 'RUNNING', at: new Date().toISOString() },
      ],
    },
  });

  if (simulation) {
    await sleep(Number(process.env.OCI_OKE_JOB_SIM_MS || 1500));
    const results = {
      mode: 'oci-oke-job-simulation',
      namespace,
      trainerImage,
      objectStorage: {
        namespace: process.env.OCI_OBJECT_STORAGE_NAMESPACE || null,
        datasets: process.env.OCI_OBJECT_STORAGE_BUCKET_DATASETS || null,
        outputs: process.env.OCI_OBJECT_STORAGE_BUCKET_OUTPUTS || null,
      },
      note:
        'Design scaffold — no Kubernetes Job was submitted. Apply enable_training Terraform and in-cluster submitter for live OKE runs.',
      containerSpec,
      trainingParams: trainingParams || null,
      inputs: inputs || null,
    };

    const provenance = buildTrainingModelProvenance({
      contractId,
      jobId,
      results,
    });

    const latest = await db.TrainingJob.findOne({ where: { jobId } });
    await latest.update({
      status: 'COMPLETED',
      completedAt: new Date(),
      metadata: {
        ...(latest.metadata || {}),
        executionMode: 'oci-oke-job',
        simulation: true,
        progress: 100,
        results,
        provenance,
        phases: [
          ...((latest.metadata && latest.metadata.phases) || []),
          { name: 'COMPLETED', at: new Date().toISOString() },
        ],
      },
    });

    try {
      await writeLocalScittClaim({
        type: 'training.job.completed',
        contractId,
        jobId,
        payload: { mode: 'oci-oke-job-simulation' },
      });
      await buildJobTrainingProvenanceBundle(jobId);
    } catch (_) {
      /* optional */
    }
    return;
  }

  const errMessage =
    'TRAINING_EXECUTION_MODE=oci-oke-job requires Kubernetes Job submission on OKE. ' +
    'Enable Terraform module training (enable_training=true), deploy the Job template, ' +
    'or set TRAINING_SIMULATION_MODE=true for design/demo. See deployment/oci/helm/training/README.md';

  const latest = await db.TrainingJob.findOne({ where: { jobId } });
  await latest.update({
    status: 'FAILED',
    metadata: {
      ...(latest.metadata || {}),
      executionMode: 'oci-oke-job',
      error: errMessage,
      phases: [
        ...((latest.metadata && latest.metadata.phases) || []),
        { name: 'FAILED', at: new Date().toISOString(), error: errMessage },
      ],
    },
  });
  throw new Error(errMessage);
}

module.exports = {
  runOkeJobTraining,
};
