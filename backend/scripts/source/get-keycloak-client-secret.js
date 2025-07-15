/**
 * Get Keycloak Client Secret
 * 
 * This script retrieves the client secret for the backend client from Keycloak.
 * 
 * Usage:
 * node scripts/get-***REMOVED-KEYCLOAK_DB_PASSWORD***-client-secret.js
 */

const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
const REALM_NAME = 'contract-management';
const CLIENT_ID = 'contract-management-backend';

class KeycloakClientSecret {
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
   * Get client secret
   */
  async getClientSecret(clientId) {
    try {
      console.log('🔑 Getting client secret...');
      
      const response = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/clients/${clientId}/client-secret`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const secret = response.data.value;
      console.log('✅ Client secret retrieved successfully');
      return secret;
    } catch (error) {
      console.error('❌ Failed to get client secret:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Main function
   */
  async getSecret() {
    try {
      console.log('🔧 Getting Keycloak client secret...');
      
      // Get admin token
      await this.getAdminToken();
      
      // Get client ID
      const clientId = await this.getClientId();
      
      // Get client secret
      const secret = await this.getClientSecret(clientId);
      
      console.log('\n🎉 Client secret retrieved successfully!');
      console.log(`📝 Client Secret: ${secret}`);
      console.log('');
      console.log('💡 Use this secret in your authentication requests:');
      console.log(`   client_id: ${CLIENT_ID}`);
      console.log(`   client_secret: ${secret}`);
      
      return secret;
    } catch (error) {
      console.error('❌ Failed to get client secret:', error.message);
      throw error;
    }
  }
}

// Run the script
const secretGetter = new KeycloakClientSecret();
secretGetter.getSecret()
  .then((secret) => {
    console.log('✅ Secret retrieval completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Secret retrieval failed:', error);
    process.exit(1);
  }); 