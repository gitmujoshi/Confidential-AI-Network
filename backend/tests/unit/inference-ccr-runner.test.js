const {
  buildInferenceJobSpec,
  provisionInferenceCcr,
  kubeconfigFor,
} = require('../../../inference/backend/inferenceCcrRunner');

describe('inference CCR runner', () => {
  const account = {
    Azure: {
      subscriptionId: 'sub',
      resourceGroup: 'rg',
      clusterName: 'can-aks',
      namespace: 'contract-management',
      location: 'eastus',
    },
    GCP: {
      projectId: 'can-gcp',
      location: 'us-central1',
      clusterName: 'can-gke',
    },
    AWS: {
      region: 'us-east-1',
      clusterName: 'can-eks',
      accountId: '123456789012',
    },
  };

  it('builds a Job for the TDC cluster on Azure, GCP, and AWS', () => {
    const azure = buildInferenceJobSpec({
      provider: 'Azure',
      modelId: 'model-1',
      contractId: 'c-1',
      taskType: 'text',
      account: account.Azure,
    });
    expect(azure.metadata.name.startsWith('cm-infer-')).toBe(true);
    expect(azure.spec.template.spec.nodeSelector).toEqual({ 'can.azure/pool': 'confidential' });
    expect(azure.spec.template.spec.containers[0].env).toEqual(
      expect.arrayContaining([{ name: 'CAN_INFERENCE_MODEL_ID', value: 'model-1' }])
    );

    const gcp = buildInferenceJobSpec({
      provider: 'GCP',
      modelId: 'model-1',
      contractId: 'c-1',
      taskType: 'text',
      account: account.GCP,
    });
    expect(gcp.spec.template.spec.nodeSelector).toEqual({ 'can.gcp/pool': 'confidential' });

    const aws = buildInferenceJobSpec({
      provider: 'AWS',
      modelId: 'model-1',
      contractId: 'c-1',
      taskType: 'tabular',
      account: account.AWS,
    });
    expect(aws.spec.template.spec.nodeSelector).toEqual({ 'can.aws/pool': 'confidential' });
    expect(aws.spec.template.spec.containers[0].env).toEqual(
      expect.arrayContaining([{ name: 'CAN_INFERENCE_REGION', value: 'us-east-1' }])
    );
  });

  it('refuses to submit when the TDC kubeconfig path is missing', async () => {
    const result = await provisionInferenceCcr({
      provider: 'AWS',
      modelId: 'model-1',
      contractId: 'c-1',
      taskType: 'tabular',
      account: account.AWS,
    });
    expect(result.submitted).toBe(false);
    expect(result.error).toMatch(/AWS_CCR_KUBECONFIG/);
    expect(result.cluster.clusterName).toBe('can-eks');
  });

  it('reads the provider kubeconfig env when the account path is blank', () => {
    expect(kubeconfigFor('GCP', {}, { GCP_CCR_KUBECONFIG: '/tmp/gke.kubeconfig' })).toBe(
      '/tmp/gke.kubeconfig'
    );
    expect(kubeconfigFor('Azure', { kubeconfigPath: '/var/aks.kubeconfig' }, {})).toBe(
      '/var/aks.kubeconfig'
    );
  });
});
