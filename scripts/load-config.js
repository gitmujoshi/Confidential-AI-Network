#!/usr/bin/env node

/**
 * Centralized Configuration Loader for Node.js
 * Loads both config.env and secrets.env for consistent configuration across all Node.js scripts and services
 */

const fs = require('fs');
const path = require('path');

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

// Function to parse .env file
function parseEnvFile(filePath) {
  const config = {};
  
  if (!fs.existsSync(filePath)) {
    return config;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Parse key=value pairs
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      config[key] = cleanValue;
    }
  }
  
  return config;
}

// Function to load configuration
function loadConfig() {
  let configLoaded = false;
  let secretsLoaded = false;
  
  // Load main configuration
  const configPath = path.join(process.cwd(), 'config.env');
  if (fs.existsSync(configPath)) {
    const config = parseEnvFile(configPath);
    Object.assign(process.env, config);
    configLoaded = true;
    log('✅ Loaded main configuration from config.env', 'green');
  } else {
    log('❌ config.env not found', 'red');
    return false;
  }
  
  // Load secrets configuration
  const secretsPath = path.join(process.cwd(), 'secrets.env');
  if (fs.existsSync(secretsPath)) {
    const secrets = parseEnvFile(secretsPath);
    Object.assign(process.env, secrets);
    secretsLoaded = true;
    log('✅ Loaded secrets from secrets.env', 'green');
  } else {
    log('⚠️ secrets.env not found - using default values', 'yellow');
  }
  
  // Set default values for missing secrets
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || '***REMOVED-DB_PASSWORD***';
  process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || '***REMOVED-DB_PASSWORD***';
  process.env.KEYCLOAK_DB_PASSWORD = process.env.KEYCLOAK_DB_PASSWORD || '***REMOVED-KEYCLOAK_DB_PASSWORD***';
  process.env.JWT_SECRET = process.env.JWT_SECRET || '***REMOVED-JWT_SECRET***';
  process.env.KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '***REMOVED-KEYCLOAK_CLIENT_SECRET***';
  process.env.KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
  process.env.EMAIL_PASS = process.env.EMAIL_PASS || '***REMOVED-EMAIL_PASS***';
  process.env.VAULT_TOKEN = process.env.VAULT_TOKEN || '***REMOVED-VAULT_TOKEN***';
  
  // Set derived configuration values
  process.env.BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`;
  process.env.KEYCLOAK_URL = process.env.KEYCLOAK_URL || `https://localhost:${process.env.KEYCLOAK_PORT || 8443}`;
  
  return configLoaded;
}

// Function to validate required configuration
function validateConfig() {
  const requiredVars = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'PORT', 'NODE_ENV',
    'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID',
    'BACKEND_URL', 'FRONTEND_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log('❌ Missing required configuration variables:', 'red');
    missingVars.forEach(varName => log(`  - ${varName}`, 'red'));
    return false;
  }
  
  log('✅ Configuration validation passed', 'green');
  return true;
}

// Function to show current configuration (without secrets)
function showConfig() {
  log('📋 Current Configuration:', 'blue');
  log('==================================', 'cyan');
  log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, 'cyan');
  log(`Backend: ${process.env.BACKEND_URL}`, 'cyan');
  log(`Frontend: ${process.env.FRONTEND_URL}`, 'cyan');
  log(`Keycloak: ${process.env.KEYCLOAK_URL}/${process.env.KEYCLOAK_REALM}`, 'cyan');
  log(`SCITT CCF: ${process.env.SCITT_CCF_ENABLED || 'false'} (${process.env.SCITT_CCF_URL || 'N/A'})`, 'cyan');
  log(`Blockchain: ${process.env.BLOCKCHAIN_ENABLED || 'false'}`, 'cyan');
  log(`DEPA: ${process.env.DEPA_ENABLED || 'false'}`, 'cyan');
  log(`Environment: ${process.env.NODE_ENV}`, 'cyan');
  log('==================================', 'cyan');
}

// Main execution
if (require.main === module) {
  // If script is run directly, load and validate config
  const loaded = loadConfig();
  if (loaded) {
    validateConfig();
    showConfig();
  } else {
    process.exit(1);
  }
}

module.exports = {
  loadConfig,
  validateConfig,
  showConfig
};
