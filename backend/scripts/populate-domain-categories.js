#!/usr/bin/env node

/**
 * Populate Domain Categories in Constraint Database
 * 
 * This script populates the constraint management tables with domain categories
 * for filtering datasets by industry/domain.
 */

const db = require('../models');

async function populateDomainCategories() {
  try {
    console.log('🔄 Starting domain categories population...');

    // Check if dataset category already exists
    let category = await db.ConstraintCategory.findOne({ 
      where: { categoryKey: 'datasets' } 
    });

    if (!category) {
      console.log('❌ Datasets category not found. Please run dataset categories population first.');
      return;
    }

    // Check if domain_category field already exists
    let domainField = await db.ConstraintField.findOne({
      where: { 
        categoryId: category.id,
        fieldKey: 'domain_category'
      }
    });

    if (!domainField) {
      console.log('🏢 Creating domain category field...');
      domainField = await db.ConstraintField.create({
        categoryId: category.id,
        fieldKey: 'domain_category',
        name: 'Domain Category',
        description: 'Industry or domain category of the dataset',
        fieldType: 'select',
        isRequired: false,
        displayOrder: 5
      });
    }

    // Define domain categories
    const domainCategories = [
      {
        valueKey: 'Healthcare',
        label: 'Healthcare',
        description: 'Medical, pharmaceutical, and health-related data',
        icon: '🏥',
        displayOrder: 1,
        metadata: {
          domain: 'Healthcare',
          useCases: ['Medical Diagnosis', 'Drug Discovery', 'Patient Care', 'Clinical Research'],
          compliance: ['HIPAA', 'FDA', 'GDPR']
        }
      },
      {
        valueKey: 'Finance',
        label: 'Finance',
        description: 'Banking, insurance, and financial services data',
        icon: '🏦',
        displayOrder: 2,
        metadata: {
          domain: 'Finance',
          useCases: ['Fraud Detection', 'Risk Assessment', 'Credit Scoring', 'Trading Analytics'],
          compliance: ['PCI-DSS', 'SOX', 'Basel III', 'GDPR']
        }
      },
      {
        valueKey: 'Retail',
        label: 'Retail & E-commerce',
        description: 'Consumer goods, retail, and e-commerce data',
        icon: '🛒',
        displayOrder: 3,
        metadata: {
          domain: 'Retail',
          useCases: ['Customer Analytics', 'Inventory Management', 'Recommendation Systems', 'Price Optimization'],
          compliance: ['CCPA', 'GDPR', 'PCI-DSS']
        }
      },
      {
        valueKey: 'Manufacturing',
        label: 'Manufacturing',
        description: 'Industrial, manufacturing, and supply chain data',
        icon: '🏭',
        displayOrder: 4,
        metadata: {
          domain: 'Manufacturing',
          useCases: ['Quality Control', 'Predictive Maintenance', 'Supply Chain Optimization', 'Process Automation'],
          compliance: ['ISO-9001', 'ISO-14001', 'IATF-16949']
        }
      },
      {
        valueKey: 'Technology',
        label: 'Technology',
        description: 'Software, IT, and technology sector data',
        icon: '💻',
        displayOrder: 5,
        metadata: {
          domain: 'Technology',
          useCases: ['Software Analytics', 'User Behavior', 'Performance Monitoring', 'Security Analysis'],
          compliance: ['SOC-2', 'ISO-27001', 'GDPR']
        }
      },
      {
        valueKey: 'Education',
        label: 'Education',
        description: 'Educational institutions and learning data',
        icon: '🎓',
        displayOrder: 6,
        metadata: {
          domain: 'Education',
          useCases: ['Learning Analytics', 'Student Performance', 'Curriculum Optimization', 'Research'],
          compliance: ['FERPA', 'COPPA', 'GDPR']
        }
      },
      {
        valueKey: 'Government',
        label: 'Government & Public Sector',
        description: 'Government agencies and public sector data',
        icon: '🏛️',
        displayOrder: 7,
        metadata: {
          domain: 'Government',
          useCases: ['Policy Analysis', 'Citizen Services', 'Public Safety', 'Urban Planning'],
          compliance: ['FedRAMP', 'FISMA', 'NIST', 'GDPR']
        }
      },
      {
        valueKey: 'Energy',
        label: 'Energy & Utilities',
        description: 'Energy, utilities, and environmental data',
        icon: '⚡',
        displayOrder: 8,
        metadata: {
          domain: 'Energy',
          useCases: ['Grid Optimization', 'Renewable Energy', 'Environmental Monitoring', 'Smart Grids'],
          compliance: ['NERC-CIP', 'ISO-50001', 'EPA Regulations']
        }
      },
      {
        valueKey: 'Transportation',
        label: 'Transportation & Logistics',
        description: 'Transportation, logistics, and mobility data',
        icon: '🚚',
        displayOrder: 9,
        metadata: {
          domain: 'Transportation',
          useCases: ['Route Optimization', 'Fleet Management', 'Traffic Analysis', 'Autonomous Vehicles'],
          compliance: ['DOT Regulations', 'ISO-26262', 'GDPR']
        }
      },
      {
        valueKey: 'Agriculture',
        label: 'Agriculture & Food',
        description: 'Agricultural, food production, and farming data',
        icon: '🌾',
        displayOrder: 10,
        metadata: {
          domain: 'Agriculture',
          useCases: ['Crop Monitoring', 'Precision Agriculture', 'Food Safety', 'Supply Chain'],
          compliance: ['FDA', 'USDA', 'Organic Standards', 'HACCP']
        }
      },
      {
        valueKey: 'Media',
        label: 'Media & Entertainment',
        description: 'Media, entertainment, and content creation data',
        icon: '🎬',
        displayOrder: 11,
        metadata: {
          domain: 'Media',
          useCases: ['Content Recommendation', 'Audience Analytics', 'Content Moderation', 'Creative AI'],
          compliance: ['COPPA', 'GDPR', 'Content Regulations']
        }
      },
      {
        valueKey: 'Other',
        label: 'Other',
        description: 'Other domains not specifically categorized',
        icon: '📁',
        displayOrder: 12,
        metadata: {
          domain: 'Other',
          useCases: ['General Analytics', 'Research', 'Custom Applications'],
          compliance: ['GDPR', 'General Data Protection']
        }
      }
    ];

    // Create or update domain category values
    for (const domainData of domainCategories) {
      const [value, created] = await db.ConstraintValue.findOrCreate({
        where: {
          fieldId: domainField.id,
          valueKey: domainData.valueKey
        },
        defaults: {
          ...domainData,
          isActive: true,
          isRecommended: true
        }
      });

      if (!created) {
        // Update existing value
        await value.update({
          label: domainData.label,
          description: domainData.description,
          icon: domainData.icon,
          displayOrder: domainData.displayOrder,
          metadata: domainData.metadata,
          isActive: true,
          isRecommended: true
        });
      }

      console.log(`${created ? '✅ Created' : '📋 Updated'} domain: ${domainData.label}`);
    }

    console.log('🎉 Domain categories population completed successfully!');
  } catch (error) {
    console.error('❌ Error populating domain categories:', error);
    throw error;
  }
}

// Run the population if this script is called directly
if (require.main === module) {
  populateDomainCategories()
    .then(() => {
      console.log('🎉 Domain categories population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Domain categories population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateDomainCategories };
