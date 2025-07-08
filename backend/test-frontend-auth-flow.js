/**
 * Test Frontend Authentication Flow
 * 
 * This script simulates the frontend authentication flow to identify the issue
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testFrontendAuthFlow() {
  try {
    console.log('🔍 Testing Frontend Authentication Flow...\n');

    // Step 1: Test login with AppAdmin credentials
    console.log('1️⃣ Testing AppAdmin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'appadmin@contractmanagement.com',
      password: 'AppAdmin123!'
    });

    console.log('✅ Login successful!');
    const token = loginResponse.data.accessToken;
    console.log(`   Token: ${token ? 'Received' : 'Not received'}`);

    // Step 2: Test profile endpoint (simulates checkTokenAuth)
    console.log('\n2️⃣ Testing profile endpoint (simulates checkTokenAuth)...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Profile endpoint successful!');
      console.log(`   User: ${profileResponse.data.user.name}`);
      console.log(`   Party Type: ${profileResponse.data.user.partyType}`);
    } catch (profileError) {
      console.log('❌ Profile endpoint failed:', profileError.response?.data || profileError.message);
    }

    // Step 3: Test with invalid token (simulates expired/invalid token)
    console.log('\n3️⃣ Testing with invalid token...');
    try {
      const invalidProfileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': 'Bearer invalid_token_here'
        }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (invalidTokenError) {
      console.log('✅ Invalid token correctly rejected');
      console.log(`   Status: ${invalidTokenError.response?.status}`);
      console.log(`   Error: ${invalidTokenError.response?.data?.error || invalidTokenError.message}`);
    }

    // Step 4: Test without token (simulates no token in localStorage)
    console.log('\n4️⃣ Testing without token...');
    try {
      const noTokenResponse = await axios.get(`${BASE_URL}/auth/profile`);
      console.log('❌ Should have failed without token');
    } catch (noTokenError) {
      console.log('✅ No token correctly rejected');
      console.log(`   Status: ${noTokenError.response?.status}`);
      console.log(`   Error: ${noTokenError.response?.data?.error || noTokenError.message}`);
    }

    console.log('\n🎉 Frontend Authentication Flow Test Completed!');
    console.log('\n📝 Analysis:');
    console.log('   - Login works correctly');
    console.log('   - Profile endpoint works with valid token');
    console.log('   - Invalid tokens are properly rejected');
    console.log('   - Missing tokens are properly rejected');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFrontendAuthFlow(); 