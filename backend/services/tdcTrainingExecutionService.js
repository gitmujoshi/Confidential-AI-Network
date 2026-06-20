/**
 * TDC Training Execution — contract-scoped training jobs for Training Data Consumers.
 *
 * - Validates the contract (signed, TDC ownership, env + training params, datasets/models).
 * - Persists a TrainingJob with an explicit containerSpec snapshot (image, CPU/RAM, GPU, command, refs).
 * - Default: TRAINING_SIMULATION_MODE=false uses TrainingService.triggerTrainingRun (requires cloud + DB shape expected by that service).
 * - Set TRAINING_SIMULATION_MODE=true to run an async simulated pipeline (no cloud calls).
 */

const { Op } = require('sequelize');
const db = require('../models');
const DEPAIdService = require('./depaIdService');
const depaIdService = new DEPAIdService();
const {
  slugModelId,
  mapFramework,
  mapModelType,
  mapPrivacyTechnique,
  isSimulationMode,
  buildContainerSpec,
  buildTrainingModelProvenance,
} = require('./tdcTrainingHelpers');
const {
  loadContractForTraining,
  hydrateContractDatasetsForTraining,
  expandContractTrainingInputs,
  shapeInputsForLocalTrainerContainer,
} = require('./contractTrainingInputsService');
const { stageDatasetsForLocalJob } = require('./datasetArtifactStaging');

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
  if (!contract.tspCloudProvider) {
    const err = new Error('Contract is missing cloud provider (tspCloudProvider)');
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
      const provSim = buildTrainingModelProvenance(
        meta.inputs || null,
        trainingResults
      );
      trainingResults.modelProvenance =
        provSim && typeof provSim === 'object'
          ? { ...provSim, trainingJobDepaId: meta.depaId || null }
          : meta.depaId
            ? { trainingJobDepaId: meta.depaId }
            : provSim;

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
    await hydrateContractDatasetsForTraining(contract);
    await assertNoConcurrentJob(contractId);

    if (isSimulationMode()) {
      const jobId = `job-${contract.contractId}-${Date.now()}`;
      const containerSpec = buildContainerSpec(contract);
      const inputs = shapeInputsForLocalTrainerContainer(await expandContractTrainingInputs(contract));

      const jobDepaId = depaIdService.generateTrainingJobDEPAId();
      await db.TrainingJob.create({
        jobId,
        contractId: contract.contractId,
        status: 'PENDING',
        trainingConfig: contract.trainingParams,
        environmentConfig: {
          environmentSpecs: contract.environmentSpecs,
          cloudProvider: contract.tspCloudProvider,
          containerSpec,
        },
        datasets: contract.contractDatasets,
        aiModels: contract.aiModelIds,
        metadata: {
          depaId: jobDepaId,
          simulation: true,
          progress: 0,
          containerSpec,
          phases: [{ name: 'PENDING', at: new Date().toISOString() }],
          inputs,
        },
        createdBy: userId,
      });

      scheduleSimulation(jobId, contract);
      return this.getJobPublic(jobId);
    }

    // Native PyTorch on Apple Silicon (host venv — same train.py as Docker, MPS + Opacus DP on CPU).
    if (process.env.TRAINING_EXECUTION_MODE === 'local-native') {
      const { isAppleSiliconMac, runLocalNativeTraining } = require('./localNativeTrainingRunner');
      if (!isAppleSiliconMac()) {
        throw new Error(
          'TRAINING_EXECUTION_MODE=local-native requires Apple Silicon macOS (arm64). Use local-docker on Linux/CI.'
        );
      }

      const jobId = `job-${contract.contractId}-${Date.now()}`;
      const containerSpec = buildContainerSpec(contract);
      let inputs = shapeInputsForLocalTrainerContainer(await expandContractTrainingInputs(contract));
      inputs = await stageDatasetsForLocalJob(jobId, inputs);

      const jobDepaId = depaIdService.generateTrainingJobDEPAId();
      await db.TrainingJob.create({
        jobId,
        contractId: contract.contractId,
        status: 'PENDING',
        trainingConfig: contract.trainingParams,
        environmentConfig: {
          environmentSpecs: contract.environmentSpecs,
          cloudProvider: contract.tspCloudProvider,
          containerSpec,
        },
        datasets: contract.contractDatasets,
        aiModels: contract.aiModelIds,
        metadata: {
          depaId: jobDepaId,
          simulation: false,
          progress: 0,
          containerSpec,
          phases: [{ name: 'PENDING', at: new Date().toISOString() }],
          executionMode: 'local-native',
          inputs,
        },
        createdBy: userId,
      });

      setImmediate(() => {
        runLocalNativeTraining({
          jobId,
          contractId: contract.contractId,
          containerSpec,
          trainingParams: contract.trainingParams,
        });
      });

      return this.getJobPublic(jobId);
    }

    // Native MLX on Apple Silicon (host venv — uses GPU; no Docker).
    if (process.env.TRAINING_EXECUTION_MODE === 'local-mlx') {
      const { isAppleSiliconMac, runLocalMlxTraining } = require('./localMlxTrainingRunner');
      if (!isAppleSiliconMac()) {
        throw new Error(
          'TRAINING_EXECUTION_MODE=local-mlx requires Apple Silicon macOS (arm64). Use local-docker on Linux/CI.'
        );
      }
      const dpEnabled =
        contract.trainingParams?.differentialPrivacy?.enabled === true ||
        String(contract.trainingParams?.privacyTechnique || '')
          .toLowerCase()
          .includes('differential');
      if (dpEnabled) {
        throw new Error(
          'Differential privacy (Opacus) requires TRAINING_EXECUTION_MODE=local-docker. MLX path does not support DP-SGD yet.'
        );
      }

      const jobId = `job-${contract.contractId}-${Date.now()}`;
      const containerSpec = buildContainerSpec(contract);
      let inputs = shapeInputsForLocalTrainerContainer(await expandContractTrainingInputs(contract));
      inputs = await stageDatasetsForLocalJob(jobId, inputs);

      const jobDepaId = depaIdService.generateTrainingJobDEPAId();
      await db.TrainingJob.create({
        jobId,
        contractId: contract.contractId,
        status: 'PENDING',
        trainingConfig: contract.trainingParams,
        environmentConfig: {
          environmentSpecs: contract.environmentSpecs,
          cloudProvider: contract.tspCloudProvider,
          containerSpec,
        },
        datasets: contract.contractDatasets,
        aiModels: contract.aiModelIds,
        metadata: {
          depaId: jobDepaId,
          simulation: false,
          progress: 0,
          containerSpec,
          phases: [{ name: 'PENDING', at: new Date().toISOString() }],
          executionMode: 'local-mlx',
          inputs,
        },
        createdBy: userId,
      });

      setImmediate(() => {
        runLocalMlxTraining({
          jobId,
          contractId: contract.contractId,
          containerSpec,
          trainingParams: contract.trainingParams,
        });
      });

      return this.getJobPublic(jobId);
    }

    // Local Docker execution mode (runs training in a separate container on the backend host).
    if (process.env.TRAINING_EXECUTION_MODE === 'local-docker') {
      const jobId = `job-${contract.contractId}-${Date.now()}`;
      const containerSpec = buildContainerSpec(contract);
      let inputs = shapeInputsForLocalTrainerContainer(await expandContractTrainingInputs(contract));
      inputs = await stageDatasetsForLocalJob(jobId, inputs);

      const jobDepaId = depaIdService.generateTrainingJobDEPAId();
      await db.TrainingJob.create({
        jobId,
        contractId: contract.contractId,
        status: 'PENDING',
        trainingConfig: contract.trainingParams,
        environmentConfig: {
          environmentSpecs: contract.environmentSpecs,
          cloudProvider: contract.tspCloudProvider,
          containerSpec,
        },
        datasets: contract.contractDatasets,
        aiModels: contract.aiModelIds,
        metadata: {
          depaId: jobDepaId,
          simulation: false,
          progress: 0,
          containerSpec,
          phases: [{ name: 'PENDING', at: new Date().toISOString() }],
          executionMode: 'local-docker',
          inputs,
        },
        createdBy: userId,
      });

      const { runLocalDockerTraining } = require('./localDockerTrainingRunner');
      setImmediate(() => {
        runLocalDockerTraining({
          jobId,
          contractId: contract.contractId,
          containerSpec,
          trainingParams: contract.trainingParams,
        });
      });

      // Intentionally no local `training_started` SCITT row: TrainingJob + API are the source of truth
      // and a separate claim duplicated training_completed payloads.

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

  /**
   * UI helper: whether each catalog dataset has uploaded artifacts for physical local-docker training.
   */
  async getTrainingReadiness(contractId, userId) {
    const contract = await loadContractForTraining(contractId);
    if (!contract || contract.tdcId !== userId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    await hydrateContractDatasetsForTraining(contract);
    const bundle = await expandContractTrainingInputs(contract);
    const datasets = bundle.datasets || [];

    const details = datasets.map((d) => ({
      datasetId: d.datasetId,
      name: d.name,
      hasArtifacts: Number(d.artifactFileCount || 0) > 0,
      artifactFileCount: Number(d.artifactFileCount || 0),
      contentFormat: d.contentFormat || null,
    }));

    const physicalTrainingReady =
      details.length > 0 && details.every((x) => x.hasArtifacts);
    const missingArtifactDatasetIds = details
      .filter((x) => !x.hasArtifacts)
      .map((x) => x.datasetId);

    const localDocker = process.env.TRAINING_EXECUTION_MODE === 'local-docker';
    const simulation = process.env.TRAINING_SIMULATION_MODE === 'true';

    return {
      contractId,
      signed: contract.status === 'SIGNED',
      physicalTrainingReady,
      missingArtifactDatasetIds,
      datasets: details,
      localDockerMode: localDocker,
      simulationMode: simulation,
      warning:
        localDocker && contract.status === 'SIGNED' && !physicalTrainingReady
          ? 'Upload training files for every dataset (TDP → dataset detail) or local-docker will fall back to built-in demo data.'
          : null,
    };
  }

  serializeJob(job) {
    const plain = job.get ? job.get({ plain: true }) : job;
    const meta = plain.metadata || {};
    const envCfg = plain.environmentConfig || {};
    const containerSpec = meta.containerSpec || envCfg.containerSpec || null;
    const trainingCfg = plain.trainingConfig || plain.trainingParams || null;
    const results = meta.results || plain.results || null;
    const modelProvenanceBase = buildTrainingModelProvenance(meta.inputs || null, results);
    const modelProvenance =
      modelProvenanceBase && typeof modelProvenanceBase === 'object'
        ? {
            ...modelProvenanceBase,
            trainingJobDepaId: meta.depaId || null,
          }
        : meta.depaId
          ? { trainingJobDepaId: meta.depaId }
          : null;
    const artifactDownloadUrl =
      meta?.executionMode === 'local-docker' && meta?.local?.outDir
        ? `/api/tdc/training/jobs/${encodeURIComponent(String(plain.jobId))}/artifact`
        : null;
    const provenanceReportUrl = `/api/tdc/training/jobs/${encodeURIComponent(String(plain.jobId))}/provenance-report`;
    return {
      jobId: plain.jobId,
      depaId: meta.depaId || null,
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
      results,
      modelProvenance,
      artifactDownloadUrl,
      provenanceReportUrl,
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
    await hydrateContractDatasetsForTraining(contract);
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
    const shapedFallback = shapeInputsForLocalTrainerContainer(
      await expandContractTrainingInputs(contract)
    );
    const modelProvenance =
      buildTrainingModelProvenance(meta.inputs || null, results) ||
      buildTrainingModelProvenance(shapedFallback, results);
    const modelId = body.modelId || slugModelId(jobId);

    const existing = await db.AIModel.findOne({ where: { modelId } });
    if (existing) {
      const err = new Error(`AIModel with modelId already exists: ${modelId}`);
      err.statusCode = 409;
      throw err;
    }

    const modelDepaId = depaIdService.generateAIModelDEPAId();

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
    const provSummary =
      modelProvenance && modelProvenance.datasetCount != null
        ? `datasets=${modelProvenance.datasetCount}`
        : '';

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
      parameters: String(
        [parameters, provSummary].filter(Boolean).join(' | ')
      ).slice(0, 255),
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
        ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}),
        depaId: modelDepaId,
        source: 'tdc_training_job',
        trainingJobId: jobId,
        trainingJobDepaId: meta.depaId || null,
        contractId: contract.contractId,
        contractDepaId: contract.depaId || null,
        trainingResults: results,
        modelProvenance,
        containerSpec: meta.containerSpec || plain.environmentConfig?.containerSpec,
        registeredAt: new Date().toISOString(),
      },
    });

    const nextMeta = {
      ...meta,
      registeredModelId: model.modelId,
      registeredAt: new Date().toISOString(),
    };
    await job.update({ metadata: nextMeta });

    // Provenance claim (best-effort).
    try {
      const { writeLocalScittClaim } = require('./provenanceClaimWriter');
      await writeLocalScittClaim({
        contractId: contract.contractId,
        claimType: 'model_registered',
        claimData: {
          contractId: contract.contractId,
          contractDepaId: contract.depaId || null,
          jobId,
          trainingJobDepaId: meta.depaId || null,
          registeredModelId: model.modelId,
          modelDepaId,
          timestamp: new Date().toISOString(),
          source: 'tdcTrainingExecutionService.registerModelFromJob',
          note: 'Lineage + metrics are on AIModel.metadata.modelProvenance; this claim is an index only.',
        },
        status: 'SUBMITTED',
        stableDedupeKey: jobId,
      });
    } catch (e) {
      console.warn('⚠️ Failed to write model_registered SCITT claim:', e.message);
    }

    return {
      modelId: model.modelId,
      depaId: modelDepaId,
      id: model.id,
      name: model.name,
      framework: model.framework,
      metadata: model.metadata,
    };
  }
}

module.exports = TdcTrainingExecutionService;
