const db = require('../models');

const sampleUsers = [
  // Training Data Providers (TDP)
  {
    walletAddress: '0x1234567890123456789012345678901234567890',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'TDP',
    name: 'DataCorp Inc.',
    email: 'contact@datacorp.com',
    description: 'Leading provider of high-quality training datasets for AI models',
    organization: 'DataCorp Inc.',
    phoneNumber: '+1-555-1001',
    website: 'https://datacorp.com',
    location: 'San Francisco, CA',
    did: 'did:web:datacorp.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  },
  {
    walletAddress: '0x2345678901234567890123456789012345678901',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'TDP',
    name: 'AI Data Solutions',
    email: 'info@aidasolutions.com',
    description: 'Specialized in computer vision and NLP datasets',
    organization: 'AI Data Solutions',
    phoneNumber: '+1-555-1002',
    website: 'https://aidasolutions.com',
    location: 'New York, NY',
    did: 'did:web:aidasolutions.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  },
  {
    walletAddress: '0x3456789012345678901234567890123456789012',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'TDP',
    name: 'Global Data Hub',
    email: 'hello@globaldatahub.com',
    description: 'Comprehensive datasets for various AI applications',
    organization: 'Global Data Hub',
    phoneNumber: '+1-555-1003',
    website: 'https://globaldatahub.com',
    location: 'Austin, TX',
    did: 'did:web:globaldatahub.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  },

  // Training Data Consumers (TDC)
  {
    walletAddress: '0x6789012345678901234567890123456789012345',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'TDC',
    name: 'TechAI Labs',
    email: 'research@techailabs.com',
    description: 'Research organization developing cutting-edge AI models',
    organization: 'TechAI Labs',
    phoneNumber: '+1-555-2001',
    website: 'https://techailabs.com',
    location: 'Boston, MA',
    did: 'did:web:techailabs.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  },
  {
    walletAddress: '0x7890123456789012345678901234567890123456',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'TDC',
    name: 'Innovation Corp',
    email: 'ai@innovationcorp.com',
    description: 'Enterprise AI solutions provider',
    organization: 'Innovation Corp',
    phoneNumber: '+1-555-2002',
    website: 'https://innovationcorp.com',
    location: 'Seattle, WA',
    did: 'did:web:innovationcorp.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  },

  // Confidential Clean Room Providers (CCRP)
  {
    walletAddress: '0xb012345678901234567890123456789012345678',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'CCRP',
    name: 'SecureCompute Inc.',
    email: 'security@securecompute.com',
    description: 'Enterprise-grade secure computing environments',
    organization: 'SecureCompute Inc.',
    phoneNumber: '+1-555-3001',
    website: 'https://securecompute.com',
    location: 'Washington, DC',
    did: 'did:web:securecompute.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  },
  {
    walletAddress: '0xc012345678901234567890123456789012345678',
    publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    partyType: 'CCRP',
    name: 'PrivacyFirst Labs',
    email: 'contact@privacyfirst.com',
    description: 'Privacy-focused clean room solutions',
    organization: 'PrivacyFirst Labs',
    phoneNumber: '+1-555-3002',
    website: 'https://privacyfirst.com',
    location: 'Portland, OR',
    did: 'did:web:privacyfirst.com:admin',
    didSource: 'SYSTEM_GENERATED',
    didVerified: true,
    didVerificationMethod: 'SYSTEM_GENERATED',
    isRegistered: true,
    registrationDate: new Date(),
    isActive: true,
    onboardingStatus: 'COMPLETED',
    profileCompleted: true,
    emailVerified: true
  }
];

const sampleDatasets = [
  {
    datasetId: 'CV-001',
    name: 'ImageNet-Enhanced',
    description: 'Enhanced version of ImageNet with additional annotations and metadata',
    category: 'Computer Vision',
    size: 150000, // 150GB
    recordCount: 1500000,
    price: 5000.00,
    license: 'Commercial License',
    tags: ['computer-vision', 'image-classification', 'deep-learning'],
    metadata: {
      resolution: '224x224',
      format: 'JPEG',
      classes: 1000
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'NLP-001',
    name: 'MultiLanguage Corpus',
    description: 'Large-scale multilingual text corpus for NLP training',
    category: 'Natural Language Processing',
    size: 50000, // 50GB
    recordCount: 10000000,
    price: 3000.00,
    license: 'Research License',
    tags: ['nlp', 'multilingual', 'text-processing'],
    metadata: {
      languages: ['English', 'Spanish', 'French', 'German', 'Chinese'],
      avgLength: 150
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'AUDIO-001',
    name: 'Speech Recognition Dataset',
    description: 'High-quality speech data for ASR model training',
    category: 'Audio',
    size: 25000, // 25GB
    recordCount: 500000,
    price: 2000.00,
    license: 'Commercial License',
    tags: ['audio', 'speech-recognition', 'asr'],
    metadata: {
      sampleRate: '16kHz',
      duration: '5-30 seconds',
      accents: ['American', 'British', 'Australian']
    },
    isPublic: true,
    isActive: true
  }
];

async function createSampleData() {
  try {
    console.log('Creating sample data while preserving admin users...');

    // Get existing admin users
    const existingAdmins = await db.User.findAll({
      where: { partyType: 'AppAdmin' }
    });

    console.log(`Found ${existingAdmins.length} existing admin users`);

    // Create sample users
    console.log('Creating sample users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await db.User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email} (${user.partyType})`);
    }

    // Get TDP users for dataset ownership
    const tdpUsers = await db.User.findAll({
      where: { partyType: 'TDP' },
      order: [['id', 'ASC']]
    });

    // Create datasets with proper ownership
    console.log('Creating datasets...');
    const createdDatasets = [];
    for (let i = 0; i < sampleDatasets.length; i++) {
      const datasetData = {
        ...sampleDatasets[i],
        ownerId: tdpUsers[i % tdpUsers.length].id // Distribute datasets among TDP users
      };
      const dataset = await db.Dataset.create(datasetData);
      createdDatasets.push(dataset);
      console.log(`✅ Created dataset: ${dataset.name} (owned by ${tdpUsers[i % tdpUsers.length].name})`);
    }

    console.log(`\n🎉 Successfully created sample data!`);
    console.log(`Created ${createdUsers.length} sample users`);
    console.log(`Created ${createdDatasets.length} datasets`);

    // Display summary
    console.log('\n=== Database Summary ===');
    const userCounts = await db.User.findAll({
      attributes: ['partyType', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['partyType']
    });
    userCounts.forEach(count => {
      console.log(`  ${count.partyType}: ${count.dataValues.count}`);
    });

    const datasetCounts = await db.Dataset.findAll({
      attributes: ['category', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['category']
    });
    console.log('\nDatasets by category:');
    datasetCounts.forEach(count => {
      console.log(`  ${count.category}: ${count.dataValues.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData(); 