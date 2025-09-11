#!/usr/bin/env node

/**
 * Test Setup Validation Script
 * 
 * Validates that the contract signing test setup is working correctly.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const path = require('path');
const fs = require('fs');

class TestSetupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate the entire test setup
   */
  async validate() {
    console.log('🔍 Validating Contract Signing Test Setup');
    console.log('==========================================');
    
    try {
      // Check file structure
      this.validateFileStructure();
      
      // Check dependencies
      this.validateDependencies();
      
      // Check configuration
      this.validateConfiguration();
      
      // Check test data setup
      this.validateTestDataSetup();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate file structure
   */
  validateFileStructure() {
    console.log('\n📁 Checking file structure...');
    
    const requiredFiles = [
      'setup/signing-test-data.js',
      'setup/jest.setup.js',
      'setup/global-setup.js',
      'setup/global-teardown.js',
      'unit/keyManagementService.test.js',
      'integration/signing.test.js',
      'integration/scittCcfSigning.test.js',
      'jest.config.js',
      'run-signing-tests.js',
      'README.md'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
      } else {
        this.errors.push(`Missing required file: ${file}`);
        console.log(`❌ ${file} - MISSING`);
      }
    }
  }

  /**
   * Validate dependencies
   */
  validateDependencies() {
    console.log('\n📦 Checking dependencies...');
    
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push('package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['jest', 'supertest'];
    const requiredScripts = [
      'test:signing',
      'test:signing:unit',
      'test:signing:integration',
      'test:signing:scitt',
      'test:signing:coverage'
    ];

    // Check dependencies
    for (const dep of requiredDeps) {
      if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep} - ${packageJson.devDependencies[dep]}`);
      } else {
        this.errors.push(`Missing dependency: ${dep}`);
        console.log(`❌ ${dep} - MISSING`);
      }
    }

    // Check scripts
    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ ${script} script`);
      } else {
        this.errors.push(`Missing script: ${script}`);
        console.log(`❌ ${script} script - MISSING`);
      }
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration() {
    console.log('\n⚙️  Checking configuration...');
    
    // Check Jest config
    const jestConfigPath = path.join(__dirname, 'jest.config.js');
    if (fs.existsSync(jestConfigPath)) {
      try {
        const jestConfig = require(jestConfigPath);
        if (jestConfig.testEnvironment === 'node') {
          console.log('✅ Jest configuration - Valid');
        } else {
          this.warnings.push('Jest test environment should be "node"');
        }
      } catch (error) {
        this.errors.push(`Invalid Jest configuration: ${error.message}`);
      }
    } else {
      this.errors.push('Jest configuration file missing');
    }

    // Check environment variables
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} - Set`);
      } else {
        this.warnings.push(`Environment variable ${envVar} not set`);
        console.log(`⚠️  ${envVar} - Not set`);
      }
    }
  }

  /**
   * Validate test data setup
   */
  validateTestDataSetup() {
    console.log('\n🧪 Checking test data setup...');
    
    const testDataPath = path.join(__dirname, 'setup', 'signing-test-data.js');
    if (fs.existsSync(testDataPath)) {
      try {
        const testDataSetup = require(testDataPath);
        if (typeof testDataSetup === 'function') {
          console.log('✅ Test data setup - Valid class');
        } else {
          this.errors.push('Test data setup should export a class');
        }
      } catch (error) {
        this.errors.push(`Invalid test data setup: ${error.message}`);
      }
    } else {
      this.errors.push('Test data setup file missing');
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n📊 Validation Report');
    console.log('===================');
    
    if (this.errors.length === 0) {
      console.log('✅ All validations passed!');
      console.log('🎉 Contract signing test setup is ready to use.');
    } else {
      console.log(`❌ ${this.errors.length} error(s) found:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} warning(s):`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n🚀 Next Steps:');
    if (this.errors.length === 0) {
      console.log('   1. Run tests: npm run test:signing');
      console.log('   2. Run with coverage: npm run test:signing:coverage');
      console.log('   3. Run specific tests: npm run test:signing:unit');
    } else {
      console.log('   1. Fix the errors listed above');
      console.log('   2. Re-run this validation script');
      console.log('   3. Then run the tests');
    }

    // Exit with appropriate code
    if (this.errors.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TestSetupValidator();
  validator.validate();
}

module.exports = TestSetupValidator;
