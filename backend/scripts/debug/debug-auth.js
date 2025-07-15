const axios = require('axios');

async function debugAuth() {
  try {
    // Login as TDC user
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'uitdc@example.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    console.log('User data:', loginResponse.data.user);
    console.log('AccessToken:', loginResponse.data.accessToken);

    const token = loginResponse.data.accessToken;

    // Test a simple endpoint first
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n🔍 Testing auth endpoint...');
    
    try {
      const authResponse = await axios.get('http://localhost:5001/api/auth/profile', { headers });
      console.log('✅ Auth profile endpoint:', authResponse.status, authResponse.data);
    } catch (error) {
      console.log('❌ Auth profile failed:', error.response?.status, error.response?.data);
    }

    // Test TDC endpoints with debug info
    console.log('\n🔍 Testing TDC endpoints with debug...');

    // Test training endpoint
    try {
      const trainingResponse = await axios.get('http://localhost:5001/api/tdc/training/40', { headers });
      console.log('✅ Training endpoint:', trainingResponse.status, trainingResponse.data);
    } catch (error) {
      console.log('❌ Training endpoint failed:', error.response?.status, error.response?.data);
      if (error.response?.data?.debug) {
        console.log('🔍 Debug info:', error.response.data.debug);
      }
    }

    // Test contracts endpoint
    try {
      const contractsResponse = await axios.get('http://localhost:5001/api/tdc/contracts/40', { headers });
      console.log('✅ Contracts endpoint:', contractsResponse.status, contractsResponse.data);
    } catch (error) {
      console.log('❌ Contracts endpoint failed:', error.response?.status, error.response?.data);
      if (error.response?.data?.debug) {
        console.log('🔍 Debug info:', error.response.data.debug);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

debugAuth(); 