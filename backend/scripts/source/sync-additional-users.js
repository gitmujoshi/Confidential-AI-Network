#!/usr/bin/env node

/**
 * Sync Additional Users Script
 * 
 * This script syncs the additional users that are not yet synced with Keycloak.
 */

const axios = require('axios');
const { User } = require('../../models');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[SYNC]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function getKeycloakAdminToken() {
  try {
    const response = await axios.post('http://localhost:8080/realms/master/protocol/openid-connect/token', 
      'grant_type=password&client_id=admin-cli&username=admin&password=admin123',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to get Keycloak admin token: ${error.message}`);
  }
}

async function createUserInKeycloak(userData, adminToken) {
  try {
    const response = await axios.post(
      `http://localhost:8080/admin/realms/contract-management/users`,
      {
        username: userData.email,
        email: userData.email,
        firstName: userData.name.split(' ')[0] || 'User',
        lastName: userData.name.split(' ').slice(1).join(' ') || 'Test',
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: 'password123',
          temporary: false
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      // User already exists
      return null;
    }
    throw error;
  }
}

async function assignRoleToUser(userId, roleName, adminToken) {
  try {
    // Get role ID
    const rolesResponse = await axios.get(
      `http://localhost:8080/admin/realms/contract-management/roles`,
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    
    const role = rolesResponse.data.find(r => r.name === roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }
    
    // Assign role to user
    await axios.post(
      `http://localhost:8080/admin/realms/contract-management/users/${userId}/role-mappings/realm`,
      [role],
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    
    return true;
  } catch (error) {
    throw new Error(`Failed to assign role ${roleName}: ${error.message}`);
  }
}

async function getUserFromKeycloak(email, adminToken) {
  try {
    const response = await axios.get(
      `http://localhost:8080/admin/realms/contract-management/users?username=${email}`,
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    
    return response.data[0] || null;
  } catch (error) {
    throw new Error(`Failed to get user from Keycloak: ${error.message}`);
  }
}

async function syncAdditionalUsers() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}👥 SYNCING ADDITIONAL USERS${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    // Get admin token
    log('Getting Keycloak admin token...');
    const adminToken = await getKeycloakAdminToken();
    logSuccess('Keycloak token obtained');
    
    // Get unsynced users from database
    const unsyncedUsers = await User.findAll({
      where: { 
        isActive: true,
        iamUserId: null 
      },
      attributes: ['id', 'email', 'name', 'partyType']
    });
    
    log(`Found ${unsyncedUsers.length} users to sync`);
    
    for (const user of unsyncedUsers) {
      log(`👤 Syncing user: ${user.email} (${user.partyType})`);
      
      try {
        // Create user in Keycloak
        const keycloakUser = await createUserInKeycloak(user, adminToken);
        
        if (keycloakUser) {
          logSuccess(`Created user ${user.email} in Keycloak`);
        } else {
          logWarning(`User ${user.email} already exists in Keycloak`);
        }
        
        // Get user from Keycloak to get the ID
        const keycloakUserData = await getUserFromKeycloak(user.email, adminToken);
        
        if (keycloakUserData) {
          // Assign role
          await assignRoleToUser(keycloakUserData.id, user.partyType, adminToken);
          logSuccess(`Role ${user.partyType} assigned to user`);
          
          // Update database user with Keycloak info
          await user.update({
            iamUserId: keycloakUserData.id,
            iamUsername: user.email
          });
          
          logSuccess(`Updated database user ${user.email} with Keycloak ID: ${keycloakUserData.id}`);
        } else {
          logError(`Failed to get user ${user.email} from Keycloak`);
        }
        
      } catch (error) {
        logError(`Failed to sync user ${user.email}: ${error.message}`);
      }
    }
    
    // Final check
    const remainingUnsynced = await User.count({
      where: { 
        isActive: true,
        iamUserId: null 
      }
    });
    
    console.log('\n' + '='.repeat(60));
    if (remainingUnsynced === 0) {
      console.log(`${colors.green}${colors.bold}🎉 ALL USERS SYNCED!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${colors.bold}⚠️  ${remainingUnsynced} USERS STILL UNSYNCED${colors.reset}`);
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Sync failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  syncAdditionalUsers();
}

module.exports = { syncAdditionalUsers }; 