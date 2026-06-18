const {
  shapeInputsForLocalTrainerContainer,
} = require('../../services/contractTrainingInputsService');

describe('contractTrainingInputsService.shapeInputsForLocalTrainerContainer', () => {
  it('maps Tabular category to taskType and fills hyperparameters from first model', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c1', trainingParams: {} },
      datasets: [{ category: 'Tabular', datasetId: 'DATASET-1' }],
      models: [
        {
          maxEpochs: 7,
          architecture: 'bert-base',
          framework: 'PyTorch',
          type: 'transformer',
        },
      ],
      datasetSelections: [],
      aiModelIds: [1],
    });
    expect(out.contract.trainingParams.taskType).toBe('tabular');
    expect(out.contract.trainingParams.maxEpochs).toBe(7);
    expect(out.contract.trainingParams.architecture).toBe('bert-base');
    expect(out.contract.trainingParams.framework).toBe('PyTorch');
  });

  it('infers vision from Computer Vision category when taskType unset', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c2', trainingParams: {} },
      datasets: [{ category: 'Computer Vision', datasetId: 'd2' }],
      models: [],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.contract.trainingParams.taskType).toBe('vision');
  });

  it('does not override explicit taskType', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c3', trainingParams: { taskType: 'text' } },
      datasets: [{ category: 'Tabular', datasetId: 'd3' }],
      models: [],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.contract.trainingParams.taskType).toBe('text');
  });

  it('marks hasArtifacts and dataFormat from catalog fields', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c4', trainingParams: {} },
      datasets: [
        {
          category: 'Tabular',
          datasetId: 'D-1',
          artifactFileCount: 2,
          contentFormat: 'csv',
        },
      ],
      models: [],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.datasets[0].hasArtifacts).toBe(true);
    expect(out.datasets[0].dataFormat).toBe('csv');
  });

  it('attaches huggingface block from dataset metadata', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c5', trainingParams: {} },
      datasets: [
        {
          category: 'Natural Language Processing',
          datasetId: 'demo-ag-news',
          metadata: { hfDatasetId: 'ag_news' },
        },
      ],
      models: [
        {
          metadata: { huggingfaceModel: 'sshleifer/tiny-distilbert-base-cased' },
        },
      ],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.datasets[0].huggingface.repoId).toBe('ag_news');
    expect(out.models[0].huggingface.repoId).toBe('sshleifer/tiny-distilbert-base-cased');
  });

  it('infers text taskType from NLP dataset category', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c6', trainingParams: {} },
      datasets: [{ category: 'Natural Language Processing', datasetId: 'demo-ag-news' }],
      models: [],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.contract.trainingParams.taskType).toBe('text');
  });

  it('preserves differentialPrivacy block on trainingParams for local trainer', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: {
        contractId: 'c-dp',
        trainingParams: {
          taskType: 'text',
          differentialPrivacy: { enabled: true, epsilon: 0.3, delta: 1e-5 },
        },
      },
      datasets: [{ category: 'Natural Language Processing', datasetId: 'demo-ag-news' }],
      models: [],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.contract.trainingParams.differentialPrivacy.enabled).toBe(true);
    expect(out.contract.trainingParams.differentialPrivacy.epsilon).toBe(0.3);
  });

  it('uses architecture with slash as model huggingface ref', () => {
    const out = shapeInputsForLocalTrainerContainer({
      contract: { contractId: 'c7', trainingParams: {} },
      datasets: [],
      models: [{ architecture: 'sshleifer/tiny-distilbert-base-cased' }],
      datasetSelections: [],
      aiModelIds: [],
    });
    expect(out.models[0].huggingface.repoId).toBe('sshleifer/tiny-distilbert-base-cased');
  });
});
