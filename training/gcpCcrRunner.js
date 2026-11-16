/**
 * GCP CCR runner. Targets the TSP GKE pool labeled can.gcp/pool=confidential.
 * Does not collect a Confidential Space quote. Missing kubeconfig does not pretend the Job ran.
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

function buildGcpCcrSpec({ jobId, contract, account, containerSpec }) {
  const namespace = account.namespace || 'contract-management';
  const image =
    containerSpec?.image ||
    process.env.GCP_CCR_TRAINER_IMAGE ||
    process.env.LOCAL_TRAINING_IMAGE ||
    'contractmanagement/local-trainer:latest';
  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName(jobId),
      namespace,
      labels: {
        'can.gcp/job-id': String(jobId).slice(0, 63),
        'can.gcp/contract-id': String(contract.contractId || '').slice(0, 63),
      },
    },
    spec: {
      backoffLimit: 0,
      template: {
        spec: {
          restartPolicy: 'Never',
          serviceAccountName: account.serviceAccount || 'training-job',
          nodeSelector: { 'can.gcp/pool': 'confidential' },
          tolerations: [
            {
              key: 'can.gcp/confidential',
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
                { name: 'GCP_PROJECT', value: account.projectId || '' },
                { name: 'GCP_LOCATION', value: account.location || '' },
                { name: 'GCS_BUCKET', value: account.bucket || '' },
              ],
            },
          ],
        },
      },
    },
  };
}

function kubeconfigFor(account) {
  return account?.kubeconfigPath || process.env.GCP_CCR_KUBECONFIG || '';
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
    projectId: account.projectId,
    location: account.location,
    clusterName: account.clusterName,
  };
}

async function provisionGcpCcr({ jobId, contract, account, containerSpec }) {
  const spec = buildGcpCcrSpec({ jobId, contract, account, containerSpec });
  const cluster = clusterOf(account);
  const attestation = {
    mode: 'simulated',
    note: 'Job targets the confidential GKE pool. No Confidential Space quote is collected.',
  };
  const kubeconfig = kubeconfigFor(account);
  if (!kubeconfig) {
    return {
      submitted: false,
      spec,
      cluster,
      attestation,
      error:
        'GCP CCR spec is ready for the TSP cluster. Set GCP_CCR_KUBECONFIG or cloudAccount.GCP.kubeconfigPath to submit the Job.',
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
      error: 'kubectl apply to the TSP GKE cluster failed. The Job was not submitted.',
    };
  }
  return { submitted: true, spec, cluster, attestation, error: null };
}

async function teardownGcpCcr(job) {
  const meta = job?.metadata || {};
  const gcp = meta.gcp || {};
  const spec = gcp.spec || {};
  const name = spec.metadata?.name;
  const namespace = spec.metadata?.namespace;
  const kubeconfig = kubeconfigFor(gcp.account || {});
  if (!gcp.submitted || !name || !namespace || !kubeconfig) {
    return { tornDown: true, remote: false };
  }
  const ok = await kubectl(['delete', 'job', name, '-n', namespace, '--ignore-not-found'], kubeconfig);
  return { tornDown: ok, remote: true };
}

module.exports = {
  buildGcpCcrSpec,
  provisionGcpCcr,
  teardownGcpCcr,
};
