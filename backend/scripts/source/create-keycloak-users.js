/**
 * Create Keycloak Users Script
 * 
 * This script creates the test users in Keycloak with the correct passwords.
 * 
 * Usage:
 * node scripts/source/create-keycloak-users.js
 */

const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'contract-management';
const KEYCLOAK_ADMIN_USERNAME = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = 'admin123';

// Test users to create
const testUsers = [
  {
    name: 'MedData Solutions Inc.',
    email: 'tdp.medical@example.com',
    partyType: 'TDP',
    password: 'password123'
  },
  {
    name: 'NLP Research Foundation',
    email: 'tdp.nlp@example.com',
    partyType: 'TDP',
    password: 'password123'
  },
  {
    name: 'AutoDrive Technologies',
    email: 'tdp.autodrive@example.com',
    partyType: 'TDP',
    password: 'password123'
  },
  {
    name: 'AI Healthcare Innovations',
    email: 'tdc.healthcare@example.com',
    partyType: 'TDC',
    password: 'password123'
  },
  {
    name: 'FinTech Analytics Corp',
    email: 'tdc.fintech@example.com',
    partyType: 'TDC',
    password: 'password123'
  },
  {
    name: 'Language AI Labs',
    email: 'tdc.language@example.com',
    partyType: 'TDC',
    password: 'password123'
  },
  {
    name: 'SecureCloud Confidential Computing',
    email: 'ccrp.securecloud@example.com',
    partyType: 'CCRP',
    password: 'password123'
  },
  {
    name: 'TrustedAI Environment Provider',
    email: 'ccrp.trustedai@example.com',
    partyType: 'CCRP',
    password: 'password123'
  },
  {
    name: 'PrivacyFirst Computing Solutions',
    email: 'ccrp.privacyfirst@example.com',
    partyType: 'CCRP',
    password: 'password123'
  }
];

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

// Function to create user in Keycloak
async function createKeycloakUser(token, userData) {
  try {
    const userConfig = {
      username: userData.email,
      email: userData.email,
      firstName: userData.name.split(' ')[0],
      lastName: userData.name.split(' ').slice(1).join(' ') || '',
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: userData.password,
          temporary: false
        }
      ],
      attributes: {
        partyType: [userData.partyType]
      }
    };

    const response = await axios.post(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
      userConfig,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.headers.location.split('/').pop(); // Extract user ID from Location header
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`ℹ️ User ${userData.email} already exists`);
      return null;
    } else {
      console.error(`❌ Failed to create user ${userData.email}:`, error.response?.data || error.message);
      throw error;
    }
  }
}

// Function to assign role to user
async function assignRoleToUser(token, userId, roleName) {
  try {
    // First, get the role
    const roleResponse = await axios.get(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${roleName}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Then assign the role to the user
    await axios.post(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
      [roleResponse.data],
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Role ${roleName} assigned to user`);
  } catch (error) {
    console.error(`❌ Failed to assign role ${roleName}:`, error.response?.data || error.message);
    throw error;
  }
}

// Function to update database with Keycloak user ID
async function updateDatabaseUser(email, keycloakUserId) {
  try {
    const { User } = require('../../models');
    
    const user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({
        iamUserId: keycloakUserId,
        iamUsername: email
      });
      console.log(`✅ Updated database user ${email} with Keycloak ID: ${keycloakUserId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to update database user ${email}:`, error.message);
  }
}

// Main function
async function createKeycloakUsers() {
  try {
    console.log('🔧 Creating Keycloak users...');
    
    // Get admin token
    console.log('🔑 Getting Keycloak admin token...');
    const token = await getKeycloakToken();
    console.log('✅ Keycloak token obtained');

    let createdCount = 0;
    let errorCount = 0;

    for (const userData of testUsers) {
      try {
        console.log(`👤 Creating user: ${userData.email} (${userData.partyType})`);
        
        // Create user in Keycloak
        const keycloakUserId = await createKeycloakUser(token, userData);
        
        if (keycloakUserId) {
          // Assign role
          await assignRoleToUser(token, keycloakUserId, userData.partyType);
          
          // Update database
          await updateDatabaseUser(userData.email, keycloakUserId);
          
          console.log(`✅ User ${userData.email} created successfully`);
          createdCount++;
        } else {
          console.log(`ℹ️ User ${userData.email} already exists, skipping`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created: ${createdCount} users`);
    console.log(`❌ Failed to create: ${errorCount} users`);
    console.log(`📋 Total processed: ${testUsers.length} users`);

    if (errorCount === 0) {
      console.log('🎉 All users created successfully!');
    } else {
      console.log('⚠️ Some users failed to create');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
if (require.main === module) {
  createKeycloakUsers();
}

module.exports = { createKeycloakUsers }; 