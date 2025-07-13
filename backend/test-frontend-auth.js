const axios = require('axios');

async function testFrontendAuth() {
  try {
    console.log('🔍 Testing frontend authentication flow...\n');
    
    // Step 1: Login
    console.log('1. Logging in as uitdc@example.com...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'uitdc@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    // Step 2: Get profile
    console.log('\n2. Getting user profile...');
    const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile retrieved successfully:');
    console.log('User data:', JSON.stringify(profileResponse.data.user, null, 2));
    
    // Step 3: Test contract creation with the same token
    console.log('\n3. Testing contract creation...');
    try {
      const contractResponse = await axios.post('http://localhost:5001/api/contracts', {
        tdpId: 27,
        datasetId: "TEST-001",
        price: 50,
        duration: 30,
        termsAndConditions: "Test contract for frontend auth debugging."
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Contract creation successful');
      console.log('Contract ID:', contractResponse.data.contract?.contractId);
      
    } catch (contractError) {
      console.log('❌ Contract creation failed:');
      console.log('Error:', contractError.response?.data || contractError.message);
    }
    
    // Step 4: Simulate what the frontend should be doing
    console.log('\n4. Simulating frontend user context...');
    const userData = profileResponse.data.user;
    console.log('User partyType:', userData.partyType);
    console.log('Is TDC?', userData.partyType === 'TDC');
    
    if (userData.partyType === 'TDC') {
      console.log('✅ User is TDC - should be able to create contracts');
    } else {
      console.log('❌ User is not TDC - cannot create contracts');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFrontendAuth(); 