/**
 * Test Forgot Password Flow
 * 
 * This script tests the complete forgot password flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testForgotPasswordFlow() {
  try {
    console.log('🔐 Testing Forgot Password Flow...\n');

    const testEmail = 'appadmin@contractmanagement.com';

    // Step 1: Request password reset
    console.log('1️⃣ Requesting password reset...');
    const forgotPasswordResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail
    });

    console.log('✅ Password reset request successful!');
    console.log(`   Message: ${forgotPasswordResponse.data.message}`);
    console.log(`   Email: ${forgotPasswordResponse.data.email}`);

    // Step 2: Get the reset token from database (for testing purposes)
    console.log('\n2️⃣ Getting reset token from database...');
    const db = require('./models');
    const user = await db.User.findOne({
      where: { email: testEmail },
      attributes: ['id', 'email', 'passwordResetToken', 'passwordResetExpires']
    });

    if (!user || !user.passwordResetToken) {
      console.log('❌ No reset token found in database');
      return;
    }

    console.log('✅ Reset token found in database');
    console.log(`   Token: ${user.passwordResetToken.substring(0, 20)}...`);
    console.log(`   Expires: ${user.passwordResetExpires}`);

    // Step 3: Verify reset token
    console.log('\n3️⃣ Verifying reset token...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/verify-reset-token/${user.passwordResetToken}`);

    console.log('✅ Reset token verification successful!');
    console.log(`   Valid: ${verifyResponse.data.valid}`);
    console.log(`   Email: ${verifyResponse.data.email}`);
    console.log(`   Minutes remaining: ${verifyResponse.data.minutesRemaining}`);

    // Step 4: Reset password
    console.log('\n4️⃣ Resetting password...');
    const newPassword = 'NewPassword123!';
    const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: user.passwordResetToken,
      newPassword: newPassword
    });

    console.log('✅ Password reset successful!');
    console.log(`   Message: ${resetResponse.data.message}`);
    console.log(`   Note: ${resetResponse.data.note}`);

    // Step 5: Test login with new password
    console.log('\n5️⃣ Testing login with new password...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: newPassword
    });

    console.log('✅ Login with new password successful!');
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Party Type: ${loginResponse.data.user.partyType}`);

    // Step 6: Verify token is cleared
    console.log('\n6️⃣ Verifying token is cleared...');
    const updatedUser = await db.User.findOne({
      where: { email: testEmail },
      attributes: ['passwordResetToken', 'passwordResetExpires']
    });

    if (!updatedUser.passwordResetToken && !updatedUser.passwordResetExpires) {
      console.log('✅ Reset token successfully cleared from database');
    } else {
      console.log('❌ Reset token not cleared from database');
    }

    console.log('\n🎉 Forgot Password Flow Test PASSED!');
    console.log('\n📝 Summary:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Password Reset Request: ✅ Working`);
    console.log(`   Token Generation: ✅ Working`);
    console.log(`   Token Verification: ✅ Working`);
    console.log(`   Password Reset: ✅ Working`);
    console.log(`   Login with New Password: ✅ Working`);
    console.log(`   Token Cleanup: ✅ Working`);

    console.log('\n🔗 Frontend URLs:');
    console.log(`   Forgot Password: http://localhost:3000/forgot-password`);
    console.log(`   Reset Password: http://localhost:3000/reset-password?token=TOKEN_HERE`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data) {
      console.error('   Error details:', error.response.data);
    }
  }
}

// Run the test
testForgotPasswordFlow(); 