/**
 * Inference placement on a cluster the TDC already runs.
 * A missing kubeconfig does not mark the model deployed.
 * The Job does not mount model.bin and does not receive the prediction request.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const KUBE_ENV = {
  Azure: 'AZURE_CCR_KUBECONFIG',
  GCP: 'GCP_CCR_KUBECONFIG',
  AWS: 'AWS_CCR_KUBECONFIG',
};

const POOL = {
  Azure: { selector: 'can.azure/pool', toleration: 'can.azure/confidential' },
  GCP: { selector: 'can.gcp/pool', toleration: 'can.gcp/confidential' },
  AWS: { selector: 'can.aws/pool', toleration: 'can.aws/confidential' },
};

function jobName(modelId) {
  return `cm-infer-${String(modelId)}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);
}

function kubeconfigFor(provider, account, env = process.env) {
  return account?.kubeconfigPath || env[KUBE_ENV[provider]] || '';
}

function buildInferenceJobSpec({ provider, modelId, contractId, taskType, account }) {
  const pool = POOL[provider];
  const namespace = account.namespace || 'contract-management';
  const image =
    process.env.INFERENCE_CCR_IMAGE ||
    process.env.LOCAL_TRAINING_IMAGE ||
    'contractmanagement/local-trainer:latest';
  const region = account.location || account.region || '';
  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName(modelId),
      namespace,
      labels: {
        'can.inference/model-id': String(modelId).slice(0, 63),
        'can.inference/contract-id': String(contractId || '').slice(0, 63),
        'can.inference/provider': provider.toLowerCase(),
      },
    },
    spec: {
      backoffLimit: 0,
      template: {
        spec: {
          restartPolicy: 'Never',
          serviceAccountName: account.serviceAccount || 'training-job',
          nodeSelector: { [pool.selector]: 'confidential' },
          tolerations: [
            {
              key: pool.toleration,
              operator: 'Equal',
              value: 'true',
              effect: 'NoSchedule',
            },
          ],
          containers: [
            {
              name: 'inferencer',
              image,
              env: [
                { name: 'CAN_INFERENCE_MODEL_ID', value: String(modelId) },
                { name: 'CAN_INFERENCE_CONTRACT_ID', value: String(contractId || '') },
                { name: 'CAN_INFERENCE_TASK', value: String(taskType || '') },
                { name: 'CAN_INFERENCE_PROVIDER', value: provider },
                { name: 'CAN_INFERENCE_REGION', value: String(region) },
              ],
            },
          ],
        },
      },
    },
  };
}

function kubectl(args, kubeconfig) {
  return new Promise((resolve) => {
    const child = spawn('kubectl', args, {
      env: { ...process.env, KUBECONFIG: kubeconfig },
      stdio: 'ignore',
    });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

function clusterOf(provider, account) {
  if (provider === 'Azure') {
    return {
      subscriptionId: account.subscriptionId,
      resourceGroup: account.resourceGroup,
      clusterName: account.clusterName,
      location: account.location || null,
    };
  }
  if (provider === 'GCP') {
    return {
      projectId: account.projectId,
      location: account.location,
      clusterName: account.clusterName,
    };
  }
  return {
    accountId: account.accountId || null,
    region: account.region,
    clusterName: account.clusterName,
  };
}

async function provisionInferenceCcr({ provider, modelId, contractId, taskType, account }) {
  const spec = buildInferenceJobSpec({ provider, modelId, contractId, taskType, account });
  const cluster = clusterOf(provider, account);
  const attestation = {
    mode: 'simulated',
    note: 'Job submitted to the TDC cluster. model.bin is not copied, and no hardware quote is collected.',
  };
  const kubeconfig = kubeconfigFor(provider, account);
  const envName = KUBE_ENV[provider];
  if (!kubeconfig) {
    return {
      submitted: false,
      spec,
      cluster,
      attestation,
      error: `${provider} inference Job is ready for the TDC cluster. Set ${envName} or the account kubeconfigPath to submit it.`,
    };
  }
  const manifestPath = path.join(os.tmpdir(), `${spec.metadata.name}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(spec));
  const submitted = await kubectl(['apply', '-f', manifestPath], kubeconfig);
  if (!submitted) {
    return {
      submitted: false,
      spec,
      cluster,
      attestation,
      error: `kubectl apply to the TDC ${provider} cluster failed. The model was not deployed.`,
    };
  }
  return { submitted: true, spec, cluster, attestation, error: null };
}

async function teardownInferenceCcr(inference, env = process.env) {
  const spec = inference?.spec || {};
  const name = spec.metadata?.name;
  const namespace = spec.metadata?.namespace;
  const provider = inference?.provider;
  const kubeconfig = kubeconfigFor(provider, inference?.account || {}, env);
  if (!inference?.submitted || !name || !namespace || !kubeconfig) {
    return { tornDown: true, remote: false };
  }
  const ok = await kubectl(['delete', 'job', name, '-n', namespace, '--ignore-not-found'], kubeconfig);
  return { tornDown: ok, remote: true };
}

module.exports = {
  KUBE_ENV,
  jobName,
  kubeconfigFor,
  buildInferenceJobSpec,
  provisionInferenceCcr,
  teardownInferenceCcr,
};
