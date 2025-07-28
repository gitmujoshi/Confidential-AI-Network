#!/usr/bin/env node

/**
 * Create Additional TDPs Script
 * 
 * This script creates additional TDP users with their datasets.
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
  console.log(`${colors[color]}[ADDITIONAL TDPS]${colors.reset} ${message}`);
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

const additionalTDPs = [
  {
    name: 'AI Research Labs',
    email: 'tdp.airesearch@example.com',
    description: 'Leading AI research organization specializing in computer vision and NLP',
    organization: 'AI Research Labs Inc.',
    datasets: [
      {
        name: 'Computer Vision Dataset',
        description: 'Large-scale image dataset for computer vision training',
        category: 'Computer Vision',
        size: '15.2GB',
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
        size: '8.7GB',
        recordCount: 2000000,
        price: 1800.00,
        license: 'Academic',
        tags: ['nlp', 'text-processing', 'language-models'],
        isPublic: true
      }
    ]
  },
  {
    name: 'Biotech Innovations',
    email: 'tdp.biotech@example.com',
    description: 'Biotechnology company focused on genomic data and drug discovery',
    organization: 'Biotech Innovations Ltd.',
    datasets: [
      {
        name: 'Genomic Sequencing Data',
        description: 'High-quality genomic sequencing data for research',
        category: 'Healthcare',
        size: '25.8GB',
        recordCount: 10000,
        price: 5000.00,
        license: 'Research',
        tags: ['genomics', 'dna', 'biotech'],
        isPublic: false
      },
      {
        name: 'Drug Discovery Compounds',
        description: 'Chemical compound database for drug discovery',
        category: 'Healthcare',
        size: '12.3GB',
        recordCount: 50000,
        price: 3200.00,
        license: 'Commercial',
        tags: ['drug-discovery', 'chemistry', 'pharmaceuticals'],
        isPublic: false
      }
    ]
  },
  {
    name: 'Financial Analytics Corp',
    email: 'tdp.financial@example.com',
    description: 'Financial data provider specializing in market analytics',
    organization: 'Financial Analytics Corporation',
    datasets: [
      {
        name: 'Stock Market Historical Data',
        description: 'Comprehensive historical stock market data',
        category: 'Finance',
        size: '18.5GB',
        recordCount: 1000000,
        price: 2800.00,
        license: 'Commercial',
        tags: ['finance', 'stocks', 'trading'],
        isPublic: true
      },
      {
        name: 'Credit Risk Assessment Data',
        description: 'Credit scoring and risk assessment datasets',
        category: 'Finance',
        size: '9.2GB',
        recordCount: 300000,
        price: 1500.00,
        license: 'Commercial',
        tags: ['credit-risk', 'banking', 'risk-assessment'],
        isPublic: false
      }
    ]
  },
  {
    name: 'Autonomous Vehicle Data',
    email: 'tdp.autonomous@example.com',
    description: 'Provider of autonomous vehicle training data',
    organization: 'Autonomous Vehicle Data Solutions',
    datasets: [
      {
        name: 'Lidar Point Cloud Data',
        description: 'High-resolution lidar data for autonomous driving',
        category: 'Transportation',
        size: '45.7GB',
        recordCount: 50000,
        price: 7500.00,
        license: 'Commercial',
        tags: ['autonomous-driving', 'lidar', 'transportation'],
        isPublic: false
      },
      {
        name: 'Traffic Sign Recognition Dataset',
        description: 'Comprehensive traffic sign dataset for ADAS systems',
        category: 'Transportation',
        size: '6.8GB',
        recordCount: 150000,
        price: 1200.00,
        license: 'Commercial',
        tags: ['traffic-signs', 'adas', 'computer-vision'],
        isPublic: true
      }
    ]
  }
];

async function createAdditionalTDPs() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}🏭 CREATING ADDITIONAL TDPS${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    const depaIdService = new GlobalDEPAIdService();
    
    for (const tdpData of additionalTDPs) {
      try {
        log(`📊 Creating TDP: ${tdpData.name} (${tdpData.email})`);
        
        // Check if user already exists
        const existingUser = await User.findOne({
          where: { email: tdpData.email }
        });
        
        if (existingUser) {
          logWarning(`TDP ${tdpData.email} already exists, skipping...`);
          continue;
        }
        
        // Generate DEPA ID for TDP
        const depaId = depaIdService.generateGlobalUserDEPAId('TDP');
        
        // Create TDP user
        const tdpUser = await User.create({
          name: tdpData.name,
          email: tdpData.email,
          password: 'password123', // Default password
          description: tdpData.description,
          partyType: 'TDP',
          organization: tdpData.organization,
          isActive: true,
          isRegistered: true,
          depaId: depaId,
          iamUsername: tdpData.email.split('@')[0], // Use email prefix as IAM username
          profileCompleted: true,
          emailVerified: true
        });
        
        logSuccess(`Created TDP: ${tdpData.name} with DEPA ID: ${depaId}`);
        
        // Create datasets for this TDP
        for (const datasetData of tdpData.datasets) {
          try {
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
                 source: 'Additional TDP Creation',
                 createdBy: 'script',
                 quality: 'high',
                 compliance: 'DPDP-ready'
               }
             });
            
            logSuccess(`Created dataset: ${datasetData.name} for ${tdpData.name}`);
            
          } catch (error) {
            logError(`Failed to create dataset ${datasetData.name}: ${error.message}`);
          }
        }
        
      } catch (error) {
        logError(`Failed to create TDP ${tdpData.name}: ${error.message}`);
      }
    }
    
    // Final summary
    console.log(`\n${colors.bold}📊 FINAL SUMMARY:${colors.reset}`);
    console.log('='.repeat(60));
    
    const totalTDPs = await User.count({ where: { partyType: 'TDP', isActive: true } });
    const totalDatasets = await Dataset.count({ where: { isActive: true } });
    
    console.log(`${colors.green}${colors.bold}🎉 ADDITIONAL TDPS CREATED!${colors.reset}`);
    console.log(`  Total TDPs: ${totalTDPs}`);
    console.log(`  Total Datasets: ${totalDatasets}`);
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createAdditionalTDPs();
}

module.exports = { createAdditionalTDPs }; 