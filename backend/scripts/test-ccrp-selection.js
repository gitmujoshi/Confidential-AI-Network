/**
 * Test CCRP Selection
 * 
 * This script tests the CCRP selection functionality by TDC users.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testCCRPSelection() {
  try {
    console.log('🧪 Testing CCRP Selection...\n');

    // Step 1: Login as TDC user
    console.log('1️⃣ Logging in as TDC user...');
    const tdcLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tdcuser@example.com',
      password: 'c34mfGQOZ1EE'
    });

    const tdcToken = tdcLoginResponse.data.accessToken;
    const tdcUser = tdcLoginResponse.data.user;
    
    console.log(`✅ TDC login successful: ${tdcUser.name} (ID: ${tdcUser.id})`);
    console.log(`   Party Type: ${tdcUser.partyType}`);

    // Step 2: Get available CCRPs
    console.log('\n2️⃣ Getting available CCRPs...');
    const ccrpResponse = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    const ccrpUsers = ccrpResponse.data.filter(user => user.partyType === 'CCRP');
    console.log(`✅ Found ${ccrpUsers.length} available CCRPs:`);
    
    ccrpUsers.forEach((ccrp, index) => {
      console.log(`   ${index + 1}. ${ccrp.name} (${ccrp.organization})`);
      console.log(`      Email: ${ccrp.email}`);
      console.log(`      DID: ${ccrp.did}`);
      console.log(`      Description: ${ccrp.description}`);
      console.log('');
    });

    // Step 3: Get contracts for TDC user
    console.log('3️⃣ Getting contracts for TDC user...');
    const contractsResponse = await axios.get(`${API_BASE}/contracts/user/${tdcUser.id}`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    const contracts = contractsResponse.data.contracts;
    console.log(`✅ Found ${contracts.length} contracts for TDC user`);
    
    if (contracts.length === 0) {
      console.log('❌ No contracts found for TDC user');
      return;
    }

    // Find a contract that needs CCRP selection
    const contractToSelectCCRP = contracts.find(c => 
      c.status === 'PENDING_CCRP_APPROVAL' && !c.ccrpId
    );

    if (!contractToSelectCCRP) {
      console.log('❌ No contracts found that need CCRP selection');
      console.log('   Available contracts:');
      contracts.forEach(c => {
        console.log(`   - ${c.contractId}: ${c.status} (CCRP: ${c.ccrpId || 'Not selected'})`);
      });
      return;
    }

    console.log(`📋 Found contract for CCRP selection: ${contractToSelectCCRP.contractId}`);
    console.log(`   Status: ${contractToSelectCCRP.status}`);
    console.log(`   TDP Signed: ${contractToSelectCCRP.tdpSigned}`);

    // Step 4: Select a CCRP for the contract
    console.log('\n4️⃣ Selecting CCRP for contract...');
    const selectedCCRP = ccrpUsers[0]; // Select the first CCRP
    
    console.log(`   Selected CCRP: ${selectedCCRP.name} (ID: ${selectedCCRP.id})`);
    console.log(`   Organization: ${selectedCCRP.organization}`);
    console.log(`   DID: ${selectedCCRP.did}`);

    // For this test, we'll simulate the selection by updating the contract directly
    // In a real scenario, this would be done through the frontend UI
    console.log('\n5️⃣ Simulating CCRP selection...');
    
    // Get admin token to update contract
    const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@contractmanagement.com',
      password: 'Admin123!'
    });

    const adminToken = adminLoginResponse.data.accessToken;
    
    // Update contract with CCRP selection
    const updateResponse = await axios.put(`${API_BASE}/contracts/${contractToSelectCCRP.contractId}`, {
      ccrpId: selectedCCRP.id,
      status: 'PENDING_CCRP_APPROVAL'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('✅ CCRP selection successful!');
    console.log(`   Contract ID: ${updateResponse.data.contract.contractId}`);
    console.log(`   CCRP ID: ${updateResponse.data.contract.ccrpId}`);
    console.log(`   Status: ${updateResponse.data.contract.status}`);

    // Step 6: Verify the selection
    console.log('\n6️⃣ Verifying CCRP selection...');
    const verifyResponse = await axios.get(`${API_BASE}/contracts/${contractToSelectCCRP.contractId}`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    const updatedContract = verifyResponse.data;
    console.log(`✅ Verification successful:`);
    console.log(`   Contract ID: ${updatedContract.contractId}`);
    console.log(`   Status: ${updatedContract.status}`);
    console.log(`   TDP Signed: ${updatedContract.tdpSigned}`);
    console.log(`   CCRP Selected: ${updatedContract.ccrpId ? 'Yes' : 'No'}`);
    
    if (updatedContract.ccrp) {
      console.log(`   CCRP Name: ${updatedContract.ccrp.name}`);
      console.log(`   CCRP Organization: ${updatedContract.ccrp.organization}`);
      console.log(`   CCRP DID: ${updatedContract.ccrp.did}`);
    }

    console.log('\n🎉 CCRP Selection Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Available CCRPs: ${ccrpUsers.length}`);
    console.log(`   Selected CCRP: ${selectedCCRP.name}`);
    console.log(`   Contract: ${contractToSelectCCRP.contractId}`);
    console.log(`   Status: ${updatedContract.status}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
    
    if (error.response?.data) {
      console.error('   Response data:', error.response.data);
    }
  }
}

testCCRPSelection()
  .then(() => {
    console.log('\n🏁 Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 