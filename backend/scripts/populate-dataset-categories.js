#!/usr/bin/env node

/**
 * Populate Dataset Categories in Constraint Database
 * 
 * This script populates the constraint management tables with dataset categories
 * using the existing database connection from the running backend.
 */

const db = require('../models');

async function populateDatasetCategories() {
  try {
    console.log('🔄 Starting dataset categories population...');

    // Check if dataset category already exists
    let category = await db.ConstraintCategory.findOne({ 
      where: { categoryKey: 'datasets' } 
    });

    if (!category) {
      console.log('📊 Creating datasets constraint category...');
      category = await db.ConstraintCategory.create({
        categoryKey: 'datasets',
        name: 'Dataset Constraints',
        description: 'Constraints for dataset attributes and security settings',
        icon: '📊',
        color: '#2196F3',
        displayOrder: 1
      });
    }

    // Check if dataset_category field already exists
    let categoryField = await db.ConstraintField.findOne({
      where: { 
        categoryId: category.id,
        fieldKey: 'dataset_category'
      }
    });

    if (!categoryField) {
      console.log('📝 Creating dataset category field...');
      categoryField = await db.ConstraintField.create({
        categoryId: category.id,
        fieldKey: 'dataset_category',
        name: 'Dataset Category',
        description: 'Type and structure of the dataset',
        fieldType: 'select',
        isRequired: true,
        displayOrder: 4
      });
    }

    // Define dataset categories
    const datasetCategories = [
      {
        valueKey: 'Computer Vision',
        label: 'Computer Vision',
        description: 'Images, videos, and visual data',
        icon: '🖼️',
        displayOrder: 1,
        metadata: {
          dataType: 'Computer Vision',
          useCases: ['Object Detection', 'Image Classification', 'Medical Diagnosis', 'Quality Control']
        }
      },
      {
        valueKey: 'Natural Language Processing',
        label: 'Natural Language Processing',
        description: 'Text, speech, and language data',
        icon: '📝',
        displayOrder: 2,
        metadata: {
          dataType: 'Natural Language Processing',
          useCases: ['Sentiment Analysis', 'Language Translation', 'Chatbots', 'Text Summarization']
        }
      },
      {
        valueKey: 'Tabular',
        label: 'Tabular',
        description: 'Structured data in rows and columns',
        icon: '📊',
        displayOrder: 3,
        metadata: {
          dataType: 'Tabular',
          useCases: ['Fraud Detection', 'Customer Analytics', 'Predictive Modeling', 'Risk Assessment']
        }
      },
      {
        valueKey: 'Audio',
        label: 'Audio',
        description: 'Sound and audio data',
        icon: '🎵',
        displayOrder: 4,
        metadata: {
          dataType: 'Audio',
          useCases: ['Speech Recognition', 'Audio Classification', 'Music Analysis', 'Voice Authentication']
        }
      },
      {
        valueKey: 'Multimodal',
        label: 'Multimodal',
        description: 'Combination of different data types',
        icon: '🔀',
        displayOrder: 5,
        metadata: {
          dataType: 'Multimodal',
          useCases: ['Video Analysis', 'Document Understanding', 'Advanced AI Models', 'Cross-modal Learning']
        }
      },
      {
        valueKey: 'Time Series',
        label: 'Time Series',
        description: 'Data points indexed by time',
        icon: '📈',
        displayOrder: 6,
        metadata: {
          dataType: 'Time Series',
          useCases: ['Forecasting', 'Anomaly Detection', 'Trend Analysis', 'Pattern Recognition']
        }
      },
      {
        valueKey: 'Graph',
        label: 'Graph',
        description: 'Network and relationship data',
        icon: '🕸️',
        displayOrder: 7,
        metadata: {
          dataType: 'Graph',
          useCases: ['Network Analysis', 'Recommendation Systems', 'Fraud Detection', 'Knowledge Graphs']
        }
      }
    ];

    // Create or update dataset category values
    for (const categoryData of datasetCategories) {
      const [value, created] = await db.ConstraintValue.findOrCreate({
        where: {
          fieldId: categoryField.id,
          valueKey: categoryData.valueKey
        },
        defaults: {
          ...categoryData,
          isActive: true,
          isRecommended: true
        }
      });

      if (!created) {
        // Update existing value
        await value.update({
          label: categoryData.label,
          description: categoryData.description,
          icon: categoryData.icon,
          displayOrder: categoryData.displayOrder,
          metadata: categoryData.metadata,
          isActive: true,
          isRecommended: true
        });
      }

      console.log(`${created ? '✅ Created' : '📋 Updated'} category: ${categoryData.label}`);
    }

    console.log('🎉 Dataset categories population completed successfully!');
  } catch (error) {
    console.error('❌ Error populating dataset categories:', error);
    throw error;
  }
}

// Run the population if this script is called directly
if (require.main === module) {
  populateDatasetCategories()
    .then(() => {
      console.log('🎉 Dataset categories population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dataset categories population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateDatasetCategories };
