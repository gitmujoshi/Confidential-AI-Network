/**
 * In-process handles for local training jobs so revoke/abort can stop them.
 * Local monolith only — not a distributed lock.
 */

const handles = new Map();

function registerTrainingProcess(jobId, handle) {
  if (!jobId || !handle) return;
  handles.set(String(jobId), handle);
}

function unregisterTrainingProcess(jobId) {
  handles.delete(String(jobId));
}

function getTrainingProcess(jobId) {
  return handles.get(String(jobId)) || null;
}

module.exports = {
  registerTrainingProcess,
  unregisterTrainingProcess,
  getTrainingProcess,
};
