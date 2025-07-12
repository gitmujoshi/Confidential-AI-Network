const axios = require('axios');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'contract-management';
const CLIENT_ID = 'contract-management-backend';
const CLIENT_SECRET = 'J2i8HMfirjKiEPHRl3mJkq1AiGZykEjL'; // Client secret from Keycloak

async function testKeycloakAuth() {
  try {
    console.log('🔐 Testing Keycloak authentication...');
    
    // Test 1: Get admin token
    console.log('\n1️⃣ Testing admin authentication...');
    const adminResponse = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: 'admin',
        password: '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log('✅ Admin authentication successful');
    
    // Test 2: Get user token with backend client and secret
    console.log('\n2️⃣ Testing user authentication...');
    const userResponse = await axios.post(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`, 
      new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username: 'tdc.healthcare@example.com',
        password: 'password123'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log('✅ User authentication successful');
    
    const accessToken = userResponse.data.access_token;
    console.log(`📝 Access token obtained: ${accessToken.substring(0, 50)}...`);
    
    // Test 3: Validate token with backend
    console.log('\n3️⃣ Testing token validation with backend...');
    const backendResponse = await axios.get('http://localhost:5001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Backend token validation successful');
    console.log('👤 User info:', backendResponse.data);
    
    // Test 4: Test protected endpoint
    console.log('\n4️⃣ Testing protected endpoint...');
    const contractsResponse = await axios.get('http://localhost:5001/api/contracts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Protected endpoint access successful');
    console.log(`📊 Contracts count: ${contractsResponse.data.length}`);
    
    console.log('\n🎉 All Keycloak authentication tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Admin authentication');
    console.log('✅ User authentication');
    console.log('✅ Token validation');
    console.log('✅ Protected endpoint access');
    
  } catch (error) {
    console.error('❌ Keycloak authentication test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if Keycloak is running: docker ps | grep ***REMOVED-KEYCLOAK_DB_PASSWORD***');
      console.log('2. Verify realm setup: http://localhost:8080');
      console.log('3. Check user credentials in Keycloak admin console');
      console.log('4. Ensure backend is running on port 5001');
    }
  }
}

testKeycloakAuth(); 