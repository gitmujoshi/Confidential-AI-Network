const axios = require('axios');
const { getBackendURL } = require('../../load-config');

async function ensureUser({ name, email, partyType, desiredPassword }) {
  const backendURL = getBackendURL();

  // If user already exists with desired password, we're done.
  try {
    const login = await axios.post(`${backendURL}/api/auth/login`, {
      email,
      password: desiredPassword,
    });

    if (login.status === 200 && login.data && login.data.accessToken) {
      return;
    }

    // If backend indicates first-login, attempt password change anyway.
    if (login.data && (login.data.requiresPasswordChange || login.data.isFirstLogin)) {
      // We don't have the temporary password in this branch, so fall through to registration.
    }
  } catch (_) {
    // Continue to registration attempt below.
  }

  // Try to register. If the user already exists, backend will reject and we accept that.
  let temporaryPassword;
  try {
    const reg = await axios.post(`${backendURL}/api/auth/register`, {
      name,
      email,
      partyType,
    });

    temporaryPassword = reg.data?.loginCredentials?.password;
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 409) {
      // User likely already exists; assume password is already set appropriately.
      return;
    }
    throw err;
  }

  // If we got a temporary password, complete first-login password change.
  if (temporaryPassword) {
    await axios.post(`${backendURL}/api/auth/first-login-password`, {
      email,
      currentPassword: temporaryPassword,
      newPassword: desiredPassword,
    });
  }
}

async function login({ email, password }) {
  const backendURL = getBackendURL();
  const res = await axios.post(`${backendURL}/api/auth/login`, { email, password });
  if (res.status !== 200 || !res.data?.accessToken || !res.data?.user) {
    throw new Error('Login did not return accessToken/user');
  }
  return { accessToken: res.data.accessToken, user: res.data.user };
}

function normalizedProviderSet(list) {
  return JSON.stringify([...new Set(list || [])].sort());
}

/** Upsert-by-modelId so modality-filter tests always have tabular + vision fixtures. */
async function ensureAiModelExists(backendURL, adminToken, payload) {
  const mid = payload.modelId;
  try {
    await axios.get(`${backendURL}/api/ai-models/${encodeURIComponent(mid)}`);
    return;
  } catch (e) {
    if (e.response?.status !== 404) {
      console.warn(`⚠️ E2E: probe AI model ${mid}:`, e.response?.status || e.message);
      return;
    }
  }
  try {
    await axios.post(`${backendURL}/api/ai-models`, payload, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`✅ E2E seeded AI model ${mid}`);
  } catch (e) {
    const status = e.response?.status;
    const msg = e.response?.data?.error || e.message || '';
    if (status === 400 && String(msg).toLowerCase().includes('already')) return;
    console.warn(`⚠️ E2E: failed to seed AI model ${mid}:`, status || msg);
  }
}

/** Every CCRP must advertise Local for E2E local-training specs (single provider only). */
async function ensureAllCcrpsAdvertiseLocalDocker(backendURL, adminToken) {
  try {
    const res = await axios.get(`${backendURL}/api/users/ccrp`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rows = Array.isArray(res.data) ? res.data : [];
    for (const u of rows) {
      const existing = Array.isArray(u.cloudProviders) ? u.cloudProviders : [];
      const target = ['Local'];
      if (normalizedProviderSet(existing) === normalizedProviderSet(target)) continue;
      await axios.put(
        `${backendURL}/api/users/${u.id}`,
        {
          cloudProviders: target,
          description: u.description || 'CCRP provider for E2E tests',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    }
    console.log(`✅ E2E ensured cloudProviders on ${rows.length} CCRP user(s)`);
  } catch (err) {
    console.warn(
      '⚠️ Failed to backfill CCRP cloudProviders for E2E:',
      err.response?.status || err.message
    );
  }
}

class E2ETestDataManager {
  async setupTestData() {
    // This user is hard-coded across Playwright specs as a known-good login.
    await ensureUser({
      name: 'TDC Healthcare E2E User',
      email: 'tdc.healthcare.2025-09-05t20-39-55@test.com',
      partyType: 'TDC',
      desiredPassword: 'TestNewPassword123!',
    });

    // TDP user for dataset ownership.
    await ensureUser({
      name: 'TDP E2E User',
      email: 'tdp.e2e@test.com',
      partyType: 'TDP',
      desiredPassword: 'TestNewPassword123!',
    });

    await ensureUser({
      name: 'CCRP E2E User',
      email: 'ccrp.e2e@test.com',
      partyType: 'CCRP',
      desiredPassword: 'TestNewPassword123!',
    });

    // AppAdmin user for admin-route smoke tests.
    await ensureUser({
      name: 'AppAdmin E2E User',
      email: 'appadmin.e2e@test.com',
      partyType: 'AppAdmin',
      desiredPassword: 'TestNewPassword123!',
    });

    const backendURL = getBackendURL();

    // Seed default contract templates (needed for /contracts/create wizard).
    // Requires authenticated AppAdmin.
    const { accessToken: adminToken } = await login({
      email: 'appadmin.e2e@test.com',
      password: 'TestNewPassword123!',
    });

    await ensureAllCcrpsAdvertiseLocalDocker(backendURL, adminToken);

    // Deterministic AI fixtures: tabular/text + vision (wizard modality filtering / dropdown tests).
    await ensureAiModelExists(backendURL, adminToken, {
      modelId: 'e2e-model-tabular-logreg',
      name: 'E2E Logistic Regression',
      description: 'Seeded tabular model for full E2E Docker training (logistic regression)',
      type: 'other',
      architecture: 'logistic-regression',
      parameters: 'N/A',
      framework: 'Other',
      privacyTechnique: 'none',
      validationMetrics: ['accuracy', 'loss'],
      maxEpochs: 2,
      batchSize: 32,
      learningRate: 0.001,
      metadata: { seededBy: 'playwright', modalityHint: 'tabular' },
    });
    await ensureAiModelExists(backendURL, adminToken, {
      modelId: 'e2e-model-1',
      name: 'E2E Tabular Model',
      description: 'Seeded tabular/NLP-style model for Playwright E2E (BERT)',
      type: 'transformer',
      architecture: 'bert-base',
      parameters: '110M',
      framework: 'PyTorch',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy'],
      maxEpochs: 3,
      batchSize: 8,
      learningRate: 0.0001,
      metadata: { seededBy: 'playwright', modalityHint: 'tabular' },
    });
    await ensureAiModelExists(backendURL, adminToken, {
      modelId: 'MODEL-E2E-001',
      name: 'E2E Test Model 1',
      description: 'Seeded vision/CNN model for Playwright E2E',
      type: 'cnn',
      architecture: 'ResNet-50',
      parameters: '{"layers":50,"activation":"relu"}',
      framework: 'TensorFlow',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy', 'loss'],
      maxEpochs: 10,
      batchSize: 32,
      learningRate: 0.001,
      metadata: { seededBy: 'playwright', modalityHint: 'vision' },
    });

    // NLP + Hugging Face fixtures for differential-privacy local-docker E2E
    await ensureAiModelExists(backendURL, adminToken, {
      modelId: 'e2e-model-nlp-distilbert',
      name: 'E2E Tiny DistilBERT (NLP DP)',
      description: 'Seeded NLP model for Opacus DP-SGD Playwright E2E',
      type: 'transformer',
      architecture: 'sshleifer/tiny-distilbert-base-cased',
      parameters: '66M',
      framework: 'PyTorch',
      privacyTechnique: 'differential-privacy',
      validationMetrics: ['accuracy', 'loss'],
      maxEpochs: 1,
      batchSize: 16,
      learningRate: 0.0002,
      metadata: {
        seededBy: 'playwright',
        modalityHint: 'text',
        huggingfaceModel: 'sshleifer/tiny-distilbert-base-cased',
      },
    });

    await axios.post(`${backendURL}/api/contract-templates/seed`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).catch((err) => {
      // If seeding fails due to duplicates/other idempotency, don't fail E2E setup.
      const status = err.response?.status;
      if (status === 409 || status === 400) return;
      throw err;
    });

    // Ensure at least one public dataset exists for contract creation.
    const { user: tdpUser } = await login({
      email: 'tdp.e2e@test.com',
      password: 'TestNewPassword123!',
    });

    const nlpDatasetId = 'e2e-nlp-ag-news';
    let nlpDatasetExists = false;
    try {
      await axios.get(`${backendURL}/api/datasets/${nlpDatasetId}`);
      nlpDatasetExists = true;
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
    const nlpDatasetBody = {
      datasetId: nlpDatasetId,
      name: 'E2E AG News (NLP DP)',
      description: 'Seeded NLP dataset with Hugging Face ag_news reference for DP E2E',
      category: 'Natural Language Processing',
      size: 120,
      recordCount: 120000,
      price: 100,
      license: 'MIT',
      tags: ['e2e', 'nlp', 'ag_news', 'differential-privacy'],
      metadata: {
        seededBy: 'playwright',
        modality: 'text',
        hfDatasetId: 'ag_news',
        huggingface: {
          repoType: 'dataset',
          repoId: 'ag_news',
          splitTrain: 'train',
          splitTest: 'test',
          sovereignty: 'hub-reference',
        },
      },
      isPublic: true,
      confidentialComputingRequired: false,
      ownerId: tdpUser.id,
    };
    if (!nlpDatasetExists) {
      await axios.post(`${backendURL}/api/datasets`, nlpDatasetBody);
    } else {
      try {
        await axios.put(`${backendURL}/api/datasets/${encodeURIComponent(nlpDatasetId)}`, {
          ...nlpDatasetBody,
          isActive: true,
        });
      } catch (err) {
        console.warn('⚠️ E2E NLP dataset reconcile failed:', err.response?.status || err.message);
      }
    }
    console.log('✅ E2E NLP DP fixtures (e2e-nlp-ag-news, e2e-model-nlp-distilbert)');

    const datasetId = 'e2e-dataset-1';
    let datasetExists = false;
    try {
      await axios.get(`${backendURL}/api/datasets/${datasetId}`);
      datasetExists = true;
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    const catalogDatasetBody = {
      datasetId,
      name: 'E2E Sample Dataset',
      description: 'Seeded dataset for Playwright E2E tests',
      category: 'Tabular',
      size: 10,
      recordCount: 1000,
      price: 100,
      license: 'E2E-LICENSE',
      tags: ['e2e', 'seed'],
      metadata: { seededBy: 'playwright', modality: 'tabular' },
      isPublic: true,
      confidentialComputingRequired: false,
      ownerId: tdpUser.id,
    };

    if (!datasetExists) {
      await axios.post(`${backendURL}/api/datasets`, catalogDatasetBody);
    }

    // Reconcile catalog flags + modality metadata even when the row already existed (fixes stale DBs).
    try {
      await axios.put(`${backendURL}/api/datasets/${encodeURIComponent(datasetId)}`, {
        name: catalogDatasetBody.name,
        description: catalogDatasetBody.description,
        category: catalogDatasetBody.category,
        size: catalogDatasetBody.size,
        recordCount: catalogDatasetBody.recordCount,
        price: catalogDatasetBody.price,
        license: catalogDatasetBody.license,
        tags: catalogDatasetBody.tags,
        metadata: catalogDatasetBody.metadata,
        isPublic: true,
        isActive: true,
        confidentialComputingRequired: false,
      });
      console.log('✅ E2E catalog dataset reconciled (public + modality)');
    } catch (err) {
      console.warn(
        '⚠️ E2E catalog dataset reconcile failed:',
        err.response?.status || err.message
      );
    }

    // Ensure at least one contract exists for the TDC so contract list/detail tests can run.
    const { user: tdcUser, accessToken: tdcToken } = await login({
      email: 'tdc.healthcare.2025-09-05t20-39-55@test.com',
      password: 'TestNewPassword123!',
    });

    let existingContractsTotal = 0;
    try {
      const list = await axios.get(`${backendURL}/api/contracts/user/${tdcUser.id}?limit=1&offset=0`);
      existingContractsTotal = list.data?.total ?? 0;
    } catch (_) {
      // If listing fails, still attempt creation below (it will error clearly if backend is unhealthy).
    }

    if (existingContractsTotal === 0) {
      await axios.post(`${backendURL}/api/contracts/ricardian`, {
        datasetSelections: [{ datasetId, individualPrice: 100 }],
        aiModelIds: ['e2e-model-1'],
        duration: 30,
        termsAndConditions: 'E2E seeded contract terms.',
        contractType: 'AI_TRAINING',
        ccrpCloudProvider: 'Azure',
        environmentSpecs: {
          compute: { cpuCores: 2, memoryGB: 4, gpuCount: 0 },
          security: {
            confidentialComputing: false,
            attestationRequired: true,
            encryptionAtRest: true,
            encryptionInTransit: true,
            networkIsolation: true,
          },
          kms: {
            provider: 'hashicorp-vault',
            keyId: 'e2e-local-key',
            algorithm: 'AES-256-GCM',
            rotationPeriod: 90,
          },
          runtime: {
            containerSpec: {
              image: 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest',
              command: 'python train.py',
              cpuCores: 2,
              memoryGB: 4,
              gpuCount: 0,
            },
          },
        },
        kmsConfigs: {
          provider: 'hashicorp-vault',
          keyId: 'e2e-local-key',
          vaultUrl: 'http://localhost:8200',
          metadata: { seededBy: 'playwright', purpose: 'e2e' },
        },
        containerImage: 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04:latest',
        serviceAccount: 'local/e2e-runner',
        logDestination: 'local:file',
        privacyRequirements: {
          maxPrivacyLoss: 0.25,
          minAccuracy: 0.85,
          differentialPrivacy: true,
        },
        trainingParams: {
          privacyTechnique: 'Differential Privacy',
          framework: 'PyTorch',
          architecture: 'bert-base',
          maxEpochs: 5,
          batchSize: 32,
          learningRate: 0.001,
          validationMetrics: ['accuracy', 'loss'],
        },
      }, {
        headers: { Authorization: `Bearer ${tdcToken}` },
      });
    }
  }

  async cleanupTestData() {
    // Intentionally a no-op.
    // Deleting users/data requires privileged endpoints and can be disruptive to local dev.
  }
}

module.exports = {
  E2ETestDataManager,
  getBackendURL,
};

