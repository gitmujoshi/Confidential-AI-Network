/**
 * Seed a clean demo catalog for local development.
 *
 * Goals:
 * - Create consistent TDP/TDC/CCRP users (idempotent).
 * - Create datasets with explicit modality in metadata so the UI can filter.
 * - Create AI models with clear framework/architecture/type aligned to modalities.
 *
 * Safe to rerun: performs upserts by email (users), datasetId (datasets), modelId (ai_models).
 */
require('dotenv').config({ path: '../config.env' });
try {
  require('dotenv').config({ path: '../secrets.env' });
} catch (_) {
  // ignore
}

const db = require('../../models');

function nowIso() {
  return new Date().toISOString();
}

async function upsertUser({ email, partyType, name, description, cloudProviders, organization }) {
  const [user, created] = await db.User.findOrCreate({
    where: { email },
    defaults: {
      email,
      partyType,
      name,
      description: description || null,
      cloudProviders: cloudProviders || null,
      organization: organization || null,
      isActive: true,
      isRegistered: true,
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      firstLogin: false,
      emailVerified: true,
      registrationDate: new Date(),
    },
  });

  const patch = {};
  if (user.partyType !== partyType) patch.partyType = partyType;
  if (name && user.name !== name) patch.name = name;
  if (description !== undefined && user.description !== description) patch.description = description;
  if (organization !== undefined && user.organization !== organization) patch.organization = organization;
  if (cloudProviders !== undefined) patch.cloudProviders = cloudProviders;
  if (user.isActive !== true) patch.isActive = true;
  if (user.isRegistered !== true) patch.isRegistered = true;
  if (user.onboardingStatus !== 'COMPLETED') patch.onboardingStatus = 'COMPLETED';
  if (user.profileCompleted !== true) patch.profileCompleted = true;
  if (user.firstLogin !== false) patch.firstLogin = false;
  if (user.emailVerified !== true) patch.emailVerified = true;

  if (Object.keys(patch).length > 0) {
    await user.update(patch);
  }

  return { user, created };
}

async function upsertDataset({ datasetId, ownerId, name, description, category, domain, size, recordCount, price, license, tags, metadata }) {
  const baseMeta = metadata && typeof metadata === 'object' ? metadata : {};
  const mergedMeta = {
    ...baseMeta,
    seededBy: 'seed-demo-catalog',
    seededAt: nowIso(),
  };

  const [row, created] = await db.Dataset.findOrCreate({
    where: { datasetId },
    defaults: {
      datasetId,
      ownerId,
      name,
      description,
      category,
      domain: domain || null,
      size,
      recordCount,
      price,
      license,
      tags: tags || [],
      metadata: mergedMeta,
      isPublic: true,
      isActive: true,
      confidentialComputingRequired: false,
      data_classification: 'INTERNAL',
      encryption_algorithm: 'AES-256-GCM',
      encryption_at_rest: true,
      encryption_in_transit: true,
      secure_enclave_required: false,
      attestation_required: false,
      cross_border_transfer_allowed: false,
      attestation_policy: {},
      access_control_policy: {},
      retention_policy: {},
      audit_configuration: {},
    },
  });

  const patch = {
    ownerId,
    name,
    description,
    category,
    domain: domain || null,
    size,
    recordCount,
    price,
    license,
    tags: tags || [],
    metadata: mergedMeta,
    isPublic: true,
    isActive: true,
  };
  await row.update(patch);
  return { dataset: row, created };
}

async function upsertAIModel(model) {
  const [row, created] = await db.AIModel.findOrCreate({
    where: { modelId: model.modelId },
    defaults: {
      ...model,
      isActive: true,
      metadata: model.metadata || {},
    },
  });

  await row.update({
    ...model,
    isActive: true,
    metadata: model.metadata || {},
  });
  return { model: row, created };
}

async function main() {
  console.log('🧪 Seeding demo catalog (users, datasets, ai_models)…');
  await db.sequelize.authenticate();

  // Ensure tables exist in local dev (no destructive alters).
  await db.sequelize.sync({ alter: false, force: false });

  // Users
  const tdp1 = await upsertUser({
    email: 'tdp.demo@local.test',
    partyType: 'TDP',
    name: 'Demo TDP (Vision + Tabular)',
    description: 'Demo Training Data Provider with vision + tabular datasets.',
    organization: 'Demo Data Labs',
  });

  const tdp2 = await upsertUser({
    email: 'tdp.demo.nlp@local.test',
    partyType: 'TDP',
    name: 'Demo TDP (NLP)',
    description: 'Demo Training Data Provider with text/NLP datasets.',
    organization: 'Demo Text Works',
  });

  await upsertUser({
    email: 'tdc.demo@local.test',
    partyType: 'TDC',
    name: 'Demo TDC',
    description: 'Demo Training Data Consumer for creating contracts.',
    organization: 'Demo AI Consumer Co.',
  });

  await upsertUser({
    email: 'ccrp.demo@local.test',
    partyType: 'CCRP',
    name: 'Demo CCRP (Azure)',
    description: 'Demo CCRP supporting Azure environments for development (Local Docker uses ccrp.e2e@test.com).',
    cloudProviders: ['Azure'],
    organization: 'Demo Clean Rooms Inc.',
  });

  // Datasets (explicit modality in metadata)
  const datasets = [
    {
      datasetId: 'demo-cifar10',
      ownerId: tdp1.user.id,
      name: 'CIFAR-10 (Demo)',
      description: 'Image classification dataset for demo/testing (vision).',
      category: 'Computer Vision',
      domain: 'Technology',
      size: 170,
      recordCount: 60000,
      price: 100,
      license: 'MIT',
      tags: ['demo', 'vision', 'cifar10', 'classification'],
      metadata: { modality: 'vision', format: 'image', classes: 10, imageSize: '32x32' },
    },
    {
      datasetId: 'demo-iris',
      ownerId: tdp1.user.id,
      name: 'Iris (Demo)',
      description: 'Small tabular dataset for fast local training.',
      category: 'Tabular',
      domain: 'Research',
      size: 1,
      recordCount: 150,
      price: 20,
      license: 'Public Domain',
      tags: ['demo', 'tabular', 'classification'],
      metadata: { modality: 'tabular', format: 'csv', features: 4, classes: 3 },
    },
    {
      datasetId: 'demo-ag-news',
      ownerId: tdp2.user.id,
      name: 'AG News (Demo)',
      description: 'Text classification dataset for demo/testing (NLP).',
      category: 'Natural Language Processing',
      domain: 'Media',
      size: 50,
      recordCount: 120000,
      price: 60,
      license: 'MIT',
      tags: ['demo', 'text', 'nlp', 'classification'],
      metadata: {
        modality: 'text',
        language: 'en',
        classes: 4,
        hfDatasetId: 'ag_news',
        huggingface: {
          repoType: 'dataset',
          repoId: 'ag_news',
          splitTrain: 'train',
          splitTest: 'test',
          sovereignty: 'hub-reference',
        },
      },
    },
  ];

  for (const d of datasets) {
    await upsertDataset(d);
  }

  // AI Models (aligned to modalities)
  const models = [
    {
      modelId: 'demo-model-vision-tinycnn',
      name: 'TinyCNN (Demo)',
      description: 'Small CNN for fast vision demos (local-docker).',
      type: 'cnn',
      architecture: 'tinycnn',
      parameters: '0.1M',
      framework: 'PyTorch',
      privacyTechnique: 'none',
      validationMetrics: ['accuracy', 'loss'],
      maxEpochs: 5,
      batchSize: 64,
      learningRate: 0.001,
      metadata: { modality: 'vision', recommendedDatasets: ['demo-cifar10'] },
    },
    {
      modelId: 'demo-model-tabular-logreg',
      name: 'Logistic Regression (Demo)',
      description: 'Fast baseline for tabular demos (local-docker).',
      type: 'other',
      architecture: 'logistic-regression',
      parameters: 'N/A',
      framework: 'Other',
      privacyTechnique: 'none',
      validationMetrics: ['accuracy', 'loss'],
      maxEpochs: 3,
      batchSize: 32,
      learningRate: 0.001,
      metadata: { modality: 'tabular', recommendedDatasets: ['demo-iris'], frameworkHint: 'sklearn' },
    },
    {
      modelId: 'demo-model-text-tiny-distilbert',
      name: 'Tiny DistilBERT (Demo)',
      description: 'Tiny transformer for text classification demos (local-docker).',
      type: 'transformer',
      architecture: 'sshleifer/tiny-distilbert-base-cased',
      parameters: '2M',
      framework: 'PyTorch',
      privacyTechnique: 'none',
      validationMetrics: ['accuracy', 'loss'],
      maxEpochs: 3,
      batchSize: 16,
      learningRate: 0.0002,
      metadata: { modality: 'text', recommendedDatasets: ['demo-ag-news'], huggingfaceModel: 'sshleifer/tiny-distilbert-base-cased' },
    },
  ];

  for (const m of models) {
    await upsertAIModel(m);
  }

  console.log('✅ Demo catalog seeded successfully.');
  console.log('ℹ️  Users:');
  console.log('   - TDP: tdp.demo@local.test, tdp.demo.nlp@local.test');
  console.log('   - TDC: tdc.demo@local.test');
  console.log('   - CCRP: ccrp.demo@local.test');
  console.log('ℹ️  Datasets: demo-cifar10, demo-iris, demo-ag-news');
  console.log('ℹ️  Models: demo-model-vision-tinycnn, demo-model-tabular-logreg, demo-model-text-tiny-distilbert');
}

main()
  .catch((err) => {
    console.error('❌ seed-demo-catalog failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await db.sequelize.close();
    } catch (_) {
      // ignore
    }
  });

