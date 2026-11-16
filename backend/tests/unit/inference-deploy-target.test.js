const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../models', () => ({
  AIModel: { findOne: jest.fn() },
  Contract: { findOne: jest.fn() },
  TrainingJob: { findOne: jest.fn() },
  User: { findByPk: jest.fn() },
}));

jest.mock('../../../shared/services/gmaseSideEffectGate', () => ({
  authorizeCanSideEffect: jest.fn(async () => ({ allow: true, skipped: true })),
  isInferenceGateEnabled: () => false,
}));

jest.mock('../../../inference/backend/inferenceCcrRunner', () => ({
  provisionInferenceCcr: jest.fn(),
  teardownInferenceCcr: jest.fn(async () => ({ tornDown: true, remote: false })),
}));

const db = require('../../models');
const { provisionInferenceCcr } = require('../../../inference/backend/inferenceCcrRunner');
const inference = require('../../../inference/backend/localInferenceService');

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'can-infer-'));
fs.writeFileSync(path.join(outDir, 'model.bin'), 'weights');

function modelRow(metadata) {
  return {
    modelId: 'model-1',
    name: 'Demo',
    type: 'other',
    architecture: 'logistic',
    metadata,
    update: jest.fn(async function update(patch) {
      this.metadata = patch.metadata;
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  db.Contract.findOne.mockResolvedValue({
    contractId: 'c-1',
    tdcId: 7,
    tspCloudProvider: 'Local',
  });
  db.TrainingJob.findOne.mockResolvedValue({
    jobId: 'job-1',
    metadata: { local: { outDir } },
  });
});

describe('TDC inference deploy target', () => {
  it('keeps an omitted target on the local inferencer', async () => {
    const model = modelRow({
      source: 'tdc_training_job',
      contractId: 'c-1',
      trainingJobId: 'job-1',
    });
    db.AIModel.findOne.mockResolvedValue(model);

    const previous = process.env.INFERENCE_EXECUTION_MODE;
    process.env.INFERENCE_EXECUTION_MODE = 'docker';
    const result = await inference.deployModel('model-1', 7, {});
    if (previous == null) delete process.env.INFERENCE_EXECUTION_MODE;
    else process.env.INFERENCE_EXECUTION_MODE = previous;

    expect(provisionInferenceCcr).not.toHaveBeenCalled();
    expect(result.inference.provider).toBe('Local');
    expect(result.inference.status).toBe('DEPLOYED');
    expect(result.inference.executionMode).toBe('local-docker');
    expect(model.update).toHaveBeenCalled();
  });

  it('does not deploy to AWS until the TDC cluster record is complete', async () => {
    const model = modelRow({
      source: 'tdc_training_job',
      contractId: 'c-1',
      trainingJobId: 'job-1',
    });
    db.AIModel.findOne.mockResolvedValue(model);
    db.User.findByPk.mockResolvedValue({ cloudAccount: { AWS: { clusterName: 'can-eks' } } });

    await expect(inference.deployModel('model-1', 7, { target: 'AWS' })).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(provisionInferenceCcr).not.toHaveBeenCalled();
    expect(model.update).not.toHaveBeenCalled();
  });

  it('leaves the model undeployed when the AWS kubeconfig is missing', async () => {
    const model = modelRow({
      source: 'tdc_training_job',
      contractId: 'c-1',
      trainingJobId: 'job-1',
    });
    db.AIModel.findOne.mockResolvedValue(model);
    db.User.findByPk.mockResolvedValue({
      cloudAccount: { AWS: { region: 'us-east-1', clusterName: 'can-eks' } },
    });
    provisionInferenceCcr.mockResolvedValue({
      submitted: false,
      error: 'Set AWS_CCR_KUBECONFIG or the account kubeconfigPath to submit it.',
    });

    await expect(inference.deployModel('model-1', 7, { target: 'aws' })).rejects.toMatchObject({
      statusCode: 502,
    });
    expect(model.update).not.toHaveBeenCalled();
  });

  it('records an AWS deployment only after the Job is submitted', async () => {
    const model = modelRow({
      source: 'tdc_training_job',
      contractId: 'c-1',
      trainingJobId: 'job-1',
    });
    db.AIModel.findOne.mockResolvedValue(model);
    db.User.findByPk.mockResolvedValue({
      cloudAccount: { AWS: { region: 'us-east-1', clusterName: 'can-eks' } },
    });
    provisionInferenceCcr.mockResolvedValue({
      submitted: true,
      cluster: { region: 'us-east-1', clusterName: 'can-eks' },
      spec: { metadata: { name: 'cm-infer-model-1' } },
      attestation: { mode: 'simulated' },
    });

    const result = await inference.deployModel('model-1', 7, { target: 'AWS' });

    expect(result.inference.provider).toBe('AWS');
    expect(result.inference.executionMode).toBe('aws-ccr');
    expect(result.inference.status).toBe('DEPLOYED');
    expect(result.inference.contractProvider).toBe('Local');
    expect(provisionInferenceCcr).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'AWS', modelId: 'model-1' })
    );
  });

  it('refuses to score a cloud deployment on this host', async () => {
    const model = modelRow({
      source: 'tdc_training_job',
      contractId: 'c-1',
      trainingJobId: 'job-1',
      inference: { status: 'DEPLOYED', provider: 'GCP', executionMode: 'gcp-ccr' },
    });
    db.AIModel.findOne.mockResolvedValue(model);

    await expect(inference.predict('model-1', 7, { features: [1, 2, 3, 4] })).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
