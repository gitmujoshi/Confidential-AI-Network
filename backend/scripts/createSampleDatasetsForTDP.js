/**
 * Create Sample Datasets for TDP User
 * 
 * This script creates sample datasets from public sources and links them to the TDP user.
 */

const db = require('../models');

// Sample datasets from public sources
const sampleDatasets = [
  {
    datasetId: 'MNIST-HANDWRITTEN',
    name: 'MNIST Handwritten Digits',
    description: 'The MNIST database of handwritten digits, consisting of 60,000 training images and 10,000 test images. Each image is 28x28 pixels in grayscale. This is one of the most popular datasets for computer vision and machine learning.',
    category: 'Computer Vision',
    size: 11, // 11 MB
    recordCount: 70000,
    price: 150.00,
    license: 'Creative Commons Attribution-Share Alike 3.0',
    tags: ['handwritten', 'digits', 'classification', 'grayscale', 'mnist'],
    metadata: {
      imageSize: '28x28',
      colorChannels: 1,
      classes: 10,
      format: 'PNG',
      source: 'NIST',
      year: 1998,
      citation: 'LeCun, Y., Bottou, L., Bengio, Y., & Haffner, P. (1998). Gradient-based learning applied to document recognition.',
      qualityScore: 9.8
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'CIFAR-10-IMAGES',
    name: 'CIFAR-10 Image Classification',
    description: 'The CIFAR-10 dataset consists of 60,000 32x32 color images in 10 different classes. Widely used for computer vision research and deep learning. The classes are: airplane, automobile, bird, cat, deer, dog, frog, horse, ship, truck.',
    category: 'Computer Vision',
    size: 170, // 170 MB
    recordCount: 60000,
    price: 200.00,
    license: 'MIT License',
    tags: ['color', 'classification', 'natural', 'objects', 'cifar'],
    metadata: {
      imageSize: '32x32',
      colorChannels: 3,
      classes: 10,
      format: 'PNG',
      source: 'University of Toronto',
      year: 2009,
      citation: 'Krizhevsky, A. (2009). Learning Multiple Layers of Features from Tiny Images.',
      qualityScore: 9.5
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'IMDB-SENTIMENT',
    name: 'IMDB Movie Reviews Sentiment',
    description: 'Large Movie Review Dataset for sentiment analysis. Contains 50,000 movie reviews for training and testing sentiment analysis models. Each review is labeled as positive or negative.',
    category: 'Natural Language Processing',
    size: 80, // 80 MB
    recordCount: 50000,
    price: 120.00,
    license: 'Apache 2.0',
    tags: ['sentiment', 'reviews', 'text', 'classification', 'imdb'],
    metadata: {
      language: 'English',
      classes: 2,
      avgLength: '230 words',
      source: 'Stanford AI Lab',
      year: 2011,
      citation: 'Maas, A. L., et al. (2011). Learning Word Vectors for Sentiment Analysis.',
      qualityScore: 9.2
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'FASHION-MNIST',
    name: 'Fashion-MNIST Clothing Classification',
    description: 'A dataset of Zalando\'s article images consisting of 70,000 fashion products from 10 categories. Each image is 28x28 pixels in grayscale. Categories include: T-shirt/top, Trouser, Pullover, Dress, Coat, Sandal, Shirt, Sneaker, Bag, Ankle boot.',
    category: 'Computer Vision',
    size: 29, // 29 MB
    recordCount: 70000,
    price: 180.00,
    license: 'MIT License',
    tags: ['fashion', 'clothing', 'classification', 'e-commerce', 'fashion-mnist'],
    metadata: {
      imageSize: '28x28',
      colorChannels: 1,
      classes: 10,
      format: 'PNG',
      source: 'Zalando Research',
      year: 2017,
      citation: 'Xiao, H., Rasul, K., & Vollgraf, R. (2017). Fashion-MNIST: a Novel Image Dataset for Benchmarking Machine Learning Algorithms.',
      qualityScore: 9.3
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'SPAM-EMAIL',
    name: 'Spam Email Detection Dataset',
    description: 'A collection of 5,574 emails labeled as spam or ham (legitimate). Useful for training email filtering and spam detection models. The dataset includes email content and metadata.',
    category: 'Natural Language Processing',
    size: 3, // 3 MB
    recordCount: 5574,
    price: 80.00,
    license: 'Creative Commons Attribution 3.0',
    tags: ['email', 'spam', 'filtering', 'text', 'classification'],
    metadata: {
      language: 'English',
      classes: 2,
      avgLength: '150 words',
      source: 'UCI Machine Learning Repository',
      year: 2012,
      citation: 'Almeida, T. A., Hidalgo, J. M. G., & Yamakami, A. (2012). Contributions to the Study of SMS Spam Filtering.',
      qualityScore: 8.9
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'CALTECH-101',
    name: 'Caltech-101 Object Recognition',
    description: 'The Caltech-101 dataset contains pictures of objects belonging to 101 categories. Each category contains about 40 to 800 images, with most categories having around 50 images.',
    category: 'Computer Vision',
    size: 131, // 131 MB
    recordCount: 9144,
    price: 250.00,
    license: 'Creative Commons Attribution 4.0',
    tags: ['object-recognition', 'classification', 'natural', 'caltech'],
    metadata: {
      imageSize: 'Variable',
      colorChannels: 3,
      classes: 101,
      format: 'JPEG',
      source: 'Caltech',
      year: 2003,
      citation: 'Fei-Fei, L., Fergus, R., & Perona, P. (2003). A Bayesian approach to unsupervised one-shot learning of object categories.',
      qualityScore: 9.4
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'AG-NEWS',
    name: 'AG News Classification',
    description: 'AG News is a collection of more than 1 million news articles. The news articles have been gathered from more than 2000 news sources by ComeToMyHead in more than 1 year of activity.',
    category: 'Natural Language Processing',
    size: 120, // 120 MB
    recordCount: 127600,
    price: 300.00,
    license: 'Creative Commons Attribution 4.0',
    tags: ['news', 'classification', 'text', 'ag-news'],
    metadata: {
      language: 'English',
      classes: 4,
      avgLength: '200 words',
      source: 'ComeToMyHead',
      year: 2005,
      citation: 'Zhang, X., Zhao, J., & LeCun, Y. (2015). Character-level Convolutional Networks for Text Classification.',
      qualityScore: 9.1
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'LIBRISPEECH',
    name: 'LibriSpeech Speech Recognition',
    description: 'LibriSpeech is a corpus of approximately 1000 hours of 16kHz read English speech, prepared by Vassil Panayotov with the assistance of Daniel Povey.',
    category: 'Audio',
    size: 2900, // 2.9 GB
    recordCount: 2484,
    price: 500.00,
    license: 'Creative Commons Attribution 4.0',
    tags: ['speech', 'recognition', 'audio', 'librispeech'],
    metadata: {
      sampleRate: '16kHz',
      duration: 'Variable',
      language: 'English',
      source: 'LibriVox',
      year: 2015,
      citation: 'Panayotov, V., Chen, G., Povey, D., & Khudanpur, S. (2015). LibriSpeech: an ASR corpus based on public domain audio books.',
      qualityScore: 9.6
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'UCI-HAR',
    name: 'UCI Human Activity Recognition',
    description: 'Human Activity Recognition database built from the recordings of 30 subjects performing activities of daily living while carrying a waist-mounted smartphone with embedded inertial sensors.',
    category: 'Tabular',
    size: 58, // 58 MB
    recordCount: 10299,
    price: 100.00,
    license: 'Creative Commons Attribution 4.0',
    tags: ['activity-recognition', 'sensors', 'tabular', 'uci'],
    metadata: {
      subjects: 30,
      activities: 6,
      features: 561,
      source: 'UCI Machine Learning Repository',
      year: 2012,
      citation: 'Anguita, D., et al. (2013). A Public Domain Dataset for Human Activity Recognition Using Smartphones.',
      qualityScore: 9.0
    },
    isPublic: true,
    isActive: true
  },
  {
    datasetId: 'WIKITEXT-103',
    name: 'WikiText-103 Language Modeling',
    description: 'WikiText-103 is a collection of over 100 million tokens extracted from the set of verified Good and Featured articles on Wikipedia.',
    category: 'Natural Language Processing',
    size: 191, // 191 MB
    recordCount: 103227021,
    price: 400.00,
    license: 'Creative Commons Attribution-ShareAlike 3.0',
    tags: ['language-modeling', 'text', 'wikipedia', 'wikitext'],
    metadata: {
      language: 'English',
      tokens: 103227021,
      vocabulary: 267735,
      source: 'Wikipedia',
      year: 2016,
      citation: 'Merity, S., Xiong, C., Bradbury, J., & Socher, R. (2016). Pointer Sentinel Mixture Models.',
      qualityScore: 9.3
    },
    isPublic: true,
    isActive: true
  }
];

async function createSampleDatasetsForTDP() {
  try {
    console.log('🚀 Creating Sample Datasets for TDP User...\n');

    // Find the TDP user
    const tdpUser = await db.User.findOne({
      where: { email: 'tdpuser@example.com' }
    });

    if (!tdpUser) {
      console.error('❌ TDP user not found. Please create the TDP user first.');
      return;
    }

    console.log(`✅ Found TDP user: ${tdpUser.name} (${tdpUser.email})`);
    console.log(`   User ID: ${tdpUser.id}`);
    console.log(`   Party Type: ${tdpUser.partyType}\n`);

    // Create datasets
    console.log('📊 Creating sample datasets...');
    const createdDatasets = [];

    for (const datasetData of sampleDatasets) {
      // Check if dataset already exists
      const existingDataset = await db.Dataset.findOne({
        where: { datasetId: datasetData.datasetId }
      });

      if (existingDataset) {
        console.log(`⚠️  Dataset ${datasetData.name} already exists, skipping...`);
        continue;
      }

      // Create the dataset
      const dataset = await db.Dataset.create({
        ...datasetData,
        ownerId: tdpUser.id
      });

      createdDatasets.push(dataset);
      console.log(`✅ Created dataset: ${dataset.name}`);
      console.log(`   ID: ${dataset.datasetId}`);
      console.log(`   Category: ${dataset.category}`);
      console.log(`   Size: ${dataset.size} MB`);
      console.log(`   Records: ${dataset.recordCount.toLocaleString()}`);
      console.log(`   Price: $${dataset.price}`);
      console.log('');
    }

    console.log('🎉 Sample datasets creation completed!');
    console.log(`\n📋 Summary:`);
    console.log(`   TDP User: ${tdpUser.name} (${tdpUser.email})`);
    console.log(`   Total datasets created: ${createdDatasets.length}`);
    console.log(`   Total datasets owned by TDP: ${await db.Dataset.count({ where: { ownerId: tdpUser.id } })}`);

    // Display all datasets owned by the TDP user
    const allDatasets = await db.Dataset.findAll({
      where: { ownerId: tdpUser.id },
      order: [['createdAt', 'ASC']]
    });

    console.log(`\n📊 All datasets owned by ${tdpUser.name}:`);
    allDatasets.forEach((dataset, index) => {
      console.log(`   ${index + 1}. ${dataset.name} (${dataset.datasetId})`);
      console.log(`      Category: ${dataset.category}`);
      console.log(`      Price: $${dataset.price}`);
      console.log(`      Records: ${dataset.recordCount.toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error creating sample datasets:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
createSampleDatasetsForTDP()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 