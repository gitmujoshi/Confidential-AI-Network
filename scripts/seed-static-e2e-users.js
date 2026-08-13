#!/usr/bin/env node
/**
 * Seed static E2E / local-dev test users (idempotent).
 *
 * Run during environment setup only — not on every Playwright run:
 *   npm run seed:e2e-users
 *   ./start-system.sh  (calls this after backend is healthy)
 *
 * Users are defined in fixtures/test-data/static-e2e-users.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Prefer workspace axios (root may not have node_modules/axios).
function loadAxios() {
  // First try standard Node module resolution
  try {
    return require('axios');
  } catch (_) {
    // Fall back to absolute paths
    const candidates = [
      path.join(ROOT, 'node_modules/axios'),
      path.join(ROOT, 'frontend/node_modules/axios'),
      path.join(ROOT, 'backend/node_modules/axios'),
    ];
    for (const c of candidates) {
      try {
        const mod = require(c);
        const ax = mod && typeof mod.post === 'function' ? mod : mod.default;
        if (ax && typeof ax.post === 'function') return ax;
      } catch (_) {
        /* try next */
      }
    }
    throw new Error('Cannot find axios (install deps in frontend/ or backend/)');
  }
}
const axios = loadAxios();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
}

loadEnvFile(path.join(ROOT, 'config.env'));
loadEnvFile(path.join(ROOT, 'secrets.env'));

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const FIXTURE = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'fixtures/test-data/static-e2e-users.json'), 'utf8')
);
const PASSWORD = FIXTURE.password || 'TestNewPassword123!';
const USERS = FIXTURE.users || [];

async function waitForBackend(timeoutMs = 90000) {
  const http = require('http');
  const https = require('https');
  const deadline = Date.now() + timeoutMs;
  const url = new URL(`${BACKEND_URL.replace(/\/$/, '')}/health`);
  const lib = url.protocol === 'https:' ? https : http;

  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const req = lib.get(url, { timeout: 2500 }, (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Backend not healthy at ${BACKEND_URL}`);
}

async function ensureUser({ name, email, partyType, organization, description, cloudProviders }) {
  try {
    const login = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password: PASSWORD,
    });
    if (login.status === 200 && login.data?.accessToken) {
      console.log(`   ✓ already active: ${email}`);
      return { email, status: 'exists' };
    }
  } catch (_) {
    // register below
  }

  let temporaryPassword;
  try {
    const body = {
      name,
      email,
      partyType,
    };
    if (organization) body.organization = organization;
    if (description) body.description = description;
    if (Array.isArray(cloudProviders) && cloudProviders.length) {
      body.cloudProviders = cloudProviders;
    }
    const reg = await axios.post(`${BACKEND_URL}/api/auth/register`, body);
    temporaryPassword = reg.data?.loginCredentials?.password;
    console.log(`   + registered: ${email} (${partyType})`);
  } catch (err) {
    const status = err.response?.status;
    if (status === 400 || status === 409) {
      console.log(`   ~ exists (login pending): ${email}`);
      return { email, status: 'exists-unverified' };
    }
    throw err;
  }

  if (temporaryPassword) {
    await axios.post(`${BACKEND_URL}/api/auth/first-login-password`, {
      email,
      currentPassword: temporaryPassword,
      newPassword: PASSWORD,
    });
    console.log(`   ✓ password set: ${email}`);
  }
  return { email, status: 'created' };
}

async function listTspUsers(adminToken) {
  const res = await axios
    .get(`${BACKEND_URL}/api/users/tsp`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    .catch(() =>
      axios.get(`${BACKEND_URL}/api/users/ccrp`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
    );
  return Array.isArray(res.data) ? res.data : [];
}

async function ensureStaticTspLocal(adminToken) {
  const tsp = USERS.find((u) => u.cloudProviders?.includes('Local'));
  if (!tsp) return;
  const rows = await listTspUsers(adminToken);
  const user = rows.find((u) => u.email === tsp.email);
  if (!user) {
    console.warn(`   ⚠️ static TSP not found for Local provider: ${tsp.email}`);
    return;
  }
  const existing = Array.isArray(user.cloudProviders) ? user.cloudProviders : [];
  if (JSON.stringify(existing) === JSON.stringify(['Local'])) return;
  await axios.put(
    `${BACKEND_URL}/api/users/${user.id}`,
    {
      cloudProviders: ['Local'],
      description: tsp.description || 'Static E2E TSP for Local Docker training only',
    },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  console.log(`   ✓ Local cloud provider on ${tsp.email}`);
}

async function ensureStaticTspOci(adminToken) {
  const tsp = USERS.find((u) => u.cloudProviders?.includes('OCI'));
  if (!tsp) return;
  const rows = await listTspUsers(adminToken);
  const user = rows.find((u) => u.email === tsp.email);
  if (!user) {
    console.warn(`   ⚠️ static OCI TSP not found: ${tsp.email}`);
    return;
  }
  const patch = {
    cloudProviders: ['OCI'],
    description:
      tsp.description ||
      'OCI infrastructure provider: confidential-vm on OKE, OCI Vault, Object Storage, SPIFFE/WIF. Not Local Docker.',
    organization: tsp.organization || user.organization || 'SecureClean Rooms LLC',
  };
  const existing = Array.isArray(user.cloudProviders) ? user.cloudProviders : [];
  const already =
    JSON.stringify(existing) === JSON.stringify(['OCI']) &&
    String(user.description || '') === String(patch.description);
  if (already) {
    console.log(`   ✓ OCI infrastructure provider already set on ${tsp.email}`);
    return;
  }
  await axios.put(`${BACKEND_URL}/api/users/${user.id}`, patch, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   ✓ OCI infrastructure provider on ${tsp.email}`);
}

async function verifyAllLogins() {
  const failures = [];
  for (const u of USERS) {
    try {
      const login = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: u.email,
        password: PASSWORD,
      });
      if (!login.data?.accessToken) failures.push(u.email);
    } catch (_) {
      failures.push(u.email);
    }
  }
  return failures;
}

async function main() {
  console.log('🌱 Seeding static E2E users...');
  console.log(`   Backend: ${BACKEND_URL}`);
  await waitForBackend();

  for (const u of USERS) {
    // Prefer TSP; fall back to legacy CCRP if backend rejects TSP for this email already as CCRP
    try {
      await ensureUser({
        name: u.name,
        email: u.email,
        partyType: u.partyType,
        organization: u.organization,
        description: u.description,
        cloudProviders: u.cloudProviders,
      });
    } catch (err) {
      if (u.legacyPartyType) {
        await ensureUser({
          name: u.name,
          email: u.email,
          partyType: u.legacyPartyType,
          organization: u.organization,
          description: u.description,
          cloudProviders: u.cloudProviders,
        });
      } else {
        throw err;
      }
    }
  }

  const adminLogin = await axios.post(`${BACKEND_URL}/api/auth/login`, {
    email: 'appadmin.e2e@test.com',
    password: PASSWORD,
  });
  await ensureStaticTspLocal(adminLogin.data.accessToken);
  await ensureStaticTspOci(adminLogin.data.accessToken);

  const failures = await verifyAllLogins();
  if (failures.length) {
    console.error('❌ Some static users cannot log in:', failures.join(', '));
    process.exit(1);
  }

  console.log('✅ Static E2E users ready');
  console.log(`   Password (all): ${PASSWORD}`);
  for (const u of USERS) {
    console.log(`   - ${u.role || u.partyType}: ${u.email}`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('💥 Seed failed:', err.response?.data || err.message);
    process.exit(1);
  });
}

module.exports = {
  STATIC_E2E_USERS: USERS,
  STATIC_E2E_PASSWORD: PASSWORD,
  ensureUser,
  verifyAllLogins,
  waitForBackend,
  BACKEND_URL,
};
