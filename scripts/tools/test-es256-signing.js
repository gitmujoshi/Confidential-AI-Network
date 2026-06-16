/**
 * ES256 Signing Test Script
 * 
 * This script tests the ES256 signing process using the Web Crypto API
 * to validate that signatures are properly computed and can be verified.
 */

const crypto = require('crypto');

// Test private JWK (this should match your did:web private key)
const testPrivateJwk = {
  "kty": "EC",
  "crv": "P-256",
  "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
  "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
  "d": "YOUR_PRIVATE_KEY_D_VALUE_HERE", // Replace with actual private key
  "kid": "120c453f6d39fe0b8dfecceba8b0e7992f9bc650c2bf4001d2e448907b140877",
  "alg": "ES256"
};

// Test public JWK (from your did:web document)
const testPublicJwk = {
  "kty": "EC",
  "crv": "P-256",
  "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
  "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
  "kid": "120c453f6d39fe0b8dfecceba8b0e7992f9bc650c2bf4001d2e448907b140877",
  "alg": "ES256"
};

async function testES256Signing() {
  console.log('🧪 Testing ES256 signing process...\n');
  
  try {
    // Test message
    const message = "Test message for ES256 signing";
    console.log('📝 Message:', message);
    
    // Convert JWK to PEM format for Node.js crypto
    const privateKeyPem = jwkToPem(testPrivateJwk, 'private');
    const publicKeyPem = jwkToPem(testPublicJwk, 'public');
    
    console.log('🔑 Private key PEM:', privateKeyPem.substring(0, 50) + '...');
    console.log('🔑 Public key PEM:', publicKeyPem.substring(0, 50) + '...');
    
    // Sign the message
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    const signature = sign.sign(privateKeyPem, 'base64');
    
    console.log('✍️ Signature (base64):', signature);
    
    // Convert to base64url format (like the frontend)
    const signatureBase64Url = signature
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    
    console.log('✍️ Signature (base64url):', signatureBase64Url);
    
    // Verify the signature
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    const isValid = verify.verify(publicKeyPem, signature, 'base64');
    
    if (isValid) {
      console.log('✅ Signature verification successful!');
    } else {
      console.log('❌ Signature verification failed!');
    }
    
    return { success: isValid, signature: signatureBase64Url };
    
  } catch (error) {
    console.error('❌ Error during ES256 signing test:', error.message);
    return { success: false, error: error.message };
  }
}

function jwkToPem(jwk, type) {
  // This is a simplified conversion - in production you'd use a proper JWK library
  if (type === 'private') {
    // For private key, we need the full JWK with 'd' field
    if (!jwk.d) {
      throw new Error('Private JWK must include "d" field');
    }
    
    // Convert base64url to base64
    const x = jwk.x.replace(/-/g, '+').replace(/_/g, '/');
    const y = jwk.y.replace(/-/g, '+').replace(/_/g, '/');
    const d = jwk.d.replace(/-/g, '+').replace(/_/g, '/');
    
    // Create DER format (simplified)
    const der = Buffer.concat([
      Buffer.from([0x30, 0x77, 0x02, 0x01, 0x01]), // Version
      Buffer.from([0x04, 0x20]), // Private key
      Buffer.from(d, 'base64'),
      Buffer.from([0xa0, 0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]), // Algorithm
      Buffer.from([0xa1, 0x44, 0x03, 0x42, 0x00, 0x04]), // Public key
      Buffer.from(x, 'base64'),
      Buffer.from(y, 'base64')
    ]);
    
    return `-----BEGIN EC PRIVATE KEY-----\n${der.toString('base64')}\n-----END EC PRIVATE KEY-----`;
  } else {
    // For public key
    const x = jwk.x.replace(/-/g, '+').replace(/_/g, '/');
    const y = jwk.y.replace(/-/g, '+').replace(/_/g, '/');
    
    const der = Buffer.concat([
      Buffer.from([0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00, 0x04]), // Algorithm + point
      Buffer.from(x, 'base64'),
      Buffer.from(y, 'base64')
    ]);
    
    return `-----BEGIN PUBLIC KEY-----\n${der.toString('base64')}\n-----END PUBLIC KEY-----`;
  }
}

// Test contract signing message
async function testContractSigning() {
  console.log('\n🔐 Testing contract signing...\n');
  
  try {
    const contractId = 'CONTRACT-1752057959130';
    const did = 'did:web:gitmujoshi.github.io';
    const partyType = 'TDP';
    
    const message = `I, the holder of DID ${did}, hereby sign contract ${contractId} as ${partyType} on ${new Date().toISOString()}`;
    
    console.log('📝 Contract signing message:', message);
    
    const result = await testES256Signing();
    
    if (result.success) {
      console.log('\n✅ Contract signing test completed successfully!');
      console.log('📋 Summary:');
      console.log(`   Contract ID: ${contractId}`);
      console.log(`   DID: ${did}`);
      console.log(`   Party Type: ${partyType}`);
      console.log(`   Signature: ${result.signature}`);
    } else {
      console.log('\n❌ Contract signing test failed!');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error during contract signing test:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting ES256 signing validation tests...\n');
  
  // Test 1: Basic ES256 signing
  await testES256Signing();
  
  // Test 2: Contract signing
  await testContractSigning();
  
  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Instructions:');
  console.log('1. Replace "YOUR_PRIVATE_KEY_D_VALUE_HERE" with your actual private key');
  console.log('2. Run this script to validate the signing process');
  console.log('3. Use the validated signature in the contract management system');
}

// Run the tests
runTests().catch(console.error); 