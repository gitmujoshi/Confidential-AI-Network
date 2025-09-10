#!/usr/bin/env node

/**
 * Assign DEPA IDs to Datasets Script
 * 
 * This script assigns DEPA IDs to existing datasets that don't have them.
 */

const { Dataset, User } = require('../../models');
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
  console.log(`${colors[color]}[DATASET DEPA]${colors.reset} ${message}`);
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

async function assignDatasetDEPAIds() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}📊 ASSIGNING DEPA IDs TO DATASETS${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    // Initialize DEPA ID service
    const depaIdService = new GlobalDEPAIdService();
    
    // Get datasets without DEPA IDs
    const datasetsWithoutDEPAIds = await Dataset.findAll({
      where: {
        isActive: true,
        depaId: null
      },
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'partyType']
      }]
    });
    
    log(`Found ${datasetsWithoutDEPAIds.length} datasets without DEPA IDs`);
    
    if (datasetsWithoutDEPAIds.length === 0) {
      logSuccess('All datasets already have DEPA IDs assigned');
      return;
    }
    
    for (const dataset of datasetsWithoutDEPAIds) {
      try {
        log(`📊 Processing dataset: ${dataset.name} (ID: ${dataset.id})`);
        
        // Generate DEPA ID for dataset using DATASET entity type
        const depaId = depaIdService.generateGlobalDEPAId('DATASET');
        
        // Update dataset with DEPA ID
        await dataset.update({ depaId });
        
        logSuccess(`Assigned DEPA ID ${depaId} to dataset: ${dataset.name}`);
        
      } catch (error) {
        logError(`Failed to assign DEPA ID to dataset ${dataset.name}: ${error.message}`);
      }
    }
    
    // Verify all datasets now have DEPA IDs
    const datasetsStillWithoutDEPAIds = await Dataset.count({
      where: {
        isActive: true,
        depaId: null
      }
    });
    
    console.log('\n' + '='.repeat(60));
    if (datasetsStillWithoutDEPAIds === 0) {
      console.log(`${colors.green}${colors.bold}🎉 ALL DATASETS NOW HAVE DEPA IDs!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${colors.bold}⚠️  ${datasetsStillWithoutDEPAIds} DATASETS STILL MISSING DEPA IDs${colors.reset}`);
    }
    console.log('='.repeat(60) + '\n');
    
    // Show final status
    const allDatasets = await Dataset.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'depaId'],
      order: [['id', 'ASC']]
    });
    
    console.log(`${colors.bold}📊 FINAL DATASET STATUS:${colors.reset}`);
    allDatasets.forEach(dataset => {
      const status = dataset.depaId ? '✅' : '❌';
      console.log(`${status} ${dataset.name} (ID: ${dataset.id}) - DEPA ID: ${dataset.depaId || 'MISSING'}`);
    });
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  assignDatasetDEPAIds();
}

module.exports = { assignDatasetDEPAIds }; 