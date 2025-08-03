# Multi-Cloud Secret Management Test Suite

## Overview

The test suite has been comprehensively updated to include testing for the new multi-cloud secret management system. This includes unit tests, integration tests, end-to-end tests, and frontend component tests.

## Test Structure

### 1. Backend Unit Tests

#### Secret Manager Tests (`backend/tests/secretManager.test.js`)
- **Purpose**: Test the SecretManager service functionality
- **Coverage**: 
  - Constructor and initialization
  - Store credentials in different secret managers
  - Retrieve credentials from different secret managers
  - Validate credentials
  - Delete credentials
  - Error handling
  - Provider creation methods

#### Cloud Provider Tests (`backend/tests/cloudProviders.test.js`)
- **Purpose**: Test Azure, AWS, GCP, and OCI provider services
- **Coverage**:
  - Credential validation for each provider
  - Region listing for each provider
  - Instance type listing for each provider
  - Cost estimation for each provider
  - Training environment creation for each provider
  - Error handling for each provider

### 2. Backend Integration Tests

#### Cloud Credentials API Tests (`backend/tests/integration/cloudCredentials.test.js`)
- **Purpose**: Test API endpoints for cloud credentials management
- **Coverage**:
  - GET /api/ccrp/cloud-credentials (list credentials)
  - POST /api/ccrp/cloud-credentials (create credential)
  - PUT /api/ccrp/cloud-credentials/:id (update credential)
  - DELETE /api/ccrp/cloud-credentials/:id (delete credential)
  - POST /api/ccrp/cloud-credentials/:id/validate (validate credential)
  - Authentication and authorization
  - Error handling
  - Database integration

#### Secret Manager API Tests
- **Coverage**:
  - GET /api/secret-manager/available (list available secret managers)
  - POST /api/secret-manager/store (store secret)
  - GET /api/secret-manager/retrieve (retrieve secret)
  - DELETE /api/secret-manager/delete (delete secret)

#### Cloud Provider API Tests
- **Coverage**:
  - GET /api/cloud-providers/:provider/regions (list regions)
  - GET /api/cloud-providers/:provider/instance-types (list instance types)
  - POST /api/cloud-providers/:provider/validate (validate credentials)
  - POST /api/cloud-providers/:provider/estimate-costs (estimate costs)

### 3. End-to-End Tests

#### Cloud Credentials Workflow Tests (`backend/tests/e2e/cloudCredentialsWorkflow.test.js`)
- **Purpose**: Test complete workflows for cloud credentials management
- **Coverage**:
  - Complete Azure credentials workflow
  - Complete AWS credentials workflow
  - Complete GCP credentials workflow
  - Multi-cloud credentials management
  - Error handling and edge cases
  - Performance and load testing

### 4. Frontend Tests

#### CCRP Cloud Credentials Component Tests (`frontend/tests/CCRPCloudCredentials.test.js`)
- **Purpose**: Test the React component for cloud credentials management
- **Coverage**:
  - Component rendering
  - Credential card display
  - Add credential dialog
  - Edit credential dialog
  - Credential actions (validate, delete)
  - Form submission
  - Error handling
  - Access control
  - Responsive design

## Test Categories

### Unit Tests
```bash
# Secret Manager tests
npm run test:secret-manager

# Cloud Provider tests
npm run test:cloud-providers

# Database model tests
npm run test:models
```

### Integration Tests
```bash
# Cloud credentials API tests
npm run test:cloud-credentials

# Complete integration test
npm run test:integration
```

### End-to-End Tests
```bash
# E2E workflow tests
npm run test:e2e-workflow

# Multi-cloud integration test
npm run test:multi-cloud
```

### Frontend Tests
```bash
# Frontend component tests
cd frontend && npm test -- CCRPCloudCredentials.test.js
```

### Complete Test Suite
```bash
# Run all tests
npm run test:suite

# Run with coverage
npm run test:coverage
```

## Test Data

### Mock Credentials
```javascript
// Azure credentials
const azureCredentials = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  subscriptionId: 'test-subscription-id',
  tenantId: 'test-tenant-id'
};

// AWS credentials
const awsCredentials = {
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  region: 'us-east-1'
};

// GCP credentials
const gcpCredentials = {
  projectId: 'test-project-id',
  serviceAccountKey: 'test-service-account-key'
};

// OCI credentials
const ociCredentials = {
  compartmentId: 'test-compartment-id',
  userId: 'test-user-id',
  fingerprint: 'test-fingerprint',
  privateKey: 'test-private-key'
};
```

### Mock Secret Managers
```javascript
// Vault mock
const mockVaultProvider = {
  write: jest.fn().mockResolvedValue({}),
  read: jest.fn().mockResolvedValue({
    data: { data: mockCredentials }
  }),
  delete: jest.fn().mockResolvedValue({})
};

// AWS Secrets Manager mock
const mockAWSProvider = {
  putSecretValue: jest.fn().mockResolvedValue({}),
  getSecretValue: jest.fn().mockResolvedValue({
    SecretString: JSON.stringify(mockCredentials)
  }),
  deleteSecret: jest.fn().mockResolvedValue({})
};
```

## Test Scenarios

### 1. Credential Lifecycle Testing
```javascript
// Test complete credential lifecycle
describe('Credential Lifecycle', () => {
  test('should create, validate, update, and delete credential', async () => {
    // 1. Create credential
    const credential = await createCredential(azureCredentialData);
    
    // 2. Validate credential
    const validation = await validateCredential(credential.id);
    
    // 3. Update credential
    const updated = await updateCredential(credential.id, updateData);
    
    // 4. Delete credential
    await deleteCredential(credential.id);
  });
});
```

### 2. Multi-Cloud Testing
```javascript
// Test multiple cloud providers
describe('Multi-Cloud Support', () => {
  test('should manage credentials for all cloud providers', async () => {
    const providers = ['AZURE', 'AWS', 'GCP', 'OCI'];
    
    for (const provider of providers) {
      const credential = await createCredential({
        cloudProvider: provider,
        // ... provider-specific data
      });
      
      await validateCredential(credential.id);
      await testProviderOperations(provider);
    }
  });
});
```

### 3. Error Handling Testing
```javascript
// Test error scenarios
describe('Error Handling', () => {
  test('should handle invalid credentials', async () => {
    const invalidCredentials = {
      clientId: 'invalid',
      clientSecret: 'invalid'
    };
    
    const result = await validateCredentials(invalidCredentials);
    expect(result.valid).toBe(false);
  });
  
  test('should handle secret manager errors', async () => {
    // Mock secret manager to throw error
    mockSecretManager.storeCredentials.mockRejectedValue(
      new Error('Storage failed')
    );
    
    await expect(createCredential(data))
      .rejects.toThrow('Storage failed');
  });
});
```

### 4. Security Testing
```javascript
// Test security features
describe('Security Features', () => {
  test('should not store sensitive data in database', async () => {
    const credential = await createCredential(credentialData);
    
    // Check database record
    const dbRecord = await getCredentialFromDB(credential.id);
    expect(dbRecord).not.toHaveProperty('clientSecret');
    expect(dbRecord).not.toHaveProperty('accessKeyId');
  });
  
  test('should enforce role-based access', async () => {
    const tdpToken = generateToken({ partyType: 'TDP' });
    
    const response = await request(app)
      .get('/api/ccrp/cloud-credentials')
      .set('Authorization', `Bearer ${tdpToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Environment Setup
```javascript
// tests/setup.js
const { Sequelize } = require('sequelize');

// Setup test database
const sequelize = new Sequelize({
  dialect: '***REMOVED-DB_PASSWORD***',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'contract_management_test',
  logging: false
});

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
```

## Test Results

### Coverage Report
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Test Reports
```bash
# Generate JUnit XML report
npm run test:report

# Generate HTML report
npm run test:html
```

## Continuous Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      ***REMOVED-DB_PASSWORD***:
        image: ***REMOVED-DB_PASSWORD***:14
        env:
          POSTGRES_PASSWORD: password
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
      - run: npm run test:suite
```

## Performance Testing

### Load Testing
```javascript
// tests/performance/load.test.js
describe('Load Testing', () => {
  test('should handle multiple concurrent credential operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) => 
      createCredential({
        cloudProvider: 'AZURE',
        secretName: `load-test-${i}`,
        // ... other data
      })
    );
    
    const results = await Promise.all(operations);
    expect(results.length).toBe(10);
    expect(results.every(r => r.status === 201)).toBe(true);
  });
});
```

## Troubleshooting

### Common Test Issues

#### 1. Database Connection Issues
```bash
# Check database connection
psql -d contract_management_test -c "SELECT 1;"

# Reset test database
npm run setup-db
```

#### 2. Vault Connection Issues
```bash
# Check Vault status
./vault status

# Start Vault development server
./setup-vault-dev.sh
```

#### 3. Test Timeout Issues
```javascript
// Increase timeout for slow tests
jest.setTimeout(30000);

// Or for specific test
test('slow test', async () => {
  // ... test code
}, 30000);
```

### Debug Commands
```bash
# Run specific test with verbose output
npm test -- --verbose secretManager.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration
```

## Test Maintenance

### Adding New Tests
1. **Unit Tests**: Add to appropriate test file in `tests/` directory
2. **Integration Tests**: Add to `tests/integration/` directory
3. **E2E Tests**: Add to `tests/e2e/` directory
4. **Frontend Tests**: Add to `frontend/tests/` directory

### Updating Test Data
1. Update mock data in test files
2. Update test database schema if needed
3. Update test environment configuration

### Test Documentation
1. Document new test scenarios
2. Update test coverage requirements
3. Update CI/CD pipeline configuration

## Conclusion

The comprehensive test suite ensures that the multi-cloud secret management system is thoroughly tested across all layers:

- **Unit Tests**: Individual component functionality
- **Integration Tests**: API and service interactions
- **End-to-End Tests**: Complete user workflows
- **Frontend Tests**: User interface functionality
- **Performance Tests**: System performance under load
- **Security Tests**: Security and access control

This testing approach provides confidence in the system's reliability, security, and performance while maintaining high code coverage and quality standards. 