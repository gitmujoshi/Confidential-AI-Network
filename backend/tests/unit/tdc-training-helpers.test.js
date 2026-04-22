const {
  slugModelId,
  mapFramework,
  mapModelType,
  mapPrivacyTechnique,
  isSimulationMode,
  buildContainerSpec,
} = require('../../services/tdcTrainingHelpers');

describe('tdcTrainingHelpers', () => {
  describe('slugModelId', () => {
    it('sanitizes and prefixes job ids', () => {
      expect(slugModelId('job-abc-123')).toMatch(/^trained-job-abc-123$/);
      expect(slugModelId('job/abc')).toContain('trained-job');
    });
  });

  describe('mapFramework', () => {
    it('maps common framework strings to AIModel enums', () => {
      expect(mapFramework('PyTorch')).toBe('PyTorch');
      expect(mapFramework('tensorflow')).toBe('TensorFlow');
      expect(mapFramework('JAX')).toBe('JAX');
      expect(mapFramework(undefined)).toBe('Other');
    });
  });

  describe('mapModelType', () => {
    it('infers architecture type', () => {
      expect(mapModelType('bert-base')).toBe('transformer');
      expect(mapModelType('resnet50')).toBe('cnn');
      expect(mapModelType(undefined)).toBe('other');
    });
  });

  describe('mapPrivacyTechnique', () => {
    it('returns none when no privacy config', () => {
      expect(mapPrivacyTechnique({})).toBe('none');
    });
    it('detects differential privacy object', () => {
      expect(mapPrivacyTechnique({ differentialPrivacy: { epsilon: 1 } })).toBe('differential-privacy');
    });
  });

  describe('isSimulationMode', () => {
    const prev = process.env.TRAINING_SIMULATION_MODE;

    afterEach(() => {
      if (prev === undefined) delete process.env.TRAINING_SIMULATION_MODE;
      else process.env.TRAINING_SIMULATION_MODE = prev;
    });

    it('defaults to false when unset', () => {
      delete process.env.TRAINING_SIMULATION_MODE;
      expect(isSimulationMode()).toBe(false);
    });

    it('respects false', () => {
      process.env.TRAINING_SIMULATION_MODE = 'false';
      expect(isSimulationMode()).toBe(false);
    });
  });

  describe('buildContainerSpec', () => {
    it('merges training params, environment compute, and refs', () => {
      const spec = buildContainerSpec({
        trainingParams: {
          containerImage: 'my/image:tag',
          cpuCores: 4,
          memoryGB: 16,
          command: 'python train.py',
          framework: 'PyTorch',
        },
        environmentSpecs: { compute: { gpuCount: 1 } },
        contractDatasets: [{ datasetId: 'd1' }],
        aiModelIds: [1, 2],
        ccrpCloudProvider: 'Azure',
      });
      expect(spec.image).toBe('my/image:tag');
      expect(spec.cpuCores).toBe(4);
      expect(spec.gpuCount).toBe(1);
      expect(spec.datasetRefs).toHaveLength(1);
      expect(spec.modelRefs).toEqual([1, 2]);
      expect(spec.cloudProvider).toBe('Azure');
    });
  });
});
