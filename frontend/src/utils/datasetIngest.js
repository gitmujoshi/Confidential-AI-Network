/** Keep in sync with backend/services/datasetIngestGate.js */
export const DATASET_INGEST_ACCEPT =
  '.csv,.tsv,.json,.jsonl,.txt,.parquet,.pq,.png,.jpg,.jpeg,.webp,.gif,.bmp,.npy,.npz,.zip';

const BLOCKED_EXT = /\.(pkl|pickle|joblib|pt|pth|h5|hdf5|exe|sh|py|ipynb)(\.|$)/i;

export function blockedIngestFiles(files) {
  return (files || []).filter((f) => BLOCKED_EXT.test(f.name || ''));
}

export function partitionIngestFiles(files) {
  const list = files || [];
  const blocked = blockedIngestFiles(list);
  const blockedNames = new Set(blocked.map((f) => f.name));
  return {
    allowed: list.filter((f) => !blockedNames.has(f.name)),
    blocked,
  };
}
