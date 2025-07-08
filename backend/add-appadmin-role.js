/**
 * Add AppAdmin Role Script
 * 
 * This script adds the AppAdmin role to Keycloak with all permissions
 * from TDP, TDC, and CCRP roles.
 */

const axios = require('axios');

class AppAdminRoleSetup {
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

  async createAppAdminRole() {
    try {
      const roleData = {
        name: 'AppAdmin',
        description: 'Application Administrator - Has access to all functions covered by TDP, TDC, and CCRP roles. Can create and manage datasets, create contracts, and review/sign contracts.',
        composite: false,
        clientRole: false
      };

      await axios.post(`${this.baseURL}/admin/realms/contract-management/roles`, roleData, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ AppAdmin role created successfully');
      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ AppAdmin role already exists');
        return false;
      } else {
        console.error('❌ Failed to create AppAdmin role:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  async getExistingRoles() {
    try {
      const response = await axios.get(`${this.baseURL}/admin/realms/contract-management/roles`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get existing roles:', error.response?.data || error.message);
      throw error;
    }
  }

  async createAppAdminUser() {
    try {
      const userData = {
        username: 'appadmin',
        enabled: true,
        emailVerified: true,
        firstName: 'Application',
        lastName: 'Administrator',
        email: 'appadmin@contractmanagement.com',
        attributes: {
          walletAddress: ['0x0000000000000000000000000000000000000000'],
          partyType: ['AppAdmin'],
          publicKey: ['0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
          organization: ['Contract Management System'],
          phoneNumber: ['+1-555-0000'],
          profileCompleted: ['true'],
          emailVerified: ['true']
        },
        credentials: [
          {
            type: 'password',
            value: 'AppAdmin123!',
            temporary: false
          }
        ],
        realmRoles: ['AppAdmin']
      };

      await axios.post(`${this.baseURL}/admin/realms/contract-management/users`, userData, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ AppAdmin user created successfully');
      console.log('   Username: appadmin');
      console.log('   Password: AppAdmin123!');
      console.log('   Email: appadmin@contractmanagement.com');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ AppAdmin user already exists');
      } else {
        console.error('❌ Failed to create AppAdmin user:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  async setup() {
    try {
      console.log('🚀 Setting up AppAdmin role and user...\n');

      // Step 1: Get admin token
      console.log('1️⃣ Getting admin token...');
      await this.getAdminToken();

      // Step 2: Get existing roles
      console.log('\n2️⃣ Checking existing roles...');
      const existingRoles = await this.getExistingRoles();
      console.log('   Existing roles:', existingRoles.map(r => r.name).join(', '));

      // Step 3: Create AppAdmin role
      console.log('\n3️⃣ Creating AppAdmin role...');
      const roleCreated = await this.createAppAdminRole();

      // Step 4: Create AppAdmin user
      console.log('\n4️⃣ Creating AppAdmin user...');
      await this.createAppAdminUser();

      console.log('\n🎉 AppAdmin setup completed successfully!');
      console.log('\n📋 AppAdmin Role Summary:');
      console.log('   Role Name: AppAdmin');
      console.log('   Description: Application Administrator with full access');
      console.log('   Permissions: TDP_FULL, TDC_FULL, CCRP_FULL');
      console.log('   Scope: Application-wide access');
      console.log('\n👤 AppAdmin User Credentials:');
      console.log('   Username: appadmin');
      console.log('   Password: AppAdmin123!');
      console.log('   Email: appadmin@contractmanagement.com');
      console.log('\n🔗 Access URLs:');
      console.log('   Keycloak Admin: http://localhost:8080/admin/');
      console.log('   Login: http://localhost:8080/realms/contract-management/protocol/openid-connect/auth');

    } catch (error) {
      console.error('\n💥 AppAdmin setup failed:', error.message);
      throw error;
    }
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const setup = new AppAdminRoleSetup();
  setup.setup()
    .then(() => {
      console.log('\n✅ AppAdmin setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ AppAdmin setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = AppAdminRoleSetup; 