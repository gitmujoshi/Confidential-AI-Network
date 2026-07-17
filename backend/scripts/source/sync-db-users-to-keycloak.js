/**
 * Sync Database Users to Keycloak
 * 
 * This script ensures all active users from the database are present in Keycloak
 * with the correct roles and attributes. It only adds/updates users, no removals.
 * 
 * Usage:
 * node scripts/sync-db-users-to-keycloak.js
 */

const { Sequelize } = require('sequelize');
const axios = require('axios');
require('dotenv').config({ path: './config.env' });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const REALM_NAME = 'contract-management';

class DatabaseToKeycloakSync {
  constructor() {
    this.accessToken = null;
    this.baseURL = KEYCLOAK_BASE_URL;
  }

  /**
   * Get admin access token
   */
  async getAdminToken() {
    try {
      console.log('🔐 Getting admin access token...');
      
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
          grant_type: 'password',
          client_id: 'admin-cli'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      console.log('✅ Admin token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get admin token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all active users from database
   */
  async getDatabaseUsers() {
    try {
      console.log('📊 Fetching active users from database...');
      
      const [users] = await sequelize.query(
        `SELECT id, name, email, "partyType", "walletAddress", "publicKey", 
                description, "isRegistered", "registrationDate", "isActive", 
                "createdAt", "updatedAt"
         FROM users 
         WHERE "isActive" = true 
         ORDER BY email`
      );

      console.log(`✅ Found ${users.length} active users in database`);
      return users;
    } catch (error) {
      console.error('❌ Failed to fetch database users:', error.message);
      throw error;
    }
  }

  /**
   * Get all users from Keycloak
   */
  async getKeycloakUsers() {
    try {
      console.log('🔍 Fetching users from Keycloak...');
      
      const response = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/users`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Found ${response.data.length} users in Keycloak`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch Keycloak users:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check if user exists in Keycloak
   */
  findKeycloakUser(keycloakUsers, email) {
    return keycloakUsers.find(user => user.email === email);
  }

  /**
   * Create user in Keycloak
   */
  async createKeycloakUser(dbUser) {
    try {
      console.log(`👤 Creating user in Keycloak: ${dbUser.email}`);
      
      const firstName = dbUser.name.split(' ')[0] || dbUser.name;
      const lastName = dbUser.name.split(' ').slice(1).join(' ') || '';
      
      const keycloakUser = {
        username: dbUser.email,
        email: dbUser.email,
        firstName: firstName,
        lastName: lastName,
        enabled: dbUser.isActive,
        emailVerified: true,
        requiredActions: [], // No required actions
        attributes: {
          walletAddress: [dbUser.walletAddress || ''],
          partyType: [dbUser.partyType || 'TDC'],
          publicKey: [dbUser.publicKey || ''],
          organization: [dbUser.description || 'Contract Management System'],
          dbUserId: [dbUser.id.toString()],
          registrationDate: [dbUser.registrationDate ? new Date(dbUser.registrationDate).toISOString() : '']
        },
        credentials: [{
          type: 'password',
          value: 'password123', // Default password
          temporary: false
        }],
        realmRoles: [dbUser.partyType] // Assign role based on partyType
      };

      await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/users`, keycloakUser, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Created user in Keycloak: ${dbUser.email} (${dbUser.partyType})`);
      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ User already exists in Keycloak: ${dbUser.email}`);
        return false;
      } else {
        console.error(`❌ Failed to create user ${dbUser.email}:`, error.response?.data || error.message);
        return false;
      }
    }
  }

  /**
   * Update existing user in Keycloak
   */
  async updateKeycloakUser(keycloakUser, dbUser) {
    try {
      console.log(`🔄 Updating user in Keycloak: ${dbUser.email}`);
      
      const firstName = dbUser.name.split(' ')[0] || dbUser.name;
      const lastName = dbUser.name.split(' ').slice(1).join(' ') || '';
      
      const updatedUser = {
        ...keycloakUser,
        firstName: firstName,
        lastName: lastName,
        enabled: dbUser.isActive,
        emailVerified: true,
        requiredActions: [], // Remove any required actions
        attributes: {
          ...keycloakUser.attributes,
          walletAddress: [dbUser.walletAddress || ''],
          partyType: [dbUser.partyType || 'TDC'],
          publicKey: [dbUser.publicKey || ''],
          organization: [dbUser.description || 'Contract Management System'],
          dbUserId: [dbUser.id.toString()],
          registrationDate: [dbUser.registrationDate ? new Date(dbUser.registrationDate).toISOString() : '']
        }
      };

      await axios.put(`${this.baseURL}/admin/realms/${REALM_NAME}/users/${keycloakUser.id}`, updatedUser, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Updated user in Keycloak: ${dbUser.email} (${dbUser.partyType})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update user ${dbUser.email}:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Update user roles in Keycloak
   */
  async updateUserRoles(keycloakUser, dbUser) {
    try {
      console.log(`🎭 Updating roles for user: ${dbUser.email}`);
      
      // Get current roles
      const rolesResponse = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/users/${keycloakUser.id}/role-mappings/realm`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const currentRoles = rolesResponse.data;
      const targetRole = dbUser.partyType;
      
      // Check if user already has the correct role
      const hasCorrectRole = currentRoles.some(role => role.name === targetRole);
      
      if (!hasCorrectRole) {
        // Get the role to assign
        const roleResponse = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/roles/${targetRole}`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        // Assign the role
        await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/users/${keycloakUser.id}/role-mappings/realm`, [roleResponse.data], {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`✅ Assigned role '${targetRole}' to user: ${dbUser.email}`);
      } else {
        console.log(`ℹ️ User already has correct role '${targetRole}': ${dbUser.email}`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to update roles for user ${dbUser.email}:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Main sync function
   */
  async syncUsers() {
    try {
      console.log('🔄 Starting database to Keycloak user sync...');
      
      // Get admin token
      await this.getAdminToken();
      
      // Get users from both sources
      const dbUsers = await this.getDatabaseUsers();
      const keycloakUsers = await this.getKeycloakUsers();
      
      let created = 0;
      let updated = 0;
      let roleUpdated = 0;
      let errors = 0;
      
      console.log('\n📋 Processing users...');
      
      for (const dbUser of dbUsers) {
        try {
          const keycloakUser = this.findKeycloakUser(keycloakUsers, dbUser.email);
          
          if (!keycloakUser) {
            // User doesn't exist in Keycloak, create them
            const success = await this.createKeycloakUser(dbUser);
            if (success) {
              created++;
            } else {
              errors++;
            }
          } else {
            // User exists, update them
            const success = await this.updateKeycloakUser(keycloakUser, dbUser);
            if (success) {
              updated++;
            } else {
              errors++;
            }
            
            // Update roles
            const roleSuccess = await this.updateUserRoles(keycloakUser, dbUser);
            if (roleSuccess) {
              roleUpdated++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing user ${dbUser.email}:`, error.message);
          errors++;
        }
      }
      
      console.log('\n🎉 Sync completed!');
      console.log(`📊 Summary:`);
      console.log(`   - Database users processed: ${dbUsers.length}`);
      console.log(`   - Users created in Keycloak: ${created}`);
      console.log(`   - Users updated in Keycloak: ${updated}`);
      console.log(`   - Roles updated: ${roleUpdated}`);
      console.log(`   - Errors: ${errors}`);
      console.log('');
      console.log('📝 Note: All users have default password: password123');
      console.log('🔗 Access Keycloak admin console: http://localhost:8080/admin/');
      
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      throw error;
    } finally {
      await sequelize.close();
    }
  }
}

// Run the sync
const sync = new DatabaseToKeycloakSync();
sync.syncUsers()
  .then(() => {
    console.log('✅ Sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  }); 