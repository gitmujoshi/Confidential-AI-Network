/**
 * Application Startup Validation Script
 * 
 * This script validates that all required services and database schema
 * are properly configured before starting the application.
 */

const { setTestEnv } = require('../../tests/test-env');
const { sequelize } = require('../models');
const axios = require('axios');

// Set environment based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
if (env === 'test') {
  setTestEnv('integration');
}

class StartupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Starting application startup validation...');
    
    try {
      // 1. Validate database connection
      await this.validateDatabaseConnection();
      
      // 2. Validate database schema
      await this.validateDatabaseSchema();
      
      // 3. Validate required services
      await this.validateServices();
      
      // 4. Validate environment variables
      await this.validateEnvironmentVariables();
      
      // 5. Report results
      this.reportResults();
      
    } catch (error) {
      console.error('❌ Startup validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateDatabaseConnection() {
    console.log('  🔗 Validating database connection...');
    
    try {
      await sequelize.authenticate();
      console.log('    ✅ Database connection successful');
    } catch (error) {
      this.errors.push(`Database connection failed: ${error.message}`);
    }
  }

  async validateDatabaseSchema() {
    console.log('  📊 Validating database schema...');
    
    const requiredTables = [
      'users', 'contracts', 'datasets', 'training_jobs', 
      'training_environments', 'signing_events', 'system_health_log',
      'signatures', 'scitt_claims', 'provenance_nodes'
    ];
    
    for (const table of requiredTables) {
      try {
        const [results] = await sequelize.query(
          `SELECT 1 FROM information_schema.tables WHERE table_name = '${table}'`
        );
        
        if (results.length === 0) {
          this.errors.push(`Required table '${table}' is missing`);
        } else {
          console.log(`    ✅ Table '${table}' exists`);
        }
      } catch (error) {
        this.errors.push(`Failed to check table '${table}': ${error.message}`);
      }
    }
    
    // Check for required columns in users table
    const requiredUserColumns = ['first_login', 'email_verified', 'onboarding_status'];
    
    for (const column of requiredUserColumns) {
      try {
        const [results] = await sequelize.query(
          `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = '${column}'`
        );
        
        if (results.length === 0) {
          this.errors.push(`Required column 'users.${column}' is missing`);
        } else {
          console.log(`    ✅ Column 'users.${column}' exists`);
        }
      } catch (error) {
        this.errors.push(`Failed to check column 'users.${column}': ${error.message}`);
      }
    }
  }

  async validateServices() {
    console.log('  🔧 Validating required services...');
    
    // Validate Keycloak
    try {
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***Url = process.env.KEYCLOAK_URL;
      if (!***REMOVED-KEYCLOAK_DB_PASSWORD***Url) {
        this.errors.push('KEYCLOAK_URL environment variable is not set');
        return;
      }
      
      const response = await axios.get(`${***REMOVED-KEYCLOAK_DB_PASSWORD***Url}/health`, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      
      if (response.status === 200) {
        console.log('    ✅ Keycloak is accessible');
      } else {
        this.warnings.push(`Keycloak returned status ${response.status}`);
      }
    } catch (error) {
      this.warnings.push(`Keycloak validation failed: ${error.message}`);
    }
    
    // Validate SCITT CCF
    try {
      const scittUrl = process.env.SCITT_CCF_URL;
      if (!scittUrl) {
        this.warnings.push('SCITT_CCF_URL not set, SCITT CCF features will be disabled');
      } else {
        const response = await axios.get(`${scittUrl}/health`, { 
          timeout: 5000,
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          console.log('    ✅ SCITT CCF is accessible');
        } else {
          this.warnings.push(`SCITT CCF returned status ${response.status}`);
        }
      }
    } catch (error) {
      this.warnings.push(`SCITT CCF validation failed: ${error.message}`);
    }
  }

  async validateEnvironmentVariables() {
    console.log('  ⚙️ Validating environment variables...');
    
    const requiredVars = [
      'PORT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'KEYCLOAK_URL', 'KEYCLOAK_REALM', 'KEYCLOAK_CLIENT_ID'
    ];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        this.errors.push(`Required environment variable '${varName}' is not set`);
      } else {
        console.log(`    ✅ ${varName} is set`);
      }
    }
    
    // Validate optional but important variables
    const optionalVars = [
      'SCITT_CCF_URL', 'SCITT_CCF_ENABLED', 'LOG_LEVEL', 'JWT_SECRET'
    ];
    
    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        this.warnings.push(`Optional environment variable '${varName}' is not set`);
      } else {
        console.log(`    ✅ ${varName} is set`);
      }
    }
  }

  reportResults() {
    console.log('\n📋 Validation Results:');
    
    if (this.errors.length === 0) {
      console.log('✅ All validations passed!');
    } else {
      console.log('❌ Validation errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n🚨 Application cannot start due to validation errors');
      process.exit(1);
    } else {
      console.log('\n🚀 Application is ready to start!');
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new StartupValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation process failed:', error);
    process.exit(1);
  });
}

module.exports = StartupValidator;
