const db = require('../models');

const sampleUsers = [
  // Training Data Providers (TDP)
  {
    walletAddress: '0x1234567890123456789012345678901234567890',
    partyType: 'TDP',
    name: 'DataCorp Inc.',
    email: 'contact@datacorp.com',
    description: 'Leading provider of high-quality training datasets for AI models'
  },
  {
    walletAddress: '0x2345678901234567890123456789012345678901',
    partyType: 'TDP',
    name: 'AI Data Solutions',
    email: 'info@aidasolutions.com',
    description: 'Specialized in computer vision and NLP datasets'
  },
  {
    walletAddress: '0x3456789012345678901234567890123456789012',
    partyType: 'TDP',
    name: 'Global Data Hub',
    email: 'hello@globaldatahub.com',
    description: 'Comprehensive datasets for various AI applications'
  },
  {
    walletAddress: '0x4567890123456789012345678901234567890123',
    partyType: 'TDP',
    name: 'VisionTech Data',
    email: 'data@visiontech.com',
    description: 'Specialized in computer vision and autonomous driving datasets'
  },
  {
    walletAddress: '0x5678901234567890123456789012345678901234',
    partyType: 'TDP',
    name: 'Healthcare Data Pro',
    email: 'info@healthcaredata.com',
    description: 'Medical imaging and healthcare datasets for AI applications'
  },

  // Training Data Consumers (TDC)
  {
    walletAddress: '0x6789012345678901234567890123456789012345',
    partyType: 'TDC',
    name: 'TechAI Labs',
    email: 'research@techailabs.com',
    description: 'Research organization developing cutting-edge AI models'
  },
  {
    walletAddress: '0x7890123456789012345678901234567890123456',
    partyType: 'TDC',
    name: 'Innovation Corp',
    email: 'ai@innovationcorp.com',
    description: 'Enterprise AI solutions provider'
  },
  {
    walletAddress: '0x8901234567890123456789012345678901234567',
    partyType: 'TDC',
    name: 'StartupAI',
    email: 'team@startupai.com',
    description: 'Startup focused on AI-powered applications'
  },
  {
    walletAddress: '0x9012345678901234567890123456789012345678',
    partyType: 'TDC',
    name: 'AutoDrive Systems',
    email: 'ai@autodrive.com',
    description: 'Autonomous vehicle technology company'
  },
  {
    walletAddress: '0xa012345678901234567890123456789012345678',
    partyType: 'TDC',
    name: 'MedTech AI',
    email: 'research@medtechai.com',
    description: 'Healthcare AI solutions for medical diagnosis'
  },

  // Confidential Clean Room Providers (CCRP)
  {
    walletAddress: '0xb012345678901234567890123456789012345678',
    partyType: 'CCRP',
    name: 'SecureCompute Inc.',
    email: 'security@securecompute.com',
    description: 'Enterprise-grade secure computing environments'
  },
  {
    walletAddress: '0xc012345678901234567890123456789012345678',
    partyType: 'CCRP',
    name: 'PrivacyFirst Labs',
    email: 'contact@privacyfirst.com',
    description: 'Privacy-focused clean room solutions'
  },
  {
    walletAddress: '0xd012345678901234567890123456789012345678',
    partyType: 'CCRP',
    name: 'CloudSecure Solutions',
    email: 'info@cloudsecure.com',
    description: 'Cloud-based secure computing infrastructure'
  },
  {
    walletAddress: '0xe012345678901234567890123456789012345678',
    partyType: 'CCRP',
    name: 'Fortress Data Centers',
    email: 'secure@fortressdata.com',
    description: 'Military-grade secure data processing facilities'
  },
  {
    walletAddress: '0xf012345678901234567890123456789012345678',
    partyType: 'CCRP',
    name: 'Quantum Secure Labs',
    email: 'quantum@quantumsecure.com',
    description: 'Quantum-resistant secure computing environments'
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
    ownerId: 1 // DataCorp Inc.
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
    ownerId: 2 // AI Data Solutions
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
    ownerId: 3 // Global Data Hub
  },
  {
    datasetId: 'TABULAR-001',
    name: 'Financial Market Data',
    description: 'Comprehensive financial market dataset for predictive modeling',
    category: 'Tabular',
    size: 10000, // 10GB
    recordCount: 5000000,
    price: 4000.00,
    license: 'Commercial License',
    tags: ['finance', 'predictive-modeling', 'time-series'],
    metadata: {
      timeRange: '2010-2023',
      markets: ['NYSE', 'NASDAQ', 'LSE'],
      features: 150
    },
    ownerId: 1 // DataCorp Inc.
  },
  {
    datasetId: 'MULTI-001',
    name: 'Multimodal Healthcare Data',
    description: 'Combined medical imaging and text data for healthcare AI',
    category: 'Multimodal',
    size: 75000, // 75GB
    recordCount: 100000,
    price: 8000.00,
    license: 'Healthcare License',
    tags: ['healthcare', 'medical-imaging', 'multimodal'],
    metadata: {
      modalities: ['X-Ray', 'MRI', 'CT', 'Text Reports'],
      specialties: ['Radiology', 'Cardiology', 'Oncology']
    },
    ownerId: 2 // AI Data Solutions
  },
  {
    datasetId: 'CV-002',
    name: 'Autonomous Driving Dataset',
    description: 'Comprehensive dataset for autonomous vehicle training',
    category: 'Computer Vision',
    size: 200000, // 200GB
    recordCount: 2000000,
    price: 12000.00,
    license: 'Commercial License',
    tags: ['autonomous-driving', 'object-detection', 'segmentation'],
    metadata: {
      resolution: '1920x1080',
      format: 'MP4',
      scenarios: ['Highway', 'Urban', 'Rural', 'Night']
    },
    ownerId: 4 // VisionTech Data
  },
  {
    datasetId: 'NLP-002',
    name: 'Legal Document Corpus',
    description: 'Large collection of legal documents for NLP analysis',
    category: 'Natural Language Processing',
    size: 30000, // 30GB
    recordCount: 2000000,
    price: 6000.00,
    license: 'Commercial License',
    tags: ['legal', 'document-analysis', 'contract-review'],
    metadata: {
      documentTypes: ['Contracts', 'Court Cases', 'Regulations'],
      jurisdictions: ['US', 'EU', 'UK']
    },
    ownerId: 3 // Global Data Hub
  },
  {
    datasetId: 'AUDIO-002',
    name: 'Music Genre Classification',
    description: 'Diverse music dataset for genre classification models',
    category: 'Audio',
    size: 40000, // 40GB
    recordCount: 100000,
    price: 3500.00,
    license: 'Research License',
    tags: ['music', 'genre-classification', 'audio-analysis'],
    metadata: {
      sampleRate: '44.1kHz',
      duration: '30 seconds',
      genres: ['Rock', 'Jazz', 'Classical', 'Pop', 'Hip-Hop']
    },
    ownerId: 1 // DataCorp Inc.
  },
  {
    datasetId: 'TABULAR-002',
    name: 'E-commerce Customer Data',
    description: 'Customer behavior and transaction data for recommendation systems',
    category: 'Tabular',
    size: 15000, // 15GB
    recordCount: 10000000,
    price: 4500.00,
    license: 'Commercial License',
    tags: ['e-commerce', 'recommendation-systems', 'customer-analytics'],
    metadata: {
      timeRange: '2020-2023',
      features: 200,
      categories: ['Electronics', 'Clothing', 'Books', 'Home']
    },
    ownerId: 2 // AI Data Solutions
  },
  {
    datasetId: 'MULTI-002',
    name: 'Social Media Content Dataset',
    description: 'Multimodal social media content for content moderation',
    category: 'Multimodal',
    size: 60000, // 60GB
    recordCount: 500000,
    price: 5500.00,
    license: 'Commercial License',
    tags: ['social-media', 'content-moderation', 'multimodal'],
    metadata: {
      platforms: ['Twitter', 'Instagram', 'Facebook'],
      contentTypes: ['Text', 'Images', 'Videos']
    },
    ownerId: 4 // VisionTech Data
  },
  {
    datasetId: 'CV-003',
    name: 'Medical Imaging Dataset',
    description: 'Comprehensive medical imaging dataset for diagnostic AI',
    category: 'Computer Vision',
    size: 100000, // 100GB
    recordCount: 500000,
    price: 15000.00,
    license: 'Healthcare License',
    tags: ['medical-imaging', 'diagnostic-ai', 'healthcare'],
    metadata: {
      modalities: ['X-Ray', 'CT', 'MRI', 'Ultrasound'],
      specialties: ['Radiology', 'Cardiology', 'Pulmonology']
    },
    ownerId: 5 // Healthcare Data Pro
  },
  {
    datasetId: 'NLP-003',
    name: 'Customer Support Conversations',
    description: 'Customer service conversations for chatbot training',
    category: 'Natural Language Processing',
    size: 20000, // 20GB
    recordCount: 1000000,
    price: 4000.00,
    license: 'Commercial License',
    tags: ['customer-support', 'chatbot', 'conversational-ai'],
    metadata: {
      industries: ['Technology', 'Finance', 'Healthcare', 'Retail'],
      avgConversationLength: 15
    },
    ownerId: 3 // Global Data Hub
  }
];

const sampleContracts = [
  {
    contractId: 'CONTRACT-001',
    status: 'ACTIVE',
    price: 5000.00,
    duration: 90,
    termsAndConditions: 'Standard commercial license terms with usage restrictions',
    modelId: 'RESNET-50-V2',
    tdpSigned: true,
    ccrpSigned: true,
    tdpSignedAt: new Date('2024-01-15'),
    ccrpSignedAt: new Date('2024-01-20'),
    tdpId: 1, // DataCorp Inc.
    tdcId: 6, // TechAI Labs
    ccrpId: 11, // SecureCompute Inc.
    datasetId: 1 // ImageNet-Enhanced
  },
  {
    contractId: 'CONTRACT-002',
    status: 'PENDING_CCRP_APPROVAL',
    price: 3000.00,
    duration: 60,
    termsAndConditions: 'Research license with publication rights',
    modelId: 'BERT-BASE-MULTILINGUAL',
    tdpSigned: true,
    ccrpSigned: false,
    tdpSignedAt: new Date('2024-02-01'),
    tdpId: 2, // AI Data Solutions
    tdcId: 7, // Innovation Corp
    datasetId: 2 // MultiLanguage Corpus
  },
  {
    contractId: 'CONTRACT-003',
    status: 'COMPLETED',
    price: 2000.00,
    duration: 30,
    termsAndConditions: 'Commercial license for speech recognition model',
    modelId: 'WHISPER-BASE',
    tdpSigned: true,
    ccrpSigned: true,
    tdpSignedAt: new Date('2023-12-01'),
    ccrpSignedAt: new Date('2023-12-05'),
    tdpId: 3, // Global Data Hub
    tdcId: 8, // StartupAI
    ccrpId: 12, // PrivacyFirst Labs
    datasetId: 3 // Speech Recognition Dataset
  },
  {
    contractId: 'CONTRACT-004',
    status: 'PENDING_TDP_APPROVAL',
    price: 12000.00,
    duration: 120,
    termsAndConditions: 'Autonomous driving model training license',
    modelId: 'YOLO-V8',
    tdpSigned: false,
    ccrpSigned: false,
    tdpId: 4, // VisionTech Data
    tdcId: 9, // AutoDrive Systems
    datasetId: 6 // Autonomous Driving Dataset
  },
  {
    contractId: 'CONTRACT-005',
    status: 'ACTIVE',
    price: 15000.00,
    duration: 180,
    termsAndConditions: 'Healthcare diagnostic model license with FDA compliance',
    modelId: 'DENSENET-121',
    tdpSigned: true,
    ccrpSigned: true,
    tdpSignedAt: new Date('2024-01-10'),
    ccrpSignedAt: new Date('2024-01-15'),
    tdpId: 5, // Healthcare Data Pro
    tdcId: 10, // MedTech AI
    ccrpId: 13, // CloudSecure Solutions
    datasetId: 11 // Medical Imaging Dataset
  }
];

const sampleNotifications = [
  {
    type: 'CONTRACT_CREATED',
    title: 'New Contract Created',
    message: 'A new contract has been created for ImageNet-Enhanced dataset',
    isRead: false,
    metadata: { contractId: 'CONTRACT-001', datasetId: 1 },
    userId: 1
  },
  {
    type: 'CONTRACT_SIGNED',
    title: 'Contract Signed by TDC',
    message: 'TechAI Labs has signed the contract for ImageNet-Enhanced dataset',
    isRead: false,
    metadata: { contractId: 'CONTRACT-001', tdcId: 6 },
    userId: 1
  },
  {
    type: 'CCRP_SELECTED',
    title: 'CCRP Selected for Contract',
    message: 'SecureCompute Inc. has been selected as CCRP for contract CONTRACT-001',
    isRead: false,
    metadata: { contractId: 'CONTRACT-001', ccrpId: 11 },
    userId: 1
  },
  {
    type: 'CONTRACT_COMPLETED',
    title: 'Contract Completed',
    message: 'Contract CONTRACT-003 has been successfully completed',
    isRead: true,
    metadata: { contractId: 'CONTRACT-003' },
    userId: 3
  },
  {
    type: 'CONTRACT_CREATED',
    title: 'New Contract Request',
    message: 'AutoDrive Systems has requested access to Autonomous Driving Dataset',
    isRead: false,
    metadata: { contractId: 'CONTRACT-004', tdcId: 9 },
    userId: 4
  }
];

async function seedData() {
  try {
    console.log('Seeding database with comprehensive sample data...');

    // Clear existing data
    console.log('Clearing existing data...');
    await db.Notification.destroy({ where: {} });
    await db.Contract.destroy({ where: {} });
    await db.Dataset.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await db.User.create({
        ...userData,
        isRegistered: true,
        registrationDate: new Date()
      });
      createdUsers.push(user);
    }

    // Create datasets
    console.log('Creating datasets...');
    const createdDatasets = [];
    for (const datasetData of sampleDatasets) {
      const dataset = await db.Dataset.create(datasetData);
      createdDatasets.push(dataset);
    }

    // Create contracts
    console.log('Creating contracts...');
    const createdContracts = [];
    for (const contractData of sampleContracts) {
      const contract = await db.Contract.create(contractData);
      createdContracts.push(contract);
    }

    // Create notifications
    console.log('Creating notifications...');
    const createdNotifications = [];
    for (const notificationData of sampleNotifications) {
      const notification = await db.Notification.create(notificationData);
      createdNotifications.push(notification);
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${createdDatasets.length} datasets`);
    console.log(`Created ${createdContracts.length} contracts`);
    console.log(`Created ${createdNotifications.length} notifications`);

    // Display summary
    console.log('\n=== Sample Data Summary ===');
    console.log('Users by type:');
    const userCounts = await db.User.findAll({
      attributes: ['partyType', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['partyType']
    });
    userCounts.forEach(count => {
      console.log(`  ${count.partyType}: ${count.dataValues.count}`);
    });

    console.log('\nDatasets by category:');
    const datasetCounts = await db.Dataset.findAll({
      attributes: ['category', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['category']
    });
    datasetCounts.forEach(count => {
      console.log(`  ${count.category}: ${count.dataValues.count}`);
    });

    console.log('\nContracts by status:');
    const contractCounts = await db.Contract.findAll({
      attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      group: ['status']
    });
    contractCounts.forEach(count => {
      console.log(`  ${count.status}: ${count.dataValues.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedData(); 