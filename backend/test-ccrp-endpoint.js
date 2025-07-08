const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = '***REMOVED-HARDCODED-JWT***';

async function testCCRPEndpoint() {
  try {
    // Create a test token for a TDC user
    const token = jwt.sign(
      {
        email: 'tdc@test.com', // TDC user email
        userId: 2
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Test token created for TDC user');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test the CCRP endpoint
    const response = await axios.get('http://localhost:5001/api/users/ccrp', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ CCRP endpoint test successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ CCRP endpoint test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCCRPEndpoint(); 