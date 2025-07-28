const axios = require('axios');
const { User } = require('../../models');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'contract-management';
const KEYCLOAK_ADMIN_USERNAME = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';

// Function to get Keycloak admin token
async function getKeycloakToken() {
  try {
    const response = await axios.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
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

// Function to get users from Keycloak
async function getKeycloakUsers(token) {
  try {
    const response = await axios.get(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get Keycloak users:', error.response?.data || error.message);
    throw error;
  }
}

// Function to update database users with Keycloak IDs
async function updateDatabaseUsers(***REMOVED-KEYCLOAK_DB_PASSWORD***Users) {
  console.log('🔄 Updating database users with Keycloak IDs...');
  
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const ***REMOVED-KEYCLOAK_DB_PASSWORD***User of ***REMOVED-KEYCLOAK_DB_PASSWORD***Users) {
    try {
      // Find the database user by email (username in Keycloak)
      const dbUser = await User.findOne({
        where: { email: ***REMOVED-KEYCLOAK_DB_PASSWORD***User.username }
      });
      
      if (dbUser) {
        // Update the user with Keycloak ID
        await dbUser.update({
          iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***User.id,
          iamUsername: ***REMOVED-KEYCLOAK_DB_PASSWORD***User.username
        });
        
        console.log(`✅ Updated: ${dbUser.name} (${dbUser.email}) with Keycloak ID: ${***REMOVED-KEYCLOAK_DB_PASSWORD***User.id}`);
        updatedCount++;
      } else {
        console.log(`⚠️ No database user found for Keycloak user: ${***REMOVED-KEYCLOAK_DB_PASSWORD***User.username}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update user ${***REMOVED-KEYCLOAK_DB_PASSWORD***User.username}:`, error.message);
      errorCount++;
    }
  }
  
  return { updatedCount, errorCount };
}

// Main function
async function updateIAMUserIDs() {
  console.log('🔧 Updating IAM User IDs in database...');
  
  try {
    // Get Keycloak admin token
    console.log('🔑 Getting Keycloak admin token...');
    const token = await getKeycloakToken();
    console.log('✅ Keycloak token obtained');

    // Get users from Keycloak
    console.log('📊 Fetching users from Keycloak...');
    const ***REMOVED-KEYCLOAK_DB_PASSWORD***Users = await getKeycloakUsers(token);
    console.log(`📋 Found ${***REMOVED-KEYCLOAK_DB_PASSWORD***Users.length} users in Keycloak`);

    // Update database users
    const { updatedCount, errorCount } = await updateDatabaseUsers(***REMOVED-KEYCLOAK_DB_PASSWORD***Users);

    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`❌ Failed to update: ${errorCount} users`);
    console.log(`📋 Total Keycloak users: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Users.length}`);

    if (errorCount === 0) {
      console.log('🎉 All users updated successfully!');
    } else {
      console.log('⚠️ Some users failed to update. Check the errors above.');
    }

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  updateIAMUserIDs()
    .then(() => {
      console.log('🎉 IAM User ID update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateIAMUserIDs }; 