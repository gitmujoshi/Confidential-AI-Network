/**
 * Keycloak Realm Setup Script
 * 
 * This script sets up the complete Keycloak realm for the Contract Management System.
 * It creates the realm, roles, groups, and initial users.
 * 
 * Usage:
 * node scripts/setup-keycloak-realm.js
 */

const axios = require('axios');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'contract-management';
const KEYCLOAK_ADMIN_USERNAME = 'admin';
const KEYCLOAK_ADMIN_PASSWORD = 'admin123';

// Function to get Keycloak admin token
async function getKeycloakToken() {
  try {
    const response = await axios.post(`${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        username: KEYCLOAK_ADMIN_USERNAME,
        password: KEYCLOAK_ADMIN_PASSWORD,
        grant_type: 'password',
        client_id: 'admin-cli'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to get Keycloak token:', error.response?.data || error.message);
    throw error;
  }
}

// Function to create realm
async function createRealm(token) {
  try {
    const realmConfig = {
      realm: KEYCLOAK_REALM,
      enabled: true,
      displayName: 'Contract Management System',
      displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>',
      attributes: {
        'frontendUrl': 'http://localhost:3000'
      }
    };

    await axios.post(
      `${KEYCLOAK_BASE_URL}/admin/realms`,
      realmConfig,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

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

// Function to create client
async function createClient(token) {
  try {
    const clientConfig = {
      clientId: 'contract-management-client',
      name: 'Contract Management Client',
      description: 'Client for Contract Management System',
      enabled: true,
      publicClient: true,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      directAccessGrantsEnabled: true,
      serviceAccountsEnabled: false,
      redirectUris: [
        'http://localhost:3000/*',
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/login'
      ],
      webOrigins: [
        'http://localhost:3000'
      ],
      attributes: {
        'saml.assertion.signature': 'false',
        'saml.force.post.binding': 'false',
        'saml.multivalued.roles': 'false',
        'saml.encrypt': 'false',
        'saml.server.signature': 'false',
        'saml.server.signature.keyinfo.ext': 'false',
        'exclude.session.state.from.auth.response': 'false',
        'saml_force_name_id_format': 'false',
        'saml.client.signature': 'false',
        'tls.client.certificate.bound.access.tokens': 'false',
        'saml.authnstatement': 'false',
        'display.on.consent.screen': 'false',
        'saml.onetimeuse.condition': 'false'
      }
    };

    await axios.post(
      `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients`,
      clientConfig,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Client created successfully');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Client already exists');
    } else {
      console.error('❌ Failed to create client:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Function to create roles
async function createRoles(token) {
  try {
    const roles = [
      { name: 'TDP', description: 'Training Data Provider' },
      { name: 'TDC', description: 'Training Data Consumer' },
      { name: 'CCRP', description: 'Confidential Clean Room Provider' },
      { name: 'AppAdmin', description: 'Application Administrator' },
      { name: 'Auditor', description: 'Read-only compliance auditor (contracts + Merkle provenance)' }
    ];

    for (const role of roles) {
      try {
        await axios.post(
          `${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/roles`,
          role,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`✅ Role ${role.name} created`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`ℹ️ Role ${role.name} already exists`);
        } else {
          console.error(`❌ Failed to create role ${role.name}:`, error.response?.data || error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to create roles:', error.response?.data || error.message);
    throw error;
  }
}

// Main setup function
async function setupKeycloakRealm() {
  console.log('🔧 Setting up Keycloak realm...');
  
  try {
    // Get Keycloak admin token
    console.log('🔑 Getting Keycloak admin token...');
    const token = await getKeycloakToken();
    console.log('✅ Keycloak token obtained');

    // Create realm
    console.log('🏗️ Creating realm...');
    await createRealm(token);

    // Create client
    console.log('🔧 Creating client...');
    await createClient(token);

    // Create roles
    console.log('👥 Creating roles...');
    await createRoles(token);

    console.log('🎉 Keycloak realm setup completed!');
    console.log(`📋 Realm: ${KEYCLOAK_REALM}`);
    console.log(`🔗 Admin Console: http://localhost:8080`);
    console.log(`👤 Admin Username: ${KEYCLOAK_ADMIN_USERNAME}`);
    console.log(`🔑 Admin Password: ${KEYCLOAK_ADMIN_PASSWORD}`);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupKeycloakRealm()
    .then(() => {
      console.log('🎉 Keycloak setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupKeycloakRealm }; 