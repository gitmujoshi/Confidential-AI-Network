#!/usr/bin/env node

/**
 * Comprehensive Health Check Script
 * 
 * This script validates all services and their configurations to prevent
 * authentication regressions and ensure the system is always in a working state.
 */

const axios = require('axios');
const { User, Dataset, AIModel } = require('../models');
const { Sequelize } = require('sequelize');

// Configuration
const SERVICES = {
  ***REMOVED-KEYCLOAK_DB_PASSWORD***: { url: 'http://localhost:8080', name: 'Keycloak' },
  backend: { url: 'http://localhost:5001/health', name: 'Backend API' },
  frontend: { url: 'http://localhost:3000', name: 'Frontend' },
  database: { name: 'PostgreSQL Database' }
};

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
  console.log(`${colors[color]}[HEALTH CHECK]${colors.reset} ${message}`);
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

async function checkServiceHealth(service) {
  try {
    const response = await axios.get(service.url, { 
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });
    logSuccess(`${service.name} is running (${response.status})`);
    return true;
  } catch (error) {
    logError(`${service.name} is not responding: ${error.message}`);
    return false;
  }
}

async function checkDatabaseConnection() {
  try {
    const sequelize = require('../models').sequelize;
    await sequelize.authenticate();
    logSuccess('Database connection is working');
    
    // Check if tables exist and have data
    const userCount = await User.count();
    const datasetCount = await Dataset.count();
    const modelCount = await AIModel.count();
    
    logSuccess(`Database has ${userCount} users, ${datasetCount} datasets, ${modelCount} AI models`);
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function checkKeycloakConfiguration() {
  try {
    // Check if realm exists
    const realmResponse = await axios.get('http://localhost:8080/realms/contract-management');
    logSuccess('Keycloak realm "contract-management" exists');
    
    // Check if client exists
    const clientResponse = await axios.get('http://localhost:8080/realms/contract-management/clients', {
      headers: { 'Authorization': `Bearer ${await getKeycloakAdminToken()}` }
    });
    
    const client = clientResponse.data.find(c => c.clientId === 'contract-management-client');
    if (client) {
      logSuccess('Keycloak client "contract-management-client" exists');
    } else {
      logError('Keycloak client "contract-management-client" not found');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Keycloak configuration check failed: ${error.message}`);
    return false;
  }
}

async function getKeycloakAdminToken() {
  try {
    const response = await axios.post('http://localhost:8080/realms/master/protocol/openid-connect/token', 
      'grant_type=password&client_id=admin-cli&username=admin&password=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to get Keycloak admin token: ${error.message}`);
  }
}

async function checkUserSync() {
  try {
    // Check database users
    const dbUsers = await User.findAll({
      where: { isActive: true },
      attributes: ['id', 'email', 'iamUserId', 'iamUsername', 'depaId']
    });
    
    logSuccess(`Database has ${dbUsers.length} active users`);
    
    // Check for users without Keycloak sync
    const unsyncedUsers = dbUsers.filter(user => !user.iamUserId || !user.iamUsername);
    if (unsyncedUsers.length > 0) {
      logWarning(`${unsyncedUsers.length} users not synced with Keycloak:`);
      unsyncedUsers.forEach(user => {
        logWarning(`  - ${user.email} (ID: ${user.id})`);
      });
      return false;
    }
    
    logSuccess('All users are synced with Keycloak');
    return true;
  } catch (error) {
    logError(`User sync check failed: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  try {
    const testUser = await User.findOne({
      where: { email: 'tdc.healthcare@example.com', isActive: true }
    });
    
    if (!testUser) {
      logError('Test user tdc.healthcare@example.com not found');
      return false;
    }
    
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'tdc.healthcare@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.accessToken) {
      logSuccess('Authentication test passed - login working');
      return true;
    } else {
      logError('Authentication test failed - no access token returned');
      return false;
    }
  } catch (error) {
    logError(`Authentication test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function checkDEPAIds() {
  try {
    const { User, Dataset, Contract } = require('../models');
    
    // Check users
    const usersWithoutDEPAIds = await User.count({
      where: { isActive: true, depaId: null }
    });
    
    // Check datasets
    const datasetsWithoutDEPAIds = await Dataset.count({
      where: { isActive: true, depaId: null }
    });
    
    // Check contracts
    const contractsWithoutDEPAIds = await Contract.count({
      where: { depaId: null }
    });
    
    const totalMissing = usersWithoutDEPAIds + datasetsWithoutDEPAIds + contractsWithoutDEPAIds;
    
    if (totalMissing === 0) {
      logSuccess('All entities have DEPA IDs assigned');
      return true;
    } else {
      logWarning(`${totalMissing} entities missing DEPA IDs:`);
      if (usersWithoutDEPAIds > 0) logWarning(`  Users: ${usersWithoutDEPAIds}`);
      if (datasetsWithoutDEPAIds > 0) logWarning(`  Datasets: ${datasetsWithoutDEPAIds}`);
      if (contractsWithoutDEPAIds > 0) logWarning(`  Contracts: ${contractsWithoutDEPAIds}`);
      return false;
    }
  } catch (error) {
    logError(`DEPA ID check failed: ${error.message}`);
    return false;
  }
}

async function runHealthCheck() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}🔍 COMPREHENSIVE HEALTH CHECK${colors.reset}`);
  console.log('='.repeat(60));
  
  const results = {
    services: {},
    database: false,
    ***REMOVED-KEYCLOAK_DB_PASSWORD***: false,
    userSync: false,
    authentication: false
  };
  
  // Check service health
  console.log(`\n${colors.bold}📡 Service Health Checks:${colors.reset}`);
  for (const [key, service] of Object.entries(SERVICES)) {
    if (key === 'database') {
      results.database = await checkDatabaseConnection();
    } else {
      results.services[key] = await checkServiceHealth(service);
    }
  }
  
  // Check Keycloak configuration
  console.log(`\n${colors.bold}🔐 Keycloak Configuration:${colors.reset}`);
  results.***REMOVED-KEYCLOAK_DB_PASSWORD*** = await checkKeycloakConfiguration();
  
  // Check user synchronization
  console.log(`\n${colors.bold}👥 User Synchronization:${colors.reset}`);
  results.userSync = await checkUserSync();
  
  // Test authentication
  console.log(`\n${colors.bold}🔑 Authentication Test:${colors.reset}`);
  results.authentication = await testAuthentication();
  
  // Check DEPA IDs
  console.log(`\n${colors.bold}🆔 DEPA ID Check:${colors.reset}`);
  results.depaIds = await checkDEPAIds();
  
  // Summary
  console.log(`\n${colors.bold}📊 HEALTH CHECK SUMMARY:${colors.reset}`);
  console.log('='.repeat(60));
  
  const allServicesWorking = Object.values(results.services).every(Boolean);
  const allChecksPassed = Object.values(results).every(Boolean);
  
  if (allServicesWorking) {
    logSuccess('All services are running');
  } else {
    logError('Some services are not running');
  }
  
  if (results.database) {
    logSuccess('Database is healthy');
  } else {
    logError('Database has issues');
  }
  
  if (results.***REMOVED-KEYCLOAK_DB_PASSWORD***) {
    logSuccess('Keycloak is properly configured');
  } else {
    logError('Keycloak configuration issues detected');
  }
  
  if (results.userSync) {
    logSuccess('Users are properly synced');
  } else {
    logError('User synchronization issues detected');
  }
  
  if (results.authentication) {
    logSuccess('Authentication is working');
  } else {
    logError('Authentication is not working');
  }
  
  if (results.depaIds) {
    logSuccess('All entities have DEPA IDs');
  } else {
    logError('Some entities missing DEPA IDs');
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allChecksPassed) {
    console.log(`${colors.green}${colors.bold}🎉 ALL SYSTEMS OPERATIONAL${colors.reset}`);
    console.log(`${colors.green}Your Contract Management System is fully functional!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}⚠️  ISSUES DETECTED${colors.reset}`);
    console.log(`${colors.yellow}Run the setup script to fix issues:${colors.reset}`);
    console.log(`${colors.blue}  node scripts/setup-complete-system.js${colors.reset}`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  return allChecksPassed;
}

// Run the health check
if (require.main === module) {
  runHealthCheck()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Health check failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runHealthCheck }; 