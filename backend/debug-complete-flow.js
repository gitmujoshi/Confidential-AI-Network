const axios = require('axios');

async function debugCompleteFlow() {
  try {
    console.log('🔍 === COMPLETE FLOW DEBUG ===');
    
    // Step 1: Login
    console.log('\n1️⃣ LOGIN STEP');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'uitdc@example.com',
      password: 'password123'
    });

    console.log('✅ Login successful');
    console.log('User data from login:', loginResponse.data.user);
    console.log('Token type:', typeof loginResponse.data.accessToken);
    console.log('Token length:', loginResponse.data.accessToken?.length);

    const token = loginResponse.data.accessToken;

    // Step 2: Test auth profile endpoint
    console.log('\n2️⃣ AUTH PROFILE TEST');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', { headers });
      console.log('✅ Auth profile endpoint works');
      console.log('Profile data:', profileResponse.data);
    } catch (error) {
      console.log('❌ Auth profile failed:', error.response?.data || error.message);
    }

    // Step 3: Test TDC endpoints with detailed error analysis
    console.log('\n3️⃣ TDC ENDPOINTS TEST');
    
    const tdcEndpoints = [
      '/api/tdc/training/40',
      '/api/tdc/contracts/40', 
      '/api/tdc/payments/40'
    ];

    for (const endpoint of tdcEndpoints) {
      try {
        console.log(`\n--- Testing ${endpoint} ---`);
        const response = await axios.get(`http://localhost:5001${endpoint}`, { headers });
        console.log(`✅ ${endpoint}: ${response.status}`, response.data);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status}`, error.response?.data);
        
        // Detailed error analysis
        if (error.response?.status === 403) {
          console.log('🔍 403 Analysis:');
          console.log('  - Error message:', error.response.data.error);
          console.log('  - This suggests authorization failure in the route');
        }
      }
    }

    // Step 4: Test a working endpoint for comparison
    console.log('\n4️⃣ WORKING ENDPOINT COMPARISON');
    try {
      const workingResponse = await axios.get('http://localhost:5001/api/notifications/40', { headers });
      console.log('✅ Notifications endpoint works:', workingResponse.status);
    } catch (error) {
      console.log('❌ Notifications failed:', error.response?.data);
    }

    console.log('\n🔍 === DEBUG COMPLETE ===');

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugCompleteFlow(); 