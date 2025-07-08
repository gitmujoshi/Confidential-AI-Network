/**
 * Test Email Verification Functionality
 * 
 * This script tests the email verification functionality with fallback support
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testEmailVerification() {
  try {
    console.log('🧪 Testing Email Verification Functionality...\n');

    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User 2',
      email: 'test2@example.com',
      partyType: 'TDP',
      organization: 'Test Organization'
    });

    console.log('✅ User registered successfully');
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Email:', registerResponse.data.user.email);
    console.log('   Login credentials:', registerResponse.data.loginCredentials);

    // Step 2: Login to get authentication token
    console.log('\n2️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test2@example.com',
      password: registerResponse.data.loginCredentials.password
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');

    // Step 3: Send email verification
    console.log('\n3️⃣ Sending email verification...');
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-email`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Email verification sent');
    console.log('   Method:', verifyResponse.data.method);
    console.log('   Message:', verifyResponse.data.message);

    // Step 4: Get user profile to check verification status
    console.log('\n4️⃣ Checking user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile retrieved');
    console.log('   Email verified:', profileResponse.data.user.emailVerified);
    console.log('   Onboarding status:', profileResponse.data.user.onboardingStatus);

    console.log('\n🎉 Email verification test completed successfully!');
    console.log('\n📧 Note: Since EMAIL_ENABLED=false in config.env, emails are logged instead of sent.');
    console.log('   Check the backend logs to see the email content.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the test
testEmailVerification(); 