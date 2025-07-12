/**
 * Fix Keycloak Client Permissions
 * 
 * This script configures the backend client to have proper permissions
 * for accessing user information and performing authentication.
 */

const axios = require('axios');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'contract-management';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const BACKEND_CLIENT_ID = 'contract-management-backend';

async function getAdminToken() {
  try {
    const response = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get admin token:', error.response?.data || error.message);
    throw error;
  }
}

async function getClientId(adminToken) {
  try {
    const response = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const client = response.data.find(c => c.clientId === BACKEND_CLIENT_ID);
    if (!client) {
      throw new Error(`Client ${BACKEND_CLIENT_ID} not found`);
    }
    
    return client.id;
  } catch (error) {
    console.error('Failed to get client ID:', error.response?.data || error.message);
    throw error;
  }
}

async function updateClientConfiguration(adminToken, clientId) {
  try {
    const clientConfig = {
      clientId: BACKEND_CLIENT_ID,
      secret: 'C3WKydFdKzACc27z3Yf2E3skLQr5vRg3',
      enabled: true,
      publicClient: false,
      directAccessGrantsEnabled: true,
      serviceAccountsEnabled: true,
      authorizationServicesEnabled: true,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      webOrigins: ['http://localhost:3000'],
      redirectUris: ['http://localhost:3000/*'],
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

    const response = await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientId}`, clientConfig, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Client configuration updated successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to update client configuration:', error.response?.data || error.message);
    throw error;
  }
}

async function updateClientScopes(adminToken, clientId) {
  try {
    // Get default scopes
    const scopesResponse = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientId}/default-client-scopes`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Current default scopes:', scopesResponse.data.map(s => s.name));
    
    // Add required scopes if not present
    const requiredScopes = ['openid', 'profile', 'email'];
    const currentScopes = scopesResponse.data.map(s => s.name);
    
    for (const scopeName of requiredScopes) {
      if (!currentScopes.includes(scopeName)) {
        console.log(`Adding scope: ${scopeName}`);
        // Get scope ID
        const scopeResponse = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const scope = scopeResponse.data.find(s => s.name === scopeName);
        if (scope) {
          await axios.put(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientId}/default-client-scopes/${scope.id}`, {}, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Added scope: ${scopeName}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to update client scopes:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔧 Fixing Keycloak client permissions...\n');
    
    // Get admin token
    console.log('1. Getting admin token...');
    const adminToken = await getAdminToken();
    console.log('✅ Admin token obtained\n');
    
    // Get client ID
    console.log('2. Getting client ID...');
    const clientId = await getClientId(adminToken);
    console.log(`✅ Client ID: ${clientId}\n`);
    
    // Update client configuration
    console.log('3. Updating client configuration...');
    await updateClientConfiguration(adminToken, clientId);
    console.log('✅ Client configuration updated\n');
    
    // Update client scopes
    console.log('4. Updating client scopes...');
    await updateClientScopes(adminToken, clientId);
    console.log('✅ Client scopes updated\n');
    
    console.log('🎉 Keycloak client permissions fixed successfully!');
    console.log('\nThe backend client now has proper permissions for:');
    console.log('- Direct access grants (password login)');
    console.log('- User info access');
    console.log('- Required scopes (openid, profile, email)');
    
  } catch (error) {
    console.error('❌ Failed to fix Keycloak client permissions:', error.message);
    process.exit(1);
  }
}

main(); 