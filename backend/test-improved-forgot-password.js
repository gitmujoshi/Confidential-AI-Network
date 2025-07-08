/**
 * Test Script: Improved Forgot Password Flow
 * 
 * This script demonstrates the enhanced forgot password functionality:
 * 1. Request password reset
 * 2. Get the reset token (for development)
 * 3. Show the complete reset link
 * 4. Test password reset
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_EMAIL = 'appadmin@contractmanagement.com';

async function testImprovedForgotPasswordFlow() {
  console.log('🔄 Testing Improved Forgot Password Flow\n');

  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset...');
    const resetRequest = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Password reset request successful');
    console.log(`   Message: ${resetRequest.data.message}`);
    console.log(`   Note: ${resetRequest.data.note}\n`);

    // Step 2: Get reset token (development only)
    console.log('🔑 Step 2: Getting reset token for development...');
    const tokenResponse = await axios.get(`${BASE_URL}/auth/dev/reset-token/${TEST_EMAIL}`);
    
    const { token, minutesRemaining } = tokenResponse.data;
    console.log('✅ Reset token retrieved');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Expires in: ${minutesRemaining} minutes\n`);

    // Step 3: Show complete reset link
    console.log('🔗 Step 3: Complete Reset Link Generated');
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    console.log('   Frontend Reset Link:');
    console.log(`   ${resetLink}\n`);

    // Step 4: Test password reset
    console.log('🔐 Step 4: Testing password reset...');
    const newPassword = 'newpassword123_' + Date.now();
    const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: token,
      newPassword: newPassword
    });
    
    console.log('✅ Password reset successful');
    console.log(`   Message: ${resetResponse.data.message}`);
    console.log(`   Note: ${resetResponse.data.note}\n`);

    // Step 5: Test login with new password
    console.log('🚪 Step 5: Testing login with new password...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: newPassword
    });
    
    console.log('✅ Login with new password successful');
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Party Type: ${loginResponse.data.user.partyType}\n`);

    console.log('🎉 All tests passed! The improved forgot password flow is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ Password reset request works');
    console.log('   ✅ Reset token generation works');
    console.log('   ✅ Complete reset link is available');
    console.log('   ✅ Password reset functionality works');
    console.log('   ✅ Login with new password works');
    console.log('\n💡 In the frontend, users will see the complete reset link directly on the forgot password page!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testImprovedForgotPasswordFlow(); 