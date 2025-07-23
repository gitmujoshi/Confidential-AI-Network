// Centralized logger utility for test output
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logError(message, error = null) {
  log(message, 'error');
  if (error) {
    console.error(error);
  }
}

function logSuccess(message) {
  log(message, 'success');
}

function logWarning(message) {
  log(message, 'warning');
}

function logInfo(message) {
  log(message, 'info');
}

module.exports = {
  log,
  logError,
  logSuccess,
  logWarning,
  logInfo
}; 