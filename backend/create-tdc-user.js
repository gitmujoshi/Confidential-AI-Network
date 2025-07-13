require('dotenv').config({ path: './config.env' });
const db = require('./models');
const KeycloakService = require('./services/keycloakService');

async function createTDCUser() {
  try {
    console.log('Creating TDC user...');
    
    // Create user in database
    const userData = {
      name: 'Test TDC User',
      email: 'testtdc@example.com',
      partyType: 'TDC',
      organization: 'Test TDC Organization',
      description: 'A test TDC user for contract creation',
      walletAddress: '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0'),
      publicKey: 'test-public-key-tdc',
      isRegistered: true,
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
      onboardingStatus: 'COMPLETED'
    };

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email: userData.email } });
    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      return existingUser;
    }

    // Create user in database
    const user = await db.User.create(userData);
    console.log('✅ User created in database:', user.id);

    // Create user in Keycloak
    const keycloakService = new KeycloakService();
    const keycloakResult = await keycloakService.createUser({
      email: userData.email,
      name: userData.name,
      walletAddress: userData.walletAddress,
      partyType: userData.partyType,
      publicKey: userData.publicKey,
      organization: userData.organization,
      phoneNumber: '',
      website: '',
      location: ''
    });

    // Update user with Keycloak ID
    await user.update({
      iamUserId: keycloakResult.keycloakUserId,
      iamUsername: userData.email
    });

    console.log('✅ User created in Keycloak:', keycloakResult.keycloakUserId);
    console.log('✅ TDC user created successfully!');
    console.log('Email:', userData.email);
    console.log('Password: TdcPass123!');
    
    return user;
  } catch (error) {
    console.error('❌ Error creating TDC user:', error);
    throw error;
  }
}

createTDCUser().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
}); 