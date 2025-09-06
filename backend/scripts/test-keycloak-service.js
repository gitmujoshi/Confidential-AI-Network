#!/usr/bin/env node

/**
 * Test Keycloak Service directly
 * This script tests the Keycloak service to see what's failing
 */

const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');

async function testKeycloakService() {
  try {
    console.log('🔍 Testing Keycloak Service...\n');
    
    const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
    
    // Test 1: Get admin token
    console.log('1️⃣ Testing admin token retrieval...');
    try {
      const adminToken = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getAdminToken();
      console.log('✅ Admin token retrieved successfully');
      console.log('   Token length:', adminToken.length);
    } catch (error) {
      console.log('❌ Failed to get admin token:', error.message);
      return;
    }
    
    // Test 2: Create a test user
    console.log('\n2️⃣ Testing user creation...');
    try {
      const userData = {
        username: 'test@example.com',
        email: 'test@example.com',
        name: 'Test User',
        partyType: 'TDP',
        organization: 'Test Org'
      };
      
      const result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(userData);
      console.log('✅ User created successfully in Keycloak');
      console.log('   Keycloak User ID:', result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
      console.log('   Username:', result.username);
      console.log('   Temporary Password:', result.temporaryPassword);
      
      // Test 3: Try to authenticate the user
      console.log('\n3️⃣ Testing user authentication...');
      try {
        const authResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.authenticateUserWithPassword(
          'test@example.com', 
          result.temporaryPassword
        );
        console.log('✅ User authentication successful');
        console.log('   Access Token:', authResult.access_token ? 'Present' : 'Missing');
      } catch (error) {
        console.log('❌ User authentication failed:', error.message);
      }
      
      // Test 4: Clean up - delete the test user
      console.log('\n4️⃣ Cleaning up test user...');
      try {
        // Note: We'd need to implement deleteUser method in KeycloakService
        console.log('⚠️ Test user cleanup not implemented (would need deleteUser method)');
      } catch (error) {
        console.log('❌ Failed to cleanup test user:', error.message);
      }
      
    } catch (error) {
      console.log('❌ Failed to create user in Keycloak:', error.message);
      console.log('   Error details:', error.response?.data || 'No response data');
    }
    
  } catch (error) {
    console.log('❌ Script execution failed:', error.message);
  }
}

// Run the test
testKeycloakService();
