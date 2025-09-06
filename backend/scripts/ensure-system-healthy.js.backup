#!/usr/bin/env node

/**
 * Ensure System Healthy Script
 * 
 * This script ensures the entire system is in a working state and prevents
 * authentication regressions by running all necessary setup steps in the correct order.
 */

const { execSync } = require('child_process');
const { runHealthCheck } = require('./health-check');

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
  console.log(`${colors[color]}[SETUP]${colors.reset} ${message}`);
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

function runCommand(command, description) {
  try {
    log(`Running: ${description}`);
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    logSuccess(`${description} completed`);
    return true;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return false;
  }
}

async function ensureServicesRunning() {
  console.log(`\n${colors.bold}🚀 STEP 1: Ensuring Services Are Running${colors.reset}`);
  
  // Check if services are running
  const healthCheck = await runHealthCheck();
  
  if (healthCheck) {
    logSuccess('All services are already healthy!');
    return true;
  }
  
  logWarning('Some services are not healthy. Starting services...');
  
  // Start services using the deployment script
  const servicesStarted = runCommand(
    'cd ../deployment/local && ./start-services.sh',
    'Starting all services'
  );
  
  if (!servicesStarted) {
    logError('Failed to start services');
    return false;
  }
  
  // Wait a bit for services to fully start
  log('Waiting for services to fully start...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  return true;
}

async function ensureKeycloakConfigured() {
  console.log(`\n${colors.bold}🔐 STEP 2: Ensuring Keycloak Configuration${colors.reset}`);
  
  return runCommand(
    'node scripts/source/setup-keycloak-realm.js',
    'Setting up Keycloak realm and client'
  );
}

async function ensureUsersSynced() {
  console.log(`\n${colors.bold}👥 STEP 3: Ensuring User Synchronization${colors.reset}`);
  
  return runCommand(
    'node scripts/source/create-keycloak-users.js',
    'Creating and syncing users with Keycloak'
  );
}

async function ensureDEPAIds() {
  console.log(`\n${colors.bold}🆔 STEP 4: Ensuring DEPA IDs${colors.reset}`);
  
  return runCommand(
    'node scripts/source/ensure-all-depa-ids.js',
    'Assigning DEPA IDs to all entities'
  );
}

async function ensureTestData() {
  console.log(`\n${colors.bold}📊 STEP 5: Ensuring Test Data${colors.reset}`);
  
  const steps = [
    {
      command: 'node scripts/source/create-sample-datasets.js',
      description: 'Creating sample datasets'
    },
    {
      command: 'node scripts/source/create-sample-models.js',
      description: 'Creating sample AI models'
    }
  ];
  
  for (const step of steps) {
    const success = runCommand(step.command, step.description);
    if (!success) {
      logWarning(`${step.description} failed, but continuing...`);
    }
  }
  
  return true;
}

async function finalHealthCheck() {
  console.log(`\n${colors.bold}🔍 STEP 6: Final Health Check${colors.reset}`);
  
  // Wait a bit for everything to settle
  log('Waiting for system to stabilize...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const healthy = await runHealthCheck();
  
  if (healthy) {
    console.log(`\n${colors.green}${colors.bold}🎉 SYSTEM IS NOW HEALTHY!${colors.reset}`);
    console.log(`${colors.green}Your Contract Management System is fully operational.${colors.reset}`);
    console.log(`\n${colors.blue}📋 Quick Reference:${colors.reset}`);
    console.log(`  Frontend: http://localhost:3000`);
    console.log(`  Backend API: http://localhost:5001`);
    console.log(`  Keycloak Admin: http://localhost:8080 (admin/admin123)`);
    console.log(`\n${colors.blue}🔐 Test Credentials:${colors.reset}`);
    console.log(`  TDC: tdc.healthcare@example.com / password123`);
    console.log(`  TDP: tdp.medical@example.com / password123`);
    console.log(`  CCRP: ccrp.securecloud@example.com / password123`);
  } else {
    console.log(`\n${colors.red}${colors.bold}⚠️  SYSTEM STILL HAS ISSUES${colors.reset}`);
    console.log(`${colors.yellow}Please check the logs above and try again.${colors.reset}`);
  }
  
  return healthy;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}🛠️  ENSURING SYSTEM HEALTH${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.blue}This script will ensure your system is in a working state${colors.reset}`);
  console.log(`${colors.blue}and prevent authentication regressions.${colors.reset}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Step 1: Ensure services are running
    const servicesOk = await ensureServicesRunning();
    if (!servicesOk) {
      logError('Failed to start services. Exiting.');
      process.exit(1);
    }
    
    // Step 2: Ensure Keycloak is configured
    const keycloakOk = await ensureKeycloakConfigured();
    if (!keycloakOk) {
      logError('Failed to configure Keycloak. Exiting.');
      process.exit(1);
    }
    
    // Step 3: Ensure users are synced
    const usersOk = await ensureUsersSynced();
    if (!usersOk) {
      logError('Failed to sync users. Exiting.');
      process.exit(1);
    }
    
    // Step 4: Ensure DEPA IDs
    const depaIdsOk = await ensureDEPAIds();
    if (!depaIdsOk) {
      logError('Failed to assign DEPA IDs. Exiting.');
      process.exit(1);
    }
    
    // Step 5: Ensure test data exists
    await ensureTestData();
    
    // Step 6: Final health check
    const healthy = await finalHealthCheck();
    
    console.log('\n' + '='.repeat(60));
    if (healthy) {
      console.log(`${colors.green}${colors.bold}✅ SYSTEM HEALTH ENSURED${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}${colors.bold}❌ SYSTEM HEALTH NOT ACHIEVED${colors.reset}`);
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { main }; 