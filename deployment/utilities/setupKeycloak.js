/**
 * Keycloak Setup Script
 * 
 * This script automates the setup of Keycloak for the Contract Management System.
 * It configures the realm, clients, roles, and initial admin user.
 * 
 * Prerequisites:
 * - Keycloak running on http://localhost:8080
 * - Admin credentials: admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
 * 
 * Usage:
 * node scripts/setupKeycloak.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
const REALM_NAME = 'contract-management';

// Client configurations
const FRONTEND_CLIENT = {
  clientId: 'contract-management-frontend',
  publicClient: true,
  standardFlowEnabled: true,
  redirectUris: ['http://localhost:3000/*', 'http://localhost:3000', 'http://localhost:3000/callback'],
  webOrigins: ['http://localhost:3000']
};

const BACKEND_CLIENT = {
  clientId: 'contract-management-backend',
  publicClient: false,
  serviceAccountsEnabled: true
};

class KeycloakSetup {
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
   * Create realm
   */
  async createRealm() {
    try {
      console.log('🏗️ Creating realm...');
      
      const realmData = {
        realm: REALM_NAME,
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
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Realm created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Realm already exists, skipping creation');
      } else {
        console.error('❌ Failed to create realm:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Create roles
   */
  async createRoles() {
    try {
      console.log('👥 Creating roles...');
      
      const roles = [
        {
          name: 'TDP',
          description: 'Training Data Provider - Can create and manage datasets'
        },
        {
          name: 'TDC',
          description: 'Training Data Consumer - Can create contracts'
        },
        {
          name: 'CCRP',
          description: 'Confidential Clean Room Provider - Can review and sign contracts'
        },
        {
          name: 'ADMIN',
          description: 'System Administrator - Full access to all features'
        }
      ];

      for (const role of roles) {
        try {
          await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/roles`, role, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Role '${role.name}' created`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ Role '${role.name}' already exists`);
          } else {
            console.error(`❌ Failed to create role '${role.name}':`, error.response?.data || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to create roles:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create groups
   */
  async createGroups() {
    try {
      console.log('👥 Creating groups...');
      
      const groups = [
        {
          name: 'Data Providers',
          attributes: {
            description: ['Training Data Providers Group']
          }
        },
        {
          name: 'Data Consumers',
          attributes: {
            description: ['Training Data Consumers Group']
          }
        },
        {
          name: 'Compliance Reviewers',
          attributes: {
            description: ['Confidential Clean Room Providers Group']
          }
        }
      ];

      for (const group of groups) {
        try {
          await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/groups`, group, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Group '${group.name}' created`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ Group '${group.name}' already exists`);
          } else {
            console.error(`❌ Failed to create group '${group.name}':`, error.response?.data || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to create groups:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create client
   */
  async createClient(clientConfig) {
    try {
      console.log(`🔧 Creating client '${clientConfig.clientId}'...`);
      
      await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/clients`, clientConfig, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Client '${clientConfig.clientId}' created successfully`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ Client '${clientConfig.clientId}' already exists`);
      } else {
        console.error(`❌ Failed to create client '${clientConfig.clientId}':`, error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Add protocol mappers to frontend client
   */
  async addProtocolMappers() {
    try {
      console.log('🔧 Adding protocol mappers to frontend client...');
      
      // Get the client ID
      const clientResponse = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/clients?clientId=${FRONTEND_CLIENT.clientId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (clientResponse.data.length === 0) {
        throw new Error('Frontend client not found');
      }

      const clientId = clientResponse.data[0].id;
      
      const mappers = [
        {
          name: 'walletAddress',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          config: {
            'userinfo.token.claim': 'true',
            'user.attribute': 'walletAddress',
            'id.token.claim': 'true',
            'access.token.claim': 'true',
            'claim.name': 'walletAddress',
            'jsonType.label': 'String'
          }
        },
        {
          name: 'partyType',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          config: {
            'userinfo.token.claim': 'true',
            'user.attribute': 'partyType',
            'id.token.claim': 'true',
            'access.token.claim': 'true',
            'claim.name': 'partyType',
            'jsonType.label': 'String'
          }
        },
        {
          name: 'publicKey',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          config: {
            'userinfo.token.claim': 'true',
            'user.attribute': 'publicKey',
            'id.token.claim': 'true',
            'access.token.claim': 'true',
            'claim.name': 'publicKey',
            'jsonType.label': 'String'
          }
        }
      ];

      for (const mapper of mappers) {
        try {
          await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/clients/${clientId}/protocol-mappers/models`, mapper, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Protocol mapper '${mapper.name}' added`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ Protocol mapper '${mapper.name}' already exists`);
          } else {
            console.error(`❌ Failed to add protocol mapper '${mapper.name}':`, error.response?.data || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to add protocol mappers:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create admin user
   */
  async createAdminUser() {
    try {
      console.log('👤 Creating admin user...');
      
      const adminUser = {
        username: 'admin',
        enabled: true,
        emailVerified: true,
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@contractmanagement.com',
        attributes: {
          walletAddress: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
          partyType: ['ADMIN'],
          publicKey: ['0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
          organization: ['Contract Management System'],
          phoneNumber: ['+1-555-0000']
        },
        credentials: [
          {
            type: 'password',
            value: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
            temporary: false
          }
        ],
        realmRoles: ['ADMIN']
      };

      await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/users`, adminUser, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Admin user created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Admin user already exists');
      } else {
        console.error('❌ Failed to create admin user:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Get client secret for backend client
   */
  async getClientSecret() {
    try {
      console.log('🔑 Getting backend client secret...');
      
      const clientResponse = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/clients?clientId=${BACKEND_CLIENT.clientId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (clientResponse.data.length === 0) {
        throw new Error('Backend client not found');
      }

      const clientId = clientResponse.data[0].id;
      
      const secretResponse = await axios.get(`${this.baseURL}/admin/realms/${REALM_NAME}/clients/${clientId}/client-secret`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      console.log('✅ Backend client secret obtained');
      return secretResponse.data.value;
    } catch (error) {
      console.error('❌ Failed to get client secret:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Run complete setup
   */
  async setup() {
    try {
      console.log('🚀 Starting Keycloak setup...');
      console.log('📋 Configuration:');
      console.log(`   Keycloak URL: ${this.baseURL}`);
      console.log(`   Realm: ${REALM_NAME}`);
      console.log(`   Admin: ${ADMIN_USERNAME}/${ADMIN_PASSWORD}`);
      console.log('');

      // Step 1: Get admin token
      await this.getAdminToken();

      // Step 2: Create realm
      await this.createRealm();

      // Step 3: Create roles
      await this.createRoles();

      // Step 4: Create groups
      await this.createGroups();

      // Step 5: Create clients
      await this.createClient(FRONTEND_CLIENT);
      await this.createClient(BACKEND_CLIENT);

      // Step 6: Add protocol mappers
      await this.addProtocolMappers();

      // Step 7: Create admin user
      await this.createAdminUser();

      // Step 8: Get client secret
      const clientSecret = await this.getClientSecret();

      console.log('');
      console.log('🎉 Keycloak setup completed successfully!');
      console.log('');
      console.log('📋 Access Information:');
      console.log(`   Admin Console: ${this.baseURL}/admin`);
      console.log(`   Realm: ${REALM_NAME}`);
      console.log(`   Admin User: admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***`);
      console.log(`   Backend Client Secret: ${clientSecret}`);
      console.log('');
      console.log('🔗 Frontend Configuration:');
      console.log(`   Client ID: ${FRONTEND_CLIENT.clientId}`);
      console.log(`   Redirect URIs: ${FRONTEND_CLIENT.redirectUris.join(', ')}`);
      console.log('');
      console.log('🔗 Backend Configuration:');
      console.log(`   Client ID: ${BACKEND_CLIENT.clientId}`);
      console.log(`   Client Secret: ${clientSecret}`);

      // Save configuration to file
      const config = {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***Url: this.baseURL,
        realm: REALM_NAME,
        frontendClient: FRONTEND_CLIENT.clientId,
        backendClient: BACKEND_CLIENT.clientId,
        backendClientSecret: clientSecret,
        adminUser: {
          username: 'admin',
          password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***'
        }
      };

      fs.writeFileSync(
        path.join(__dirname, '../***REMOVED-KEYCLOAK_DB_PASSWORD***-config/***REMOVED-KEYCLOAK_DB_PASSWORD***-config.json'),
        JSON.stringify(config, null, 2)
      );

      console.log('');
      console.log('💾 Configuration saved to: ***REMOVED-KEYCLOAK_DB_PASSWORD***-config/***REMOVED-KEYCLOAK_DB_PASSWORD***-config.json');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new KeycloakSetup();
  setup.setup();
}

module.exports = KeycloakSetup; 