const axios = require('axios');

async function testTDCUser() {
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

    // Test TDC endpoints
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n🔍 Testing TDC endpoints...');

    // Test training endpoint
    try {
      const trainingResponse = await axios.get('http://localhost:5001/api/tdc/training/40', { headers });
      console.log('✅ Training endpoint:', trainingResponse.status, trainingResponse.data);
    } catch (error) {
      console.log('❌ Training endpoint failed:', error.response?.status, error.response?.data);
    }

    // Test contracts endpoint
    try {
      const contractsResponse = await axios.get('http://localhost:5001/api/tdc/contracts/40', { headers });
      console.log('✅ Contracts endpoint:', contractsResponse.status, contractsResponse.data);
    } catch (error) {
      console.log('❌ Contracts endpoint failed:', error.response?.status, error.response?.data);
    }

    // Test payments endpoint
    try {
      const paymentsResponse = await axios.get('http://localhost:5001/api/tdc/payments/40', { headers });
      console.log('✅ Payments endpoint:', paymentsResponse.status, paymentsResponse.data);
    } catch (error) {
      console.log('❌ Payments endpoint failed:', error.response?.status, error.response?.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTDCUser(); 