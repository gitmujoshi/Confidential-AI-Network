#!/usr/bin/env node
/**
 * Dev utility: delete all contracts (and related training jobs / SCITT claims)
 * and ensure dropdown-backed data exists (datasets, AI models, CCRPs).
 *
 * Intended for LOCAL development only.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../config.env') });
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../secrets.env') });
} catch (_) {}

const db = require('../../models');
const DEPAIdService = require('../../services/depaIdService');
const depaIdService = new DEPAIdService();

async function ensureDropdownData(t) {
  // Ensure at least one CCRP exists (for selector).
  const ccrpCount = await db.User.count({ where: { partyType: 'CCRP' }, transaction: t });
  if (ccrpCount === 0) {
    await db.User.create(
      {
        name: 'Local CCRP',
        email: `ccrp.local.${Date.now()}@test.com`,
        partyType: 'CCRP',
        isRegistered: true,
        isActive: true,
        depaId: depaIdService.generateUserDEPAId('CCRP'),
      },
      { transaction: t }
    );
  }

  // Ensure at least one TDP exists (dataset owner for dropdowns).
  const tdpCount = await db.User.count({ where: { partyType: 'TDP' }, transaction: t });
  let tdp = await db.User.findOne({ where: { partyType: 'TDP' }, order: [['id', 'ASC']], transaction: t });
  if (tdpCount === 0 || !tdp) {
    tdp = await db.User.create(
      {
        name: 'Local TDP',
        email: `tdp.local.${Date.now()}@test.com`,
        partyType: 'TDP',
        isRegistered: true,
        isActive: true,
        depaId: depaIdService.generateUserDEPAId('TDP'),
      },
      { transaction: t }
    );
  }

  // Ensure datasets exist.
  const datasetCount = await db.Dataset.count({ transaction: t });
  if (datasetCount === 0) {
    await db.Dataset.create(
      {
        datasetId: `MNIST-HANDWRITTEN-SEED-${Date.now()}`,
        depaId: depaIdService.generateDEPAId('DATASET'),
        name: 'MNIST Handwritten Digits (Seed)',
        description: 'Seed dataset for dropdowns and quick local demos.',
        category: 'Computer Vision',
        size: 60,
        recordCount: 70000,
        price: 100,
        license: 'MNIST',
        tags: ['mnist', 'seed', 'public'],
        metadata: { datasetType: 'MNIST', seededBy: 'reset-contracts-and-dropdowns' },
        isPublic: true,
        confidentialComputingRequired: false,
        ownerId: tdp.id,
      },
      { transaction: t }
    );
  }

  // Ensure at least one AI model exists.
  const aiModelCount = await db.AIModel.count({ transaction: t });
  if (aiModelCount === 0) {
    await db.AIModel.create(
      {
        modelId: `MODEL-SEED-${Date.now()}`,
        depaId: depaIdService.generateDEPAId('AIMODEL'),
        name: 'MNIST CNN (Seed)',
        description: 'Seed model for dropdowns and quick local demos.',
        type: 'cnn',
        architecture: 'mnist-cnn',
        parameters: 'seed',
        framework: 'PyTorch',
        privacyTechnique: 'differential-privacy',
        validationMetrics: [{ name: 'accuracy', value: 0.9 }],
        maxEpochs: 5,
        batchSize: 32,
        learningRate: 0.001,
        metadata: { seededBy: 'reset-contracts-and-dropdowns', task: 'mnist' },
        isActive: true,
      },
      { transaction: t }
    );
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`🧹 Resetting contracts (dryRun=${dryRun})...`);

  await db.sequelize.authenticate();

  const contracts = await db.Contract.findAll({ attributes: ['contractId'], order: [['createdAt', 'ASC']] });
  const contractIds = contracts.map((c) => c.contractId);

  console.log(`Found ${contractIds.length} contract(s).`);
  if (dryRun) {
    console.log('Dry run: no changes applied.');
    return;
  }

  await db.sequelize.transaction(async (t) => {
    if (contractIds.length > 0) {
      // Delete contract-scoped artifacts first.
      await db.TrainingJob.destroy({ where: { contractId: contractIds }, transaction: t });
      await db.ScittClaim.destroy({ where: { contractId: contractIds }, transaction: t });
      // Contracts last.
      await db.Contract.destroy({ where: { contractId: contractIds }, transaction: t });
    }

    await ensureDropdownData(t);
  });

  console.log('✅ Contracts cleared and dropdown data ensured.');
}

main()
  .then(async () => {
    await db.sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Reset failed:', err);
    try {
      await db.sequelize.close();
    } catch (_) {}
    process.exit(1);
  });

