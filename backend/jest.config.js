module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test timeout
  testTimeout: 30000,
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/logs/'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/logs/**',
    '!**/tests/**',
    '!**/scripts/**',
    '!server.js',
    '!jest.config.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Environment variables for tests
  setupFiles: ['<rootDir>/tests/env-setup.js'],
  
  // Transform files
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Coverage path mapping
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/scripts/',
    '/coverage/',
    '/logs/'
  ],
  
  // Reporters configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './',
      outputName: 'test-report.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporter', {
      pageTitle: 'Contract Management Backend Test Report',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      includeStackTrace: true,
      styleOverridePath: './custom-style.css'
    }]
  ]
}; 