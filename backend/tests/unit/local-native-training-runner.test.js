const { buildNativeTrainerEnv, nativePythonPath } = require('../../services/localNativeTrainingRunner');

describe('localNativeTrainingRunner', () => {
  test('buildNativeTrainerEnv passes contract paths and trainer device', () => {
    const prev = process.env.TRAINER_DEVICE;
    process.env.TRAINER_DEVICE = 'mps';
    try {
      const env = buildNativeTrainerEnv({
        jobId: 'job-test',
        contractId: 'CONTRACT-test',
        maxEpochs: 3,
        outDir: '/tmp/out',
        contractJsonPath: '/tmp/in/contract.json',
      });
      expect(env.TRAINING_JOB_ID).toBe('job-test');
      expect(env.CONTRACT_ID).toBe('CONTRACT-test');
      expect(env.MAX_EPOCHS).toBe('3');
      expect(env.OUTPUT_DIR).toBe('/tmp/out');
      expect(env.CONTRACT_JSON_PATH).toBe('/tmp/in/contract.json');
      expect(env.TRAINER_DEVICE).toBe('mps');
    } finally {
      if (prev === undefined) delete process.env.TRAINER_DEVICE;
      else process.env.TRAINER_DEVICE = prev;
    }
  });

  test('nativePythonPath defaults to .venv-native under local-training', () => {
    const p = nativePythonPath();
    expect(p).toContain('local-training');
    expect(p).toContain('.venv-native');
    expect(p.endsWith('python')).toBe(true);
  });
});
