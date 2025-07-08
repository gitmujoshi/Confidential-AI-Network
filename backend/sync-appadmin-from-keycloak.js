/**
 * Sync AppAdmin from Keycloak to Local DB
 *
 * This script fetches the AppAdmin user from Keycloak and inserts it into the local database if not present.
 */

const axios = require('axios');
const db = require('./models');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'contract-management';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const APPADMIN_EMAIL = 'appadmin@contractmanagement.com';

async function getAdminToken() {
  const response = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    new URLSearchParams({
      username: ADMIN_USER,
      password: ADMIN_PASS,
      grant_type: 'password',
      client_id: 'admin-cli'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  return response.data.access_token;
}

async function getKeycloakUser(token, email) {
  const response = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data && response.data.length > 0 ? response.data[0] : null;
}

async function syncAppAdmin() {
  try {
    console.log('🔄 Syncing AppAdmin from Keycloak to local DB...');
    const token = await getAdminToken();
    const kcUser = await getKeycloakUser(token, APPADMIN_EMAIL);
    if (!kcUser) {
      console.error('❌ AppAdmin user not found in Keycloak!');
      return;
    }

    // Check if user exists in local DB
    const localUser = await db.User.findOne({ where: { email: APPADMIN_EMAIL } });
    if (localUser) {
      console.log('✅ AppAdmin user already exists in local DB. No action needed.');
      return;
    }

    // Insert user into local DB
    const newUser = await db.User.create({
      name: `${kcUser.firstName || ''} ${kcUser.lastName || ''}`.trim() || 'AppAdmin',
      email: kcUser.email,
      partyType: 'AppAdmin',
      description: 'Application Administrator synced from Keycloak',
      organization: kcUser.attributes?.organization?.[0] || 'Contract Management System',
      phoneNumber: kcUser.attributes?.phoneNumber?.[0] || '',
      website: kcUser.attributes?.website?.[0] || '',
      location: kcUser.attributes?.location?.[0] || '',
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      emailVerified: true,
      iamUserId: kcUser.id,
      iamUsername: kcUser.username,
      walletAddress: kcUser.attributes?.walletAddress?.[0] || null,
      publicKey: kcUser.attributes?.publicKey?.[0] || null
    });
    console.log('✅ AppAdmin user inserted into local DB:', newUser.email);
  } catch (error) {
    console.error('❌ Sync failed:', error.response?.data || error.message);
  } finally {
    await db.sequelize.close();
  }
}

// Run the sync
syncAppAdmin(); 