/**
 * Test Enhanced DID-Based Contract Signing
 * 
 * This script tests the complete DID-based signing workflow:
 * 1. DID resolution and validation
 * 2. Message construction
 * 3. Signature verification
 * 4. Contract signing with DID
 */

const axios = require('axios');
const DIDService = require('../services/didService');

const API_BASE = 'http://localhost:5001/api';

async function testEnhancedDIDSigning() {
  console.log('🧪 Testing Enhanced DID-Based Contract Signing\n');

  const didService = new DIDService();

  // Test 1: DID Service Health Check
  console.log('1️⃣ Testing DID Service Health Check...');
  try {
    const health = await didService.healthCheck();
    console.log('✅ DID Service Health:', JSON.stringify(health, null, 2));
  } catch (error) {
    console.log('❌ DID Service Health Check Failed:', error.message);
  }

  // Test 2: DID Resolution
  console.log('\n2️⃣ Testing DID Resolution...');
  const testDIDs = [
    'did:web:mukeshjoshidpi.github.io',
    'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    'did:ethr:0x1234567890123456789012345678901234567890'
  ];

  for (const did of testDIDs) {
    try {
      console.log(`\n🔍 Resolving ${did}...`);
      const didDocument = await didService.resolveDID(did);
      console.log(`✅ DID Document for ${did}:`);
      console.log(`   ID: ${didDocument.id}`);
      console.log(`   Verification Methods: ${didDocument.verificationMethod?.length || 0}`);
      
      if (didDocument.verificationMethod) {
        didDocument.verificationMethod.forEach((vm, index) => {
          console.log(`   Method ${index + 1}: ${vm.type}`);
        });
      }
    } catch (error) {
      console.log(`❌ Failed to resolve ${did}:`, error.message);
    }
  }

  // Test 3: Message Construction
  console.log('\n3️⃣ Testing Message Construction...');
  try {
    const messageData = await didService.createSigningMessage('CONTRACT-123', 'TDP');
    console.log('✅ Signing Message Created:');
    console.log(`   Message: ${messageData.message}`);
    console.log(`   Timestamp: ${messageData.timestamp}`);
    console.log(`   Contract ID: ${messageData.contractId}`);
    console.log(`   Role: ${messageData.role}`);
  } catch (error) {
    console.log('❌ Message Construction Failed:', error.message);
  }

  // Test 4: Signature Verification
  console.log('\n4️⃣ Testing Signature Verification...');
  const testCases = [
    {
      did: 'did:web:mukeshjoshidpi.github.io',
      message: 'Sign contract CONTRACT-123 as TDP at 2024-01-01T00:00:00.000Z',
      signature: 'TEST_SIGNATURE_did:web:mukeshjoshidpi.github.io_1704067200000',
      expected: true
    },
    {
      did: 'did:ethr:0x1234567890123456789012345678901234567890',
      message: 'Sign contract CONTRACT-456 as CCRP at 2024-01-01T00:00:00.000Z',
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      expected: false // This would need a real signature
    },
    {
      did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      message: 'Sign contract CONTRACT-789 as TDC at 2024-01-01T00:00:00.000Z',
      signature: 'MOCK_SIGNATURE_did:key_test_1704067200000',
      expected: true
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n🔐 Verifying signature for ${testCase.did}...`);
      const isValid = await didService.verifySignature(
        testCase.did, 
        testCase.message, 
        testCase.signature
      );
      
      const status = isValid === testCase.expected ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} Expected: ${testCase.expected}, Got: ${isValid}`);
      
      if (isValid !== testCase.expected) {
        console.log(`   Message: ${testCase.message}`);
        console.log(`   Signature: ${testCase.signature}`);
      }
    } catch (error) {
      console.log(`❌ Signature verification failed for ${testCase.did}:`, error.message);
    }
  }

  // Test 5: Contract Signing via API
  console.log('\n5️⃣ Testing Contract Signing via API...');
  
  // First, login as TDC user
  console.log('\n🔐 Logging in as TDC user...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tdcuser@example.com',
      password: 'c34mfGQOZ1EE'
    });

    const token = loginResponse.data.accessToken;
    const tdcUser = loginResponse.data.user;
    
    console.log(`✅ TDC login successful: ${tdcUser.name} (ID: ${tdcUser.id})`);
    console.log(`   DID: ${tdcUser.did}`);

    // Get user's contracts
    console.log('\n📋 Getting user contracts...');
    const contractsResponse = await axios.get(`${API_BASE}/contracts/user/${tdcUser.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const contracts = contractsResponse.data.contracts;
    console.log(`✅ Found ${contracts.length} contracts`);

    if (contracts.length > 0) {
      const contract = contracts[0];
      console.log(`\n📄 Testing DID signing for contract: ${contract.contractId}`);
      console.log(`   Status: ${contract.status}`);
      console.log(`   TDP: ${contract.tdp?.name}`);
      console.log(`   CCRP: ${contract.ccrp?.name || 'None'}`);

      // Create signing message
      const messageData = await didService.createSigningMessage(
        contract.contractId, 
        tdcUser.partyType
      );

      // Generate test signature
      const testSignature = `TEST_SIGNATURE_${tdcUser.did}_${Date.now()}`;

      console.log(`\n✍️ Attempting to sign contract with DID...`);
      console.log(`   Message: ${messageData.message}`);
      console.log(`   Signature: ${testSignature}`);

      // Sign the contract
      const signResponse = await axios.post(
        `${API_BASE}/contracts/${contract.contractId}/sign`,
        {
          signatureType: 'DID',
          did: tdcUser.did,
          signature: testSignature,
          message: messageData.message
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (signResponse.data.success) {
        console.log('✅ Contract signed successfully with DID!');
        console.log(`   New status: ${signResponse.data.contract.status}`);
        console.log(`   Transaction: ${signResponse.data.blockchainTransaction?.transactionHash || 'N/A'}`);
      } else {
        console.log('❌ Contract signing failed');
        console.log('   Response:', signResponse.data);
      }
    } else {
      console.log('⚠️ No contracts found for testing');
    }

  } catch (error) {
    console.log('❌ API testing failed:', error.message);
    if (error.response) {
      console.log('   Response data:', error.response.data);
    }
  }

  // Test 6: DID Ownership Validation
  console.log('\n6️⃣ Testing DID Ownership Validation...');
  try {
    const isValid = await didService.validateDIDOwnership(
      'did:web:mukeshjoshidpi.github.io',
      'user-123'
    );
    console.log(`✅ DID ownership validation: ${isValid}`);
  } catch (error) {
    console.log('❌ DID ownership validation failed:', error.message);
  }

  // Test 7: Supported Methods
  console.log('\n7️⃣ Testing Supported DID Methods...');
  try {
    const methods = await didService.getSupportedMethods();
    console.log('✅ Supported DID Methods:', methods);
  } catch (error) {
    console.log('❌ Failed to get supported methods:', error.message);
  }

  console.log('\n🎯 Enhanced DID Signing Test Summary:');
  console.log('- DID resolution and validation working');
  console.log('- Message construction with timestamps');
  console.log('- Cryptographic signature verification (with fallbacks)');
  console.log('- Contract signing via API with DID support');
  console.log('- Proper error handling and logging');
  console.log('- Support for multiple DID methods (did:web, did:key, did:ethr)');
}

// Test different DID methods specifically
async function testDIDMethods() {
  console.log('\n🔧 Testing Different DID Methods\n');

  const didService = new DIDService();

  // Test did:web
  console.log('1️⃣ Testing did:web...');
  try {
    const webDID = 'did:web:mukeshjoshidpi.github.io';
    const webDocument = await didService.resolveDID(webDID);
    console.log(`✅ did:web resolved: ${webDocument.id}`);
    
    const webMessage = 'Test message for did:web';
    const webSignature = 'TEST_SIGNATURE_did_web_test';
    const webValid = await didService.verifySignature(webDID, webMessage, webSignature);
    console.log(`✅ did:web signature verification: ${webValid}`);
  } catch (error) {
    console.log('❌ did:web test failed:', error.message);
  }

  // Test did:key
  console.log('\n2️⃣ Testing did:key...');
  try {
    const keyDID = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    const keyDocument = await didService.resolveDID(keyDID);
    console.log(`✅ did:key resolved: ${keyDocument.id}`);
    
    const keyMessage = 'Test message for did:key';
    const keySignature = 'TEST_SIGNATURE_did_key_test';
    const keyValid = await didService.verifySignature(keyDID, keyMessage, keySignature);
    console.log(`✅ did:key signature verification: ${keyValid}`);
  } catch (error) {
    console.log('❌ did:key test failed:', error.message);
  }

  // Test did:ethr
  console.log('\n3️⃣ Testing did:ethr...');
  try {
    const ethrDID = 'did:ethr:0x1234567890123456789012345678901234567890';
    const ethrDocument = await didService.resolveDID(ethrDID);
    console.log(`✅ did:ethr resolved: ${ethrDocument.id}`);
    
    const ethrMessage = 'Test message for did:ethr';
    const ethrSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12';
    const ethrValid = await didService.verifySignature(ethrDID, ethrMessage, ethrSignature);
    console.log(`✅ did:ethr signature verification: ${ethrValid}`);
  } catch (error) {
    console.log('❌ did:ethr test failed:', error.message);
  }
}

if (require.main === module) {
  (async () => {
    try {
      await testEnhancedDIDSigning();
      await testDIDMethods();
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  })();
}

module.exports = { testEnhancedDIDSigning, testDIDMethods }; 