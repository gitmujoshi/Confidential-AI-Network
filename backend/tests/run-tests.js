#!/usr/bin/env node

/**
 * Enhanced Test Runner for Contract Management System
 * 
 * This script provides a comprehensive test execution framework with:
 * - Multiple test modes (mock, integration, comprehensive)
 * - Environment setup and teardown
 * - Detailed reporting and error handling
 * - Coverage analysis
 * - CI/CD integration support
 * 
 * @author Contract Management System
 * @version 2.0.0
 * @since 2024-01-08
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testSuites: {
    mock: {
      description: 'Fast unit tests with mocked external services',
      files: [
        'mock-integration.test.js',
        'models.test.js',
        'api.test.js',
        'core.test.js',
        'security.test.js',
        'performance.test.js'
      ],
      timeout: 30000,
      maxWorkers: 4
    },
    integration: {
      description: 'Integration tests with real services',
      files: [
        'integration.test.js',
        'registration-integration.test.js'
      ],
      timeout: 60000,
      maxWorkers: 2
    },
    comprehensive: {
      description: 'Full system tests with all components',
      files: [
        'comprehensive.test.js',
        'services.test.js',
        'blockchainService.test.js',
        'blockchainService.simple.test.js',
        'simple-ai-model.test.js'
      ],
      timeout: 120000,
      maxWorkers: 1
    }
  },
  coverage: {
    enabled: true,
    reporters: ['text', 'lcov', 'html'],
    collectFrom: ['src/**/*.js', 'services/**/*.js', 'routes/**/*.js', 'middleware/**/*.js']
  },
  reporting: {
    outputDir: 'test-results',
    reportFile: 'test-report.json'
  }
};

// Utility functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'START': '🚀',
    'TEST': '🧪'
  };
  
  console.log(`${emoji[level]} [${timestamp}] ${message}`);
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if Jest is available
  try {
    execSync('jest --version', { stdio: 'pipe' });
    log('✅ Jest is available');
  } catch (error) {
    log('❌ Jest is not available. Please install Jest: npm install --save-dev jest', 'ERROR');
    process.exit(1);
  }
  
  // Check database connection
  try {
    const { sequelize } = require('../models');
    sequelize.authenticate();
    log('✅ Database connection is available');
  } catch (error) {
    log('⚠️ Database connection not available, some tests may fail', 'WARNING');
  }
  
  log('');
}

function setupTestEnvironment(suiteName) {
  log(`Setting up test environment for ${suiteName}...`);
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.BLOCKCHAIN_ENABLED = 'false';
  process.env.KEYCLOAK_ENABLED = 'false';
  
  // Create test results directory
  const resultsDir = path.join(__dirname, '..', CONFIG.reporting.outputDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  log(`✅ Test environment setup complete for ${suiteName}`);
}

function runTestSuite(suiteName, suiteConfig) {
  return new Promise((resolve, reject) => {
    log(`🚀 Starting ${suiteName}...`);
    log(`Description: ${suiteConfig.description}`);
    
    setupTestEnvironment(suiteName);
    
    const args = [
      '--verbose',
      `--timeout=${suiteConfig.timeout}`,
      `--maxWorkers=${suiteConfig.maxWorkers}`
    ];
    
    if (CONFIG.coverage.enabled) {
      args.push('--coverage');
      CONFIG.coverage.collectFrom.forEach(pattern => {
        args.push(`--collectCoverageFrom="${pattern}"`);
      });
      CONFIG.coverage.reporters.forEach(reporter => {
        args.push(`--coverageReporters=${reporter}`);
      });
    }
    
    args.push(...suiteConfig.files);
    
    log(`Executing: jest ${args.join(' ')}`);
    
    const jestProcess = spawn('jest', args, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    jestProcess.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${suiteName} completed successfully`);
        resolve({ suite: suiteName, success: true });
      } else {
        log(`❌ ${suiteName} failed after ${suiteConfig.timeout / 1000}s`, 'ERROR');
        log(`Error: Command failed: jest ${args.join(' ')}`, 'ERROR');
        log(`❌ ${suiteName} failed. Stopping execution.`, 'ERROR');
        reject({ suite: suiteName, success: false, code });
      }
    });
    
    jestProcess.on('error', (error) => {
      log(`❌ Failed to start Jest: ${error.message}`, 'ERROR');
      reject({ suite: suiteName, success: false, error });
    });
  });
}

function generateTestReport(results) {
  log('Generating test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDuration: 0
    },
    results: results
  };
  
  const reportPath = path.join(__dirname, '..', CONFIG.reporting.outputDir, CONFIG.reporting.reportFile);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`✅ Test report generated: ${CONFIG.reporting.outputDir}/${CONFIG.reporting.reportFile}`);
}

function printSummary(results) {
  console.log('\n============================================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('============================================================');
  console.log(`Total Suites: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  
  if (results.some(r => !r.success)) {
    console.log('\nFailed Suites:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.suite}`);
    });
  }
  
  console.log('============================================================\n');
}

async function main() {
  try {
    log('🧪 Contract Management System - Test Runner');
    console.log('============================================================');
    
    checkPrerequisites();
    
    const results = [];
    const suites = Object.entries(CONFIG.testSuites);
    
    for (const [suiteName, suiteConfig] of suites) {
      try {
        const result = await runTestSuite(suiteName, suiteConfig);
        results.push(result);
        
        // If a suite fails, stop execution
        if (!result.success) {
          break;
        }
      } catch (error) {
        results.push(error);
        break;
      }
    }
    
    generateTestReport(results);
    printSummary(results);
    
    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success);
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Test execution interrupted by user', 'WARNING');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Test execution terminated', 'WARNING');
  process.exit(1);
});

// Run the test runner
if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  runTestSuite,
  generateTestReport
}; 