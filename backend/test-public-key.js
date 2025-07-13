const forge = require('node-forge');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testPublicKeyExtraction() {
  try {
    console.log('🔍 Testing public key extraction...');
    
    // Get the certificate from Keycloak
    const response = await axios.get('http://localhost:8080/realms/contract-management/protocol/openid-connect/certs');
    const keys = response.data.keys;
    
    console.log('✅ Got keys from Keycloak:', keys.length);
    
    // Test the first key
    const key = keys[0];
    console.log('🔑 Testing key with kid:', key.kid);
    
    // Extract public key from certificate
    const certPem = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
    console.log('📜 Certificate PEM length:', certPem.length);
    
    const cert = forge.pki.certificateFromPem(certPem);
    const publicKey = forge.pki.publicKeyToPem(cert.publicKey);
    
    console.log('🔑 Extracted public key length:', publicKey.length);
    console.log('🔑 Public key starts with:', publicKey.substring(0, 50));
    
    // Test with a sample token
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5NHF3Zkw0UXg4aXdwcldKMHI1VzdjcEdXS2lMNVBGU21HeTNrMjVBSEFnIn0.eyJleHAiOjE3NTI0MTY5OTMsImlhdCI6MTc1MjQxNjY5MywianRpIjoiOTZlYTI5ZWEtNmMwYi00ODRlLWE0OTYtYWZlMmU5MTE0NzMxIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9jb250cmFjdC1tYW5hZ2VtZW50Iiwic3ViIjoiMWRlMzgxMjEtYzUwZC00MmRhLTkwMzEtY2UxYjE2OTkwMTIwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWRtaW4tY2xpIiwic2Vzc2lvbl9zdGF0ZSI6ImU4MGU5YWQ3LTE0NGQtNDhlZC04MGMyLTNhZmUzMTFlNjgyOCIsImFjciI6IjEiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiZTgwZTlhZDctMTQ0ZC00OGVkLTgwYzItM2FmZTMxMWU2ODI4IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiVUkgVERDIFVzZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1aXRkY0BleGFtcGxlLmNvbSIsImdpdmVuX25hbWUiOiJVSSIsImZhbWlseV9uYW1lIjoiVERDIFVzZXIiLCJlbWFpbCI6InVpdGRjQGV4YW1wbGUuY29tIn0.X1cX49hBJ3nEo9rKYPeLjOLhalPKMP_ABGSnIyL8aTmOL7KUltQLQkAqMLPZUcBXEWFlcc_lyfxdl8pd4VY-SkAGLfEdOSjtWRIBNzv9DI9OK2tLFyoZqBdZmPHfWTn5lrAhEMfC6R6i281y6idd5ZUTaL1IcDkWs_aZ7gHv0-35psgHRUI9daHp_MR_UN_BeIuPYjJ-yW3iRDCXMYhL6RpZuefC0zbVX58-1ID5wSKM2BjMV4F95nmtz4P5nQjdNlDCs1-Tuatu5yyUTShx4yqq3O9rI9phIFbb9G6iBXq9YcMZbiwiePHRBTuBE8xoyUu6e3je9oUENqYFIdvi-Q';
    
    try {
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        audience: ['contract-management-backend', 'admin-cli', 'account'],
        issuer: 'http://localhost:8080/realms/contract-management'
      });
      
      console.log('✅ Token verification successful!');
      console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
      
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.message);
      
      // Try without issuer and audience validation
      try {
        const decoded = jwt.verify(token, publicKey, {
          algorithms: ['RS256']
        });
        console.log('✅ Token verification successful (without issuer/audience)!');
        console.log('📋 Decoded payload:', JSON.stringify(decoded, null, 2));
      } catch (simpleVerifyError) {
        console.log('❌ Simple verification also failed:', simpleVerifyError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPublicKeyExtraction(); 