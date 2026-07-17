#!/usr/bin/env node
/**
 * Wipe test users + related DB data and Keycloak realm users, then seed fresh fixtures.
 *
 * Usage:
 *   npm run test:users:reset-seed
 *   SKIP_KEYCLOAK=1 npm run test:users:reset-seed   # DB + seed only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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
const SKIP_KEYCLOAK = process.env.SKIP_KEYCLOAK === '1' || process.env.SKIP_KEYCLOAK === 'true';

async function assertBackendHealthy() {
  const axios = require('axios');
  try {
    await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is healthy');
  } catch (err) {
    console.error(`❌ Backend not reachable at ${BACKEND_URL}: ${err.message}`);
    console.error('   Start the backend first: cd backend && npm start');
    process.exit(1);
  }
}

async function wipeKeycloakUsers() {
  if (SKIP_KEYCLOAK || process.env.KEYCLOAK_ENABLED !== 'true') {
    console.log('⏭️  Skipping Keycloak cleanup (KEYCLOAK_ENABLED not true or SKIP_KEYCLOAK set)');
    return;
  }

  console.log('\n🗑️  Clearing Keycloak realm users...');
  if (/localhost|127\.0\.0\.1/.test(process.env.KEYCLOAK_URL || '')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  const KeycloakService = require(path.join(ROOT, 'backend/services/keycloakService'));
  const keycloak = new KeycloakService();

  let deleted = 0;
  let pass = 0;
  while (pass < 20) {
    pass += 1;
    let users = [];
    try {
      users = await keycloak.getUsers({ max: 500 });
    } catch (err) {
      console.warn(`⚠️  Could not list Keycloak users: ${err.message}`);
      break;
    }
    if (!users.length) break;
    for (const user of users) {
      const ok = await keycloak.deleteUser(user.id);
      if (ok) {
        deleted += 1;
        console.log(`   deleted ${user.email || user.username || user.id}`);
      } else {
        console.warn(`   failed to delete ${user.email || user.id}`);
      }
    }
  }
  console.log(`✅ Keycloak: removed ${deleted} user(s)`);
}

async function wipeDatabase() {
  console.log('\n🗑️  Truncating application database tables...');

  const db = require(path.join(ROOT, 'backend/models'));

  const [tables] = await db.sequelize.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('SequelizeMeta', 'sequelize_meta')
    ORDER BY tablename
  `);

  if (!tables.length) {
    console.log('⚠️  No tables found to truncate');
    await db.sequelize.close();
    return;
  }

  const names = tables.map((t) => `"${t.tablename}"`).join(', ');
  await db.sequelize.query(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
  console.log(`✅ Truncated ${tables.length} tables`);
  return db;
}

async function runPartyTypeMigration(db) {
  console.log('\n🔄 Ensuring TSP party type enum (CCRP → TSP migration)...');
  try {
    const migrate = require(path.join(ROOT, 'backend/scripts/migration/migrate-ccrp-to-tsp'));
    await migrate();
  } catch (err) {
    const msg = err.message || String(err);
    if (/already exists|does not exist|invalid input value|ConnectionManager/i.test(msg)) {
      console.log('ℹ️  Party-type migration skipped or already applied:', msg.split('\n')[0]);
    } else {
      console.warn('⚠️  Party-type migration warning:', msg.split('\n')[0]);
    }
  }
}

async function ensureKeycloakRoles() {
  if (SKIP_KEYCLOAK || process.env.KEYCLOAK_ENABLED !== 'true') return;
  console.log('\n🔐 Syncing Keycloak realm roles (TSP, etc.)...');
  try {
    execSync('node setup-keycloak.js', {
      cwd: path.join(ROOT, 'backend'),
      stdio: 'inherit',
      env: process.env,
    });
  } catch (err) {
    console.warn('⚠️  Keycloak setup warning:', err.message);
  }
}

async function waitForBackend(ms = 10000) {
  const axios = require('axios');
  console.log(`\n⏳ Waiting for backend to recover after DB wipe (up to ${ms / 1000}s)...`);
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
      await new Promise((r) => setTimeout(r, 2000));
      console.log('✅ Backend ready for registration');
      return;
    } catch (_) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.warn('⚠️  Backend health check slow; continuing with seed anyway');
}

function runSeedScripts() {
  console.log('\n🌱 Seeding jurisdiction test users...');
  try {
    execSync('node scripts/create-jurisdiction-test-users.js', {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    });
  } catch (err) {
    console.warn('⚠️  Jurisdiction seed had failures; continuing with India financial seed...');
  }

  console.log('\n🌱 Seeding India financial consortium users + catalog...');
  execSync('node scripts/create-india-financial-test-users.js', {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
}

async function main() {
  console.log('🧹 Reset test data and re-seed');
  console.log('================================');
  console.log(`Backend: ${BACKEND_URL}`);

  await assertBackendHealthy();
  await wipeKeycloakUsers();
  const db = await wipeDatabase();
  await runPartyTypeMigration(db);
  await db.sequelize.close();
  await ensureKeycloakRoles();
  await waitForBackend();
  runSeedScripts();

  console.log('\n🎉 Reset complete');
  console.log('Password (all seeded users): TestNewPassword123!');
  console.log('  Jurisdiction: *@jurisdiction-test.com');
  console.log('  India financial: *@in-fintech-test.com');
  console.log('\nExamples:');
  console.log('  tdc.lending-pool@in-fintech-test.com');
  console.log('  tsp.yotta@in-fintech-test.com');
  console.log('  tdp.hdfc@in-fintech-test.com');
  console.log('  tdc.us-east@jurisdiction-test.com');
}

main().catch((err) => {
  console.error('💥 Reset failed:', err);
  process.exit(1);
});
