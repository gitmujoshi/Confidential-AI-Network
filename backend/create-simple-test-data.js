const { User, Dataset, Contract } = require('./models');
const bcrypt = require('bcryptjs');

function uniqueEmail(prefix) {
  const ts = Date.now();
  return `${prefix}-${ts}@example.com`;
}

function uniqueDatasetId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function createSimpleTestData() {
  try {
    console.log('🚀 Creating simple test data...');

    // 1. Create a simple TDP user
    console.log('1️⃣ Creating TDP user...');
    const tdpEmail = uniqueEmail('test-tdp');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const tdpUser = await User.create({
      name: 'Test TDP User',
      email: tdpEmail,
      password: hashedPassword,
      partyType: 'TDP',
      isRegistered: true,
      emailVerified: true
    });
    console.log('✅ TDP user created:', tdpUser.email);

    // 2. Create a simple TDC user
    console.log('2️⃣ Creating TDC user...');
    const tdcEmail = uniqueEmail('test-tdc');
    const tdcUser = await User.create({
      name: 'Test TDC User',
      email: tdcEmail,
      password: hashedPassword,
      partyType: 'TDC',
      isRegistered: true,
      emailVerified: true
    });
    console.log('✅ TDC user created:', tdcUser.email);

    // 3. Create some datasets
    console.log('3️⃣ Creating datasets...');
    const datasets = await Dataset.bulkCreate([
      {
        datasetId: uniqueDatasetId('ds-medical'),
        name: 'Medical Imaging Dataset',
        description: 'Anonymized medical imaging data for computer vision training',
        category: 'Computer Vision',
        price: 5000,
        size: 1024,
        recordCount: 100000,
        license: 'Commercial',
        ownerId: tdpUser.id,
        metadata: {
          dataType: 'image',
          privacyLevel: 'high',
          compliance: ['HIPAA', 'GDPR']
        }
      },
      {
        datasetId: uniqueDatasetId('ds-fintext'),
        name: 'Financial Text Analysis Dataset',
        description: 'Financial reports and documents for NLP training',
        category: 'Natural Language Processing',
        price: 3000,
        size: 512,
        recordCount: 50000,
        license: 'Commercial',
        ownerId: tdpUser.id,
        metadata: {
          dataType: 'text',
          privacyLevel: 'medium',
          compliance: ['PCI-DSS', 'GDPR']
        }
      },
      {
        datasetId: uniqueDatasetId('ds-customer'),
        name: 'Customer Behavior Dataset',
        description: 'Customer interaction data for predictive analytics',
        category: 'Tabular',
        price: 2000,
        size: 256,
        recordCount: 25000,
        license: 'Commercial',
        ownerId: tdpUser.id,
        metadata: {
          dataType: 'structured',
          privacyLevel: 'medium',
          compliance: ['GDPR']
        }
      }
    ]);
    console.log('✅ Created', datasets.length, 'datasets');

    // 4. Create a simple contract
    console.log('4️⃣ Creating contract...');
    const contract = await Contract.create({
      contractId: 'CONTRACT-' + Date.now(),
      name: 'Test AI Training Contract',
      description: 'A test contract for AI model training',
      status: 'SIGNED',
      price: 5000,
      duration: 30,
      tdpId: tdpUser.id,
      tdcId: tdcUser.id,
      primaryDatasetId: datasets[0].id,
      primaryTdpId: tdpUser.id,
      datasetId: datasets[0].id,
      termsAndConditions: 'Standard test terms and conditions apply.',
      trainingParams: {
        maxPrivacyLoss: 0.1,
        minAccuracy: 0.85,
        maxTrainingRuns: 5
      },
      environmentSpecs: {
        computeType: 'confidential-vm',
        memoryGB: 32,
        cpuCores: 8
      },
      contractDatasets: [{
        datasetId: datasets[0].datasetId,
        tdpId: tdpUser.id,
        datasetName: datasets[0].name,
        tdpName: tdpUser.name,
        individualPrice: 5000,
        paymentStatus: 'PENDING'
      }],
      datasetCount: 1,
      tdpCount: 1,
      totalPrice: 5000
    });
    console.log('✅ Contract created:', contract.contractId);

    console.log('\n🎉 Simple test data creation completed!');
    console.log('\n📋 Test Data Summary:');
    console.log('✅ TDP User:', tdpUser.email);
    console.log('✅ TDC User:', tdcUser.email);
    console.log('✅ Datasets:', datasets.length);
    console.log('✅ Contract:', contract.contractId);
    console.log('\n🔑 Login Credentials:');
    console.log('TDP User:', tdpUser.email, '(password: password123)');
    console.log('TDC User:', tdcUser.email, '(password: password123)');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createSimpleTestData(); 