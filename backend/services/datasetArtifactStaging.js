/**
 * Copy staged dataset files into a training job input directory for immutable local-docker runs.
 */

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { uploadsDatasetsRoot } = require('./datasetArtifactStorage');

function runsRoot() {
  return path.join(__dirname, '..', 'local-training', 'runs');
}

/**
 * Deep-clone shaped trainer inputs and attach container paths for datasets that have local files.
 * @param {string} jobId
 * @param {object} shapedInputs - output of shapeInputsForLocalTrainerContainer
 * @returns {Promise<object>}
 */
async function stageDatasetsForLocalJob(jobId, shapedInputs) {
  const inputs = JSON.parse(JSON.stringify(shapedInputs));
  const datasets = inputs.datasets || [];
  const destBase = path.join(runsRoot(), jobId, 'inputs', 'datasets');
  await fs.mkdir(destBase, { recursive: true });

  for (const d of datasets) {
    const id = d.datasetId;
    const count = d.artifactFileCount ?? 0;
    if (!id || count <= 0) continue;

    const src = path.join(uploadsDatasetsRoot(), id);
    if (!fsSync.existsSync(src)) continue;

    const dest = path.join(destBase, id);
    await fs.rm(dest, { recursive: true, force: true }).catch(() => {});
    await fs.cp(src, dest, { recursive: true });

    d.containerDataPath = `/inputs/datasets/${id}`;
    d.dataFormat =
      (d.contentFormat && String(d.contentFormat)) ||
      inferFormatFromCategory(d.category) ||
      'csv';
    d.stagedForTraining = true;
  }

  return inputs;
}

function inferFormatFromCategory(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('tabular')) return 'csv';
  if (c.includes('vision') || c.includes('computer')) return 'image_folder';
  if (c.includes('language') || c.includes('nlp')) return 'text';
  return 'csv';
}

module.exports = {
  stageDatasetsForLocalJob,
};
