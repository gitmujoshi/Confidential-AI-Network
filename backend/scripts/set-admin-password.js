/**
 * Set Admin Password
 * 
 * This script sets a password for admin users in the database.
 */

const db = require('../models');
const bcrypt = require('bcryptjs');

async function setAdminPassword() {
  try {
    console.log('🔐 Setting admin passwords...\n');

    const adminEmails = [
      'admin@contractmanagement.com',
      'manager@contractmanagement.com'
    ];

    const password = 'Admin123!';

    for (const email of adminEmails) {
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

    console.log('\n🎉 Admin passwords set successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('Email: admin@contractmanagement.com');
    console.log('Password: Admin123!');
    console.log('\nEmail: manager@contractmanagement.com');
    console.log('Password: Admin123!');

  } catch (error) {
    console.error('❌ Error setting admin passwords:', error);
  }
}

setAdminPassword()
  .then(() => {
    console.log('\n🏁 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 