#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Contract Management System
 * 
 * Runs all test suites including the new implementations:
 * - Provenance Tracking Service
 * - Multi-Cloud TEE Provisioning  
 * - TDC Model Upload & TEE Integration
 * - CCRP Environment Monitoring
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for output formatting
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

// Test suite configurations
const testSuites = [
  {
    name: 'Provenance Tracking Service',
    file: 'provenance-tracking.test.js',
    description: 'Merkle tree-based provenance tracking with SCITT CCF integration',
    icon: '🔗',
    timeout: 60000,
    priority: 'high'
  },
  {
    name: 'Multi-Cloud TEE Provisioning',
    file: 'multi-cloud-tee.test.js',
    description: 'AWS, Azure, GCP, and OCI TEE provisioning with attestation',
    icon: '🌐',
    timeout: 90000,
    priority: 'high'
  },
  {
    name: 'TDC Model Upload & TEE Integration',
    file: 'tdc-model-upload-tee.test.js',
    description: 'AI model upload, encryption, and TEE-based decryption',
    icon: '🤖',
    timeout: 120000,
    priority: 'high'
  },
  {
    name: 'CCRP Environment Monitoring',
    file: 'ccrp-environment-monitoring.test.js',
    description: 'Real-time monitoring, resource tracking, and analytics',
    icon: '📊',
    timeout: 60000,
    priority: 'high'
  },
  {
    name: 'Integration Tests',
    file: 'integration.test.js',
    description: 'Core system integration tests',
    icon: '🔧',
    timeout: 30000,
    priority: 'medium'
  },
  {
    name: 'Confidential Computing',
    file: 'confidential-computing.test.js',
    description: 'Confidential computing and security tests',
    icon: '🔒',
    timeout: 30000,
    priority: 'medium'
  }
];

class TestRunner {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(title, icon = '🧪') {
    const border = '='.repeat(60);
    this.log(`\n${border}`, 'cyan');
    this.log(`${icon} ${title}`, 'bright');
    this.log(border, 'cyan');
  }

  logSubHeader(title, icon = '📋') {
    this.log(`\n${icon} ${title}`, 'yellow');
    this.log('-'.repeat(40), 'yellow');
  }

  async checkPrerequisites() {
    this.logSubHeader('Checking Prerequisites', '🔍');

    // Check if test files exist
    const missingFiles = [];
    for (const suite of testSuites) {
      const testFile = path.join(__dirname, suite.file);
      if (!fs.existsSync(testFile)) {
        missingFiles.push(suite.file);
      }
    }

    if (missingFiles.length > 0) {
      this.log(`❌ Missing test files: ${missingFiles.join(', ')}`, 'red');
      process.exit(1);
    }

    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      this.log('❌ node_modules not found. Run npm install first.', 'red');
      process.exit(1);
    }

    // Check if backend server exists
    const serverPath = path.join(__dirname, '../backend/server.js');
    if (!fs.existsSync(serverPath)) {
      this.log('❌ Backend server not found at ../backend/server.js', 'red');
      process.exit(1);
    }

    this.log('✅ All prerequisites satisfied', 'green');
  }

  async setupEnvironment() {
    this.logSubHeader('Setting up Test Environment', '🔧');

    try {
      // Set test environment variables
      process.env.NODE_ENV = 'test';
      process.env.TEST_MODE = 'comprehensive';
      process.env.LOG_LEVEL = 'error'; // Reduce log verbosity during tests

      // Create test directories if they don't exist
      const testDirs = ['../uploads/test-models', '../logs/tests'];
      for (const dir of testDirs) {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      this.log('✅ Test environment setup complete', 'green');
    } catch (error) {
      this.log(`❌ Failed to setup test environment: ${error.message}`, 'red');
      throw error;
    }
  }

  async runTestSuite(suite) {
    const startTime = Date.now();
    
    this.log(`\n${suite.icon} Running ${suite.name}...`, 'cyan');
    this.log(`   ${suite.description}`, 'reset');

    try {
      const testFile = path.join(__dirname, suite.file);
      const command = `npx mocha "${testFile}" --timeout ${suite.timeout} --reporter spec`;
      
      // Run the test and capture output
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..')
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parse test results from output
      const results = this.parseTestOutput(output);
      
      this.results.push({
        suite: suite.name,
        status: 'passed',
        duration,
        tests: results.tests,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        output: output
      });

      this.totalTests += results.tests;
      this.passedTests += results.passed;
      this.failedTests += results.failed;
      this.skippedTests += results.skipped;

      this.log(`   ✅ ${suite.name} completed successfully`, 'green');
      this.log(`   📊 ${results.passed}/${results.tests} tests passed (${duration}ms)`, 'green');

      if (results.skipped > 0) {
        this.log(`   ⚠️  ${results.skipped} tests skipped`, 'yellow');
      }

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      this.results.push({
        suite: suite.name,
        status: 'failed',
        duration,
        error: error.message,
        output: error.stdout || error.message
      });

      this.failedTests++;
      this.log(`   ❌ ${suite.name} failed (${duration}ms)`, 'red');
      this.log(`   💥 Error: ${error.message}`, 'red');
    }
  }

  parseTestOutput(output) {
    // Simple parser for mocha output
    const lines = output.split('\n');
    let tests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    for (const line of lines) {
      if (line.includes('passing')) {
        const match = line.match(/(\d+) passing/);
        if (match) passed = parseInt(match[1]);
      }
      if (line.includes('failing')) {
        const match = line.match(/(\d+) failing/);
        if (match) failed = parseInt(match[1]);
      }
      if (line.includes('pending')) {
        const match = line.match(/(\d+) pending/);
        if (match) skipped = parseInt(match[1]);
      }
    }

    tests = passed + failed + skipped;

    return { tests, passed, failed, skipped };
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    this.logHeader('📊 Test Execution Report', '📊');

    // Summary statistics
    this.log('\n📈 Summary Statistics:', 'bright');
    this.log(`   Total Test Suites: ${this.results.length}`, 'cyan');
    this.log(`   Total Tests: ${this.totalTests}`, 'cyan');
    this.log(`   Passed: ${this.passedTests}`, 'green');
    this.log(`   Failed: ${this.failedTests}`, this.failedTests > 0 ? 'red' : 'green');
    this.log(`   Skipped: ${this.skippedTests}`, this.skippedTests > 0 ? 'yellow' : 'cyan');
    this.log(`   Total Duration: ${(totalDuration / 1000).toFixed(2)}s`, 'cyan');

    // Success rate
    const successRate = this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0;
    this.log(`   Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

    // Detailed results per suite
    this.log('\n📋 Detailed Results by Test Suite:', 'bright');
    
    for (const result of this.results) {
      const statusIcon = result.status === 'passed' ? '✅' : '❌';
      const statusColor = result.status === 'passed' ? 'green' : 'red';
      
      this.log(`\n   ${statusIcon} ${result.suite}`, statusColor);
      this.log(`      Duration: ${(result.duration / 1000).toFixed(2)}s`, 'cyan');
      
      if (result.status === 'passed') {
        this.log(`      Tests: ${result.passed}/${result.tests} passed`, 'green');
        if (result.skipped > 0) {
          this.log(`      Skipped: ${result.skipped}`, 'yellow');
        }
      } else {
        this.log(`      Error: ${result.error}`, 'red');
      }
    }

    // Performance analysis
    this.log('\n⚡ Performance Analysis:', 'bright');
    const sortedResults = [...this.results].sort((a, b) => b.duration - a.duration);
    
    this.log('   Slowest Test Suites:', 'yellow');
    for (let i = 0; i < Math.min(3, sortedResults.length); i++) {
      const result = sortedResults[i];
      this.log(`      ${i + 1}. ${result.suite}: ${(result.duration / 1000).toFixed(2)}s`, 'reset');
    }

    // Coverage recommendations
    this.log('\n🎯 Test Coverage Recommendations:', 'bright');
    
    const highPriorityTests = testSuites.filter(suite => suite.priority === 'high');
    const failedHighPriority = this.results.filter(result => 
      result.status === 'failed' && 
      highPriorityTests.some(suite => suite.name === result.suite)
    );

    if (failedHighPriority.length > 0) {
      this.log('   ⚠️  High priority test failures detected:', 'red');
      failedHighPriority.forEach(result => {
        this.log(`      - ${result.suite}`, 'red');
      });
    } else {
      this.log('   ✅ All high priority tests passing', 'green');
    }

    // Final status
    this.log('\n🏁 Final Status:', 'bright');
    if (this.failedTests === 0) {
      this.log('   🎉 ALL TESTS PASSED! System is ready for deployment.', 'green');
    } else if (failedHighPriority.length === 0) {
      this.log('   ⚠️  Some tests failed, but all high priority tests passed.', 'yellow');
    } else {
      this.log('   ❌ Critical test failures detected. System needs attention.', 'red');
    }
  }

  async saveReport() {
    try {
      const reportPath = path.join(__dirname, '../logs/comprehensive-test-report.json');
      const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalSuites: this.results.length,
          totalTests: this.totalTests,
          passed: this.passedTests,
          failed: this.failedTests,
          skipped: this.skippedTests,
          successRate: this.totalTests > 0 ? ((this.passedTests / this.totalTests) * 100).toFixed(1) : 0,
          totalDuration: Date.now() - this.startTime
        },
        results: this.results,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString()
        }
      };

      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      this.log(`\n💾 Test report saved to: ${reportPath}`, 'cyan');
    } catch (error) {
      this.log(`\n❌ Failed to save test report: ${error.message}`, 'red');
    }
  }

  async cleanup() {
    this.logSubHeader('Cleaning Up Test Environment', '🧹');

    try {
      // Clean up test files and directories
      const testFiles = [
        '../uploads/test-models',
        '../temp/test-data'
      ];

      for (const testFile of testFiles) {
        const filePath = path.join(__dirname, testFile);
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      }

      this.log('✅ Test environment cleanup complete', 'green');
    } catch (error) {
      this.log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
    }
  }

  async run() {
    try {
      this.logHeader('Contract Management System - Comprehensive Test Suite', '🧪');

      await this.checkPrerequisites();
      await this.setupEnvironment();

      this.logSubHeader('Executing Test Suites', '🚀');

      // Run all test suites
      for (const suite of testSuites) {
        await this.runTestSuite(suite);
      }

      // Generate and save report
      this.generateReport();
      await this.saveReport();

      // Cleanup
      await this.cleanup();

      // Exit with appropriate code
      process.exit(this.failedTests > 0 ? 1 : 0);

    } catch (error) {
      this.log(`\n💥 Test runner failed: ${error.message}`, 'red');
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
