/**
 * Get Reset Token for Testing
 * 
 * This script retrieves the latest reset token for a user from the database
 * This is for testing purposes only - in production, users would get this via email
 */

const db = require('./models');

async function getResetToken() {
  try {
    console.log('🔍 Getting reset token for testing...\n');

    const email = 'appadmin@contractmanagement.com';

    // Get the user with the latest reset token
    const user = await db.User.findOne({
      where: { 
        email: email,
        passwordResetToken: { [db.Sequelize.Op.ne]: null }
      },
      attributes: ['id', 'email', 'name', 'passwordResetToken', 'passwordResetExpires'],
      order: [['updatedAt', 'DESC']]
    });

    if (!user || !user.passwordResetToken) {
      console.log('❌ No reset token found for this user.');
      console.log('   Please request a password reset first using the forgot password endpoint.');
      return;
    }

    // Check if token is still valid
    const now = new Date();
    const isExpired = user.passwordResetExpires < now;
    const timeRemaining = Math.max(0, user.passwordResetExpires.getTime() - now.getTime());
    const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));

    console.log('✅ Reset token found!');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Token: ${user.passwordResetToken}`);
    console.log(`   Expires: ${user.passwordResetExpires}`);
    console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
    console.log(`   Time remaining: ${minutesRemaining} minutes`);

    if (!isExpired) {
      console.log('\n🔗 Test URLs:');
      console.log(`   Frontend Reset Page: http://localhost:3000/reset-password?token=${user.passwordResetToken}`);
      console.log(`   Backend Verify: curl http://localhost:5001/api/auth/verify-reset-token/${user.passwordResetToken}`);
      console.log(`   Backend Reset: curl -X POST http://localhost:5001/api/auth/reset-password -H "Content-Type: application/json" -d '{"token":"${user.passwordResetToken}","newPassword":"NewPassword123!"}'`);
      
      console.log('\n📝 Testing Steps:');
      console.log('   1. Open the frontend reset page URL above');
      console.log('   2. Enter a new password (minimum 8 characters)');
      console.log('   3. Submit the form');
      console.log('   4. Try logging in with the new password');
    } else {
      console.log('\n⚠️  Token has expired. Please request a new password reset.');
    }

  } catch (error) {
    console.error('❌ Error getting reset token:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
getResetToken(); 