#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * 
 * This script validates that all services use only environment variables
 * from config.env and secrets.env without hardcoded defaults.
 */

const fs = require('fs');
const path = require('path');

// Load configuration manually

class EnvironmentValidator {
  constructor() {
    this.configEnv = this.loadConfigFile('./config.env');
    this.secretsEnv = this.loadConfigFile('./secrets.env');
    this.allEnvVars = new Set([...Object.keys(this.configEnv), ...Object.keys(this.secretsEnv)]);
    
    this.errors = [];
    this.warnings = [];
  }
  
  loadConfigFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const envVars = {};
      
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        }
      });
      
      return envVars;
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error.message);
      return {};
    }
  }
  
  validateServiceFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        // Check for hardcoded defaults with || operator
        const hardcodedDefaultMatch = line.match(/process\.env\.([A-Z_]+)\s*\|\|\s*([^,)]+)/g);
        if (hardcodedDefaultMatch) {
          hardcodedDefaultMatch.forEach(match => {
            const varMatch = match.match(/process\.env\.([A-Z_]+)/);
            if (varMatch) {
              const varName = varMatch[1];
              if (!this.allEnvVars.has(varName)) {
                this.errors.push({
                  file: filePath,
                  line: lineNumber + 1,
                  message: `Hardcoded default for undefined environment variable: ${varName}`,
                  code: line.trim()
                });
              } else {
                this.warnings.push({
                  file: filePath,
                  line: lineNumber + 1,
                  message: `Hardcoded default found for ${varName} - should use validation instead`,
                  code: line.trim()
                });
              }
            }
          });
        }
        
        // Check for hardcoded URLs and values
        const hardcodedUrlMatch = line.match(/['"`](https?:\/\/[^'"`]+)['"`]/g);
        if (hardcodedUrlMatch) {
          hardcodedUrlMatch.forEach(match => {
            if (match.includes('localhost') || match.includes('127.0.0.1')) {
              this.warnings.push({
                file: filePath,
                line: lineNumber + 1,
                message: `Hardcoded URL found: ${match}`,
                code: line.trim()
              });
            }
          });
        }
        
        // Check for hardcoded numeric values that should be configurable
        const hardcodedNumberMatch = line.match(/\b(100|1000|1024|5000|8080|3000|5001|5432|6379)\b/g);
        if (hardcodedNumberMatch && line.includes('process.env')) {
          this.warnings.push({
            file: filePath,
            line: lineNumber + 1,
            message: `Suspicious hardcoded number in environment context: ${line.trim()}`,
            code: line.trim()
          });
        }
      });
      
    } catch (error) {
      this.errors.push({
        file: filePath,
        line: 0,
        message: `Error reading file: ${error.message}`,
        code: ''
      });
    }
  }
  
  validateAllServices() {
    const servicesDir = './backend/services';
    const files = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));
    
    console.log('🔍 Validating environment variable usage in services...\n');
    
    files.forEach(file => {
      const filePath = path.join(servicesDir, file);
      console.log(`Checking ${file}...`);
      this.validateServiceFile(filePath);
    });
    
    // Also check training container files
    const trainingFiles = [
      './backend/local-tee/containers/test-container-1/luks_decryptor.py',
      './backend/local-tee/containers/test-container-1/train.py'
    ];
    
    trainingFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        console.log(`Checking ${filePath}...`);
        this.validateServiceFile(filePath);
      }
    });
  }
  
  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('ENVIRONMENT VALIDATION RESULTS');
    console.log('='.repeat(80));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All services use environment variables correctly!');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.file}:${error.line}`);
        console.log(`   ${error.message}`);
        console.log(`   Code: ${error.code}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.file}:${warning.line}`);
        console.log(`   ${warning.message}`);
        console.log(`   Code: ${warning.code}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('RECOMMENDATIONS:');
    console.log('='.repeat(80));
    console.log('1. Remove all hardcoded defaults (|| "default")');
    console.log('2. Add validation methods to check for required environment variables');
    console.log('3. Use process.env.VAR_NAME directly without fallbacks');
    console.log('4. Add missing variables to config.env or secrets.env');
    console.log('5. Use meaningful error messages when variables are missing');
  }
  
  generateConfigReport() {
    console.log('\n📋 CONFIGURATION REPORT');
    console.log('='.repeat(50));
    console.log(`Config.env variables: ${Object.keys(this.configEnv).length}`);
    console.log(`Secrets.env variables: ${Object.keys(this.secretsEnv).length}`);
    console.log(`Total environment variables: ${this.allEnvVars.size}`);
    
    console.log('\nEncryption-related variables:');
    const encryptionVars = Array.from(this.allEnvVars).filter(name => 
      name.includes('ENCRYPTION') || name.includes('LUKS') || name.includes('TRAINING')
    );
    encryptionVars.forEach(varName => {
      const value = this.configEnv[varName] || this.secretsEnv[varName];
      console.log(`  ${varName}=${value}`);
    });
  }
}

// Run validation
const validator = new EnvironmentValidator();
validator.validateAllServices();
validator.printResults();
validator.generateConfigReport();

// Exit with error code if there are errors
if (validator.errors.length > 0) {
  process.exit(1);
}
