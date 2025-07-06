#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Contract Management System
 * 
 * This script runs all test suites with proper configuration, reporting,
 * and coverage analysis. It provides detailed output and handles
 * different test scenarios.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Test suites to run
  suites: [
    'models.test.js',
    'api.test.js', 
    'integration.test.js',
    'security.test.js',
    'services.test.js',
    'performance.test.js'
  ],
  
  // Jest configuration
  jestConfig: {
    verbose: true,
    collectCoverage: true,
    coverageDirectory: './coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    },
    testTimeout: 30000,
    maxWorkers: 2, // Limit concurrent tests to avoid resource conflicts
    setupFilesAfterEnv: ['./tests/setup.js']
  },
  
  // Performance thresholds
  performanceThresholds: {
    maxTestTime: 60000, // 60 seconds per test suite
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
    minSuccessRate: 0.95 // 95% success rate
  }
};

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: [],
  startTime: null,
  endTime: null,
  coverage: null
};

/**
 * Print colored output
 */
function print(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

/**
 * Print header
 */
function printHeader() {
  print('\n' + '='.repeat(80), 'cyan');
  print('🚀 CONTRACT MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE', 'bright');
  print('='.repeat(80), 'cyan');
  print(`📅 Started at: ${new Date().toISOString()}`, 'blue');
  print(`🔧 Node.js: ${process.version}`, 'blue');
  print(`📁 Working directory: ${process.cwd()}`, 'blue');
  print('='.repeat(80), 'cyan');
}

/**
 * Print test suite header
 */
function printSuiteHeader(suiteName) {
  print('\n' + '-'.repeat(60), 'yellow');
  print(`🧪 Running Test Suite: ${suiteName}`, 'bright');
  print('-'.repeat(60), 'yellow');
}

/**
 * Print test results summary
 */
function printResultsSummary() {
  const duration = testResults.endTime - testResults.startTime;
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  print('\n' + '='.repeat(80), 'cyan');
  print('📊 TEST RESULTS SUMMARY', 'bright');
  print('='.repeat(80), 'cyan');
  print(`⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s`, 'blue');
  print(`📈 Total Tests: ${testResults.total}`, 'blue');
  print(`✅ Passed: ${testResults.passed}`, 'green');
  print(`❌ Failed: ${testResults.failed}`, 'red');
  print(`⏭️  Skipped: ${testResults.skipped}`, 'yellow');
  print(`📊 Success Rate: ${successRate}%`, successRate >= 95 ? 'green' : 'red');
  
  if (testResults.coverage) {
    print(`📊 Coverage: ${testResults.coverage}%`, testResults.coverage >= 70 ? 'green' : 'yellow');
  }
  
  print('='.repeat(80), 'cyan');
}

/**
 * Print detailed suite results
 */
function printSuiteResults() {
  print('\n📋 DETAILED SUITE RESULTS:', 'bright');
  print('-'.repeat(60), 'yellow');
  
  testResults.suites.forEach(suite => {
    const status = suite.passed ? '✅' : '❌';
    const color = suite.passed ? 'green' : 'red';
    const duration = suite.duration ? `(${(suite.duration / 1000).toFixed(2)}s)` : '';
    
    print(`${status} ${suite.name} ${duration}`, color);
    
    if (suite.error) {
      print(`   Error: ${suite.error}`, 'red');
    }
    
    if (suite.coverage) {
      print(`   Coverage: ${suite.coverage}%`, suite.coverage >= 70 ? 'green' : 'yellow');
    }
  });
}

/**
 * Run a single test suite
 */
function runTestSuite(suiteName) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const suiteResult = {
      name: suiteName,
      passed: false,
      duration: 0,
      error: null,
      coverage: null
    };
    
    printSuiteHeader(suiteName);
    
    // Build Jest command
    const jestArgs = [
      '--testPathPattern', suiteName,
      '--verbose',
      '--collectCoverage',
      '--coverageDirectory', './coverage',
      '--coverageReporters', 'text,lcov,html',
      '--testTimeout', '30000',
      '--maxWorkers', '2'
    ];
    
    const jestProcess = spawn('npx', ['jest', ...jestArgs], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let stdout = '';
    let stderr = '';
    
    jestProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    jestProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    jestProcess.on('close', (code) => {
      const endTime = Date.now();
      suiteResult.duration = endTime - startTime;
      
      if (code === 0) {
        suiteResult.passed = true;
        print(`✅ ${suiteName} completed successfully`, 'green');
      } else {
        suiteResult.passed = false;
        suiteResult.error = `Test suite failed with exit code ${code}`;
        print(`❌ ${suiteName} failed`, 'red');
      }
      
      // Extract coverage information
      const coverageMatch = stdout.match(/All files\s+\|\s+(\d+(?:\.\d+)?)/);
      if (coverageMatch) {
        suiteResult.coverage = parseFloat(coverageMatch[1]);
      }
      
      resolve(suiteResult);
    });
    
    jestProcess.on('error', (error) => {
      suiteResult.error = error.message;
      reject(suiteResult);
    });
    
    // Set timeout for test suite
    setTimeout(() => {
      jestProcess.kill('SIGTERM');
      suiteResult.error = 'Test suite timed out';
      reject(suiteResult);
    }, TEST_CONFIG.performanceThresholds.maxTestTime);
  });
}

/**
 * Run all test suites
 */
async function runAllTests() {
  testResults.startTime = Date.now();
  
  printHeader();
  
  // Check if we're in the correct directory
  if (!fs.existsSync('./tests')) {
    print('❌ Error: tests directory not found. Please run this script from the backend directory.', 'red');
    process.exit(1);
  }
  
  // Check if Jest is available
  try {
    await new Promise((resolve, reject) => {
      const checkProcess = spawn('npx', ['jest', '--version'], { stdio: 'pipe' });
      checkProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Jest not available'));
      });
    });
  } catch (error) {
    print('❌ Error: Jest is not available. Please install it with: npm install --save-dev jest', 'red');
    process.exit(1);
  }
  
  // Run each test suite
  for (const suite of TEST_CONFIG.suites) {
    try {
      const result = await runTestSuite(suite);
      testResults.suites.push(result);
      
      if (result.passed) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }
      testResults.total++;
      
    } catch (error) {
      testResults.suites.push({
        name: suite,
        passed: false,
        error: error.message || 'Unknown error',
        duration: 0
      });
      testResults.failed++;
      testResults.total++;
    }
  }
  
  testResults.endTime = Date.now();
  
  // Generate coverage report
  await generateCoverageReport();
  
  // Print results
  printResultsSummary();
  printSuiteResults();
  
  // Print recommendations
  printRecommendations();
  
  // Exit with appropriate code
  const exitCode = testResults.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

/**
 * Generate coverage report
 */
async function generateCoverageReport() {
  try {
    const coveragePath = './coverage/lcov-report/index.html';
    if (fs.existsSync(coveragePath)) {
      const lcovPath = './coverage/lcov.info';
      if (fs.existsSync(lcovPath)) {
        const lcovContent = fs.readFileSync(lcovPath, 'utf8');
        const coverageMatch = lcovContent.match(/LF:(\d+)/g);
        const hitMatch = lcovContent.match(/LH:(\d+)/g);
        
        if (coverageMatch && hitMatch) {
          const totalLines = coverageMatch.reduce((sum, match) => sum + parseInt(match.split(':')[1]), 0);
          const hitLines = hitMatch.reduce((sum, match) => sum + parseInt(match.split(':')[1]), 0);
          testResults.coverage = totalLines > 0 ? Math.round((hitLines / totalLines) * 100) : 0;
        }
      }
      
      print(`📊 Coverage report generated: ${path.resolve(coveragePath)}`, 'blue');
    }
  } catch (error) {
    print(`⚠️  Warning: Could not generate coverage report: ${error.message}`, 'yellow');
  }
}

/**
 * Print recommendations based on test results
 */
function printRecommendations() {
  print('\n💡 RECOMMENDATIONS:', 'bright');
  print('-'.repeat(60), 'yellow');
  
  if (testResults.failed > 0) {
    print('🔧 Fix failing tests before deployment', 'red');
  }
  
  if (testResults.coverage && testResults.coverage < 70) {
    print('📈 Increase test coverage to at least 70%', 'yellow');
  }
  
  if (testResults.suites.some(s => s.duration > 30000)) {
    print('⚡ Optimize slow test suites', 'yellow');
  }
  
  if (testResults.passed === testResults.total) {
    print('🎉 All tests passed! Ready for deployment', 'green');
  }
  
  print('📚 Run individual test suites for focused testing:', 'blue');
  TEST_CONFIG.suites.forEach(suite => {
    print(`   npm test -- ${suite}`, 'cyan');
  });
}

/**
 * Handle process termination
 */
process.on('SIGINT', () => {
  print('\n⚠️  Test execution interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  print('\n⚠️  Test execution terminated', 'yellow');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  print(`\n❌ Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  print(`\n❌ Unhandled rejection at ${promise}: ${reason}`, 'red');
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    print(`\n❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  TEST_CONFIG,
  testResults
}; 