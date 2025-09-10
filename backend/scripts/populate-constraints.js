/**
 * Populate Constraints Database
 * 
 * This script populates the constraint management tables with the existing
 * constraint data from the frontend configuration files.
 */

const { sequelize } = require('../models');
const { ConstraintCategory, ConstraintField, ConstraintValue } = require('../models');

// Import constraint data from frontend configs
const datasetConstraints = require('../../frontend/src/config/datasetConstraints');
const contractConstraints = require('../../frontend/src/config/contractConstraints');
const ccrpConstraints = require('../../frontend/src/config/ccrpConstraints');
const tdcConstraints = require('../../frontend/src/config/tdcConstraints');

async function populateConstraints() {
  try {
    console.log('🔄 Starting constraint population...');

    // Define constraint categories
    const categories = [
      {
        categoryKey: 'datasets',
        name: 'Dataset Constraints',
        description: 'Constraints for dataset attributes and security settings',
        icon: '📊',
        color: '#2196F3',
        displayOrder: 1
      },
      {
        categoryKey: 'contracts',
        name: 'Contract Constraints',
        description: 'Constraints for contract attributes and workflow settings',
        icon: '📄',
        color: '#4CAF50',
        displayOrder: 2
      },
      {
        categoryKey: 'ccrp',
        name: 'CCRP Constraints',
        description: 'Constraints for Confidential Clean Room Provider settings',
        icon: '🏢',
        color: '#FF9800',
        displayOrder: 3
      },
      {
        categoryKey: 'tdc',
        name: 'TDC Constraints',
        description: 'Constraints for Training Data Consumer and AI model settings',
        icon: '🤖',
        color: '#9C27B0',
        displayOrder: 4
      }
    ];

    // Create categories
    for (const categoryData of categories) {
      const [category, created] = await ConstraintCategory.findOrCreate({
        where: { categoryKey: categoryData.categoryKey },
        defaults: categoryData
      });
      console.log(`${created ? '✅ Created' : '📋 Found'} category: ${category.name}`);
    }

    // Populate dataset constraints
    await populateDatasetConstraints();
    
    // Populate contract constraints
    await populateContractConstraints();
    
    // Populate CCRP constraints
    await populateCCRPConstraints();
    
    // Populate TDC constraints
    await populateTDCConstraints();

    console.log('🎉 Constraint population completed successfully!');
  } catch (error) {
    console.error('❌ Error populating constraints:', error);
    throw error;
  }
}

async function populateDatasetConstraints() {
  console.log('📊 Populating dataset constraints...');
  
  const category = await ConstraintCategory.findOne({ where: { categoryKey: 'datasets' } });
  if (!category) {
    console.error('❌ Dataset category not found');
    return;
  }

  // Data Classifications
  const dataClassificationField = await createField(category.id, {
    fieldKey: 'data_classification',
    name: 'Data Classification',
    description: 'Data sensitivity classification level',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 1
  });

  for (const classification of datasetConstraints.DATA_CLASSIFICATIONS) {
    await createValue(dataClassificationField.id, {
      valueKey: classification.value,
      label: classification.label,
      description: classification.description,
      icon: classification.icon,
      color: classification.color,
      isRecommended: classification.recommended || false,
      metadata: {
        requirements: classification.requirements
      }
    });
  }

  // Encryption Algorithms
  const encryptionField = await createField(category.id, {
    fieldKey: 'encryption_algorithm',
    name: 'Encryption Algorithm',
    description: 'Encryption algorithm used for data protection',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 2
  });

  for (const algorithm of datasetConstraints.ENCRYPTION_ALGORITHMS) {
    await createValue(encryptionField.id, {
      valueKey: algorithm.value,
      label: algorithm.label,
      description: algorithm.description,
      isRecommended: algorithm.recommended || false,
      metadata: {
        security: algorithm.security,
        performance: algorithm.performance
      }
    });
  }

  // Privacy Techniques
  const privacyField = await createField(category.id, {
    fieldKey: 'privacy_techniques',
    name: 'Privacy Techniques',
    description: 'Privacy-preserving techniques for data processing',
    fieldType: 'multiselect',
    isRequired: true,
    displayOrder: 3
  });

  for (const technique of datasetConstraints.PRIVACY_TECHNIQUES) {
    await createValue(privacyField.id, {
      valueKey: technique.value,
      label: technique.label,
      description: technique.description,
      isRecommended: technique.recommended || false,
      metadata: {
        category: technique.category
      }
    });
  }

  // Dataset Categories
  const categoryField = await createField(category.id, {
    fieldKey: 'dataset_category',
    name: 'Dataset Category',
    description: 'Type and structure of the dataset',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 4
  });

  for (const datasetCategory of datasetConstraints.DATASET_CATEGORIES) {
    await createValue(categoryField.id, {
      valueKey: datasetCategory.value,
      label: datasetCategory.label,
      description: datasetCategory.description,
      icon: datasetCategory.icon,
      isRecommended: true,
      metadata: {
        dataType: datasetCategory.value,
        useCases: getUseCasesForCategory(datasetCategory.value)
      }
    });
  }

  console.log('✅ Dataset constraints populated');
}

async function populateContractConstraints() {
  console.log('📄 Populating contract constraints...');
  
  const category = await ConstraintCategory.findOne({ where: { categoryKey: 'contracts' } });
  if (!category) {
    console.error('❌ Contract category not found');
    return;
  }

  // Contract Statuses
  const statusField = await createField(category.id, {
    fieldKey: 'status',
    name: 'Contract Status',
    description: 'Current status of the contract in the workflow',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 1
  });

  for (const status of contractConstraints.CONTRACT_STATUSES) {
    await createValue(statusField.id, {
      valueKey: status.value,
      label: status.label,
      description: status.description,
      icon: status.icon,
      color: status.color,
      metadata: {
        canEdit: status.canEdit,
        canSign: status.canSign,
        nextStatus: status.nextStatus
      }
    });
  }

  // Contract Template Categories
  const templateField = await createField(category.id, {
    fieldKey: 'template_category',
    name: 'Template Category',
    description: 'Category of contract template',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 2
  });

  for (const template of contractConstraints.CONTRACT_TEMPLATE_CATEGORIES) {
    await createValue(templateField.id, {
      valueKey: template.value,
      label: template.label,
      description: template.description,
      icon: template.icon,
      color: template.color,
      metadata: {
        duration: template.duration,
        pricing: template.pricing
      }
    });
  }

  console.log('✅ Contract constraints populated');
}

async function populateCCRPConstraints() {
  console.log('🏢 Populating CCRP constraints...');
  
  const category = await ConstraintCategory.findOne({ where: { categoryKey: 'ccrp' } });
  if (!category) {
    console.error('❌ CCRP category not found');
    return;
  }

  // Cloud Providers
  const cloudProviderField = await createField(category.id, {
    fieldKey: 'cloud_provider',
    name: 'Cloud Provider',
    description: 'Cloud platform for infrastructure deployment',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 1
  });

  for (const provider of ccrpConstraints.CLOUD_PROVIDERS) {
    await createValue(cloudProviderField.id, {
      valueKey: provider.value,
      label: provider.label,
      description: provider.description,
      icon: provider.icon,
      metadata: {
        regions: provider.regions,
        features: provider.features,
        compliance: provider.compliance
      }
    });
  }

  // VM Sizes (for each cloud provider)
  const vmSizeField = await createField(category.id, {
    fieldKey: 'vm_size',
    name: 'VM Size',
    description: 'Virtual machine instance size',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 2,
    metadata: {
      dependsOn: 'cloud_provider'
    }
  });

  // Add VM sizes for each cloud provider
  for (const [provider, sizes] of Object.entries(ccrpConstraints.CLOUD_VM_SIZES)) {
    for (const size of sizes) {
      await createValue(vmSizeField.id, {
        valueKey: size.value,
        label: size.label,
        description: size.description,
        metadata: {
          cloudProvider: provider,
          vcpus: size.vcpus,
          memory: size.memory,
          category: size.category,
          cost: size.cost
        }
      });
    }
  }

  console.log('✅ CCRP constraints populated');
}

async function populateTDCConstraints() {
  console.log('🤖 Populating TDC constraints...');
  
  const category = await ConstraintCategory.findOne({ where: { categoryKey: 'tdc' } });
  if (!category) {
    console.error('❌ TDC category not found');
    return;
  }

  // AI Model Types
  const modelTypeField = await createField(category.id, {
    fieldKey: 'model_type',
    name: 'AI Model Type',
    description: 'Type of AI model architecture',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 1
  });

  for (const modelType of tdcConstraints.AI_MODEL_TYPES) {
    await createValue(modelTypeField.id, {
      valueKey: modelType.value,
      label: modelType.label,
      description: modelType.description,
      icon: modelType.icon,
      metadata: {
        category: modelType.category,
        complexity: modelType.complexity,
        useCases: modelType.useCases
      }
    });
  }

  // AI Frameworks
  const frameworkField = await createField(category.id, {
    fieldKey: 'framework',
    name: 'AI Framework',
    description: 'Machine learning framework',
    fieldType: 'select',
    isRequired: true,
    displayOrder: 2
  });

  for (const framework of tdcConstraints.AI_FRAMEWORKS) {
    await createValue(frameworkField.id, {
      valueKey: framework.value,
      label: framework.label,
      description: framework.description,
      icon: framework.icon,
      metadata: {
        language: framework.language,
        popularity: framework.popularity,
        features: framework.features
      }
    });
  }

  console.log('✅ TDC constraints populated');
}

async function createField(categoryId, fieldData) {
  const [field, created] = await ConstraintField.findOrCreate({
    where: { 
      categoryId: categoryId,
      fieldKey: fieldData.fieldKey 
    },
    defaults: fieldData
  });
  
  if (created) {
    console.log(`  ✅ Created field: ${field.name}`);
  }
  
  return field;
}

async function createValue(fieldId, valueData) {
  const [value, created] = await ConstraintValue.findOrCreate({
    where: { 
      fieldId: fieldId,
      valueKey: valueData.valueKey 
    },
    defaults: valueData
  });
  
  if (created) {
    console.log(`    ✅ Created value: ${value.label}`);
  }
  
  return value;
}

// Helper function to get use cases for dataset categories
function getUseCasesForCategory(category) {
  const useCases = {
    'Computer Vision': ['Object Detection', 'Image Classification', 'Medical Diagnosis', 'Quality Control'],
    'Natural Language Processing': ['Sentiment Analysis', 'Language Translation', 'Chatbots', 'Text Summarization'],
    'Tabular': ['Fraud Detection', 'Customer Analytics', 'Predictive Modeling', 'Risk Assessment'],
    'Audio': ['Speech Recognition', 'Audio Classification', 'Music Analysis', 'Voice Authentication'],
    'Multimodal': ['Video Analysis', 'Document Understanding', 'Advanced AI Models', 'Cross-modal Learning'],
    'Time Series': ['Forecasting', 'Anomaly Detection', 'Trend Analysis', 'Pattern Recognition'],
    'Graph': ['Network Analysis', 'Recommendation Systems', 'Fraud Detection', 'Knowledge Graphs']
  };
  return useCases[category] || [];
}

// Run the population if this script is executed directly
if (require.main === module) {
  populateConstraints()
    .then(() => {
      console.log('🎉 Constraint population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Constraint population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateConstraints };
