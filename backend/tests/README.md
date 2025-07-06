# Contract Management System - Test Suite Documentation

## Overview

This comprehensive test suite validates all aspects of the Contract Management System backend, including models, API endpoints, services, security, integration workflows, and performance characteristics.

## Test Suite Structure

### 📁 Test Files

| Test File | Purpose | Coverage |
|-----------|---------|----------|
| `models.test.js` | Database model validation and relationships | Models, validation, constraints |
| `api.test.js` | API endpoint functionality and responses | Routes, controllers, middleware |
| `integration.test.js` | End-to-end workflow testing | Complete user journeys |
| `security.test.js` | Security validation and vulnerability testing | Auth, authorization, input validation |
| `services.test.js` | Service layer functionality | Business logic, external integrations |
| `performance.test.js` | Performance and load testing | Scalability, response times |

### 📁 Supporting Files

| File | Purpose |
|------|---------|
| `setup.js` | Test environment setup and teardown |
| `env-setup.js` | Environment variable configuration |
| `run-all-tests.js` | Comprehensive test runner with reporting |
| `jest.config.js` | Jest configuration |

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Setup test database
npm run setup-db

# Ensure test environment is configured
cp config.env.example config.env
```

### Running Tests

```bash
# Run all tests with comprehensive reporting
npm run test:all

# Run specific test suites
npm run test:models      # Database models only
npm run test:api         # API endpoints only
npm run test:integration # Integration workflows only
npm run test:security    # Security tests only
npm run test:services    # Service layer only
npm run test:performance # Performance tests only

# Run with coverage
npm run test:coverage

# Run in watch mode for development
npm run test:watch

# Run individual test files
npm test -- tests/models.test.js
npm test -- tests/api.test.js
```

## Test Categories

### 1. Model Tests (`models.test.js`)

Validates database models, relationships, and constraints.

**Coverage:**
- ✅ User model validation and constraints
- ✅ Contract model relationships and status validation
- ✅ Dataset model ownership and metadata
- ✅ Notification model types and user associations
- ✅ Foreign key relationships and cascading
- ✅ Database transactions and rollback scenarios

**Example:**
```javascript
it('should create a user with valid data', async () => {
  const userData = {
    email: 'test@example.com',
    name: 'Test User',
    partyType: 'TDP',
    password: 'hashedPassword'
  };
  
  const user = await User.create(userData);
  expect(user.email).toBe(userData.email);
  expect(user.partyType).toBe(userData.partyType);
});
```

### 2. API Tests (`api.test.js`)

Tests all API endpoints, request/response handling, and error scenarios.

**Coverage:**
- ✅ Authentication endpoints (register, login, verify)
- ✅ User management CRUD operations
- ✅ Contract lifecycle management
- ✅ Dataset creation and management
- ✅ DID resolution and verification
- ✅ Error handling and validation
- ✅ Rate limiting and security headers

**Example:**
```javascript
it('should register a new user successfully', async () => {
  const userData = {
    email: 'register@example.com',
    name: 'Register User',
    partyType: 'TDC',
    password: 'Password123'
  };

  const response = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.user.email).toBe(userData.email);
});
```

### 3. Integration Tests (`integration.test.js`)

Tests complete workflows from user registration to contract completion.

**Coverage:**
- ✅ Complete contract lifecycle (creation → signing → completion)
- ✅ Multi-party contract workflows
- ✅ User role interactions and permissions
- ✅ Data consistency across operations
- ✅ Concurrent operation handling
- ✅ Error recovery scenarios

**Example:**
```javascript
it('should complete full contract workflow', async () => {
  // 1. Register all parties
  const tdpUser = await registerUser('TDP');
  const ccrpUser = await registerUser('CCRP');
  
  // 2. Create dataset and contract
  const dataset = await createDataset(tdpUser);
  const contract = await createContract(tdpUser, ccrpUser, dataset);
  
  // 3. Execute signing workflow
  await signContract(contract, tdpUser);
  await signContract(contract, ccrpUser);
  
  // 4. Verify final state
  expect(contract.status).toBe('ACTIVE');
});
```

### 4. Security Tests (`security.test.js`)

Validates security measures and vulnerability prevention.

**Coverage:**
- ✅ Password security and hashing
- ✅ JWT token validation and expiration
- ✅ SQL injection prevention
- ✅ XSS attack prevention
- ✅ Authorization and access control
- ✅ Input validation and sanitization
- ✅ Rate limiting enforcement
- ✅ Security headers validation

**Example:**
```javascript
it('should prevent SQL injection attacks', async () => {
  const maliciousEmail = "'; DROP TABLE users; --";
  
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: maliciousEmail,
      name: 'SQL Injection Test',
      partyType: 'TDC',
      password: 'Password123'
    })
    .expect(400);

  expect(response.body.error).toBeDefined();
});
```

### 5. Service Tests (`services.test.js`)

Tests service layer functionality and external integrations.

**Coverage:**
- ✅ Blockchain service operations
- ✅ DID resolution and verification
- ✅ Keycloak user management
- ✅ Notification service operations
- ✅ Service integration scenarios
- ✅ Error handling and recovery

**Example:**
```javascript
it('should deploy contract to blockchain', async () => {
  blockchainService.deployContract = jest.fn().mockResolvedValue({
    success: true,
    contractAddress: '0x1234567890...'
  });

  const result = await blockchainService.deployContract(testContract);
  expect(result.success).toBe(true);
  expect(result.contractAddress).toBeDefined();
});
```

### 6. Performance Tests (`performance.test.js`)

Validates system performance under various load conditions.

**Coverage:**
- ✅ Database query performance
- ✅ API response time benchmarks
- ✅ Concurrent user handling
- ✅ Memory usage monitoring
- ✅ Stress testing scenarios
- ✅ Scalability validation

**Example:**
```javascript
it('should handle concurrent user registrations', async () => {
  const concurrentUsers = 10;
  const startTime = Date.now();
  
  const promises = Array(concurrentUsers).fill().map(() =>
    request(app).post('/api/auth/register').send(userData)
  );

  const responses = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  expect(responses.every(r => r.status === 201)).toBe(true);
  expect(totalTime).toBeLessThan(5000); // 5 seconds
});
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### Environment Setup (`env-setup.js`)

```javascript
// Configure test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'contract_management_test';
process.env.JWT_SECRET = 'test-secret';
process.env.BLOCKCHAIN_ENABLED = 'false';
```

## Test Data Management

### Test Database Setup

```bash
# Create test database
createdb contract_management_test

# Run migrations
npm run setup-db

# Seed test data (optional)
npm run seed-data
```

### Test Data Patterns

```javascript
// User test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  partyType: 'TDP',
  password: 'Password123'
};

// Contract test data
const testContract = {
  contractId: 'TEST-CONTRACT-001',
  price: 100.00,
  duration: 30,
  termsAndConditions: 'Test terms',
  modelId: 'TEST-MODEL-001'
};
```

## Best Practices

### 1. Test Organization

- **Arrange**: Set up test data and conditions
- **Act**: Execute the operation being tested
- **Assert**: Verify the expected outcomes

```javascript
it('should create a contract', async () => {
  // Arrange
  const user = await User.create(testUser);
  const dataset = await Dataset.create(testDataset);
  
  // Act
  const contract = await Contract.create({
    ...testContract,
    tdpId: user.id,
    datasetId: dataset.id
  });
  
  // Assert
  expect(contract.contractId).toBe(testContract.contractId);
  expect(contract.status).toBe('PENDING_TDP_APPROVAL');
});
```

### 2. Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Clean up test data after tests

```javascript
beforeEach(async () => {
  await User.destroy({ where: {} });
  await Contract.destroy({ where: {} });
  await Dataset.destroy({ where: {} });
});
```

### 3. Meaningful Assertions

- Test specific behaviors, not implementation details
- Use descriptive test names
- Include edge cases and error scenarios

```javascript
it('should reject invalid email format', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ ...userData, email: 'invalid-email' })
    .expect(400);

  expect(response.body.error).toContain('email');
});
```

### 4. Performance Considerations

- Mock external services in unit tests
- Use test databases for integration tests
- Set appropriate timeouts for async operations

```javascript
// Mock external service
jest.mock('../services/blockchainService');
blockchainService.deployContract = jest.fn().mockResolvedValue({
  success: true,
  contractAddress: '0x123...'
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      ***REMOVED-DB_PASSWORD***:
        image: ***REMOVED-DB_PASSWORD***:14
        env:
          POSTGRES_DB: contract_management_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Ensure PostgreSQL is running
   brew services start ***REMOVED-DB_PASSWORD***ql
   
   # Create test database
   createdb contract_management_test
   ```

2. **Jest Configuration Issues**
   ```bash
   # Clear Jest cache
   npx jest --clearCache
   
   # Run with verbose output
   npm test -- --verbose
   ```

3. **Test Timeout Issues**
   ```bash
   # Increase timeout for specific tests
   jest.setTimeout(60000);
   
   # Or run with longer timeout
   npm test -- --testTimeout=60000
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test with debugging
npm test -- --testNamePattern="should create user" --verbose
```

## Coverage Reports

After running tests with coverage, view the HTML report:

```bash
# Open coverage report
open coverage/lcov-report/index.html
```

The coverage report shows:
- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches taken
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

## Contributing

When adding new tests:

1. **Follow naming conventions**: `describe('Feature', () => {})`
2. **Use descriptive test names**: `it('should handle edge case', () => {})`
3. **Maintain test isolation**: Each test should be independent
4. **Add appropriate assertions**: Test both success and failure cases
5. **Update documentation**: Document new test patterns and requirements

## Summary

This comprehensive test suite ensures:

- ✅ **Reliability**: All core functionality is validated
- ✅ **Security**: Vulnerabilities are prevented and detected
- ✅ **Performance**: System meets performance requirements
- ✅ **Maintainability**: Code changes are safely validated
- ✅ **Documentation**: Tests serve as living documentation

Run `npm run test:all` to execute the complete test suite and generate comprehensive reports. 