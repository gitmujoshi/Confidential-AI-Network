const { Op } = require('sequelize');
const db = require('../models');
const TdcTrainingExecutionService = require('./tdcTrainingExecutionService');

function pickContractAuditFields(plainContract) {
  if (!plainContract) return null;
  return {
    contractId: plainContract.contractId,
    status: plainContract.status,
    depaId: plainContract.depaId,
    tdcDepaId: plainContract.tdc?.depaId ?? null,
    ccrpDepaId: plainContract.tsp?.depaId ?? null,
    legalDocumentHash: plainContract.legalDocumentHash,
    ricardianSignature: plainContract.ricardianSignature,
    tdcId: plainContract.tdcId,
    tspId: plainContract.tspId,
    tspCloudProvider: plainContract.tspCloudProvider,
    environmentSpecs: plainContract.environmentSpecs,
    trainingParams: plainContract.trainingParams,
    aiModelIds: plainContract.aiModelIds,
    contractDatasets: plainContract.contractDatasets,
    kmsConfigs: plainContract.kmsConfigs,
    legalDocumentPresent: !!(plainContract.legalDocument && typeof plainContract.legalDocument === 'object'),
    signatureCount: Array.isArray(plainContract.legalDocument?.signatures)
      ? plainContract.legalDocument.signatures.length
      : 0,
    createdAt: plainContract.createdAt,
    updatedAt: plainContract.updatedAt,
  };
}

/**
 * Single-job audit bundle (written to host outputs dir next to model.bin for local-docker).
 */
async function buildJobTrainingProvenanceBundle(jobId) {
  const jobRow = await db.TrainingJob.findOne({ where: { jobId: String(jobId) } });
  if (!jobRow) {
    const err = new Error('Training job not found');
    err.statusCode = 404;
    throw err;
  }
  const contract = await db.Contract.findOne({
    where: { contractId: String(jobRow.contractId) },
    include: [
      { model: db.User, as: 'tdc', attributes: ['id', 'depaId'] },
      { model: db.User, as: 'tsp', attributes: ['id', 'depaId'], required: false },
    ],
  });
  const trainingSvc = new TdcTrainingExecutionService();
  const job = trainingSvc.serializeJob(jobRow);
  const plain = jobRow.get({ plain: true });
  const meta = plain.metadata || {};
  const outDir = meta.local?.outDir || null;

  return {
    kind: 'training_job_provenance_bundle',
    generatedAt: new Date().toISOString(),
    jobId: String(jobId),
    jobDepaId: job.depaId || null,
    contractId: job.contractId,
    job,
    contract: contract ? pickContractAuditFields(contract.get({ plain: true })) : null,
    hostOutputs: outDir
      ? {
          outDir,
          files: {
            metrics: 'metrics.json',
            modelArtifact: 'model.bin',
            runnerLog: '../runner.log',
            provenanceReport: 'provenance-report.json',
          },
          note: 'Paths are on the backend host (not inside the trainer container). Container only sees /outputs.',
        }
      : null,
  };
}

/**
 * Build a contract-scoped audit bundle for compliance / incident review.
 * Authoritative detail lives on Contract, TrainingJob, AIModel; scitt_claims are event markers.
 */
async function buildProvenanceAuditReport(contractId, userId, { partyType } = {}) {
  const where =
    partyType === 'AppAdmin'
      ? { contractId: String(contractId) }
      : {
          contractId: String(contractId),
          [Op.or]: [{ tdcId: userId }, { tspId: userId }],
        };

  const contract = await db.Contract.findOne({
    where,
    include: [
      { model: db.User, as: 'tdc', attributes: ['id', 'depaId'] },
      { model: db.User, as: 'tsp', attributes: ['id', 'depaId'], required: false },
    ],
  });
  if (!contract) {
    const err = new Error('Contract not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  const plainContract = contract.get({ plain: true });

  const jobs = await db.TrainingJob.findAll({
    where: { contractId: String(contractId) },
    order: [['createdAt', 'ASC']],
  });
  const trainingSvc = new TdcTrainingExecutionService();
  const trainingJobs = jobs.map((j) => trainingSvc.serializeJob(j));

  const claims = await db.ScittClaim.findAll({
    where: { contractId: String(contractId) },
    order: [['createdAt', 'ASC']],
  });

  const models = await db.AIModel.findAll({
    where: db.sequelize.where(
      db.sequelize.fn('jsonb_extract_path_text', db.sequelize.col('metadata'), 'contractId'),
      String(contractId)
    ),
    order: [['createdAt', 'ASC']],
  });

  return {
    generatedAt: new Date().toISOString(),
    contractId: String(contractId),
    contract: pickContractAuditFields(plainContract),
    trainingJobs,
    scittClaims: claims.map((c) => {
      const p = c.get({ plain: true });
      return {
        claimId: p.claimId,
        claimType: p.claimType,
        status: p.status,
        claimData: p.claimData,
        createdAt: p.createdAt,
      };
    }),
    registeredModels: models.map((m) => {
      const p = m.get({ plain: true });
      return {
        id: p.id,
        modelId: p.modelId,
        depaId: p.metadata?.depaId ?? null,
        name: p.name,
        framework: p.framework,
        architecture: p.architecture,
        metadata: p.metadata,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    }),
    interpretation: {
      scittClaims:
        'Rows in scitt_claims are deduplicated, lightweight markers (who did what, when). Use contract + trainingJobs + registeredModels for full audit depth (datasets, metrics, lineage, artifacts).',
    },
  };
}

module.exports = {
  buildProvenanceAuditReport,
  buildJobTrainingProvenanceBundle,
};
