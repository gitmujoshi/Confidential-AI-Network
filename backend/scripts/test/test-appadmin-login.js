/**
 * Test AppAdmin Login
 * 
 * Simple test to verify AppAdmin login with correct credentials
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAppAdminLogin() {
  try {
    console.log('🔐 Testing AppAdmin Login...\n');

    const credentials = {
      email: 'appadmin@contractmanagement.com',
      password: 'AppAdmin123!'
    };

    console.log(`Attempting login with: ${credentials.email}`);

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);

    console.log('✅ Login Successful!');
    console.log('\n📋 Login Details:');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Password: ${credentials.password}`);
    console.log(`   Access Token: ${loginResponse.data.accessToken ? '✅ Received' : '❌ Not received'}`);
    console.log(`   User ID: ${loginResponse.data.user.id}`);
    console.log(`   Party Type: ${loginResponse.data.user.partyType}`);
    console.log(`   Name: ${loginResponse.data.user.name}`);

    // Test getting profile with the token
    if (loginResponse.data.accessToken) {
      console.log('\n🔍 Testing profile access...');
      try {
        const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.accessToken}`
          }
        });
        console.log('✅ Profile access successful!');
        console.log(`   User: ${profileResponse.data.user.name}`);
        console.log(`   Email: ${profileResponse.data.user.email}`);
        console.log(`   Party Type: ${profileResponse.data.user.partyType}`);
      } catch (profileError) {
        console.log('❌ Profile access failed:', profileError.response?.data?.error || profileError.message);
      }
    }

    console.log('\n🎉 AppAdmin Login Test Completed Successfully!');
    console.log('\n📝 Use these credentials in your app:');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Password: ${credentials.password}`);

  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the test
testAppAdminLogin(); 