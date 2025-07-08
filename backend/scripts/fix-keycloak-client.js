/**
 * Fix Keycloak Client Configuration
 * 
 * This script updates the Keycloak client configuration to enable:
 * - Direct access grants (Resource Owner Password Credentials)
 * - Proper authentication flows
 */

const axios = require('axios');

class KeycloakClientFix {
  constructor() {
    this.baseURL = 'http://localhost:8080';
    this.realm = 'contract-management';
    this.adminToken = null;
  }

  async getAdminToken() {
    try {
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin123',
          grant_type: 'password',
          client_id: 'admin-cli'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.adminToken = response.data.access_token;
      console.log('✅ Admin token obtained');
      return this.adminToken;
    } catch (error) {
      console.error('❌ Failed to get admin token:', error.response?.data || error.message);
      throw error;
    }
  }

  async getClient(clientId) {
    try {
      const response = await axios.get(`${this.baseURL}/admin/realms/${this.realm}/clients?clientId=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error(`❌ Failed to get client ${clientId}:`, error.response?.data || error.message);
      return null;
    }
  }

  async updateClient(clientId, updates) {
    try {
      // First get the current client
      const client = await this.getClient(clientId);
      if (!client) {
        console.error(`❌ Client ${clientId} not found`);
        return false;
      }

      // Update the client configuration
      const updatedClient = { ...client, ...updates };

      await axios.put(`${this.baseURL}/admin/realms/${this.realm}/clients/${client.id}`, updatedClient, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Client ${clientId} updated successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update client ${clientId}:`, error.response?.data || error.message);
      return false;
    }
  }

  async fixFrontendClient() {
    console.log('🔧 Fixing frontend client configuration...');
    
    const updates = {
      directAccessGrantsEnabled: true,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      serviceAccountsEnabled: false,
      publicClient: true,
      redirectUris: [
        'http://localhost:3000/*',
        'http://localhost:3000',
        'http://localhost:3000/callback'
      ],
      webOrigins: [
        'http://localhost:3000'
      ]
    };

    return await this.updateClient('contract-management-frontend', updates);
  }

  async fixBackendClient() {
    console.log('🔧 Fixing backend client configuration...');
    
    const updates = {
      directAccessGrantsEnabled: false,
      standardFlowEnabled: false,
      implicitFlowEnabled: false,
      serviceAccountsEnabled: true,
      publicClient: false,
      redirectUris: [],
      webOrigins: []
    };

    return await this.updateClient('contract-management-backend', updates);
  }

  async testAuthentication() {
    console.log('🧪 Testing authentication...');
    
    try {
      const response = await axios.post(`${this.baseURL}/realms/${this.realm}/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: 'test@example.com',
          password: 'G54XQTLZ2wcy',
          grant_type: 'password',
          client_id: 'contract-management-frontend'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (response.data.access_token) {
        console.log('✅ Authentication test successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Authentication test failed:', error.response?.data || error.message);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Keycloak client configuration fix...\n');

      // Step 1: Get admin token
      console.log('1️⃣ Getting admin token...');
      await this.getAdminToken();

      // Step 2: Fix frontend client
      console.log('\n2️⃣ Fixing frontend client...');
      await this.fixFrontendClient();

      // Step 3: Fix backend client
      console.log('\n3️⃣ Fixing backend client...');
      await this.fixBackendClient();

      // Step 4: Test authentication
      console.log('\n4️⃣ Testing authentication...');
      const authSuccess = await this.testAuthentication();

      console.log('\n🎉 Client configuration fix completed!');
      
      if (authSuccess) {
        console.log('✅ Authentication is now working correctly');
        console.log('\n📋 Next steps:');
        console.log('1. Test user login at: http://localhost:3000/login');
        console.log('2. Test API login: curl -X POST http://localhost:5001/api/auth/login');
      } else {
        console.log('⚠️ Authentication test failed - check user credentials');
      }

    } catch (error) {
      console.error('\n💥 Fix failed:', error.message);
      throw error;
    }
  }
}

// Run fix if this script is executed directly
if (require.main === module) {
  const fix = new KeycloakClientFix();
  fix.run()
    .then(() => {
      console.log('\n✅ Client configuration fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Client configuration fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = KeycloakClientFix; 