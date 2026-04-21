const path = require('path');
const { loadConfig } = require('../scripts/load-config');

function ensureLoaded() {
  // When Playwright is run from `frontend/`, process.cwd() points at `frontend`,
  // so we must explicitly load config from the repo root.
  loadConfig({ rootDir: path.resolve(__dirname, '..'), verbose: false });
}

function getFrontendURL() {
  ensureLoaded();
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is required in config.env');
  }
  return process.env.FRONTEND_URL;
}

function getFrontendPort() {
  ensureLoaded();
  if (process.env.FRONTEND_PORT) return Number(process.env.FRONTEND_PORT);

  const url = new URL(getFrontendURL());
  if (url.port) return Number(url.port);
  return url.protocol === 'https:' ? 443 : 80;
}

/**
 * Backend API base URL for Node-side calls (Axios, Playwright APIRequestContext helpers).
 * Uses BACKEND_URL from config.env when set; otherwise localhost + BACKEND_PORT/PORT.
 */
function getBackendURL() {
  ensureLoaded();
  if (process.env.BACKEND_URL) {
    return String(process.env.BACKEND_URL).replace(/\/$/, '');
  }
  const port = process.env.BACKEND_PORT || process.env.PORT || 5001;
  return `http://localhost:${port}`;
}

const FRONTEND_PORT = getFrontendPort();

module.exports = {
  getFrontendURL,
  getBackendURL,
  FRONTEND_PORT,
};

