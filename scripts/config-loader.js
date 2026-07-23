#!/usr/bin/env node

/**
 * Centralized Configuration Loader
 * 
 * This module provides a single source of truth for all system configurations.
 * All scripts, services, and deployment tools MUST use this loader.
 * 
 * Usage:
 * const config = require('./scripts/config-loader');
 * console.log(config.keycloak.url);
 */

const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.config = {};
    this.configPath = path.join(__dirname, '..', 'config.env');
    this.secretsPath = path.join(__dirname, '..', 'secrets.env');
    this.load();
  }

  /**
   * Parse KEY=VALUE lines from an env file into this.config.
   * Later files / overrides win for the same key.
   */
  loadEnvFile(filePath, { required = false } = {}) {
    if (!fs.existsSync(filePath)) {
      if (required) {
        throw new Error(`Configuration file not found: ${filePath}`);
      }
      return;
    }

    const configContent = fs.readFileSync(filePath, 'utf8');
    for (const line of configContent.split('\n')) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        const value = trimmedLine.substring(equalIndex + 1).trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');
        this.config[key] = cleanValue;
      }
    }
  }

  /**
   * Load configuration from config.env + secrets.env
   */
  load() {
    try {
      // Non-secret defaults first, then secrets (passwords moved out of config.env)
      this.loadEnvFile(this.configPath, { required: true });
      this.loadEnvFile(this.secretsPath, { required: false });

      // Override with environment variables if they exist
      this.overrideWithEnvVars();

      // Validate required configurations
      this.validate();

      // Use stderr so scripts that parse stdout JSON (e.g. fix-auth) stay valid.
      console.error('✅ Configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Override configuration with environment variables
   */
  overrideWithEnvVars() {
    const envOverrides = [
      'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_ADMIN_USER', 'KEYCLOAK_ADMIN_PASSWORD',
      'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'BACKEND_PORT', 'FRONTEND_PORT', 'NODE_ENV'
    ];

    for (const key of envOverrides) {
      if (process.env[key]) {
        this.config[key] = process.env[key];
      }
    }
  }

  /**
   * Validate required configurations
   */
  validate() {
    const required = [
      'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_ADMIN_USER', 'KEYCLOAK_ADMIN_PASSWORD',
      'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'BACKEND_PORT', 'FRONTEND_PORT'
    ];

    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }

  /**
   * Get configuration value
   */
  get(key, defaultValue = null) {
    return this.config[key] || defaultValue;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Get Keycloak configuration
   */
  getKeycloak() {
    return {
      url: this.get('KEYCLOAK_URL'),
      realm: this.get('KEYCLOAK_REALM'),
      adminUser: this.get('KEYCLOAK_ADMIN_USER'),
      adminPassword: this.get('KEYCLOAK_ADMIN_PASSWORD'),
      clientId: this.get('KEYCLOAK_CLIENT_ID'),
      clientSecret: this.get('KEYCLOAK_CLIENT_SECRET'),
      enabled: this.get('KEYCLOAK_ENABLED') === 'true'
    };
  }

  /**
   * Get Database configuration
   */
  getDatabase() {
    return {
      host: this.get('DB_HOST'),
      port: parseInt(this.get('DB_PORT')),
      name: this.get('DB_NAME'),
      user: this.get('DB_USER'),
      password: this.get('DB_PASSWORD'),
      ssl: this.get('DB_SSL') === 'true'
    };
  }

  /**
   * Get Backend configuration
   */
  getBackend() {
    return {
      port: parseInt(this.get('BACKEND_PORT')),
      host: this.get('BACKEND_HOST'),
      nodeEnv: this.get('NODE_ENV'),
      jwtSecret: this.get('JWT_SECRET'),
      jwtExpiresIn: this.get('JWT_EXPIRES_IN')
    };
  }

  /**
   * Get Frontend configuration
   */
  getFrontend() {
    return {
      port: parseInt(this.get('FRONTEND_PORT')),
      host: this.get('FRONTEND_HOST'),
      corsOrigin: this.get('CORS_ORIGIN')
    };
  }

  /**
   * Get Docker configuration
   */
  getDocker() {
    return {
      network: this.get('DOCKER_NETWORK'),
      keycloakPort: parseInt(this.get('DOCKER_KEYCLOAK_PORT')),
      postgresPort: parseInt(this.get('DOCKER_POSTGRES_PORT')),
      backendPort: parseInt(this.get('DOCKER_BACKEND_PORT')),
      frontendPort: parseInt(this.get('DOCKER_FRONTEND_PORT'))
    };
  }

  /**
   * Get SCITT CCF configuration
   */
  getScittCcf() {
    return {
      enabled: this.get('SCITT_CCF_ENABLED') === 'true',
      nodePort: parseInt(this.get('SCITT_CCF_NODE_PORT')),
      governancePort: parseInt(this.get('SCITT_CCF_GOVERNANCE_PORT')),
      url: this.get('SCITT_CCF_URL'),
      migrationMode: this.get('MIGRATION_MODE')
    };
  }

  /**
   * Get Blockchain configuration
   */
  getBlockchain() {
    return {
      enabled: this.get('BLOCKCHAIN_ENABLED') === 'true',
      network: this.get('BLOCKCHAIN_NETWORK'),
      rpcUrl: this.get('BLOCKCHAIN_RPC_URL'),
      contractAddress: this.get('CONTRACT_ADDRESS')
    };
  }

  /**
   * Get Security configuration
   */
  getSecurity() {
    return {
      sessionSecret: this.get('SESSION_SECRET'),
      encryptionKey: this.get('ENCRYPTION_KEY'),
      sslEnabled: this.get('SSL_ENABLED') === 'true',
      sslCertPath: this.get('SSL_CERT_PATH'),
      sslKeyPath: this.get('SSL_KEY_PATH')
    };
  }

  /**
   * Get Email configuration
   */
  getEmail() {
    return {
      enabled: this.get('EMAIL_ENABLED') === 'true',
      host: this.get('EMAIL_HOST'),
      port: parseInt(this.get('EMAIL_PORT')),
      user: this.get('EMAIL_USER'),
      pass: this.get('EMAIL_PASS'),
      from: this.get('EMAIL_FROM')
    };
  }

  /**
   * Get Logging configuration
   */
  getLogging() {
    return {
      level: this.get('LOG_LEVEL'),
      file: this.get('LOG_FILE'),
      maxSize: this.get('LOG_MAX_SIZE'),
      maxFiles: parseInt(this.get('LOG_MAX_FILES'))
    };
  }

  /**
   * Get Testing configuration
   */
  getTesting() {
    return {
      dbName: this.get('TEST_DB_NAME'),
      keycloakRealm: this.get('TEST_KEYCLOAK_REALM'),
      testMode: this.get('TEST_MODE') === 'true'
    };
  }

  /**
   * Get Deployment configuration
   */
  getDeployment() {
    return {
      env: this.get('DEPLOYMENT_ENV'),
      domain: this.get('DEPLOYMENT_DOMAIN'),
      ssl: this.get('DEPLOYMENT_SSL') === 'true',
      backupEnabled: this.get('DEPLOYMENT_BACKUP_ENABLED') === 'true',
      monitoringEnabled: this.get('DEPLOYMENT_MONITORING_ENABLED') === 'true'
    };
  }

  /**
   * Update configuration value
   */
  update(key, value) {
    this.config[key] = value;
  }

  /**
   * Save configuration to file
   */
  save() {
    try {
      let content = '# =============================================================================\n';
      content += '# CONTRACT MANAGEMENT SYSTEM - CENTRALIZED CONFIGURATION\n';
      content += '# =============================================================================\n';
      content += '# This is the SINGLE SOURCE OF TRUTH for all system configurations\n';
      content += '# All scripts, services, and deployment tools MUST use this file\n';
      content += '# =============================================================================\n\n';

      // Group configurations by category
      const categories = {
        'SYSTEM IDENTIFICATION': ['SYSTEM_NAME', 'SYSTEM_VERSION', 'SYSTEM_ENV'],
        'KEYCLOAK CONFIGURATION': ['KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_ADMIN_USER', 'KEYCLOAK_ADMIN_PASSWORD', 'KEYCLOAK_CLIENT_ID', 'KEYCLOAK_CLIENT_SECRET', 'KEYCLOAK_ENABLED'],
        'DATABASE CONFIGURATION': ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL'],
        'BACKEND CONFIGURATION': ['BACKEND_PORT', 'BACKEND_HOST', 'NODE_ENV', 'JWT_SECRET', 'JWT_EXPIRES_IN'],
        'FRONTEND CONFIGURATION': ['FRONTEND_PORT', 'FRONTEND_HOST', 'CORS_ORIGIN'],
        'DOCKER CONFIGURATION': ['DOCKER_NETWORK', 'DOCKER_KEYCLOAK_PORT', 'DOCKER_POSTGRES_PORT', 'DOCKER_BACKEND_PORT', 'DOCKER_FRONTEND_PORT'],
        'SCITT CCF CONFIGURATION': ['SCITT_CCF_ENABLED', 'SCITT_CCF_NODE_PORT', 'SCITT_CCF_GOVERNANCE_PORT', 'SCITT_CCF_URL', 'MIGRATION_MODE'],
        'BLOCKCHAIN CONFIGURATION': ['BLOCKCHAIN_ENABLED', 'BLOCKCHAIN_NETWORK', 'BLOCKCHAIN_RPC_URL', 'CONTRACT_ADDRESS'],
        'SECURITY CONFIGURATION': ['SESSION_SECRET', 'ENCRYPTION_KEY', 'SSL_ENABLED', 'SSL_CERT_PATH', 'SSL_KEY_PATH'],
        'EMAIL CONFIGURATION': ['EMAIL_ENABLED', 'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'],
        'LOGGING CONFIGURATION': ['LOG_LEVEL', 'LOG_FILE', 'LOG_MAX_SIZE', 'LOG_MAX_FILES'],
        'TESTING CONFIGURATION': ['TEST_DB_NAME', 'TEST_KEYCLOAK_REALM', 'TEST_MODE'],
        'DEPLOYMENT CONFIGURATION': ['DEPLOYMENT_ENV', 'DEPLOYMENT_DOMAIN', 'DEPLOYMENT_SSL', 'DEPLOYMENT_BACKUP_ENABLED', 'DEPLOYMENT_MONITORING_ENABLED']
      };

      for (const [category, keys] of Object.entries(categories)) {
        content += `# =============================================================================\n`;
        content += `# ${category}\n`;
        content += `# =============================================================================\n`;
        
        for (const key of keys) {
          if (this.config[key] !== undefined) {
            content += `${key}=${this.config[key]}\n`;
          }
        }
        content += '\n';
      }

      fs.writeFileSync(this.configPath, content);
      console.log('✅ Configuration saved successfully');
    } catch (error) {
      console.error('❌ Failed to save configuration:', error.message);
      throw error;
    }
  }

  /**
   * Print configuration summary
   */
  printSummary() {
    console.log('\n📋 Configuration Summary:');
    console.log('========================');
    console.log(`System: ${this.get('SYSTEM_NAME')} v${this.get('SYSTEM_VERSION')}`);
    console.log(`Environment: ${this.get('SYSTEM_ENV')}`);
    console.log(`Keycloak: ${this.get('KEYCLOAK_URL')} (${this.get('KEYCLOAK_REALM')})`);
    console.log(`Database: ${this.get('DB_HOST')}:${this.get('DB_PORT')}/${this.get('DB_NAME')}`);
    console.log(`Backend: ${this.get('BACKEND_HOST')}:${this.get('BACKEND_PORT')}`);
    console.log(`Frontend: ${this.get('FRONTEND_HOST')}:${this.get('FRONTEND_PORT')}`);
    console.log(`SCITT CCF: ${this.get('SCITT_CCF_ENABLED') === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`Blockchain: ${this.get('BLOCKCHAIN_ENABLED') === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log('========================\n');
  }
}

// Create singleton instance
const configLoader = new ConfigLoader();

// Export both the instance and the class
module.exports = configLoader;
module.exports.ConfigLoader = ConfigLoader;

// If run directly, print configuration summary
if (require.main === module) {
  configLoader.printSummary();
}
