require('dotenv').config({ path: './config.env' });
const KeycloakService = require('./services/keycloakService');

async function debugToken() {
  try {
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5NHF3Zkw0UXg4aXdwcldKMHI1VzdjcEdXS2lMNVBGU21HeTNrMjVBSEFnIn0.eyJleHAiOjE3NTI0MTQ1NDQsImlhdCI6MTc1MjQxNDI0NCwianRpIjoiNjYzYWZmMDktYTU5Yy00MGYyLTg0MjgtNDIzMWNiY2I3YmE4IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwL3JlYWxtcy9jb250cmFjdC1tYW5hZ2VtZW50Iiwic3ViIjoiMWRlMzgxMjEtYzUwZC00MmRhLTkwMzEtY2UxYjE2OTkwMTIwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWRtaW4tY2xpIiwic2Vzc2lvbl9zdGF0ZSI6IjQ5MzcyMTY0LTRiMGUtNGY2OC1iNTgwLWQ1NmZiMWE5Y2QzMSIsImFjciI6IjEiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwic2lkIjoiNDkzNzIxNjQtNGIwZS00ZjY4LWI1ODAtZDU2ZmIxYTljZDMxIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiVUkgVERDIFVzZXIiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ1aXRkY0BleGFtcGxlLmNvbSIsImdpdmVuX25hbWUiOiJVSSIsImZhbWlseV9uYW1lIjoiVERDIFVzZXIiLCJlbWFpbCI6InVpdGRjQGV4YW1wbGUuY29tIn0.AH_THau2QbBI9asnGr0CP3uqxFJYSTKLkS0K4J3-TDPsx4tp_h3EWgtyMAxO7p1WU6Cr5r9m_AEVk0azOecnfXCgNxUJB9tYxolWLJNm3nupu564RzK-lC0_MPclyWUn_pvRdaCuAdcqwehEirfvui8E__iv1_lO0HbuuyFylMTorOOmbaj9M4EEYUvG64k6O_rEcclszuU8wQkpbMvKtL8VZAcLjH2rKeFsIAlinEzLOKiuZjVQXayLngoC3wr8nF5SyP4aNWe21EIwyVBNVtzBTSbgsdFESeUKDWNLWFmDH0F9yFxqDZ2b4sNKcjgbpyUARZj_lBQR7avreO_wnQ';
    
    console.log('Testing token validation...');
    console.log('Environment variables:');
    console.log('- KEYCLOAK_URL:', process.env.KEYCLOAK_URL);
    console.log('- KEYCLOAK_REALM:', process.env.KEYCLOAK_REALM);
    console.log('- KEYCLOAK_CLIENT_ID:', process.env.KEYCLOAK_CLIENT_ID);
    
    const keycloakService = new KeycloakService();
    console.log('KeycloakService config:', keycloakService.config);
    
    // Decode token to see its structure
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    console.log('\nToken payload:', JSON.stringify(decoded, null, 2));
    
    console.log('\nTesting validation...');
    const result = await keycloakService.validateToken(token);
    console.log('Validation result:', result);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

debugToken(); 