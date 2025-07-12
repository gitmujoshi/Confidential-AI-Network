/**
 * Fix Keycloak Client Configuration
 * 
 * This script fixes the Keycloak client configuration to enable direct access grants.
 * 
 * Usage:
 * node scripts/fix-***REMOVED-KEYCLOAK_DB_PASSWORD***-client.js
 */

const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
const REALM_NAME = 'contract-management';
const CLIENT_ID = 'contract-management-backend';

class KeycloakClientFix {
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
   * Get client ID from client name
   */
  async getClientId() {
    try {
      console.log(`🔍 Finding client: ${CLIENT_ID}`);
      
      const response = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.length === 0) {
        throw new Error(`Client ${CLIENT_ID} not found`);
      }

      const clientId = response.data[0].id;
      console.log(`✅ Found client with ID: ${clientId}`);
      return clientId;
    } catch (error) {
      console.error('❌ Failed to get client ID:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update client configuration
   */
  async updateClient(clientId) {
    try {
      console.log('🔧 Updating client configuration...');
      
      // Get current client configuration
      const clientResponse = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const client = clientResponse.data;
      
      // Update only the essential fields
      const updatedClient = {
        ...client,
        directAccessGrantsEnabled: true,
        serviceAccountsEnabled: true,
        standardFlowEnabled: true,
        implicitFlowEnabled: false,
        publicClient: false,
        webOrigins: ['http://localhost:3000'],
        redirectUris: ['http://localhost:3000/*', 'http://localhost:3000', 'http://localhost:3000/callback']
      };

      // Remove any fields that might cause issues
      delete updatedClient.oidcCibaGrantEnabled;
      delete updatedClient.oauth2DeviceAuthorizationGrantEnabled;
      delete updatedClient.oauth2DeviceCodeLifespan;
      delete updatedClient.oauth2DevicePollingInterval;

      // Update the client
      await axios.put(`${this.baseURL}/admin/realms/${REALM_NAME}/clients/${clientId}`, updatedClient, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Client configuration updated successfully');
    } catch (error) {
      console.error('❌ Failed to update client:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Main fix function
   */
  async fix() {
    try {
      console.log('🔧 Starting Keycloak client configuration fix...');
      
      // Get admin token
      await this.getAdminToken();
      
      // Get client ID
      const clientId = await this.getClientId();
      
      // Update client configuration
      await this.updateClient(clientId);
      
      console.log('🎉 Keycloak client configuration fixed successfully!');
      console.log('');
      console.log('📝 Client configuration updated:');
      console.log('   - Direct access grants enabled');
      console.log('   - Service accounts enabled');
      console.log('   - Standard flow enabled');
      console.log('   - Redirect URIs configured');
      console.log('   - Web origins configured');
      
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      throw error;
    }
  }
}

// Run the fix
const fix = new KeycloakClientFix();
fix.fix()
  .then(() => {
    console.log('✅ Client fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Client fix failed:', error);
    process.exit(1);
  }); 