/**
 * Test Contracts Fix
 * 
 * This script tests the contracts API to verify the fix is working.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testContractsFix() {
  try {
    console.log('🧪 Testing Contracts Fix...\n');

    // Test 1: Login as TDC user
    console.log('1️⃣ Testing TDC user login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tdcuser@example.com',
      password: 'T8g#d4&Y@n$y'
    });

    const token = loginResponse.data.accessToken;
    const user = loginResponse.data.user;
    
    console.log(`✅ Login successful: ${user.name} (ID: ${user.id})`);

    // Test 2: Get contracts
    console.log('\n2️⃣ Testing contracts API...');
    const contractsResponse = await axios.get(`${API_BASE}/contracts/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const contracts = contractsResponse.data.contracts;
    console.log(`✅ Found ${contracts.length} contracts`);
    
    // Display contracts
    contracts.forEach((contract, index) => {
      console.log(`   ${index + 1}. ${contract.contractId}`);
      console.log(`      Dataset: ${contract.dataset.name}`);
      console.log(`      Price: $${contract.price}`);
      console.log(`      Status: ${contract.status}`);
      console.log(`      Model: ${contract.modelId}`);
    });

    console.log('\n✅ Contracts API is working correctly!');
    console.log('   The frontend should now display these contracts.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContractsFix()
  .then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 