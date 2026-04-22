/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

function readEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const out = {};
    for (const line of raw.split('\n')) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const eq = s.indexOf('=');
      if (eq === -1) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[k] = v;
    }
    return out;
  } catch (_) {
    return {};
  }
}

function envBool(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

async function checkHttp(name, url, { timeoutMs = 2500, insecure = false } = {}) {
  const cfg = {
    timeout: timeoutMs,
    validateStatus: () => true,
  };
  if (insecure) cfg.httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false });

  try {
    const res = await axios.get(url, cfg);
    const ok = res.status >= 200 && res.status < 300;
    return { name, url, ok, status: res.status };
  } catch (err) {
    return { name, url, ok: false, status: null, error: err.code || err.message };
  }
}

async function main() {
  const root = path.resolve(__dirname, '..');
  const cfg = readEnvFile(path.join(root, 'config.env'));

  const backendUrl = cfg.BACKEND_URL || `http://localhost:${cfg.BACKEND_PORT || 5001}`;
  const frontendUrl = cfg.FRONTEND_URL || `http://localhost:${cfg.FRONTEND_PORT || 3000}`;
  const ***REMOVED-KEYCLOAK_DB_PASSWORD***Url = cfg.KEYCLOAK_URL || `http://localhost:${cfg.KEYCLOAK_PORT || 8080}`;
  const scittEnabled = envBool(cfg.SCITT_CCF_ENABLED);

  const checks = [];
  checks.push(checkHttp('backend', `${backendUrl.replace(/\/$/, '')}/health`));
  checks.push(checkHttp('frontend', `${frontendUrl.replace(/\/$/, '')}/`));
  // Keycloak master realm is a simple readiness proxy.
  checks.push(checkHttp('***REMOVED-KEYCLOAK_DB_PASSWORD***', `${***REMOVED-KEYCLOAK_DB_PASSWORD***Url.replace(/\/$/, '')}/realms/master`, { insecure: true }));

  if (scittEnabled) {
    const scittNodeUrl = cfg.SCITT_CCF_NODE_URL || cfg.SCITT_CCF_URL;
    if (scittNodeUrl) {
      checks.push(checkHttp('scitt-ccf-node', scittNodeUrl, { insecure: true }));
    }
  }

  const results = await Promise.all(checks);
  const maxName = Math.max(...results.map((r) => r.name.length));

  let okAll = true;
  for (const r of results) {
    const pad = ' '.repeat(maxName - r.name.length);
    if (r.ok) {
      console.log(`✅ ${r.name}${pad}  ${r.status}  ${r.url}`);
    } else {
      okAll = false;
      const extra = r.status ? `HTTP ${r.status}` : r.error || 'error';
      console.log(`❌ ${r.name}${pad}  ${extra}  ${r.url}`);
    }
  }

  if (!okAll) process.exitCode = 1;
}

main().catch((e) => {
  console.error('status failed:', e);
  process.exitCode = 1;
});

