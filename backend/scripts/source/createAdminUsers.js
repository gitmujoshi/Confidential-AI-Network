const db = require('../models');

const adminUsers = [
  {
    walletAddress: null, // Admin users don't need wallet addresses
    publicKey: null,
    partyType: 'AppAdmin',
    name: 'System Administrator',
    email: 'admin@contractmanagement.com',
    description: 'System administrator with full access to all features',
    organization: 'Contract Management System',
    phoneNumber: '+1-555-0001',
    website: 'https://contractmanagement.com',
    location: 'System Headquarters',
    did: 'did:web:contractmanagement.com:admin:system',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true,
    iamUserId: null, // Will be created in Keycloak
    iamUsername: 'admin@contractmanagement.com'
  },
  {
    walletAddress: null,
    publicKey: null,
    partyType: 'AppAdmin',
    name: 'Platform Manager',
    email: 'manager@contractmanagement.com',
    description: 'Platform manager with administrative privileges',
    organization: 'Contract Management System',
    phoneNumber: '+1-555-0002',
    website: 'https://contractmanagement.com',
    location: 'Platform Operations',
    did: 'did:web:contractmanagement.com:admin:manager',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true,
    iamUserId: null,
    iamUsername: 'manager@contractmanagement.com'
  }
];

async function createAdminUsers() {
  try {
    console.log('Creating admin users...');

    // Check if admin users already exist
    const existingAdmins = await db.User.findAll({
      where: { partyType: 'AppAdmin' }
    });

    if (existingAdmins.length > 0) {
      console.log(`Found ${existingAdmins.length} existing admin users:`);
      existingAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.name})`);
      });
      console.log('Admin users already exist. Skipping creation.');
      return;
    }

    // Create admin users
    const createdAdmins = [];
    for (const adminData of adminUsers) {
      const admin = await db.User.create(adminData);
      createdAdmins.push(admin);
      console.log(`✅ Created admin user: ${admin.email} (${admin.name})`);
    }

    console.log(`\n🎉 Successfully created ${createdAdmins.length} admin users!`);
    console.log('\nAdmin credentials:');
    console.log('Email: admin@contractmanagement.com');
    console.log('Email: manager@contractmanagement.com');
    console.log('\nNote: You will need to set passwords for these users in Keycloak or use the registration flow.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    process.exit(1);
  }
}

createAdminUsers(); 