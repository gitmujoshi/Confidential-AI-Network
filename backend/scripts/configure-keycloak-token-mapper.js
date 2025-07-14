const axios = require('axios');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'contract-management';
const CLIENT_ID = 'contract-management-backend';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';

class KeycloakTokenMapper {
  constructor() {
    this.baseURL = KEYCLOAK_URL;
    this.realm = REALM;
    this.accessToken = null;
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
   * Get client ID
   */
  async getClientId() {
    try {
      const response = await axios.get(`${this.baseURL}/admin/realms/${this.realm}/clients`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const client = response.data.find(c => c.clientId === CLIENT_ID);
      if (!client) {
        throw new Error(`Client ${CLIENT_ID} not found`);
      }

      return client.id;
    } catch (error) {
      console.error('❌ Failed to get client ID:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create protocol mapper for custom attributes
   */
  async createProtocolMapper(clientId) {
    try {
      console.log('🔧 Creating protocol mapper for custom attributes...');
      
      const mapper = {
        name: 'custom-attributes',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'user.attribute': 'dbUserId',
          'claim.name': 'dbUserId',
          'jsonType.label': 'String',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'userinfo.token.claim': 'true'
        }
      };

      await axios.post(`${this.baseURL}/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models`, mapper, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Protocol mapper created for dbUserId');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Protocol mapper already exists');
      } else {
        console.error('❌ Failed to create protocol mapper:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Create protocol mapper for partyType
   */
  async createPartyTypeMapper(clientId) {
    try {
      console.log('🔧 Creating protocol mapper for partyType...');
      
      const mapper = {
        name: 'party-type-mapper',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'user.attribute': 'partyType',
          'claim.name': 'partyType',
          'jsonType.label': 'String',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'userinfo.token.claim': 'true'
        }
      };

      await axios.post(`${this.baseURL}/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models`, mapper, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Protocol mapper created for partyType');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ PartyType mapper already exists');
      } else {
        console.error('❌ Failed to create partyType mapper:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Create protocol mapper for walletAddress
   */
  async createWalletAddressMapper(clientId) {
    try {
      console.log('🔧 Creating protocol mapper for walletAddress...');
      
      const mapper = {
        name: 'wallet-address-mapper',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'user.attribute': 'walletAddress',
          'claim.name': 'walletAddress',
          'jsonType.label': 'String',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'userinfo.token.claim': 'true'
        }
      };

      await axios.post(`${this.baseURL}/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models`, mapper, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Protocol mapper created for walletAddress');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ WalletAddress mapper already exists');
      } else {
        console.error('❌ Failed to create walletAddress mapper:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Create protocol mapper for publicKey
   */
  async createPublicKeyMapper(clientId) {
    try {
      console.log('🔧 Creating protocol mapper for publicKey...');
      
      const mapper = {
        name: 'public-key-mapper',
        protocol: 'openid-connect',
        protocolMapper: 'oidc-usermodel-attribute-mapper',
        config: {
          'user.attribute': 'publicKey',
          'claim.name': 'publicKey',
          'jsonType.label': 'String',
          'id.token.claim': 'true',
          'access.token.claim': 'true',
          'userinfo.token.claim': 'true'
        }
      };

      await axios.post(`${this.baseURL}/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models`, mapper, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Protocol mapper created for publicKey');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ PublicKey mapper already exists');
      } else {
        console.error('❌ Failed to create publicKey mapper:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Main configuration function
   */
  async configure() {
    try {
      console.log('🔧 Configuring Keycloak token mappers...\n');
      
      // Get admin token
      await this.getAdminToken();
      
      // Get client ID
      const clientId = await this.getClientId();
      console.log(`✅ Client ID: ${clientId}\n`);
      
      // Create protocol mappers
      await this.createProtocolMapper(clientId);
      await this.createPartyTypeMapper(clientId);
      await this.createWalletAddressMapper(clientId);
      await this.createPublicKeyMapper(clientId);
      
      console.log('\n🎉 Keycloak token mappers configured successfully!');
      console.log('\n📝 Custom attributes will now be included in JWT tokens:');
      console.log('   - dbUserId');
      console.log('   - partyType');
      console.log('   - walletAddress');
      console.log('   - publicKey');
      console.log('\n⚠️  You may need to re-login users to get tokens with the new attributes.');
      
    } catch (error) {
      console.error('❌ Configuration failed:', error.message);
      throw error;
    }
  }
}

// Run the configuration
async function main() {
  const configurator = new KeycloakTokenMapper();
  await configurator.configure();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = KeycloakTokenMapper; 