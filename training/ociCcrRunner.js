/**
 * OCI CCR teardown. Provision stays in okeJobTrainingRunner.
 */

const { spawn } = require('child_process');

function kubectl(args, kubeconfig) {
  return new Promise((resolve) => {
    const child = spawn('kubectl', args, {
      env: { ...process.env, ...(kubeconfig ? { KUBECONFIG: kubeconfig } : {}) },
      stdio: 'ignore',
    });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

async function teardownOciCcr(job) {
  const meta = job?.metadata || {};
  const oke = meta.oke || {};
  const name = oke.jobName;
  const namespace = oke.namespace;
  const kubeconfig = oke.kubeconfigPath || process.env.OCI_CCR_KUBECONFIG || '';
  if (!name || !namespace || !kubeconfig) {
    return { tornDown: true, remote: false };
  }
  const ok = await kubectl(['delete', 'job', name, '-n', namespace, '--ignore-not-found'], kubeconfig);
  return { tornDown: ok, remote: true };
}

module.exports = { teardownOciCcr };
