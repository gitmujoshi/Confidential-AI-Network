#!/usr/bin/env node

/**
 * Create Expanded Test Data Script
 * 
 * This script creates additional TDPs, CCRPs, and datasets to expand the test environment.
 */

const { createAdditionalTDPs } = require('./create-additional-tdps');
const { createAdditionalCCRPs } = require('./create-additional-ccrps');

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
  console.log(`${colors[color]}[EXPANDED TEST DATA]${colors.reset} ${message}`);
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

async function createExpandedTestData() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}🚀 CREATING EXPANDED TEST DATA${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.blue}This will add more TDPs, CCRPs, and datasets${colors.reset}`);
  console.log(`${colors.blue}to create a richer testing environment.${colors.reset}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Step 1: Create additional TDPs with datasets
    console.log(`${colors.bold}🏭 STEP 1: Creating Additional TDPs${colors.reset}`);
    await createAdditionalTDPs();
    
    // Step 2: Create additional CCRPs
    console.log(`${colors.bold}🔒 STEP 2: Creating Additional CCRPs${colors.reset}`);
    await createAdditionalCCRPs();
    
    // Step 3: Final summary
    console.log(`${colors.bold}📊 FINAL EXPANDED TEST DATA SUMMARY:${colors.reset}`);
    console.log('='.repeat(60));
    
    const { User, Dataset } = require('../../models');
    
    const totalTDPs = await User.count({ where: { partyType: 'TDP', isActive: true } });
    const totalCCRPs = await User.count({ where: { partyType: 'CCRP', isActive: true } });
    const totalTDCs = await User.count({ where: { partyType: 'TDC', isActive: true } });
    const totalDatasets = await Dataset.count({ where: { isActive: true } });
    
    console.log(`${colors.green}${colors.bold}🎉 EXPANDED TEST DATA CREATED!${colors.reset}`);
    console.log(`  Total TDPs: ${totalTDPs}`);
    console.log(`  Total CCRPs: ${totalCCRPs}`);
    console.log(`  Total TDCs: ${totalTDCs}`);
    console.log(`  Total Datasets: ${totalDatasets}`);
    
    console.log(`\n${colors.blue}📋 New Test Users Created:${colors.reset}`);
    console.log(`  TDPs: AI Research Labs, Biotech Innovations, Financial Analytics Corp, Autonomous Vehicle Data`);
    console.log(`  CCRPs: Quantum Secure Computing, Edge Computing Solutions, Federated Learning Hub, Homomorphic Encryption Labs, Zero-Knowledge Proof Systems, Secure Multi-Party Computation`);
    
    console.log(`\n${colors.blue}📊 New Datasets Created:${colors.reset}`);
    console.log(`  Computer Vision Dataset, NLP Corpus, Genomic Data, Drug Discovery Compounds`);
    console.log(`  Stock Market Data, Credit Risk Data, Lidar Data, Traffic Sign Dataset`);
    
    console.log(`\n${colors.blue}🔐 Login Credentials:${colors.reset}`);
    console.log(`  All new users use password: password123`);
    console.log(`  Example: tdp.airesearch@example.com / password123`);
    console.log(`  Example: ccrp.quantum@example.com / password123`);
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createExpandedTestData();
}

module.exports = { createExpandedTestData }; 