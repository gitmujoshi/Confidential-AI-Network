/**
 * Keycloak Admin Password Reset Script
 * 
 * This script helps reset the Keycloak admin password and ensure proper admin access.
 * 
 * Usage:
 * node scripts/reset-keycloak-admin.js
 */

const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const NEW_ADMIN_PASSWORD = 'admin123';

class KeycloakAdminReset {
  constructor() {
    this.baseURL = KEYCLOAK_BASE_URL;
  }

  /**
   * Test current admin credentials
   */
  async testAdminCredentials(username, password) {
    try {
      console.log(`🔐 Testing admin credentials: ${username}`);
      
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: username,
          password: password,
          grant_type: 'password',
          client_id: 'admin-cli'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('✅ Admin credentials are valid');
      return response.data.access_token;
    } catch (error) {
      console.log('❌ Admin credentials are invalid');
      return null;
    }
  }

  /**
   * Get admin token with current credentials
   */
  async getAdminToken() {
    // Try common admin passwords
    const commonPasswords = [
      'admin123',
      'admin',
      'password',
      'keycloak',
      'master'
    ];

    for (const password of commonPasswords) {
      const token = await this.testAdminCredentials(ADMIN_USERNAME, password);
      if (token) {
        return token;
      }
    }

    throw new Error('Could not authenticate with any common admin password');
  }

  /**
   * Reset admin password using Keycloak REST API
   */
  async resetAdminPassword(adminToken) {
    try {
      console.log('🔄 Resetting admin password...');
      
      // Get admin user ID
      const usersResponse = await axios.get(`${this.baseURL}/admin/users?username=${ADMIN_USERNAME}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.data.length === 0) {
        throw new Error('Admin user not found');
      }

      const adminUserId = usersResponse.data[0].id;
      console.log(`✅ Found admin user with ID: ${adminUserId}`);

      // Reset password
      await axios.put(`${this.baseURL}/admin/users/${adminUserId}/reset-password`, {
        type: 'password',
        value: NEW_ADMIN_PASSWORD,
        temporary: false
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Admin password reset successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to reset admin password:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Create admin user if it doesn't exist
   */
  async createAdminUser(adminToken) {
    try {
      console.log('👤 Creating admin user...');
      
      const adminUser = {
        username: ADMIN_USERNAME,
        email: 'admin@contract-management.com',
        firstName: 'Admin',
        lastName: 'User',
        enabled: true,
        emailVerified: true,
        credentials: [{
          type: 'password',
          value: NEW_ADMIN_PASSWORD,
          temporary: false
        }],
        realmRoles: ['admin']
      };

      await axios.post(`${this.baseURL}/admin/users`, adminUser, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Admin user created successfully');
      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Admin user already exists');
        return true;
      } else {
        console.error('❌ Failed to create admin user:', error.response?.data || error.message);
        return false;
      }
    }
  }

  /**
   * Main function to reset admin access
   */
  async resetAdminAccess() {
    try {
      console.log('🔧 Starting Keycloak admin password reset...');
      
      // Try to get admin token with current credentials
      let adminToken;
      try {
        adminToken = await this.getAdminToken();
      } catch (error) {
        console.log('❌ Could not authenticate with current admin credentials');
        console.log('💡 You may need to:');
        console.log('   1. Access Keycloak admin console at http://localhost:8080/admin/');
        console.log('   2. Reset the admin password manually');
        console.log('   3. Or restart Keycloak with environment variables:');
        console.log('      KEYCLOAK_ADMIN=admin');
        console.log('      KEYCLOAK_ADMIN_PASSWORD=admin123');
        return;
      }

      // Try to reset password
      const passwordReset = await this.resetAdminPassword(adminToken);
      
      if (passwordReset) {
        console.log('✅ Admin password reset completed');
        console.log(`📝 New admin credentials:`);
        console.log(`   Username: ${ADMIN_USERNAME}`);
        console.log(`   Password: ${NEW_ADMIN_PASSWORD}`);
        console.log('');
        console.log('🔗 Access Keycloak admin console at: http://localhost:8080/admin/');
      } else {
        console.log('❌ Failed to reset admin password');
        console.log('💡 You may need to reset the password manually through the admin console');
      }

    } catch (error) {
      console.error('❌ Error during admin reset:', error.message);
    }
  }
}

// Run the script
const resetter = new KeycloakAdminReset();
resetter.resetAdminAccess()
  .then(() => {
    console.log('🎉 Admin reset process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Admin reset failed:', error);
    process.exit(1);
  }); 