const axios = require('axios');

async function debugUserRole() {
  try {
    console.log('🔍 Debugging user role extraction...\n');
    
    // Login to get a fresh token
    console.log('1. Logging in as uitdc@example.com...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'uitdc@example.com',
      password: 'Test123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    // Decode the JWT token to see what's in it
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    console.log('\n2. Decoded JWT token:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Test a contract creation request to see what req.user contains
    console.log('\n3. Testing contract creation request...');
    try {
      const contractResponse = await axios.post('http://localhost:5001/api/contracts', {
        tdpId: 27,
        datasetId: "TEST-001",
        price: 50,
        duration: 30,
        termsAndConditions: "Test contract for debugging."
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Contract creation successful');
      console.log('Contract:', contractResponse.data);
      
    } catch (contractError) {
      console.log('❌ Contract creation failed:');
      console.log('Error:', contractError.response?.data || contractError.message);
    }
    
    // Also test getting user info from the token
    console.log('\n4. Testing user info endpoint...');
    try {
      const userResponse = await axios.get('http://localhost:5001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ User info successful:');
      console.log('User:', userResponse.data);
      
    } catch (userError) {
      console.log('❌ User info failed:');
      console.log('Error:', userError.response?.data || userError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugUserRole(); 