/**
 * Azure CCR runner. Targets the TSP AKS confidential pool.
 * The container reads a SEV-SNP report from the node and submits it.
 * A missing guest interface or kubeconfig does not invent a quote or a running Job.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { prepareAzureContractKms } = require('./azureContractKms');
const { mintGuestQuoteToken } = require('./guestQuoteToken');

function jobName(jobId) {
  return `cm-train-${String(jobId)}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);
}

function buildAzureCcrSpec({ jobId, contract, account, containerSpec, kms }) {
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
              command: ['sh', '-c', 'python /can/azure_guest_quote.py && exec python /app/train.py'],
              securityContext: { privileged: true },
              env: [
                { name: 'TRAINING_JOB_ID', value: String(jobId) },
                { name: 'CONTRACT_ID', value: String(contract.contractId || '') },
                { name: 'AZURE_STORAGE_ACCOUNT', value: account.storageAccount || '' },
                { name: 'AZURE_STORAGE_DATASETS_CONTAINER', value: account.datasetsContainer || 'datasets' },
                { name: 'AZURE_KEY_VAULT_URI', value: (kms && kms.vaultUrl) || account.keyVaultUri || '' },
                { name: 'AZURE_KEK_KEY_ID', value: (kms && kms.keyId) || '' },
                { name: 'AZURE_SNP_PRODUCT', value: account.snpProduct || process.env.AZURE_SNP_PRODUCT || 'Milan' },
              ],
              volumeMounts: [
                { name: 'guest-quote', mountPath: '/can', readOnly: true },
                { name: 'tsm', mountPath: '/sys/kernel/config/tsm', readOnly: false },
              ],
            },
          ],
          volumes: [
            {
              name: 'guest-quote',
              configMap: { name: `${jobName(jobId)}-quote` },
            },
            {
              name: 'tsm',
              hostPath: { path: '/sys/kernel/config/tsm', type: 'Directory' },
            },
          ],
        },
      },
    },
  };
}

function quoteManifest(spec, { token, apiUrl }) {
  const applied = JSON.parse(JSON.stringify(spec));
  applied.spec.template.spec.containers[0].env.push(
    { name: 'CAN_API_URL', value: apiUrl || '' },
    { name: 'CAN_GUEST_QUOTE_TOKEN', value: token },
  );
  return {
    apiVersion: 'v1',
    kind: 'List',
    items: [
      {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
          name: `${spec.metadata.name}-quote`,
          namespace: spec.metadata.namespace,
        },
        data: {
          'azure_guest_quote.py': fs.readFileSync(path.join(__dirname, 'azure_guest_quote.py'), 'utf8'),
        },
      },
      applied,
    ],
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

async function provisionAzureCcr({ jobId, contract, account, containerSpec, keyVault } = {}) {
  const cluster = clusterOf(account);
  const attestation = {
    mode: 'simulated',
    note: 'The job reads the SEV-SNP report from the node and submits it. This status stays simulated until that report verifies.',
  };
  const kms = await prepareAzureContractKms(contract, { keyVault });
  if (kms.required && !kms.ok) {
    return { submitted: false, spec: null, cluster, attestation, kms, error: kms.error };
  }
  const spec = buildAzureCcrSpec({
    jobId,
    contract,
    account,
    containerSpec,
    kms: kms.ok ? kms : null,
  });
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
  const token = mintGuestQuoteToken(jobId);
  fs.writeFileSync(manifestPath, JSON.stringify(quoteManifest(spec, {
    token,
    apiUrl: account.apiUrl || process.env.AZURE_CCR_API_URL || '',
  })));
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
  const jobDeleted = await kubectl(['delete', 'job', name, '-n', namespace, '--ignore-not-found'], kubeconfig);
  const quoteDeleted = await kubectl(['delete', 'configmap', `${name}-quote`, '-n', namespace, '--ignore-not-found'], kubeconfig);
  return { tornDown: jobDeleted && quoteDeleted, remote: true };
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
  quoteManifest,
  provisionAzureCcr,
  teardownAzureCcr,
  azureCcrStatus,
};
