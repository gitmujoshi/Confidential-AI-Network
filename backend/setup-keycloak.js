/**
 * Keycloak Setup Script
 * 
 * This script sets up the Keycloak realm and client configuration
 * for the Contract Management System.
 */

const axios = require('axios');

class KeycloakSetup {
  constructor() {
    this.baseURL = 'http://localhost:8080';
    this.adminToken = null;
  }

  async getAdminToken() {
    try {
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: 'admin',
          password: 'admin123',
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

  async createRealm() {
    try {
      const realmData = {
        realm: 'contract-management',
        enabled: true,
        displayName: 'Contract Management System',
        displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>',
        attributes: {
          frontendUrl: 'http://localhost:3000',
          backendUrl: 'http://localhost:5001'
        }
      };

      await axios.post(`${this.baseURL}/admin/realms`, realmData, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Realm created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Realm already exists');
      } else {
        console.error('❌ Failed to create realm:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  async createClient(clientId, clientData) {
    try {
      await axios.post(`${this.baseURL}/admin/realms/contract-management/clients`, {
        clientId,
        enabled: true,
        ...clientData
      }, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Client ${clientId} created successfully`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Client ${clientId} already exists`);
      } else {
        console.error(`❌ Failed to create client ${clientId}:`, error.response?.data || error.message);
        throw error;
      }
    }
  }

  async createRole(roleName, description) {
    try {
      await axios.post(`${this.baseURL}/admin/realms/contract-management/roles`, {
        name: roleName,
        description: description,
        composite: false,
        clientRole: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Role ${roleName} created successfully`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Role ${roleName} already exists`);
      } else {
        console.error(`❌ Failed to create role ${roleName}:`, error.response?.data || error.message);
        throw error;
      }
    }
  }

  async setup() {
    try {
      console.log('🚀 Setting up Keycloak for Contract Management System...\n');

      // Step 1: Get admin token
      console.log('1️⃣ Getting admin token...');
      await this.getAdminToken();

      // Step 2: Create realm
      console.log('\n2️⃣ Creating realm...');
      await this.createRealm();

      // Step 3: Create roles
      console.log('\n3️⃣ Creating roles...');
      await this.createRole('TDP', 'Training Data Provider - Can create and manage datasets');
      await this.createRole('TDC', 'Training Data Consumer - Can create contracts');
      await this.createRole('CCRP', 'Confidential Clean Room Provider - Can review and sign contracts');
      await this.createRole('ADMIN', 'System Administrator - Full access to all features');

      // Step 4: Create frontend client
      console.log('\n4️⃣ Creating frontend client...');
      await this.createClient('contract-management-frontend', {
        publicClient: true,
        standardFlowEnabled: true,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: false,
        serviceAccountsEnabled: false,
        redirectUris: [
          'http://localhost:3000/*',
          'http://localhost:3000',
          'http://localhost:3000/callback'
        ],
        webOrigins: [
          'http://localhost:3000'
        ]
      });

      // Step 5: Create backend client
      console.log('\n5️⃣ Creating backend client...');
      await this.createClient('contract-management-backend', {
        publicClient: false,
        standardFlowEnabled: false,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: false,
        serviceAccountsEnabled: true,
        redirectUris: [],
        webOrigins: []
      });

      console.log('\n🎉 Keycloak setup completed successfully!');
      console.log('\n📋 Configuration Summary:');
      console.log('   Realm: contract-management');
      console.log('   Frontend Client: contract-management-frontend');
      console.log('   Backend Client: contract-management-backend');
      console.log('   Roles: TDP, TDC, CCRP, ADMIN');
      console.log('\n🔗 Access URLs:');
      console.log('   Keycloak Admin: http://localhost:8080/admin/');
      console.log('   Login: http://localhost:8080/realms/contract-management/protocol/openid-connect/auth');

    } catch (error) {
      console.error('\n💥 Setup failed:', error.message);
      throw error;
    }
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const setup = new KeycloakSetup();
  setup.setup()
    .then(() => {
      console.log('\n✅ Keycloak setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Keycloak setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = KeycloakSetup; 