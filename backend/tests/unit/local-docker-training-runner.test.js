const { buildDockerRunArgs } = require('../../services/localDockerTrainingRunner');

describe('localDockerTrainingRunner.buildDockerRunArgs', () => {
  const base = {
    jobId: 'job-hf-test-001',
    contractId: 'RICARDIAN-HF-001',
    maxEpochs: 2,
    image: 'contractmanagement/local-trainer:latest',
    outDir: '/tmp/out',
    inputsDir: '/tmp/in',
  };

  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('includes core trainer environment variables', () => {
    const args = buildDockerRunArgs(base);
    expect(args).toContain('run');
    expect(args).toContain(`TRAINING_JOB_ID=${base.jobId}`);
    expect(args).toContain(`CONTRACT_ID=${base.contractId}`);
    expect(args).toContain('MAX_EPOCHS=2');
    expect(args).toContain('CONTRACT_JSON_PATH=/inputs/contract.json');
    expect(args[args.length - 1]).toBe(base.image);
  });

  it('passes HF_TOKEN when configured', () => {
    process.env.HF_TOKEN = 'hf_unit_test_token';
    delete process.env.HUGGINGFACE_API_TOKEN;
    const args = buildDockerRunArgs(base);
    expect(args).toContain('HF_TOKEN=hf_unit_test_token');
  });

  it('prefers HF_TOKEN over HUGGINGFACE_API_TOKEN', () => {
    process.env.HF_TOKEN = 'hf_primary';
    process.env.HUGGINGFACE_API_TOKEN = 'hf_secondary';
    const args = buildDockerRunArgs(base);
    expect(args).toContain('HF_TOKEN=hf_primary');
    expect(args).not.toContain('HF_TOKEN=hf_secondary');
  });

  it('passes HF_ENDPOINT when HUGGINGFACE_HUB_URL is set', () => {
    process.env.HUGGINGFACE_HUB_URL = 'https://hub.example.test';
    const args = buildDockerRunArgs(base);
    expect(args).toContain('HF_ENDPOINT=https://hub.example.test');
  });

  it('omits HF env when tokens are unset', () => {
    delete process.env.HF_TOKEN;
    delete process.env.HUGGINGFACE_API_TOKEN;
    delete process.env.HUGGINGFACE_HUB_URL;
    const args = buildDockerRunArgs(base);
    expect(args.some((a) => String(a).startsWith('HF_TOKEN='))).toBe(false);
    expect(args.some((a) => String(a).startsWith('HF_ENDPOINT='))).toBe(false);
  });
});
