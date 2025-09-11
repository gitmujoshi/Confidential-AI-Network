/**
 * Jest Configuration for Contract Signing Tests
 * 
 * Comprehensive Jest configuration for contract signing feature testing
 * including unit tests, integration tests, and SCITT CCF integration tests.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Module paths
  modulePaths: [
    '<rootDir>',
    '<rootDir>/tests'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/models/$1',
    '^@routes/(.*)$': '<rootDir>/routes/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'services/keyManagementService.js',
    'services/scittCcfService.js',
    'routes/signing.js',
    'models/UserKey.js',
    'models/ScittClaim.js',
    'models/SigningEvent.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './services/keyManagementService.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './routes/signing.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  forceExit: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.js',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.js',
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(crypto-js|@contract-management)/)'
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:5001'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      suiteName: 'Contract Signing Tests'
    }]
  ],
  
  // Custom test results processor
  testResultsProcessor: '<rootDir>/tests/setup/test-results-processor.js',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Parallel execution
  maxWorkers: '50%',
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Snapshot configuration
  snapshotSerializers: [],
  
  // Test patterns for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/integration.setup.js'
      ]
    }
  ]
};
