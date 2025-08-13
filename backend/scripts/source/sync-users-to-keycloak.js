const axios = require('axios');
const { User } = require('../../models');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'https://localhost:8443';
const KEYCLOAK_REALM = 'contract-management';
const KEYCLOAK_ADMIN_USERNAME = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';

// Configure axios to ignore SSL certificate verification for self-signed certs
const httpsAgent = new (require('https').Agent)({
  rejectUnauthorized: false
});

// Create axios instance with SSL verification disabled
const axiosInstance = axios.create({
  httpsAgent: httpsAgent
});

// Function to get Keycloak admin token
async function getKeycloakToken() {
  try {
    const response = await axiosInstance.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        username: KEYCLOAK_ADMIN_USERNAME,
        password: KEYCLOAK_ADMIN_PASSWORD,
        grant_type: 'password',
        client_id: 'admin-cli'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to get Keycloak token:', error.response?.data || error.message);
    throw error;
  }
}

// Function to create user in Keycloak
async function createKeycloakUser(token, userData) {
  try {
    const ***REMOVED-KEYCLOAK_DB_PASSWORD***User = {
      username: userData.email,
      email: userData.email,
      firstName: userData.name.split(' ')[0] || userData.name,
      lastName: userData.name.split(' ').slice(1).join(' ') || '',
      enabled: true,
      emailVerified: true,
      attributes: {
        partyType: [userData.partyType],
        organization: [userData.name]
      }
    };

    const response = await axiosInstance.post(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      ***REMOVED-KEYCLOAK_DB_PASSWORD***User,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Get the created user to get the ID
    const usersResponse = await axiosInstance.get(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${encodeURIComponent(userData.email)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (usersResponse.data && usersResponse.data.length > 0) {
      return usersResponse.data[0].id;
    }

    throw new Error('User created but ID not found');
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists, get the existing user ID
      const usersResponse = await axiosInstance.get(
        `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${encodeURIComponent(userData.email)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (usersResponse.data && usersResponse.data.length > 0) {
        return usersResponse.data[0].id;
      }
    }
    
    console.error(`❌ Failed to create user ${userData.email} in Keycloak:`, error.response?.data || error.message);
    throw error;
  }
}

// Function to update user password in Keycloak
async function setKeycloakUserPassword(token, userId, password) {
  try {
    await axiosInstance.put(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/reset-password`,
      {
        type: 'password',
        value: password,
        temporary: false
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error(`❌ Failed to set password for user ${userId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Main sync function
async function syncUsersToKeycloak() {
  console.log('🔄 Starting user sync to Keycloak...');
  
  try {
    // Get Keycloak admin token
    console.log('🔑 Getting Keycloak admin token...');
    const token = await getKeycloakToken();
    console.log('✅ Keycloak token obtained');

    // Get all users from database that don't have iamUserId
    console.log('📊 Fetching users from database...');
    const users = await User.findAll({
      where: {
        iamUserId: null
      }
    });

    console.log(`📋 Found ${users.length} users to sync`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`🔄 Syncing user: ${user.name} (${user.email})`);
        
        // Create user in Keycloak
        const ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId = await createKeycloakUser(token, user);
        console.log(`✅ Created in Keycloak with ID: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);

        // Set password (using email as password for simplicity)
        await setKeycloakUserPassword(token, ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId, user.email);
        console.log(`✅ Password set for user`);

        // Update database with Keycloak user ID
        await user.update({
          iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId,
          iamUsername: user.email
        });
        console.log(`✅ Updated database with Keycloak ID`);

        successCount++;
        console.log(`✅ Successfully synced: ${user.name}`);
        
        // Small delay to avoid overwhelming Keycloak
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to sync user ${user.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${successCount} users`);
    console.log(`❌ Failed to sync: ${errorCount} users`);
    console.log(`📋 Total processed: ${users.length} users`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  }
}

// Run the sync
if (require.main === module) {
  syncUsersToKeycloak()
    .then(() => {
      console.log('🎉 User sync completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncUsersToKeycloak }; 