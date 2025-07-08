const axios = require('axios');

async function testCCRPSelection() {
  try {
    console.log('🔐 Logging in as TDC user...');
    
    // Login as TDC user
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'tdc@test.com',
      password: 'TDC123!'
    });

    const { token } = loginResponse.data;
    console.log('✅ Login successful');

    // Get a contract ID (you'll need to replace this with an actual contract ID)
    console.log('\n📋 Getting contracts...');
    const contractsResponse = await axios.get('http://localhost:5001/api/contracts/user/2', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Contracts found:', contractsResponse.data.contracts.length);
    
    if (contractsResponse.data.contracts.length === 0) {
      console.log('❌ No contracts found. Please create a contract first.');
      return;
    }

    const contract = contractsResponse.data.contracts[0];
    console.log('Using contract:', contract.contractId);

    // Get CCRP users
    console.log('\n🔍 Getting CCRP users...');
    const ccrpResponse = await axios.get('http://localhost:5001/api/users/ccrp', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('CCRP users found:', ccrpResponse.data.length);
    
    if (ccrpResponse.data.length === 0) {
      console.log('❌ No CCRP users found.');
      return;
    }

    const ccrpUser = ccrpResponse.data[0];
    console.log('Using CCRP:', ccrpUser.name);

    // Test CCRP selection
    console.log('\n🎯 Testing CCRP selection...');
    const selectionResponse = await axios.post(`http://localhost:5001/api/contracts/${contract.contractId}/select-ccrp`, {
      ccrpId: ccrpUser.id
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ CCRP selection successful!');
    console.log('Response:', JSON.stringify(selectionResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCCRPSelection(); 