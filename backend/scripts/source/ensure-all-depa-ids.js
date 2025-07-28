#!/usr/bin/env node

/**
 * Ensure All DEPA IDs Script
 * 
 * This script ensures all entities (users, datasets, contracts) have DEPA IDs assigned.
 */

const { User, Dataset, Contract } = require('../../models');
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
  console.log(`${colors[color]}[DEPA IDS]${colors.reset} ${message}`);
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

async function ensureAllDEPAIds() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}🆔 ENSURING ALL DEPA IDs${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    // Initialize DEPA ID service
    const depaIdService = new GlobalDEPAIdService();
    
    // Check Users
    console.log(`\n${colors.bold}👥 CHECKING USERS:${colors.reset}`);
    const usersWithoutDEPAIds = await User.count({
      where: {
        isActive: true,
        depaId: null
      }
    });
    
    if (usersWithoutDEPAIds > 0) {
      logWarning(`${usersWithoutDEPAIds} users missing DEPA IDs`);
      
      const usersToUpdate = await User.findAll({
        where: {
          isActive: true,
          depaId: null
        }
      });
      
      for (const user of usersToUpdate) {
        try {
          const depaId = depaIdService.generateGlobalUserDEPAId(user.partyType);
          await user.update({ depaId });
          logSuccess(`Assigned DEPA ID to user: ${user.email}`);
        } catch (error) {
          logError(`Failed to assign DEPA ID to user ${user.email}: ${error.message}`);
        }
      }
    } else {
      logSuccess('All users have DEPA IDs');
    }
    
    // Check Datasets
    console.log(`\n${colors.bold}📊 CHECKING DATASETS:${colors.reset}`);
    const datasetsWithoutDEPAIds = await Dataset.count({
      where: {
        isActive: true,
        depaId: null
      }
    });
    
    if (datasetsWithoutDEPAIds > 0) {
      logWarning(`${datasetsWithoutDEPAIds} datasets missing DEPA IDs`);
      
      const datasetsToUpdate = await Dataset.findAll({
        where: {
          isActive: true,
          depaId: null
        }
      });
      
      for (const dataset of datasetsToUpdate) {
        try {
          const depaId = depaIdService.generateGlobalDEPAId('CONTRACT');
          await dataset.update({ depaId });
          logSuccess(`Assigned DEPA ID to dataset: ${dataset.name}`);
        } catch (error) {
          logError(`Failed to assign DEPA ID to dataset ${dataset.name}: ${error.message}`);
        }
      }
    } else {
      logSuccess('All datasets have DEPA IDs');
    }
    
    // Check Contracts
    console.log(`\n${colors.bold}📄 CHECKING CONTRACTS:${colors.reset}`);
    const contractsWithoutDEPAIds = await Contract.count({
      where: {
        depaId: null
      }
    });
    
    if (contractsWithoutDEPAIds > 0) {
      logWarning(`${contractsWithoutDEPAIds} contracts missing DEPA IDs`);
      
      const contractsToUpdate = await Contract.findAll({
        where: {
          depaId: null
        }
      });
      
      for (const contract of contractsToUpdate) {
        try {
          const depaId = depaIdService.generateGlobalDEPAId('CONTRACT');
          await contract.update({ depaId });
          logSuccess(`Assigned DEPA ID to contract: ${contract.contractId}`);
        } catch (error) {
          logError(`Failed to assign DEPA ID to contract ${contract.contractId}: ${error.message}`);
        }
      }
    } else {
      logSuccess('All contracts have DEPA IDs');
    }
    
    // Final Summary
    console.log(`\n${colors.bold}📊 FINAL SUMMARY:${colors.reset}`);
    console.log('='.repeat(60));
    
    const finalUserCount = await User.count({ where: { isActive: true, depaId: null } });
    const finalDatasetCount = await Dataset.count({ where: { isActive: true, depaId: null } });
    const finalContractCount = await Contract.count({ where: { depaId: null } });
    
    if (finalUserCount === 0 && finalDatasetCount === 0 && finalContractCount === 0) {
      console.log(`${colors.green}${colors.bold}🎉 ALL ENTITIES HAVE DEPA IDs!${colors.reset}`);
    } else {
      console.log(`${colors.yellow}${colors.bold}⚠️  SOME ENTITIES STILL MISSING DEPA IDs:${colors.reset}`);
      if (finalUserCount > 0) console.log(`  Users: ${finalUserCount}`);
      if (finalDatasetCount > 0) console.log(`  Datasets: ${finalDatasetCount}`);
      if (finalContractCount > 0) console.log(`  Contracts: ${finalContractCount}`);
    }
    
    // Show current status
    const totalUsers = await User.count({ where: { isActive: true } });
    const totalDatasets = await Dataset.count({ where: { isActive: true } });
    const totalContracts = await Contract.count();
    
    console.log(`\n${colors.bold}📈 CURRENT STATUS:${colors.reset}`);
    console.log(`  Users: ${totalUsers - finalUserCount}/${totalUsers} with DEPA IDs`);
    console.log(`  Datasets: ${totalDatasets - finalDatasetCount}/${totalDatasets} with DEPA IDs`);
    console.log(`  Contracts: ${totalContracts - finalContractCount}/${totalContracts} with DEPA IDs`);
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  ensureAllDEPAIds();
}

module.exports = { ensureAllDEPAIds }; 