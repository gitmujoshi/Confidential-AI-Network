/**
 * TDC Training Execution — contract-scoped training jobs for Training Data Consumers.
 *
 * - Validates the contract (signed, TDC ownership, env + training params, datasets/models).
 * - Persists a TrainingJob with an explicit containerSpec snapshot (image, CPU/RAM, GPU, command, refs).
 * - Default: TRAINING_SIMULATION_MODE=true runs an async simulated pipeline (no cloud calls).
 * - Set TRAINING_SIMULATION_MODE=false to delegate to TrainingService.triggerTrainingRun (requires cloud + DB shape expected by that service).
 */

const { Op } = require('sequelize');
const db = require('../models');
const {
  slugModelId,
  mapFramework,
  mapModelType,
  mapPrivacyTechnique,
  isSimulationMode,
  buildContainerSpec,
} = require('./tdcTrainingHelpers');

async function loadContractForTraining(contractId) {
  return db.Contract.findOne({
    where: { contractId },
    include: [
      { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email'] },
      { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email'], required: false },
    ],
  });
}

function validateTdcCanTrain(contract, userId) {
  if (!contract) {
    const err = new Error('Contract not found');
    err.statusCode = 404;
    throw err;
  }
  if (contract.tdcId !== userId) {
    const err = new Error('Only the TDC (contract owner) can start training for this contract');
    err.statusCode = 403;
    throw err;
  }
  if (contract.status !== 'SIGNED') {
    const err = new Error(
      `Contract must be SIGNED before training (current: ${contract.status})`
    );
    err.statusCode = 400;
    throw err;
  }
  if (!contract.environmentSpecs || typeof contract.environmentSpecs !== 'object') {
    const err = new Error('Contract is missing environment specifications');
    err.statusCode = 400;
    throw err;
  }
  if (!contract.trainingParams || typeof contract.trainingParams !== 'object') {
    const err = new Error('Contract is missing training parameters');
    err.statusCode = 400;
    throw err;
  }
  if (!contract.ccrpCloudProvider) {
    const err = new Error('Contract is missing cloud provider (ccrpCloudProvider)');
    err.statusCode = 400;
    throw err;
  }
  const datasets = contract.contractDatasets;
  if (!Array.isArray(datasets) || datasets.length === 0) {
    const err = new Error('Contract must include at least one dataset in contractDatasets');
    err.statusCode = 400;
    throw err;
  }
  const models = contract.aiModelIds;
  if (!Array.isArray(models) || models.length === 0) {
    const err = new Error('Contract must include at least one AI model id in aiModelIds');
    err.statusCode = 400;
    throw err;
  }
}

async function assertNoConcurrentJob(contractId) {
  const active = await db.TrainingJob.findOne({
    where: {
      contractId,
      status: { [Op.in]: ['PENDING', 'PROVISIONING', 'RUNNING'] },
    },
  });
  if (active) {
    const err = new Error(
      `A training job is already active for this contract (${active.jobId})`
    );
    err.statusCode = 409;
    throw err;
  }
}

function scheduleSimulation(jobId, contract) {
  const containerSpec = buildContainerSpec(contract);
  const run = async () => {
    const job = await db.TrainingJob.findOne({ where: { jobId } });
    if (!job) return;

    const meta = (job.metadata && typeof job.metadata === 'object') ? { ...job.metadata } : {};
    meta.phases = meta.phases || [];
    meta.containerSpec = containerSpec;

    const pushPhase = (name) => {
      meta.phases.push({ name, at: new Date().toISOString() });
    };

    try {
      pushPhase('PROVISIONING');
      await job.update({
        status: 'PROVISIONING',
        metadata: { ...meta, progress: 15 },
      });

      await new Promise((r) => setTimeout(r, 1200));

      pushPhase('RUNNING');
      await job.update({
        status: 'RUNNING',
        startedAt: new Date(),
        metadata: { ...meta, progress: 45 },
      });

      await new Promise((r) => setTimeout(r, 1800));

      const epochs = contract.trainingParams?.maxEpochs || 10;
      const trainingResults = {
        accuracy: 0.92 + Math.random() * 0.06,
        loss: 0.02 + Math.random() * 0.05,
        epochsCompleted: epochs,
        privacyMetrics: {
          epsilon: contract.trainingParams?.differentialPrivacy ? 1.2 + Math.random() * 0.3 : null,
        },
        artifactUri: `simulated://training-artifacts/${jobId}/model.bin`,
        hyperparameters: {
          maxEpochs: contract.trainingParams?.maxEpochs,
          batchSize: contract.trainingParams?.batchSize,
          learningRate: contract.trainingParams?.learningRate,
        },
      };

      pushPhase('COMPLETED');
      meta.results = trainingResults;
      meta.progress = 100;
      meta.inference = {
        note:
          'Simulated run: register this artifact with your inference service or upload as a new model version when inference API is enabled.',
      };

      await job.update({
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: meta,
      });
    } catch (e) {
      console.error('Simulation training failed:', e);
      await db.TrainingJob.update(
        {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: e.message,
          metadata: { ...meta, progress: meta.progress || 0, error: e.message },
        },
        { where: { jobId } }
      );
    }
  };

  setImmediate(() => {
    run().catch((err) => console.error('scheduleSimulation error:', err));
  });
}

class TdcTrainingExecutionService {
  async startTrainingForContract(contractId, userId) {
    const contract = await loadContractForTraining(contractId);
    validateTdcCanTrain(contract, userId);
    await assertNoConcurrentJob(contractId);

    if (isSimulationMode()) {
      const jobId = `job-${contract.contractId}-${Date.now()}`;
      const containerSpec = buildContainerSpec(contract);

      await db.TrainingJob.create({
        jobId,
        contractId: contract.contractId,
        status: 'PENDING',
        trainingConfig: contract.trainingParams,
        environmentConfig: {
          environmentSpecs: contract.environmentSpecs,
          cloudProvider: contract.ccrpCloudProvider,
          containerSpec,
        },
        datasets: contract.contractDatasets,
        aiModels: contract.aiModelIds,
        metadata: {
          simulation: true,
          progress: 0,
          containerSpec,
          phases: [{ name: 'PENDING', at: new Date().toISOString() }],
        },
        createdBy: userId,
      });

      scheduleSimulation(jobId, contract);
      return this.getJobPublic(jobId);
    }

    const TrainingService = require('./trainingService');
    const trainingService = new TrainingService();
    const run = await trainingService.triggerTrainingRun(contractId);
    return this.serializeJob(run);
  }

  async listJobsForContract(contractId, userId) {
    const contract = await loadContractForTraining(contractId);
    validateTdcCanTrain(contract, userId);

    const jobs = await db.TrainingJob.findAll({
      where: { contractId },
      order: [['createdAt', 'DESC']],
    });
    return jobs.map((j) => this.serializeJob(j));
  }

  async getJobForUser(jobId, userId) {
    const job = await db.TrainingJob.findOne({ where: { jobId } });
    if (!job) {
      const err = new Error('Training job not found');
      err.statusCode = 404;
      throw err;
    }
    const contract = await loadContractForTraining(job.contractId);
    if (!contract || contract.tdcId !== userId) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
    return this.serializeJob(job);
  }

  async getJobPublic(jobId) {
    const j = await db.TrainingJob.findOne({ where: { jobId } });
    if (!j) {
      const err = new Error('Training job not found');
      err.statusCode = 404;
      throw err;
    }
    return this.serializeJob(j);
  }

  serializeJob(job) {
    const plain = job.get ? job.get({ plain: true }) : job;
    const meta = plain.metadata || {};
    const envCfg = plain.environmentConfig || {};
    const containerSpec = meta.containerSpec || envCfg.containerSpec || null;
    const trainingCfg = plain.trainingConfig || plain.trainingParams || null;
    return {
      jobId: plain.jobId,
      contractId: plain.contractId,
      status: plain.status,
      createdAt: plain.createdAt,
      startedAt: plain.startedAt,
      completedAt: plain.completedAt,
      failedAt: plain.failedAt,
      errorMessage: plain.errorMessage || plain.errorDetails,
      progress: meta.progress ?? plain.progress ?? null,
      containerSpec,
      trainingConfig: trainingCfg,
      environmentSummary: {
        cloudProvider: envCfg.cloudProvider || plain.cloudProvider || null,
      },
      results: meta.results || plain.results || null,
      phases: meta.phases || [],
      simulation: meta.simulation === true,
      inference: meta.inference || null,
      registeredModelId: meta.registeredModelId || null,
    };
  }

  /**
   * Register a completed training job as an AIModel row for contracts / inference flows.
   */
  async registerModelFromJob(jobId, userId, body = {}) {
    const job = await db.TrainingJob.findOne({ where: { jobId } });
    if (!job) {
      const err = new Error('Training job not found');
      err.statusCode = 404;
      throw err;
    }
    const contract = await loadContractForTraining(job.contractId);
    if (!contract || contract.tdcId !== userId) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
    if (job.status !== 'COMPLETED') {
      const err = new Error('Training job must be COMPLETED before registering a model');
      err.statusCode = 400;
      throw err;
    }

    const plain = job.get({ plain: true });
    const meta = plain.metadata || {};
    if (meta.registeredModelId) {
      const err = new Error(`Model already registered: ${meta.registeredModelId}`);
      err.statusCode = 409;
      throw err;
    }

    const results = meta.results || plain.results || {};
    const trainingCfg = plain.trainingConfig || plain.trainingParams || contract.trainingParams || {};
    const modelId = body.modelId || slugModelId(jobId);

    const existing = await db.AIModel.findOne({ where: { modelId } });
    if (existing) {
      const err = new Error(`AIModel with modelId already exists: ${modelId}`);
      err.statusCode = 409;
      throw err;
    }

    const name =
      body.name ||
      `Trained model (${contract.contractId.slice(0, 8)}…)`;
    const description =
      body.description ||
      `Output from training job ${jobId} on contract ${contract.contractId}.`;

    const framework = mapFramework(body.framework || trainingCfg.framework);
    const type = body.type || mapModelType(trainingCfg.architecture);
    const architecture =
      trainingCfg.architecture || body.architecture || 'unknown';
    const parameters =
      body.parameters ||
      (results && results.artifactUri
        ? `artifact: ${results.artifactUri}`
        : 'see metadata');

    const maxEpochs = parseInt(
      results?.epochsCompleted ?? trainingCfg.maxEpochs ?? 10,
      10
    );
    const batchSize = parseInt(trainingCfg.batchSize ?? 32, 10);
    const learningRate = parseFloat(trainingCfg.learningRate ?? 0.001);

    const validationMetrics = [
      {
        name: 'accuracy',
        value: results.accuracy,
        source: 'training_job',
        jobId,
      },
      {
        name: 'loss',
        value: results.loss,
        source: 'training_job',
        jobId,
      },
    ].filter((m) => m.value !== undefined && m.value !== null);

    const model = await db.AIModel.create({
      modelId,
      name,
      description,
      type,
      architecture: String(architecture).slice(0, 255),
      parameters: String(parameters).slice(0, 255),
      framework,
      privacyTechnique: mapPrivacyTechnique(trainingCfg),
      validationMetrics:
        validationMetrics.length > 0
          ? validationMetrics
          : [{ name: 'status', value: 'completed', jobId }],
      maxEpochs: Number.isFinite(maxEpochs) ? maxEpochs : 10,
      batchSize: Number.isFinite(batchSize) ? batchSize : 32,
      learningRate: Number.isFinite(learningRate) ? learningRate : 0.001,
      isActive: true,
      metadata: {
        source: 'tdc_training_job',
        trainingJobId: jobId,
        contractId: contract.contractId,
        trainingResults: results,
        containerSpec: meta.containerSpec || plain.environmentConfig?.containerSpec,
        registeredAt: new Date().toISOString(),
        ...body.metadata,
      },
    });

    const nextMeta = {
      ...meta,
      registeredModelId: model.modelId,
      registeredAt: new Date().toISOString(),
    };
    await job.update({ metadata: nextMeta });

    return {
      modelId: model.modelId,
      id: model.id,
      name: model.name,
      framework: model.framework,
      metadata: model.metadata,
    };
  }
}

module.exports = TdcTrainingExecutionService;
