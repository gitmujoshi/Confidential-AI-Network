const KeycloakService = require('./services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');

async function testKeycloakIntegration() {
  console.log('🔧 Testing Keycloak integration...');
  
  const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
  
  try {
    // Test 1: Get admin token
    console.log('\n1. Testing admin token...');
    const adminToken = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getAdminToken();
    console.log('✅ Admin token obtained successfully');
    
    // Test 2: Create a test user
    console.log('\n2. Testing user creation...');
    const testUserData = {
      name: 'Test User',
      email: 'test-***REMOVED-KEYCLOAK_DB_PASSWORD***@example.com',
      partyType: 'TDC',
      walletAddress: '0x1234567890123456789012345678901234567890',
      publicKey: 'test-public-key'
    };
    
    const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(testUserData);
    console.log('✅ User created successfully:', result);
    
    // Test 3: Clean up - delete the test user
    console.log('\n3. Cleaning up test user...');
    await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.deleteUser(result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
    console.log('✅ Test user deleted successfully');
    
    console.log('\n🎉 All Keycloak integration tests passed!');
    
  } catch (error) {
    console.error('❌ Keycloak integration test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Run the test
testKeycloakIntegration()
  .then(() => {
    console.log('\n✅ Keycloak integration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Keycloak integration test failed:', error);
    process.exit(1);
  }); 