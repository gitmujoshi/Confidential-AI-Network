/**
 * ES256 (ECDSA P-256) Signing Utility
 * 
 * This utility provides functions to sign messages using ES256 (ECDSA with P-256 curve)
 * and validate that signatures are properly computed.
 * 
 * Compatible with did:web documents using JsonWebKey2020 with ES256 algorithm.
 */

// Import a JWK private key for ES256 (P-256)
export async function importPrivateKey(jwk) {
  try {
    console.log('🔑 Importing private JWK for ES256 signing...');
    
    // Validate JWK structure
    if (!jwk.kty || jwk.kty !== 'EC') {
      throw new Error('Invalid JWK: kty must be "EC"');
    }
    if (!jwk.crv || jwk.crv !== 'P-256') {
      throw new Error('Invalid JWK: crv must be "P-256"');
    }
    if (!jwk.d) {
      throw new Error('Invalid JWK: missing private key "d" field');
    }
    if (!jwk.x || !jwk.y) {
      throw new Error('Invalid JWK: missing public key coordinates "x" and "y"');
    }

    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["sign"]
    );

    console.log('✅ Private JWK imported successfully');
    return privateKey;
  } catch (error) {
    console.error('❌ Error importing private JWK:', error);
    throw error;
  }
}

// Sign a message with ES256 and return base64url signature
export async function signES256(message, privateJwk) {
  try {
    console.log('✍️ Signing message with ES256...');
    console.log('📝 Message:', message);
    
    const privateKey = await importPrivateKey(privateJwk);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const signature = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      privateKey,
      data
    );

    // Convert ArrayBuffer to base64url
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const signatureBase64Url = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    console.log('✅ ES256 signature created successfully');
    console.log('🔐 Signature (base64url):', signatureBase64Url);
    
    return signatureBase64Url;
  } catch (error) {
    console.error('❌ Error signing with ES256:', error);
    throw error;
  }
}

// Validate that a signature can be verified with the public key
export async function validateSignature(message, signature, publicJwk) {
  try {
    console.log('🔍 Validating signature...');
    
    // Import public key
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicJwk,
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      false,
      ["verify"]
    );

    // Convert base64url signature back to ArrayBuffer
    const signatureBase64 = signature
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padding = "=".repeat((4 - signatureBase64.length % 4) % 4);
    const signatureBase64Padded = signatureBase64 + padding;
    const signatureArrayBuffer = Uint8Array.from(atob(signatureBase64Padded), c => c.charCodeAt(0));

    // Encode message
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Verify signature
    const isValid = await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      publicKey,
      signatureArrayBuffer,
      data
    );

    if (isValid) {
      console.log('✅ Signature validation successful');
    } else {
      console.log('❌ Signature validation failed');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error validating signature:', error);
    return false;
  }
}

// Create a public JWK from a private JWK (for validation)
export function createPublicJwk(privateJwk) {
  return {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    kid: privateJwk.kid,
    alg: privateJwk.alg
  };
}

// Test function to validate the entire signing process
export async function testSigningProcess(privateJwk, testMessage = "Test message for ES256 signing") {
  try {
    console.log('🧪 Testing ES256 signing process...');
    
    // Step 1: Sign the message
    const signature = await signES256(testMessage, privateJwk);
    
    // Step 2: Create public JWK
    const publicJwk = createPublicJwk(privateJwk);
    
    // Step 3: Validate the signature
    const isValid = await validateSignature(testMessage, signature, publicJwk);
    
    if (isValid) {
      console.log('✅ ES256 signing process test passed');
      return { success: true, signature, publicJwk };
    } else {
      console.log('❌ ES256 signing process test failed');
      return { success: false, error: 'Signature validation failed' };
    }
  } catch (error) {
    console.error('❌ ES256 signing process test failed:', error);
    return { success: false, error: error.message };
  }
} 