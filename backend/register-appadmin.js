/**
 * Register AppAdmin User Script
 * 
 * This script registers the AppAdmin user in the local database
 * so it can be used for login via the API.
 */

const { User } = require('./models');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'appadmin@example.com';
const ADMIN_PASSWORD = 'AppAdmin123!';
const ADMIN_NAME = 'Application Admin';

async function registerAppAdmin() {
  try {
    const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log(`AppAdmin user already exists: ${ADMIN_EMAIL}`);
      return;
    }
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      partyType: 'AppAdmin',
      isActive: true,
      description: 'Superuser for application management and testing.'
    });
    console.log(`✅ AppAdmin user created: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('❌ Error creating AppAdmin:', error.message);
  }
}

if (require.main === module) {
  registerAppAdmin().then(() => process.exit(0));
}

module.exports = { registerAppAdmin }; 