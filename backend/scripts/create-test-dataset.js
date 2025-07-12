const db = require('../models');

async function createTestDataset() {
  try {
    console.log('🔧 Creating test dataset...');
    
    // Find the existing TDP user
    const tdpUser = await db.User.findOne({
      where: { email: 'tdp@test.com', partyType: 'TDP' }
    });

    if (!tdpUser) {
      console.error('❌ TDP user not found');
      return;
    }

    console.log('✅ Found TDP user:', tdpUser.id);

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
      ownerId: tdpUser.id
    });

    console.log('✅ Test dataset created successfully:');
    console.log('   ID:', testDataset.id);
    console.log('   Dataset ID:', testDataset.datasetId);
    console.log('   Name:', testDataset.name);
    console.log('   Owner ID:', testDataset.ownerId);

    console.log('\n🎉 Test dataset created successfully!');

  } catch (error) {
    console.error('❌ Error creating test dataset:', error);
  } finally {
    await db.sequelize.close();
  }
}

createTestDataset(); 