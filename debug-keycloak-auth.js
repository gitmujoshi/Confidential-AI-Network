#!/usr/bin/env node

/**
 * Debug Script: Keycloak Authentication Issue
 * 
 * This script helps diagnose why temporary passwords fail to authenticate
 * in the /api/auth/first-login-password endpoint.
 */

const { getTestConfig } = require('./scripts/load-config');
const axios = require('axios');

async function debugKeycloakAuth() {
  console.log('🔍 DEBUGGING KEYCLOAK AUTHENTICATION ISSUE');
  console.log('============================================\n');

  const config = getTestConfig();
  
  // Step 1: Create a test user and capture the details
  console.log('📝 Step 1: Creating test user...');
  
  const testUser = {
    email: `debug-auth-${Date.now()}@example.com`,
    name: 'Debug Auth User',
    partyType: 'TDC'
  };

  try {
    const registrationResponse = await axios.post(`${config.backend}/api/auth/register`, testUser);
    
    console.log('✅ Registration successful!');
    console.log('📋 Registration Response:');
    console.log(`   Email: ${registrationResponse.data.user.email}`);
    console.log(`   IAM Username: ${registrationResponse.data.user.iamUsername}`);
    console.log(`   IAM User ID: ${registrationResponse.data.user.iamUserId}`);
    console.log(`   Temporary Password: ${registrationResponse.data.loginCredentials.password}`);
    console.log(`   First Login: ${registrationResponse.data.user.firstLogin}`);
    
    const user = registrationResponse.data.user;
    const tempPassword = registrationResponse.data.loginCredentials.password;
    
    // Step 2: Test first login detection
    console.log('\n🔍 Step 2: Testing first login detection...');
    
    const firstLoginResponse = await axios.post(`${config.backend}/api/auth/login`, {
      email: user.email,
      password: tempPassword
    });
    
    console.log('✅ First login detection successful!');
    console.log('📋 First Login Response:');
    console.log(`   Requires Password Change: ${firstLoginResponse.data.requiresPasswordChange}`);
    console.log(`   Is First Login: ${firstLoginResponse.data.isFirstLogin}`);
    
    // Step 3: Test the problematic endpoint directly
    console.log('\n🔍 Step 3: Testing first-login-password endpoint...');
    
    try {
      const passwordChangeResponse = await axios.post(`${config.backend}/api/auth/first-login-password`, {
        email: user.email,
        currentPassword: tempPassword,
        newPassword: 'NewDebugPassword123!'
      });
      
      console.log('✅ Password change successful!');
      console.log('📋 Password Change Response:', passwordChangeResponse.data);
      
    } catch (error) {
      console.log('❌ Password change failed!');
      console.log('📋 Error Details:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.error}`);
      console.log(`   Code: ${error.response?.data?.code}`);
      
      // Step 4: Let's test direct Keycloak authentication
      console.log('\n🔍 Step 4: Testing direct Keycloak authentication...');
      
      try {
        // Try to authenticate directly with Keycloak using the same method
        const ***REMOVED-KEYCLOAK_DB_PASSWORD***Url = process.env.KEYCLOAK_URL || config.***REMOVED-KEYCLOAK_DB_PASSWORD***;
        const realm = process.env.KEYCLOAK_REALM || 'contract-management';
        const clientId = process.env.KEYCLOAK_CLIENT_ID || 'contract-management-client';
        const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
        
        // URL encode the password to handle special characters
        const encodedPassword = encodeURIComponent(tempPassword);
        const encodedUsername = encodeURIComponent(user.iamUsername);
        
        // Build the request body
        let requestBody = `grant_type=password&client_id=${clientId}&username=${encodedUsername}&password=${encodedPassword}`;
        
        // Add client secret only if it's configured
        if (clientSecret) {
          requestBody += `&client_secret=${clientSecret}`;
        }
        
        console.log('🔗 Keycloak Auth Attempt:');
        console.log(`   URL: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Url}/realms/${realm}/protocol/openid-connect/token`);
        console.log(`   Username: ${user.iamUsername}`);
        console.log(`   Password: ${tempPassword}`);
        console.log(`   Client ID: ${clientId}`);
        console.log(`   Has Client Secret: ${!!clientSecret}`);
        
        const directKeycloakResponse = await axios.post(
          `${***REMOVED-KEYCLOAK_DB_PASSWORD***Url}/realms/${realm}/protocol/openid-connect/token`,
          requestBody,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 
              new (require('https')).Agent({ rejectUnauthorized: false }) : undefined
          }
        );
        
        console.log('✅ Direct Keycloak authentication successful!');
        console.log('📋 Keycloak Response:');
        console.log(`   Access Token: ${directKeycloakResponse.data.access_token ? 'Present' : 'Missing'}`);
        console.log(`   Token Type: ${directKeycloakResponse.data.token_type}`);
        
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.log('❌ Direct Keycloak authentication failed!');
        console.log('📋 Keycloak Error Details:');
        console.log(`   Status: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Error.response?.status}`);
        console.log(`   Error: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Error.response?.data?.error}`);
        console.log(`   Description: ${***REMOVED-KEYCLOAK_DB_PASSWORD***Error.response?.data?.error_description}`);
        
        // Step 5: Check if user exists in Keycloak with admin token
        console.log('\n🔍 Step 5: Checking user existence in Keycloak...');
        
        try {
          // Get admin token first
          const adminTokenResponse = await axios.post(
            `${***REMOVED-KEYCLOAK_DB_PASSWORD***Url}/realms/master/protocol/openid-connect/token`,
            `grant_type=password&client_id=admin-cli&username=${process.env.KEYCLOAK_ADMIN_USER || 'admin'}&password=${process.env.KEYCLOAK_ADMIN_PASSWORD || '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***'}`,
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              httpsAgent: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 
                new (require('https')).Agent({ rejectUnauthorized: false }) : undefined
            }
          );
          
          const adminToken = adminTokenResponse.data.access_token;
          
          // Check if user exists
          const userCheckResponse = await axios.get(
            `${***REMOVED-KEYCLOAK_DB_PASSWORD***Url}/admin/realms/${realm}/users/${user.iamUserId}`,
            {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
              },
              httpsAgent: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ? 
                new (require('https')).Agent({ rejectUnauthorized: false }) : undefined
            }
          );
          
          console.log('✅ User found in Keycloak!');
          console.log('📋 Keycloak User Details:');
          console.log(`   ID: ${userCheckResponse.data.id}`);
          console.log(`   Username: ${userCheckResponse.data.username}`);
          console.log(`   Email: ${userCheckResponse.data.email}`);
          console.log(`   Enabled: ${userCheckResponse.data.enabled}`);
          console.log(`   Email Verified: ${userCheckResponse.data.emailVerified}`);
          console.log(`   Required Actions: ${JSON.stringify(userCheckResponse.data.requiredActions || [])}`);
          
        } catch (adminError) {
          console.log('❌ Failed to check user in Keycloak with admin token');
          console.log(`   Error: ${adminError.response?.data || adminError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Registration or initial testing failed!');
    console.log(`   Error: ${error.response?.data || error.message}`);
  }
}

// Run the debug script
if (require.main === module) {
  debugKeycloakAuth()
    .then(() => {
      console.log('\n🏁 Debug script completed');
    })
    .catch(error => {
      console.error('\n💥 Debug script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { debugKeycloakAuth };
