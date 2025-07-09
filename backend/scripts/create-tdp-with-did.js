/**
 * Create TDP User with DID
 * 
 * This script creates a TDP user with the correct DID for testing
 * the enterprise signing service.
 */

const { User } = require('../models');

async function createTDPWithDID() {
  try {
    console.log('🔧 Creating TDP user with DID...');

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: 'tdp@example.com' }
    });

    if (existingUser) {
      console.log('✅ TDP user already exists, updating DID...');
      await existingUser.update({
        did: 'did:web:gitmujoshi.github.io',
        didVerified: true,
        didSource: 'USER_PROVIDED',
        didVerificationMethod: 'JsonWebKey2020'
      });
      console.log('✅ TDP user updated with DID');
      return existingUser;
    }

    // Create new TDP user with DID
    const tdpUser = await User.create({
      name: 'Training Data Provider',
      email: 'tdp@example.com',
      password: 'password123',
      partyType: 'TDP',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      publicKey: '0x1234567890abcdef',
      description: 'Provider of training datasets',
      isRegistered: true,
      registrationDate: new Date(),
      did: 'did:web:gitmujoshi.github.io',
      didVerified: true,
      didSource: 'USER_PROVIDED',
      didVerificationMethod: 'JsonWebKey2020',
      isActive: true
    });

    console.log('✅ TDP user created successfully with DID');
    console.log('📋 User details:', {
      id: tdpUser.id,
      name: tdpUser.name,
      email: tdpUser.email,
      did: tdpUser.did,
      partyType: tdpUser.partyType
    });

    return tdpUser;

  } catch (error) {
    console.error('❌ Error creating TDP user:', error.message);
    throw error;
  }
}

// Run the script
createTDPWithDID()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }); 