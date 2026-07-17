#!/usr/bin/env node
/**
 * Remove Keycloak realm users that have no matching row in the application database
 * (by email or by iam_user_id), so IAM matches Postgres after DB purges / resets.
 *
 * Usage (from repo root or backend/):
 *   node backend/scripts/source/cleanup-orphaned-keycloak-users.js           # dry-run (default)
 *   node backend/scripts/source/cleanup-orphaned-keycloak-users.js --execute # delete orphans
 *
 * Or: DRY_RUN=0 node backend/scripts/source/cleanup-orphaned-keycloak-users.js
 */
const path = require('path');

const configPath = path.resolve(__dirname, '../../../config.env');
const secretsPath = path.resolve(__dirname, '../../../secrets.env');
require('dotenv').config({ path: configPath });
try {
  require('dotenv').config({ path: secretsPath });
} catch (_) {}

const db = require('../../models');
const KeycloakService = require('../../services/keycloakService');

function normEmail(s) {
  return String(s || '').trim().toLowerCase();
}

function isProtectedKeycloakUser(u) {
  const un = normEmail(u.username);
  const em = normEmail(u.email);
  if (un === 'admin' || em === 'admin' || em === 'admin@localhost') return true;
  // Client service users — do not delete (would break confidential clients).
  if (String(u.username || '').startsWith('service-account-')) return true;
  return false;
}

/** True if this Keycloak user corresponds to a row in our users table. */
function isLinkedToDb(u, localEmails, localIamIds) {
  const em = normEmail(u.email);
  const un = normEmail(u.username);
  if (em && localEmails.has(em)) return true;
  if (un && localEmails.has(un)) return true;
  if (u.id && localIamIds.has(String(u.id))) return true;
  return false;
}

async function main({ dryRun = true } = {}) {
  const keycloak = new KeycloakService();

  try {
    await db.sequelize.authenticate();
    console.log('✅ Connected to database');

    const localUsers = await db.User.findAll({
      attributes: ['email', 'iamUserId'],
    });
    const localEmails = new Set(localUsers.map((u) => normEmail(u.email)).filter(Boolean));
    const localIamIds = new Set(
      localUsers.map((u) => u.iamUserId).filter((id) => id != null && String(id).length > 0).map(String)
    );

    console.log(`📋 DB active users: ${localUsers.length} (unique emails: ${localEmails.size})`);

    const keycloakUsers = await keycloak.listRealmUsersPaginated();
    console.log(`📋 Keycloak realm users fetched: ${keycloakUsers.length}`);

    const orphans = keycloakUsers.filter((u) => {
      if (isProtectedKeycloakUser(u)) return false;
      if (!u.id) return false;
      return !isLinkedToDb(u, localEmails, localIamIds);
    });

    if (orphans.length === 0) {
      console.log('✅ No orphaned Keycloak users (all realm users match DB or are protected).');
      return;
    }

    console.log(`\n⚠️  Orphaned Keycloak users (not in DB): ${orphans.length}`);
    orphans.forEach((u) => {
      console.log(`   - ${u.email || u.username || '(no email)'} (id=${u.id}, username=${u.username || '—'})`);
    });

    if (dryRun) {
      console.log('\nDry run: no deletions. Re-run with --execute or DRY_RUN=0 to delete these users from Keycloak.');
      return;
    }

    let deleted = 0;
    for (const u of orphans) {
      const ok = await keycloak.deleteUser(u.id);
      if (ok) {
        deleted++;
        console.log(`🗑️  Deleted Keycloak user ${u.email || u.username} (${u.id})`);
      } else {
        console.error(`❌ Failed to delete Keycloak user ${u.email || u.username} (${u.id})`);
      }
    }
    console.log(`\n✅ Cleanup finished (${deleted}/${orphans.length} deleted).`);
    console.log('Next: npm run keycloak:sync --prefix backend  (ensure DB users exist in Keycloak)');
  } catch (err) {
    console.error('❌ Error during Keycloak cleanup:', err.response?.data || err.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  const execute = process.argv.includes('--execute') || process.env.DRY_RUN === '0';
  main({ dryRun: !execute })
    .then(() => process.exit(process.exitCode || 0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = main;
