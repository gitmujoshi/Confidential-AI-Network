const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_USER_EMAIL = 'uitdc@example.com';
const TEST_USER_PASSWORD = 'password123';

async function testAllDashboards() {
  try {
    console.log('🔍 === TESTING ALL DASHBOARDS ===\n');

    // Step 1: Login
    console.log('1️⃣ LOGIN STEP');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      return;
    }

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log('Token type:', typeof token);
    console.log('Token length:', token.length);

    // Step 2: Get user profile to confirm user ID
    console.log('\n2️⃣ AUTH PROFILE TEST');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (profileResponse.status === 200) {
      console.log('✅ Auth profile endpoint works');
      console.log('Profile data:', profileResponse.data);
    } else {
      console.log('❌ Auth profile failed');
      return;
    }

    const userId = profileResponse.data.user.id;
    console.log(`User ID: ${userId}`);

    // Step 3: Test TDC Dashboard (should work now)
    console.log('\n3️⃣ TDC DASHBOARD TEST');
    try {
      const tdcResponse = await axios.get(`${BASE_URL}/tdc/dashboard/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ TDC Dashboard: ${tdcResponse.status}`);
    } catch (error) {
      console.log(`❌ TDC Dashboard: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // Step 4: Test TDP Dashboard (should have same issue)
    console.log('\n4️⃣ TDP DASHBOARD TEST');
    try {
      const tdpResponse = await axios.get(`${BASE_URL}/tdp/dashboard/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ TDP Dashboard: ${tdpResponse.status}`);
    } catch (error) {
      console.log(`❌ TDP Dashboard: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // Step 5: Test CCRP Dashboard (should have same issue)
    console.log('\n5️⃣ CCRP DASHBOARD TEST');
    try {
      const ccrpResponse = await axios.get(`${BASE_URL}/ccrp/dashboard/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ CCRP Dashboard: ${ccrpResponse.status}`);
    } catch (error) {
      console.log(`❌ CCRP Dashboard: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // Step 6: Test TDP Contracts
    console.log('\n6️⃣ TDP CONTRACTS TEST');
    try {
      const tdpContractsResponse = await axios.get(`${BASE_URL}/tdp/contracts/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ TDP Contracts: ${tdpContractsResponse.status}`);
    } catch (error) {
      console.log(`❌ TDP Contracts: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    // Step 7: Test CCRP Contracts
    console.log('\n7️⃣ CCRP CONTRACTS TEST');
    try {
      const ccrpContractsResponse = await axios.get(`${BASE_URL}/ccrp/contracts/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`✅ CCRP Contracts: ${ccrpContractsResponse.status}`);
    } catch (error) {
      console.log(`❌ CCRP Contracts: ${error.response?.status} - ${error.response?.data?.error}`);
    }

    console.log('\n🔍 === TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllDashboards(); 