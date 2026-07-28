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

const path = require('path');
const fs = require('fs');
const os = require('os');
const db = require('../models');
const { writeLocalScittClaim } = require('./provenanceClaimWriter');
const { buildTrainingModelProvenance } = require('./tdcTrainingHelpers');
const { buildJobTrainingProvenanceBundle } = require('./provenanceAuditReportService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickEnvFromContract(job) {
  const envCfg = job.environmentConfig || {};
  const envSpecs = envCfg.environmentSpecs || {};
  const infra = envSpecs.infrastructure || {};
  const kms = envCfg.kmsConfigs || envSpecs.kms || {};
  const security = envSpecs.security || {};
  return { envCfg, envSpecs, infra, kms, security };
}

function buildOciRunnerLog({ jobId, contractId, infra, kms, objectStorage, spiffeId }) {
  const vaultOcid = kms.vaultOcid || kms.keyVault || kms.vaultId || 'n/a';
  const masterKey = kms.masterKeyOcid || kms.keyId || 'n/a';
  const lines = [
    `[oci-oke-job] contract=${contractId} job=${jobId}`,
    `[oci-oke-job] cloudProvider=${infra.cloudProvider || 'OCI'} region=${infra.region || 'n/a'}`,
    `[oci-oke-job] computeType=${infra.computeType || 'confidential-vm'} platform=${infra.platform || 'OCI Confidential Computing'}`,
    `[oci-oke-job] okeCluster=${infra.okeCluster || 'n/a'} ns=${infra.trainingNamespace || 'cms-training'}`,
    `[oci-oke-job] serviceAccount=${infra.serviceAccount || 'training-job-sa'}`,
    `[oci-oke-job] spiffeId=${spiffeId || 'n/a'}`,
    `[kms] provider=${kms.provider || kms.secretManager || 'OCI_VAULT'} vaultOcid=${vaultOcid}`,
    `[kms] masterKeyOcid=${masterKey}`,
    `[kms] awaiting key release: contract SIGNED + SPIFFE allowlist`,
    `[storage] namespace=${objectStorage.namespace || 'n/a'}`,
    `[storage] datasets=${objectStorage.datasets || 'n/a'} outputs=${objectStorage.outputs || 'n/a'}`,
    `[storage] artifacts=${objectStorage.artifacts || 'n/a'}`,
    `[wif] workload identity exchange for ${infra.serviceAccount || 'training-job-sa'} (design)`,
    `[trainer] ciphertext-in from Object Storage; no plaintext datasets on host`,
    `[trainer] epoch 1/3 loss=0.82`,
    `[trainer] epoch 2/3 loss=0.41`,
    `[trainer] epoch 3/3 loss=0.19`,
    `[kms] DEK/MEK release granted; writing encrypted artifacts`,
    `[oci-oke-job] COMPLETED outputs=${objectStorage.outputs || 'n/a'}/demo/outputs/`,
  ];
  return lines.join('\n') + '\n';
}

async function runOkeJobTraining(opts) {
  const { jobId, contractId, containerSpec, trainingParams, inputs } = opts;
  const simulation =
    String(process.env.TRAINING_SIMULATION_MODE || '').toLowerCase() === 'true' ||
    process.env.TRAINING_SIMULATION_MODE === '1';

  const job = await db.TrainingJob.findOne({ where: { jobId } });
  if (!job) {
    throw new Error(`Training job not found: ${jobId}`);
  }

  const { infra, kms, security } = pickEnvFromContract(job);
  const namespace =
    infra.trainingNamespace || process.env.OCI_TRAINING_NAMESPACE || 'cms-training';
  const trainerImage =
    process.env.LOCAL_TRAINING_IMAGE ||
    process.env.OCI_TRAINER_IMAGE ||
    'iad.ocir.io/NAMESPACE/local-trainer:latest';
  const objectStorage = {
    namespace:
      infra.objectStorage?.namespace || process.env.OCI_OBJECT_STORAGE_NAMESPACE || null,
    datasets:
      infra.objectStorage?.datasets || process.env.OCI_OBJECT_STORAGE_BUCKET_DATASETS || null,
    outputs:
      infra.objectStorage?.outputs || process.env.OCI_OBJECT_STORAGE_BUCKET_OUTPUTS || null,
    artifacts: infra.objectStorage?.artifacts || null,
  };
  const spiffeId = infra.spiffeId || null;

  await job.update({
    status: 'RUNNING',
    metadata: {
      ...(job.metadata || {}),
      executionMode: 'oci-oke-job',
      oke: {
        namespace,
        trainerImage,
        cluster: infra.okeCluster || null,
        serviceAccount: infra.serviceAccount || null,
        spiffeId,
      },
      phases: [
        ...((job.metadata && job.metadata.phases) || []),
        { name: 'RUNNING', at: new Date().toISOString() },
      ],
    },
  });

  if (simulation) {
    await sleep(Number(process.env.OCI_OKE_JOB_SIM_MS || 1500));
    const runnerLog = buildOciRunnerLog({
      jobId,
      contractId,
      infra,
      kms,
      objectStorage,
      spiffeId,
    });

    let logFile = null;
    try {
      const logDir = path.join(os.tmpdir(), 'can-oci-oke-logs');
      fs.mkdirSync(logDir, { recursive: true });
      logFile = path.join(logDir, `${jobId}.log`);
      fs.writeFileSync(logFile, runnerLog, 'utf8');
    } catch (_) {
      logFile = null;
    }

    const results = {
      mode: 'oci-oke-job-simulation',
      namespace,
      trainerImage,
      spiffeId,
      computeType: infra.computeType || 'confidential-vm',
      platform: infra.platform || 'OCI Confidential Computing',
      attestationProvider: security.attestationProvider || null,
      objectStorage: {
        ...objectStorage,
        outputsPrefix: objectStorage.outputs ? `${objectStorage.outputs}/demo/outputs/` : null,
      },
      kms: {
        provider: kms.provider || kms.secretManager || 'OCI_VAULT',
        vaultOcid: kms.vaultOcid || kms.keyVault || null,
        masterKeyOcid: kms.masterKeyOcid || kms.keyId || null,
        keyRelease: 'gated-on-SIGNED+SPIFFE',
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
        runnerLog,
        local: logFile ? { ...(latest.metadata?.local || {}), logFile } : latest.metadata?.local,
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
        payload: {
          mode: 'oci-oke-job-simulation',
          spiffeId,
          vaultOcid: results.kms.vaultOcid,
          computeType: results.computeType,
          objectStorageOutputs: results.objectStorage.outputsPrefix,
        },
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
