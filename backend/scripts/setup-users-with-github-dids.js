/**
 * Setup Users with GitHub Pages DIDs
 * 
 * This script creates TDC and TDP users with their actual did:web DIDs
 * hosted on GitHub Pages.
 */

const db = require('../models');

async function setupUsersWithGitHubDIDs() {
  try {
    console.log('🔧 Setting up users with GitHub Pages DIDs...\n');

    // TDC User with GitHub Pages DID
    const tdcUser = await db.User.create({
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      partyType: 'TDC',
      name: 'Training Data Consumer',
      email: 'tdcuser@example.com',
      password: 'c34mfGQOZ1EE',
      description: 'AI research organization developing machine learning models',
      organization: 'TechAI Labs',
      phoneNumber: '+1-555-2001',
      website: 'https://techailabs.com',
      location: 'Boston, MA',
      did: 'did:web:mukeshjoshidpi.io:tdcuser',
      didSource: 'USER_PROVIDED',
      didVerified: true,
      didVerificationMethod: 'GITHUB_PAGES',
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      emailVerified: true
    });

    console.log(`✅ Created TDC user: ${tdcUser.name}`);
    console.log(`   Email: ${tdcUser.email}`);
    console.log(`   DID: ${tdcUser.did}`);
    console.log(`   Party Type: ${tdcUser.partyType}`);

    // TDP User with GitHub Pages DID
    const tdpUser = await db.User.create({
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      partyType: 'TDP',
      name: 'Training Data Provider',
      email: 'tdpuser@example.com',
      password: 'c34mfGQOZ1EE',
      description: 'Comprehensive datasets for various AI applications',
      organization: 'Global Data Hub',
      phoneNumber: '+1-555-1003',
      website: 'https://globaldatahub.com',
      location: 'Austin, TX',
      did: 'did:web:mukeshjoshidpi.io:tdpuser',
      didSource: 'USER_PROVIDED',
      didVerified: true,
      didVerificationMethod: 'GITHUB_PAGES',
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      emailVerified: true
    });

    console.log(`\n✅ Created TDP user: ${tdpUser.name}`);
    console.log(`   Email: ${tdpUser.email}`);
    console.log(`   DID: ${tdpUser.did}`);
    console.log(`   Party Type: ${tdpUser.partyType}`);

    // AppAdmin User
    const appAdminUser = await db.User.create({
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      partyType: 'APPADMIN',
      name: 'System Administrator',
      email: 'admin@contractmanagement.com',
      password: 'Admin123!',
      description: 'System administrator with full access',
      organization: 'Contract Management System',
      phoneNumber: '+1-555-0000',
      website: 'https://contractmanagement.com',
      location: 'System',
      did: 'did:web:contractmanagement.com:admin',
      didSource: 'SYSTEM_GENERATED',
      didVerified: true,
      didVerificationMethod: 'SYSTEM_GENERATED',
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true,
      onboardingStatus: 'COMPLETED',
      profileCompleted: true,
      emailVerified: true
    });

    console.log(`\n✅ Created AppAdmin user: ${appAdminUser.name}`);
    console.log(`   Email: ${appAdminUser.email}`);
    console.log(`   DID: ${appAdminUser.did}`);
    console.log(`   Party Type: ${appAdminUser.partyType}`);

    console.log('\n🎉 All users created successfully with GitHub Pages DIDs!');
    console.log('\n📋 Summary:');
    console.log(`   TDC User: ${tdcUser.email} - ${tdcUser.did}`);
    console.log(`   TDP User: ${tdpUser.email} - ${tdpUser.did}`);
    console.log(`   AppAdmin: ${appAdminUser.email} - ${appAdminUser.did}`);

    console.log('\n🔗 GitHub Pages DIDs:');
    console.log(`   TDC DID Document: https://mukeshjoshidpi.io/.well-known/did.json`);
    console.log(`   TDP DID Document: https://mukeshjoshidpi.io/.well-known/did.json`);

  } catch (error) {
    console.error('❌ Error setting up users:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
setupUsersWithGitHubDIDs(); 