#!/usr/bin/env node

/**
 * Create test users across roles, jurisdictions, and deployment prefixes.
 * Uses /api/auth/register (Keycloak + DB sync) with global DEPA ID options.
 *
 * Usage:
 *   node scripts/create-jurisdiction-test-users.js
 *   BACKEND_URL=http://localhost:5001 node scripts/create-jurisdiction-test-users.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

loadEnvFile(path.join(__dirname, '..', 'config.env'));
loadEnvFile(path.join(__dirname, '..', 'secrets.env'));

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const DEFAULT_PASSWORD = process.env.JURISDICTION_TEST_PASSWORD || 'TestNewPassword123!';

/** Deployment × jurisdiction matrix (prefix drives DEPA ID; jurisdiction drives compliance format). */
const DEPLOYMENTS = [
  {
    key: 'local',
    deploymentPrefix: 'LOCAL',
    jurisdiction: null,
    region: 'local',
    country: 'Local Dev',
    cloudProvider: 'Local',
  },
  {
    key: 'us-east',
    deploymentPrefix: 'US-EAST',
    jurisdiction: 'US-Federal',
    region: 'us-east-1',
    country: 'United States',
    cloudProvider: 'AWS',
  },
  {
    key: 'eu-west',
    deploymentPrefix: 'EU-WEST',
    jurisdiction: 'EU-GDPR',
    region: 'eu-west-1',
    country: 'European Union',
    cloudProvider: 'Azure',
  },
  {
    key: 'ap-se',
    deploymentPrefix: 'AP-SE',
    jurisdiction: 'AP-Singapore',
    region: 'ap-southeast-1',
    country: 'Singapore',
    cloudProvider: 'AWS',
  },
  {
    key: 'ca-central',
    deploymentPrefix: 'CA-CENTRAL',
    jurisdiction: 'CA-Federal',
    region: 'ca-central-1',
    country: 'Canada',
    cloudProvider: 'Azure',
  },
];

const ROLES = [
  { partyType: 'TDP', slug: 'tdp', label: 'Training Data Provider' },
  { partyType: 'TDC', slug: 'tdc', label: 'Training Data Consumer' },
  { partyType: 'TSP', slug: 'tsp', label: 'Tech Service Provider' },
  { partyType: 'AppAdmin', slug: 'appadmin', label: 'Application Administrator' },
];

function buildUserSpec(deployment, role) {
  const email = `${role.slug}.${deployment.key}@jurisdiction-test.com`;
  const orgSuffix = deployment.deploymentPrefix.replace(/-/g, ' ');
  return {
    name: `${role.label} (${deployment.deploymentPrefix})`,
    email,
    password: DEFAULT_PASSWORD,
    partyType: role.partyType,
    organization: `${orgSuffix} ${role.label}`,
    description: `Test ${role.partyType} for ${deployment.deploymentPrefix}${
      deployment.jurisdiction ? ` / ${deployment.jurisdiction}` : ''
    }`,
    location: deployment.country,
    globalDEPAId: true,
    deploymentPrefix: deployment.deploymentPrefix,
    jurisdiction: deployment.jurisdiction || undefined,
    deploymentKey: deployment.key,
    deploymentPrefixMeta: deployment.deploymentPrefix,
    jurisdictionMeta: deployment.jurisdiction,
    regionMeta: deployment.region,
    cloudProviders: role.partyType === 'TSP' ? [deployment.cloudProvider] : null,
  };
}

function allUserSpecs() {
  const specs = [];
  for (const deployment of DEPLOYMENTS) {
    for (const role of ROLES) {
      specs.push(buildUserSpec(deployment, role));
    }
  }
  return specs;
}

async function login(email, password) {
  const res = await axios.post(
    `${BACKEND_URL}/api/auth/login`,
    { email, password },
    { timeout: 15000 }
  );
  return res.data;
}

async function registerUser(spec) {
  const body = {
    name: spec.name,
    email: spec.email,
    password: spec.password,
    partyType: spec.partyType,
    organization: spec.organization,
    description: spec.description,
    location: spec.location,
    globalDEPAId: true,
    deploymentPrefix: spec.deploymentPrefix,
  };
  if (spec.jurisdiction) body.jurisdiction = spec.jurisdiction;

  const res = await axios.post(`${BACKEND_URL}/api/auth/register`, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return res.data;
}

async function firstLoginPassword(email, temporaryPassword, newPassword) {
  await axios.post(
    `${BACKEND_URL}/api/auth/first-login-password`,
    { email, currentPassword: temporaryPassword, newPassword },
    { timeout: 15000 }
  );
}

async function ensurePassword(email, desiredPassword) {
  try {
    const data = await login(email, desiredPassword);
    if (data?.accessToken) return { existed: true, user: data.user };
  } catch (_) {
    // fall through
  }
  return { existed: false };
}

async function updateTspCloudProviders(userId, adminToken, cloudProviders) {
  await axios.put(
    `${BACKEND_URL}/api/users/${userId}`,
    { cloudProviders },
    { headers: { Authorization: `Bearer ${adminToken}` }, timeout: 15000 }
  );
}

async function ensureUser(spec) {
  const existing = await ensurePassword(spec.email, spec.password);
  if (existing.existed) {
    return {
      status: 'exists',
      email: spec.email,
      partyType: spec.partyType,
      deploymentKey: spec.deploymentKey,
      jurisdiction: spec.jurisdictionMeta,
      deploymentPrefix: spec.deploymentPrefixMeta,
      depaId: existing.user?.depaId || null,
      userId: existing.user?.id || null,
    };
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const reg = await registerUser(spec);
      const tempPassword = reg?.loginCredentials?.password;
      if (tempPassword && tempPassword !== spec.password) {
        await firstLoginPassword(spec.email, tempPassword, spec.password);
      }
      const loggedIn = await login(spec.email, spec.password);
      return {
        status: 'created',
        email: spec.email,
        partyType: spec.partyType,
        deploymentKey: spec.deploymentKey,
        jurisdiction: spec.jurisdictionMeta,
        deploymentPrefix: spec.deploymentPrefixMeta,
        depaId: loggedIn.user?.depaId || reg?.user?.depaId || null,
        userId: loggedIn.user?.id || reg?.user?.id || null,
      };
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error || err.response?.data?.message || err.message;
      const code = err.response?.data?.code;
      const retryable =
        attempt < maxAttempts &&
        (code === 'KEYCLOAK_CREATION_FAILED' ||
          /authentication system/i.test(String(message)));
      if (retryable) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      if (status === 409) {
        const retry = await ensurePassword(spec.email, spec.password);
        if (retry.existed) {
          return {
            status: 'exists',
            email: spec.email,
            partyType: spec.partyType,
            deploymentKey: spec.deploymentKey,
            jurisdiction: spec.jurisdictionMeta,
            deploymentPrefix: spec.deploymentPrefixMeta,
            depaId: retry.user?.depaId || null,
            userId: retry.user?.id || null,
          };
        }
      }
      return {
        status: 'failed',
        email: spec.email,
        partyType: spec.partyType,
        deploymentKey: spec.deploymentKey,
        error: message,
      };
    }
  }
}

async function main() {
  console.log('🌍 Creating jurisdiction × deployment test users');
  console.log(`📡 Backend: ${BACKEND_URL}`);
  console.log(`🔑 Password: ${DEFAULT_PASSWORD}`);

  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
  } catch (err) {
    console.error('❌ Backend not reachable. Start with ./start-system.sh or cd backend && npm start');
    process.exit(1);
  }

  const specs = allUserSpecs();
  const results = [];

  for (const spec of specs) {
    process.stdout.write(`👤 ${spec.email} ... `);
    const result = await ensureUser(spec);
    console.log(result.status);
    results.push(result);
    await new Promise((r) => setTimeout(r, 800));
  }

  const failedEmails = new Set(results.filter((r) => r.status === 'failed').map((r) => r.email));
  if (failedEmails.size > 0) {
    console.log(`\n🔁 Retrying ${failedEmails.size} failed registration(s)...`);
    for (const spec of specs.filter((s) => failedEmails.has(s.email))) {
      process.stdout.write(`👤 ${spec.email} (retry) ... `);
      const result = await ensureUser(spec);
      console.log(result.status);
      const idx = results.findIndex((r) => r.email === spec.email);
      if (idx >= 0) results[idx] = result;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Backfill TSP cloud providers per deployment
  const adminSpec = specs.find((s) => s.partyType === 'AppAdmin' && s.deploymentKey === 'local');
  let adminToken = null;
  if (adminSpec) {
    try {
      const adminLogin = await login(adminSpec.email, adminSpec.password);
      adminToken = adminLogin.accessToken;
    } catch (_) {
      console.warn('⚠️ Could not login local AppAdmin to patch TSP cloudProviders');
    }
  }

  if (adminToken) {
    for (const spec of specs.filter((s) => s.partyType === 'TSP' && s.cloudProviders)) {
      const row = results.find((r) => r.email === spec.email && r.userId);
      if (!row?.userId) continue;
      try {
        await updateTspCloudProviders(row.userId, adminToken, [spec.cloudProviders[0]]);
        row.cloudProviders = spec.cloudProviders;
      } catch (err) {
        row.cloudProvidersError = err.response?.data?.error || err.message;
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    backendUrl: BACKEND_URL,
    password: DEFAULT_PASSWORD,
    deployments: DEPLOYMENTS.map((d) => ({
      key: d.key,
      deploymentPrefix: d.deploymentPrefix,
      jurisdiction: d.jurisdiction,
      region: d.region,
      country: d.country,
    })),
    totals: {
      created: results.filter((r) => r.status === 'created').length,
      exists: results.filter((r) => r.status === 'exists').length,
      failed: results.filter((r) => r.status === 'failed').length,
      total: results.length,
    },
    users: results,
  };

  const outPath = path.join(
    __dirname,
    '..',
    'fixtures',
    'test-data',
    'jurisdiction-users-data.json'
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log('\n📊 Summary');
  console.log(`   Created: ${summary.totals.created}`);
  console.log(`   Already existed: ${summary.totals.exists}`);
  console.log(`   Failed: ${summary.totals.failed}`);
  console.log(`💾 Saved: ${outPath}`);

  if (summary.totals.failed > 0) process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
  });
}

module.exports = { DEPLOYMENTS, ROLES, allUserSpecs, buildUserSpec };
