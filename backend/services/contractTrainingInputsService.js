/**
 * Resolve catalog-backed datasets and AI models for a contract and shape payloads
 * for local trainers (Docker mount contract.json) and TrainingJob.metadata.inputs.
 */

const { Op } = require('sequelize');
const db = require('../models');

const hfIntegration = require('./huggingfaceIntegrationService');

async function loadContractForTraining(contractId) {
  return db.Contract.findOne({
    where: { contractId },
    include: [
      { model: db.User, as: 'tdc', attributes: ['id', 'name', 'email', 'depaId'] },
      { model: db.User, as: 'ccrp', attributes: ['id', 'name', 'email', 'depaId'], required: false },
    ],
  });
}

/**
 * When contractDatasets is empty but primary datasetId is set (single-dataset contracts),
 * populate contractDatasets so expandContractTrainingInputs can resolve catalog rows.
 */
async function hydrateContractDatasetsForTraining(contract) {
  if (!contract) return contract;

  let cds = contract.contractDatasets;
  if (typeof cds === 'string') {
    try {
      cds = JSON.parse(cds);
    } catch {
      cds = [];
    }
  }
  if (Array.isArray(cds) && cds.length > 0) return contract;

  const pk = contract.datasetId || contract.primaryDatasetId;
  if (!pk) return contract;

  const dataset = await db.Dataset.findOne({
    where: { id: pk },
    include: [
      {
        model: db.User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'depaId', 'walletAddress', 'did'],
        required: false,
      },
    ],
  });
  if (!dataset) return contract;

  const owner = dataset.owner;
  const row = [
    {
      datasetId: dataset.datasetId,
      datasetName: dataset.name,
      description: dataset.description,
      category: dataset.category,
      size: dataset.size,
      recordCount: dataset.recordCount,
      license: dataset.license,
      tags: dataset.tags || [],
      depaId: dataset.depaId,
      individualPrice: contract.price,
      tdpId: owner?.id || dataset.ownerId,
      tdpName: owner?.name,
      tdp: owner
        ? {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            depaId: owner.depaId,
            walletAddress: owner.walletAddress,
            did: owner.did,
          }
        : undefined,
    },
  ];

  if (typeof contract.setDataValue === 'function') {
    contract.setDataValue('contractDatasets', row);
  } else {
    contract.contractDatasets = row;
  }
  return contract;
}

async function expandContractTrainingInputs(contract) {
  const datasetSelections = Array.isArray(contract.contractDatasets) ? contract.contractDatasets : [];
  const datasetIds = datasetSelections
    .map((d) => d?.datasetId)
    .filter((v) => v !== undefined && v !== null && String(v).length > 0);

  const modelIdsRaw = Array.isArray(contract.aiModelIds) ? contract.aiModelIds : [];
  const modelIds = modelIdsRaw.filter((v) => v !== undefined && v !== null);
  const numericModelIds = modelIds
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((v) => Number.isFinite(v) && v > 0);
  const hasNumericModelIds = numericModelIds.length > 0 && numericModelIds.length === modelIds.length;

  const [datasets, models] = await Promise.all([
    datasetIds.length > 0
      ? db.Dataset.findAll({
          where: { datasetId: { [Op.in]: datasetIds } },
          attributes: [
            'datasetId',
            'depaId',
            'name',
            'description',
            'category',
            'size',
            'recordCount',
            'price',
            'license',
            'tags',
            'metadata',
            'isPublic',
            'confidentialComputingRequired',
            'ownerId',
            'storageBackend',
            'artifactFileCount',
            'artifactTotalBytes',
            'contentFormat',
            'artifactsUpdatedAt',
          ],
        })
      : Promise.resolve([]),
    modelIds.length > 0
      ? db.AIModel.findAll({
          where: hasNumericModelIds
            ? { id: { [Op.in]: numericModelIds } }
            : { modelId: { [Op.in]: modelIds.map(String) } },
          attributes: [
            'id',
            'modelId',
            'name',
            'description',
            'type',
            'architecture',
            'parameters',
            'framework',
            'privacyTechnique',
            'validationMetrics',
            'maxEpochs',
            'batchSize',
            'learningRate',
            'metadata',
            'isActive',
          ],
        })
      : Promise.resolve([]),
  ]);

  return {
    contract: {
      contractId: contract.contractId,
      contractDepaId: contract.depaId || null,
      status: contract.status,
      tdcId: contract.tdcId,
      tdcDepaId: contract.tdc?.depaId || null,
      ccrpId: contract.ccrpId,
      ccrpDepaId: contract.ccrp?.depaId || null,
      ccrpCloudProvider: contract.ccrpCloudProvider,
      environmentSpecs: contract.environmentSpecs,
      trainingParams: contract.trainingParams,
      kmsConfigs: contract.kmsConfigs,
    },
    datasets: datasets.map((d) => d.get({ plain: true })),
    models: models.map((m) => m.get({ plain: true })),
    datasetSelections,
    aiModelIds: modelIds,
  };
}

/** Align trainingParams with catalog hints for backend/local-training/train.py */
function shapeInputsForLocalTrainerContainer(bundle) {
  const datasets = bundle.datasets || [];
  const models = bundle.models || [];
  const contractBlock = { ...bundle.contract };
  const tp = { ...(contractBlock.trainingParams || {}) };

  if (!tp.taskType && !tp.task && datasets[0]?.category) {
    const cat = datasets[0].category;
    if (cat === 'Computer Vision') tp.taskType = 'vision';
    else if (cat === 'Natural Language Processing') tp.taskType = 'text';
    else if (cat === 'Tabular') tp.taskType = 'tabular';
    else if (cat === 'Audio') tp.taskType = 'text';
    else if (cat === 'Multimodal') tp.taskType = 'vision';
  }

  const firstModel = models[0];
  if (firstModel) {
    if (tp.maxEpochs == null && firstModel.maxEpochs != null) tp.maxEpochs = firstModel.maxEpochs;
    if (tp.architecture == null && firstModel.architecture) tp.architecture = firstModel.architecture;
    if (tp.framework == null && firstModel.framework) tp.framework = firstModel.framework;
    if (tp.taskType == null && tp.task == null) {
      const t = String(firstModel.type || '').toLowerCase();
      const arch = String(firstModel.architecture || '').toLowerCase();
      if (t === 'cnn' || arch.includes('resnet') || arch.includes('conv')) tp.taskType = 'vision';
      else if (t === 'transformer' || arch.includes('bert') || arch.includes('gpt')) tp.taskType = 'text';
    }
  }

  contractBlock.trainingParams = tp;

  const datasetsWithHints = datasets.map((d) => {
    const row = { ...d };
    const fmt =
      row.contentFormat ||
      (row.category === 'Tabular' ? 'csv' : null) ||
      (String(row.category || '').includes('Vision') ? 'image_folder' : null);
    if (fmt) {
      row.dataFormat = fmt;
    }
    row.hasArtifacts = Number(row.artifactFileCount || 0) > 0;
    return hfIntegration.attachHfToRow(row, 'dataset');
  });

  const modelsWithHf = models.map((m) => hfIntegration.attachHfToRow(m, 'model'));

  return {
    contract: contractBlock,
    datasets: datasetsWithHints,
    models: modelsWithHf,
    datasetSelections: bundle.datasetSelections,
    aiModelIds: bundle.aiModelIds,
  };
}

async function buildCanTrainingJobInputs(contractId) {
  const contract = await loadContractForTraining(contractId);
  if (!contract) {
    return {
      contract: { contractId: String(contractId), trainingParams: {}, environmentSpecs: null },
      datasets: [],
      models: [],
      datasetSelections: [],
      aiModelIds: [],
    };
  }

  await hydrateContractDatasetsForTraining(contract);
  const bundle = await expandContractTrainingInputs(contract);
  return shapeInputsForLocalTrainerContainer(bundle);
}

module.exports = {
  loadContractForTraining,
  hydrateContractDatasetsForTraining,
  expandContractTrainingInputs,
  shapeInputsForLocalTrainerContainer,
  buildCanTrainingJobInputs,
};
