const KeycloakSetup = require('./scripts/setupKeycloak');
const axios = require('axios');

async function createBackendClient() {
  try {
    console.log('🔧 Creating backend client...');
    
    const adminToken = await KeycloakSetup.getAdminToken();
    
    // Create backend client
    const backendClient = {
      clientId: 'contract-management-backend',
      publicClient: false,
      serviceAccountsEnabled: true,
      standardFlowEnabled: false,
      directAccessGrantsEnabled: false,
      authorizationServicesEnabled: false,
      secret: 'backend-secret-key-123' // This will be the client secret
    };

    const response = await axios.post(
      `${KeycloakSetup.baseURL}/admin/realms/contract-management/clients`,
      backendClient,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Backend client created successfully');
    console.log('🔑 Client Secret: backend-secret-key-123');
    
    return backendClient;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Backend client already exists');
    } else {
      console.error('❌ Failed to create backend client:', error.response?.data || error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting Keycloak setup...');
    
    // Get admin token
    await KeycloakSetup.getAdminToken();
    
    // Create realm
    await KeycloakSetup.createRealm();
    
    // Create roles
    await KeycloakSetup.createRoles();
    
    // Create groups
    await KeycloakSetup.createGroups();
    
    // Create backend client
    await createBackendClient();
    
    console.log('✅ Keycloak setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update backend/config.env with the client secret:');
    console.log('   KEYCLOAK_CLIENT_SECRET=backend-secret-key-123');
    console.log('2. Restart the backend server');
    console.log('3. Test user registration');
  } catch (error) {
    console.error('❌ Keycloak setup failed:', error.message);
    process.exit(1);
  }
}

main(); 