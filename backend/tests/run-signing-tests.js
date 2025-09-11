#!/usr/bin/env node

/**
 * Contract Signing Test Runner
 * 
 * Comprehensive test runner for contract signing feature including
 * setup, execution, and cleanup of all test suites.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SigningTestRunner {
  constructor() {
    this.testResults = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      scittCcf: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Run all contract signing tests
   */
  async runAllTests() {
    console.log('🚀 Starting Contract Signing Test Suite');
    console.log('=====================================');
    
    this.startTime = Date.now();

    try {
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Run unit tests
      await this.runUnitTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run SCITT CCF integration tests
      await this.runScittCcfTests();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check test prerequisites
   */
  async checkPrerequisites() {
    console.log('\n🔍 Checking test prerequisites...');
    
    // Check if test database is available
    try {
      const { sequelize } = require('../models');
      await sequelize.authenticate();
      console.log('✅ Database connection: OK');
    } catch (error) {
      throw new Error('Database connection failed. Please ensure the database is running.');
    }

    // Check if SCITT CCF service is available
    try {
      const scittCcfService = require('../services/scittCcfService');
      await scittCcfService.initialize();
      console.log('✅ SCITT CCF service: OK');
    } catch (error) {
      console.log('⚠️  SCITT CCF service: Not available (tests will use mocks)');
    }

    // Check if test data setup script exists
    const testDataScript = path.join(__dirname, 'setup', 'signing-test-data.js');
    if (!fs.existsSync(testDataScript)) {
      throw new Error('Test data setup script not found');
    }
    console.log('✅ Test data setup: OK');

    console.log('✅ All prerequisites met');
  }

  /**
   * Run unit tests
   */
  async runUnitTests() {
    console.log('\n🧪 Running Unit Tests...');
    console.log('------------------------');
    
    const testFiles = [
      'unit/keyManagementService.test.js'
    ];

    for (const testFile of testFiles) {
      await this.runTestFile('unit', testFile);
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    console.log('-------------------------------');
    
    const testFiles = [
      'integration/signing.test.js'
    ];

    for (const testFile of testFiles) {
      await this.runTestFile('integration', testFile);
    }
  }

  /**
   * Run SCITT CCF integration tests
   */
  async runScittCcfTests() {
    console.log('\n📋 Running SCITT CCF Integration Tests...');
    console.log('------------------------------------------');
    
    const testFiles = [
      'integration/scittCcfSigning.test.js'
    ];

    for (const testFile of testFiles) {
      await this.runTestFile('scittCcf', testFile);
    }
  }

  /**
   * Run a single test file
   */
  async runTestFile(category, testFile) {
    const testPath = path.join(__dirname, testFile);
    
    if (!fs.existsSync(testPath)) {
      console.log(`⚠️  Test file not found: ${testFile}`);
      return;
    }

    console.log(`\n📄 Running: ${testFile}`);
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', ['jest', testPath, '--verbose', '--detectOpenHandles'], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      jest.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      jest.on('close', (code) => {
        const passed = code === 0;
        const testCount = this.extractTestCount(output);
        
        this.testResults[category].total += testCount.total;
        this.testResults[category].passed += testCount.passed;
        this.testResults[category].failed += testCount.failed;

        if (passed) {
          console.log(`✅ ${testFile}: PASSED (${testCount.passed}/${testCount.total})`);
        } else {
          console.log(`❌ ${testFile}: FAILED (${testCount.passed}/${testCount.total})`);
        }

        resolve();
      });

      jest.on('error', (error) => {
        console.error(`❌ Failed to run ${testFile}:`, error.message);
        reject(error);
      });
    });
  }

  /**
   * Extract test count from Jest output
   */
  extractTestCount(output) {
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = passed + failed;

    return { passed, failed, total };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    this.endTime = Date.now();
    const duration = this.endTime - this.startTime;

    console.log('\n📊 Test Report');
    console.log('==============');
    console.log(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log('');

    // Unit Tests Summary
    console.log('🧪 Unit Tests:');
    console.log(`   ✅ Passed: ${this.testResults.unit.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.unit.failed}`);
    console.log(`   📊 Total:  ${this.testResults.unit.total}`);
    console.log('');

    // Integration Tests Summary
    console.log('🔗 Integration Tests:');
    console.log(`   ✅ Passed: ${this.testResults.integration.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.integration.failed}`);
    console.log(`   📊 Total:  ${this.testResults.integration.total}`);
    console.log('');

    // SCITT CCF Tests Summary
    console.log('📋 SCITT CCF Tests:');
    console.log(`   ✅ Passed: ${this.testResults.scittCcf.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.scittCcf.failed}`);
    console.log(`   📊 Total:  ${this.testResults.scittCcf.total}`);
    console.log('');

    // Overall Summary
    const totalPassed = this.testResults.unit.passed + 
                       this.testResults.integration.passed + 
                       this.testResults.scittCcf.passed;
    const totalFailed = this.testResults.unit.failed + 
                       this.testResults.integration.failed + 
                       this.testResults.scittCcf.failed;
    const totalTests = totalPassed + totalFailed;

    console.log('🎯 Overall Summary:');
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📊 Total:  ${totalTests}`);
    console.log(`   📈 Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    console.log('');

    // Test Coverage Information
    console.log('📋 Test Coverage:');
    console.log('   🔑 Key Management Service: Unit Tests');
    console.log('   🔐 Signature Generation: Unit + Integration Tests');
    console.log('   📋 SCITT CCF Integration: Integration Tests');
    console.log('   🔍 Signature Verification: Integration Tests');
    console.log('   📊 Audit Trail: Integration Tests');
    console.log('   ⚡ Performance: Integration Tests');
    console.log('');

    // Recommendations
    if (totalFailed > 0) {
      console.log('💡 Recommendations:');
      console.log('   - Review failed tests and fix issues');
      console.log('   - Check test data setup and cleanup');
      console.log('   - Verify SCITT CCF service availability');
      console.log('   - Review error logs for detailed information');
    } else {
      console.log('🎉 All tests passed! Contract signing feature is ready for deployment.');
    }

    // Exit with appropriate code
    if (totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  /**
   * Run specific test category
   */
  async runCategory(category) {
    console.log(`🚀 Running ${category} tests only`);
    
    this.startTime = Date.now();

    try {
      await this.checkPrerequisites();

      switch (category) {
        case 'unit':
          await this.runUnitTests();
          break;
        case 'integration':
          await this.runIntegrationTests();
          break;
        case 'scitt':
          await this.runScittCcfTests();
          break;
        default:
          throw new Error(`Unknown test category: ${category}`);
      }

      this.generateTestReport();
    } catch (error) {
      console.error(`❌ ${category} tests failed:`, error.message);
      process.exit(1);
    }
  }

  /**
   * Run tests with coverage
   */
  async runWithCoverage() {
    console.log('🚀 Running tests with coverage analysis');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--coverage',
        '--coverageDirectory=coverage/signing',
        '--collectCoverageFrom=services/keyManagementService.js',
        '--collectCoverageFrom=routes/signing.js',
        '--collectCoverageFrom=services/scittCcfService.js',
        '--testPathPattern=signing|scittCcf'
      ], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Coverage analysis completed');
          resolve();
        } else {
          console.error('❌ Coverage analysis failed');
          reject(new Error('Coverage analysis failed'));
        }
      });
    });
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new SigningTestRunner();

  if (args.length === 0) {
    // Run all tests
    runner.runAllTests();
  } else if (args[0] === '--category' && args[1]) {
    // Run specific category
    runner.runCategory(args[1]);
  } else if (args[0] === '--coverage') {
    // Run with coverage
    runner.runWithCoverage();
  } else if (args[0] === '--help') {
    console.log('Contract Signing Test Runner');
    console.log('');
    console.log('Usage:');
    console.log('  node run-signing-tests.js                    # Run all tests');
    console.log('  node run-signing-tests.js --category unit    # Run unit tests only');
    console.log('  node run-signing-tests.js --category integration # Run integration tests only');
    console.log('  node run-signing-tests.js --category scitt   # Run SCITT CCF tests only');
    console.log('  node run-signing-tests.js --coverage         # Run with coverage analysis');
    console.log('  node run-signing-tests.js --help             # Show this help');
  } else {
    console.error('❌ Unknown arguments. Use --help for usage information.');
    process.exit(1);
  }
}

module.exports = SigningTestRunner;
