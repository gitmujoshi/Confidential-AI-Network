const db = require('../models');

// Test datasets from public sources
const testDatasets = [
  {
    datasetId: 'mnist-digit-recognition',
    name: 'MNIST Handwritten Digits',
    description: 'The MNIST database of handwritten digits, consisting of 60,000 training images and 10,000 test images. Each image is 28x28 pixels in grayscale.',
    category: 'Computer Vision',
    size: 11, // 11 MB
    recordCount: 70000,
    price: 150.00,
    license: 'Creative Commons Attribution-Share Alike 3.0',
    tags: ['handwritten', 'digits', 'classification', 'grayscale'],
    metadata: {
      imageSize: '28x28',
      colorChannels: 1,
      classes: 10,
      format: 'PNG',
      source: 'NIST',
      year: 1998
    },
    isPublic: true,
    isActive: true,
    ownerId: 1 // DataCorp Inc.
  },
  {
    datasetId: 'cifar-10-classification',
    name: 'CIFAR-10 Image Classification',
    description: 'The CIFAR-10 dataset consists of 60,000 32x32 color images in 10 different classes. Widely used for computer vision research and deep learning.',
    category: 'Computer Vision',
    size: 170, // 170 MB
    recordCount: 60000,
    price: 200.00,
    license: 'MIT License',
    tags: ['color', 'classification', 'natural', 'objects'],
    metadata: {
      imageSize: '32x32',
      colorChannels: 3,
      classes: 10,
      format: 'PNG',
      source: 'University of Toronto',
      year: 2009
    },
    isPublic: true,
    isActive: true,
    ownerId: 2 // AI Data Solutions
  },
  {
    datasetId: 'imdb-sentiment-analysis',
    name: 'IMDB Movie Reviews Sentiment',
    description: 'Large Movie Review Dataset for sentiment analysis. Contains 50,000 movie reviews for training and testing sentiment analysis models.',
    category: 'Natural Language Processing',
    size: 80, // 80 MB
    recordCount: 50000,
    price: 120.00,
    license: 'Apache 2.0',
    tags: ['sentiment', 'reviews', 'text', 'classification'],
    metadata: {
      language: 'English',
      classes: 2,
      avgLength: '230 words',
      source: 'Stanford AI Lab',
      year: 2011
    },
    isPublic: true,
    isActive: true,
    ownerId: 3 // Global Data Hub
  },
  {
    datasetId: 'fashion-mnist',
    name: 'Fashion-MNIST Clothing Classification',
    description: 'A dataset of Zalando\'s article images consisting of 70,000 fashion products from 10 categories. Each image is 28x28 pixels in grayscale.',
    category: 'Computer Vision',
    size: 29, // 29 MB
    recordCount: 70000,
    price: 180.00,
    license: 'MIT License',
    tags: ['fashion', 'clothing', 'classification', 'e-commerce'],
    metadata: {
      imageSize: '28x28',
      colorChannels: 1,
      classes: 10,
      format: 'PNG',
      source: 'Zalando Research',
      year: 2017
    },
    isPublic: true,
    isActive: true,
    ownerId: 4 // VisionTech Data
  },
  {
    datasetId: 'spam-email-detection',
    name: 'Spam Email Detection Dataset',
    description: 'A collection of 5,574 emails labeled as spam or ham (legitimate). Useful for training email filtering and spam detection models.',
    category: 'Natural Language Processing',
    size: 3, // 3 MB
    recordCount: 5574,
    price: 80.00,
    license: 'Creative Commons Attribution 3.0',
    tags: ['email', 'spam', 'filtering', 'text'],
    metadata: {
      language: 'English',
      classes: 2,
      avgLength: '150 words',
      source: 'UCI Machine Learning Repository',
      year: 2012
    },
    isPublic: true,
    isActive: true,
    ownerId: 5 // Healthcare Data Pro
  }
];

async function createTestDatasets() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models
    await db.sequelize.sync();
    console.log('Models synchronized.');

    // Check if datasets already exist
    for (const datasetData of testDatasets) {
      const existingDataset = await db.Dataset.findOne({
        where: { datasetId: datasetData.datasetId }
      });

      if (existingDataset) {
        console.log(`Dataset ${datasetData.name} already exists, skipping...`);
        continue;
      }

      // Create the dataset
      const dataset = await db.Dataset.create(datasetData);
      console.log(`✅ Created dataset: ${dataset.name} (ID: ${dataset.id})`);
    }

    console.log('\n🎉 Test datasets creation completed!');
    
    // Display summary
    const totalDatasets = await db.Dataset.count({ where: { isActive: true } });
    console.log(`Total active datasets: ${totalDatasets}`);

  } catch (error) {
    console.error('Error creating test datasets:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
createTestDatasets(); 