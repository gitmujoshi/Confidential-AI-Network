/**
 * Local filesystem storage for dataset training artifacts (Phase A).
 * Layout: backend/uploads/datasets/<catalog datasetId>/
 */

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { unlink } = require('fs').promises;

const MAX_TOTAL_UPLOAD_BYTES = Number(process.env.DATASET_ARTIFACT_MAX_BYTES || 512 * 1024 * 1024);

function uploadsDatasetsRoot() {
  return path.join(__dirname, '..', 'uploads', 'datasets');
}

function artifactDirForDatasetId(datasetIdStr) {
  return path.join(uploadsDatasetsRoot(), datasetIdStr);
}

async function writeManifest(dir, filesMeta) {
  const payload = {
    files: filesMeta,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(payload, null, 2), 'utf8');
}

/**
 * @param {string} datasetIdStr - catalog datasetId (slug), not numeric PK
 * @param {Array<{ path: string, originalname: string, size?: number }>} multerFiles
 * @param {{ contentFormat?: string }} options
 */
async function persistUploadedFiles(datasetIdStr, multerFiles, options = {}) {
  if (!datasetIdStr || !Array.isArray(multerFiles) || multerFiles.length === 0) {
    throw new Error('No files to persist');
  }

  let totalIncoming = 0;
  for (const f of multerFiles) {
    totalIncoming += f.size || 0;
  }
  if (totalIncoming > MAX_TOTAL_UPLOAD_BYTES) {
    await Promise.all(multerFiles.map((f) => unlink(f.path).catch(() => {})));
    throw new Error(`Total upload exceeds limit (${MAX_TOTAL_UPLOAD_BYTES} bytes)`);
  }

  const dir = artifactDirForDatasetId(datasetIdStr);
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(dir, { recursive: true });

  const manifestFiles = [];
  let ts = Date.now();

  for (const f of multerFiles) {
    const safeBase = path.basename(f.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    ts += 1;
    const dest = path.join(dir, `${ts}-${safeBase}`);
    await fs.rename(f.path, dest);
    const st = await fs.stat(dest);
    manifestFiles.push({ name: path.basename(dest), bytes: st.size });
  }

  await writeManifest(dir, manifestFiles);

  const contentFormat = options.contentFormat || null;
  const artifactTotalBytes = manifestFiles.reduce((s, x) => s + x.bytes, 0);

  return {
    storageBackend: 'local',
    artifactFileCount: manifestFiles.length,
    artifactTotalBytes,
    contentFormat,
    artifactsUpdatedAt: new Date(),
  };
}

function datasetHasLocalArtifacts(datasetIdStr) {
  const dir = artifactDirForDatasetId(datasetIdStr);
  if (!fsSync.existsSync(dir)) return false;
  const manifest = path.join(dir, 'manifest.json');
  return fsSync.existsSync(manifest);
}

module.exports = {
  uploadsDatasetsRoot,
  artifactDirForDatasetId,
  persistUploadedFiles,
  datasetHasLocalArtifacts,
  MAX_TOTAL_UPLOAD_BYTES,
};
