#!/usr/bin/env node

/**
 * Centralized Configuration Loader for Node.js
 * Loads both config.env and secrets.env for consistent configuration across all scripts and services
 * This mirrors the functionality of scripts/load-config.sh for Node.js applications
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

/**
 * Parse environment file and return key-value pairs
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      return;
    }

    // Parse KEY=VALUE format
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });

  return env;
}

/**
 * Load configuration from config.env and secrets.env
 */
function loadConfig(options = {}) {
  const { verbose = false, rootDir = process.cwd() } = options;
  
  const configPath = path.join(rootDir, 'config.env');
  const secretsPath = path.join(rootDir, 'secrets.env');
  
  let configLoaded = false;
  let secretsLoaded = false;
  
  // Load main configuration
  if (fs.existsSync(configPath)) {
    const config = parseEnvFile(configPath);
    Object.assign(process.env, config);
    configLoaded = true;
    if (verbose) {
      console.log(`${colors.green}✅ Loaded main configuration from config.env${colors.reset}`);
    }
  } else {
    console.error(`${colors.red}❌ config.env not found at ${configPath}${colors.reset}`);
    throw new Error('config.env file is required');
  }
  
  // Load secrets configuration
  if (fs.existsSync(secretsPath)) {
    const secrets = parseEnvFile(secretsPath);
    Object.assign(process.env, secrets);
    secretsLoaded = true;
    if (verbose) {
      console.log(`${colors.green}✅ Loaded secrets from secrets.env${colors.reset}`);
    }
  } else {
    if (verbose) {
      console.log(`${colors.yellow}⚠️ secrets.env not found - using default values${colors.reset}`);
    }
  }
  
  // Set default values for missing secrets
  const defaults = {
    DB_PASSWORD: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
    KEYCLOAK_DB_PASSWORD: 'keycloak',
    JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
    KEYCLOAK_CLIENT_SECRET: 'elyMs5qenxOEbjIyXGKPYdqFea6beW8N',
    KEYCLOAK_ADMIN_PASSWORD: 'admin123',
    EMAIL_PASS: 'your-app-password',
    VAULT_TOKEN: 'hvs.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  };
  
  Object.entries(defaults).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });
  
  // Set derived configuration values
  process.env.BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`;
  process.env.KEYCLOAK_URL = process.env.KEYCLOAK_URL || `https://localhost:${process.env.KEYCLOAK_PORT || 8443}`;
  
  return {
    configLoaded,
    secretsLoaded,
    config: process.env
  };
}

/**
 * Validate required configuration variables
 */
function validateConfig(options = {}) {
  const { verbose = false } = options;
  
  const requiredVars = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'PORT', 'NODE_ENV',
    'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID',
    'BACKEND_URL', 'FRONTEND_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}❌ Missing required configuration variables:${colors.reset}`);
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    throw new Error(`Missing required configuration: ${missingVars.join(', ')}`);
  }
  
  if (verbose) {
    console.log(`${colors.green}✅ Configuration validation passed${colors.reset}`);
  }
  
  return true;
}

/**
 * Show current configuration (without secrets)
 */
function showConfig() {
  console.log(`${colors.blue}📋 Current Configuration:${colors.reset}`);
  console.log('==================================');
  console.log(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`Backend: ${process.env.BACKEND_URL}`);
  console.log(`Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`Keycloak: ${process.env.KEYCLOAK_URL}/${process.env.KEYCLOAK_REALM}`);
  console.log(`SCITT CCF: ${process.env.SCITT_CCF_ENABLED || 'false'} (${process.env.SCITT_CCF_URL || 'N/A'})`);
  console.log(`Blockchain: ${process.env.BLOCKCHAIN_ENABLED || 'false'}`);
  console.log(`DEPA: ${process.env.DEPA_ENABLED || 'false'}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('==================================');
}

/**
 * Get configuration for tests with proper defaults
 */
function getTestConfig() {
  // Ensure configuration is loaded
  loadConfig({ verbose: false });
  
  return {
    backend: process.env.BACKEND_URL || 'http://localhost:5001',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    keycloak: process.env.KEYCLOAK_URL || 'https://localhost:8443',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      name: process.env.DB_NAME || 'contract_management',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    timeout: parseInt(process.env.TEST_TIMEOUT) || 10000,
    verbose: process.env.VERBOSE === 'true' || process.env.NODE_ENV === 'development'
  };
}

// Auto-load configuration when module is required
try {
  loadConfig({ verbose: false });
} catch (error) {
  // Only throw if we're not in a test environment where config might not exist
  if (process.env.NODE_ENV !== 'test') {
    console.error(`${colors.red}❌ Failed to load configuration: ${error.message}${colors.reset}`);
  }
}

// Main execution when run directly
if (require.main === module) {
  try {
    const result = loadConfig({ verbose: true });
    validateConfig({ verbose: true });
    showConfig();
    
    console.log(`\n${colors.green}✅ Configuration loaded successfully${colors.reset}`);
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}❌ Configuration loading failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

module.exports = {
  loadConfig,
  validateConfig,
  showConfig,
  getTestConfig,
  parseEnvFile
};