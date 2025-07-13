const { User } = require('./models');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'Test123!';

async function setTDPPasswords() {
  try {
    console.log('🔐 Setting passwords for TDP users...\n');

    const tdpEmails = [
      'healthcare@example.com',
      'financial@example.com', 
      'retail@example.com',
      'manufacturing@example.com',
      'transport@example.com'
    ];

    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    for (const email of tdpEmails) {
      try {
        const user = await User.findOne({ where: { email, isActive: true } });
        
        if (user) {
          await user.update({ password: hashedPassword });
          console.log(`✅ Set password for: ${user.name} (${email})`);
        } else {
          console.log(`❌ User not found: ${email}`);
        }
      } catch (error) {
        console.log(`❌ Error setting password for ${email}:`, error.message);
      }
    }

    console.log('\n🎉 Password setting completed!');
    console.log(`🔑 Password for all TDP users: ${TEST_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
if (require.main === module) {
  setTDPPasswords().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { setTDPPasswords }; 