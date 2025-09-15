#!/usr/bin/env node
/**
 * Test script for the generic data loading service
 */

const DataLoadingService = require('./services/dataLoadingService');

async function testDataLoader() {
  console.log('🧪 Testing Generic Data Loading Service...\n');
  
  const dataLoader = new DataLoadingService();
  
  // Test MNIST dataset
  console.log('📊 Testing MNIST dataset...');
  const mnistDataset = {
    id: 'DATASET-MNIST-001',
    name: 'MNIST Handwritten Digits',
    type: 'MNIST',
    size: '11.2MB',
    featureCount: 784,
    classCount: 10
  };
  
  try {
    const mnistData = await dataLoader.loadDataset(mnistDataset, {
      framework: 'tensorflow',
      normalize: true,
      validationSplit: 0.2,
      batchSize: 32,
      shuffle: true
    });
    
    console.log('✅ MNIST dataset loaded successfully');
    console.log(`   Samples: ${mnistData.metadata.recordCount}`);
    console.log(`   Features: ${mnistData.metadata.featureCount}`);
    console.log(`   Classes: ${mnistData.metadata.classCount}`);
    console.log(`   Input Shape: ${mnistData.inputShape}`);
    console.log(`   Class Names: ${mnistData.classNames.join(', ')}\n`);
    
  } catch (error) {
    console.error('❌ MNIST test failed:', error.message);
  }
  
  // Test CIFAR-10 dataset
  console.log('🖼️ Testing CIFAR-10 dataset...');
  const cifar10Dataset = {
    id: 'DATASET-CIFAR10-001',
    name: 'CIFAR-10 Images',
    type: 'CIFAR10',
    size: '170MB',
    featureCount: 3072,
    classCount: 10
  };
  
  try {
    const cifar10Data = await dataLoader.loadDataset(cifar10Dataset, {
      framework: 'pytorch',
      normalize: true,
      validationSplit: 0.2,
      batchSize: 64,
      shuffle: true
    });
    
    console.log('✅ CIFAR-10 dataset loaded successfully');
    console.log(`   Samples: ${cifar10Data.metadata.recordCount}`);
    console.log(`   Features: ${cifar10Data.metadata.featureCount}`);
    console.log(`   Classes: ${cifar10Data.metadata.classCount}`);
    console.log(`   Input Shape: ${cifar10Data.inputShape}`);
    console.log(`   Class Names: ${cifar10Data.classNames.join(', ')}\n`);
    
  } catch (error) {
    console.error('❌ CIFAR-10 test failed:', error.message);
  }
  
  // Test custom CSV dataset
  console.log('📄 Testing custom CSV dataset...');
  const csvDataset = {
    id: 'DATASET-CSV-001',
    name: 'Custom CSV Dataset',
    type: 'CUSTOM_CSV',
    size: '5MB',
    featureCount: 10,
    classCount: 3
  };
  
  try {
    const csvData = await dataLoader.loadDataset(csvDataset, {
      framework: 'numpy',
      normalize: false,
      validationSplit: 0.3,
      batchSize: 16,
      shuffle: true
    });
    
    console.log('✅ Custom CSV dataset loaded successfully');
    console.log(`   Samples: ${csvData.metadata.recordCount}`);
    console.log(`   Features: ${csvData.metadata.featureCount}`);
    console.log(`   Classes: ${csvData.metadata.classCount}`);
    console.log(`   Feature Names: ${csvData.featureNames.join(', ')}\n`);
    
  } catch (error) {
    console.error('❌ Custom CSV test failed:', error.message);
  }
  
  // Test synthetic dataset
  console.log('🧪 Testing synthetic dataset...');
  const syntheticDataset = {
    id: 'DATASET-SYNTHETIC-001',
    name: 'Synthetic Test Dataset',
    type: 'SYNTHETIC',
    size: '1MB',
    featureCount: 20,
    classCount: 5
  };
  
  try {
    const syntheticData = await dataLoader.loadDataset(syntheticDataset, {
      framework: 'tensorflow',
      normalize: true,
      validationSplit: 0.2,
      batchSize: 32,
      shuffle: true,
      syntheticConfig: {
        samples: 2000,
        features: 20,
        classes: 5,
        distribution: 'normal',
        noise: 0.1
      }
    });
    
    console.log('✅ Synthetic dataset loaded successfully');
    console.log(`   Samples: ${syntheticData.metadata.recordCount}`);
    console.log(`   Features: ${syntheticData.metadata.featureCount}`);
    console.log(`   Classes: ${syntheticData.metadata.classCount}\n`);
    
  } catch (error) {
    console.error('❌ Synthetic test failed:', error.message);
  }
  
  // Test dataset validation
  console.log('🔍 Testing dataset validation...');
  const invalidDataset = {
    id: 'DATASET-INVALID-001',
    name: 'Invalid Dataset',
    type: 'UNSUPPORTED_TYPE'
  };
  
  const validation = dataLoader.validateDatasetConfig(invalidDataset);
  console.log(`   Validation result: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  if (!validation.isValid) {
    console.log(`   Errors: ${validation.errors.join(', ')}\n`);
  }
  
  // Test dataset info
  console.log('📋 Testing dataset info...');
  const datasetInfo = await dataLoader.getDatasetInfo(mnistDataset);
  console.log('✅ Dataset info retrieved:');
  console.log(`   ID: ${datasetInfo.id}`);
  console.log(`   Name: ${datasetInfo.name}`);
  console.log(`   Type: ${datasetInfo.type}`);
  console.log(`   Supported Frameworks: ${datasetInfo.supportedFrameworks.join(', ')}`);
  console.log(`   Estimated Size: ${datasetInfo.estimatedSize.samples} samples`);
  console.log(`   Features: ${datasetInfo.features.inputShape}, ${datasetInfo.features.numClasses} classes`);
  
  console.log('\n🎉 All tests completed!');
}

// Run the test
if (require.main === module) {
  testDataLoader().catch(console.error);
}

module.exports = testDataLoader;
