/**
 * Test DID-Based Contract Signing for TDC User
 * 
 * This script tests the DID-based contract signing functionality for TDC user.
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testDIDSigningTDC() {
  try {
    console.log('🧪 Testing DID-Based Contract Signing for TDC user...\n');

    // Step 1: Login as TDC user (who has did:web DID)
    console.log('1️⃣ Logging in as TDC user...');
    const tdcLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tdcuser@example.com',
      password: 'c34mfGQOZ1EE'
    });

    const tdcToken = tdcLoginResponse.data.accessToken;
    const tdcUser = tdcLoginResponse.data.user;
    
    console.log(`✅ TDC login successful: ${tdcUser.name} (ID: ${tdcUser.id})`);
    console.log(`   DID: ${tdcUser.did}`);
    console.log(`   Party Type: ${tdcUser.partyType}`);

    // Step 2: Get contracts for TDC user
    console.log('\n2️⃣ Getting contracts for TDC user...');
    const contractsResponse = await axios.get(`${API_BASE}/contracts/user/${tdcUser.id}`, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    const contracts = contractsResponse.data.contracts;
    console.log(`✅ Found ${contracts.length} contracts for TDC user`);
    
    if (contracts.length === 0) {
      console.log('❌ No contracts found for TDC user');
      return;
    }

    // Find a contract that needs TDC signing
    const contractToSign = contracts.find(c => 
      c.status === 'PENDING_TDC_APPROVAL' && !c.tdcSigned
    );

    if (!contractToSign) {
      console.log('❌ No contracts found that need TDC signing');
      return;
    }

    console.log(`📋 Found contract to sign: ${contractToSign.contractId}`);
    console.log(`   Status: ${contractToSign.status}`);
    console.log(`   TDC Signed: ${contractToSign.tdcSigned}`);

    // Step 3: Test DID-based signing
    console.log('\n3️⃣ Testing DID-based signing...');
    const signResponse = await axios.post(`${API_BASE}/contracts/${contractToSign.contractId}/sign`, {
      did: tdcUser.did,
      signature: 'dummy-did-signature',
      method: 'did:web'
    }, {
      headers: { Authorization: `Bearer ${tdcToken}` }
    });

    if (signResponse.data.success) {
      console.log('✅ DID-based signing successful!');
      console.log(signResponse.data);
    } else {
      console.log('❌ DID-based signing failed!');
      console.log(signResponse.data);
    }
  } catch (error) {
    console.error('❌ Error during DID-based signing test:', error.response ? error.response.data : error.message);
  }
}

testDIDSigningTDC(); 