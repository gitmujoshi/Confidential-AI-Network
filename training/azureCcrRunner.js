/**
 * Azure CCR runner. Targets the TSP AKS confidential pool.
 * Does not collect a SEV-SNP quote. Missing kubeconfig does not pretend the Job ran.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function jobName(jobId) {
  return `cm-train-${String(jobId)}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);
}

function buildAzureCcrSpec({ jobId, contract, account, containerSpec }) {
  const namespace = account.namespace || 'contract-management';
  const image =
    containerSpec?.image ||
    process.env.AZURE_CCR_TRAINER_IMAGE ||
    process.env.LOCAL_TRAINING_IMAGE ||
    'contractmanagement/local-trainer:latest';
  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName(jobId),
      namespace,
      labels: {
        'can.azure/job-id': String(jobId).slice(0, 63),
        'can.azure/contract-id': String(contract.contractId || '').slice(0, 63),
      },
    },
    spec: {
      backoffLimit: 0,
      template: {
        spec: {
          restartPolicy: 'Never',
          serviceAccountName: account.serviceAccount || 'training-job',
          nodeSelector: { 'can.azure/pool': 'confidential' },
          tolerations: [
            {
              key: 'can.azure/confidential',
              operator: 'Equal',
              value: 'true',
              effect: 'NoSchedule',
            },
          ],
          containers: [
            {
              name: 'trainer',
              image,
              env: [
                { name: 'TRAINING_JOB_ID', value: String(jobId) },
                { name: 'CONTRACT_ID', value: String(contract.contractId || '') },
                { name: 'AZURE_STORAGE_ACCOUNT', value: account.storageAccount || '' },
                { name: 'AZURE_STORAGE_DATASETS_CONTAINER', value: account.datasetsContainer || 'datasets' },
                { name: 'AZURE_KEY_VAULT_URI', value: account.keyVaultUri || '' },
              ],
            },
          ],
        },
      },
    },
  };
}

function kubeconfigFor(account) {
  return account?.kubeconfigPath || process.env.AZURE_CCR_KUBECONFIG || '';
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

function clusterOf(account) {
  return {
    subscriptionId: account.subscriptionId,
    resourceGroup: account.resourceGroup,
    clusterName: account.clusterName,
    location: account.location || null,
  };
}

async function provisionAzureCcr({ jobId, contract, account, containerSpec }) {
  const spec = buildAzureCcrSpec({ jobId, contract, account, containerSpec });
  const cluster = clusterOf(account);
  const attestation = {
    mode: 'simulated',
    note: 'Job targets the confidential VM pool. No SEV-SNP quote is collected.',
  };
  const kubeconfig = kubeconfigFor(account);
  if (!kubeconfig) {
    return {
      submitted: false,
      spec,
      cluster,
      attestation,
      error:
        'Azure CCR spec is ready for the TSP cluster. Set AZURE_CCR_KUBECONFIG or cloudAccount.Azure.kubeconfigPath to submit the Job.',
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
      error: 'kubectl apply to the TSP AKS cluster failed. The Job was not submitted.',
    };
  }
  return { submitted: true, spec, cluster, attestation, error: null };
}

async function teardownAzureCcr(job) {
  const meta = job?.metadata || {};
  const azure = meta.azure || {};
  const spec = azure.spec || {};
  const name = spec.metadata?.name;
  const namespace = spec.metadata?.namespace;
  const kubeconfig = kubeconfigFor(azure.account || {});
  if (!azure.submitted || !name || !namespace || !kubeconfig) {
    return { tornDown: true, remote: false };
  }
  const ok = await kubectl(['delete', 'job', name, '-n', namespace, '--ignore-not-found'], kubeconfig);
  return { tornDown: ok, remote: true };
}

async function azureCcrStatus(job) {
  const azure = job?.metadata?.azure || {};
  return {
    executionMode: 'azure-ccr',
    submitted: Boolean(azure.submitted),
    status: job?.status || null,
    attestation: azure.attestation || { mode: 'simulated' },
  };
}

module.exports = {
  buildAzureCcrSpec,
  provisionAzureCcr,
  teardownAzureCcr,
  azureCcrStatus,
};
