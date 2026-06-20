# Contract Signing Test Suite

## 🎯 Overview

This directory contains comprehensive test suites for the contract signing feature, including unit tests, integration tests, and SCITT CCF integration tests. The tests cover all aspects of the contract signing functionality including key management, signature generation, verification, and SCITT CCF ledger integration.

## 📁 Directory Structure

```
tests/
├── setup/                          # Test setup and utilities
│   ├── signing-test-data.js        # Test data creation and cleanup
│   ├── jest.setup.js              # Jest global setup
│   ├── global-setup.js            # Global test setup
│   ├── global-teardown.js         # Global test teardown
│   └── integration.setup.js       # Integration test setup
├── unit/                           # Unit tests
│   └── keyManagementService.test.js # Key management service tests
├── integration/                    # Integration tests
│   ├── signing.test.js            # Signing API integration tests
│   └── scittCcfSigning.test.js    # SCITT CCF integration tests
├── jest.config.js                 # Jest configuration
├── run-signing-tests.js           # Test runner script
└── README.md                      # This file
```

## 🧪 Test Categories

### 1. Unit Tests (`unit/`)

**Purpose**: Test individual functions and methods in isolation.

**Coverage**:
- Key generation (ECDSA-P256, RSA-2048, RSA-4096)
- Key encryption/decryption
- Signature generation and verification
- Key validation
- Algorithm information retrieval
- Error handling

**Files**:
- `keyManagementService.test.js` - Comprehensive tests for key management service

### 2. Integration Tests (`integration/`)

**Purpose**: Test API endpoints and service interactions.

**Coverage**:
- Key management API endpoints
- Contract signing API endpoints
- Signature verification API endpoints
- SCITT CCF claim submission
- Database interactions
- Authentication and authorization
- Error handling and edge cases

**Files**:
- `signing.test.js` - Main signing API integration tests
- `scittCcfSigning.test.js` - SCITT CCF specific integration tests

## 🚀 Running Tests

### Prerequisites

1. **Database**: PostgreSQL test database running
2. **Dependencies**: All npm packages installed
3. **Environment**: Test environment variables set

### Quick Start

```bash
# Run all signing tests
npm run test:signing

# Run specific test categories
npm run test:signing:unit          # Unit tests only
npm run test:signing:integration   # Integration tests only
npm run test:signing:scitt         # SCITT CCF tests only

# Run with coverage analysis
npm run test:signing:coverage
```

### Manual Test Execution

```bash
# Using Jest directly
npx jest tests/unit/keyManagementService.test.js
npx jest tests/integration/signing.test.js
npx jest tests/integration/scittCcfSigning.test.js

# Using test runner
node tests/run-signing-tests.js
node tests/run-signing-tests.js --category unit
node tests/run-signing-tests.js --coverage
```

## 📊 Test Data

### Test Data Setup

The test suite includes a comprehensive test data setup system (`setup/signing-test-data.js`) that creates:

- **Test Users**: TDC, TDP, TSP, and Admin users
- **Test Contracts**: Various contract states (pending, partially signed, fully signed)
- **Test Keys**: Multiple key types for each user
- **Test Claims**: SCITT CCF signature claims
- **Test Events**: Signing audit events

### Test Data Cleanup

All test data is automatically cleaned up after test execution to ensure test isolation and prevent data pollution.

## 🔧 Configuration

### Jest Configuration

The test suite uses a custom Jest configuration (`jest.config.js`) with:

- **Test Environment**: Node.js
- **Coverage Thresholds**: 80% global, 90% for key services
- **Timeout**: 30 seconds for integration tests
- **Mocking**: External services mocked for unit tests
- **Setup Files**: Global setup and teardown hooks

### Environment Variables

Required environment variables for testing:

```bash
NODE_ENV=test
DATABASE_URL=***REMOVED-DB_PASSWORD***ql://test:test@localhost:5432/contract_management_test
JWT_SECRET=test-jwt-secret
CCF_NODE_URL=http://localhost:8000
CCF_API_KEY=test-api-key
```

## 📋 Test Coverage

### Key Management Service (90%+)

- ✅ Key generation for all supported algorithms
- ✅ Key encryption and decryption
- ✅ Signature generation and verification
- ✅ Key validation and error handling
- ✅ Algorithm information retrieval
- ✅ Performance testing

### Signing API (85%+)

- ✅ Key management endpoints
- ✅ Contract signing endpoints
- ✅ Signature verification endpoints
- ✅ Authentication and authorization
- ✅ Error handling and validation
- ✅ Database interactions

### SCITT CCF Integration (80%+)

- ✅ Claim submission to SCITT CCF
- ✅ Signature verification via SCITT CCF
- ✅ Provenance tracking
- ✅ Multiple signature handling
- ✅ Audit trail creation
- ✅ Performance and scalability

## 🐛 Debugging Tests

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database status
   npm run status
   
   # Reset test database
   npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***
   ```

2. **SCITT CCF Service Errors**
   ```bash
   # Check SCITT CCF service
   curl http://localhost:8000/app/health
   ```

3. **Test Data Issues**
   ```bash
   # Clean test data manually
   node -e "require('./tests/setup/signing-test-data.js').cleanup()"
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm run test:signing

# Run specific test with verbose output
npx jest tests/unit/keyManagementService.test.js --verbose
```

## 📈 Performance Testing

The test suite includes performance tests that verify:

- **Key Generation**: < 5 seconds
- **Signature Generation**: < 1 second
- **Signature Verification**: < 1 second
- **Contract Signing**: < 10 seconds
- **Concurrent Operations**: Multiple simultaneous operations

## 🔒 Security Testing

Security tests cover:

- **Key Security**: Proper encryption and storage
- **Signature Security**: Cryptographic verification
- **Access Control**: Authorization checks
- **Data Integrity**: Tamper detection
- **Audit Trail**: Complete logging

## 📝 Test Reports

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JUnit Report**: `coverage/junit.xml`

### Test Results

Test results include:

- **Pass/Fail Status**: Individual test results
- **Performance Metrics**: Execution times
- **Coverage Metrics**: Code coverage percentages
- **Error Details**: Detailed error information

## 🚀 Continuous Integration

### GitHub Actions

The test suite is designed to run in CI/CD pipelines:

```yaml
- name: Run Contract Signing Tests
  run: |
    npm install
    npm run test:signing:coverage
```

### Docker Support

Tests can be run in Docker containers:

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "test:signing"]
```

## 📚 Best Practices

### Writing Tests

1. **Test Isolation**: Each test should be independent
2. **Clear Naming**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Dependencies**: Use mocks for external services
5. **Test Edge Cases**: Include error conditions and edge cases

### Test Data Management

1. **Clean Setup**: Create fresh test data for each test
2. **Clean Teardown**: Remove test data after each test
3. **Realistic Data**: Use realistic test data
4. **Data Relationships**: Maintain proper data relationships

### Performance Considerations

1. **Parallel Execution**: Run tests in parallel when possible
2. **Resource Cleanup**: Clean up resources after tests
3. **Timeout Management**: Set appropriate timeouts
4. **Memory Management**: Avoid memory leaks in tests

## 🤝 Contributing

### Adding New Tests

1. **Unit Tests**: Add to `unit/` directory
2. **Integration Tests**: Add to `integration/` directory
3. **Test Data**: Update `setup/signing-test-data.js`
4. **Documentation**: Update this README

### Test Standards

- **Coverage**: Maintain minimum coverage thresholds
- **Performance**: Meet performance requirements
- **Documentation**: Document test purpose and approach
- **Maintenance**: Keep tests up to date with code changes

## 📞 Support

For questions or issues with the test suite:

1. **Check Logs**: Review test output and error messages
2. **Verify Setup**: Ensure all prerequisites are met
3. **Check Configuration**: Verify Jest and environment configuration
4. **Review Documentation**: Check this README and code comments

---

**Last Updated**: 2024-01-XX  
**Version**: 1.0.0  
**Maintainer**: Development Team