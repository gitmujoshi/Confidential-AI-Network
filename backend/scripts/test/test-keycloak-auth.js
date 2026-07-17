require('dotenv').config({ path: './config.env' });
const KeycloakService = require('./services/keycloakService');

async function testKeycloakAuth() {
  try {
    console.log('Testing Keycloak authentication...');
    console.log('Environment variables:');
    console.log('- KEYCLOAK_URL:', process.env.KEYCLOAK_URL);
    console.log('- KEYCLOAK_REALM:', process.env.KEYCLOAK_REALM);
    console.log('- KEYCLOAK_CLIENT_ID:', process.env.KEYCLOAK_CLIENT_ID);
    console.log('- KEYCLOAK_CLIENT_SECRET:', process.env.KEYCLOAK_CLIENT_SECRET);
    
    const keycloakService = new KeycloakService();
    console.log('KeycloakService config:', keycloakService.config);
    
    console.log('\nTesting authentication...');
    const result = await keycloakService.authenticateUserWithPassword('testregistration@example.com', '4h1hHt63ls%258');
    console.log('Authentication successful:', result);
    
  } catch (error) {
    console.error('Authentication failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testKeycloakAuth(); 