const db = require('../models');

async function createTestUser() {
  try {
    console.log('🔧 Creating test TDC user...');
    
    // Create a test TDC user
    const testUser = await db.User.create({
      walletAddress: '0x' + 'a'.repeat(40),
      publicKey: '0x' + 'b'.repeat(64),
      partyType: 'TDC',
      name: 'Test TDC User',
      email: 'tdc@test.com',
      description: 'Test TDC user for Ricardian contract testing',
      organization: 'Test Corp',
      phoneNumber: '+1-555-0001',
      website: 'https://testcorp.com',
      location: 'Test City, TC',
      did: 'did:web:testcorp.com:user:tdc',
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

    console.log('✅ Test TDC user created successfully:');
    console.log('   ID:', testUser.id);
    console.log('   Name:', testUser.name);
    console.log('   Email:', testUser.email);
    console.log('   Party Type:', testUser.partyType);
    console.log('   DID:', testUser.did);

    // Create a test TDP user
    const testTDPUser = await db.User.create({
      walletAddress: '0x' + 'c'.repeat(40),
      publicKey: '0x' + 'd'.repeat(64),
      partyType: 'TDP',
      name: 'Test TDP User',
      email: 'tdp@test.com',
      description: 'Test TDP user for Ricardian contract testing',
      organization: 'Test Data Corp',
      phoneNumber: '+1-555-0002',
      website: 'https://testdatacorp.com',
      location: 'Data City, DC',
      did: 'did:web:testdatacorp.com:user:tdp',
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

    console.log('✅ Test TDP user created successfully:');
    console.log('   ID:', testTDPUser.id);
    console.log('   Name:', testTDPUser.name);
    console.log('   Email:', testTDPUser.email);
    console.log('   Party Type:', testTDPUser.partyType);
    console.log('   DID:', testTDPUser.did);

    // Create a test dataset
    const testDataset = await db.Dataset.create({
      datasetId: 'TEST-DS-001',
      name: 'Test Dataset',
      description: 'Test dataset for Ricardian contract testing',
      category: 'Computer Vision',
      size: 1000, // 1GB
      recordCount: 10000,
      price: 100.00,
      license: 'Test License',
      tags: ['test', 'ricardian', 'contract'],
      metadata: {
        format: 'JSON',
        version: '1.0'
      },
      isPublic: true,
      isActive: true,
      ownerId: testTDPUser.id
    });

    console.log('✅ Test dataset created successfully:');
    console.log('   ID:', testDataset.id);
    console.log('   Dataset ID:', testDataset.datasetId);
    console.log('   Name:', testDataset.name);
    console.log('   Owner ID:', testDataset.ownerId);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   TDC User: tdc@test.com (any password)');
    console.log('   TDP User: tdp@test.com (any password)');
    console.log('   Dataset: TEST-DS-001');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await db.sequelize.close();
  }
}

createTestUser(); 