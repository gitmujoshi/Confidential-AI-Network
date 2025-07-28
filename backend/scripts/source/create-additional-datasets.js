#!/usr/bin/env node

/**
 * Create Additional Datasets Script
 * 
 * This script creates additional datasets for existing TDPs.
 */

const { User, Dataset } = require('../../models');
const GlobalDEPAIdService = require('../../services/globalDEPAIdService');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[ADDITIONAL DATASETS]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

const additionalDatasets = [
  {
    tdpEmail: 'tdp.airesearch@example.com',
    datasets: [
      {
        name: 'Computer Vision Dataset',
        description: 'Large-scale image dataset for computer vision training',
        category: 'Computer Vision',
        size: 15200, // Size in MB
        recordCount: 500000,
        price: 2500.00,
        license: 'Commercial',
        tags: ['computer-vision', 'images', 'deep-learning'],
        isPublic: true
      },
      {
        name: 'Natural Language Processing Corpus',
        description: 'Comprehensive text corpus for NLP model training',
        category: 'Natural Language Processing',
        size: 8700, // Size in MB
        recordCount: 2000000,
        price: 1800.00,
        license: 'Academic',
        tags: ['nlp', 'text-processing', 'language-models'],
        isPublic: true
      }
    ]
  },
  {
    tdpEmail: 'tdp.biotech@example.com',
    datasets: [
      {
        name: 'Genomic Sequencing Data',
        description: 'High-quality genomic sequencing data for research',
        category: 'Tabular',
        size: 25800, // Size in MB
        recordCount: 10000,
        price: 5000.00,
        license: 'Research',
        tags: ['genomics', 'dna', 'biotech'],
        isPublic: false
      },
      {
        name: 'Drug Discovery Compounds',
        description: 'Chemical compound database for drug discovery',
        category: 'Tabular',
        size: 12300, // Size in MB
        recordCount: 50000,
        price: 3200.00,
        license: 'Commercial',
        tags: ['drug-discovery', 'chemistry', 'pharmaceuticals'],
        isPublic: false
      }
    ]
  },
  {
    tdpEmail: 'tdp.financial@example.com',
    datasets: [
      {
        name: 'Stock Market Historical Data',
        description: 'Comprehensive historical stock market data',
        category: 'Tabular',
        size: 18500, // Size in MB
        recordCount: 1000000,
        price: 2800.00,
        license: 'Commercial',
        tags: ['finance', 'stocks', 'trading'],
        isPublic: true
      },
      {
        name: 'Credit Risk Assessment Data',
        description: 'Credit scoring and risk assessment datasets',
        category: 'Tabular',
        size: 9200, // Size in MB
        recordCount: 300000,
        price: 1500.00,
        license: 'Commercial',
        tags: ['credit-risk', 'banking', 'risk-assessment'],
        isPublic: false
      }
    ]
  },
  {
    tdpEmail: 'tdp.autonomous@example.com',
    datasets: [
      {
        name: 'Lidar Point Cloud Data',
        description: 'High-resolution lidar data for autonomous driving',
        category: 'Computer Vision',
        size: 45700, // Size in MB
        recordCount: 50000,
        price: 7500.00,
        license: 'Commercial',
        tags: ['autonomous-driving', 'lidar', 'transportation'],
        isPublic: false
      },
      {
        name: 'Traffic Sign Recognition Dataset',
        description: 'Comprehensive traffic sign dataset for ADAS systems',
        category: 'Computer Vision',
        size: 6800, // Size in MB
        recordCount: 150000,
        price: 1200.00,
        license: 'Commercial',
        tags: ['traffic-signs', 'adas', 'computer-vision'],
        isPublic: true
      }
    ]
  }
];

async function createAdditionalDatasets() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}📊 CREATING ADDITIONAL DATASETS${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    const depaIdService = new GlobalDEPAIdService();
    
    for (const tdpData of additionalDatasets) {
      try {
        log(`📊 Processing TDP: ${tdpData.tdpEmail}`);
        
        // Find the TDP user
        const tdpUser = await User.findOne({
          where: { email: tdpData.tdpEmail, partyType: 'TDP' }
        });
        
        if (!tdpUser) {
          logError(`TDP ${tdpData.tdpEmail} not found, skipping datasets...`);
          continue;
        }
        
        logSuccess(`Found TDP: ${tdpUser.name}`);
        
        // Create datasets for this TDP
        for (const datasetData of tdpData.datasets) {
          try {
            // Check if dataset already exists
            const existingDataset = await Dataset.findOne({
              where: { 
                name: datasetData.name,
                ownerId: tdpUser.id
              }
            });
            
            if (existingDataset) {
              logWarning(`Dataset ${datasetData.name} already exists for ${tdpUser.name}, skipping...`);
              continue;
            }
            
            const datasetDEPAId = depaIdService.generateGlobalDEPAId('CONTRACT');
            
            const dataset = await Dataset.create({
              datasetId: `DATASET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: datasetData.name,
              description: datasetData.description,
              category: datasetData.category,
              size: datasetData.size,
              recordCount: datasetData.recordCount,
              price: datasetData.price,
              license: datasetData.license,
              tags: datasetData.tags,
              isPublic: datasetData.isPublic,
              isActive: true,
              ownerId: tdpUser.id,
              depaId: datasetDEPAId,
              metadata: {
                source: 'Additional Dataset Creation',
                createdBy: 'script',
                quality: 'high',
                compliance: 'DPDP-ready'
              }
            });
            
            logSuccess(`Created dataset: ${datasetData.name} for ${tdpUser.name}`);
            
          } catch (error) {
            logError(`Failed to create dataset ${datasetData.name}: ${error.message}`);
          }
        }
        
      } catch (error) {
        logError(`Failed to process TDP ${tdpData.tdpEmail}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log(`\n${colors.bold}📊 FINAL SUMMARY:${colors.reset}`);
    console.log('='.repeat(60));
    
    const totalDatasets = await Dataset.count({ where: { isActive: true } });
    const totalTDPs = await User.count({ where: { partyType: 'TDP', isActive: true } });
    
    console.log(`${colors.green}${colors.bold}🎉 ADDITIONAL DATASETS CREATED!${colors.reset}`);
    console.log(`  Total Datasets: ${totalDatasets}`);
    console.log(`  Total TDPs: ${totalTDPs}`);
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createAdditionalDatasets();
}

module.exports = { createAdditionalDatasets }; 