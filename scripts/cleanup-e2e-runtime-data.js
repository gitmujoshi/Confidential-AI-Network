#!/usr/bin/env node
/**
 * Remove E2E runtime clutter while keeping seeded role users + catalog fixtures.
 *
 * Keeps:
 *   - Static E2E users (fixtures/test-data/static-e2e-users.json)
 *   - Jurisdiction seed users (*@jurisdiction-test.com)
 *   - India financial seed users (*@in-fintech-test.com)
 *   - Seed datasets (e2e-dataset-1, e2e-nlp-ag-news, in-fin-*)
 *   - Seed AI models (playwright / india-financial-api)
 *   - Contract templates
 *   - Cloud credentials owned by kept users
 *
 * Deletes:
 *   - Ephemeral Playwright users (pw-e2e*, tdc.e2e.<ts>*, …)
 *   - Contracts, training jobs, notifications, CAN/SCITT runtime rows
 *   - Ephemeral datasets (PW-E2E, MNIST-HANDWRITTEN-*, E2E-ROLE-CRUD-*, …)
 *   - Local trainer run directories under backend/local-training/runs
 *
 * Usage:
 *   npm run cleanup:e2e-data
 *   SKIP_KEYCLOAK=1 npm run cleanup:e2e-data
 */

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

const SKIP_KEYCLOAK = process.env.SKIP_KEYCLOAK === '1' || process.env.SKIP_KEYCLOAK === 'true';

const STATIC_USERS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'fixtures/test-data/static-e2e-users.json'), 'utf8')
).users.map((u) => String(u.email).toLowerCase());

const KEEP_DATASET_IDS = new Set(['e2e-dataset-1', 'e2e-nlp-ag-news']);

function isSeedUserEmail(email) {
  const e = String(email || '').toLowerCase();
  if (!e) return false;
  if (STATIC_USERS.includes(e)) return true;
  if (e.endsWith('@jurisdiction-test.com')) return true;
  if (e.endsWith('@in-fintech-test.com')) return true;
  return false;
}

function isEphemeralUserEmail(email) {
  const e = String(email || '').toLowerCase();
  if (!e || isSeedUserEmail(e)) return false;
  return (
    e.startsWith('pw-e2e') ||
    e.includes('@example.com') ||
    /^tdc\.e2e\.\d+/i.test(e) ||
    /^tdp\.e2e\.\d+/i.test(e) ||
    /^ccrp\.e2e\.\d+/i.test(e) ||
    /^tdc\.ui\.\d+/i.test(e) ||
    /^tsp\.e2e\.\d+/i.test(e) ||
    /e2e\.\d{10,}/i.test(e)
  );
}

async function count(db, sql, replacements = {}) {
  const [rows] = await db.sequelize.query(sql, { replacements });
  return Number(rows[0]?.c || 0);
}

async function cleanupDatabase() {
  const db = require(path.join(ROOT, 'backend/models'));
  console.log('\n🗑️  Cleaning E2E runtime database rows...');

  const summary = {};

  // 1) Truncate pure runtime / transactional tables (keep users/datasets/models/templates/credentials).
  const runtimeTables = [
    'contracts',
    'contract_datasets',
    'training_jobs',
    'training_progress',
    'training_environments',
    'notifications',
    'can_jcs_jobs',
    'can_jcs_events',
    'can_jcs_attestations',
    'can_ccr_sessions',
    'can_provenance_events',
    'scitt_claims',
    'signatures',
    'signing_events',
    'signing_requests',
    'provenance_captures',
    'provenance_nodes',
    'provenance_verifications',
    'merkle_trees',
    'environment_costs',
    'environment_resources',
    'AuditLogs',
    'dpdp_audit_logs',
    'PrivacyBudgetLogs',
    'PrivacyBudgets',
    'PrivacyOperationsLogs',
    'Consents',
    'consents',
    'DataBreaches',
    'data_breaches',
    'DataProcessingRecords',
    'data_processing_records',
    'Grievances',
    'grievance_records',
    'dpia_reports',
    'data_retention_policies',
    'system_health_log',
    'constraint_values',
    'user_keys',
    'enterprise_keys',
  ];

  const [existing] = await db.sequelize.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  `);
  const existingSet = new Set(existing.map((t) => t.tablename));
  const toTruncate = runtimeTables.filter((t) => existingSet.has(t));
  if (toTruncate.length) {
    const names = toTruncate.map((t) => `"${t}"`).join(', ');
    await db.sequelize.query(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
    summary.truncatedTables = toTruncate.length;
    console.log(`   truncated ${toTruncate.length} runtime tables`);
  }

  // 2) Delete ephemeral datasets (keep seed catalog IDs + india-financial).
  const [deletedDatasets] = await db.sequelize.query(`
    DELETE FROM datasets
    WHERE dataset_id NOT IN (:keepIds)
      AND COALESCE(metadata->>'seededBy', '') <> 'india-financial-api'
      AND dataset_id NOT LIKE 'in-fin-%'
    RETURNING dataset_id
  `, {
    replacements: { keepIds: Array.from(KEEP_DATASET_IDS) },
  });
  summary.datasetsDeleted = deletedDatasets.length;
  console.log(`   deleted ${deletedDatasets.length} ephemeral dataset(s)`);

  // 3) Keep seed AI models only (playwright catalog + india financial).
  const [deletedModels] = await db.sequelize.query(`
    DELETE FROM ai_models
    WHERE COALESCE(metadata->>'seededBy', '') NOT IN ('playwright', 'india-financial-api')
       OR (
         COALESCE(metadata->>'seededBy', '') = 'playwright'
         AND model_id NOT IN (
           'e2e-model-tabular-logreg',
           'e2e-model-1',
           'MODEL-E2E-001',
           'e2e-model-nlp-distilbert'
         )
       )
    RETURNING model_id
  `);
  summary.modelsDeleted = deletedModels.length;
  console.log(`   deleted ${deletedModels.length} non-seed AI model(s)`);

  // 4) Delete ephemeral users (and their leftover credentials).
  const [allUsers] = await db.sequelize.query(`SELECT id, email FROM users`);
  const ephemeralIds = allUsers.filter((u) => isEphemeralUserEmail(u.email)).map((u) => u.id);
  const keepIds = allUsers.filter((u) => isSeedUserEmail(u.email)).map((u) => u.id);

  if (ephemeralIds.length) {
    if (existingSet.has('ccrp_cloud_credentials')) {
      await db.sequelize.query(
        `DELETE FROM ccrp_cloud_credentials WHERE "ccrpUserId" IN (:ids)`,
        { replacements: { ids: ephemeralIds } }
      );
    }
    if (existingSet.has('ccrp_azure_credentials')) {
      await db.sequelize.query(
        `DELETE FROM ccrp_azure_credentials WHERE "ccrpUserId" IN (:ids)`,
        { replacements: { ids: ephemeralIds } }
      ).catch(() => {});
    }
    const [deletedUsers] = await db.sequelize.query(
      `DELETE FROM users WHERE id IN (:ids) RETURNING email`,
      { replacements: { ids: ephemeralIds } }
    );
    summary.usersDeleted = deletedUsers.length;
    console.log(`   deleted ${deletedUsers.length} ephemeral user(s)`);
  } else {
    summary.usersDeleted = 0;
    console.log('   no ephemeral users to delete');
  }

  // Drop credentials that somehow point at missing users.
  if (existingSet.has('ccrp_cloud_credentials') && keepIds.length) {
    await db.sequelize.query(
      `DELETE FROM ccrp_cloud_credentials WHERE "ccrpUserId" NOT IN (:ids)`,
      { replacements: { ids: keepIds } }
    ).catch(() => {});
  }

  summary.usersKept = await count(db, 'SELECT COUNT(*)::int AS c FROM users');
  summary.datasetsKept = await count(db, 'SELECT COUNT(*)::int AS c FROM datasets');
  summary.modelsKept = await count(db, 'SELECT COUNT(*)::int AS c FROM ai_models');
  summary.contractsLeft = await count(db, 'SELECT COUNT(*)::int AS c FROM contracts');
  summary.jobsLeft = await count(db, 'SELECT COUNT(*)::int AS c FROM training_jobs');
  summary.notificationsLeft = await count(db, 'SELECT COUNT(*)::int AS c FROM notifications');

  await db.sequelize.close();
  return summary;
}

async function cleanupKeycloakEphemeralUsers() {
  if (SKIP_KEYCLOAK || process.env.KEYCLOAK_ENABLED !== 'true') {
    console.log('\n⏭️  Skipping Keycloak cleanup (KEYCLOAK_ENABLED not true or SKIP_KEYCLOAK set)');
    return { deleted: 0 };
  }

  console.log('\n🗑️  Removing ephemeral users from Keycloak...');
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
    const ephemeral = users.filter((u) => isEphemeralUserEmail(u.email || u.username));
    if (!ephemeral.length) break;
    for (const user of ephemeral) {
      const ok = await keycloak.deleteUser(user.id);
      if (ok) {
        deleted += 1;
        console.log(`   deleted ${user.email || user.username || user.id}`);
      }
    }
  }
  console.log(`✅ Keycloak: removed ${deleted} ephemeral user(s)`);
  return { deleted };
}

function cleanupLocalTrainingRuns() {
  const runsDir = path.join(ROOT, 'backend/local-training/runs');
  if (!fs.existsSync(runsDir)) {
    console.log('\n⏭️  No local-training/runs directory');
    return { removed: 0 };
  }
  console.log('\n🗑️  Clearing local training run artifacts...');
  let removed = 0;
  for (const name of fs.readdirSync(runsDir)) {
    const full = path.join(runsDir, name);
    try {
      fs.rmSync(full, { recursive: true, force: true });
      removed += 1;
    } catch (err) {
      console.warn(`   failed to remove ${name}: ${err.message}`);
    }
  }
  console.log(`✅ Removed ${removed} local training run director(y/ies)`);
  return { removed };
}

async function main() {
  console.log('🧹 Cleanup E2E runtime data (keep seed users + catalog)');
  console.log('======================================================');

  const dbSummary = await cleanupDatabase();
  const kcSummary = await cleanupKeycloakEphemeralUsers();
  const runsSummary = cleanupLocalTrainingRuns();

  console.log('\n🎉 Cleanup complete');
  console.log(JSON.stringify({ ...dbSummary, keycloakDeleted: kcSummary.deleted, localRunsRemoved: runsSummary.removed }, null, 2));
  console.log('\nKept role users include:');
  STATIC_USERS.forEach((e) => console.log(`  - ${e}`));
  console.log('  - *@jurisdiction-test.com');
  console.log('  - *@in-fintech-test.com');
  console.log('Password (seeded): TestNewPassword123!');
}

main().catch((err) => {
  console.error('💥 Cleanup failed:', err);
  process.exit(1);
});
