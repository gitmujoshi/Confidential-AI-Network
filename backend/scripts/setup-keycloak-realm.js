/**
 * Keycloak Realm Setup Script
 * 
 * This script sets up the complete Keycloak realm for the Contract Management System.
 * It creates the realm, roles, groups, and initial users.
 * 
 * Usage:
 * node scripts/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-realm.js
 */

const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
const REALM_NAME = 'contract-management';

class KeycloakRealmSetup {
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
        },
        {
          name: 'AppAdmin',
          description: 'Application Administrator - Can manage users and system settings'
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
   * Create clients
   */
  async createClients() {
    try {
      console.log('🔧 Creating clients...');
      
      // Frontend client
      const frontendClient = {
        clientId: 'contract-management-frontend',
        publicClient: true,
        standardFlowEnabled: true,
        redirectUris: ['http://localhost:3000/*', 'http://localhost:3000', 'http://localhost:3000/callback'],
        webOrigins: ['http://localhost:3000'],
        enabled: true
      };

      try {
        await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/clients`, frontendClient, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Frontend client created');
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('ℹ️ Frontend client already exists');
        } else {
          console.error('❌ Failed to create frontend client:', error.response?.data || error.message);
        }
      }

      // Backend client
      const backendClient = {
        clientId: 'contract-management-backend',
        publicClient: false,
        serviceAccountsEnabled: true,
        enabled: true
      };

      try {
        await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/clients`, backendClient, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Backend client created');
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('ℹ️ Backend client already exists');
        } else {
          console.error('❌ Failed to create backend client:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error('❌ Failed to create clients:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create test users
   */
  async createTestUsers() {
    try {
      console.log('👤 Creating test users...');
      
      const testUsers = [
        {
          username: 'tdp.medical@example.com',
          email: 'tdp.medical@example.com',
          firstName: 'MedData',
          lastName: 'Solutions',
          enabled: true,
          emailVerified: true,
          credentials: [{
            type: 'password',
            value: 'password123',
            temporary: false
          }],
          realmRoles: ['TDP']
        },
        {
          username: 'tdc.healthcare@example.com',
          email: 'tdc.healthcare@example.com',
          firstName: 'AI Healthcare',
          lastName: 'Innovations',
          enabled: true,
          emailVerified: true,
          credentials: [{
            type: 'password',
            value: 'password123',
            temporary: false
          }],
          realmRoles: ['TDC']
        },
        {
          username: 'ccrp.securecloud@example.com',
          email: 'ccrp.securecloud@example.com',
          firstName: 'SecureCloud',
          lastName: 'Computing',
          enabled: true,
          emailVerified: true,
          credentials: [{
            type: 'password',
            value: 'password123',
            temporary: false
          }],
          realmRoles: ['CCRP']
        }
      ];

      for (const user of testUsers) {
        try {
          await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/users`, user, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ User '${user.username}' created`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ User '${user.username}' already exists`);
          } else {
            console.error(`❌ Failed to create user '${user.username}':`, error.response?.data || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to create test users:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Main setup function
   */
  async setup() {
    try {
      console.log('🚀 Starting Keycloak realm setup...');
      
      // Get admin token
      await this.getAdminToken();
      
      // Create realm
      await this.createRealm();
      
      // Create roles
      await this.createRoles();
      
      // Create groups
      await this.createGroups();
      
      // Create clients
      await this.createClients();
      
      // Create test users
      await this.createTestUsers();
      
      console.log('🎉 Keycloak realm setup completed successfully!');
      console.log('');
      console.log('📝 Next steps:');
      console.log('   1. Access Keycloak admin console: http://localhost:8080/admin/');
      console.log('   2. Login with admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***');
      console.log('   3. Select the "contract-management" realm');
      console.log('   4. You should now be able to view users, roles, and clients');
      console.log('');
      console.log('🔗 Test users created:');
      console.log('   - tdp.medical@example.com / password123 (TDP role)');
      console.log('   - tdc.healthcare@example.com / password123 (TDC role)');
      console.log('   - ccrp.securecloud@example.com / password123 (CCRP role)');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }
}

// Run the setup
const setup = new KeycloakRealmSetup();
setup.setup()
  .then(() => {
    console.log('✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 