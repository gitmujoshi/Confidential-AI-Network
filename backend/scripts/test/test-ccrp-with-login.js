const axios = require('axios');

async function testCCRPEndpointWithLogin() {
  try {
    console.log('🔐 Logging in as TDC user...');
    
    // Login as TDC user
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'tdc@test.com',
      password: 'TDC123!'
    });

    const { token } = loginResponse.data;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test the CCRP endpoint with the login token
    console.log('\n🔍 Testing CCRP endpoint...');
    const ccrpResponse = await axios.get('http://localhost:5001/api/users/ccrp', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ CCRP endpoint test successful!');
    console.log('Status:', ccrpResponse.status);
    console.log('Number of CCRPs found:', ccrpResponse.data.length);
    console.log('CCRPs:', JSON.stringify(ccrpResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCCRPEndpointWithLogin(); 