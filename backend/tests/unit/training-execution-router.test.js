const { resolveTrainingExecution } = require('../../../training/trainingExecutionRouter');
const {
  isCompleteAccount,
  missingAccountFields,
  resolveTspCloudAccount,
  sanitizeProviderAccount,
} = require('../../../shared/services/tspCloudAccount');
const { buildAzureCcrSpec, provisionAzureCcr } = require('../../../training/azureCcrRunner');
const { buildGcpCcrSpec, provisionGcpCcr } = require('../../../training/gcpCcrRunner');
const { abortTrainingJob } = require('../../../training/trainingAbortService');

describe('training execution router', () => {
  it('keeps a Local TSP on local-docker when the host mode is oci', () => {
    const decision = resolveTrainingExecution(
      { tspCloudProvider: 'Local' },
      { TRAINING_EXECUTION_MODE: 'oci', NODE_ENV: 'development' }
    );
    expect(decision.ok).toBe(true);
    expect(decision.provider).toBe('Local');
    expect(decision.executionMode).toBe('local-docker');
  });

  it('sends an Azure TSP to azure-ccr even when the host mode is local-docker', () => {
    const decision = resolveTrainingExecution(
      { tspCloudProvider: 'Azure' },
      { TRAINING_EXECUTION_MODE: 'local-docker', NODE_ENV: 'development' }
    );
    expect(decision).toMatchObject({ ok: true, provider: 'Azure', executionMode: 'azure-ccr' });
  });

  it('sends an OCI TSP to the OKE runner', () => {
    const decision = resolveTrainingExecution(
      { tspCloudProvider: 'OCI' },
      { TRAINING_EXECUTION_MODE: 'local-docker' }
    );
    expect(decision).toMatchObject({ ok: true, executionMode: 'oci-oke-job' });
  });

  it('sends a GCP TSP to gcp-ccr and still refuses AWS', () => {
    const gcp = resolveTrainingExecution({ tspCloudProvider: 'GCP' }, { TRAINING_EXECUTION_MODE: 'local-docker' });
    const aws = resolveTrainingExecution({ tspCloudProvider: 'AWS' }, {});
    expect(gcp).toMatchObject({ ok: true, executionMode: 'gcp-ccr' });
    expect(aws.ok).toBe(false);
    expect(aws.statusCode).toBe(501);
  });
});

describe('TSP cloud account', () => {
  it('requires the existing Azure cluster identity', () => {
    expect(missingAccountFields('Azure', { subscriptionId: 'sub' })).toEqual([
      'resourceGroup',
      'clusterName',
    ]);
    expect(
      isCompleteAccount('Azure', {
        subscriptionId: 'sub',
        resourceGroup: 'rg',
        clusterName: 'aks',
      })
    ).toBe(true);
  });

  it('reads a complete account from the TSP user when the contract has none', async () => {
    const db = {
      User: {
        findByPk: async () => ({
          cloudAccount: {
            Azure: { subscriptionId: 'sub', resourceGroup: 'rg', clusterName: 'aks' },
          },
        }),
      },
    };
    const account = await resolveTspCloudAccount(
      db,
      { tspId: 4, tspCloudProvider: 'Azure', environmentSpecs: {} },
      'Azure'
    );
    expect(account.clusterName).toBe('aks');
  });

  it('fills the Azure subscription from the contract column and the cluster from the TSP user', async () => {
    const db = {
      User: {
        findByPk: async () => ({
          cloudAccount: { Azure: { resourceGroup: 'rg', clusterName: 'aks' } },
        }),
      },
    };
    const account = await resolveTspCloudAccount(
      db,
      { tspId: 4, tspAzureSubscriptionId: 'sub-from-contract', environmentSpecs: {} },
      'Azure'
    );
    expect(account.subscriptionId).toBe('sub-from-contract');
    expect(account.clusterName).toBe('aks');
  });

  it('reads a GCP cluster from the contract', async () => {
    const account = await resolveTspCloudAccount(
      { User: { findByPk: async () => null } },
      {
        tspId: 4,
        environmentSpecs: {
          cloudAccounts: {
            GCP: {
              projectId: 'proj',
              location: 'us-central1',
              clusterName: 'gke',
              namespace: 'training',
              bucket: 'datasets',
            },
          },
        },
      },
      'GCP'
    );
    expect(account).toMatchObject({
      projectId: 'proj',
      location: 'us-central1',
      clusterName: 'gke',
      bucket: 'datasets',
    });
  });

  it('keeps Azure and GCP cluster fields and drops anything else', () => {
    expect(
      sanitizeProviderAccount('Azure', {
        subscriptionId: ' sub ',
        resourceGroup: 'rg',
        clusterName: 'aks',
        kubeconfigPath: '/tmp/azure.kubeconfig',
        clientSecret: 'nope',
      })
    ).toEqual({
      subscriptionId: 'sub',
      resourceGroup: 'rg',
      clusterName: 'aks',
      kubeconfigPath: '/tmp/azure.kubeconfig',
    });
    expect(sanitizeProviderAccount('GCP', { projectId: 'proj', bucket: 'datasets' })).toEqual({
      projectId: 'proj',
      bucket: 'datasets',
    });
    expect(sanitizeProviderAccount('Local', { clusterName: 'x' })).toBeNull();
  });

  it('returns null when the Azure TSP account is incomplete', async () => {
    const db = { User: { findByPk: async () => ({ cloudAccount: { Azure: { subscriptionId: 'sub' } } }) } };
    const account = await resolveTspCloudAccount(db, { tspId: 4, environmentSpecs: {} }, 'Azure');
    expect(account).toBeNull();
  });
});

describe('Azure CCR runner', () => {
  const prevKube = process.env.AZURE_CCR_KUBECONFIG;

  afterEach(() => {
    if (prevKube === undefined) delete process.env.AZURE_CCR_KUBECONFIG;
    else process.env.AZURE_CCR_KUBECONFIG = prevKube;
  });

  it('targets the confidential pool and does not submit without a kubeconfig', async () => {
    delete process.env.AZURE_CCR_KUBECONFIG;
    const account = { subscriptionId: 'sub', resourceGroup: 'rg', clusterName: 'aks' };
    const result = await provisionAzureCcr({
      jobId: 'job-1',
      contract: { contractId: 'contract-1' },
      account,
      containerSpec: { image: 'trainer:latest' },
    });
    expect(result.submitted).toBe(false);
    expect(result.attestation.mode).toBe('simulated');
    expect(result.error).toMatch(/was not submitted|not submitted|kubeconfig/i);
    const spec = buildAzureCcrSpec({
      jobId: 'job-1',
      contract: { contractId: 'contract-1' },
      account,
      containerSpec: { image: 'trainer:latest' },
    });
    expect(spec.spec.template.spec.nodeSelector['can.azure/pool']).toBe('confidential');
    expect(spec.spec.template.spec.tolerations[0].key).toBe('can.azure/confidential');
    expect(spec.spec.template.spec.volumes.find((item) => item.name === 'tsm').hostPath.path).toBe('/sys/kernel/config/tsm');
    expect(spec.spec.template.spec.containers[0].command.join(' ')).toMatch(/azure_guest_quote.py/);
    expect(JSON.stringify(spec)).not.toMatch(/CAN_GUEST_QUOTE_TOKEN/);
  });
});

describe('GCP CCR runner', () => {
  const prevKube = process.env.GCP_CCR_KUBECONFIG;

  afterEach(() => {
    if (prevKube === undefined) delete process.env.GCP_CCR_KUBECONFIG;
    else process.env.GCP_CCR_KUBECONFIG = prevKube;
  });

  it('targets the confidential pool and does not submit without a kubeconfig', async () => {
    delete process.env.GCP_CCR_KUBECONFIG;
    const account = { projectId: 'proj', location: 'us-central1', clusterName: 'gke', bucket: 'datasets' };
    const result = await provisionGcpCcr({
      jobId: 'job-gcp-1',
      contract: { contractId: 'contract-1' },
      account,
      containerSpec: { image: 'trainer:latest' },
    });
    expect(result.submitted).toBe(false);
    expect(result.attestation.mode).toBe('simulated');
    const spec = buildGcpCcrSpec({
      jobId: 'job-gcp-1',
      contract: { contractId: 'contract-1' },
      account,
      containerSpec: { image: 'trainer:latest' },
    });
    expect(spec.spec.template.spec.nodeSelector['can.gcp/pool']).toBe('confidential');
    expect(spec.spec.template.spec.containers[0].env.find((item) => item.name === 'GCS_BUCKET').value).toBe('datasets');
  });
});

describe('training abort for a cloud CCR', () => {
  it('marks an Azure job cancelled and calls teardown', async () => {
    const job = {
      jobId: 'job-az-1',
      status: 'RUNNING',
      metadata: { executionMode: 'azure-ccr', azure: { submitted: false } },
      get() {
        return { jobId: this.jobId, status: this.status, metadata: this.metadata };
      },
      update: jest.fn(async () => {}),
    };
    const result = await abortTrainingJob(job, 'Contract ended');
    expect(result).toMatchObject({ jobId: 'job-az-1', status: 'CANCELLED', aborted: true });
    expect(job.update).toHaveBeenCalled();
  });
});
