/**
 * Check AppAdmin Status
 * 
 * This script checks the AppAdmin user status in both Keycloak and local database
 */

const axios = require('axios');
const db = require('./models');

const BASE_URL = 'http://localhost:5001/api';

async function checkAppAdminStatus() {
  try {
    console.log('🔍 Checking AppAdmin Status...\n');

    // Check local database for AppAdmin users
    console.log('1️⃣ Checking local database for AppAdmin users...');
    const appAdminUsers = await db.User.findAll({
      where: { partyType: 'AppAdmin' },
      attributes: ['id', 'name', 'email', 'partyType', 'isActive', 'isRegistered', 'iamUserId', 'iamUsername']
    });

    console.log(`Found ${appAdminUsers.length} AppAdmin users in local database:`);
    appAdminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Active: ${user.isActive}`);
      console.log(`      Registered: ${user.isRegistered}`);
      console.log(`      IAM User ID: ${user.iamUserId || 'Not set'}`);
      console.log(`      IAM Username: ${user.iamUsername || 'Not set'}`);
      console.log('');
    });

    // Try to login with known AppAdmin credentials
    console.log('2️⃣ Testing AppAdmin login...');
    const testCredentials = [
      { email: 'appadmin@example.com', password: 'AppAdmin123!' },
      { email: 'admin@example.com', password: 'Admin123!' },
      { email: 'appadmin@contractmanagement.com', password: 'AppAdmin123!' }
    ];

    for (const cred of testCredentials) {
      try {
        console.log(`   Testing: ${cred.email}`);
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: cred.email,
          password: cred.password
        });
        
        console.log(`   ✅ Login successful for ${cred.email}!`);
        console.log(`      Access Token: ${loginResponse.data.accessToken ? 'Received' : 'Not received'}`);
        console.log(`      User Info: ${JSON.stringify(loginResponse.data.user, null, 2)}`);
        break;
      } catch (error) {
        console.log(`   ❌ Login failed for ${cred.email}: ${error.response?.data?.error || error.message}`);
      }
    }

    // Check if there are any users with admin-like emails
    console.log('\n3️⃣ Checking for admin-like users...');
    const adminLikeUsers = await db.User.findAll({
      where: {
        email: {
          [db.Sequelize.Op.iLike]: '%admin%'
        }
      },
      attributes: ['id', 'name', 'email', 'partyType', 'isActive']
    });

    if (adminLikeUsers.length > 0) {
      console.log('Found admin-like users:');
      adminLikeUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.partyType}`);
      });
    } else {
      console.log('No admin-like users found');
    }

    // Check Keycloak service status
    console.log('\n4️⃣ Checking Keycloak service...');
    try {
      const KeycloakService = require('./services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
      
      // Try to get admin token
      const adminToken = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getAdminToken();
      console.log('   ✅ Keycloak admin token obtained successfully');
      
      // List users in Keycloak
      try {
        const users = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.listUsers();
        const appAdminUsersInKeycloak = users.filter(user => 
          user.username?.includes('admin') || 
          user.email?.includes('admin') ||
          user.attributes?.partyType?.includes('AppAdmin')
        );
        
        console.log(`   Found ${appAdminUsersInKeycloak.length} admin-like users in Keycloak:`);
        appAdminUsersInKeycloak.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.username || user.email}`);
          console.log(`         ID: ${user.id}`);
          console.log(`         Email: ${user.email}`);
          console.log(`         Enabled: ${user.enabled}`);
          console.log(`         Party Type: ${user.attributes?.partyType?.[0] || 'Not set'}`);
        });
      } catch (listError) {
        console.log(`   ⚠️ Could not list Keycloak users: ${listError.message}`);
      }
      
    } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
      console.log(`   ❌ Keycloak service error: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Error.message}`);
    }

    console.log('\n📋 Summary:');
    console.log(`   Local AppAdmin users: ${appAdminUsers.length}`);
    console.log(`   Keycloak accessible: ${adminToken ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkAppAdminStatus(); 