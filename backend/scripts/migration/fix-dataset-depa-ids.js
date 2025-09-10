/**
 * Migration Script: Fix Dataset DEPA IDs
 * 
 * This script fixes datasets that were incorrectly assigned CONTRACT entity type
 * in their DEPA IDs and updates them to use the proper DATASET entity type.
 * 
 * Format changes:
 * - From: US-EAST-CONTRACT-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
 * - To:   US-EAST-DATASET-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
 */

const { v4: uuidv4 } = require('uuid');

// Initialize models
const { Dataset } = require('../../models');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Fix dataset DEPA IDs that use CONTRACT entity type
 */
async function fixDatasetDEPAIds() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}🔧 FIXING DATASET DEPA IDs${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    logSuccess('Starting migration...');
    
    // Find datasets with CONTRACT entity type in DEPA ID
    const datasetsWithContractDEPAIds = await Dataset.findAll({
      where: {
        isActive: true,
        depaId: {
          [require('sequelize').Op.like]: '%-CONTRACT-%'
        }
      },
      attributes: ['id', 'name', 'depaId']
    });
    
    logInfo(`Found ${datasetsWithContractDEPAIds.length} datasets with CONTRACT entity type in DEPA ID`);
    
    if (datasetsWithContractDEPAIds.length === 0) {
      logSuccess('No datasets found with CONTRACT entity type in DEPA ID');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const dataset of datasetsWithContractDEPAIds) {
      try {
        log(`🔧 Processing dataset: ${dataset.name} (ID: ${dataset.id})`);
        log(`   Current DEPA ID: ${dataset.depaId}`);
        
        // Extract the GUID from the current DEPA ID
        const currentDEPAId = dataset.depaId;
        const guidMatch = currentDEPAId.match(/-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
        
        if (!guidMatch) {
          logError(`Invalid DEPA ID format for dataset ${dataset.name}: ${currentDEPAId}`);
          errorCount++;
          continue;
        }
        
        const guid = guidMatch[1];
        
        // Extract deployment prefix (everything before -CONTRACT-)
        const prefixMatch = currentDEPAId.match(/^(.+)-CONTRACT-/);
        const prefix = prefixMatch ? prefixMatch[1] : 'LOCAL';
        
        // Create new DEPA ID with DATASET entity type
        const newDEPAId = `${prefix}-DATASET-${guid}`;
        
        log(`   New DEPA ID: ${newDEPAId}`);
        
        // Update dataset with new DEPA ID
        await dataset.update({ depaId: newDEPAId });
        
        logSuccess(`Fixed DEPA ID for dataset: ${dataset.name}`);
        fixedCount++;
        
      } catch (error) {
        logError(`Failed to fix DEPA ID for dataset ${dataset.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Show summary
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}📊 MIGRATION SUMMARY${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total datasets processed: ${datasetsWithContractDEPAIds.length}`);
    console.log(`${colors.green}Successfully fixed: ${fixedCount}${colors.reset}`);
    console.log(`${colors.red}Errors: ${errorCount}${colors.reset}`);
    
    if (fixedCount > 0) {
      logSuccess('Dataset DEPA IDs have been successfully updated to use DATASET entity type!');
    }
    
    if (errorCount > 0) {
      logWarning(`${errorCount} datasets could not be updated. Please check the logs above.`);
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // No need to close connection as we're using the models directly
  }
}

// Run migration if called directly
if (require.main === module) {
  fixDatasetDEPAIds()
    .then(() => {
      logSuccess('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logError(`Migration failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { fixDatasetDEPAIds };
