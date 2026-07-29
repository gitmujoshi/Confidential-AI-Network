/**
 * OCI Object Storage helper for dataset / training artifact paths.
 *
 * Enabled when DATASET_STORAGE_BACKEND=oci-object (or OCI_OBJECT_STORAGE_NAMESPACE set).
 * Uses oci-sdk when installed; otherwise returns structured metadata for simulation /
 * operator follow-up (upload via Console/CLI).
 */

function isEnabled() {
  const backend = String(process.env.DATASET_STORAGE_BACKEND || '').toLowerCase();
  return (
    backend === 'oci-object' ||
    backend === 'oci' ||
    Boolean(process.env.OCI_OBJECT_STORAGE_NAMESPACE)
  );
}

function config() {
  return {
    namespace: process.env.OCI_OBJECT_STORAGE_NAMESPACE || '',
    region: process.env.OCI_REGION || process.env.OCI_CLI_REGION || '',
    datasetsBucket:
      process.env.OCI_OBJECT_STORAGE_BUCKET ||
      process.env.OCI_OBJECT_STORAGE_DATASETS ||
      '',
    outputsBucket: process.env.OCI_OBJECT_STORAGE_OUTPUTS || '',
    artifactsBucket: process.env.OCI_OBJECT_STORAGE_ARTIFACTS || '',
  };
}

function objectUri(bucket, objectName) {
  const { namespace, region } = config();
  const host = region ? `https://objectstorage.${region}.oraclecloud.com` : 'oci-object-storage';
  return `${host}/n/${namespace}/b/${bucket}/o/${encodeURIComponent(objectName)}`;
}

async function getObjectStorageClient() {
  try {
    // Optional dependency — not required for local Keycloak demos
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const common = require('oci-common');
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const objectstorage = require('oci-objectstorage');
    const provider = await new common.ConfigFileAuthenticationDetailsProvider();
    return new objectstorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
  } catch (err) {
    return null;
  }
}

async function putObject({ bucket, objectName, body, contentType = 'application/octet-stream' }) {
  if (!isEnabled()) {
    throw new Error('OCI Object Storage is not enabled (set DATASET_STORAGE_BACKEND=oci-object)');
  }
  const cfg = config();
  const targetBucket = bucket || cfg.datasetsBucket;
  if (!cfg.namespace || !targetBucket) {
    throw new Error('OCI_OBJECT_STORAGE_NAMESPACE and bucket env vars are required');
  }

  const client = await getObjectStorageClient();
  if (!client) {
    return {
      simulated: true,
      message: 'oci-sdk not installed; object not uploaded',
      uri: objectUri(targetBucket, objectName),
      namespace: cfg.namespace,
      bucket: targetBucket,
      objectName,
    };
  }

  const putObjectRequest = {
    namespaceName: cfg.namespace,
    bucketName: targetBucket,
    putObjectBody: body,
    objectName,
    contentType,
  };
  await client.putObject(putObjectRequest);
  return {
    simulated: false,
    uri: objectUri(targetBucket, objectName),
    namespace: cfg.namespace,
    bucket: targetBucket,
    objectName,
  };
}

async function getObjectMetadata({ bucket, objectName }) {
  const cfg = config();
  const targetBucket = bucket || cfg.datasetsBucket;
  return {
    uri: objectUri(targetBucket, objectName),
    namespace: cfg.namespace,
    bucket: targetBucket,
    objectName,
    enabled: isEnabled(),
  };
}

module.exports = {
  isEnabled,
  config,
  objectUri,
  putObject,
  getObjectMetadata,
};
