#!/usr/bin/env node

/**
 * Debug Keycloak Authentication Script
 * 
 * This script tests Keycloak authentication step by step to identify issues.
 */

const axios = require('axios');
const https = require('https');

const CONFIG = {
  keycloakUrl: '${KEYCLOAK_URL:-https://localhost:8443}',
  keycloakRealm: 'contract-management',
  clientId: 'contract-management-client',
  clientSecret: '',
  username: 'tdp.medical@example.com',
  password: 'password123'
};

// Configure axios to handle HTTPS with self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testDirectKeycloakAuth() {
  console.log('🔐 Testing Direct Keycloak Authentication...');
  console.log('===========================================');
  console.log(`URL: ${CONFIG.keycloakUrl}/realms/${CONFIG.keycloakRealm}/protocol/openid-connect/token`);
  console.log(`Client ID: ${CONFIG.clientId}`);
  console.log(`Username: ${CONFIG.username}`);
  console.log(`Password: ${CONFIG.password}`);
  console.log(`Client Secret: ${CONFIG.clientSecret || 'NONE'}`);
  console.log('');
  
  try {
    // URL encode the password to handle special characters
    const encodedPassword = encodeURIComponent(CONFIG.password);
    const encodedUsername = encodeURIComponent(CONFIG.username);
    
    // Build the request body exactly like the backend does
    let requestBody = `grant_type=password&client_id=${CONFIG.clientId}&username=${encodedUsername}&password=${encodedPassword}`;
    
    // Add client secret only if it's configured
    if (CONFIG.clientSecret) {
      requestBody += `&client_secret=${CONFIG.clientSecret}`;
    }
    
    console.log('📤 Request Body:', requestBody);
    console.log('');
    
    const response = await axios.post(
      `${CONFIG.keycloakUrl}/realms/${CONFIG.keycloakRealm}/protocol/openid-connect/token`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent: httpsAgent
      }
    );
    
    console.log('✅ Authentication Successful!');
    console.log('📊 Response Status:', response.status);
    console.log('🔑 Access Token:', response.data.access_token ? 'PRESENT' : 'MISSING');
    console.log('🔄 Refresh Token:', response.data.refresh_token ? 'PRESENT' : 'MISSING');
    console.log('⏰ Expires In:', response.data.expires_in);
    console.log('📝 Token Type:', response.data.token_type);
    
    return true;
  } catch (error) {
    console.log('❌ Authentication Failed!');
    console.log('📊 Error Status:', error.response?.status);
    console.log('📝 Error Message:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('🔍 Error Details:');
      console.log('  - Error:', error.response.data.error);
      console.log('  - Description:', error.response.data.error_description);
      console.log('  - Code:', error.response.data.error_code);
    }
    
    return false;
  }
}

async function testBackendLogin() {
  console.log('\n🌐 Testing Backend Login API...');
  console.log('================================');
  console.log(`URL: ${BACKEND_URL:-http://localhost:5001}/api/auth/login`);
  console.log(`Username: ${CONFIG.username}`);
  console.log(`Password: ${CONFIG.password}`);
  console.log('');
  
  try {
    const response = await axios.post(
      '${BACKEND_URL:-http://localhost:5001}/api/auth/login',
      {
        email: CONFIG.username,
        password: CONFIG.password
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('✅ Backend Login Successful!');
    console.log('📊 Response Status:', response.status);
    console.log('🔑 Access Token:', response.data.accessToken ? 'PRESENT' : 'MISSING');
    console.log('📝 Message:', response.data.message);
    
    return true;
  } catch (error) {
    console.log('❌ Backend Login Failed!');
    console.log('📊 Error Status:', error.response?.status);
    console.log('📝 Error Message:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.log('🔍 Error Details:');
      console.log('  - Error:', error.response.data.error);
      console.log('  - Code:', error.response.data.code);
      console.log('  - Details:', error.response.data.details);
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Keycloak Authentication Debug...\n');
  
  try {
    // Test 1: Direct Keycloak authentication
    const keycloakSuccess = await testDirectKeycloakAuth();
    
    // Test 2: Backend login API
    const backendSuccess = await testBackendLogin();
    
    console.log('\n📊 Debug Summary:');
    console.log('==================');
    console.log(`🔐 Direct Keycloak Auth: ${keycloakSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`🌐 Backend Login API: ${backendSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (keycloakSuccess && !backendSuccess) {
      console.log('\n💡 Analysis: Keycloak works directly but backend fails');
      console.log('   This suggests an issue in the backend KeycloakService or configuration');
    } else if (!keycloakSuccess) {
      console.log('\n💡 Analysis: Keycloak authentication fails directly');
      console.log('   This suggests a Keycloak client configuration issue');
    } else if (keycloakSuccess && backendSuccess) {
      console.log('\n🎉 Everything is working!');
    }
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { debugKeycloakAuth: main };
