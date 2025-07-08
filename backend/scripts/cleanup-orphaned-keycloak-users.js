/**
 * Cleanup Orphaned Keycloak Users
 *
 * This script finds users in Keycloak that do not exist in the local database and offers to delete them.
 */

const { Sequelize } = require('sequelize');
const KeycloakService = require('../services/keycloakService');
require('dotenv').config({ path: '../config.env' });

async function main({ dryRun = true } = {}) {
  // Connect to DB
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'contract_management',
    process.env.DB_USER || 'mukeshjoshi',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );

  const db = require('../models');
  const keycloak = new KeycloakService();

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Get all local users (by email)
    const localUsers = await db.User.findAll({ attributes: ['email', 'iamUserId'] });
    const localEmails = new Set(localUsers.map(u => u.email.toLowerCase()));
    const localIamIds = new Set(localUsers.map(u => u.iamUserId));

    // Get all Keycloak users (paginated)
    const adminToken = await keycloak.getAdminToken();
    let keycloakUsers = [];
    let first = 0;
    const max = 100;
    let fetched = 0;
    do {
      const response = await require('axios').get(
        `${keycloak.baseURL}/admin/realms/${keycloak.realm}/users?first=${first}&max=${max}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      fetched = response.data.length;
      keycloakUsers = keycloakUsers.concat(response.data);
      first += max;
    } while (fetched === max);

    // Find orphans: Keycloak users not in local DB
    const orphans = keycloakUsers.filter(u => {
      // Ignore service accounts, admin, etc.
      if (u.username === 'admin' || u.email === 'admin' || u.email === 'admin@localhost') return false;
      if (!u.email) return false;
      return !localEmails.has(u.email.toLowerCase()) && !localIamIds.has(u.id);
    });

    if (orphans.length === 0) {
      console.log('✅ No orphaned Keycloak users found.');
      return;
    }

    console.log(`⚠️ Found ${orphans.length} orphaned Keycloak user(s):`);
    orphans.forEach(u => {
      console.log(`- ${u.email} (id: ${u.id}, username: ${u.username})`);
    });

    if (dryRun) {
      console.log('\n(DRY RUN) No users deleted. Run with DRY_RUN=0 to actually delete.');
      return;
    }

    // Delete orphans
    for (const u of orphans) {
      try {
        await keycloak.deleteUser(u.id);
        console.log(`🗑️ Deleted orphaned Keycloak user: ${u.email} (${u.id})`);
      } catch (err) {
        console.error(`❌ Failed to delete user ${u.email} (${u.id}):`, err.message);
      }
    }
    console.log('✅ Cleanup complete.');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  const dryRun = process.env.DRY_RUN !== '0';
  main({ dryRun });
}

module.exports = main; 