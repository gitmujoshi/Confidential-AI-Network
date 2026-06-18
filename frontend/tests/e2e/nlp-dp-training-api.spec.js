const { test, expect } = require('@playwright/test');
const {
  assertLocalDockerMode,
  createSignedNlpDpContractAndTrain,
  assertPrivacyMetrics,
} = require('./helpers/nlp-dp-training');

/**
 * Opt-in API smoke: NLP Hugging Face trainer with Opacus DP-SGD.
 *
 * Prerequisites (backend):
 *   TRAINING_EXECUTION_MODE=local-docker
 *   TRAINING_SIMULATION_MODE=false
 *   Docker + contractmanagement/local-trainer:latest (with opacus)
 *
 * Run (from frontend/):
 *   E2E_WAIT_FOR_LOCAL_TRAINING=true npm run test:e2e:api
 */
test.describe('NLP + differential privacy — API smoke (opt-in)', () => {
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  test('signed contract trains with Opacus and returns results.privacyMetrics', async ({}, testInfo) => {
    if (!(await assertLocalDockerMode(test))) return;

    const { contractId, jobId, job } = await createSignedNlpDpContractAndTrain();

    expect(job.status).toBe('COMPLETED');
    expect(job.results).toBeTruthy();
    assertPrivacyMetrics(job.results.privacyMetrics);

    await testInfo.attach('nlp-dp.contractId.txt', {
      contentType: 'text/plain',
      body: contractId,
    });
    await testInfo.attach('nlp-dp.jobId.txt', {
      contentType: 'text/plain',
      body: jobId,
    });
    await testInfo.attach('nlp-dp.job.done.json', {
      contentType: 'application/json',
      body: JSON.stringify(job, null, 2),
    });
  });
});
