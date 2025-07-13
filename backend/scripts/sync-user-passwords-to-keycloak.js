/**
 * Sync User Passwords to Keycloak
 *
 * This script sets the password for all users in the database to 'password123' in Keycloak.
 * It requires Keycloak admin credentials and the KeycloakService.
 */

const db = require('../models');
const KeycloakService = require('../services/keycloakService');
const keycloakService = new KeycloakService();

const PASSWORD = 'password123';

async function syncPasswordsToKeycloak() {
  try {
    console.log('🔐 Syncing user passwords to Keycloak...\n');
    const users = await db.User.findAll({ where: { isActive: true } });
    if (!users.length) {
      console.log('❌ No users found in database.');
      return;
    }
    for (const user of users) {
      if (!user.email) {
        console.log(`❌ Skipping user with missing email (ID: ${user.id})`);
        continue;
      }
      try {
        await keycloakService.setUserPasswordByEmail(user.email, PASSWORD);
        console.log(`✅ Password synced for: ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to sync password for ${user.email}:`, err.message);
      }
    }
    console.log('\n🎉 All user passwords synced to Keycloak!');
    console.log(`\nAll users can now login with password: ${PASSWORD}`);
  } catch (error) {
    console.error('❌ Error syncing passwords to Keycloak:', error);
  }
}

syncPasswordsToKeycloak()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 