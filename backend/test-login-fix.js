const axios = require('axios');

async function testLoginFix() {
  try {
    console.log('🔍 Testing complete login flow with profile endpoint...\n');
    
    // Step 1: Login
    console.log('1. Logging in as uitdc@example.com...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'uitdc@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log('Login response user data:', JSON.stringify(loginResponse.data.user, null, 2));
    
    // Step 2: Get profile (simulating what the frontend should do)
    console.log('\n2. Getting complete user profile...');
    const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile retrieved successfully:');
    console.log('Profile user data:', JSON.stringify(profileResponse.data.user, null, 2));
    
    // Step 3: Verify partyType is present
    const userData = profileResponse.data.user;
    console.log('\n3. Verifying user data...');
    console.log('User partyType:', userData.partyType);
    console.log('Is TDC?', userData.partyType === 'TDC');
    console.log('User ID:', userData.id);
    console.log('User name:', userData.name);
    
    if (userData.partyType === 'TDC') {
      console.log('✅ User is TDC - should be able to create contracts in frontend');
    } else {
      console.log('❌ User is not TDC - cannot create contracts');
    }
    
    // Step 4: Test contract creation
    console.log('\n4. Testing contract creation...');
    try {
      const contractResponse = await axios.post('http://localhost:5001/api/contracts', {
        tdpId: 27,
        datasetId: "TEST-001",
        price: 50,
        duration: 30,
        termsAndConditions: "Test contract after login fix."
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
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLoginFix(); 