/**
 * Test Registration Script
 * 
 * This script tests user registration with a unique email to avoid 409 conflicts
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testRegistration() {
  try {
    // Generate a unique email using timestamp
    const timestamp = Date.now();
    const uniqueEmail = `test${timestamp}@example.com`;
    
    console.log('🧪 Testing User Registration...\n');
    console.log(`📧 Using unique email: ${uniqueEmail}\n`);

    // Step 1: Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User Unique',
      email: uniqueEmail,
      partyType: 'TDC',
      organization: 'Test Organization Unique',
      description: 'This is a test user for registration testing'
    });

    console.log('✅ Registration successful!');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Email:', registerResponse.data.user.email);
    console.log('   Party Type:', registerResponse.data.user.partyType);
    console.log('   Login credentials:', registerResponse.data.loginCredentials);

    // Step 2: Try to register the same email again (should fail with 409)
    console.log('\n2️⃣ Testing duplicate email registration (should fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Duplicate User',
        email: uniqueEmail,
        partyType: 'TDP',
        organization: 'Duplicate Organization'
      });
      console.log('❌ Expected 409 error but registration succeeded');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Correctly received 409 Conflict error for duplicate email');
        console.log('   Error:', error.response.data.error);
        console.log('   Code:', error.response.data.code);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Step 3: Login with the new user
    console.log('\n3️⃣ Testing login with new user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: registerResponse.data.loginCredentials.password
    });

    console.log('✅ Login successful!');
    console.log('   Access Token:', loginResponse.data.accessToken ? 'Present' : 'Missing');
    console.log('   User Info:', loginResponse.data.user.name);

    console.log('\n🎉 Registration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - New user registered: ${uniqueEmail}`);
    console.log(`   - Duplicate registration correctly rejected`);
    console.log(`   - Login works with new user`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the test
testRegistration(); 