/**
 * Shared helpers for dev DB scripts that purge DEPA-scoped rows and reseed US-EAST baselines.
 */
const { Op } = require('sequelize');

/** UUID tail matching backend depaIdService legacy / prefixed IDs. */
const GUID_TAIL = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

async function destroyRelatedToContracts(db, intIds, stringIds, transaction) {
  if (stringIds.length) {
    await db.TrainingJob.destroy({ where: { contractId: stringIds }, transaction });
    await db.ScittClaim.destroy({ where: { contractId: stringIds }, transaction });
    await db.SigningRequest.destroy({ where: { contractId: stringIds }, transaction });
  }
  if (intIds.length) {
    await db.Signature.destroy({ where: { contractId: intIds }, transaction });
    await db.SigningEvent.destroy({ where: { contractId: intIds }, transaction });
  }
  if (intIds.length) {
    await db.Contract.destroy({ where: { id: intIds }, transaction });
  }
}

async function seedUsEastBaselines(db, depaIdService, transaction, metaTag) {
  const prefix = depaIdService.deploymentPrefix;
  const ts = Date.now();

  let tdp = await db.User.findOne({
    where: { partyType: 'TDP' },
    order: [['id', 'ASC']],
    transaction,
  });
  if (!tdp) {
    tdp = await db.User.create(
      {
        name: 'US East Seed TDP',
        email: `tdp.useast.seed.${ts}@test.com`,
        partyType: 'TDP',
        isRegistered: true,
        isActive: true,
        depaId: depaIdService.generateUserDEPAId('TDP'),
      },
      { transaction }
    );
    console.log(`  + Created TDP ${tdp.email} (${tdp.depaId})`);
  }

  let tdc = await db.User.findOne({
    where: { partyType: 'TDC' },
    order: [['id', 'ASC']],
    transaction,
  });
  if (!tdc) {
    tdc = await db.User.create(
      {
        name: 'US East Seed TDC',
        email: `tdc.useast.seed.${ts}@test.com`,
        partyType: 'TDC',
        isRegistered: true,
        isActive: true,
        depaId: depaIdService.generateUserDEPAId('TDC'),
      },
      { transaction }
    );
    console.log(`  + Created TDC ${tdc.email} (${tdc.depaId})`);
  }

  let ccrp = await db.User.findOne({
    where: { partyType: 'CCRP' },
    order: [['id', 'ASC']],
    transaction,
  });
  if (!ccrp) {
    ccrp = await db.User.create(
      {
        name: 'US East Seed CCRP',
        email: `ccrp.useast.seed.${ts}@test.com`,
        partyType: 'CCRP',
        isRegistered: true,
        isActive: true,
        depaId: depaIdService.generateUserDEPAId('CCRP'),
      },
      { transaction }
    );
    console.log(`  + Created CCRP ${ccrp.email} (${ccrp.depaId})`);
  }

  const usEastDatasetCount = await db.Dataset.count({
    where: { depaId: { [Op.iLike]: `${prefix}-DATASET-%` } },
    transaction,
  });
  if (usEastDatasetCount < 2) {
    const d1 = await db.Dataset.create(
      {
        datasetId: `IMAGENET-SEED-${ts}`,
        depaId: depaIdService.generateDEPAId('DATASET'),
        name: 'ImageNet-Enhanced',
        description: 'Seed dataset for UI dropdowns and demos (US East deployment).',
        category: 'Computer Vision',
        size: 150000,
        recordCount: 1500000,
        price: 5000,
        license: 'Commercial License',
        tags: ['computer-vision', 'seed'],
        metadata: { seededBy: metaTag, region: prefix },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdp.id,
      },
      { transaction }
    );
    console.log(`  + Dataset ${d1.name} (${d1.depaId})`);

    const d2 = await db.Dataset.create(
      {
        datasetId: `MNIST-SEED-${ts}`,
        depaId: depaIdService.generateDEPAId('DATASET'),
        name: 'MNIST Handwritten Digits (Seed)',
        description: 'Public-style MNIST seed for training workflows.',
        category: 'Computer Vision',
        size: 60,
        recordCount: 70000,
        price: 100,
        license: 'MNIST',
        tags: ['mnist', 'seed'],
        metadata: { datasetType: 'MNIST', seededBy: metaTag },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdp.id,
      },
      { transaction }
    );
    console.log(`  + Dataset ${d2.name} (${d2.depaId})`);
  }

  const usEastModelCount = await db.AIModel.count({
    where: { depaId: { [Op.iLike]: `${prefix}-AIMODEL-%` } },
    transaction,
  });
  if (usEastModelCount < 2) {
    const m1 = await db.AIModel.create(
      {
        modelId: `MODEL-MNIST-CNN-${ts}`,
        depaId: depaIdService.generateAIModelDEPAId(),
        name: 'MNIST CNN (Seed)',
        description: 'Seed CNN for MNIST-style training.',
        type: 'cnn',
        architecture: 'mnist-cnn',
        parameters: 'seed',
        framework: 'PyTorch',
        privacyTechnique: 'differential-privacy',
        validationMetrics: [{ name: 'accuracy', value: 0.9 }],
        maxEpochs: 5,
        batchSize: 32,
        learningRate: 0.001,
        metadata: { seededBy: metaTag, task: 'mnist' },
        isActive: true,
      },
      { transaction }
    );
    console.log(`  + AIModel ${m1.name} (${m1.depaId})`);

    const m2 = await db.AIModel.create(
      {
        modelId: `MODEL-RESNET-SEED-${ts}`,
        depaId: depaIdService.generateAIModelDEPAId(),
        name: 'ResNet-50 (Seed)',
        description: 'Seed vision backbone for contract/training demos.',
        type: 'cnn',
        architecture: 'resnet-50',
        parameters: '25M',
        framework: 'PyTorch',
        privacyTechnique: 'none',
        validationMetrics: [{ name: 'accuracy', value: 0.85 }],
        maxEpochs: 10,
        batchSize: 16,
        learningRate: 0.0001,
        metadata: { seededBy: metaTag },
        isActive: true,
      },
      { transaction }
    );
    console.log(`  + AIModel ${m2.name} (${m2.depaId})`);
  }

  console.log(`✅ Reseed complete (prefix=${prefix}).`);
}

module.exports = {
  GUID_TAIL,
  destroyRelatedToContracts,
  seedUsEastBaselines,
};
