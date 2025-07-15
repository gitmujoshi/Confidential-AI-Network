/**
 * Set Test User Passwords
 * 
 * This script sets passwords for all test users in the database.
 */

const db = require('../models');
const bcrypt = require('bcryptjs');

async function setTestUserPasswords() {
  try {
    console.log('🔐 Setting test user passwords...\n');

    const testUsers = [
      'tdp.medical@example.com',
      'tdp.nlp@example.com',
      'tdp.autodrive@example.com',
      'tdc.healthcare@example.com',
      'tdc.fintech@example.com',
      'tdc.language@example.com',
      'ccrp.securecloud@example.com',
      'ccrp.trustedai@example.com',
      'ccrp.privacyfirst@example.com'
    ];

    const password = 'password123';

    for (const email of testUsers) {
      console.log(`Setting password for: ${email}`);
      
      const user = await db.User.findOne({
        where: { email: email }
      });

      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user with password
      await user.update({
        password: hashedPassword
      });

      console.log(`✅ Password set for: ${email}`);
    }

    console.log('\n🎉 Test user passwords set successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('All test users use password: password123');
    console.log('\nAvailable users:');
    testUsers.forEach(email => {
      console.log(`   - ${email}`);
    });

  } catch (error) {
    console.error('❌ Error setting test user passwords:', error);
  }
}

setTestUserPasswords()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 