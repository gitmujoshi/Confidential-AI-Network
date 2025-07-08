/**
 * Final AppAdmin Login Test
 * 
 * This script tests the complete AppAdmin login flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAppAdminLoginFinal() {
  try {
    console.log('🔐 Final AppAdmin Login Test...\n');

    const credentials = {
      email: 'appadmin@contractmanagement.com',
      password: 'AppAdmin123!'
    };

    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);

    console.log('✅ Login successful!');
    const token = loginResponse.data.accessToken;
    console.log(`   Token received: ${token ? 'Yes' : 'No'}`);
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Party Type: ${loginResponse.data.user.partyType}`);

    console.log('\n2️⃣ Testing profile access...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile access successful!');
    console.log(`   User: ${profileResponse.data.user.name}`);
    console.log(`   Email: ${profileResponse.data.user.email}`);
    console.log(`   Party Type: ${profileResponse.data.user.partyType}`);

    console.log('\n🎉 AppAdmin Login Test PASSED!');
    console.log('\n📝 Summary:');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Password: ${credentials.password}`);
    console.log(`   Login: ✅ Working`);
    console.log(`   Token Validation: ✅ Working`);
    console.log(`   Profile Access: ✅ Working`);

    console.log('\n🔗 Use these credentials in your frontend app:');
    console.log(`   Email: ${credentials.email}`);
    console.log(`   Password: ${credentials.password}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAppAdminLoginFinal(); 