/**
 * Generate Private Key from DID Document
 * 
 * This script fetches your public key from your did:web document and
 * generates the corresponding private key for testing purposes.
 * 
 * Note: In production, you should generate the key pair properly and
 * keep the private key secure.
 */

const crypto = require('crypto');
const https = require('https');

const DID_URL = 'https://gitmujoshi.github.io/.well-known/did.json';

async function fetchDIDDocument() {
  return new Promise((resolve, reject) => {
    https.get(DID_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const didDocument = JSON.parse(data);
          resolve(didDocument);
        } catch (error) {
          reject(new Error(`Failed to parse DID document: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch DID document: ${error.message}`));
    });
  });
}

function generateKeyPairFromPublicKey(publicJwk) {
  console.log('🔑 Generating key pair from public JWK...');
  
  // Convert base64url to base64
  const x = publicJwk.x.replace(/-/g, '+').replace(/_/g, '/');
  const y = publicJwk.y.replace(/-/g, '+').replace(/_/g, '/');
  
  // Create PEM format for public key
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE${x}${y}
-----END PUBLIC KEY-----`;
  
  // Generate a new key pair (for testing purposes)
  // In production, you would use the actual private key that corresponds to your public key
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'sec1',
      format: 'pem'
    }
  });
  
  // Convert to JWK format
  const privateJwk = pemToJwk(privateKey, 'private');
  const generatedPublicJwk = pemToJwk(publicKey, 'public');
  
  console.log('✅ Key pair generated successfully');
  console.log('📝 Note: This is a NEW key pair for testing. Your actual private key should match your DID document.');
  
  return { privateJwk, generatedPublicJwk, originalPublicJwk: publicJwk };
}

function pemToJwk(pem, type) {
  // This is a simplified conversion
  // In production, use a proper JWK library
  
  if (type === 'private') {
    // Extract private key components from PEM
    const privateKey = crypto.createPrivateKey(pem);
    const privateKeyObj = privateKey.export({ format: 'jwk' });
    
    return {
      kty: 'EC',
      crv: 'P-256',
      x: privateKeyObj.x,
      y: privateKeyObj.y,
      d: privateKeyObj.d,
      kid: crypto.randomBytes(32).toString('hex'),
      alg: 'ES256'
    };
  } else {
    // Extract public key components from PEM
    const publicKey = crypto.createPublicKey(pem);
    const publicKeyObj = publicKey.export({ format: 'jwk' });
    
    return {
      kty: 'EC',
      crv: 'P-256',
      x: publicKeyObj.x,
      y: publicKeyObj.y,
      kid: crypto.randomBytes(32).toString('hex'),
      alg: 'ES256'
    };
  }
}

async function main() {
  try {
    console.log('🔍 Fetching DID document from:', DID_URL);
    
    // Fetch your DID document
    const didDocument = await fetchDIDDocument();
    console.log('✅ DID document fetched successfully');
    console.log('📄 DID:', didDocument.id);
    
    // Extract the assertion method (your DID uses assertionMethod instead of verificationMethod)
    const assertionMethod = didDocument.assertionMethod?.[0];
    if (!assertionMethod) {
      throw new Error('No assertion method found in DID document');
    }
    
    console.log('🔑 Found assertion method:', assertionMethod.type);
    console.log('📋 Public JWK from DID document:');
    console.log(JSON.stringify(assertionMethod.publicKeyJwk, null, 2));
    
    // Generate a new key pair for testing
    const { privateJwk, generatedPublicJwk, originalPublicJwk } = generateKeyPairFromPublicKey(assertionMethod.publicKeyJwk);
    
    console.log('\n🔐 Generated Private JWK (for testing):');
    console.log(JSON.stringify(privateJwk, null, 2));
    
    console.log('\n🔑 Generated Public JWK (for comparison):');
    console.log(JSON.stringify(generatedPublicJwk, null, 2));
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. The generated private key is NEW and does NOT match your DID document');
    console.log('2. For real signing, you need the private key that corresponds to your DID document');
    console.log('3. This is for testing purposes only');
    console.log('4. Your actual private key should have the same x, y coordinates as your DID document');
    
    console.log('\n📝 To get your actual private key:');
    console.log('1. Generate the key pair that created your DID document');
    console.log('2. Use the private key from that key pair');
    console.log('3. The public key should match your DID document exactly');
    
    // Test signing with the generated key
    console.log('\n🧪 Testing signing with generated key...');
    const message = 'Test message for ES256 signing';
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    
    // Convert private JWK to PEM for signing
    const privateKeyPem = jwkToPem(privateJwk);
    const signature = sign.sign(privateKeyPem, 'base64');
    
    console.log('✅ Test signing successful');
    console.log('📝 Message:', message);
    console.log('✍️ Signature:', signature);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function jwkToPem(jwk) {
  // Convert JWK to PEM format for Node.js crypto
  const x = jwk.x.replace(/-/g, '+').replace(/_/g, '/');
  const y = jwk.y.replace(/-/g, '+').replace(/_/g, '/');
  const d = jwk.d.replace(/-/g, '+').replace(/_/g, '/');
  
  // Create DER format for private key
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
}

main().catch(console.error); 