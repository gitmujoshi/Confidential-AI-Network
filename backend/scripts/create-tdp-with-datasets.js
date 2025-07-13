/**
 * Create TDP Test User with Datasets
 * 
 * This script creates a new TDP test user and adds datasets from public sources
 */

const db = require('../models');
const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();

// TDP User Data
const tdpUser = {
  name: 'tdp.ai.research@example.com',
  email: 'tdp.ai.research@example.com',
  partyType: 'TDP',
  organization: 'AI Research Consortium',
  description: 'Leading provider of diverse AI training datasets from public sources',
  walletAddress: '0x8ba1f109551bD4328030126450aC136c772c3c7a', // valid 42-char address
  publicKey: '0x' + '0'.repeat(64),
  phoneNumber: '+1-555-1004',
  website: 'https://ai-research-consortium.org',
  location: 'Cambridge, MA'
};

// Public Datasets
const publicDatasets = [
  {
    name: 'MNIST Handwritten Digits',
    description: 'Classic dataset of handwritten digits (0-9) for computer vision training',
    category: 'Computer Vision',
    dataType: 'Image',
    size: '11.2 MB',
    recordCount: 70000,
    source: 'Yann LeCun, Corinna Cortes, Christopher J.C. Burges',
    license: 'Creative Commons Attribution-Share Alike 3.0',
    url: 'http://yann.lecun.com/exdb/mnist/',
    tags: ['handwritten', 'digits', 'classification', 'computer-vision'],
    metadata: {
      imageSize: '28x28 pixels',
      colorChannels: 'Grayscale',
      trainingSamples: 60000,
      testSamples: 10000,
      classes: 10
    }
  },
  {
    name: 'CIFAR-10 Image Classification',
    description: 'Dataset of 60,000 32x32 color images in 10 different classes',
    category: 'Computer Vision',
    dataType: 'Image',
    size: '170 MB',
    recordCount: 60000,
    source: 'Alex Krizhevsky, Vinod Nair, Geoffrey Hinton',
    license: 'MIT License',
    url: 'https://www.cs.toronto.edu/~kriz/cifar.html',
    tags: ['classification', 'color-images', 'object-detection'],
    metadata: {
      imageSize: '32x32 pixels',
      colorChannels: 'RGB',
      trainingSamples: 50000,
      testSamples: 10000,
      classes: 10,
      classesList: ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck']
    }
  },
  {
    name: 'IMDB Movie Reviews',
    description: 'Large dataset of movie reviews for sentiment analysis',
    category: 'Natural Language Processing',
    dataType: 'Text',
    size: '80 MB',
    recordCount: 50000,
    source: 'Andrew Maas, Raymond Daly, Peter Pham, Dan Huang, Andrew Ng, Christopher Potts',
    license: 'Apache License 2.0',
    url: 'http://ai.stanford.edu/~amaas/data/sentiment/',
    tags: ['sentiment-analysis', 'movie-reviews', 'text-classification'],
    metadata: {
      averageLength: '230 words',
      maxLength: '2500 words',
      positiveReviews: 25000,
      negativeReviews: 25000,
      language: 'English'
    }
  },
  {
    name: 'UCI Adult Census Income',
    description: 'Census income dataset for demographic analysis and income prediction',
    category: 'Tabular',
    dataType: 'Structured',
    size: '3.2 MB',
    recordCount: 48842,
    source: 'UCI Machine Learning Repository',
    license: 'Public Domain',
    url: 'https://archive.ics.uci.edu/ml/datasets/adult',
    tags: ['demographics', 'income-prediction', 'census-data'],
    metadata: {
      features: 14,
      targetVariable: 'income',
      missingValues: 'Yes',
      categoricalFeatures: 8,
      numericalFeatures: 6
    }
  },
  {
    name: 'Boston Housing Dataset',
    description: 'Housing values in suburbs of Boston for regression analysis',
    category: 'Tabular',
    dataType: 'Structured',
    size: '0.5 MB',
    recordCount: 506,
    source: 'Harrison, D. and Rubinfeld, D.L.',
    license: 'Public Domain',
    url: 'https://archive.ics.uci.edu/ml/datasets/housing',
    tags: ['regression', 'housing', 'real-estate'],
    metadata: {
      features: 13,
      targetVariable: 'MEDV (median value)',
      missingValues: 'No',
      numericalFeatures: 13
    }
  }
];

async function createTDPWithDatasets() {
  try {
    console.log('🔧 Creating TDP test user with datasets...\n');

    let temporaryPassword = null; // Declare at function level

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: { email: tdpUser.email.toLowerCase() }
    });

    if (existingUser) {
      console.log(`⚠️ User already exists: ${tdpUser.email}`);
      console.log('Proceeding to add datasets...');
    } else {
      console.log(`Creating TDP user: ${tdpUser.email}`);
      
      // Generate system DID
      const domain = tdpUser.email.split('@')[1] || 'example.com';
      const did = `did:web:${domain}:user:${tdpUser.email.split('@')[0]}`;

      // Generate temporary password
      temporaryPassword = ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.generateTemporaryPassword();

      // Start database transaction
      const transaction = await db.sequelize.transaction();

      try {
        // Try to create user in Keycloak first
        let ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = null;
        let ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = false;
        
        try {
          ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser({
            email: tdpUser.email,
            name: tdpUser.name,
            walletAddress: tdpUser.walletAddress,
            partyType: tdpUser.partyType,
            publicKey: tdpUser.publicKey,
            organization: tdpUser.organization,
            phoneNumber: tdpUser.phoneNumber,
            website: tdpUser.website,
            location: tdpUser.location
          });
          ***REMOVED-KEYCLOAK_DB_PASSWORD***Success = true;
          console.log('✅ Keycloak user created successfully');
        } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
          console.log('⚠️ Failed to create user in Keycloak:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error.message);
          // Continue with database creation
        }

        // Create user in database
        const dbUser = await db.User.create({
          walletAddress: tdpUser.walletAddress?.toLowerCase(),
          publicKey: tdpUser.publicKey,
          partyType: tdpUser.partyType,
          name: tdpUser.name,
          email: tdpUser.email.toLowerCase(),
          description: tdpUser.description,
          organization: tdpUser.organization,
          phoneNumber: tdpUser.phoneNumber,
          website: tdpUser.website,
          location: tdpUser.location,
          did: did,
          didSource: 'SYSTEM_GENERATED',
          didVerified: true,
          didVerificationMethod: 'SYSTEM_GENERATED',
          isRegistered: true,
          registrationDate: new Date(),
          isActive: true,
          onboardingStatus: 'IN_PROGRESS',
          profileCompleted: false,
          emailVerified: false,
          iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result?.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId || null,
          iamUsername: tdpUser.email
        }, { transaction });

        // Create notification
        await db.Notification.create({
          userId: dbUser.id,
          type: 'USER_REGISTERED',
          title: 'Welcome to Contract Management',
          message: `Welcome ${tdpUser.name}! Your account has been successfully registered as a ${tdpUser.partyType}. Please complete your profile and verify your email.`,
          isRead: false,
          metadata: {
            partyType: tdpUser.partyType,
            registrationDate: new Date().toISOString(),
            onboardingStatus: 'IN_PROGRESS',
            did: did,
            didSource: 'SYSTEM_GENERATED',
            iamIntegrated: ***REMOVED-KEYCLOAK_DB_PASSWORD***Success
          }
        }, { transaction });

        // Commit transaction
        await transaction.commit();

        console.log(`✅ Created TDP user: ${tdpUser.name}`);
        console.log(`🔑 Temporary password: ${temporaryPassword}`);
        console.log(`📧 Email: ${tdpUser.email}`);

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    // Add datasets
    console.log('\n📊 Adding datasets...');
    
    const user = await db.User.findOne({
      where: { email: tdpUser.email.toLowerCase() }
    });

    if (!user) {
      throw new Error('User not found after creation');
    }

    const createdDatasets = [];
    const failedDatasets = [];

    for (const datasetData of publicDatasets) {
      try {
        // Check if dataset already exists for this user
        const existingDataset = await db.Dataset.findOne({
          where: { 
            name: datasetData.name,
            ownerId: user.id
          }
        });

        if (existingDataset) {
          console.log(`   ⚠️ Dataset already exists: ${datasetData.name}`);
          continue;
        }

        // Create dataset
        const dataset = await db.Dataset.create({
          ownerId: user.id,
          datasetId: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: datasetData.name,
          description: datasetData.description,
          category: datasetData.category,
          size: parseInt(datasetData.size.replace(' MB', '')),
          recordCount: datasetData.recordCount,
          price: 0.00, // Free datasets
          license: datasetData.license,
          tags: datasetData.tags,
          metadata: datasetData.metadata,
          isPublic: true,
          isActive: true
        });

        createdDatasets.push({
          name: dataset.name,
          category: dataset.category,
          recordCount: dataset.recordCount
        });

        console.log(`   ✅ Created dataset: ${dataset.name} (${dataset.recordCount} records)`);

      } catch (error) {
        failedDatasets.push({
          name: datasetData.name,
          error: error.message
        });
        console.log(`   ❌ Failed to create dataset: ${datasetData.name} - ${error.message}`);
      }
    }

    console.log(`\n🎉 Dataset Creation Summary:`);
    console.log(`✅ Successfully created: ${createdDatasets.length} datasets`);
    console.log(`❌ Failed to create: ${failedDatasets.length} datasets`);

    if (createdDatasets.length > 0) {
      console.log('\n📋 Successfully Created Datasets:');
      createdDatasets.forEach((dataset, index) => {
        console.log(`${index + 1}. ${dataset.name}`);
        console.log(`   Category: ${dataset.category}`);
        console.log(`   Records: ${dataset.recordCount}`);
      });
    }

    if (failedDatasets.length > 0) {
      console.log('\n❌ Failed Datasets:');
      failedDatasets.forEach((dataset, index) => {
        console.log(`${index + 1}. ${dataset.name} - ${dataset.error}`);
      });
    }

    console.log('\n🔑 Login Information:');
    console.log(`Email: ${tdpUser.email}`);
    console.log(`Password: ${temporaryPassword || 'Use existing password'}`);
    console.log(`Party Type: ${tdpUser.partyType}`);
    console.log(`Organization: ${tdpUser.organization}`);

  } catch (error) {
    console.error('❌ Error creating TDP with datasets:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
createTDPWithDatasets(); 