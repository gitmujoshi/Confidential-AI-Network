const axios = require('axios');

// Test configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const KEYCLOAK_REALM = 'contract-management';
const BACKEND_URL = 'http://localhost:5001';

// Test users
const testUsers = [
  {
    email: 'tdp.medical@example.com',
    password: 'tdp.medical@example.com',
    partyType: 'TDP'
  },
  {
    email: 'tdc.healthcare@example.com',
    password: 'tdc.healthcare@example.com',
    partyType: 'TDC'
  },
  {
    email: 'ccrp.securecloud@example.com',
    password: 'ccrp.securecloud@example.com',
    partyType: 'CCRP'
  }
];

// Function to get Keycloak token for a user
async function getKeycloakToken(email, password) {
  try {
    const response = await axios.post(`${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, 
      new URLSearchParams({
        username: email,
        password: password,
        grant_type: 'password',
        client_id: 'contract-management-client'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    
    return response.data.access_token;
  } catch (error) {
    console.error(`❌ Failed to get token for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

// Function to test backend authentication
async function testBackendAuth(token, userInfo) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Backend auth successful for ${userInfo.email}`);
    console.log(`   User data:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ Backend auth failed for ${userInfo.email}:`, error.response?.data || error.message);
    return false;
  }
}

// Function to test Keycloak user info
async function testKeycloakUserInfo(token, userInfo) {
  try {
    const response = await axios.get(`${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`✅ Keycloak userinfo successful for ${userInfo.email}`);
    console.log(`   User info:`, response.data);
    return true;
  } catch (error) {
    console.error(`❌ Keycloak userinfo failed for ${userInfo.email}:`, error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function testKeycloakAuthentication() {
  console.log('🧪 Testing Keycloak authentication...');
  
  let successCount = 0;
  let totalCount = 0;

  for (const user of testUsers) {
    totalCount++;
    console.log(`\n🔐 Testing authentication for: ${user.email}`);
    
    try {
      // Get Keycloak token
      const token = await getKeycloakToken(user.email, user.password);
      console.log(`✅ Keycloak token obtained for ${user.email}`);

      // Test Keycloak userinfo
      await testKeycloakUserInfo(token, user);

      // Test backend authentication
      const backendSuccess = await testBackendAuth(token, user);
      
      if (backendSuccess) {
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ Authentication test failed for ${user.email}`);
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 All authentication tests passed!');
  } else {
    console.log('⚠️ Some authentication tests failed');
  }
}

// Run the test
if (require.main === module) {
  testKeycloakAuthentication()
    .then(() => {
      console.log('🎉 Authentication testing completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testKeycloakAuthentication }; 