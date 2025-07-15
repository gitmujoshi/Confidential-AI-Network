require('dotenv').config({ path: './config.env' });
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function debugTokenDetailed() {
  try {
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5NHF3Zkw0UXg4aXdwcldKMHI1VzdjcEdXS2lMNVBGU21HeTNrMjVBSEFnIn0.eyJleHAiOjE3NTI0MTU4ODcsImlhdCI6MTc1MjQxNTU4NywianRpIjoiODdjMzliZDUtMzRmYy00NzE5LThjMDQtMDhiODE4ZmNmZDQ3IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9jb250cmFjdC1tYW5hZ2VtZW50Iiwic3ViIjoiMWRlMzgxMjEtYzUwZC00MmRhLTkwMzEtY2UxYjE2OTkwMTIwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWRtaW4tY2xpIiwic2Vzc2lvbl9zdGF0ZSI6IjhlNmU4NmYyLTM3MzItNDYxNy1hZjhhLWJhZDVkZWMzOTAxOSIsImFjciI6IjEiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiOGU2ZTg2ZjItMzczMi00NjE3LWFmOGEtYmFkNWRlYzM5MDE5IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiVUkgVERDIFVzZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1aXRkY0BleGFtcGxlLmNvbSIsImdpdmVuX25hbWUiOiJVSSIsImZhbWlseV9uYW1lIjoiVERDIFVzZXIiLCJlbWFpbCI6InVpdGRjQGV4YW1wbGUuY29tIn0.CAeKq4vS3QjZPdBO-5JUHGRrfCpewgEKUc5xDZ2LHdMu63AhPawUzjZ-G5zXO396qMwuK3LwrcC8A_e27ifMQfhxO51HBPaLFvwXdhSJCPeE4Sh9FXuCABYHUaBi2VS2wlL7wZGscDLYm5MPZXMVcQgGw8CXrvWWdodsbtl_HOnx-Bch78l9xofm5xNiY8uZoOMy2jvjLPbdTM6qvVt2igPRSWC_ZMxbLKMg7xpj9xfbv5BB3eRaqismdZFfGtXGEfA_FXUEcR0_jg-wq8Z1Hk9ClqtJX3solM1reqLF11U39-tfzA99BupJWyCiU0aDbQxtHCMqtMA8FZ71p0BuQ';
    
    console.log('=== Detailed Token Debug ===');
    
    // Decode token
    const decoded = jwt.decode(token);
    console.log('\n1. Token Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    console.log('\n2. Token Header:');
    const header = jwt.decode(token, { complete: true }).header;
    console.log(JSON.stringify(header, null, 2));
    
    console.log('\n3. Getting public keys from Keycloak...');
    
    // Try both Keycloak URLs
    const ***REMOVED-KEYCLOAK_DB_PASSWORD***Urls = [
      'http://localhost:8080',
      'http://localhost:3000'
    ];
    
    for (const baseURL of ***REMOVED-KEYCLOAK_DB_PASSWORD***Urls) {
      try {
        console.log(`\nTrying ${baseURL}...`);
        const certsResponse = await axios.get(`${baseURL}/realms/contract-management/protocol/openid-connect/certs`);
        console.log(`✅ Found keys at ${baseURL}`);
        console.log('Keys:', JSON.stringify(certsResponse.data.keys, null, 2));
        
        // Try to verify with each key
        for (const key of certsResponse.data.keys) {
          console.log(`\nTrying key with kid: ${key.kid}`);
          
          try {
            const publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
            
            // Try different issuers
            const issuers = [
              `${baseURL}/realms/contract-management`,
              'http://localhost:3000/realms/contract-management'
            ];
            
            for (const issuer of issuers) {
              try {
                console.log(`  Trying issuer: ${issuer}`);
                const verified = jwt.verify(token, publicKey, {
                  algorithms: ['RS256'],
                  audience: ['contract-management-backend', 'admin-cli', 'account'],
                  issuer: issuer
                });
                
                console.log(`✅ SUCCESS! Token verified with issuer: ${issuer}`);
                console.log('Verified payload:', JSON.stringify(verified, null, 2));
                return;
                
              } catch (issuerError) {
                console.log(`  ❌ Failed with issuer ${issuer}: ${issuerError.message}`);
              }
            }
          } catch (keyError) {
            console.log(`  ❌ Failed with key ${key.kid}: ${keyError.message}`);
          }
        }
        
      } catch (urlError) {
        console.log(`❌ Failed to get keys from ${baseURL}: ${urlError.message}`);
      }
    }
    
    console.log('\n❌ All verification attempts failed');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugTokenDetailed(); 