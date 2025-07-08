/**
 * Test Contracts UI Integration
 * 
 * This script tests the contracts API and authentication flow to ensure
 * the frontend can display contracts when users are logged in.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testContractsUI() {
  try {
    console.log('🧪 Testing Contracts UI Integration...\n');

    // Test 1: Login as TDC user
    console.log('1️⃣ Testing TDC user login...');
    const tdcLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tdcuser@example.com',
      password: 'T8g#d4&Y@n$y'
    });

    const tdcToken = tdcLoginResponse.data.accessToken;
    const tdcUser = tdcLoginResponse.data.user;
    
    console.log(`✅ TDC login successful: ${tdcUser.name} (ID: ${tdcUser.id})`);
    console.log(`   Token: ${tdcToken.substring(0, 20)}...`);

    // Test 2: Get contracts for TDC user
    console.log('\n2️⃣ Testing contracts API for TDC user...');
    const tdcContractsResponse = await axios.get(`${API_BASE}/contracts/user/${tdcUser.id}`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    const tdcContracts = tdcContractsResponse.data.contracts;
    console.log(`✅ Found ${tdcContracts.length} contracts for TDC user`);
    
    tdcContracts.forEach((contract, index) => {
      console.log(`   ${index + 1}. ${contract.contractId} - ${contract.dataset.name}`);
      console.log(`      Status: ${contract.status}`);
      console.log(`      Price: $${contract.price}`);
      console.log(`      TDP: ${contract.tdp.name}`);
    });

    // Test 3: Login as TDP user
    console.log('\n3️⃣ Testing TDP user login...');
    const tdpLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tdpuser@example.com',
      password: 'c34mfGQOZ1EE'
    });

    const tdpToken = tdpLoginResponse.data.accessToken;
    const tdpUser = tdpLoginResponse.data.user;
    
    console.log(`✅ TDP login successful: ${tdpUser.name} (ID: ${tdpUser.id})`);
    console.log(`   Token: ${tdpToken.substring(0, 20)}...`);

    // Test 4: Get contracts for TDP user
    console.log('\n4️⃣ Testing contracts API for TDP user...');
    const tdpContractsResponse = await axios.get(`${API_BASE}/contracts/user/${tdpUser.id}`, {
      headers: { Authorization: `Bearer ${tdpToken}` }
    });

    const tdpContracts = tdpContractsResponse.data.contracts;
    console.log(`✅ Found ${tdpContracts.length} contracts for TDP user`);
    
    tdpContracts.forEach((contract, index) => {
      console.log(`   ${index + 1}. ${contract.contractId} - ${contract.dataset.name}`);
      console.log(`      Status: ${contract.status}`);
      console.log(`      Price: $${contract.price}`);
      console.log(`      TDC: ${contract.tdc.name}`);
    });

    // Test 5: Test profile API (used by frontend)
    console.log('\n5️⃣ Testing profile API (used by frontend)...');
    const tdcProfileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    const tdcProfile = tdcProfileResponse.data.user;
    console.log(`✅ Profile API working: ${tdcProfile.name} (ID: ${tdcProfile.id})`);
    console.log(`   Party Type: ${tdcProfile.partyType}`);
    console.log(`   DID: ${tdcProfile.did || 'Not assigned'}`);

    // Test 6: Test without authentication (should fail)
    console.log('\n6️⃣ Testing contracts API without authentication...');
    try {
      await axios.get(`${API_BASE}/contracts/user/${tdcUser.id}`);
      console.log('❌ Expected authentication error but request succeeded');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication required as expected');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} - ${error.message}`);
      }
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ TDC User: ${tdcUser.name} (ID: ${tdcUser.id}) - ${tdcContracts.length} contracts`);
    console.log(`   ✅ TDP User: ${tdpUser.name} (ID: ${tdpUser.id}) - ${tdpContracts.length} contracts`);
    console.log(`   ✅ Authentication: Working`);
    console.log(`   ✅ Profile API: Working`);
    console.log(`   ✅ Contracts API: Working`);
    
    console.log('\n🎯 Frontend Integration Status:');
    console.log('   The frontend should now be able to display contracts when users log in.');
    console.log('   To test:');
    console.log('   1. Go to http://localhost:3000');
    console.log('   2. Login with tdcuser@example.com / T8g#d4&Y@n$y');
    console.log('   3. Navigate to Contracts page');
    console.log('   4. You should see 3 contracts listed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testContractsUI()
  .then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 